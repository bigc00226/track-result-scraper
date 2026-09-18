// 女子の種目を開いて画面を保存（色の確認用）
const { chromium } = require('playwright-core');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  await page.goto('http://127.0.0.1:8765/pdf_startlist.php');
  await page.setInputFiles('#pdf-file', path.resolve(process.argv[2]));
  await page.waitForFunction(() => /読み取りました/.test(document.getElementById('pdf-status').textContent), null, { timeout: 120000 });
  const idx = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('.ex-box label'));
    const i = labels.findIndex(l => l.textContent.startsWith('女子'));
    document.querySelectorAll('.ex-box input[type=checkbox]')[i].checked = true;
    labels[i].scrollIntoView();
    return i;
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: process.argv[3] });
  await browser.close();
})();
