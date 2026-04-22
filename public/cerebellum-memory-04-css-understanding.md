---
title: 【小脳記憶 ser.4】CSSの構造がやっと見えた——UdemyでJSとReactのスタイリングを学んで気づいたこと
tags:
  - CSS
  - React
  - JavaScript
  - 初心者
  - 個人開発
private: false
updated_at: ''
id: ''
organization_url_name: null
slide: false
ignorePublish: false
---

## はじめに

非エンジニア出身の訪問看護師が、アプリ開発の実装過程で読めなかったところを読めるまでやる「小脳記憶シリーズ」です。

この記事では以下が整理できます：

- CSSの基本構造（セレクタ・プロパティ・値・ボックスモデル）
- id と class の使い分け
- Vanilla JS と React それぞれでスタイルを当てる方法の違い

**使った教材：** [【React18対応】モダンJavaScriptの基礎から始める挫折しないためのReact入門（Udemy）](https://www.udemy.com/course/modern_javascipt_react_beginner/)

:::note info
この記事は [小脳記憶 ser.3](https://qiita.com/uno22/items/b8bbae461a65811638ea) の続きです。
:::

---

## 0. 学ぶ前の状態

個人事業の案件で、Notion の web 作成機能と Wraptasを使ってランディングページの修正指示が出たことがあった。

「ここのテキストのフォントを変えて」「このブロックの余白を調整して」

でも、どこで何が触れるのかが全くわからなくて、ひたすら手探りするしかなかった。「CSS」という言葉は知っていたけど、「どういう構造で、どこに書いて、何に効くのか」が見えていなかった。

その状態が、Udemy で Vanilla JS と React の TODO アプリを作るなかで、少しずつほぐれていった。

---

## 1. TODO アプリを作って id と class がわかった

HTML + CSS + JS の組み合わせで TODO アプリを作った。最初に作った HTML がこれ：

```html
<!DOCTYPE html>
<html>
  <head>
    <title>TODO_JS</title>
    <meta charset="UTF-8" />
  </head>
  <body>
    <div class="input-area">
      <input id="add-text" placeholder="TODOを入力" />
      <button id="add-button">追加</button>
    </div>
    <div class="incomplete-area">
      <p class="title">未完了のTODO</p>
      <ul id="incomplete-list"></ul>
    </div>
    <div class="complete-area">
      <p class="title">完了のTODO</p>
      <ul id="complete-list"></ul>
    </div>
    <script src="./index.mjs" type="module"></script>
  </body>
</html>
```

ここで「id と class ってこうやって使うんだ」とわかった。

`id="add-text"` や `id="incomplete-list"` は JS 側から `document.getElementById()` で取得するためのもの——ページに 1 つしかない、ピンポイントで指定したい要素につける。

`class="input-area"` や `class="list-row"` は CSS 側でまとめてスタイルを当てるためのもの——同じ見た目を持たせたい要素が複数あるときに使う。

```
id    = JSが「ここをピックアップ」するための名前
class = CSSが「これらをまとめてスタイル適用」するための名前
```

この2つの役割がぼんやりしていたのが、実際に書いて整理できた。

---

## 2. CSS の基本構造

実際に書いた CSS がこちら：

```css
body {
  font-family: sans-serif;
  color: #666;
}

.input-area {
  background-color: #c6e5d9;
  width: 400px;
  height: 30px;
  padding: 8px;
  margin: 8px;
  border-radius: 8px;
}

.incomplete-area {
  border: 2px solid #aacfd0;
  width: 400px;
  min-height: 200px;
  padding: 8px;
  margin: 8px;
  border-radius: 8px;
}

.list-row {
  display: flex;
  align-items: center;
}

.todo-item {
  margin: 6px;
}
```

CSS の基本構造は「**セレクタ { プロパティ: 値; }**」の繰り返し。

- `.input-area` → クラスセレクタ（`.` がつく）
- `body` → タグセレクタ（タグ名をそのまま書く）
- `background-color`, `width`, `padding` → プロパティ
- `#c6e5d9`, `400px`, `8px` → 値

`.list-row { display: flex; align-items: center; }` を書いたとき、「CSS でこうやって指定するんだ」と体感できた。見た目の指定をクラス名でまとめて、HTML 側から `class="list-row"` と書くだけで適用される——その流れが初めてスムーズに理解できた感覚があった。

### ボックスモデル

「なんかずれる」「余白が思ったよりある」という問題は、たいてい **padding（内側の余白）** と **margin（外側の余白）** の違いがわかっていないことが原因だった。

```
┌──────────────────────────────┐
│          margin              │  ← 外側の余白（透明）
│  ┌────────────────────────┐  │
│  │        border          │  │  ← 枠線
│  │  ┌──────────────────┐  │  │
│  │  │     padding      │  │  │  ← 内側の余白（背景色が入る）
│  │  │  ┌────────────┐  │  │  │
│  │  │  │  content   │  │  │  │  ← テキストや画像
│  │  │  └────────────┘  │  │  │
│  │  └──────────────────┘  │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

TODO アプリで `.input-area` に `padding: 8px` と `margin: 8px` の両方を書いたとき、「内と外で違う」ことが視覚的につかめた。

---

## 3. React での CSS の扱い方

同じ TODO アプリを React で書き直したとき、スタイルの書き方が変わった。

### インラインスタイル（オブジェクト記法）

`IncompleteTodos` コンポーネントでは、スタイルを JS のオブジェクトとして定義している：

```jsx
const style = {
  border: "2px solid #aacfd0",
  width: "400px",
  minHeight: "200px",
  padding: "8px",
  margin: "8px",
  borderRadius: "8px",
};

export const IncompleteTodos = (props) => {
  return (
    <div style={style}>
      <p className="title">未完了のTODO</p>
      ...
    </div>
  );
};
```

CSS で書いていた `border-radius` が、JS オブジェクトの中では `borderRadius`（キャメルケース）になる。ハイフンをつなぎ合わせたプロパティ名はすべてこの形式に変わる。

### className でクラスを当てる

`CompleteTodos` コンポーネントでは、外部 CSS ファイルのクラスを `className` で当てている：

```jsx
export const CompleteTodos = (props) => {
  return (
    <div className="complete-area">
      ...
    </div>
  );
};
```

HTML では `class="complete-area"` と書くが、React（JSX）では `className="complete-area"` になる。`class` は JS の予約語なので。

### React でのスタイリング使い分け

| 方法 | 書き方 | 向いているケース |
|---|---|---|
| インラインスタイル | `style={{ color: 'red' }}` | コンポーネント固有・動的な値 |
| className（外部CSS） | `className="complete-area"` | 複数箇所で共通のスタイル |
| CSS Modules | `className={styles.card}` | クラス名の衝突を防ぎたい大きめのプロジェクト |

---

## 4. Vanilla JS と React でスタイルを当てる考え方の違い

Vanilla JS ではこう書く：

```js
// スタイルを直接書き換える
const box = document.querySelector('.box');
box.style.backgroundColor = 'red';

// クラスを付け外しして切り替える
element.classList.add('active');
element.classList.toggle('active');
```

React ではこう書く：

```jsx
const [isActive, setIsActive] = useState(false);

return (
  <button
    className={isActive ? 'active' : 'default'}
    onClick={() => setIsActive(!isActive)}
  >
    Toggle
  </button>
);
```

Vanilla JS は「要素を取ってきて変える」。React は「状態を変えると表示が自動で変わる」。

やりたいことは同じ（クラスを付けたり外したりする）でも、アプローチが根本的に違う。

TODO アプリを両方の書き方で実装したことで、この違いが体感としてつかめた。コンポーネントを分けて props で引き渡す React の書き方と、CSS をどう当てるかがつながった感覚があった。

---

## まとめ

| 学んだこと | ポイント |
|---|---|
| id と class の役割 | id = JS が取得する用（1つ）、class = CSS が当てる用（複数OK） |
| CSS 基本構造 | セレクタ・プロパティ・値の3点セット |
| ボックスモデル | padding（内側）と margin（外側）の違いを把握するとレイアウトが読める |
| React でのスタイリング | インラインスタイル（オブジェクト）と className の使い分け |
| JS と React の違い | DOM直接操作 vs state 変化による再レンダー |

CSS は難しいというイメージがあったけど、「構造」として見ると意外とシンプルだった。
TODO アプリという具体的な題材があったから、頭に入ってきた気がする。

次回 ser.5 は、CSS をより実践的に「書く」回——実際のコンポーネントで試したことをまとめます。

---

## 参考

- 前回記事：[【小脳記憶 ser.3】音楽生成AIのAPI検証記録](https://qiita.com/uno22/items/b8bbae461a65811638ea)
- 使った教材：[【React18対応】モダンJavaScriptの基礎から始める挫折しないためのReact入門（Udemy）](https://www.udemy.com/course/modern_javascipt_react_beginner/)
