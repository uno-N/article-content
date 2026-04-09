---
title: 「あなたの今のリズムは？」音楽でセルフケアを行うレジリエンスツール開発
tags:
  - 初心者
  - React
private: false
updated_at: '2026-04-10T00:00:54+09:00'
id: 583161adac5e0276c4b7
organization_url_name: null
slide: false
ignorePublish: false
---
# 0. 道のり：レジリエンス(回復力)を高めるツールを作りたい

## 0-1.やっと作り始めた
 初めまして、ゆーのと申します。
 普段は看護師をしていて、患者さんが自分の人生に納得して生きるお手伝いをしています。
 
 2024年3月にレジリエンスツールの企画・UI構想までを行い、デジタルハリウッド大学大学院を修了しました。
 ユーザーが**音楽を作成するという行為を通して回復力を高める**ためのツールです。
 制作物はこんな感じの↓↓
[![Image from Gyazo](https://i.gyazo.com/46fd82828748fd35b7f2d2360791542e.jpg)](https://gyazo.com/46fd82828748fd35b7f2d2360791542e)
実装しなくちゃ、、、。
## 0-2.「実行の構造化」を意識した再スタート
実装を行わずにはや2年が経とうとしている、、。

私は、**期限管理・優先順位付けができない**。
強制力が自分の中に働かないものはどんどん後回しにしてしまいます。
実行を構造化して管理していく能力をつける鍛錬を始めました。

[![Image from Gyazo](https://i.gyazo.com/cf6eccffe7b17e6d4a94faabe7056cb8.png)](https://gyazo.com/cf6eccffe7b17e6d4a94faabe7056cb8)
上記はClaudeとの壁打ち。いつも忖度してヨイショしてくれるのに。
## 0-3.タスク管理
**Notion,Todoist**でプロジェクトや日常タスクを整理、
**Habicat**で時間を生み出し、健康に過ごすための習慣化を目指しました。

こんな感じ↓↓
[![Image from Gyazo](https://i.gyazo.com/565d8d71e867935300b7fa2a01308949.png)](https://gyazo.com/565d8d71e867935300b7fa2a01308949)
NotionにTodoistを埋め込み表示させると2つのツールで管理しても意外とバラバラにならず管理しやすい。本日中のタスクだけはその日中に終わらせることを意識しました。
[![Image from Gyazo](https://i.gyazo.com/db0e82b5d70fac0e7e6d91deb9d872d6.png)](https://gyazo.com/db0e82b5d70fac0e7e6d91deb9d872d6)
大体2週間でセオリーを体系化することができました。

余談ですが、一番楽しかったのは、Habicat。
習慣を設定して実行できたらチェックしていく機能があります。
ゲーミフィケーション要素があり、習慣を達成できると、自分のアバターが進化していきます。それがまたなんか、めっちゃ可愛い。嬉しい。耳ついた。
[![Image from Gyazo](https://i.gyazo.com/fe0c5b0c7c640e32ed949e8bfb1b0780.jpg)](https://gyazo.com/fe0c5b0c7c640e32ed949e8bfb1b0780)


## 1. 準備（セオリー調査）
すいません、ここからが今回作ってみたツールのお話になります。
まず、ユーザーの状態をどの様に捉えたら良いか、どのような音響特性に導いたら良いかのセオリー調査を実施しました。
# 1-1. 音楽療法についての4冊＋文献からセオリーを抽出
私のツールへの意図も含め、まとめると以下になります。
- トラウマや生活に困難が及ぶ不適切な防衛規制(反射的な行動)は、音楽を媒介にして**無意識にアクセス**しその原因を**認知し行動変容**を促す
- デフェルトモードネットワーク(ぼーっとしてる時に活性化する脳の領域)でのネガティブな反芻思考(ずっと同じ失敗を思い出してしまう)は、**タスクの実行**(音楽視聴・創造)で軽減する
- 音楽療法における生理的な音響効果を最大限に得るためには、**同質化の原則**(今のユーザーの状態と同じorこれは私の音楽だと感じるもの)と**人格に合わせた好きな音楽**を使用する

アプリ内の詳しいセオリーが気になる方は文献を載せておきます。
<details>
<summary>使用した文献</summary>

### メイン参考資料

1. **藤本幸弘 (2021)**
『音楽は名医』
発行：2021年9月21日
    - 章: 第2章「テンポと自律神経状態の対応」
    - 収録: テンポ、調性、周波数帯、音色、楽器別効果の詳細マッピング
2. **村井靖児 (1997)**
『音楽と無意識の世界』
発行：1997年11月10日
    - 付録C：気分カテゴリー（8点）と音響特性の対応テーブル
    - 理論：1/fゆらぎ、気分の円環、無意識層アクセス
3. **村井靖児 (1995)**
『音楽療法の基礎』
発行：1995年12月10日
    - 1/fゆらぎ理論、時間性による気分転導理論
4. **馬場存 (2018)**
『音楽に癒され音楽で癒す-音楽療法と精神医学/音楽創造』
発行：2018年6月25日
    - 好みの音楽仮説、既成曲との対話、セラピスト-患者の共創関係

### Supporting Theory (Foundational Works)

- **Eysenck, H. J. (1975)**. The Inequality of Man. London: Temple Smith.
(EPI開発元)
- **Francis, L. J., Brown, L. B., & Philipchalk, R. (1992)**.
"The Development of an Abbreviated Form of the Revised Eysenck Personality
Questionnaire (EPQR-A)." Personality and Individual Differences, 13(4), 443-449.
- **Hevner, K. (1937)**. An Experimental Study of the Affective Value of
Sounds and Poetry. American Journal of Psychology, 49, 419-434.
- **Altshuler, I. M. (1948)**. "The past, present, and future of musical therapy."
In E. Podolsky (Ed.), Music therapy (pp. 24-35). New York: Philosophical Library.
(ISO原理の創始者)
## タップテンポ：リズム複雑度判定関連

### 測定時間（30秒）の根拠

1. Hammerschmidt D, Frieler K, Wöllner C. 2021.
    
    "Spontaneous Motor Tempo: Investigating Psychological, Chronobiological, and Demographic Factors in a Large-Scale Online Tapping Experiment."
    
    *Frontiers in Psychology*, 12:677201.
    
    - 大規模N=3,576参加者研究
    - 15秒で十分な信頼性確認
2. Rose D, Cameron DJ, Lovatt PJ, et al. 2020.
    
    "Comparison of Spontaneous Motor Tempo during Finger Tapping, Toe Tapping and Stepping on the Spot in People with and without Parkinson's Disease."
    
    *Journal of Movement Disorders*, 13(1):47-56.
    
    - 医療診断基準として30秒採用

### リズム複雑度理論

1. Povel DJ, Essens PJ. 1985.
    
    "Perception of Temporal Patterns."
    
    *Music Perception*, 2(4):411-440.
    
2. Essens PJ. 1986.
    
    "Hierarchical Organization of Rhythmic Patterns."
    
    *Perception & Psychophysics*, 40(2):69-84.
    

### 外れ値処理

1. McAuley JD, Jones MR. 2003.
    
    "Modeling variability in timing behavior."
    
    *Timing & Time Perception*, 1(2):125-142.
    
2. Drake C, Penel A, Bigand E. 2000.
    
    "Tapping in time with musical and acoustic pulses."
    
    *Journal of Experimental Psychology: Human Perception and Performance*, 26(6):1695-1712.
    

## 外向性関連

### Eysenck理論・覚醒仮説

1. Eysenck, H. J. (1967). *The biological basis of personality*. Springfield, IL: Charles C. Thomas.
2. Hagemann, D., Naumann, E., Lürken, A., Becker, G., Bartussek, D., & Coan, J. A. (1999). EEG asymmetry and cortical regulation of emotion. *Psychophysiology*, 36(6), 693-700.
3. Matthews, G., & Gilliland, K. (1999). The personality theories of H. J. Eysenck and J. A. Gray: A comparative review. *Personality and Individual Differences*, 26(5), 583-626.
4. Gale, A. (1983). Electroencephalographic studies of extraversion-introversion: A case study in the science of individual differences. *Personality and Individual Differences*, 4(4), 371-380.

### 音楽テンポ・パフォーマンス

1. Iwanaga, M. (1995). Harmonic relationships between preferred tempо and Heart Rate. *Perceptual and Motor Skills*, 81(3), 1195-1205.
2. Drake, C., Penel, A., & Bigand, E. (2000). Tapping in time with musical and acoustic pulses: evidence for a generalized beat. *Journal of Experimental Psychology: Human Perception and Performance*, 26(6), 1695-1712.
3. Moelants, D. (2002). Preferred tempo reconsidered. In C. Stevens, D. Burnham, G. McPherson, E. Schubert, & J. Renwick (Eds.), *Proceedings of the 7th International Conference on Music Perception and Cognition*.
4. Scientific Reports (2025). Music tempo modulates emotional states as revealed through EEG insights.
5. Flannery, M. B., & Woolhouse, M. H. (2021). Musical preference: Role of personality and music-related acoustic features. *SAGE Open*, 11(1), 21582043211014014.

### ラウドネス・感覚刺激

1. Campbell, J. B. (1992). Extraversion and noise sensitivity: A replication of Dornic and Ekehammar's study. *Personality and Individual Differences*, 13(9), 953-955.
2. Ludvigh, E. J., & Happ, D. (1974). Extraversion and preferred level of sensory stimulation. *British Journal of Psychology*, 65(3), 359-365.
3. Ellermeier, W., Eigenstetter, M., & Zimmer, K. (2000). Psychoacoustic correlates of individual noise sensitivity. *Journal of the Acoustical Society of America*, 109(4), 1464-1473.

### ピッチレジスター・コンソナンス

1. Bidelman, G. M., & Krishnan, A. (2009). Neural correlates of consonance, dissonance, and the hierarchy of musical pitch in the human brainstem. *Journal of Neuroscience*, 29(42), 13165-13171.
2. Eerola, T., & Lahdelma, I. (2021). The anatomy of consonance/dissonance: Evaluating acoustic and cultural predictors across multiple datasets with chords. *Frontiers in Psychology*, 12, 632653.
3. Plomp, R., & Levelt, W. M. (1965). Tonal consonance and critical bandwidth. *Journal of the Acoustical Society of America*, 38(4), 548-560.
4. Parncutt, R., & Hair, G. (2011). A psychoacoustical model of the influence of musical loudness on triadic chord quality and tolerance. *Psychomusicology*, 21(1-2), 90-110.
5. Trainor, L. J., Tsang, C. D., & Cheung, V. H. W. (2002). Preference for consonant over dissonant music: A cross-cultural study. *Music Perception*, 20(1), 3-21.
6. Koelsch, S., Gunter, T. C., von Cramon, D. Y., Zysset, S., Lohmann, G., & Friederici, A. D. (2002). The role of the right superior temporal cortex in processing musical structure. *NeuroImage*, 17(2), 888-898.

### 1/fゆらぎ・スケーリング

1. Penney, T. B., Busemeyer, J. R., & Heathcote, A. (2019). Scaling behaviour in music and cortical dynamics interplay to mediate music listening pleasure. *Scientific Reports*, 9, 17972.
2. Madison, G., Loehr, J. D., Heijden, K. V. D., & Gouyon, F. (2019). Origins of 1/f noise in human music performance from short-range autocorrelations related to rhythmic structures. *PLOS One*, 14(5), e0216088.
3. Mandelbrot, B. B., & Van Ness, J. W. (1968). Fractional Brownian motions, fractional noises and applications. *SIAM Review*, 10(4), 422-437.
4. Van Orden, G. C., Holden, J. G., & Turvey, M. T. (2005). Human cognition and 1/f scaling. *Journal of Experimental Psychology: General*, 134(1), 117-123.

### 音楽療法応用

1. LeBlanc, A. (1981). Effects of style, tempo, and performing medium on music preference. *Journal of Research in Music Education*, 29(2), 143-156.
2. Thaut, M. H., & Hoemberg, V. (2014). *Handbook of neurologic music therapy*. Oxford University Press.  
</details>

# 1-2. アプリフェーズ毎にセオリーとアクションをマッピング
まずはアプリの流れをフェーズに分けてみました。
次に調査したセオリーがどのフェーズで使えるのかをマッピングしていきました。

[![Image from Gyazo](https://i.gyazo.com/38a61387e48012d2393dfd187440a62a.png)](https://gyazo.com/38a61387e48012d2393dfd187440a62a)
そして、今回は診断フェーズのプロトタイプを作ってみようと思います。
<a href="https://gyazo.com/2e24d66f0b1e4e9823f88ef42f083c69">
  <img src="https://i.gyazo.com/2e24d66f0b1e4e9823f88ef42f083c69.png" width="500" alt="Image from Gyazo">
</a>

### セオリーの大枠
- **外向性-内向性（人格）**：Eysenck覚醒仮説
- **気分（気分状態）**：Kate Hevner感情円環理論
- **テンポ（生理状態）**：自律神経状態とBPMの対応、ISO
- **エネルギー量**：ADAC診断

# 1-3. ユーザーの流れ

### タップ→質問→気分選択→結果表示

- **Step 1**: リズムテンポ診断（30秒タップ）
  - 自由に今の自分をリズムで表現する
  - CV（変動係数）で7段階のリズム複雑度を判定
  
- **Step 2**: 外向性・内向性診断
  - 質問3つに答える
  - 人格特性を診断する
  - Eysenck の性格理論に基づくスコア計算
  
- **Step 3**: 気分選択
  - 霊的、悲しい、夢のような、叙情的、こっけいな、喜ばしい、興奮、元気の中から選択
  - 同質だと効果があるよって言われてる音楽がわかる

- **Step 4**: エネルギー選択
  - empty(空っぽ)、Tired（疲れている）、Low Energy（低エネルギー）、Neutral（中程度）、Activated（活動的）、Energized（高エネルギー）
  - これは私が勝手にいれた指標。転導する判断やそもそも音楽創造ではなく視聴のみにした方がいいんじゃないかと判断するために必要かなと思った。
  
- **Step 4**: 結果表示
  - リズム複雑度、推奨キー、ハーモニー色、周波数、倍音構造、ホルモン状態など
  - 実際はこの後、ユーザー状態を元に、ユーザーが音楽を組み立てるピースを提案していく感じかな(?)

# 2. 実行（ツール体験）
実装はセオリーだけ投げてほとんどClaudeにお任せして作りました。
### 🎵 今すぐ試す

[![Open in CodeSandbox](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/uno-N/yuno-music-therapy-app)

👆 をクリックするとブラウザで即座に実行できます（デプロイ不要）

CodeSandboxで開かれます
[![Image from Gyazo](https://i.gyazo.com/26ddb2b78ad04bcf1ef2b7f99fb5b3dc.png)](https://gyazo.com/26ddb2b78ad04bcf1ef2b7f99fb5b3dc)

---

# 3. 気づき
- ツールに関しては、まだ、修正点も多くこんなん答えると、こんなことがわかるんだ！くらいに思ってもらえたら良いなと思います。(感想お待ちしております)
- データベースと紐づけていないため、安心してご使用ください。

- 今後、音響特性部分も実装して、自分が使ってみて効果があるなと思うくらいには楽しいツールができるといいなと思います。ここが大変そうで、、、。
- 習慣化やタスク管理は2026年の目標です。理想のために実力以上以上の仕事をもらってでもできない、という状態から、コツコツ実力のある人間になれたら良いなと思います。少なからず、この３週間弱は、自分との約束を守り規則正しく生活してます笑 
- ヨガとジムに週５で通ってるのですが、体っていうより心が健康です。アクティブレスト最高〜。
- Claude大先生に一生ついていきます。

# 4. おわりに
- あなたに必要な音響特性を見つけてみてください〜
