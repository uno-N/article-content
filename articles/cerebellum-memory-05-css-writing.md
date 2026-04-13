---
title: "【小脳記憶 ser.5】CSS を自分で書く——ねぃろのUIスタイリング実践記録"
emoji: "✍️"
type: "tech"
topics: ["css", "react", "cssmodules", "初心者", "個人開発"]
published: false
---

みなさんこんにちは。
平凡な訪問看護師が、アプリ開発の実装過程で読めなかったところを読めるまでやる「小脳記憶シリーズ」です。

今回は CSS を実際に書いた記録です。前回（ser.4）で構造を学んで、今回はねぃろのUIに自分でスタイルを当てていきます。

:::message
この記事は [小脳記憶 ser.4](https://zenn.dev/uno22/articles/cerebellum-memory-04-css-understanding) の続きです。
:::

---

## 0. 今回やること

<!-- TODO: 何を実装するか書く -->
<!-- - どのコンポーネントのスタイルを書くか -->
<!-- - 目標とするデザイン -->

---

## 1. CSS Modules の基本

<!-- TODO: CSS Modules の使い方を書く -->
<!-- - ファイル命名規則（*.module.css） -->
<!-- - import の仕方 -->
<!-- - styles.xxx の使い方 -->

```jsx
// 例
import styles from './Component.module.css'

export default function Component() {
  return <div className={styles.container}>...</div>
}
```

---

## 2. 実装したスタイル

<!-- TODO: 実際に書いたCSSを記録する -->

### 2-1. 〇〇コンポーネント

```css
/* TODO */
```

### 2-2. 〇〇コンポーネント

```css
/* TODO */
```

---

## 3. つまづきポイントと解決

<!-- TODO: 詰まったことと解決策を書く -->

---

## まとめ

<!-- TODO -->

---

## 参考

- 前回記事：[【小脳記憶 ser.4】CSSの構造がやっと見えた](https://zenn.dev/uno22/articles/cerebellum-memory-04-css-understanding)
