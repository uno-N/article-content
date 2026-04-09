---
title: 【小脳記憶 ser.1】React環境構築を読めるようにする - HTMLとJavaScriptから -
tags:
  - HTML
  - JavaScript
  - 初心者
  - フロントエンド
  - React
private: false
updated_at: '2026-04-09T23:57:43+09:00'
id: b516609b9bb9c774c892
organization_url_name: null
slide: false
ignorePublish: false
---

みなさんこんにちは。
平凡な訪問看護師が、アプリ開発の実装過程で読めなかったところを読めるまでやる「小脳記憶シリーズ」です。

私たちにはきっと、基礎から応用まで隅々までしっかり学習をしている時間がありません。でも、作りたいものは作りたい。

そんな時は、作りながらつまづいた所を具体的に体系的に理解する。これで今、私に必要な理解のみ蓄積されていき、真っ直ぐ私の「読める」につながっていきます。
医療者の方々は、事例検討会だと思って読み進めていってください。

---

## 0. 読めれば作れる時代になった

今、個人開発は **読めれば作れる時代** になった。

私はAIの力を借りながらコードがほとんどわからない状態で「PDFを自動でテキスト格納」や「看護研究用入力アプリ」、「姿勢改善椅子」など、仕事で使うツールやプロトタイピングを作成してきました。
その経験からすると、AIがコードを書いてくれても、**作りたいものは、コードが読めなきゃ作れない。**

では、「読める」とはどんな状態のことか？

### 0-1. 自走ができる状態

自走ができるとは、自分で適切に調べて解決できる状態です。
自走ができる人は、必ず、プログラミングの文法だけでなく、処置の流れや問題点、そもそもの原則を理解でき、何を解決しなくてはいけないか、そのプログラムを取り巻く背景を理解できています。

> **読める ＝ 原則・背景理解ができる ＝ 何を解決すべきかわかる**

では「読める」になるためには？

### 0-2. 読めるために、小脳記憶まで頑張る

そう、結局近道はない。膨大な情報に考えながら触れていくしかないのです。途方もなく、やる気の削ぐ話ですね、笑。

こんな話があります。

私の母校である自治医科大学には、JFC（JichiFolksongClub）という軽音学部があります。そこに一人の医学部の先輩がいました。歌唱に倍音があって力づよくロックにすごくあってる声の持ち主です。しかし、その先輩は歌詞を間違えることで有名で、「海馬壊死ニキ」と仲良い仲間からいじられることがありました（海馬は短期記憶を司っています）。

私も、ギターボーカルをしていたので、コード進行をよく間違えたり曲展開がわからなくなったりすることがありました。私も海馬壊死界隈やな、と思っていた時、リードギターのスペシャリストの先輩から、**「ギターは小脳記憶でやって歌に集中するんだよ。」** と言われたことがあります。

**小脳記憶**とは、無意識下でも体が動くということです。
小脳記憶になる工程は、簡単に言うと体で覚えるまで何度もやる。何度もやった動きのズレを小脳が記憶しその動きを最適解に置き換えて記憶してくれます。

これは基本的には運動に対して起こる反応です。
今、私は「小脳記憶にする」というかっこいい行動をしてるんだ、と。
今までの行動が知的なフレーズに置き換わったことにより練習が超加速したのを覚えています。

さぁ、みんなで唱えましょう。
**「小脳記憶までやりますね。」**

---

## 1. この記事のゴール

この記事は開発日記#2でわからなかった・触れなかった所を学習しています。

### 1-1. この記事で読めるようになること

React環境構築で登場した、ブラウザ、html、JavaScript、Reactこれらについて理解を深めていきます。

- ブラウザでプログラムが表示されるしくみ
- HTMLの「構造」
- JavaScriptの「動き」
- Reactが何を自動化しているのか

### 1-2. 使った教材

最初、「ブラウザのしくみ」を読みました。でも、新しい単語が多すぎて既存情報との統合ができない、、。まずは以下の本を読みました。

- 📚 スラスラ読める JavaScript ふりがなプログラミング（ふりがなプログラミングシリーズ）
- 📺 【React18対応】モダンJavaScriptの基礎から始める挫折しないためのReact入門（Udemy）

---

## 2. JavaScriptとHTMLだけでWebページを作る

