---
title: "【残薬アプリ開発日記：#1】「それ、バックエンド作った方がいい」と言われた日——504エラーとの3週間"
emoji: "💊"
type: "tech"
topics: ["個人開発", "hono", "vercel", "supabase", "初心者"]
published: false
---

平凡な訪問看護師が、残薬管理アプリ「のこり」を作っている開発日記です。
コードが読めない人にも、なんとなく伝わるように書きます。

---

## 0. 最初の設計は「フロントエンドがDBに直接つながる」だった

アプリを作り始めたとき、私の構成はこうでした。

```
ブラウザ（画面）
　↓ 直接
Supabase（データベース）
```

Supabase はいわゆる「BaaS（Backend as a Service）」というやつで、データベースの管理だけでなく、ユーザー認証や API の機能も持っています。公式ドキュメントを読むと「フロントから直接つなげる」と書いてある。実際につないで動いた。

**「これで完成でいいじゃないか」**

そう思っていた。

---

## 1. SEの友人に「それはまずい」と言われた日

医療系の SE をしている友人に設計を見せたとき、こう言われました。

> 「フロントからDBに直接つなぐのは、現場のスタッフに鍵束ごと渡すのと一緒やで。」

意味がわからなかったので、もう少し聞いてみました。

フロントエンド（ブラウザで動くアプリ）は、**誰でも中身を見ることができます**。開発者ツールを開けば、APIキーも接続情報も丸見えになる。病院のシステムで患者データを扱う場合、それは致命的なリスクです。

「バックエンド（サーバー側のプログラム）をはさむことで、機密情報をサーバーの中に閉じ込められる」

こういうことです。

```
【変更前】
ブラウザ ──── 直接 ────▶ Supabase（鍵が丸見え）

【変更後】
ブラウザ ──▶ バックエンドAPI ──▶ Supabase
              （鍵はここに隠す）
```

たしかに。残薬情報は患者さんの薬の管理データです。誰でもアクセスできる状態にしてはいけない。

友人の言葉で、設計を全部やり直すことにしました。

---

## 2. バックエンドを作るとはどういうことか

「バックエンドを作る」というのは、ざっくり言うと **「ブラウザとデータベースの間に立つ受付係を雇う」** ようなものです。

```
利用者（ブラウザ）
　↓「ログインしたい」
受付係（バックエンドAPI）← ここを作る
　↓「本人確認してDBに聞きます」
Supabase（データベース）
```

受付係は、パスワードなどの機密情報を持っていて、ブラウザには「OK か NG か」だけを返します。鍵はバックエンドの中にだけあります。

今回選んだ技術スタック：

| 技術 | 役割 | 理由 |
|---|---|---|
| **Hono** | バックエンドのフレームワーク | 軽くて速い。TypeScript フレンドリー |
| **Vercel** | バックエンドのホスティング | フロントと同じ場所で管理できる |
| **Supabase** | DB + 認証 | そのまま継続利用 |

---

## 3. 本番環境とローカル開発環境を分ける

バックエンドを作るにあたって、もうひとつ重要な概念を理解しました。

**「本番環境」と「ローカル環境」は別物として管理する**ということです。

| 環境 | 場所 | 用途 |
|---|---|---|
| **ローカル環境** | 自分のパソコンの中 | 開発・テスト用 |
| **本番環境** | Vercel のサーバー | 実際に使う用 |

開発中は「動くかどうか確かめながら作業」するので、本番のデータベースをいじるわけにはいきません。間違えて患者データを消したら大変です。

そこで、開発中はローカルで動くサーバーを使い、確認が取れたら本番に反映する流れにしました。

```bash
# ローカル開発用（ポート3000で起動）
npm run dev

# 本番デプロイ（Vercel に自動で反映）
git push origin main
```

フロントエンド（画面）も同様に、ローカルでは `localhost:3000` のバックエンドに向け、本番では `zannyaku-api.vercel.app` に向けるよう設定。

```js
// フロントのvite設定（開発時のみ有効）
server: {
  proxy: {
    '/api': 'http://localhost:3000',
  },
},
```

本番では Vercel の「rewrites」という機能で `/api/*` のリクエストをバックエンドに転送します。

---

## 4. デプロイしたら、ログインだけ動かなかった

バックエンドを作り、両方を Vercel にデプロイしました。
ヘルスチェック（「生きてる？」と確認するだけのエンドポイント）は返ってくる。

でも。

```
POST /api/auth/login → 504 Gateway Timeout
```

**ログインだけ、タイムアウト**。

ローカルでは一瞬で動く。本番でだけ死ぬ。

ここから、約3週間の格闘が始まりました。

