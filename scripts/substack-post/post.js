// Substack 半自動投稿スクリプト（note-post/post.js と同じ設計）
// 使い方: node post.js <markdownファイルのパス>
// 例: node post.js ../../substack/drafts/gakkai-homecare-cybersecurity.md
//
// 前提: このリポジトリのsubstack/drafts形式（1行目=タイトル、2行目=サブタイトル、
//       3行目=著者名、4行目=日付、5行目=空行、6行目以降=本文）を読む。
// 本文はMarkdown→HTML変換してからクリップボード経由で貼り付ける
// （プレーンテキストのまま貼ると、##や**がリッチテキストに変換されず記号のまま表示されるため）。
//
// ログイン: SUBSTACK_PASSWORD が.envにあればパスワードログインを試す。
//           なければメールに届く確認コードを手動入力してもらう（初回だけでよいはず）。

const { chromium } = require('playwright');
const { marked } = require('marked');
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
  let bodyStartIndex = 4;
  while (bodyStartIndex < lines.length && lines[bodyStartIndex].trim() === '') {
    bodyStartIndex++;
  }
  const bodyMarkdown = lines.slice(bodyStartIndex).join('\n').trim();
  const bodyHtml = marked.parse(bodyMarkdown);

  return { title, subtitle, bodyHtml };
}

async function isLoggedIn(page) {
  await page.goto(`${PUB_URL}/publish/posts`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  return !page.url().includes('sign-in') && !page.url().includes('/sign-up');
}

async function login(page) {
  console.log('ログイン中...');
  await page.goto('https://substack.com/sign-in');
  await page.waitForLoadState('networkidle');

  const emailSelector = 'input[type="email"], input[name="email"]';
  await page.waitForSelector(emailSelector, { timeout: 15000 });
  await page.fill(emailSelector, process.env.SUBSTACK_EMAIL);

  if (process.env.SUBSTACK_PASSWORD) {
    // パスワードログインに切り替えるリンクがあれば押す
    const passwordToggle = page.locator('text=/sign in with password/i, text=/パスワードで(サインイン|ログイン)/');
    if (await passwordToggle.count() > 0) {
      await passwordToggle.first().click();
      await page.waitForTimeout(500);
    }

    const passwordField = await page.waitForSelector('input[type="password"]', { timeout: 5000 }).catch(() => null);

    if (passwordField) {
      await page.fill('input[type="password"]', process.env.SUBSTACK_PASSWORD);
      await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Continue")').first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await page.context().storageState({ path: SESSION_FILE });
      console.log('パスワードでログイン完了。セッションを保存しました。');
      return true;
    }
    console.log('パスワード欄が見つからなかったので、確認コード方式にフォールバックします。');
  }

  // 確認コード方式（人の手で入力してもらう）
  const sendCodeButton = page.locator('button[type="submit"], button:has-text("Continue")');
  await sendCodeButton.first().click();

  console.log('');
  console.log('====================================================');
  console.log('メールに届いた確認コードを、開いたブラウザ画面に');
  console.log('手動で入力してログインしてください（5分以内）。');
  console.log('====================================================');
  console.log('');

  try {
    await page.waitForURL((url) => !url.pathname.includes('sign-in'), { timeout: 5 * 60 * 1000 });
  } catch {
    console.error('5分待ちましたがログインが完了しませんでした。もう一度実行してください。');
    return false;
  }

  await page.waitForLoadState('networkidle');
  await page.context().storageState({ path: SESSION_FILE });
  console.log('ログイン完了。セッションを保存しました。');
  return true;
}

async function pasteHtml(page, selector, html) {
  await page.click(selector);
  await page.evaluate(async (htmlContent) => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const item = new ClipboardItem({ 'text/html': blob });
    await navigator.clipboard.write([item]);
  }, html);
  await page.keyboard.press('Meta+v');
  await page.waitForTimeout(1000);
}

