---
title: 【React環境構築 完全版】Node.js・Viteのセットアップ + HTML/JS基礎の仕組みまで——非エンジニアが0から始めた全記録
tags:
  - Node.js
  - 環境構築
  - 初心者
  - React
  - vite
private: false
updated_at: '2026-04-09T23:57:55+09:00'
id: ab54be932236b1a1e7d4
organization_url_name: null
slide: false
ignorePublish: false
---

## はじめに

この記事でできること：

- Node.js・npm・Reactをローカル環境にセットアップできる
- HTML/JavaScript/Reactの役割の違いが理解できる
- 「なぜそのコマンドを打つのか」がわかる

対象：プログラミングをほぼやったことがない、でも作りたいものがある人。

---

## 環境・前提条件

- Mac（Windowsの場合はパス表記などが一部異なります）
- VS Codeインストール済み
- ターミナルを開いたことがある程度でOK

---

## 0. 環境構築の基礎知識

### 0-1. 「環境構築」とは何か

人間が書いたコードを機械が動かせる形に変換して動かすためのシステム整備。
コードを動かすエンジン・システムを置く作業です。

必要なもの：

```
VSCode（エディタ・コードスペース）
Node.js（実行環境）
npm（Node Package Manager）
React（JavaScriptコードの集まり）
```

### 0-2. 各ツールの役割

**Node.js（実行環境）**

JavaScriptを実行するためのエンジンの集まり。

```
Node.js
 ├── V8エンジン（JavaScriptを実行する心臓部）← Chromeと同じ
 ├── libuv（ファイル操作、ネットワーク通信）
 └── Webpack（Reactコード変換）
npm（Node.jsに付いてくる）
 └── react
```

> **ビルド**とは、開発者が書いたコードを実際に動く形に変換する作業。

**npm（Node Package Manager）**

パッケージ管理ツール。ライブラリのダウンロード・管理ができる。ReactもここからインストールするNodejsに付いてくる。

**React（コード）**

JavaScriptのライブラリ（コードの集まり）。Webページに動きをつける。

```
環境構築の流れ：

1. Node.jsをインストール
2. npmも一緒についてくる
3. npmでReactをインストール
4. ターミナルで npm run dev を実行
5. Node.jsが起動→Reactのコードがブラウザ用に変換される
6. 開発サーバーが立ち上がる
```

---

## 1. セットアップ手順

### 1-1. Node.jsをダウンロードする