---

## 5. 試した修正が全部ダメだった記録

### 試み① アダプターを変えた

HonoにはVercel用のアダプターが2種類あります。

```
hono/vercel（A）
@hono/node-server/vercel（B）
```

A → B に変えてみた。**ダメだった。**

### 試み② BodyParser を切った

Vercel には「リクエストのbodyを事前に解析する」機能があります。それをオフにしてみた。

```typescript
api: { bodyParser: false }
```

**ダメだった。**

### 試み③ Supabase の SDK を使わず、直接 fetch した

Supabase の SDK（公式ライブラリ）をバイパスして、認証エンドポイントに直接リクエストを投げてみた。

```typescript
const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token`, { ... })
```

**ダメだった。**

### 試み④ リージョンを日本（東京）に変えた

Vercel には「どこのサーバーで動かすか」を指定できます。デフォルトはバージニア（iad1）。東京（nrt1）に変えようとした。

**無料プランでは使えなかった。**

---

## 6. 根本原因の特定

Supabase のダッシュボードに「Auth Logs」という認証のログを見られるページがあります。

ログインを試みた後、確認しました。

**ログが、空だった。**

これは何を意味するか。

```
ブラウザ ──▶ Vercel ──▶ Supabase の認証サービス（GoTrue）
                              ↑ ここにリクエストが届いていない
