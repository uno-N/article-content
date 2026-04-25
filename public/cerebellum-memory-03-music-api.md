---
title: 【小脳記憶 ser.3】音楽生成AIのAPI検証記録——Mureka・Lyria比較と音響パラメータ制御の実態
tags:
  - Python
  - API
  - 初心者
  - websocket
  - 音楽生成AI
private: false
updated_at: '2026-04-23T00:00:00+09:00'
id: ''
organization_url_name: null
slide: false
ignorePublish: false
---

みなさんこんにちは。
平凡な訪問看護師が、アプリ開発の実装過程で読めなかったところを読めるまでやる「小脳記憶シリーズ」です。

どの音楽生成APIが、音楽創造アプリの設計を表現できるか検証してみました。
その内容を開発日記でまとめています。ここでは、作ったものがどう動いてるのか読めるようになるための学習をしています。

:::note info
この記事は [小脳記憶 ser.2](https://zenn.dev/uno22/articles/cerebellum-memory-02-vanilla-js-todo) の続きです。
:::

---

## 0. 検証したAPI

音楽療法アプリ「ねぃろ」のコアは、利用者の状態から導かれた
音響パラメータ（BPM・キー・ラウドネス等）を音楽に正確に反映させることです。

最初に選んだのはSunoAI。
公式APIがなく、利用規約違反に当たる可能性があるため断念したという結果でした。

次はMureka AI。
このAIは音響パラメータのラベルがなく、自然言語テキストのみの指示のため、反映されそうな自然言語をできるだけ選びました。
[Mureka APIの公式ドキュメント](https://platform.mureka.ai/docs/api/operations/post-v1-song-generate.html)

パラメータ反映しているかを判定する分析ツールを使用して、試してみた結果は、

**ほぼ全滅。**

やはり自然言語をラベルに機械学習しているAIは、コアにならない。

また、Murekaのモデル（MusiCoT）はCLAPモデルをベースに構築されており、テキストと音楽の対応関係を学習する設計です。つまり「80BPM」という数値ではなく、「upbeat」「energetic」のような自然言語ラベルでトレーニングされている。数値を渡しても、モデルがその意味を「それっぽい音楽的解釈」に変換してしまうのは設計上必然でした。

最後に、というと、検証ができたことがバレでしまうのですが、
隠す必要もないのでいうと、
Google Lyria RealTime API。

`bpm`・`scale`・`density`・`brightness` が明示的なパラメータとして定義されています。音響パラメータをラベルとして設計しているAPIです。

[Google Lyria RealTime APIのドキュメント](https://ai.google.dev/gemini-api/docs/realtime-music-generation)

これを検証してみることにしました。

---

## 1. 座学：APIとは何か
そもそもの話。

### 1-1. APIの基本

APIの基本は開発日記 Vol.1 で扱っています。

[【開発日記：#1】利用規約を読まずにAPI検証した話 -規約違反なんて一瞬-](https://zenn.dev/uno22/articles/dev-diary-01-suno-api)

### 1-2. REST vs WebSocket：2種類の通信方式

APIには大きく2種類の通信方式があります。
- REST
- WebSocket

**⚪️REST（リクエスト→レスポンスで完結）**

[アプリ開発日記 Vol.1](https://zenn.dev/uno22/articles/dev-diary-01-suno-api) でこんなことを書きました。

- HTTPは「サーバーへ送る手紙の形式：通信形式」
  - POST = データを送って処理してもらう
  - GET = データをもらってくる

前回はここで、APIの入り口（エンドポイント）からPOSTリクエストを送って通信しました。

RESTとは、このHTTP（POST・GETなど）を使った通信の「お作法の名前」です。

```
アプリ：「70BPMの曲を作って」（POSTリクエスト）
  ↓ 待つ
API ：「できました」（レスポンス）← ここで通信終了
```
MurekaのAPIはREST。一回のリクエストで完結します。

**⚪️WebSocket（接続を保ちながらデータが流れ続ける）**

WebSocketの特徴は3つです。

- **双方向** — 接続したあとは、リクエストなしにサーバー側から送ってこれます
- **繋ぎっぱなし** — 接続を維持するのでリクエストのたびに繋ぎ直さない
- **リアルタイム** — 音楽・チャット・株価など「流れ続けるデータ」に向いている

```
アプリ：「繋いで。70BPMの曲を流し続けて」
  ↕ 繋ぎっぱなし
API ：「♪」← アプリが何もしてないのに届く
API ：「♪」
API ：「♪」
```

Lyriaは音楽を生成しながら2秒ごとに「できた分から」送ってきます。自分が「次の2秒ください」と毎回リクエストするわけじゃない。これがWebSocketじゃないと成立しない理由です。

Google Lyria RealTime APIはWebSocket。接続を維持しながら音楽データが2秒チャンク単位で届き続けます。

---

## 2. Google Lyria RealTime APIとは

Google DeepMindが開発した音楽生成AIのAPIです（2024年時点で実験的モデル・無料）。

他のAPIとの決定的な違いはここ。

```python
config = types.LiveMusicGenerationConfig(
    bpm=90,                              # ← 数値で直接渡せる
    scale=types.Scale.G_MAJOR_E_MINOR,  # ← キーも直接指定
    density=0.5,                         # ← 音の密度 0.0〜1.0
    brightness=0.5,                      # ← 高音域の明るさ 0.0〜1.0
)
```

自然言語の変換なし。数値は数値のまま渡せます。

---

## 3. 実装：Lyria RealTime APIをPythonで動かす

今回の検証は `music-analyzer/lyria/generator.py` というPythonスクリプトで行いました。
このファイル1本に「APIへの接続・パラメータの送信・音声データの受信・WAVへの保存」がすべて書かれています。

全体の流れはこうです。

```
① .env にAPIキーを設定
        ↓
② load_dotenv() で読み込み → API_KEY 変数に格納
        ↓
③ genai.Client() でAPIの窓口（client）を作る
        ↓
④ config に音響パラメータを格納（bpm / scale / density / brightness）
   prompts にジャンル・雰囲気を格納
        ↓
⑤ WebSocketで接続しながら config と prompts を送信
   （接続と送信は同時。set_music_generation_config() / set_weighted_prompts()）
        ↓
⑥ session.play() で生成開始
        ↓
⑦ 音声データが2秒チャンクで届き続ける
        ↓
⑧ 集めてWAVファイルに保存
        ↓
⑨ analyze.py で分析（BPM・キー・ラウドネスを計測）
        ↓
⑩ 目標値と比較して ✅ / ❌ 判定
```

### 3-1. APIキーの扱い方

APIキーは**絶対にコードに直接書かない**。GitHubに上げると世界中に公開されます。

実際のプロジェクト構成はこうなっています。

```
Neiro-app/
├── music-analyzer/
│   ├── .env          ← ここにAPIキーを書く（GitHubには上げない）
│   ├── lyria/
│   │   └── generator.py  ← ここで .env を読み込んで使う
│   └── ...
├── .gitignore        ← .env を除外する設定
└── ...
```

**①　.env にAPIキーを書く**

```bash
# music-analyzer/.env
GOOGLE_API_KEY=your_api_key_here
```

**②　.gitignore に .env を追加する**
.gitignoreファイル、ずーーーっとなんのためにあるかわからなかったんです。

当方英語ができないので、、、
そのファイルは気にしなくていいよ〜って言われてから、何かのpackageの一種なのかなと思ってました。

```
git + ignore(無視する)
```
また一つ賢くなった。

```bash
# .gitignore
music-analyzer/.env
```

これでGitHubにpushしても `.env` はアップロードされません。

**③　PythonコードからAPIキーを読み込む**

Pythonは標準では `.env` ファイルを読めません。
そこで `python-dotenv` というライブラリをインストールして、`generator.py` の中で呼び出しています。

```python
from dotenv import load_dotenv
import os

load_dotenv()  # .env を読み込む

API_KEY = os.environ.get("GOOGLE_API_KEY")  # キーを取得
```
これで、API_KEYに私のLyria RealTime APIが格納されます。
コードにキーの値を直接書くのではなく、「環境変数の名前」だけを書く。値は `.env` から取ってくる、という仕組みです。

### 3-2. APIがGOOGLE_API_KEY？

ここでふと疑問に思いました。
`GOOGLE_API_KEY` ？Lyria専用のキーじゃなくて？

LyriaはGemini APIの実験的モデルとして提供されているので、キーは [Google AI Studio](https://aistudio.google.com) から取得します。Geminiを使うときと同じキーです。

つまり、このキー1本で

- **Gemini** — テキスト生成・チャット
- **Imagen** — 画像生成
- **Lyria** — 音楽生成

全部使えます。

実験的モデル（`v1alpha`）の間は無料です。

| サービス | 料金 |
|---|---|
| Lyria RealTime | 無料（v1alpha = 実験段階） |
| Imagen | 無料枠あり、超えると有料 |
| Gemini | 無料枠あり（Flash系は特に太め） |

ただし「実験的」なので、正式リリース時に有料化・仕様変更・終了の可能性があります。

### 3-3. Lyria RealTime APIへの接続

PythonからAPIに接続する基本的な流れです。

```bash
pip install google-genai python-dotenv
# google-genai  → Gemini/LyriaのPython SDK（公式ライブラリ）
# python-dotenv → .envを読み込むライブラリ（前のセクションで使ったやつ）

```

```python
from google import genai          # google-genaiライブラリを読み込む
from google.genai import types    # パラメータの「型」を定義するモジュール
                                  # （bpmやscaleの設定オブジェクトを作るのに使う）

client = genai.Client(    # clientはAPIの「窓口」。以降はclient.〇〇でAPIを操作する
    api_key=API_KEY,              # .envから読み込んだAPIキーを渡す
    http_options={"api_version": "v1alpha"},  # APIバージョンを実験版(v1alpha)に指定
)
```

### 3-4. 音楽パラメータを数値で渡す

`config` という変数に音響パラメータを格納して、
`prompts` という変数にジャンルや雰囲気を格納します。
この2つをセットでAPIに送ります。

```python
# 音響パラメータを格納するオブジェクト
config = types.LiveMusicGenerationConfig(
    bpm=90,                              # テンポ
    scale=types.Scale.G_MAJOR_E_MINOR,  # キー（G長調＝E短調。平行調はセットで指定）
    density=0.3,                         # 音の密度（0.0:音数少ない〜1.0:多い）
    brightness=0.5,                      # 高音域の明るさ（0.0:こもった音〜1.0:煌びやか）
)

# ジャンル・雰囲気をテキストで補足する。数値だけでは表現しきれない部分を言葉で渡す
# weight は優先度。数値が大きいほど重視される
prompts = [
    types.WeightedPrompt(text="Folk acoustic, warm, organic", weight=2.0),  # メイン
    types.WeightedPrompt(text="No vocals, instrumental only", weight=1.5),  # サブ
]
```

### 3-5. 送信・生成・受信

config と prompts が用意できたら、WebSocketで接続しながら送信して生成を開始します。

```python
async with client.aio.live.music.connect(model="models/lyria-realtime-exp") as session:
    await session.set_music_generation_config(config=config)  # 音響パラメータを送信
    await session.set_weighted_prompts(prompts=prompts)        # ジャンル・雰囲気を送信
    await session.play()                                       # 生成開始

    async for message in session.receive():                    # 音声データを受け取り続ける
        # 2秒チャンク単位で届く（WebSocketなので接続を保ちながら流れてくる）
```

**`async with ... as session:`** — 接続を開いて、その間は `session` という名前で使う。ブロックが終わったら自動で切断される構文です。

**`async`** がついているのはWebSocketが非同期通信だから。音楽データが届くのを「待ちながら」他の処理もできる状態にしています。

**`client.aio.live.music.connect(...)`** はAPIの窓口を辿っています。

```
client          # 作っておいたAPIの窓口
  .aio          # 非同期（async）モード
  .live         # リアルタイム系のAPI
  .music        # 音楽モジュール
  .connect(...) # 接続する
```

**`model="models/lyria-realtime-exp"`** — どのモデルに繋ぐかの指定です。

末尾の `:` は「このブロックの中身がここから始まります」という合図。Pythonは `{}` の代わりに、`:` + インデント（字下げ）でブロックを表現します。

```python
async with ... as session:   # ← ここから（行頭）
    await session.play()     # ← スペース4つ分右にある = ブロックの中
# ← 行頭に戻ったらブロック終了・自動切断
```

ここまで読めると、すごくわかりやすいですね。
まとめに「コードの構成要素：変数・メソッド・クラス・引数」も載せているのでご活用ください。

---

## 4. 検証ツール：Pythonで音響分析
ちょっと力尽きてきましたが、後ちょっとです。お付き合いください。

### 4-1. Pythonが得意なこと

Pythonは**数値計算・データ処理・科学技術計算**に強い言語です。音楽分析ライブラリが豊富に揃っていて、JavaScriptで同じことをやろうとすると何倍も大変になります。

今回使ったのは **librosa**。mp3を読み込んでBPM・キー・ラウドネス・1/fゆらぎを自動計測してくれます。

```python
import librosa

y, sr = librosa.load("song.mp3")
tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
```

`librosa.load()` でmp3を読み込むと、`y`（波形データ）と `sr`（サンプルレート＝1秒間に何回波形を記録したか）の2つが返ってきます。この2つを `beat_track()` に渡すとBPMが検出できます。

`tempo` に検出されたBPMが入ります。`_` はビートの位置情報ですが今回は使わないので、「受け取るけど捨てる」という意味で `_` と書いています。


### 4-2. 検証ツールの仕組み

```
mp3ファイル
  ↓ librosaで読み込み
BPM・キー・ラウドネス・1/fゆらぎを計測
  ↓ 目標値と比較
✅ / ❌ で判定
```

コマンド一発で動きます。

```bash
python analyze.py song.mp3 --compare '{"tempo": 70, "key": "A minor"}'
```

### 4-3. librosaの限界と正直な評価

検証ツールを作って使ってみて、librosaの精度に限界があることがわかりました。

**BPM検出の問題（既知のバグ）：**
遅い音楽（60BPM以下）は、リズムが曖昧でビートを2倍で拾ってしまう「オクターブエラー」が起きやすい。
→ 解決策：`start_bpm` に目標値を渡して探索範囲を絞る

**キー検出の問題：**
librosaのキー検出は「最も強いクロマ音を見る」という簡易なアルゴリズム。完全一致は少ないですが、五度圏で1つ隣のキーに収まることが多く、聴感上の違和感はほぼありません。

**1/fゆらぎの問題：**
librosaで計算できますが、楽曲全体の平均値なので局所的なゆらぎは捉えられません。

**つまり：** このツールは「大きくズレているかどうか」を確認するためのもの。細かい音楽的正確性の評価には向きません。それでも「Murekaはほぼ全滅、Lyriaは7割程度反映」という判断には十分使えました。

---

## 5. Lyria検証結果

Murekaと同じパラメータで検証した結果。

- **BPM：5/8（62%）** — 遅いBPMはlibrosaのオクターブエラー。手動タップテンポで確認するとほぼ合っていた
- **キー：2/8（20%）** — 完全一致は少ないが五度圏1つ隣が多数。聴感上の問題なし
- **1/fゆらぎ：5/8（62%）** — ゆらぎが大きいほどα値が下がる傾向あり

Murekaの全滅と比べると、数値制御の手ごたえは明確にあります。このAPIでいくことに決めました。

### 5-1. パラメータの気づき
**densityについて：**
```
density=1.0 → 音がぎっしり（バンドアンサンブル、オーケストラ）
density=0.3 → 音がスカスカ（ミニマルアンビエント、一音一音が際立つ）
```

density=0.3 にするとVOCALIZATIONモードのハミングメロディが浮き出やすくなりました。伴奏が密だとメロディの出る余地がなくなるためです。

---

## 6. まとめ

音楽生成APIを選ぶときの判断軸は「自然言語依存か、数値制御できるか」でした。

| | Mureka | Lyria RealTime |
|---|---|---|
| パラメータ指定方式 | 自然言語 | 数値直接指定 |
| BPM制御 | ほぼ不可 | 62%（librosa計測） |
| キー制御 | ほぼ不可 | 聴感上はほぼOK |
| 料金 | 有料（$30〜） | 無料（実験的） |
| 通信方式 | REST | WebSocket |

次回はいよいよ、ねぃろへの実装編に入ります。

### 6-1. 今回の学び

**API・通信**
- ✅ REST — HTTP（POST/GET）を使ったリクエスト→レスポンスで完結する通信のお作法
- ✅ WebSocket — 双方向・繋ぎっぱなし・リアルタイム。サーバー側から先に送れる
- ✅ Mureka vs Lyria — 自然言語依存のAPIは数値パラメータを反映できない

**Python**
- ✅ APIキー管理 — `.env` に書いて `.gitignore` で除外。`python-dotenv` で読み込む
- ✅ `async with ... as session:` — 接続を開いてブロック終了時に自動切断
- ✅ インデント — Pythonは `{}` の代わりに `:` + 字下げでブロックを表現
- ✅ `_` — 受け取るけど使わない戻り値を捨てる書き方
- ✅ 変数名は自由、メソッド・パラメータ名はライブラリが決めている

**サックと覚えて使いたいLyria RealTime APIコード一覧**

```python
# ① APIキーの読み込み
from dotenv import load_dotenv
import os
load_dotenv()
API_KEY = os.environ.get("GOOGLE_API_KEY")

# ② APIの窓口を作る
from google import genai
from google.genai import types
client = genai.Client(
    api_key=API_KEY,
    http_options={"api_version": "v1alpha"},  # 実験版を指定
)

# ③ 音響パラメータを格納
config = types.LiveMusicGenerationConfig(
    bpm=90,
    scale=types.Scale.G_MAJOR_E_MINOR,
    density=0.3,
    brightness=0.5,
)

# ④ ジャンル・雰囲気を格納
prompts = [
    types.WeightedPrompt(text="Folk acoustic, warm, organic", weight=2.0),
    types.WeightedPrompt(text="No vocals, instrumental only", weight=1.5),
]

# ⑤ 接続・送信・生成・受信
async with client.aio.live.music.connect(model="models/lyria-realtime-exp") as session:
    await session.set_music_generation_config(config=config)
    await session.set_weighted_prompts(prompts=prompts)
    await session.play()
    async for message in session.receive():
        # 2秒チャンク単位で音声データが届く

# ⑥ 音響分析
import librosa
y, sr = librosa.load("song.mp3")
tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
```
### 6-2. 「コードの構成要素：変数・メソッド・クラス・引数」

**変更できない（ライブラリ・APIが決めている）**

```python
genai / types                            # モジュール名
genai.Client()                           # クラス名
api_key= / http_options=                 # パラメータ名
"v1alpha"                                # APIのバージョン値
types.LiveMusicGenerationConfig()        # クラス名
bpm= / scale= / density= / brightness=  # パラメータ名
types.Scale.G_MAJOR_E_MINOR              # Enumの値
types.WeightedPrompt() / text= / weight= # クラス名・パラメータ名
.aio.live.music.connect()               # メソッド名
model= / "models/lyria-realtime-exp"    # パラメータ名と値
.set_music_generation_config()          # メソッド名
.set_weighted_prompts()                 # メソッド名
.play() / .receive()                    # メソッド名
```

**変更できる（自分で付けた変数名）**

```python
client   # → api / gateway など何でもいい
config   # → params / settings など
prompts  # → texts / instructions など
session  # → conn / s など
API_KEY  # → MY_KEY など（.envの名前と揃える必要あり）
```

:::note info
**この記事で使ったツール・ライブラリ**
- [google-genai](https://pypi.org/project/google-genai/) — Lyria RealTime APIのPythonクライアント
- [librosa](https://librosa.org/) — 音響分析ライブラリ
- [Demucs v4](https://github.com/facebookresearch/demucs) — 音源分離（伴奏/メロディ分離）
:::
