---
title: 【小脳記憶 ser.6】CRA非推奨→Vite移行 + DESIGN.mdでAIに一貫したUIを作らせる方法
tags:
  - CSS
  - React
  - 個人開発
  - vite
  - ClaudeCode
private: false
updated_at: '2026-04-23T00:00:00+09:00'
id: 4941212b39efb54506e8
organization_url_name: null
slide: false
ignorePublish: false
---

みなさんこんにちは。
平凡な訪問看護師が、アプリ開発の実装過程で読めなかったところを読めるまでやる「小脳記憶シリーズ」です。

今回は診断フェーズの実装を通じて気づいた2つのことを書きます。

1. **Create React App（CRA）が非推奨になっていたのでViteに移行した**
2. **AIに一貫したUIを作らせるには「DESIGN.md」という仕様書が効く**

---

## 0. CRA → Vite に移行した

### 0-1. CRAが非推奨になったのはなぜ？

2025年2月、React公式がCreate React Appのサポート終了を発表しました。

https://ja.react.dev/blog/2025/02/14/sunsetting-create-react-app

理由の一つはビルドツールの問題です。CRAはWebpackを使っており、プロジェクトが大きくなると起動・ビルドがとにかく遅い。
一方のViteはESモジュールをネイティブに扱い、開発サーバー起動がほぼ一瞬とのこと。

| ツール | 起動速度 | 設定 | 特徴 |
|-------|--------|------|------|
| Create React App | 遅い（Webpack） | 隠蔽されている | 非推奨（2025.02〜） |
| **Vite** | **爆速** | **シンプル** | **現在の公式推奨** |
| Next.js | 速い | やや複雑 | SSR/SSG対応 |

### 0-2. Viteへの移行コマンド

```bash
# プロジェクト作成
npm create vite@latest neiro-app -- --template react

# 依存関係インストール
cd neiro-app
npm install

# 開発サーバー起動（http://localhost:5173 で開く）
npm run dev
```

---

## 1. Claude Codeにファイルパスを渡す重要性

### 1-1. 仕様書を渡さずに実装を頼むとどうなるか

MVP仕様書を手元に用意した状態で、Claude Codeに「診断フェーズを実装して」と伝えたところ……仕様書と全然違うものが出てきた。

**なぜか。ファイルパスを指定していなかったから。**

Claude Codeはファイルシステムを自動で読み込むわけではありません。「このファイルを参照して」と明示的に伝えないと、文脈のない状態で実装が走ります。

```bash
# ❌ 仕様書が反映されない
「MVP仕様書から診断フェーズを実装して」

# ✅ 仕様書が反映される
「src/MVP_spec.md を読んで、診断フェーズを実装して」
```

### 1-2. パス指定後の出力

パスを指定して再度依頼すると、仕様書の内容を正確に反映したコンポーネント構成が出てきた。

```
src/
├── components/
│   ├── Welcome.jsx            # ウェルカム画面
│   ├── DiagnosisFlow.jsx      # ステップ管理・状態保持
│   ├── DiagnosisFlow.module.css
│   └── steps/
│       ├── MoodSelect.jsx     # Step1: 気分（Hevner 8分類）
│       ├── EnergySlider.jsx   # Step2: エネルギー値（ADACL尺度）
│       ├── TapTempo.jsx       # Step3: テンポ（CV%でリズム安定性計算）
│       ├── PersonalityCheck.jsx # Step4: 性格タイプ（Eysenck型簡易版）
│       └── Step.module.css    # 全ステップ共通スタイル
```

---

## 2. JSXとCSS Modulesの構造

### 2-1. JSXとは

JSXはJavaScriptの中にHTMLのような記法を書ける構文です。Reactはこれを使ってUIを組み立てます。

