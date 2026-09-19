// トップページの PDF 欄の表示確認
const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  await page.goto('http://127.0.0.1:8765/tournament_result_top.php');
  const el = await page.locator('form[onsubmit*="pdf_result.php"]').first();
  await el.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -250));
  await page.screenshot({ path: process.argv[2] });
  await browser.close();
})();
