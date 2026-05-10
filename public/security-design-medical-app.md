---
title: 医療アプリのセキュリティ設計——「クラウドかオンプレか」より先に考えること
tags:
  - Security
  - React
  - 個人開発
  - 医療
  - Supabase
private: false
updated_at: '2026-05-10T14:42:44+09:00'
id: 52aee5edc38a7c2ee89a
organization_url_name: null
slide: false
ignorePublish: false
---

セキュリティとは、クラウドかオンプレかではなく、**誰が、どの権限で、どの情報にアクセスできるかを設計すること**。
これは私が、個人開発で残薬アプリを作るにあたり、どんなセキュリティである必要があるのかを調べた際にたどり着いた答えです。

一方で、医療現場でツールを導入しようとすると、最初にこんな会話が起きがちです。
「クラウドは怖い。個人情報が漏れたらどうするんですか」

この記事では、私が個人開発している**残薬管理アプリ**の実際のコードをもとに、医療ツールのセキュリティ設計がどう実装されているかを説明し、クラウドでも安全なセキュリティ設計について書いてみました。

---

## 1. まず知っておきたい：セキュリティには「2種類」ある

```
ネットワークセキュリティ  → 「そこまで来られるか」を守る
アプリケーションセキュリティ → 「来た人が中に入れるか」を守る
```

```
【門・フェンス】← ネットワーク層（Firewall・VPN・IP制限・HTTPS）
【玄関の鍵】  ← 認証（あなたは誰か）
【部屋の鍵】  ← 認可（何を見せるか）
【防犯カメラ】 ← 操作ログ
```

医療現場で頻出する「クラウドは怖い」はネットワーク層への不安。実際の防衛ラインはアプリケーション層の設計次第。

---

## 2. 「よく聞く言葉」の正体

よく耳にするセキュリティ用語が、どちらの層の話なのかを整理しておきます。

| 言葉 | 意味 | どちらの層 |
|---|---|---|
| ファイアウォール | 外部からの不正な通信を遮断する仕組み | ネットワーク |
| VPN | 通信経路を暗号化し、特定の接続元だけ許可する | ネットワーク |
| SSL / HTTPS | 通信内容を暗号化し、盗み見を防ぐ | ネットワーク寄り |
| IP制限 | 特定のIPアドレス（場所）からのみアクセスを許可 | ネットワーク |
| 認証（ログイン） | 「あなたは誰か」を確認する | アプリケーション |
| 権限管理（ロール） | 「誰が何を見られるか」を設定する | アプリケーション |
| 操作ログ | 誰がいつ何をしたかを記録する | アプリケーション |

IP制限は動的IP環境（テザリング・モバイル回線）では運用困難。医療現場は固定IPを確保できないケースが多いため、MFAの方が現実的。

---

## 3. クラウドのネットワーク層は「誰が担うか」

このアプリは React + Supabase（データベース）+ Vercel（公開サーバー）という構成です。

React + Supabase + Vercel 構成でのネットワーク層の分担。

| ネットワーク対策 | 担当 |
|---|---|
| HTTPS強制 | Vercel が自動適用 |
| DDoS緩和 | Vercel エッジネットワーク |
| DB ネットワーク分離 | Supabase VPC |
| DB 接続暗号化 | Supabase TLS 強制 |

Supabase DB は VPC 内にあり Supabase API 経由以外では到達できない。クラウドがネットワーク層を担うため、アプリ側はアプリケーション層の設計に集中できる構造になっている。

## 4. このアプリについて

訪問看護師が利用者の自宅に残っている薬（残薬）を管理するツールです。

**登録できる情報：**
- 利用者のニックネーム（「Aさん」「田中さん宅」など）
- 薬の名前・残数・タイミング
- 受診予定日・医療機関名

**登録しない情報：**
- 利用者の氏名・住所・連絡先・生年月日
- 診断名・病名

個人を特定できる情報を**最初からシステムに存在させない**というのが最初の設計方針です。

技術スタックは React + Supabase（PostgreSQL）+ Vercel。いわゆるサーバーレス構成です。

---

## 5. セキュリティ設計の全体像

このアプリで実装しているセキュリティは、大きく**5つの層**に分かれています。

```
① 情報の最小化（個人情報を入力できない設計）
② 認証（誰がアクセスするか）
③ 認可（どのデータにアクセスできるか）
④ 操作ログ（誰が何をしたか）
⑤ 通信・ヘッダー（外部からの攻撃を防ぐ）
```

順に見ていきます。

---

## 6. ① 情報の最小化——入力できない設計

セキュリティの一番の基本は、「守る情報を減らすこと」です。

