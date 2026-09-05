---
name: content-ideation
description: 記事企画がないときに、既存コンテンツ全体とプロダクトの進捗を確認した上で、新しい記事の企画案を出す。「書くネタがない」「企画案を出して」「次何を書けばいいか」などの文脈で使う。
---

# コンテンツ企画棚卸しガイド

書くネタが尽きたときに、ゼロから思いつこうとするのではなく、**①すでに書いたもの ②プロダクトの直近の進捗** の2つを実際に確認してから企画を出す。今日ここに至った経緯そのもの（Zennの開発日記2本は、実装ドキュメント・migrationファイル・git logを掘り起こして生まれた）を再現可能な手順にしたもの。

---

## Step 1: 既存コンテンツの棚卸し

以下のディレクトリを確認し、公開済み・下書き含めて「何を・どの媒体で・どの角度で書いたか」を一覧化する。

| 媒体 | パス |
|---|---|
| Zenn | `articles/` |
| note（公開済み） | `note/published/` |
| note（下書き） | `note/drafts/` |
| Qiita | `public/` |
| Substack | `substack/` |
| Lancers | `lancers/drafts/`, `lancers/published/` |
| Zenn本 | `books/` |

各ファイルのタイトル（frontmatterまたは冒頭見出し）を拾って、テーマ・シリーズ・角度が重複していないかを見る。`note/drafts/ideas.md` には未使用のアイデアストックがあるので、そこも必ず確認する（すでに考えてあるネタを再提案するだけで済む場合がある）。

## Step 2: プロダクトの進捗確認

「最近やったこと」の中に、まだ記事化されていない実装・気づき・トラブルがないかを確認する。

1. `/Users/nakagawayuno/dev/brain/06-dashboard/tasks.md` の直近2週間分の `[x]` 完了タスクを、ねぃろ・てあて・残薬アプリのカテゴリで確認する
2. 各プロダクトリポジトリの直近コミットを確認する：
   ```
   cd /Users/nakagawayuno/dev/zannyaku-api && git log --oneline -15
   cd /Users/nakagawayuno/dev/zannyaku-app && git log --oneline -15
   cd /Users/nakagawayuno/dev/neiro-app && git log --oneline -15
   ```
3. コミットメッセージや`docs/`配下の調査記録（例：`login-timeout-investigation.md`のような一次資料）から、「実際に困って解決した」ネタを探す。これが一番刺さる開発日記になりやすい（実例：zannyaku-dev-diary-02はSECURITY_CHECKLIST.mdとmigrationファイルの精査から生まれた）

## Step 3: 空白地帯との照合

`note-engagement-patterns` スキルの「Yunoが書ける空白地帯」表と、`brain/07-profile/strategy-master.md`のポジショニングを参照し、Step1・Step2で見つかった候補が以下のどれかに当てはまるかを確認する：

- 訪問看護師×ICT×当事者（「入れた側」でなく「現場にいる側」のリアル）
- 看護師×映画セルフケア（かつての自分を救う処方として選んだ話）
- 非エンジニア看護師×アプリ開発（失敗含む一人称開発日記）
- 抑うつ経験×回復（音楽・映画・創作が処方になる実体験）

当てはまらない候補でも良いが、当てはまる候補は差別化度が高いので優先度を上げる。

## Step 4: 企画案の提示

3〜5個の企画案を、以下の形式でYunoに提示する：

```
### 案N：[仮タイトル]
- 媒体：[note / Zenn / Qiita / Substack]
- ネタ元：[Step1/2で見つけた具体的な材料]
- 想定読者：[ICT系 / ミッドクライシス系 / エンジニア 等]
- 差別化ポイント：[Step3の空白地帯との合致点、または独自性]
```

「これで書きますか？他の案がいいですか？」と確認して、決まったら該当する `note-article` / `zenn-article` / `qiita-article` スキルに引き継ぐ。
