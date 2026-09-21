# article-content

Zenn / Qiita / note / Substack の記事を一元管理するリポジトリ。媒体ごとにフォルダと投稿の自動化レベルが違うので、ここに一覧化しておく。

GitHub: https://github.com/uno-N/article-content（`main`ブランチにpushすると、下記の通り一部の媒体は自動で反映される）

## 媒体ごとの自動化状況

| 媒体 | 執筆フォルダ | 自動化レベル | 使っている仕組み |
|---|---|---|---|
| **Zenn** | `articles/*.md` | 自動（pushだけで反映） | Zenn公式のGitHub連携。`published: true`にしてこのリポジトリを`main`にpushすれば、Zenn側が自動で取り込む。ワークフローファイルは不要（Zenn側の仕組みなのでこのリポジトリには何も置いていない） |
| **Qiita** | `public/*.md` | 自動（pushだけで反映） | `.github/workflows/publish.yml`。`main`/`master`へのpushをトリガーに、`increments/qiita-cli/actions/publish@v1`が`public/`配下を読んでQiita APIに投稿する。GitHub Secretsに`QIITA_TOKEN`が必要（設定済み前提・失効していないか一度確認推奨） |
| **note** | `note/drafts/*.md` | 半自動（下書き保存までは自動・公開は手動） | `scripts/note-post/post.js`。Playwrightでnote.comにログインし、`note/notes/new`を開いてタイトル・本文を流し込み、下書き保存まで自動で行う。**公開ボタンは押さない**（意図的に手動に残してある）。使い方：`cd scripts/note-post && node post.js ../../note/drafts/ファイル名.md`。ログイン情報は`scripts/note-post/.env`（gitignore済み・`NOTE_EMAIL`/`NOTE_PASSWORD`） |
| **Substack** | `substack/drafts/*.md` | 手動（自動化はnote方式で実装予定・未着手） | 公式APIは読み取り専用（投稿不可）、公式のメール投稿機能もなし。noteと同じ方式（Playwrightでログイン→下書き保存、公開は手動）を採用する方針だが、スクリプトはまだ実装していない |

## フォルダ構成の補足

- `articles/` … Zenn用。frontmatterは`title`/`emoji`/`type`/`topics`/`published`
- `public/` … Qiita用（Qiita CLIの規約フォルダ）。一度投稿すると`id`がfrontmatterに書き込まれる
- `public/.remote/` … Qiita CLI (`qiita pull`) が取得した「Qiita上にはあるがこのリポジトリでは管理していない記事」のキャッシュ。手で編集する場所ではない
- `note/drafts/` → 投稿後は`note/published/`へ移動
- `substack/drafts/` → 投稿後は`substack/published/`へ移動
- `lancers/drafts/` `lancers/published/` … Lancers（外部納品用）の記事。SNS自動投稿とは無関係
- `books/` … Zennの「本」機能用（`cerebellum-memory`シリーズ）

## 記事の書き分け方針

各媒体の文体・構成ルールはスキルに分離してある（執筆時に該当スキルを呼ぶ）。

- Zenn → `zenn-article`スキル（技術者向け・手順の再現性重視）
- Qiita → `qiita-article`スキル（検索流入・エラー解決重視。Zennからの横流し手順あり）
- note → `note-article`スキル（体験・感情のストーリー重視）＋`note-engagement-patterns`（タイトル・書き出しパターン）
- SNS誘導投稿 → `sns-promo-post`スキル

## 気になっている点（要確認・未解決）

- `package.json`の`repository.url`が`zenn-content`のままになっている（GitHub上は`article-content`にリポジトリ名変更済み）。GitHubはリダイレクトするので実害はなさそうだが、Zenn側の連携設定がどちらの名前を見ているかは未確認
- QIITA_TOKENの有効期限・現在の設定値は未確認（Qiita自動投稿が急に止まったら、まずここを疑う）
- Substack自動化：調査完了（2026/09/21）。公式API・メール投稿とも投稿手段なし。noteと同じPlaywright方式を採用予定だが、スクリプト実装はこれから（`~/dev/brain/06-dashboard/tasks.md`にタスクあり）
- note公開の自動化（下書き→公開ボタンまで）は意図的に手動のまま。誤爆防止のためだが、信頼できるようになれば自動化を検討してもよい
