// Substack 半自動投稿スクリプト（note-post/post.js と同じ設計）
// 使い方: node post.js <markdownファイルのパス>
// 例: node post.js ../../substack/drafts/gakkai-homecare-cybersecurity.md
//
// 前提: このリポジトリのsubstack/drafts形式（1行目=タイトル、2行目=サブタイトル、
//       3行目=著者名、4行目=日付、5行目=空行、6行目以降=本文）を読む。
//
// 注意: Substackの編集画面のDOM構造は実機で未検証。セレクタが合わない場合は
//       headless: false で開いた画面を見ながら、該当箇所を直接調整すること。

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SESSION_FILE = path.join(__dirname, 'session.json');
const PUB_URL = (process.env.SUBSTACK_PUBLICATION_URL || '').replace(/\/$/, '');

function parseMarkdown(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n');

  const title = (lines[0] || '').trim();
  const subtitle = (lines[1] || '').trim();
  // 3行目=著者名, 4行目=日付は投稿本文に使わないのでスキップ
  // 5行目が空行、6行目以降が本文という前提
  let bodyStartIndex = 4;
  while (bodyStartIndex < lines.length && lines[bodyStartIndex].trim() === '') {
    bodyStartIndex++;
  }
  const body = lines.slice(bodyStartIndex).join('\n').trim();

  return { title, subtitle, body };
}

async function login(page) {
  console.log('ログイン中...');
  await page.goto('https://substack.com/sign-in');
  await page.waitForLoadState('networkidle');

  // メール入力→送信（Substackはパスワードではなく、メールに届く確認コード方式）
  const emailSelector = 'input[type="email"], input[name="email"]';
  await page.waitForSelector(emailSelector, { timeout: 15000 });
  await page.fill(emailSelector, process.env.SUBSTACK_EMAIL);

  const sendCodeButton = page.locator('button[type="submit"], button:has-text("Continue")');
  await sendCodeButton.first().click();

  console.log('');
  console.log('====================================================');
  console.log('メールに届いた確認コードを、開いたブラウザ画面に');
  console.log('手動で入力してログインしてください。');
  console.log('ログインが完了すると、自動で続きの処理に進みます。');
  console.log('====================================================');
  console.log('');

  // ログイン完了（sign-inページから離脱）を、最大5分待つ
  try {
    await page.waitForURL((url) => !url.pathname.includes('sign-in'), { timeout: 5 * 60 * 1000 });
  } catch {
    console.error('5分待ちましたがログインが完了しませんでした。もう一度実行してください。');
    return false;
  }

  await page.waitForLoadState('networkidle');

  // セッション保存（次回以降はコード入力なしで再利用される）
  await page.context().storageState({ path: SESSION_FILE });
  console.log('ログイン完了。セッションを保存しました（次回からはこの手順は不要なはずです）。');
  return true;
}

async function postToDraft(filePath) {
  if (!PUB_URL) {
    console.error('.env に SUBSTACK_PUBLICATION_URL を設定してください（例: https://yourname.substack.com）');
    return;
  }

  const { title, subtitle, body } = parseMarkdown(filePath);
  console.log(`タイトル: ${title}`);
  console.log(`サブタイトル: ${subtitle}`);
  console.log(`本文: ${body.slice(0, 80)}...`);

  const contextOptions = fs.existsSync(SESSION_FILE)
    ? { storageState: SESSION_FILE }
    : {};

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  // ログイン確認
  await page.goto(PUB_URL);
  await page.waitForLoadState('networkidle');
  const isLoggedIn = await page.$('a[href*="/publish"]') !== null;

  if (!isLoggedIn) {
    if (!process.env.SUBSTACK_EMAIL) {
      console.error('.env に SUBSTACK_EMAIL を設定してください');
      await browser.close();
      return;
    }
    const ok = await login(page);
    if (!ok) {
      // ブラウザは開いたまま。手動でログインしてもらい、続きは自分で操作してもらう
      return;
    }
  }

  // 新規投稿ページへ
  console.log('新規投稿ページへ移動...');
  await page.goto(`${PUB_URL}/publish/post`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // タイトル入力
  const titleSelector = 'textarea[placeholder="Title"], [data-placeholder="Title"], div[contenteditable="true"][placeholder="Title"]';
  await page.waitForSelector(titleSelector, { timeout: 15000 });
  await page.click(titleSelector);
  await page.fill(titleSelector, title).catch(async () => {
    // contenteditableでfillが効かない場合はキー入力で代用
    await page.keyboard.type(title);
  });
  console.log('タイトル入力完了');

  // サブタイトル入力
  const subtitleSelector = 'textarea[placeholder*="subtitle" i], [data-placeholder*="subtitle" i]';
  const subtitleField = await page.$(subtitleSelector);
  if (subtitleField && subtitle) {
    await subtitleField.click();
    await subtitleField.fill(subtitle).catch(async () => {
      await page.keyboard.type(subtitle);
    });
    console.log('サブタイトル入力完了');
  } else {
    console.log('サブタイトル欄が見つからなかったので、本文に含めて確認してください');
  }

  // 本文エリアへ移動
  await page.keyboard.press('Tab');
  await page.waitForTimeout(500);

  // クリップボード経由で本文を貼り付け
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text).catch(() => {});
  }, body);

  const editorSelector = '.ProseMirror, [contenteditable="true"]:not([placeholder*="itle" i]):not([placeholder*="ubtitle" i])';
  const editorHandles = await page.$$(editorSelector);
  for (const handle of editorHandles) {
    const placeholder = (await handle.getAttribute('data-placeholder')) || '';
    if (!/title|subtitle/i.test(placeholder)) {
      await handle.click();
      break;
    }
  }
  await page.waitForTimeout(300);
  await page.keyboard.press('Meta+v');
  await page.waitForTimeout(1000);
  console.log('本文入力完了');

  // Substackは基本自動保存。念のため少し待ってから確認する
  await page.waitForTimeout(2000);

  console.log('✅ 下書き保存（自動保存）を確認してください。');
  console.log('公開するときは手動でブラウザから行ってください。');

  // ブラウザは開いたまま（内容を目視確認できるように）
  // await browser.close();
}

const filePath = process.argv[2];
if (!filePath) {
  console.error('使い方: node post.js <markdownファイルのパス>');
  console.error('例: node post.js ../../substack/drafts/gakkai-homecare-cybersecurity.md');
  process.exit(1);
}

const resolvedPath = path.resolve(__dirname, filePath);
if (!fs.existsSync(resolvedPath)) {
  console.error(`ファイルが見つかりません: ${resolvedPath}`);
  process.exit(1);
}

postToDraft(resolvedPath).catch(console.error);