```jsx
// MoodSelect.jsx の一部
export default function MoodSelect({ value, onChange }) {
  const moods = [
    { id: 'happy', emoji: '😄', label: '明るい' },
    { id: 'calm',  emoji: '😌', label: '穏やか' },
    // ...
  ]

  return (
    <div className={styles.moodGrid}>
      {moods.map(mood => (
        <button
          key={mood.id}
          className={`${styles.moodCard} ${value === mood.id ? styles.selected : ''}`}
          onClick={() => onChange(mood.id)}
        >
          <span className={styles.emoji}>{mood.emoji}</span>
          <span className={styles.moodLabel}>{mood.label}</span>
        </button>
      ))}
    </div>
  )
}
```

### 2-2. CSS Modulesとは

CSS Modulesを使うと、スタイルをコンポーネント単位でスコープできます。クラス名の衝突を防げるのが主なメリットです。
CSS書かない私としてはそんなこともあるんだ、という気持ちです。

```css
/* Step.module.css */
.moodCard {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
}

.moodCard.selected {
  background: rgba(255, 255, 255, 0.20);
  border-color: rgba(255, 255, 255, 0.60);
}
```

```jsx
// コンポーネント側でimport
import styles from './Step.module.css'

// 使い方
<div className={styles.moodCard}>
```

---

## 3. DESIGN.mdでAIに一貫したUIを作らせる

### 3-1. コンポーネントをまたいだスタイルの一貫性問題

https://x.com/L_go_mrk/status/2040394702147527059

このツイートから、有名デザインを提供してるリポジトリがあると知った。

### 3-2. awesome-design-md の発想

