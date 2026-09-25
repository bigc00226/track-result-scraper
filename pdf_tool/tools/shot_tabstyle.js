// 貼り付け先のサイトを想定した確認：node tools/shot_tabstyle.js <pdf> <out.png> [details|plain]
//   (1) CSS なしの素のページ  (2) NISHI と同じ CSS があるページ（チェックボックスは削除）
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
(async () => {
  const [pdf, out, mode = 'details'] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://127.0.0.1:8765/pdf_startlist.php');
  await page.setInputFiles('#pdf-file', path.resolve(pdf));
  await page.waitForFunction(() => /読み取りました/.test(document.getElementById('pdf-status').textContent), null, { timeout: 120000 });
  await page.check(`input[name="pdf-tabstyle"][value="${mode}"]`);
  await page.waitForTimeout(300);
  const body = await page.evaluate(() => document.querySelector('.ex-box').outerHTML);
  console.log('html head:', body.slice(0, 420).replace(/\r?\n/g, ' '));
  // (1) CSS なし
  const bare = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  await bare.setContent('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>' + body + '</body></html>');
  await bare.screenshot({ path: out });
  // (2) サイトの CSS あり・チェックボックスを削除（CMS に消された状態）
  const css = fs.readFileSync(path.join(__dirname, '../web/pdf_startlist.php'), 'utf8').match(/<style type="text\/css">([\s\S]*?)<\/style>/)[1];
  const site = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  await site.setContent('<!DOCTYPE html><html><head><meta charset="utf-8"><style>' + css + '</style></head><body>' + body.replace(/<input[^>]*>/g, '') + '</body></html>');
  await site.screenshot({ path: out.replace('.png', '_site.png') });
  const visibleRows = await site.evaluate(() => [...document.querySelectorAll('td')].filter(td => td.getBoundingClientRect().height > 0).length);
  console.log('visible cells with site CSS (checkbox removed):', visibleRows, '/', await site.locator('td').count());
  console.log('errors:', errs.length ? errs : 'none');
  await browser.close();
})();