```

Vercel（バージニア）から Supabase の認証サービス「GoTrue」に、物理的にリクエストが到達していなかったのです。

ここでちょっとした発見がありました。

「GetリクエストはOKなのに、Postだけ死ぬ」

調べると、`GET /api/auth/staff-names` というエンドポイント（スタッフ名を取得する）は正常に動いていた。このエンドポイントは Supabase のデータベース（PostgREST）に直接つないでいる。

```
GoTrue（認証サービス）→ 到達できない ❌
PostgREST（DBサービス）→ 普通に動く ✅
```

GoTrue と PostgREST は同じ Supabase の中にありますが、**別々のマイクロサービス**として動いています。GoTrue だけが Vercel から到達できない状態でした。

---

## 7. 迂回策：GoTrue を使わずにログインする

「GoTrue が使えないなら、GoTrue を使わなければいい」

という発想で、別の方法でパスワードを検証することにしました。

Supabase のデータベースには `auth.users` というテーブルがあり、ここに暗号化されたパスワードが保存されています。PostgreSQL の `pgcrypto` という拡張機能を使えば、データベースの中でパスワードを検証できます。

```sql
-- パスワードを検証するSQL関数を作成
CREATE OR REPLACE FUNCTION public.verify_user_password(p_email TEXT, p_password TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- メールとパスワードが一致するユーザーのIDを返す
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = lower(trim(p_email))
    AND encrypted_password = crypt(p_password, encrypted_password);

  RETURN v_user_id;  -- 一致しなければ null を返す
END;
$$;
```

これを「RPC（リモートプロシージャコール）」として呼び出すと、GoTrue を経由せずにパスワード検証ができます。

GoTrue（認証サービス）の代わりに PostgREST（DBサービス）経由でパスワードを確認する迂回路です。

---

## 8. 直ったと思ったら、また動かなかった

コードを変え、本番にデプロイしました。

```
POST /api/auth/login → ハング（永遠に返ってこない）
```

今度はタイムアウトではなく**ハング**（無限待機）。

ブラウザの開発者ツールで確認すると、ログインボタンを押してもリクエストが発生していない。サーバー側のログを確認しても何も来ていない。

「リクエストが送られていない？いや、ボタンは押せている…」

原因を絞り込むため、`curl`（コマンドラインで HTTP リクエストを送るツール）を使いました。

```bash
# bodyなしでPOST
curl -X POST https://zannyaku-api.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  --max-time 10

# → 10秒後にタイムアウト。何も返ってこない。
```

bodyなしでもハングする。ということは、bodyを読む前の段階で止まっています。

他の POST エンドポイントも試しました。

```bash
# bodyを読まないPOST（logout）
curl -X POST https://zannyaku-api.vercel.app/api/auth/logout
# → 200 ✅ 即座に返ってくる

# bodyを読むPOST（register）
curl -X POST https://zannyaku-api.vercel.app/api/auth/register \
  -d '{"email":"..."}' \
  -H "Content-Type: application/json"
# → ハング ❌
```

**「bodyを読む POST が全部ハングする」**

犯人は `@hono/node-server/vercel` というアダプターでした。このライブラリが、Vercel の Node.js ランタイムでリクエストのストリーム（データの流れ）を正しく読み取れていなかったのです。

### 修正：アダプターを使わず、自分でリクエストを処理する

```typescript
// 変更前：アダプターに任せる
import { handle } from '@hono/node-server/vercel'
export default handle(app)

// 変更後：自分でbodyを読んでHonoに渡す
export default async function handler(req, res) {
  // bodyを手動でバッファ（ストリームを自分で読む）
  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }
  const body = Buffer.concat(chunks)

  // Web標準のRequestオブジェクトを作ってHonoに渡す
  const request = new Request(url, {
    method: req.method,
    headers,
    body: body.length > 0 ? body : undefined,
  })

  const response = await app.fetch(request)
  // ... レスポンスを返す
}
```

---

## 9. まだ終わっていなかった：権限エラー

ようやく POST が返ってくるようになりました。でも、今度は別のエラー。

```
スタッフ情報の取得に失敗しました（500エラー）
```

Vercel のログを確認します。

```
verify_user_password → 200（成功）✅
staff テーブル GET   → 403（権限エラー）❌
```

パスワード検証は通っているのに、スタッフ情報を取得するところで弾かれている。

Supabase でテーブルの権限を確認すると、こうなっていました。

| ロール | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| authenticated | ✅ | ✅ | ✅ | ✅ |
| service_role | ❌ | ❌ | ❌ | ❌ |

`service_role`（バックエンドが使う全権限キー）に、基本的な読み書き権限がついていなかったのです。

「全権限キーなのに権限がないってどういうこと…」

Supabase のデータベースには「そのキーを持っている人はどんな操作ができるか」という設定が別にあります。マスターキーを持っていても、「このテーブルへの入室許可」を別途もらわないといけないような仕組みです。

```sql
-- service_role に全テーブルへのアクセス権を付与
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
```

これを実行して、ようやく…

```
POST /api/auth/login → 200 ✅
ログイン成功！
```

---

## 10. これは「Supabaseの仕様変更」と同じ問題だった

記事を書いていて気づいたことがあります。

Supabase は 2026年5月30日から、テーブルへのアクセス権の扱いを変更しています。

**変更前（従来）：**
テーブルを作ると、`anon`・`authenticated`・`service_role` の3つのロールに自動で SELECT/INSERT/UPDATE/DELETE が付与されていた。

**変更後（5月30日〜）：**
新規プロジェクトでは自動付与されなくなった。テーブルを作るたびに GRANT を明示的に書く必要がある。

```
2026年4月28日〜  新規プロジェクトで「自動GRANT」をオフにできる設定が追加
2026年5月30日〜  新規プロジェクトはデフォルトでGRANTなし ← 今ここ
2026年10月30日〜 既存プロジェクトにも全面適用
```

今回私が踏んだ問題は、まさにこれです。
`service_role` に SELECT 権限がなく 403 になった原因は、この変更の影響を受けたテーブルだったから。

**「service_role は全権限のはずでは？」** と思うかもしれません。私もそう思っていました。

正確には、`service_role` は「RLS（行単位のアクセス制限）を飛び越える」特権を持っています。でも**テーブルへの基本的な入室許可**は別の話です。マスターキーを持っていても、部屋のドア自体に鍵がかかっていれば入れない、というイメージです。

2026年10月30日以降は既存プロジェクトにも適用されます。同じエラーに当たったら、まずこれを確認してください：

```sql
-- 権限の確認
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' AND table_name = 'あなたのテーブル名';

-- service_role に SELECT がなければ付与
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
```

---

## 11. 全体を振り返って

今回の問題と解決をまとめると：

| 問題 | 原因 | 解決策 |
|---|---|---|
| ログインが504タイムアウト | Vercel→Supabase GoTrue が到達不可 | GoTrue をバイパスして RPC で検証 |
| POST がハング | Hono アダプターのストリーム処理の問題 | 自前でリクエストを処理 |
| staff テーブルが403 | service_role に SELECT 権限なし | GRANT で権限を付与 |

3つの問題が**直列に並んでいた**ため、一つ直すと次の問題が出てきました。

正直、こういう経験が積み重なると「プログラミングって本当に複雑だな」と感じます。でも同時に、**エラーメッセージは必ず何かを教えてくれている**、ということも実感しました。

`504` → 「届いていない」
`403` → 「権限がない」
`500` → 「サーバーの中で何かが失敗している」

数字を手がかりに、少しずつ原因を絞り込む。それがデバッグという作業です。

今日はここまで。

次回は、登録・ログアウト・セッション管理の実装について書きます。

---

*訪問看護師として週3で働きながら、夜中にコードを書いています。*
*技術的な正確さより「なんとなくわかった」を大切に書いています。*