漏れたら困るデータは、**最初から持たない**。

データベースの患者テーブルはこうなっています。

```sql
-- supabase/migrations/001_initial_schema.sql

CREATE TABLE patients (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id        UUID REFERENCES organizations(id) NOT NULL,
  nickname      TEXT NOT NULL,   -- ← ニックネームだけ
  registered_at DATE DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

`nickname` しかカラムがありません。氏名・住所・生年月日を入れるフィールドが**テーブル定義レベルで存在しない**ので、入力する画面を作りたくても作れない。

これは「UIで禁止する」より強い制約です。画面で防いでも、APIを直接叩けば入れられてしまう。テーブル設計で防ぐと、どこから来ても防げます。

---

## 7. ② 認証——誰がアクセスするか

認証とは「あなたは誰ですか」を確認することです。

このアプリはメールアドレスとパスワードでログインします。ログイン処理のコードはシンプルです。

```javascript
// src/lib/api.js

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  logAudit({ action: 'login' })  // ← ログイン自体も記録される
  return data
}
```

パスワードは Supabase が bcrypt でハッシュ化して保存します。平文では保存されません。

ログイン成功後、**JWT（JSON Web Token）**というデジタル証明書が発行されます。以後のAPI通信では、このトークンを提示することで「認証済み」と判断されます。

```javascript
// src/lib/supabase.js

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,    // セッションを保持
    autoRefreshToken: true,  // トークンを自動更新
    detectSessionInUrl: true,
  },
})
```

---

## 8. ③ 認可——誰がどのデータを見られるか

ここが最も重要な設計です。

「認証済み」イコール「全データ見放題」では困ります。

このアプリは複数の事業所が同じデータベースを共有します。A事業所のスタッフが、B事業所のデータを見られてはいけない。

### マルチテナント分離：RLS（行レベルセキュリティ）

PostgreSQLには**RLS（Row Level Security）**という機能があります。テーブルの行ごとに「誰が読めるか」を定義できる仕組みです。

すべてのテーブルに `org_id`（事業所ID）カラムがあり、RLSで「自分の事業所のデータしか見えない」制約をデータベース側に課しています。

```sql
-- supabase/migrations/001_initial_schema.sql

-- ログイン中ユーザーの事業所IDを返す関数
CREATE OR REPLACE FUNCTION my_org_id()
RETURNS UUID
LANGUAGE SQL STABLE
SECURITY DEFINER  -- ← ここが重要
AS $$
  SELECT org_id FROM staff WHERE id = auth.uid()
$$;

-- patientsテーブルのRLSポリシー
CREATE POLICY "patients_all" ON patients
  FOR ALL USING (org_id = my_org_id())
  WITH CHECK (org_id = my_org_id());
```

`SECURITY DEFINER`（セキュリティ定義者）というキーワードが重要です。この関数はデータベースが実行します。クライアント（ブラウザ）からは「自分の事業所IDは○○だ」と偽装できません。

どんなに巧みなリクエストを送っても、PostgreSQL側が「このユーザーの事業所はここ」と判定して弾きます。

### ロール分離：管理者だけが削除できる

スタッフには `admin`（管理者）と `staff`（一般）の2種類があります。

削除操作は管理者のみ許可するRLSポリシーがあります。

```sql
-- supabase/migrations/006_role_based_rls.sql

-- admin判定関数（こちらもSECURITY DEFINER）
CREATE OR REPLACE FUNCTION is_org_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff
    WHERE id = auth.uid()
      AND org_id = my_org_id()
      AND role = 'admin'
  )
$$;

-- patientsの削除はadminのみ
CREATE POLICY "patients_delete" ON patients
  FOR DELETE TO authenticated
  USING (org_id = my_org_id() AND is_org_admin());
```

ブラウザ側でロールを書き換えても、DB側の `is_org_admin()` 関数が実際の `staff` テーブルを参照して判定します。クライアントから「私はadminです」と主張しても無効です。

### 新規登録はEdge Functionだけから

事業所の新規登録は、Edge Function（サーバー上で動く小さな関数）を経由します。

```typescript
// supabase/functions/register-org/index.ts

// 許可するオリジン（ドメイン）を環境変数で管理
const ALLOWED_ORIGINS = [
  Deno.env.get('ALLOWED_ORIGIN') ?? '',
  'http://localhost:5173',
  'http://localhost:4173',
].filter(Boolean)

// POST以外は即時拒否
if (req.method !== 'POST') {
  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
    status: 405, ...
  })
}

