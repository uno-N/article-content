const { chromium } = require('playwright');
require('dotenv').config();

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  await page.goto('https://note.com/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // メール入力
  await page.fill('#email', process.env.NOTE_EMAIL);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'after-email.png' });

  // ボタン一覧
  const buttons = await page.$$eval('button', els =>
    els.map(e => ({ type: e.type, text: e.textContent?.trim(), class: e.className }))
  );
  console.log('ボタン一覧:', JSON.stringify(buttons, null, 2));

  await browser.close();
})();
