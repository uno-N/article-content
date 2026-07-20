---
name: medical-citation-research
description: 医療監修・専門家レビュー記事（Lancers案件）でPubMedの論文検索とエビデンス確認を行う。「論文を探して」「エビデンスを調べて」「この論文に似た研究を探して」「医療記事の参考文献を確認して」などの文脈で使う。引用の正確性検証はpubmed-reference-verifierスキルに委譲する。
---

# 医療記事 論文検索・引用ガイド

Lancersで受注する医療監修・専門家レビュー記事の執筆で、「エビデンスの確認は原典まで遡って行う」を実務化するためのガイド。**検索はこのスキル、検証はpubmed-reference-verifierスキル**という役割分担。

## 全体の流れ

```
① 週次自動収集（brain/01-projects/lancers/paper-log.md）
    ↓ 気になった論文を選ぶ
② このスキルで深掘り検索（類似論文・被引用数・関連文献）
    ↓
③ article-content/lancers/drafts/ に執筆（{PMID}形式で引用）
    ↓
④ /pubmed-reference-verifier verify で引用を検証
    ↓
⑤ article-content/lancers/published/ へ
```

データの記録（週次ログ）はbrain側。**実際に手を動かす検索・執筆・検証はすべてこちら（article-content）で行う。**

---

## ① 論文検索（PubMed MCP の使い方）

PubMed検索には `mcp__pubmed-mcp-server__*` ツール群を使う。deferredの場合は先にまとめて読み込む：

```
ToolSearch: "select:mcp__pubmed-mcp-server__search,mcp__pubmed-mcp-server__fetch,mcp__pubmed-mcp-server__fetch_batch,mcp__pubmed-mcp-server__convert_ids,mcp__pubmed-mcp-server__find_similar_articles,mcp__pubmed-mcp-server__get_citation_counts,mcp__pubmed-mcp-server__count"
```

pubmed-reference-verifierスキルの検索パターン（`references/verification-rules.md` セクション6）をそのまま引き継ぐ。ツール名の対応関係だけ違う（このプロジェクトでは `pubmed-remote` ではなく `pubmed-mcp-server` という名前で接続されている）。

### キーワード検索

```
mcp__pubmed-mcp-server__search(
  query: "medication adherence AND home care",
  output_mode: "compact",   # authors/journal/year/doi/pmcidまで一度に取れる
  retmax: 10,
  sort: "relevance",        # または pub_date（最新順）
  filters: { date_range: { start: "2024/01/01", end: "2026/07/20" } }
)
```

- `output_mode: compact` を基本にする（`full`は抄録・MeSH用語まで必要なときだけ）
- タイトル・著者から特定の論文を探す場合は `query: "TITLE_WORDS[Title] AND SURNAME[Author]"` の形式

### バッチ取得（5件以上のPMIDを照合する場合）

```
mcp__pubmed-mcp-server__fetch_batch(
  pmids: ["37639719", "38012345", "39876543"],
  include_abstract: false   # 抄録不要なら軽量化
)
```

個別 `fetch` を繰り返さず、必ずバッチでまとめる。

### 類似論文（深掘り・スノーボーリング）

```
mcp__pubmed-mcp-server__find_similar_articles(pmid: "37639719", retmax: 20)
```

起点論文から関連文献を広げたいときに使う。

### 被引用数（重要度の判断材料）

```
mcp__pubmed-mcp-server__get_citation_counts(pmids: ["37639719"])
```

複数の候補論文から「どれを軸に書くか」を選ぶときの参考にする。

### DOI⇔PMID⇔PMCID変換

```
mcp__pubmed-mcp-server__convert_ids(from_type: "doi", to_type: "pmid", ids: ["10.1016/S0140-6736(24)00001-0"])
```

情報源がDOIしか分からない場合に使う。

### 利用上の注意

- レート制限・リトライはMCPサーバー側が処理するため、手動の待機は不要
- 5件以上のPMID照合は必ず `fetch_batch`（個別`fetch`の繰り返しは非効率）
- 抄録が不要なら `include_abstract: false` / `output_mode: compact` で軽量化

---

## ② 執筆時の引用ルール

- 本文中の引用は `{PMID}` 形式で埋め込む（例：`高齢者の服薬アドヒアランスに関する研究では{37639719}...`）
- 記事末尾に `## 参考文献` を作り、Vancouver形式・各行末尾に `PMID: xxxxx.` を必ず付ける：

  ```
  1. Smith J, Doe A. Title of article. J Name. 2024;100(1):1-10. doi:10.xxxx/xxxxx. PMID: 37639719.
  ```

- 本文で引用した`{PMID}`は全て参考文献リストに載せる（載っていないとpubmed-reference-verifierでE001＝参照先なし引用として検出される）
- 参考文献リストに載せた論文は本文で最低1回は引用する（していないとE002＝孤立参考文献）

### frontmatter（lancers案件用）

```
title: {{記事タイトル}}
作成日：{{date}}
プロジェクト：lancers
媒体：{{note / プロクル / 看護roo! 等}}
起点論文：PMID:{{起点となった論文のPMID}}
ステータス：draft   # draft → verified → published
```

---

## ③ 引用検証（pubmed-reference-verifierに委譲）

執筆がひと段落したら、検証は自分で再実装せず既存スキルを呼ぶ：

```
/pubmed-reference-verifier verify article-content/lancers/drafts/<ファイル名>.md
```

| モード | いつ使うか |
|---|---|
| `check` | 執筆途中、本文↔参考文献の対応だけオフラインで確認したいとき |
| `verify` | 執筆完了時。PubMedと書誌情報（著者・年・タイトル・巻号・ページ）までフル照合 |
| `fix` | verifyでERRORが出た後、修正案を自動生成させたいとき（diff確認後に適用） |

ERRORSが0件になるまで納品しない。0件を確認したらfrontmatterの ステータス を `verified` に更新する。

---

## ④ ファイル管理

- 執筆中・検証中：`article-content/lancers/drafts/`
- 検証OK・納品済み：`article-content/lancers/published/`（ステータスを `published` に更新してから移動）

## 関連

- brain `01-projects/lancers/paper-log.md`：週次自動収集された論文候補（データ台帳）
- brain `01-projects/lancers/clinical-advisory-scope.md`：書ける領域の確認
- pubmed-reference-verifier スキル：引用検証の実処理（本スキルはこれに検索フェーズを繋ぐ役割）
