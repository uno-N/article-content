---
title: JavaScriptとは？——ボタンを押したら動くWebページを作る
platform: note
membership: false
tags: ["ICT", "JavaScript", "医療職", "超入門", "プログラミング"]
---

HTMLとCSSで、見た目のあるページは作れました。

でも、ボタンを押しても何も起きない。

「動き」をつけるのがJavaScriptです。

---

ICTを学びたいと思いながら、どこから手をつければいいかわからない。
そういう医療職の人に向けて書いています。

私は訪問看護師をしながら、音楽療法アプリをゼロから開発しています。
非エンジニア・文系・コード歴2年未満。

---

## この記事でできるようになること

- JavaScriptとは何かがわかる
- ボタンをクリックしたら文字が変わるページを作れる
- 変数・関数・イベントの基本がわかる

**前提：HTML・CSSの記事を読んでいればOK。**

---

## JavaScriptとは何か

JavaScriptは、Webページに**動き**をつける言語です。

- ボタンを押したら文字が変わる
- 入力した内容を処理して表示する
- 画像がスライドする

これらはすべてJavaScriptで動いています。

HTMLが「骨格」、CSSが「見た目」、JavaScriptが「動き」。3つ合わさってWebページができています。

---

## 実際に動かしてみる

前回作った `html-practice` フォルダをVSCodeで開きます。

`index.html` の `<body>` を以下に書き換えて保存します。

```html
<body>
    <h1 id="message">ボタンを押してみて</h1>
    <button id="myButton">押す</button>

    <script>
        const button = document.getElementById("myButton");

        button.addEventListener("click", function() {
            document.getElementById("message").innerText = "押せました！";
        });
    </script>
</body>
```

ブラウザで開いてボタンを押すと、文字が「押せました！」に変わります。

---

## コードを読む

### `<script>` タグ

```html
<script>
    /* ここにJavaScriptを書く */
</script>
```

`<script>` タグで囲まれた部分がJavaScriptです。HTMLファイルの中に直接書けます。

### 変数——名前をつけて値を保存する

```javascript
const button = document.getElementById("myButton");
```

`const button` は「buttonという名前の箱を作る」という意味です。
その箱の中に `document.getElementById("myButton")`（HTMLの中から `id="myButton"` の要素を探してくる）の結果を入れています。

`const` は「変わらない値を入れる箱」です。後から変えたいときは `let` を使います。

```javascript
const name = "Yuno";   // 変わらない
let count = 0;         // 後で変える可能性がある
```

病棟で言えば、`const` は患者IDのように固定のもの、`let` はバイタル値のように変化するものです。

### 関数——処理をひとまとめにする

```javascript
button.addEventListener("click", function() {
    document.getElementById("message").innerText = "押せました！";
});
```

`function() { }` の `{}` の中に「クリックされたらやること」を書きます。

`addEventListener("click", ...)` は「クリックされたら、この処理を実行して」という登録です。

急変時の対応フローを事前に決めておくのと同じです。「急変したら（クリックされたら）→ この手順で動く（function内の処理）」。

### `innerText`——テキストを書き換える

```javascript
document.getElementById("message").innerText = "押せました！";
```

`id="message"` の要素のテキストを「押せました！」に書き換えています。

---

## もう少し試してみる

クリックするたびにカウントが増えるボタンを作ってみます。

```html
<body>
    <p id="count">0回押しました</p>
    <button id="countButton">押す</button>

    <script>
        let count = 0;
        const button = document.getElementById("countButton");

        button.addEventListener("click", function() {
            count = count + 1;
            document.getElementById("count").innerText = count + "回押しました";
        });
    </script>
</body>
```

`let count = 0` で最初は0。クリックのたびに `count = count + 1` で1ずつ増えます。

---

## まとめ

| 学んだこと | ポイント |
|---|---|
| JavaScriptとは | Webページに動きをつける言語 |
| `const` / `let` | 値を保存する箱。constは固定、letは変化する |
| `getElementById` | HTMLの要素をidで探す |
| `addEventListener` | 「〇〇されたらこの処理を実行」を登録する |
| `innerText` | テキストを書き換える |

次は「Git・GitHub」——作ったコードを保存・管理・公開する仕組みを理解します。

---

**次の記事：**
[GitとGitHubとは？——コードを「保存・公開・共有」する仕組みをゼロから理解する](準備中)
