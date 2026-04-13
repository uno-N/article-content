---
title: "【開発日記：#7】Lyria RealTime APIで音楽生成——スライサー問題・プロンプト設計・E/Iスコアジャンルマッピング"
emoji: "🎵"
type: "tech"
topics: ["lyria", "googleai", "react", "fastapi", "個人開発"]
published: false
---

みなさんこんにちは。
平凡な訪問看護師が、アプリ開発の実装過程を掲載していく「アプリ開発日記Vol.7」です。

前回はLyria RealTime APIをReactに組み込むところまで完成しました。今回は「動いた」から「聴ける」に近づけるための改善回です。

---

## この記事でわかること

- Lyria RealTime APIの `density` / `music_generation_mode` が音質に与える影響
- `WeightedPrompt` を使ったプロンプト設計のコツと落とし穴
- Vibe（雰囲気）× Genre（構造）の2層プロンプト設計
- Rentfrow & Gosling（2003）に基づくE/Iスコア→ジャンル自動マッピング

---

## 環境・前提条件

- Python 3.13 / FastAPI / uvicorn
- React + Vite
- google-genai SDK（v1alpha）
- `models/lyria-realtime-exp` モデル使用

---

## 1. スライサー問題の調査と解決

### 何が起きていたか

音楽を生成すると、音がぶつぶつと細かく途切れる現象が発生していました。特にJ-Rockのようなジャンルで顕著でした。

### 原因① density の設定値が高すぎた

`density`（音符の密度、0.0〜1.0）をエネルギーレベルに応じて設定していました。

```python
ENERGY_DENSITY = {1: 0.15, 2: 0.30, 3: 0.50, 4: 0.70, 5: 0.90}

config = types.LiveMusicGenerationConfig(
    density=0.90,  # energy=5 のとき
    music_generation_mode=types.MusicGenerationMode.VOCALIZATION,
)
```

`VOCALIZATION` モードで `density` を高くすると、ボーカルが短い音節を急速に連打するような「スライサー効果」が発生しました。

**解決：`density=None` にしてLyriaのデフォルトに任せる**

```python
config = types.LiveMusicGenerationConfig(
    density=None,  # 指定しない → Lyria の内部デフォルトを使用
    ...
)
```

:::message
SDKの `LiveMusicGenerationConfig` を確認すると、`density` の `description` は `"Range is [0.0, 1.0]"` のみで推奨値の記載がありません。`None`（未指定）のままLyriaに判断させた方が自然な出力になりました。
:::

### 原因② VOCALIZATION モードがジャンル系と相性が悪い

`VOCALIZATION` はボーカルハミングを生成するモードです。`Rock` や `Electronic` のようなジャンルと組み合わせると、Lyriaが楽器ではなく声で表現しようとして不自然な音になります。

**解決：`QUALITY`（デフォルト）モードに切り替える**

```python
config = types.LiveMusicGenerationConfig(
    music_generation_mode=types.MusicGenerationMode.QUALITY,
    ...
)
```

ハミングがなくなり、ジャンルの楽器編成がそのまま出るようになりました。

---

## 2. プロンプト設計の改善

### 問題：楽器描写とジャンル指定が衝突していた

Lyriaへのプロンプトは `WeightedPrompt` で複数渡せます。

```python
prompts = [
    types.WeightedPrompt(text="J-Rock", weight=3.0),
    types.WeightedPrompt(text="Cello and plucked violin, dark melancholic...", weight=1.5),
]
```

ヘヴナー気分カテゴリ（悲しい）の表現として「チェロ」「バイオリン」を指定していましたが、これが「J-Rock」の指示と衝突していました。

### 解決：ジャンル指定時は感情キーワードのみに切り替える

プロンプトを2種類用意し、ジャンル有無で切り替えます。

```python
# ジャンルなし → 楽器込みのフル描写
HEVNER_PROMPTS = {
    2: "Cello low register and plucked violin, dark melancholic minor harmony, slow regular beat...",
}

# ジャンルあり → 感情・ハーモニーのみ（楽器名なし）
HEVNER_MOOD_PROMPTS = {
    2: "dark melancholic, minor harmony, minor thirds and sixths, slow tempo, subdued",
}

# build_prompts 内で切り替え
hevner_dict = HEVNER_MOOD_PROMPTS if req.genre else HEVNER_PROMPTS
hevner_text = hevner_dict.get(req.hevner, "calm, balanced harmony, steady rhythm")
```

---

## 3. 2層ジャンル設計

ジャンルを「雰囲気」と「骨格」の2層に分けることで、より細かい音楽の方向性を指定できるようにしました。

| 層 | 役割 | 例 | weight |
|---|---|---|---|
| Vibe（雰囲気） | 色・質感・空気感 | `lo-fi, warm tape texture` / `dark, brooding` | 2.0 |
| Genre（構造） | リズム・楽器編成の骨格 | `Jazz, swing` / `Rock, guitar-driven` | 3.0 |

```python
# server.py の build_prompts 内
if req.genre:
    prompts.append(WeightedPrompt(text=req.genre, weight=3.0))
if req.vibe:
    prompts.append(WeightedPrompt(text=req.vibe, weight=2.0))
```

:::details 用意したVibe / Genreの選択肢一覧

**Vibe（18種）**
lo-fi / cinematic / dreamy / dark / ethereal / raw / uplifting / melancholic / cozy / nostalgic / groovy / romantic / energetic / tense / peaceful / playful / bittersweet / hypnotic

