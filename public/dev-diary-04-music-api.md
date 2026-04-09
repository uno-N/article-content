---
title: 【音楽生成AI API比較】Mureka vs Google Lyria RealTime——音響パラメータをコードで制御できるか検証した
tags:
  - Python
  - API
  - websocket
  - 個人開発
  - 音楽生成AI
private: false
updated_at: '2026-04-09T23:57:55+09:00'
id: 68072acf647f3355c862
organization_url_name: null
slide: false
ignorePublish: false
---

## はじめに

この記事でできること：

- 音楽生成AIのAPIで音響パラメータ（BPM・キー・密度）を数値で制御する方法がわかる
- Mureka AIとGoogle Lyria RealTimeの違いがわかる
- Python + google-genai でLyria RealTime APIに接続できる

対象：音楽生成AIのAPIを使いたい人、Pythonで外部APIを叩いたことがある程度の人。

---

## 環境・前提条件

- Python 3.10以上
- Google AI StudioのAPIキー（[aistudio.google.com](https://aistudio.google.com) で取得）
- `pip install google-genai python-dotenv librosa`

---

## 0. なぜ音響パラメータの制御が必要か

音楽療法アプリ「ねぃろ」のコアは、利用者の状態から導かれた音響パラメータ（BPM・キー・ラウドネス等）を音楽に正確に反映させることです。

最初に試したのはSunoAI → 公式APIなし・利用規約違反の可能性があり断念。

次にMureka AI → 結果は後述。

---

## 1. REST vs WebSocket：2種類の通信方式

APIを選ぶ前に、通信方式の違いを理解しておくと判断しやすくなります。

**REST（リクエスト→レスポンスで完結）**

```
アプリ：「70BPMの曲を作って」（POSTリクエスト）
  ↓ 待つ
API ：「できました」（レスポンス）← ここで通信終了
```

MurekaはREST。一回のリクエストで完結します。

**WebSocket（接続を保ちながらデータが流れ続ける）**

- **双方向** — 接続後、リクエストなしにサーバー側から送ってこれる
- **繋ぎっぱなし** — リクエストのたびに繋ぎ直さない
- **リアルタイム** — 音楽・チャット・株価など「流れ続けるデータ」に向いている

```
アプリ：「繋いで。70BPMの曲を流し続けて」
  ↕ 繋ぎっぱなし
API ：「♪」← 2秒ごとに届く
API ：「♪」
API ：「♪」
```

Lyria RealTimeはWebSocket。接続を維持しながら音楽データが2秒チャンク単位で届き続けます。

---

## 2. Mureka AIで検証：失敗

### 2-1. 音響パラメータを自然言語で渡す

MurekaのAPIは自然言語プロンプトのみ対応。数値ラベルのパラメータがありません。

```
# ❌ 反映されにくい（数値ラベル形式）
BPM: 90
Key: A minor

# ✅ 反映されやすい（自然言語描写形式）
relaxed 90 BPM groove, melancholic A minor,
soft and intimate with gentle dynamics
```

### 2-2. 検証結果

librosaで音響分析ツールを作り、9パターンで検証。

| ID | テンポ | キー | ラウドネス |
|----|--------|------|-----------|
| 1 | 99.4 BPM ❌ | C major ❌ | -18.8 dB ❌ |
| 2 | 136.0 BPM ❌ | D major ❌ | -18.7 dB ❌ |
| 4 | 89.1 BPM ✅ | G major ❌ | -18.8 dB |

**ほぼ全滅。**

### 2-3. なぜ反映されないか

MurekaのモデルはCLAPモデルをベースに構築されており、テキストと音楽の対応関係を学習する設計です。「80BPM」という数値ではなく「upbeat」「energetic」のような自然言語ラベルでトレーニングされている。数値を渡しても、モデルが「それっぽい音楽的解釈」に変換してしまうのは設計上必然でした。

> **「自然言語プロンプトに依存するAPIでは、音響パラメータの制御は無理だ」**

Mureka・Suno・Udioは同じ設計です。どれだけ丁寧に自然言語に変換しても、BPMはAIが「それっぽい」と判断した値で生成されてしまいます。

---

## 3. Google Lyria RealTime APIを選んだ理由

Google DeepMindが開発した音楽生成AIのAPI（2024年時点で実験的モデル・無料）。

他のAPIとの決定的な違い：

```python
config = types.LiveMusicGenerationConfig(
    bpm=90,                              # ← 数値で直接渡せる
    scale=types.Scale.G_MAJOR_E_MINOR,  # ← キーも直接指定
    density=0.5,                         # ← 音の密度 0.0〜1.0
    brightness=0.5,                      # ← 高音域の明るさ 0.0〜1.0
)
```

自然言語の変換なし。数値は数値のまま渡せます。

| | Mureka | Lyria RealTime |
|---|---|---|
| パラメータ指定方式 | 自然言語 | 数値直接指定 |
| BPM制御 | ほぼ不可 | 62% |
| 料金 | 有料（$30〜） | 無料（実験的） |
| 通信方式 | REST | WebSocket |

---

## 4. Python実装

### 4-1. APIキーの準備

LyriaはGemini APIの実験的モデルとして提供されているので、[Google AI Studio](https://aistudio.google.com) から取得します。Gemini・Imagen・Lyria、1キーで全部使えます。

```
# music-analyzer/.env
GOOGLE_API_KEY=your_api_key_here
```

```bash
# .gitignore に追加（GitHubにキーを上げないため）
music-analyzer/.env
```

```python
from dotenv import load_dotenv
import os

load_dotenv()  # .env を読み込む
API_KEY = os.environ.get("GOOGLE_API_KEY")
```

### 4-2. インストール

```bash
pip install google-genai python-dotenv
# google-genai  → Lyria/GeminiのPython SDK（公式）
# python-dotenv → .envを読み込むライブラリ
```

### 4-3. APIの窓口を作る

```python
from google import genai
from google.genai import types

client = genai.Client(
    api_key=API_KEY,
    http_options={"api_version": "v1alpha"},  # 実験的モデル用に必須
)
```

### 4-4. 音楽パラメータを数値で渡す

```python
# 音響パラメータ（数値で直接指定）
config = types.LiveMusicGenerationConfig(
    bpm=90,
    scale=types.Scale.G_MAJOR_E_MINOR,  # キー（平行調はセットで指定）
    density=0.3,    # 0.0（スカスカ）〜1.0（ぎっしり）
    brightness=0.5, # 0.0（こもった音）〜1.0（煌びやか）
)

# ジャンル・雰囲気をテキストで補足
prompts = [
    types.WeightedPrompt(text="Folk acoustic, warm, organic", weight=2.0),
    types.WeightedPrompt(text="No vocals, instrumental only", weight=1.5),
]
```

### 4-5. 接続・送信・生成・受信

```python
async with client.aio.live.music.connect(model="models/lyria-realtime-exp") as session:
    await session.set_music_generation_config(config=config)  # パラメータ送信
    await session.set_weighted_prompts(prompts=prompts)        # ジャンル送信
    await session.play()                                       # 生成開始

    async for message in session.receive():
        # 2秒チャンク単位で音声データが届く（WebSocketで繋ぎっぱなし）
```

**`async with ... as session:`** — 接続を開いてブロック終了時に自動切断。

**`client.aio.live.music.connect(...)`** の読み方：

```
client          # APIの窓口
  .aio          # 非同期（async）モード
  .live         # リアルタイム系のAPI
  .music        # 音楽モジュール
  .connect(...) # 接続する
```

Pythonのブロック構造：

```python
async with ... as session:  # ← ここから
    await session.play()    # ← スペース4つ = ブロックの中
# ← 行頭に戻ったらブロック終了・自動切断
```

---

## 5. 音響分析ツール（librosa）

生成した音楽が本当にパラメータ通りか確認するために、Pythonで分析ツールを作りました。

```python
import librosa

y, sr = librosa.load("song.mp3")
# y  = 波形データ
# sr = サンプルレート（1秒間に何回記録するか）
# _  = 使わない戻り値は _ で受け取って捨てる

tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
```

### librosaの限界

- **BPM検出：** 遅い音楽（60BPM以下）はビートを2倍で拾う「オクターブエラー」が起きやすい。`start_bpm` に目標値を渡すと改善できる
- **キー検出：** 簡易なアルゴリズムのため完全一致は少ない。五度圏で1つ隣のキーに収まることが多く、聴感上の問題はほぼない

---

## 6. 検証結果と気づき

### 6-1. Lyria RealTimeの合格率

- **BPM：5/8（62%）** — 遅いBPMはlibrosaのオクターブエラー。手動タップテンポで確認するとほぼ合っていた
- **キー：2/8（25%）** — 完全一致は少ないが五度圏1つ隣が多数。聴感上の問題なし
- **1/fゆらぎ：5/8（62%）** — ゆらぎが大きいほどα値が下がる傾向あり

### 6-2. densityの発見

```
density=1.0 → 音がぎっしり（バンドアンサンブル、オーケストラ）
density=0.3 → 音がスカスカ（ミニマルアンビエント、一音一音が際立つ）
```

VOCALIZATIONモード（oohs/ahhsのハミング）を試したところ、`density=0.5` では伴奏が密すぎてメロディが出てこなかった。`density=0.3` にするとハミングメロディがふわっと浮き出ました。

伴奏が密だとメロディの出る余地がなくなる——数値で確認できたことが大きかったです。

### 6-3. Demucs v4で伴奏とメロディを分離

VOCALIZATIONモードで生成した音楽をFacebook ResearchのOSS「Demucs v4（htdemucs）」で分離。

- `vocals.wav` → oohs/ahhsのメロディ層 ✅
- `no_vocals.wav` → 伴奏層 ✅

```
Lyria RealTime API（VOCALIZATIONモード）
  ↓ 生成
Demucs v4（htdemucs）
  ↓ 分離
vocals.wav（メロディ層）+ no_vocals.wav（伴奏層）
```

---

## 7. まとめ

### 暗記してサッと使いたいLyria RealTime APIコード

```python
# APIキーの読み込み
from dotenv import load_dotenv
import os
load_dotenv()
API_KEY = os.environ.get("GOOGLE_API_KEY")

# APIの窓口
from google import genai
from google.genai import types
client = genai.Client(
    api_key=API_KEY,
    http_options={"api_version": "v1alpha"},
)

# 音響パラメータ
config = types.LiveMusicGenerationConfig(
    bpm=90,
    scale=types.Scale.G_MAJOR_E_MINOR,
    density=0.3,
    brightness=0.5,
)

# ジャンル
prompts = [
    types.WeightedPrompt(text="Folk acoustic, warm, organic", weight=2.0),
]

# 接続・送信・受信
async with client.aio.live.music.connect(model="models/lyria-realtime-exp") as session:
    await session.set_music_generation_config(config=config)
    await session.set_weighted_prompts(prompts=prompts)
    await session.play()
    async for message in session.receive():
        pass  # 音声データを処理する

# 音響分析
import librosa
y, sr = librosa.load("song.mp3")
tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
```

### 変更できる変数名・変更できないメソッド名

**変更できない（ライブラリが決めている）：**

```python
genai.Client() / types.LiveMusicGenerationConfig()
bpm= / scale= / density= / brightness=
types.Scale.G_MAJOR_E_MINOR
types.WeightedPrompt() / text= / weight=
.aio.live.music.connect() / model=
.set_music_generation_config() / .set_weighted_prompts()
.play() / .receive()
```

**変更できる（自分で付けた名前）：**

```python
client / config / prompts / session / API_KEY
```

---

## 参考

- [Google Lyria RealTime APIドキュメント](https://ai.google.dev/gemini-api/docs/realtime-music-generation)
- [Mureka API公式ドキュメント](https://platform.mureka.ai/docs/api/operations/post-v1-song-generate.html)
- [librosa公式](https://librosa.org/)
- [Demucs v4](https://github.com/facebookresearch/demucs)