ReactはJavaScriptとHTMLの面倒な部分を自動化してくれるライブラリでした。そのため、JavaScriptとHTMLの基礎が理解できているとReactを理解して動かせるようになります。

では、JavaScriptとHTMLのみで、Webページを作ります。

### 2-1. 【実装】HTMLファイルを作って表示する

デスクトップにHTMLファイルを作ります。

#### 2-1-1. まず、フォルダ（ディレクトリ）を作る

```bash
# デスクトップへ移動
cd ~/Desktop

# html-basicsという名前のフォルダを作成
mkdir html-basics

# そのフォルダに移動
cd html-basics
```

#### 2-1-2. VS Codeで html-basics を開く

VS Codeのメニューバー：ファイル → 開く → デスクトップにある「html-basics」を開く。

#### 2-1-3. html ファイルを作成する

新しいファイルを作るをクリックし、任意の名前を入力（拡張子は `.html`）。

以下のコードを貼り付け、自分の好きなように文字を入力してみましょう。

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title></title>
</head>
<body>
    <h1></h1>
    <p></p>
</body>
</html>
```

ファイルを保存：Command+S（Mac）か、ファイルから保存。

#### 2-1-4. ブラウザで開く

1. VS Codeの左側で `step1.html` を右クリック
2. 「Finderで表示する」を選択
3. そのファイルをダブルクリック

入力した文字がどこに表示されているか確認しましょう。

### 2-2. 【知識】HTMLの構成要素

あれ？`<title></title>` の間の文字は表示されないの？

**表示されません！**

`<title>` は `<head>` というページ設定内の要素のため、ブラウザの画面には表示されず、タブに表示されます。ブックマークすると、そのタイトルが保存されます。

#### 2-2-1. HTMLの骨組み

```
HTMLの骨組み
├── <!DOCTYPE html>（宣言）
└── <html>（全体の箱）
    ├── <head>（ページ設定情報、目に見えない）
    │   ├── <meta charset="UTF-8">（文字化け防止）
    │   └── <title>（タブに表示）
    └── <body>（実際に表示される内容）
        ├── <h1>（大見出し）
        └── <p>（段落）
```

#### 2-2-2. タグについて

`<>` で囲まれた文字は**タグ**といい、その部分がどういう意味なのか設定します。
`<>` と `</>` で始まりと終わりをつけることもできます。
後から出てきますが、このタグの構造を**DOM構造**といい、このタグを指定するおかげで何をどう表示するかわかる仕組みになっています。

**`<head>`：ページ設定（目に見えない）**
- `<title>`: タブに表示されるタイトル
- `<meta>`: 文字コードなどの設定、CSS（スタイル）の読み込み、JavaScriptの読み込みができる

**`<body>`：表示内容（目に見える）**
- `<div>`：要素をまとめる箱
- `<h1>`, `<h2>` など：見出し
- `<p>`：段落
- `<button>`：ボタン
- `<img>`：画像

### 2-3. 【実装】JavaScriptで文字を変える（動きをつける）

HTMLだけだと「静止画」です。ボタンを押しても何も起きません。
JavaScriptを使うと「動き」をつけられます。

#### 2-3-1. 新しいファイルを作成

同様にファイルを作成し拡張子 `.html` で名前をつける。
以下のコードを貼り付けます：

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Step2: ボタンで文字を変える</title>
</head>
<body>
    <h1>ボタンをクリックしてみよう</h1>
    <p id="message">まだクリックされていません</p>
    <button id="changeButton">クリック！</button>

    <script>
        // 1. ボタン要素を取得（DOMツリーから探す）
        const button = document.querySelector('#changeButton');

        // 2. クリックされたら実行する関数を登録
        button.addEventListener('click', () => {
            // 3. メッセージ要素を取得
            const message = document.querySelector('#message');

            // 4. 文字を変更
            message.innerText = '小脳記憶で頑張ります！';
        });
    </script>
</body>
</html>
```

保存：Cmd+S

#### 2-3-2. ブラウザで開く

1. `step2.html` を右クリック → 「Finderで表示する」
2. ダブルクリックで開く
3. クリックボタンをクリックしてみる

動きましたね！
このようなことの積み重ねでWebアプリは作られているようです。