async function postToDraft(filePath) {
  if (!PUB_URL) {
    console.error('.env に SUBSTACK_PUBLICATION_URL を設定してください（例: https://yourname.substack.com）');
    return;
  }

  const { title, subtitle, bodyHtml } = parseMarkdown(filePath);
  console.log(`タイトル: ${title}`);
  console.log(`サブタイトル: ${subtitle}`);

  const contextOptions = fs.existsSync(SESSION_FILE) ? { storageState: SESSION_FILE } : {};

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext(contextOptions);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const page = await context.newPage();

  const loggedIn = await isLoggedIn(page);
  if (!loggedIn) {
    if (!process.env.SUBSTACK_EMAIL) {
      console.error('.env に SUBSTACK_EMAIL を設定してください');
      await browser.close();
      return;
    }
    const ok = await login(page);
    if (!ok) return;
  }

  console.log('新規投稿ページへ移動...');
  await page.goto(`${PUB_URL}/publish/post`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  if (process.env.DEBUG_DOM) {
    await page.screenshot({ path: path.join(__dirname, 'debug-screenshot.png'), fullPage: false });
    const dump = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('textarea, [contenteditable="true"], input, [role="textbox"]'));
      return els.slice(0, 40).map((el) => ({
        tag: el.tagName,
        placeholder: el.getAttribute('placeholder'),
        dataPlaceholder: el.getAttribute('data-placeholder'),
        ariaLabel: el.getAttribute('aria-label'),
        className: (el.className || '').toString().slice(0, 120),
        id: el.id,
      }));
    });
    fs.writeFileSync(path.join(__dirname, 'debug-dom.json'), JSON.stringify(dump, null, 2));
    console.log('デバッグ情報を debug-screenshot.png / debug-dom.json に保存しました');
    await browser.close();
    return;
  }

  const titleSelector = 'textarea[placeholder="Title"], [data-placeholder="Title"], div[contenteditable="true"][placeholder="Title"]';
  await page.waitForSelector(titleSelector, { timeout: 15000 });
  await page.click(titleSelector);
  await page.fill(titleSelector, title).catch(async () => {
    await page.keyboard.type(title);
  });
  console.log('タイトル入力完了');

  const subtitleSelector = 'textarea[placeholder*="subtitle" i], [data-placeholder*="subtitle" i]';
  const subtitleField = await page.$(subtitleSelector);
  if (subtitleField && subtitle) {
    await subtitleField.click();
    await subtitleField.fill(subtitle).catch(async () => {
      await page.keyboard.type(subtitle);
    });
    console.log('サブタイトル入力完了');
  } else {
    console.log('サブタイトル欄が見つからなかったので、あとで手動で確認してください');
  }

  await page.keyboard.press('Tab');
  await page.waitForTimeout(500);

  const editorSelector = '.ProseMirror, [contenteditable="true"]';
  const editorHandles = await page.$$(editorSelector);
  let bodyEditor = null;
  for (const handle of editorHandles) {
    const placeholder = (await handle.getAttribute('data-placeholder')) || (await handle.getAttribute('placeholder')) || '';
    if (!/title|subtitle/i.test(placeholder)) {
      bodyEditor = handle;
      break;
    }
  }

  if (!bodyEditor) {
    console.error('本文エリアが見つかりませんでした。DEBUG_DOM=1 で再実行して確認してください。');
    return;
  }

  await bodyEditor.click();
  await page.evaluate(async (htmlContent) => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const item = new ClipboardItem({ 'text/html': blob });
    await navigator.clipboard.write([item]);
  }, bodyHtml);
  await page.keyboard.press('Meta+v');
  await page.waitForTimeout(1500);
  console.log('本文入力完了（Markdown→HTML変換して貼り付け）');

  await page.waitForTimeout(2000);
  console.log('✅ 下書き保存（自動保存）を確認してください。画像は別途手動で挿入してください。');
  console.log('公開するときは手動でブラウザから行ってください。');

  // ブラウザは開いたまま（内容を目視確認できるように）
  // await browser.close();
}

const filePath = process.argv[2];
if (!filePath) {
  console.error('使い方: node post.js <markdownファイルのパス>');
  process.exit(1);
}

const resolvedPath = path.resolve(__dirname, filePath);
if (!fs.existsSync(resolvedPath)) {
  console.error(`ファイルが見つかりません: ${resolvedPath}`);
  process.exit(1);
}

postToDraft(resolvedPath).catch(console.error);