// 入力バリデーション
function validateInput(orgName, staffName, email, password) {
  if (!orgName?.trim() || orgName.trim().length > 100) return '事業所名は1〜100文字で入力してください'
  if (!staffName?.trim() || staffName.trim().length > 50) return '氏名は1〜50文字で入力してください'
  if (!EMAIL_RE.test(email)) return 'メールアドレスの形式が正しくありません'
  if (!password || password.length < 8 || password.length > 128) return 'パスワードは8〜128文字で入力してください'
  return null
}
```

この関数の中だけが管理者権限（service role key）を持ちます。フロントエンドには一切渡しません。

---

## 9. ④ 操作ログ——誰が何をしたか

医療現場では「誰がいつ何を変更したか」を追跡できることが重要です。

このアプリには `audit_logs` テーブルがあり、ログイン・薬の追加・残数の変更・削除などを記録します。

ただ、ログを記録するだけでは不十分です。クライアントから直接ログを書き込める状態では、「誰が書いたか」を偽装できてしまいます。

### SECURITY DEFINER関数でDB側から記録

```sql
-- supabase/migrations/006_role_based_rls.sql

CREATE OR REPLACE FUNCTION insert_audit_log(
  p_action TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_detail JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO audit_logs (org_id, user_id, staff_name, action, ...)
  SELECT
    my_org_id(),   -- ← DBが事業所IDを決定
    auth.uid(),    -- ← DBがユーザーIDを決定
    s.name,        -- ← staffテーブルから取得
    p_action, ...
  FROM staff s WHERE s.id = auth.uid();
END;
$$;
```

`org_id` も `user_id` も `staff_name` も、**DBが auth.uid() をもとに確定**します。クライアントは「誰として記録するか」を操作できません。

### 直接INSERTを完全に封鎖

```sql
-- supabase/migrations/008_fix_audit_insert_policy.sql

-- 直接INSERTポリシーを削除
DROP POLICY IF EXISTS "audit_insert" ON audit_logs;

-- テーブルレベルでINSERT権限を剥奪
REVOKE INSERT ON TABLE audit_logs FROM authenticated;
```

`SECURITY DEFINER` 関数経由以外では、物理的に `audit_logs` に書き込めません。

このログ処理は、APIのすべての更新操作で呼ばれています。

```javascript
// src/lib/api.js

export async function updateMedStock(medId, stock, staffName) {
  const { error } = await supabase
    .from('medications')
    .update({ stock, updated_at: todayISO(), updated_by: staffName })
    .eq('id', medId)
  if (error) throw error
  logAudit({ action: 'update_stock', targetType: 'medication', targetId: medId, detail: { stock } })
}
```

---

## 10. ⑤ 通信・ヘッダー——外部からの攻撃を防ぐ

画面を開いているだけで攻撃される可能性がある、というのがWebの現実です。

Vercel の設定ファイルに、セキュリティヘッダーを定義しています。

```json
// vercel.json

{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; connect-src 'self' https://*.supabase.co; frame-ancestors 'none'; ..."
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

**各ヘッダーが何を守るか：**

| ヘッダー | 防ぐもの |
|---|---|
| Strict-Transport-Security | HTTPでのアクセスを強制HTTPS化（1年間） |
| Content-Security-Policy | 外部スクリプトの挿入（XSS攻撃） |
| X-Frame-Options: DENY | 別サイトのiframeへの埋め込み（クリックジャッキング） |
| Permissions-Policy | カメラ・マイク・位置情報へのアクセス禁止 |
| X-Content-Type-Options | ファイル形式の偽装 |
| Referrer-Policy | 外部サイトへのURL情報の漏洩 |

これらはすべてブラウザとVercelのあいだで自動的に適用されます。

---

## 11. 実装してみて分かった設計の「層」

整理すると、このアプリのセキュリティは以下の層で守られています。

```
[ブラウザ]
  ↓ HTTPS（TLS 1.2以上）
[Vercel CDN]
  → セキュリティヘッダーを付与して返す
  ↓ HTTPS + JWT
[Supabase API]
  → JWTを検証してユーザーを特定
  ↓
[PostgreSQL]
  → RLSポリシーが「このユーザーはこのデータを見られるか」を判定
  → SECURITY DEFINER関数が「クライアントから偽装できない操作」を担保
```

どこか一つが突破されても、次の層が守ります。

---

## 12. 既知の課題も正直に書く

完璧なシステムはありません。このアプリにも残っている課題があります。

**JWTをlocalStorageに保存している問題**

認証トークンはブラウザの `localStorage` に保存されます（Supabaseのデフォルト動作）。XSS（クロスサイトスクリプティング）攻撃でページにスクリプトを注入されると、トークンを盗まれる可能性があります。

CSP（Content-Security-Policy）でスクリプト注入を防ぐことで軽減していますが、根本的な解決にはNext.jsへの移行（HttpOnly Cookie管理）が必要です。

**created_by / updated_byはクライアント申告**

薬の残数を誰が更新したかを記録する `updated_by` カラムは、ログイン画面で入力した名前がそのまま入ります。監査ログ（`audit_logs`）はDB側で本人確認しますが、各テーブルの `updated_by` はクライアント側の値です。

これは今後、DB側の `staff.name` に統一していく予定の部分です。

---

## 13. まとめ——「運用でやりたいこと」を設計の言葉に変える

医療現場でのツール導入を進める中で、最も変わったのは**要求の言語化**です。

以前は「セキュリティが心配なので」で止まっていた会話が、今はこう言えるようになりました。

> 「退職したスタッフは即座にアクセス遮断したい。だから、アカウント管理はSupabase Authで一元化して、無効化を1操作で完結できる設計にしてください」

> 「他の事業所のデータを誰も見られないようにしたい。だから、全テーブルにorg_idを持たせて、RLSでデータベース側で分離してください」

> 「誰が残薬数を更新したか後で確認したい。だから、すべての更新操作でaudit_logsに記録し、改ざんできない設計にしてください」

セキュリティは、クラウドかオンプレかで決まるものではありません。

**誰が・どの権限で・どの情報に・どうアクセスできるかを設計すること**。

そして「こういう運用をしたいから、設計はこうしてください」と言えるようになること。

それが、医療現場でのテクノロジー活用の第一歩だと思っています。

---

## 14. 有識者の方へ：スタック選択・設計についてご意見をください

訪問看護師（非エンジニア出身）が独学でここまで実装しました。現状の設計で「ここは変えた方がいい」「こっちのアプローチの方が医療ドメインに合っている」というご意見があれば、ぜひ聞かせてください。

### 現在のスタック

```
フロントエンド : React + Vite（SPA）
データベース   : Supabase（PostgreSQL + Auth + Edge Functions）
ホスティング   : Vercel
認証方式       : JWT（localStorage保存）
マルチテナント : 共有DBにRLSでorg_id分離
```

### 特に聞きたいこと

**① スタック選択**
React + Supabase + Vercel という構成は、医療系の業務アプリとして適切でしょうか。Next.js への移行、Firebase、AWS Amplify など、医療ドメインで実績のある構成があれば教えてください。

**② JWTのlocalStorage保存問題**
現在、認証トークンを `localStorage` に保存しています（Supabase デフォルト）。CSPで外部スクリプトを制限して軽減していますが、Next.js + HttpOnly Cookie への移行は今の規模・フェーズで必要でしょうか。それとも他の対応策があるでしょうか。

**③ マルチテナント：共有DB vs テナントごとDB**
現在は全テナント（事業所）が同一のSupabaseプロジェクトを共有し、RLSで行レベル分離しています。医療情報を扱う場合、テナントごとにDBを分離すべきでしょうか。Supabaseのスキーマ分離（schema-per-tenant）は現実的な選択肢ですか。

**④ SECURITY DEFINERのリスク**
`my_org_id()` や `insert_audit_log()` を `SECURITY DEFINER` で定義しています。この関数が脆弱であった場合の影響範囲について、見落としている観点があれば教えてください。

**⑤ 日本の医療情報ガイドラインへの準拠**
厚生労働省「医療情報システムの安全管理に関するガイドライン（第6版）」の観点で、現在の設計で明らかに不足している部分はありますか。特に「真正性・見読性・保存性」の3原則への対応について、ご指摘いただけると助かります。

コメント欄でもお待ちしています。

---

## 15. 参考：このアプリのマイグレーション構成

```
001_initial_schema.sql    — テーブル定義・RLS基盤・my_org_id()関数
002_audit_logs.sql        — 監査ログテーブル
005_fix_organizations_rls.sql — 事業所テーブルのRLS強化（anonアクセス廃止）
006_role_based_rls.sql    — admin/staff権限分離・insert_audit_log()関数
007_fix_staff_update_and_unknown_drugs.sql — staff更新の権限昇格リスク修正
008_fix_audit_insert_policy.sql — 監査ログへの直接INSERT完全封鎖
```

今まではマイグレーションという言葉も知りませんでしたが、全ての更新・適応をプロジェクトにも残し、別の技術スタックでも復元できるように整えています。

---

*このアプリは現在試験運用中です。導入検討・フィードバックは X: @nurselog_neiro まで。*