### 2-4. 【理解】JavaScriptで何が起きているか

理解すべきは2つの流れ：

1. ブラウザで起こってること
2. HTML・素のJavaScriptで書かれているコードがどのように処理されているか

#### 2-4-1. ブラウザの中身

```
ブラウザ（Chrome、Safari、Edgeなど）
│
├─ ユーザーインターフェース
│  └─ タブ、アドレスバー、ボタン
│
├─ ブラウザエンジン（全体の司令塔）
│
├─ 【レンダリングエンジン】★（HTML/CSSを画面に表示する担当）
│  ├─ HTMLパーサー（HTMLを読み取る）
│  ├─ CSSパーサー（CSSを読み取る）
│  ├─ DOMツリー（作られたデータ構造）
│  ├─ CSSOMツリー（CSSのデータ構造）
│  ├─ レンダーツリー（表示用の構造）
│  ├─ レイアウト（配置計算）
│  └─ ペイント（描画）
│
├─ JavaScriptエンジン（JavaScriptを実行）
│  └─ V8（Chromeの場合）
│
├─ ネットワーク
└─ データ保存
```

#### 2-4-2. HTMLがブラウザに表示される仕組み

1. HTMLファイルを読み込む
2. HTMLパーサーがHTMLを解析してDOMツリーを作成
3. レイアウト計算 → ペイント → 画面に表示

#### 2-4-3. HTMLをパースし、DOMツリーを作成する

「パースする」とは、プログラムがHTMLやJSONなどのテキストデータを解析し、プログラムで扱える形式（データ構造）に変換する処理。

```
【DOMツリー】（木構造）に変換
   <html>
     └─ <body>
         ├─ <h1>
         ├─ <p id="message">
         └─ <button id="changeButton">
```

#### 2-4-4. DOMツリーを画面に描画する

```
1. HTMLパーサーがHTMLを読み取る
   ↓
2. DOMツリー（木構造のデータ）を作成
   document
     └─ html
         └─ body
             ├─ h1 "ボタンをクリックしてみよう"
             ├─ p (id="message") "まだクリックされていません"
             └─ button (id="changeButton") "クリック！"
   ↓
3. レイアウト計算
   各要素のサイズと位置を計算
   ↓
4. ペイント（描画）
   計算結果を画面に実際に描く
   ↓
   ブラウザに表示される
```

#### 2-4-5. HTML・JavaScriptがどのように処理されているか

JavaScriptは `<script>` タグで囲われた中にあります。順番に見ていきます。

**① ボタン要素を取得（DOMツリーから探す）**

```javascript
const button = document.querySelector('#changeButton');
// document.querySelector()：HTMLの中から特定の要素を探し出す命令
// # ：「idで探してください」という意味の記号
```

`button` と名前をつけた箱に、`id=changeButton` というタグをDOMツリーから探して入れる、という定義。

HTMLでは：
```html
<button id="changeButton">クリック！</button>
```

**② クリックされたら実行する関数を登録**

```javascript
button.addEventListener('click', () => {
    const message = document.querySelector('#message');
    message.innerText = '小脳記憶で頑張ります！';
});
// addEventListener：〇〇されたら、この処理を実行して
// 今回は"click"というイベントを観察
```

さっき定義した `button` がクリックされたら `message` の中身（テキスト）を書き換えます。

---

## 3. Reactで同じWebページを作る

### 3-1. 【実装】Reactで動きをつける

前回の開発日記でReact開発環境を作ったのでそのフォルダを使用していきます。

#### 3-1-1. フォルダをVSCodeで開く

```bash
cd ~/Desktop
cd my-first-react-app
```

#### 3-1-2. App.js を編集する

Reactは拡張子 `.js` か `.jsx` のファイルに記入していきます。
`src/App.js` を開いて以下にコピペしてください。

```jsx
// 1. import：外部モジュールを読み込む
import { useState } from 'react';
import './App.css';

// 2. export：外部から使えるように出力
export const App = () => {
  // 3. 状態管理（自動で画面更新してくれる）
  const [message, setMessage] = useState('まだクリックされていません');

  // 4. ボタンがクリックされたら実行される関数
  const Click = () => {
    setMessage('小脳記憶で頑張ります！');
  };

  // 5. 画面に表示するHTML構造（JSX）
  return (
    <div className="App">
      <header className="App-header">
        <h1>ボタンをクリックしてみよう</h1>
        <p>{message}</p>
        <button onClick={Click}>クリック！</button>
      </header>
    </div>
  );
};
```

