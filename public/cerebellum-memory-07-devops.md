---
title: 【小脳記憶 ser.7】個人開発者がDevOpsを始める日——APIキー漏洩・脆弱性・Sentry導入まで
tags:
  - Security
  - devops
  - sentry
  - React
  - 個人開発
private: false
updated_at: '2026-04-09T23:05:38+09:00'
id: 00618fb3e6cb602cf0a9
organization_url_name: null
slide: false
ignorePublish: false
---

みなさんこんにちは。
平凡な訪問看護師が、アプリ開発の実装過程で読めなかったところを読めるまでやる「小脳記憶シリーズ」です。

今回は少し趣向を変えて、**DevOps**の話をします。

コードを書くことに集中していると、「壊れないか確認する」「安全に動かし続ける」という部分が後回しになりがちです。私もそうでした。でもある日、APIキーの扱いを見直したことをきっかけに、個人開発者として最低限やっておくべきことを整理しました。

---

## DevOpsって何？

難しく聞こえますが、やることは4つだけです。

1. **コードを書く**（開発）
2. **壊れないか確認する**（品質保証）
3. **本番で動かし続ける**（運用）
4. **それを自動化・効率化する**（自動化基盤）

個人開発者が「今すぐやるべきこと」と「将来でいいこと」を分けるのが大事です。

---

## 🔴 今すぐやること：APIキー漏洩チェック

### `.gitignore` に `.env` が入っているか確認する

まずここから。Reactプロジェクト（Create React App / Vite）を使っている場合、デフォルトの `.gitignore` には `.env.local` などのバリエーションは含まれていますが、**素の `.env`** が入っていないことがあります。

```bash
cat .gitignore | grep .env
```

出力に `.env` 単体が含まれていない場合は追加します：

```
# .gitignore
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

### 過去にcommitされていないか確認する

```bash
git log --all -- .env
```

何も出なければOK。何か出たら、そのcommitにキーが含まれている可能性があります。すぐにAPIキーをローテーション（再発行）してください。

### Viteプロジェクトの環境変数は `VITE_` プレフィックスが必要

Viteはセキュリティのため、`VITE_` で始まる変数だけをブラウザ側に渡します。

```bash
# .env
VITE_GOOGLE_API_KEY=あなたのキー
VITE_ANTHROPIC_API_KEY=あなたのキー
```

```js
// Reactコードからの読み方
import.meta.env.VITE_GOOGLE_API_KEY
```

`GOOGLE_API_KEY=xxx` と書いても読めないので注意。

---

## 🟢 エラー監視：Sentryを入れる

アプリをリリースしたあと、ユーザーがエラーに遭遇してもあなたには伝わりません。Sentryを使えば、エラーが起きた瞬間にメールが来ます。

**無料プランの範囲（Developer）**
- エラー5,000件/月
- メンバー1人
- データ保持30日

個人開発のβ版フェーズなら十分です。

### インストール

```bash
npm install @sentry/react
```

### 🟡 インストールしたら脆弱性が検出された

インストール直後にこれが出ました。

```bash
npm audit
```

```
vite <=6.4.1
Severity: high
- Vite Vulnerable to Path Traversal in Optimized Deps `.map` Handling
- Vite Vulnerable to Arbitrary File Read via Vite Dev Server WebSocket
```

**「高深刻度」と書いてあっても焦らなくていいです。** これらは**開発サーバー限定**の問題です。`npm run dev` で動かしている間だけリスクがあり、本番デプロイ後には関係ありません。

ただし放置はNGです。修正は一コマンドで終わります：

```bash
npm audit fix
```

```
found 0 vulnerabilities  ← これが出れば完了
```

### 初期化（Copy SDKを `src/main.jsx` の先頭に追加）

Sentryの管理画面に表示されるコード（Copy SDK）をそのまま `main.jsx` の先頭に貼ります。

```jsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "あなたのDSN",  // Sentryの管理画面から取得
  sendDefaultPii: true,
});
```

あとはSentryの管理画面のIssuesを見れば、エラーの内容・発生場所・ブラウザ情報が全部わかります。

---

## まとめ：今日やったこと

| やったこと | ツール | 難易度 |
|---|---|---|
| `.gitignore` に `.env` を追加 | テキスト編集 | ★☆☆ |
| 過去のcommit履歴確認 | git | ★☆☆ |
| Vite環境変数のプレフィックス対応 | `.env` 編集 | ★☆☆ |
| 脆弱性チェック＆修正 | npm audit fix | ★☆☆ |
| Sentry導入 | npm + 設定 | ★★☆ |

どれも30分以内で終わります。コードを書く前に一度だけやっておけば、あとは気にしなくていいことばかりです。

---

## 将来やること（今は不要）

- **GitHub Actions（CI）** — pushのたびに自動テストを走らせる。ユーザーが増えてから
- **Terraform** — クラウドインフラをコードで管理。個人開発の初期には早い
- **OpenTelemetry** — パフォーマンス計測。Sentryで十分なうちは不要
