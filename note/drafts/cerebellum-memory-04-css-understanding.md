---
title: 看護師がCSSを理解した日——「どこで何が触れるかわからない」から抜け出したはなし
platform: note
membership: true
tags: ["ICT", "プログラミング", "医療職", "独学", "CSS"]
---

ランディングページの修正指示が来た。

「ここのフォントを変えて」
「このブロックの余白を調整して」

パソコンの画面を前に、どこをどう触ればいいのかがまったくわからなかった。

Notionのweb作成機能とWraptasを使ったページだった。CSSという言葉は聞いたことがあった。でも「どこに書くもの」で「何に効くもの」で「どういう構造をしているのか」——何もわかっていなかった。

手探りで触っては「なんか変になった」を繰り返して、結局その案件を終えた。

あの詰まり方、覚えてる人いますか。

---

ICTを学びたいと思いながら、どこから手をつければいいかわからない。
そういう医療職の人に向けて書いています。

私は訪問看護師をしながら、音楽療法アプリをゼロから開発しています。
非エンジニア・文系・コード歴2年未満。

「同じ立場で少し先にいる人」として、実際に詰まったことと、それがどう解決されたかを残しています。

---

## Udemyで、やっとわかった

あのLP修正で詰まってから半年後。

Udemyで「モダンJavaScriptの基礎から始めるReact入門」というコースを受けながら、TODOアプリをHTML・CSS・JavaScriptで作った。

コードを書きながら、ある瞬間に「あ、そういうことか」と思った。

「idとclassって、こうやって使うんだ」

CSSのクラスが、HTMLのどの要素に効いているか。
JSがどの要素を「つかんで」いるか。
それが構造として見えた瞬間だった。

---

以下、メンバーシップ限定です。

- CSS の基本構造（セレクタ・プロパティ・値）を看護師目線で解説
- id と class の違いを、「患者ID」と「病棟名」で整理する
- Vanilla JS と React での書き方の違い
- 実際に書いたコードと「ここで詰まった」ポイント

---

<!-- noteのメンバーシップ有料ライン -->

## CSS の構造を「患者IDと病棟名」で整理した

コードを読んでいると、`id` と `class` という言葉が出てくる。

最初は違いがわからなかった。でも、こう考えたらスッと入った。

```
id    = 患者ID（その人だけに使う、ユニークな識別子）
class = 病棟名・診断名（同じグループをまとめる名前）
```

実際に書いたHTMLがこれ：

```html
<input id="add-text" placeholder="TODOを入力" />
<button id="add-button">追加</button>

<div class="input-area"> ... </div>
<div class="list-row"> ... </div>
<div class="list-row"> ... </div>
```

`id="add-text"` はJavaScriptが「この要素をピックアップ」するための名前。
ページ内に1つしか存在しない。

`class="list-row"` はCSSが「これら全部に同じスタイルを当てる」ための名前。
同じクラス名の要素がいくつあっても全部に効く。

「あの患者さんの記録」は患者IDで特定する。
「内科病棟の患者全員に連絡する」は病棟名でまとめる。

それと同じ構造だった。

---

## CSS は「誰に・何を・どう」という処方箋

CSSの書き方の基本はこう：

```css
.list-row {
  display: flex;
  align-items: center;
}
```

- `.list-row` → **誰に**（クラス名で対象を指定）
- `display` → **何を**（何を変えるか）
- `flex` → **どう**（どう変えるか）

「この患者に・この薬を・この量で」という処方に似てる、と思った。

実際に書いたCSSの一部：

```css
.input-area {
  background-color: #c6e5d9;
  width: 400px;
  padding: 8px;
  margin: 8px;
  border-radius: 8px;
}
```

これで `class="input-area"` のついたHTML要素に、背景色・幅・余白・角丸が一括で適用される。

---

## 余白が「内と外」で違う、ということ

「なんかずれる」「思ったより大きい」——これで詰まったことがあると思う。

原因のほとんどは、paddingとmarginの違いがわかっていないこと。

```
padding = 内側の余白（背景色が入る・本人の空間）
margin  = 外側の余白（透明・他者との距離）
```

患者さんの「パーソナルスペース」と「他の人との距離」、みたいなイメージ。

`.input-area` に `padding: 8px` と `margin: 8px` を両方書いたとき、「ああ、全然別の概念なんだ」と初めてわかった。

---

## React に来たとき、スタイルの書き方が変わった

同じTODOアプリを、今度はReactで作り直した。

そこで「え、書き方が違う」となった。

Reactでは、CSSのスタイルをJavaScriptのオブジェクトとして書く方法がある：

```jsx
const style = {
  border: "2px solid #aacfd0",
  borderRadius: "8px",   // ← ハイフンがキャメルケースに変わる
  padding: "8px",
};
```

CSSでは `border-radius` だったのが、Reactオブジェクトの中では `borderRadius` になる。

「なぜ？」と思ったけど、理由はシンプル。
JavaScriptではハイフンが「引き算」と混同されるから。

あと、`class` は `className` に変わる：

```jsx
<div className="complete-area">
```

HTMLでは `class="complete-area"` なのに、JSXでは `className`。
これも `class` がJavaScriptの予約語だから。

最初は「なんで変えるの」と思ったけど、理由を知ると納得できた。

---

## Vanilla JS と React の、根本的な違い

ここが一番「あ、そういう設計なんだ」と思ったところ。

**Vanilla JSでスタイルを変えるとき**はこう書く：

```js
element.classList.add('active');
element.classList.toggle('active');
```

要素を直接つかんで、クラスを付けたり外したりする。

**Reactでスタイルを変えるとき**はこう書く：

```jsx
const [isActive, setIsActive] = useState(false);

<button className={isActive ? 'active' : 'default'}>
```

「状態（isActive）が変わると、表示が自動で変わる」という設計。
要素を直接触らない。

やりたいことは同じ（ボタンの見た目を切り替える）でも、考え方の起点が違う。

このTODOアプリを両方で書いたことで、「なぜReactでdocument.querySelectorを使ってはいけないのか」がやっとわかった。

---

## ICTを独学する看護師へ

CSSが難しいのは、「何がわからないかわからない」状態が続くから、だと思う。

でも、実際に動くアプリを作りながら詰まると、「あ、ここがわかっていなかったんだ」が言語化できるようになる。

Udemyのコースで手を動かしながら、少しずつそれが積み上がっていった。

難しい、というより「まだ見えていないだけ」だった。

次は、CSSを実際のコンポーネントに「書く」作業の話を書きます。

---

**使った教材：**
[【React18対応】モダンJavaScriptの基礎から始める挫折しないためのReact入門（Udemy）](https://www.udemy.com/course/modern_javascipt_react_beginner/)

**Zenn版（コード詳細）：**
https://zenn.dev/uno22/articles/cerebellum-memory-04-css-understanding