#### 3-1-3. ブラウザで表示

```bash
npm start
```

このディレクトリにはCSSがかかっているためデザインは違いますが、同じことができました。

### 3-2. 【理解】Reactで何が起きてるか

#### 3-2-1. importとexport

`import` は「他のファイルや機能を持ってくる」命令です。

```javascript
import { useState } from 'react';
import './App.css';
```

`export` は逆に「このファイルで作ったものを外から使えるようにする」命令です。

```javascript
export const App = () => {
  // この中身を動かす関数
};
```

App.js ファイル単体でブラウザが表示されているわけではありません。大きく関わっているのは `index.js` と `App.js` の2つです。

`index.js` の中身：App.js を読み込み、HTMLに描画しています。

```javascript
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

`document.getElementById('root')` で `id=root` を取得し、そこにApp.jsの中身を流し込んでいます。

#### 3-2-2. 状態管理（useState）で画面を作る

```javascript
const [message, setMessage] = useState('まだクリックされていません');
//     ↑表示用    ↑更新用関数         ↑初期値
```

ここがReactの一番の特徴です。`useState` は状態（データ）を管理する仕組み（関数）で、値が変わると自動で画面を更新してくれます。

- `message`（任意の名前）：現在の値を入れた箱名
- `setMessage`（set + 任意の名前）：値を変更するための処理名
- `useState('')`：初期値を設定

素のJavaScriptでは `innerText` で直接DOMを書き換えていましたが、Reactでは `setMessage` で値を更新するだけで、あとは自動で画面が書き変わります。

:::note info
素のJavaScriptのことを**バニラJS**というらしく、アイスクリームでいう基本の味がバニラという所からきているそう。
:::

#### 3-2-3. クリック時に実行される関数

```javascript
const Click = () => {
  setMessage('小脳記憶で頑張ります！');
};
```

バニラJSで書いた `addEventListener` に相当する部分です。

**バニラJSでは4ステップ必要でしたが：**
1. ボタンを探す（getElementById）
2. イベントを登録する（.addEventListener('click',)）
3. 要素を探す（document.querySelector('#')）
4. テキストを書き換える（.innerText = ""）

**Reactでは更新コードは `setMessage` の1行だけです。**

#### 3-2-4. 【雰囲気だけ掴めればOK】Reactの状態管理の注意点

Reactはstateが「別物の配列に変わった」ことで変化を検知します。
`push` で中身を書き換えるだけでは同じ配列のままなので検知できません。

```javascript
const allMessages = ['まずは基礎から！', '反復練習あるのみ！', '小脳記憶で頑張ります！'];

const [message, setMessage] = useState([allMessages[0]]);

// ❌ NG（変化を検知できない）
const ClickNG = () => {
  message.push(allMessages[message.length]);
  setMessage(message);
};

// ✅ OK（新しい配列を作って渡す）
const Click = () => {
  // ...はmessageの値を先頭から終わりまで配列で展開するという意味
  const newMessage = [...message, allMessages[message.length]];
  setMessage(newMessage);
};
```

:::note warn
useStateを使用するときは、中身を**新しい配列に並べ直してから**、更新関数を使用する。

- ❌ NG：`message.push(); setMessage(message);` — 同じ配列をそのまま渡している
- ✅ OK：`const newMessage = [...message, 新要素]; setMessage(newMessage);` — スプレッド構文で必ず新しい配列を作ってから渡す
:::

#### 3-2-5. 画面に表示するHTML構造（JSX）

`return` 以下が画面に表示される内容です。

```jsx
return (
  <div className="App">
    <header className="App-header">
      <h1>ボタンをクリックしてみよう</h1>
      <p>{message}</p>  {/* {}でJS変数を扱える */}
      <button onClick={Click}>クリック！</button>
    </header>
  </div>
);
```

- `{message}` → `{}` を使うとJSの変数を扱うことができる
- `onClick={Click}` → ボタンがクリックされると `Click` 関数が動き出す
- return の中はHTMLのように見えますが、**JSX**というJavaScript専用の書き方

| | バニラHTML | JSX（React） |
|---|---|---|
| クラス指定 | `class="App"` | `className="App"` |
| クリックイベント | `onclick="関数()"` | `onClick={関数}` |
| JS変数の表示 | `document.write(変数)` | `{変数}` |

---

## 4. Reactが何を自動化しているのか

### 4-1. バニラJSとReactの比較

同じ「ボタンを押したらテキストが変わる」処理でも、書き方がかなり変わりましたね。

**バニラJS**

```javascript
// 要素を自分で探す
const button = document.querySelector('#changeButton');
const message = document.querySelector('#message');

