---
title: "【残薬アプリ開発日記：#4】今、このアプリがどう作られているかを棚卸しする"
emoji: "💊"
type: "tech"
topics: ["個人開発", "supabase", "hono", "security", "typescript"]
published: false
---

OCR機能（薬の写真を撮ったら情報が入力される）を作ろうと思い立ちました。

でも手を動かす前に、一度立ち止まることにしました。「今の設計、自分は本当に説明できるか？」と聞かれたら、たぶん半分くらいしか即答できません。増築を続けてきた家に、いきなり2階を足すようなものです。まずは今の1階の骨組みがどうなっているか、自分の言葉で棚卸しします。

この記事は公開前提というより、自分の頭を整理するための記事です。読んでくれる人がいたら、「訪問看護師が独学でバックエンドをここまで作った記録」として見てもらえたら嬉しいです。

---

## 0. このアプリは何者か

「のこり」は、訪問看護師が利用者宅で残薬（飲み残しの薬）を数えて記録するためのアプリです。

構成は2つのリポジトリに分かれています。

```
zannyaku-app（フロントエンド）  … React + Vite。看護師が触る画面そのもの
zannyaku-api（バックエンド）    … Hono + Supabase。データを預かる金庫番
```

フロントは`vite.config.js`の`proxy`設定で`/api`宛のリクエストをバックエンドに転送しています。ローカル開発では両方を同時に起動する構成です。

フロント側は意外なほどシンプルで、依存パッケージが`react`と`react-dom`しかありません。ReduxもReact Routerも入っていない。画面遷移や状態管理を全部自前でやっている、ということです（これはこれで「本当にこの規模ならライブラリいらないよね」という判断が効いている気がします）。

バックエンドは今回の主役なので、ここから中身に入ります。

---

## 1. リクエストが1本、どう流れるか

利用者一覧を見るとき、裏側ではこう動きます。

```
① フロント → GET /api/patients（Cookieに access_token が乗っている）
② authMiddleware が access_token を検証
   → 中身（userId・orgId・role・staffName）を取り出す
③ ルートハンドラーが「自分のorgIdの利用者だけ」をSupabaseに問い合わせ
④ Supabaseにも RLS（Row Level Security）がかかっていて、
   万一②③が壊れていても他事業所のデータは返ってこない
```

コードにするとこれだけです（`src/routes/patients.ts`）。

```typescript
patients.get('/', async (c) => {
  const { orgId } = c.get('jwtPayload')
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('org_id', orgId)      // ← ここが命綱
    .eq('is_hidden', false)
    .order('registered_at', { ascending: false })
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})
```

`patients`だけでなく`medications`（定期薬）・`prn_medications`（頓用薬）・`visits`（受診記録）・`org`（事業所情報）、全部のルートで`.eq('org_id', orgId)`が必ず入っています。このアプリの一番大事な約束事は、たぶんこの一行です。

**なぜ二重にチェックするのか。** バックエンドのコードが「orgIdで絞っているから安全」と思っていても、それは実装にバグがない前提の話です。実際、#2の記事で書いた通り、自分で監査したら権限昇格の穴が見つかりました。だから「バックエンドで絞る」を主防衛線、「DB（RLS）でも絞る」を保険として二段構えにしています。1つ壊れても、もう1つが残る設計です。

---

## 2. ログインで何が起きているか（一番複雑な場所）

ログインまわりが、このアプリで一番設計を練り直した場所です。理由は「共用アカウント」という運用があるからです。

訪問看護の現場では、1つのメール・パスワードを複数のスタッフで使い回す事業所があります。つまり`user_id`は1つでも、「今ログインしているのは誰か（＝`staff`テーブルのどの行か）」を、ログインのたびに選んでもらう必要があります。

```
POST /api/auth/login { email, password, staffName }

① email/passwordをSupabaseの認証関数で検証 → user_idが返る
② user_idに紐づくstaffレコードを「全件」取得
③ staffNameが指定されていれば、名前が一致する行のroleを採用
   指定がなければ：staffが1件だけ（個人アカウント）ならそれを採用
                   複数あれば「選んでください」と400で拒否
④ access_token（15分）とrefresh_token（24時間）を発行してCookieにセット
```

この③が、実は9月に見つけて直したばかりの場所です。

以前は`.limit(1)`で「とりあえず1件」staffを取ってきて、そのroleをそのまま使っていました。つまり、選んだスタッフ名と、実際に付与されるroleが**無関係**になり得ました。一般スタッフのつもりで自分の名前を選んでも、DBがたまたま先に返した行がadminのものなら、admin権限のトークンが発行される——という状態です。

看護記録に例えると、「A看護師としてログインしたのに、たまたまカルテの先頭に出てきたB看護師（管理者）の権限証がついてくる」ようなものです。名乗った人と、渡される権限証がズレる。これはさすがに危ないので、staffを全件取ってきて「名前が一致する行」を明示的に選ぶロジックに書き換えました。

もう一つ、`refresh`（access_tokenの再発行）にも同じ考え方を入れています。

```typescript
// src/routes/auth.ts（refresh）
const { data: staff } = await supabase
  .from('staff')
  .select('role')
  .eq('user_id', payload.userId)
  .eq('org_id', payload.orgId)
  .eq('name', payload.staffName)
  .single()
```

refresh_tokenは24時間有効です。もしその間に管理者が誰かの権限を剥奪しても、トークンの中の古いroleをそのまま信用してしまうと、剥奪が効かないまま権限が生き続けます。なので「refreshのたびにDBから最新のroleを引き直す」ようにしています。トークンは「15分前に確認した内容のコピー」であって、常に最新の正解ではない——という前提に立った設計です。