GitHubリポジトリ [awesome-design-md](https://github.com/VoltAgent/awesome-design-md) 。
Notion・Linear・Figmaなど有名プロダクトのデザインシステムを、AIが読めるMarkdown形式でまとめたもの。

これをAIに渡すと「そのプロダクトのスタイルで実装して」が一発で通るようになります。

### 3-3. NEIRO-DESIGN.md を作った

ねぃろ用に `NEIRO-DESIGN.md` を作成しました。内容はこんな構成です。

```markdown
## Visual Philosophy
アイスブルーのグラデーション背景に浮遊するオーブ、ガラスカードが漂う空間。

## Background
background: linear-gradient(135deg, #1a3a5c 0%, #2d6a9f 50%, #4a90c4 100%);

## Color
| Token | Value | 用途 |
| accent | #7ec8e3 | stepラベル・スライダー |
| text-primary | #f7f8f8 | 見出し |

## Typography
Inter + Noto Sans JP
weight: 590（見出し）/ 510（UIテキスト）/ 400（本文）

## Glass Card Spec
background: rgba(255,255,255,0.08);
backdrop-filter: blur(20px);
border: 1px solid rgba(255,255,255,0.12);

## Agent Prompt（AIに渡すコピペ用テキスト）
...
```

**これを一度作っておけば、新しいコンポーネントを追加するたびに「NEIRO-DESIGN.mdを読んで実装して」と伝えるだけでスタイルが統一できます。**

### 3-4. 試したスタイル3パターン

実際には3パターン試して最終を決めました。

**① アイスブルー単独**

```css
background: linear-gradient(135deg, #1a3a5c 0%, #4a90c4 100%);
/* 浮遊オーブ + ガラスカード */
```

癒し感はある。でも「もう少し整理されてる感じ」がほしかった。

**② Notionスタイル**

[![Image from Gyazo](https://i.gyazo.com/0f93b9da59925102cdc3207b58687eb5.png)](https://gyazo.com/0f93b9da59925102cdc3207b58687eb5)

```css
background: #f6f5f4;
color: #37352f;
box-shadow: 0 1px 3px rgba(0,0,0,0.04);
```

読みやすく温かみがある。でもガラスっぽさが消えた。

**③ Linearスタイル**

[![Image from Gyazo](https://i.gyazo.com/c54b5b7318aebd1a7722dec6a54550d9.png)](https://gyazo.com/c54b5b7318aebd1a7722dec6a54550d9)

```css
font-weight: 510; /* Linear独自の繊細なウェイト */
letter-spacing: -0.04em;
border: 1px solid rgba(255,255,255,0.12);
```

精緻でシャープ。ただし背景が暗すぎてねぃろの世界観と合わなかった。

**確定：アイスブルー × Linear（B-style）**

アイスブルーの背景 + Linearのタイポグラフィ・ボーダー設計を組み合わせた。

[![Image from Gyazo](https://i.gyazo.com/5fa3c0f0e3fd29c68402d25f4d3f9d00.jpg)](https://gyazo.com/5fa3c0f0e3fd29c68402d25f4d3f9d00)

```css
/* 背景（アイスブルー） */
background: linear-gradient(135deg, #1a3a5c 0%, #2d6a9f 50%, #4a90c4 100%);

/* カード（Linearの輝度ステッキング発想） */
background: rgba(255, 255, 255, 0.08);   /* L2レベル */
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.12);
border-radius: 12px;

/* タイポグラフィ（Linearの510/590体系） */
font-weight: 590; /* 見出し */
font-weight: 510; /* UIテキスト・強調 */
```

---

## 4. Glassmorphism の実装詳細

### 4-1. 浮遊オーブ

背景に3つのオーブを配置します。CSSの擬似要素（`::before`, `::after`）とアニメーションで実装。

```css
/* App.css */
.app::before {
  content: '';
  position: fixed;
  width: 480px;
  height: 480px;
  border-radius: 50%;
  background: radial-gradient(circle at center, rgba(255,200,100,0.28) 0%, transparent 65%);
  top: -120px;
  left: -100px;
  animation: floatA 14s ease-in-out infinite;
  pointer-events: none;
}

@keyframes floatA {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.12) translate(20px, 15px); }
}
```

3つのオーブをそれぞれ色・サイズ・位置・アニメーション周期を変えて配置することで、静止画でも空間に深みが出ます。

### 4-2. 選択状態のトランジション

ボタン選択前後の輝度差を設計することで、インタラクションを視覚的に伝えます。

```css
/* 未選択 */
.optionBtn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.5);
}

/* 選択済み */
.optionBtn.selected {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.55);
  color: #f7f8f8;
  font-weight: 510;
}
```

`border-color` が 0.08 → 0.55 に跳ね上がることで、選択済みが明確に伝わります。

---

## 5. まとめ

### 5-1. 今回の学び

**Vite移行**
- ✅ `npm create vite@latest` で一発作成
- ✅ 起動コマンドが `npm start` → `npm run dev`
- ✅ 速度・設定のシンプルさともにCRAより上

**Claude Codeとファイル参照**
- ✅ 仕様書はパスを明示して渡す：「仕様書を読んで」だけでは動かない。ファイルの住所（パス）まで指定して初めて読んでくれる
- ✅ 「{パス}を読んで実装して」が基本形

**DESIGN.md運用**
- ✅ 色・フォント・ボーダー・コンポーネントCSSを一か所に集約
- ✅ 新コンポーネント追加のたびに「NEIRO-DESIGN.mdを読んで」と渡す
- ✅ awesome-design-mdを参考に自分用を作るのがおすすめ

**Glassmorphism設計**
- ✅ 輝度ステッキング：L1（0.06）→ L2（0.08〜0.10）→ L3（0.18）の3段階
- ✅ 選択状態はborder-colorの変化で明示する
- ✅ `backdrop-filter: blur(20px)` は必須

### 5-2. つまずきポイントと解決法

**Claude Codeが仕様書を無視する：**
ファイルパスを明示的に渡す。「この仕様書を読んで実装して」。

**UIが毎回バラバラになる：**
DESIGN.mdを先に作る。色・ウェイト・ボーダーの値を全部書いておく。

**「なんかしっくりこない」が言語化できない：**
試せばわかる。2〜3パターン出して比べる。比較するとすぐ決まる。

### 5-3. 次回の挑戦は、、？

音楽生成フェーズへの接続。診断結果をLyria RealTime APIのパラメータに変換して、実際に音楽を鳴らす。

次回、**ねぃろ 音楽生成フェーズ接続編！** お楽しみに！
