// タイムテーブルの画面確認：node tools/shot_tt.js <pdf> <out.png> [time|pdf]
//   CSS のない素のページに貼った場合の見た目も保存（<out>_bare.png）
const { chromium } = require('playwright-core');
const path = require('path');
(async () => {
  const [pdf, out, sort = 'time'] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://127.0.0.1:8765/pdf_timetable.php');
  await page.setInputFiles('#pdf-file', path.resolve(pdf));
  await page.waitForFunction(() => /読み取りました|見つかりません/.test(document.getElementById('pdf-status').textContent + document.getElementById('pdf-warn').textContent), null, { timeout: 120000 });
  await page.check(`input[name="pdf-ttsort"][value="${sort}"]`);
  await page.waitForTimeout(300);
  console.log('status:', await page.textContent('#pdf-status'));
  console.log('first rows:', (await page.locator('.ex-box tr').evaluateAll(trs => trs.slice(0, 6).map(tr => tr.innerText.replace(/\s+/g, ' ')))).join(' / '));
  const body = await page.evaluate(() => document.querySelector('.ex-box').outerHTML);
  const bare = await browser.newPage({ viewport: { width: 1000, height: 900 } });
  await bare.setContent('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>' + body + '</body></html>');
  await bare.screenshot({ path: out.replace('.png', '_bare.png') });
  console.log('errors:', errs.length ? errs : 'none');
  await browser.close();
})();