---

## 3. 個人情報を、そもそも持たない工夫

`patients`テーブルに利用者の本名は入っていません。フロントから送るのは`nickname`だけです。

```typescript
patients.post('/', async (c) => {
  const { orgId } = c.get('jwtPayload')
  const { nickname } = await c.req.json()
  const { data, error } = await supabase
    .from('patients')
    .insert({ nickname, org_id: orgId })
    ...
```

これは「漏れても被害を抑える」設計というより、「そもそも本名を扱う理由がない」という考え方です。残薬管理に必要なのは「誰の薬が何錠残っているか」の対応関係であって、フルネームである必要がありません。事業所の中でスタッフ同士が分かればいい呼び名（ニックネーム）で運用できるなら、それに越したことはない。

このアプリを触っていて一番好きな設計判断は、実はここです。「セキュリティを頑張って守る」のではなく「守るべきものを最初から持たない」という発想は、次のOCR機能の設計にもそのまま引き継ぐつもりです（薬の写真も、必要な情報を抜き取ったらすぐ捨てる方向で考えています）。

---

## 4. 書き込み系のAPIで気をつけていること

薬や受診記録を追加するAPI（POST）では、リクエストボディをそのまま使わず、こう書いています。

```typescript
// src/routes/medications.ts
.insert({ ...med, patient_id: c.req.param('patientId'), org_id: orgId, updated_at: todayISO() })
```

一見普通に見えますが、ポイントは**順序**です。`...med`（フロントから来た値）を先に展開して、`patient_id`・`org_id`・`updated_at`を**後から**上書きしています。JavaScriptのオブジェクトスプレッドは後に書いた値が勝つので、この順序を逆にすると、リクエストボディに`org_id`を混ぜ込むだけで他事業所の領域にデータを書き込めてしまいます。実際これは今回の監査で見つかった穴の1つで、修正済みです。

`visits`のPATCH（更新）はさらに一歩進めて、更新できる項目をホワイトリスト化しています。

```typescript
const VISIT_UPDATABLE_FIELDS = ['date', 'clinic', 'doctor', 'note', 'color_label'] as const

visits.patch('/visits/:id', async (c) => {
  const body = await c.req.json()
  const fields: Record<string, unknown> = {}
  for (const key of VISIT_UPDATABLE_FIELDS) {
    if (key in body) fields[key] = body[key]
  }
  ...
```

送られてきたものを何でも受け取るのではなく、「更新していい項目」を先に決めておいて、それ以外は黙って無視する。これも「危ないものを弾く」より「安全なものだけ通す」発想で、後から見返しても意図が読みやすいコードになった気がします。

---

## 5. 消す操作と、記録に残す操作

薬・頓用薬・受診記録の削除（DELETE）は、管理者だけに絞っています。

```typescript
medications.delete('/meds/:id', requireAdmin, async (c) => {
  const { orgId, staffName } = c.get('jwtPayload')
  const id = c.req.param('id')
  const { error } = await supabase.from('medications').delete().eq('id', id).eq('org_id', orgId)
  if (error) return c.json({ error: error.message }, 500)
  await logAudit({ action: 'medication_delete', staffName, targetType: 'medications', targetId: id })
  return c.json({ ok: true })
})
```

`requireAdmin`というミドルウェアが、role が `admin` かどうかをここで一段チェックします。さらに削除が成功したら`logAudit`で「誰が・いつ・何を消したか」を`audit_logs`テーブルに記録します。

削除は取り返しがつかない操作なので、「誰でもできる」を許さず「やった証拠を残す」の二段構えにしています。ここも共用アカウント運用と相性が悪い場所で、`staffName`をトークンから正しく取り出せていないと監査ログの記録者名がズレる——という理由で、②のログイン修正と地続きの話でもあります。

---

## 6. まとめ：今の骨組みはこうなっている

```
フロント（zannyaku-app・React+Vite）
   ↓ Cookie（access_token）付きでAPIを叩く
バックエンド（zannyaku-api・Hono）
   ├─ authMiddleware：トークンを検証してuserId/orgId/role/staffNameを取り出す
   ├─ 各ルート：必ず org_id で絞り込んでSupabaseに問い合わせる（主防衛線）
   ├─ requireAdmin：削除など危険な操作はrole=adminだけに限定
   └─ logAudit：消す・変えるなど重要操作の記録を残す
Supabase（PostgreSQL）
   └─ RLS：バックエンドが万一間違えても、事業所をまたいだアクセスは通さない（保険）
```

改めて言葉にしてみると、設計の軸は3つでした。

1. **多重に絞る**（バックエンド＋RLSの二段防御）
2. **そもそも持たない**（利用者の本名を扱わない）
3. **証拠を残す**（危険な操作は管理者限定＋監査ログ）

正直、最初からここまで考えて作ったわけではありません。#2・#3で書いたように、穴が見つかっては直し、を繰り返してここまで来ました。でも「行き当たりばったりで直してきた」のと「直しながら一貫した軸ができてきた」のは違う、と今回棚卸しをしてみて思いました。

次にやりたいのは、薬の写真を撮ったらOCRで情報を読み取って入力を楽にする機能です。ただし「そもそも持たない」の軸を崩したくないので、写真も読み取り結果もこちら側には一切残さず、電子カルテへの転記用に画面に出すだけ、という設計で考えています（このアプリは電子カルテそのものではなく、あくまで転記前のメモ帳という立ち位置です）。次回はその設計について書く予定です。

---

*訪問看護師として週3で働きながら、夜中にコードを書いています。*
*技術的な正確さより「なんとなくわかった」を大切に書いています。*
