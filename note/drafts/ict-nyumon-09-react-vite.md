---
title: React + Viteで環境構築——本格的なWebアプリ開発をゼロから始める
platform: note
membership: false
tags: ["ICT", "React", "Vite", "医療職", "超入門"]
---

HTMLとJavaScriptだけでもWebページは作れます。

でも、複雑なアプリを作ろうとすると、もっと効率のいい方法が必要になります。

それがReactです。

---

ICTを学びたいと思いながら、どこから手をつければいいかわからない。
そういう医療職の人に向けて書いています。

私は訪問看護師をしながら、音楽療法アプリをゼロから開発しています。
非エンジニア・文系・コード歴2年未満。

---

## この記事でできるようになること

- Reactとは何かがわかる
- Node.js・npmをインストールできる
- React + Viteでプロジェクトを作れる
- 開発サーバーを起動してブラウザで確認できる

**前提：ターミナルの基本操作、JavaScriptの基礎がわかっていればOK。**

---

## Reactとは何か

React（リアクト）は、Webアプリを効率よく作るためのJavaScriptライブラリです。Facebookが開発して、現在も世界中で使われています。

HTMLとJavaScriptだけでアプリを作ると、こんな問題が起きます。

- コードが長くなるにつれて、どこで何をしているかわからなくなる
- 同じようなHTMLを何度も書く必要がある
- 表示の更新を自分で管理しないといけない

Reactはこれらを解決します。

- **コンポーネント**：UIを部品（ボタン・リスト・カードなど）に分けて管理できる
- **状態管理（useState）**：データが変わると、関係する部分だけ自動で画面が更新される

手術室のモジュールシステムに似ています。チームごとに担当を分けて、全体を組み立てる。

---

## ViteとはReactの「起動ツール」

Reactを動かすには、コードをブラウザが読める形に変換するツールが必要です。

**Vite**（ヴィート）はそのツールです。起動が爆速で、現在Reactの公式推奨です。

以前は「Create React App（CRA）」が使われていましたが、2025年2月にサポート終了しました。今からReactを始めるならVite一択です。

---

## Node.jsとnpmをインストールする

ReactとViteを使うには、**Node.js**（ノードJS）が必要です。

Node.jsはJavaScriptをパソコン上で直接動かすための環境です。Reactのビルドツールを動かすために使います。

**npmはNode.jsに付属するパッケージ管理ツール**です。ライブラリのインストールに使います。

### インストール手順

1. `nodejs.org` を開く
2. 「LTS」版（推奨版）をダウンロードしてインストール
3. ターミナルで確認：

```bash
node --version   # v20.x.x などが出ればOK
npm --version    # 10.x.x などが出ればOK
```

---

## Reactプロジェクトを作る

ターミナルでデスクトップに移動します。

```bash
cd ~/Desktop
```

以下のコマンドを実行します。

```bash
npm create vite@latest my-app -- --template react
```

- `my-app` はプロジェクト名です。好きな名前に変えられます
- `--template react` でReact用のテンプレートを選んでいます

実行すると `my-app` フォルダが作られます。

---

## 依存関係をインストールして起動する

```bash
cd my-app
npm install
npm run dev
```

- `cd my-app`：作られたフォルダに移動
- `npm install`：必要なライブラリをすべてインストール
- `npm run dev`：開発サーバーを起動

ターミナルにこんな表示が出ます。

```
  VITE v5.x.x  ready in 300 ms

  ➜  Local:   http://localhost:5173/
```

ブラウザで `http://localhost:5173` を開くと、Reactのデモ画面が表示されます。

---

## フォルダの構成を見る

```
my-app/
├── src/
│   ├── App.jsx       ← メインのコンポーネント（ここを編集する）
│   ├── App.css
│   └── main.jsx      ← アプリの起点
├── index.html
├── package.json      ← プロジェクトの設定とライブラリ一覧
└── vite.config.js    ← Viteの設定
```

最初に触るのは `src/App.jsx` です。

---

## App.jsxを書き換えてみる

`src/App.jsx` を開いて、`return` 以下を書き換えます。

```jsx
function App() {
  return (
    <div>
      <h1>はじめてのReact</h1>
      <p>Viteで起動しています。</p>
    </div>
  );
}

export default App;
```

保存すると、ブラウザが自動でリロードされて変化が反映されます（ホットリロード）。

---

## JSXとは

`App.jsx` の中に見慣れない書き方があります。

```jsx
return (
  <div>
    <h1>はじめてのReact</h1>
  </div>
);
```

JavaScriptの中にHTMLのようなものが書いてある。これが**JSX**です。

HTMLとほぼ同じですが、細かい違いがあります。

| HTML | JSX |
|---|---|
| `class="box"` | `className="box"` |
| `onclick="func()"` | `onClick={func}` |
| `for="label"` | `htmlFor="label"` |

---

## まとめ

| やったこと | コマンド |
|---|---|
| プロジェクト作成 | `npm create vite@latest プロジェクト名 -- --template react` |
| ライブラリインストール | `npm install` |
| 開発サーバー起動 | `npm run dev` |
| ブラウザで確認 | `http://localhost:5173` を開く |

これで本格的なReactアプリを開発する環境が整いました。

このシリーズではここまで9つのステップを扱いました。

```
① VSCodeの準備
② ターミナルの基礎
③ HTMLとは
④ CSSとは
⑤ JavaScriptとは
⑥ GitとGitHubとは
⑦ APIとは
⑧ APIキーの安全な管理
⑨ React + Vite環境構築（← 今ここ）
```

ここまで読んでくれた方は、ICT独学の入口に立てています。