**Genre（21種）**
Jazz / Classical / Electronic / Rock / Folk Acoustic / R&B Soul / Ambient / Pop / City Pop / Neo Soul / Hip-hop / Trap / Chillhop / Indie Pop / Bedroom Pop / Bossa Nova / Future Bass / K-Pop / Anime J-Pop / Vaporwave / Funk

:::

---

## 4. 3パターンのコンセプト設計

音楽を3パターン生成していましたが、単なる「同じ曲のランダム違い」から、それぞれにコンセプトを持たせた設計に変えました。

| パターン | コンセプト | genre | vibe |
|---|---|---|---|
| A | 診断結果のみ（療法的純粋出力） | なし | なし |
| B | ユーザーのジャンル選択優先 | ユーザー選択 | ユーザー選択 |
| C | E/Iスコアから自動導出 | EIスコアで自動決定 | ユーザー選択 |

```javascript
// DiagnosisFlow.jsx
const patternDefs = [
  { label: 'A', genre: '',                              vibe: '',              seed: 42 },
  { label: 'B', genre: baseParams.genre,                vibe: baseParams.vibe, seed: 7  },
  { label: 'C', genre: getEIGenre(baseParams.ei_score), vibe: baseParams.vibe, seed: 99 },
]

for (let i = 0; i < patternDefs.length; i++) {
  const { label, ...override } = patternDefs[i]
  const res = await fetch(`${SERVER_URL}/generate`, {
    method: 'POST',
    body: JSON.stringify({ ...baseParams, ...override, guidance: 4.5 }),
  })
}
```

---

## 5. E/Iスコア → ジャンル自動マッピング（Pattern C）

Pattern CのジャンルはE/Iスコア（外向性スコア -3〜+3）から自動で選びます。根拠として音楽心理学の研究を参照しました。

> Rentfrow, P. J., & Gosling, S. D. (2003). The do re mi's of everyday life: The structure and personality correlates of music preferences. *Journal of Personality and Social Psychology, 84*(6), 1236–1256.

同研究では音楽嗜好を4次元で分類し、Big Five性格特性との相関を分析しています。

| 次元 | 代表ジャンル | 相関する性格 |
|---|---|---|
| Reflective & Complex | Classical, Jazz, Folk | 内向性・開放性 |
| Intense & Rebellious | Rock, Alternative | 開放性 |
| Upbeat & Conventional | Pop | 外向性 |
| Energetic & Rhythmic | Hip-hop, Electronic | 外向性 |

```javascript
const INTROVERTED_GENRES = [
  'Classical orchestral', 'Jazz, swing', 'Folk, acoustic guitar',
  'Ambient, atmospheric', 'Indie pop, jangly, heartfelt',
  'Bedroom pop, intimate, DIY feel', 'Bossa nova, nylon string, gentle sway',
  'Chillhop, laid-back beats', 'Neo soul, warm groove, expressive',
  'Vaporwave, slowed, nostalgic digital',
]

const EXTROVERTED_GENRES = [
  'Pop, melodic', 'Electronic, synthesizer', 'Hip-hop, boom bap, rhythmic',
  'Trap, 808 bass, hi-hat rolls', 'R&B, soulful',
  'K-pop, polished, hook-driven', 'Funk, slap bass, syncopated groove',
  'Future bass, emotional synth drops', 'City Pop, 80s Japanese groove',
  'Rock, guitar-driven', 'J-pop, anime-style, bright melody',
]

function getEIGenre(eiScore) {
  if (eiScore < 0) {
    return INTROVERTED_GENRES[Math.floor(Math.random() * INTROVERTED_GENRES.length)]
  } else if (eiScore > 0) {
    return EXTROVERTED_GENRES[Math.floor(Math.random() * EXTROVERTED_GENRES.length)]
  } else {
    // ei_score=0（中間）→ 両リストから合わせてランダム
    const combined = [...INTROVERTED_GENRES, ...EXTROVERTED_GENRES]
    return combined[Math.floor(Math.random() * combined.length)]
  }
}
```

:::message alert
研究では「外向性と音楽嗜好の相関は統計的に有意だが予測力は低い」とも述べられています。あくまで「研究にもとづいた参考」としての実装です。
:::

---

## まとめ

| 問題 | 解決策 |
|---|---|
| スライサー効果 | `density=None` + `QUALITY` モードへ切り替え |
| ジャンルと楽器描写の衝突 | ジャンル指定時は感情キーワードのみのプロンプトに切り替え |
| 3パターンに差がない | コンセプト別設計（診断のみ / ユーザー選択 / EI自動導出） |
| ジャンル選択が粗い | Vibe × Genre の2層設計 |

音楽生成の「動く」と「聴ける」の間には、思ったより大きな溝がありました。パラメータ1つで音が激変するので、地道に調べながら進めています。

---

## 参考

- [Rentfrow & Gosling (2003) — The Structure and Personality Correlates of Music Preferences](https://gosling.psy.utexas.edu/wp-content/uploads/2014/09/JPSP03musicdimensions.pdf)
- [Rentfrow et al. (2011) — The Structure of Musical Preferences: A Five-Factor Model](https://projects.ori.org/lrg/PDFs_papers/RentfrowEtal2011StrucMusicPrefsJPSP.pdf)
- 前回記事：【開発日記#6】個人開発者がDevOpsを始める日——APIキー漏洩・脆弱性・Sentry導入まで