1. [nodejs.org/ja/download](https://nodejs.org/ja/download) を開く
2. インストーラーをダウンロード
3. ダブルクリックして「続ける」→「インストール」

### 1-2. VS Codeをインストールする

[code.visualstudio.com/download](https://code.visualstudio.com/download) から自分のPCに合ったものをダウンロード。

### 1-3. Node.jsとnpmの確認

VS Codeのターミナルを開いて：

```bash
node -v
npm -v
```

両方バージョンが表示されればOK。

### 1-4. Reactプロジェクト作成（Vite）

:::note warn
**2025年2月以降：Create React Appは非推奨**
[React公式ブログ](https://ja.react.dev/blog/2025/02/14/sunsetting-create-react-app) より。現在は **Vite** が推奨です。
:::

```bash
cd ~/Desktop
npm create vite@latest my-app -- --template react
cd my-app
npm install
npm run dev
```

`create-react-app` と比べて起動が10倍以上速い。

### 1-5. 動作確認

ブラウザが自動で開いてViteのロゴが出れば成功。

`src/App.jsx` を開いて内容を書き換えてみましょう：

```jsx
function App() {
  return (
    <div>
      <h1>Hello!</h1>
      <p>初めてのReactアプリが動いた！</p>
    </div>
  );
}

export default App;
```

保存（Cmd+S）すると画面が即座に更新されます。

---

## 2. エラー・つまずきポイント

### ネットワークエラー（インストール中）

新幹線の中でやって失敗しました。安定したWi-Fi環境で作業してください。

対処：

```bash
npm cache clean --force
npm create vite@latest my-app -- --template react
```

### 使っていないimportの警告

```
WARNING: 'logo' is defined but never used
```

使っていない `import` 文を削除するだけで解決します。

---

## 3. なぜそう動くのか：HTML/JS/Reactの仕組み

セットアップが終わったところで、「なぜそのコードが動くのか」を理解しておくと、エラーを自分で解決できるようになります。

### 3-1. HTMLの骨組み

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>タブに表示されるタイトル</title>
</head>
<body>
    <h1>画面に表示される内容</h1>
    <p>段落</p>
</body>
</html>
```

```
HTMLの骨組み
├── <!DOCTYPE html>（宣言）
└── <html>（全体の箱）
    ├── <head>（ページ設定。画面には表示されない）
    │   ├── <meta charset="UTF-8">（文字化け防止）
    │   └── <title>（タブに表示）
    └── <body>（実際に表示される内容）
        ├── <h1>（大見出し）
        └── <p>（段落）
```

### 3-2. ブラウザの中身

```
ブラウザ
├── レンダリングエンジン（HTML/CSSを画面に表示）
│   ├── HTMLパーサー → DOMツリー作成
│   ├── CSSパーサー → CSSOMツリー作成
│   └── レイアウト → ペイント → 表示
└── JavaScriptエンジン（V8など）
```

HTMLを読み込むとDOMツリー（木構造のデータ）に変換されます。

```
DOMツリー
document
  └── html
      └── body
          ├── h1 "見出し"
          ├── p (id="message") "テキスト"
          └── button (id="btn") "クリック"
```

### 3-3. JavaScriptで動きをつける（バニラJS）

```javascript
// 1. ボタン要素をDOMツリーから取得
const button = document.querySelector('#btn');

// 2. クリックされたら実行する処理を登録
button.addEventListener('click', () => {
    const message = document.querySelector('#message');
    message.innerText = '変わった！';
});
```

### 3-4. ReactがJavaScriptを自動化している

**バニラJS（4ステップ必要）：**

```javascript
const button = document.querySelector('#btn');       // 1. 要素を探す
button.addEventListener('click', () => {              // 2. イベント登録
    const message = document.querySelector('#message'); // 3. 要素を探す
    message.innerText = '変わった！';                 // 4. 書き換える
});
```

**React（1ステップで同じことができる）：**

```javascript
const [message, setMessage] = useState('初期値');

const handleClick = () => {
    setMessage('変わった！');  // 値を変えるだけ→画面が自動更新
};
```

Reactの考え方：**「データを更新すれば画面は勝手についてくる」**

---

## 4. Reactのコアを理解する

### 4-1. importとexport

```javascript
import { useState } from 'react';  // reactから useState を持ってくる
import './App.css';                  // CSSを読み込む

export const App = () => {};         // このファイルの内容を外から使えるようにする
```

### 4-2. useState（状態管理）

```javascript
const [message, setMessage] = useState('まだクリックされていません');
//     ↑現在の値   ↑更新用関数                    ↑初期値
```

- `message`：現在の値を入れた箱
- `setMessage`：値を変更するための関数
- 値が変わると自動で画面が更新される

### 4-3. 配列のstate更新（重要）

Reactは「別物の配列に変わった」ことで変化を検知します。

```javascript
// ❌ NG：同じ配列をそのまま渡している
message.push(newItem);
setMessage(message);

// ✅ OK：スプレッド構文で必ず新しい配列を作ってから渡す
const newArray = [...message, newItem];
setMessage(newArray);
```

### 4-4. JSX（ReactのHTML記法）

```jsx
return (
    <div className="App">        {/* classではなくclassName */}
        <p>{message}</p>         {/* {}でJS変数を表示 */}
        <button onClick={handleClick}>クリック！</button>  {/* onClickで関数を渡す */}
    </div>
);
```

---

## 5. まとめ

### 暗記してサッと使いたいコマンド

```bash
node -v                                            # Node.jsバージョン確認
npm -v                                             # npmバージョン確認
npm create vite@latest my-app -- --template react  # Reactアプリ作成（Vite）
cd my-app && npm install && npm run dev            # インストール→起動
```

### 暗記してサッと使いたいReactコード

```javascript
// 状態管理
const [state, setState] = useState(初期値);
setState(新しい値);

// 配列のstate更新（必ず新しい配列を作る）
const newArray = [...oldArray, 新要素];
setState(newArray);

// JSX
<p>{変数名}</p>
<button onClick={関数}>ボタン</button>

// バニラJS：DOM操作
document.querySelector('#id名');
element.addEventListener('click', () => {});
element.innerText = '新しいテキスト';
```

---

## 参考

- [React公式ドキュメント](https://ja.react.dev/)
- [Vite公式ドキュメント](https://ja.vitejs.dev/)
- [Node.js公式](https://nodejs.org/ja/)
