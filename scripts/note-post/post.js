// note.com 半自動投稿スクリプト
// 使い方: node post.js <markdownファイルのパス>
// 例: node post.js ../../../article-content/note/drafts/dev-diary-07-lyria-prompt.md

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SESSION_FILE = path.join(__dirname, 'session.json');

function parseMarkdown(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n');

  // 最初の # 行をタイトルとして取得
  let title = '';
  let bodyStartIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('# ')) {
      title = lines[i].replace(/^# /, '').trim();
      bodyStartIndex = i + 1;
      break;
    }
  }

  // タイトル以降を本文として取得（先頭の空行はスキップ）
  const body = lines.slice(bodyStartIndex).join('\n').trim();

  return { title, body };
}

async function login(page) {
  console.log('ログイン中...');
  await page.goto('https://note.com/login');
  await page.waitForLoadState('networkidle');

  await page.fill('#email', process.env.NOTE_EMAIL);
  await page.fill('#password', process.env.NOTE_PASSWORD);
  await page.click('button:has-text("ログイン")');
  await page.waitForLoadState('networkidle');

  // セッション保存
  await page.context().storageState({ path: SESSION_FILE });
  console.log('ログイン完了');
}

async function postToDraft(filePath) {
  const { title, body } = parseMarkdown(filePath);
  console.log(`タイトル: ${title}`);
  console.log(`本文: ${body.slice(0, 80)}...`);

  // セッションが残っていれば再利用
  const contextOptions = fs.existsSync(SESSION_FILE)
    ? { storageState: SESSION_FILE }
    : {};

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  // ログイン確認
  await page.goto('https://note.com');
  await page.waitForLoadState('networkidle');
  const isLoggedIn = await page.$('a[href*="/settings"]') !== null;

  if (!isLoggedIn) {
    if (!process.env.NOTE_EMAIL || !process.env.NOTE_PASSWORD) {
      console.error('.env に NOTE_EMAIL と NOTE_PASSWORD を設定してください');
      await browser.close();
      return;
    }
    await login(page);
  }

  // ログイン後のリダイレクトが落ち着くのを待つ
  await page.waitForTimeout(3000);

  // 新規記事作成ページへ
  console.log('新規記事作成ページへ移動...');
  await page.goto('https://note.com/notes/new', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // タイトル入力
  const titleSelector = 'textarea[placeholder="記事タイトル"], input[placeholder="記事タイトル"], [data-placeholder="記事タイトル"]';
  await page.waitForSelector(titleSelector, { timeout: 10000 });
  await page.click(titleSelector);
  await page.fill(titleSelector, title);
  console.log('タイトル入力完了');

  // 本文エリアへ移動・入力
  await page.keyboard.press('Tab');
  await page.waitForTimeout(500);

  // クリップボード経由で本文を貼り付け
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text).catch(() => {});
  }, body);

  // 本文エリアにフォーカス・貼り付け
  const editorSelector = '.ProseMirror, [contenteditable="true"]:not([placeholder*="タイトル"]), .note-editor__body';
  const editorHandles = await page.$$(editorSelector);
  // タイトル以外の最初のcontenteditable
  for (const handle of editorHandles) {
    const placeholder = await handle.getAttribute('data-placeholder') || '';
    if (!placeholder.includes('タイトル')) {
      await handle.click();
      break;
    }
  }
  await page.waitForTimeout(300);
  await page.keyboard.press('Meta+v');
  await page.waitForTimeout(1000);
  console.log('本文入力完了');

  // 下書き保存（Cmd+S または保存ボタン）
  await page.keyboard.press('Meta+s');
  await page.waitForTimeout(2000);

  // 保存ボタンがあればクリック
  const saveBtn = await page.$('button:has-text("下書き保存"), button:has-text("保存")');
  if (saveBtn) {
    await saveBtn.click();
    await page.waitForTimeout(2000);
  }

  console.log('✅ 下書き保存完了！ブラウザを確認してください。');
  console.log('公開するときは手動でブラウザから行ってください。');

  // ブラウザは開いたまま（ユーザーが確認・編集できるように）
  // await browser.close();
}

// 引数チェック
const filePath = process.argv[2];
if (!filePath) {
  console.error('使い方: node post.js <markdownファイルのパス>');
  console.error('例: node post.js ../../article-content/note/drafts/dev-diary-07-lyria-prompt.md');
  process.exit(1);
}

const resolvedPath = path.resolve(__dirname, filePath);
if (!fs.existsSync(resolvedPath)) {
  console.error(`ファイルが見つかりません: ${resolvedPath}`);
  process.exit(1);
}

postToDraft(resolvedPath).catch(console.error);
