---
title: GitとGitHubとは？——コードを「保存・公開・共有」する仕組みをゼロから理解する
platform: note
membership: false
tags: ["ICT", "Git", "GitHub", "医療職", "超入門"]
---

コードを書いていて、こんなことが起きたことはないですか。

「昨日まで動いていたのに、何か変えたら壊れた。どこを変えたかわからない。」

Gitはそれを防ぐための仕組みです。

---

ICTを学びたいと思いながら、どこから手をつければいいかわからない。
そういう医療職の人に向けて書いています。

私は訪問看護師をしながら、音楽療法アプリをゼロから開発しています。
非エンジニア・文系・コード歴2年未満。

---

## この記事でできるようになること

- GitとGitHubの違いがわかる
- Gitの基本操作（init・add・commit）ができる
- GitHubにコードをアップできる

**前提：ターミナルの基本操作（cd・ls）が使えればOK。**

---

## GitとGitHubは別物

まずここを整理します。

| | Git | GitHub |
|---|---|---|
| 何か | バージョン管理ツール | Gitを使うためのWebサービス |
| どこにある | 自分のパソコンの中 | インターネット上 |
| 役割 | 変更履歴を記録する | 履歴をクラウドに保存・公開する |

Gitは「変更履歴を記録する仕組み」で、自分のパソコンの中で動きます。
GitHubはその履歴をインターネット上に保存・公開できるサービスです。

電子カルテで例えると——Gitはローカルで記録を書く機能、GitHubはそれをクラウドサーバーに同期する機能です。

---

## Gitをインストールする

ターミナルで以下を入力して確認します。

```bash
git --version
```

バージョン番号が出ればインストール済みです。

```
git version 2.x.x
```

出なかった場合は `git` と検索してインストーラーをダウンロードしてください。

---

## Gitの基本操作

### フォルダをGitで管理する（init）

前回作った `html-practice` フォルダで試します。

```bash
cd ~/Desktop/html-practice
git init
```

`git init` は「このフォルダをGitで管理し始める」という宣言です。
`.git` という隠しフォルダが作られます（見えなくても存在しています）。

### 変更を記録する（add → commit）

Gitの記録は2ステップです。

```bash
git add .        # 変更したファイルを「記録の準備」に入れる
git commit -m "最初のHTMLを作成"    # 記録する（メッセージをつける）
```

`git add .` の `.` は「今いるフォルダの変更全部」という意味です。

`git commit` は変更内容を確定して記録します。`-m "..."` の中がメモ（コミットメッセージ）です。

カルテ記録と同じです。「何をしたか」「いつか」が残ります。

### 記録の履歴を確認する（log）

```bash
git log
```

これまでのcommitの一覧が出ます。「いつ・誰が・どんな変更をしたか」が確認できます。

```
commit a1b2c3d...
Author: Yuno <xxx@gmail.com>
Date:   Thu Apr 24 2026

    最初のHTMLを作成
```

---

## GitHubにアップする

### GitHubアカウントを作る

`github.com` でアカウントを作ります（無料です）。

### 新しいリポジトリを作る

GitHubにログインして「New repository」をクリックします。

- Repository name：`html-practice`
- Public / Private：Public（公開）またはPrivate（非公開）を選ぶ
- 「Create repository」をクリック

リポジトリ＝Gitで管理するプロジェクトの単位です。

### ローカルのGitとGitHubを接続する

GitHubがリポジトリを作ると、次の手順が表示されます。

```bash
git remote add origin https://github.com/あなたのID/html-practice.git
git branch -M main
git push -u origin main
```

これを順番にターミナルで実行します。

- `git remote add origin ...` — GitHubのURLを「origin」という名前で登録する
- `git push` — ローカルの記録をGitHubにアップロードする

GitHubの画面を更新すると、ファイルが表示されます。

---

## 日常的な作業の流れ

コードを変えるたびに以下を繰り返します。

```bash
git add .
git commit -m "変更内容のメモ"
git push
```

この3コマンドが基本です。

---

## `.gitignore`——アップしてはいけないファイルを指定する

GitHubはパブリックにすると全世界から見えます。パスワードやAPIキーが書かれたファイルは絶対にアップしてはいけません。

`.gitignore` というファイルに「アップしないファイル名」を書いておくと、`git add` の対象から除外されます。

```
# .gitignore
.env
```

これを書いておけば `.env` ファイルはGitHubに上がりません。APIキーの扱いについては次の記事で詳しく書きます。

---

## まとめ

| コマンド | 意味 |
|---|---|
| `git init` | フォルダをGitで管理し始める |
| `git add .` | 変更を記録の準備に入れる |
| `git commit -m "メモ"` | 変更を記録する |
| `git push` | GitHubにアップロードする |
| `git log` | 変更履歴を確認する |

次は「API」——外部サービスの機能をコードから使う仕組みを理解します。

---

**次の記事：**
[APIとは？——「注文して受け取る」仕組みをコードで理解する](準備中)