// イベントを自分で登録する
button.addEventListener('click', () => {
  // DOMを自分で書き換える
  message.innerText = '小脳記憶で頑張ります！';
});
```

**React**

```javascript
// 状態を定義するだけ
const [message, setMessage] = useState('まだクリックされていません');

const Click = () => {
  setMessage('小脳記憶で頑張ります！'); // 値を変えるだけで画面が更新される
};
```

バニラJSは「DOMを自分で操作する」のに対して、Reactは「**データを更新すれば画面は勝手についてくる**」という考え方です。

アプリが複雑になるほど、このReactの楽さが際立っていくそうです。楽しみ。

---

## 5. まとめ

全く読めなかったReactが、今は、どんなルールがあって、何が関数で変数で引数で、メソッドで、どの順番で処理が行われているかがなんとなく読めるようになってきたように感じます。

皆さんにもその感覚になるような記事になっていたら嬉しいです。

### 5-1. 今回の学び

**ブラウザの仕組み**
- ✅ ブラウザの中身 — レンダリングエンジン、JavaScriptエンジンなど役割が分かれている
- ✅ HTMLがDOMツリーに変換される — パースされて木構造のデータになる
- ✅ DOMツリーが画面に描画される — レイアウト計算 → ペイントの順で表示される

**HTMLとJavaScript（バニラJS）**
- ✅ HTMLの骨組み — `<head>`（設定）と `<body>`（表示）の役割の違い
- ✅ idを使った要素の指定 — `document.querySelector('#id')` でDOMツリーから要素を取得
- ✅ addEventListener — イベントを監視して処理を登録する仕組み

**React**
- ✅ importとexport — ファイル間で機能をやり取りする仕組み
- ✅ useState — 値が変わると自動で画面を更新してくれる状態管理
- ✅ JSX — JavaScript の中にHTMLを書ける React 専用の書き方
- ✅ コンポーネント — 画面のUI部品をまとめて使い回せる単位
- ✅ 配列のstate管理 — 必ずスプレッド構文で新しい配列を作ってから渡す

**サックと覚えて使いたいReactコード一覧**

```javascript
// ===== React基礎 =====
export const 関数 = () => {};        // named export
import { 関数 } from '〇〇';         // named exportによるインポートは{}必要

// ===== 状態管理（useState） =====
const [state, setState] = useState(初期値);  // 状態定義
setState(新しい値);                          // 状態更新（画面も自動更新）

// ===== 配列のstate更新（不変性の原則） =====
const newArray = [...oldArray, 新要素];  // 新配列作成して追加
setState(newArray);                      // 必ず新しい配列を渡す

// ===== JSX内でJavaScript使用 =====
<p>{変数名}</p>                    // {}で変数を表示
{条件 && <要素/>}                  // 条件付きレンダリング

// ===== イベントハンドラ =====
const onClick = () => {};                        // 関数定義
<button onClick={onClick}>ボタン</button>        // クリック時に実行

// ===== バニラJS：DOM操作 =====
document.querySelector('#id名');                // id指定で要素取得
element.addEventListener('click', () => {});    // イベント監視
element.innerText = '新しいテキスト';           // テキスト書き換え

// ===== 配列操作 =====
[...array]  // スプレッド構文：配列をコピー
```

### 5-2. 次回の挑戦は、、？

小脳記憶シリーズでは、「CSSをあてるを読めるようになる」をお届けしようと思います。

今回は単にReactでCSSを扱う場合をまとめていきたいと思っています。

次回、**「CSSをあてるを読めるようになる」** をお届けします！
