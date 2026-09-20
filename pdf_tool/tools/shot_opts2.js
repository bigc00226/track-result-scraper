// 設定が記憶されるか確認
const { chromium } = require('playwright-core');
const path = require('path');
(async () => {
  const [pdf] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:8765/pdf_startlist.php');
  await page.check('input[name="pdf-qualpos"][value="before"]');
  await page.check('input[name="pdf-teamformat"][value="plain"]');
  await page.uncheck('#pdf-openall');
  const p2 = await ctx.newPage();
  await p2.goto('http://127.0.0.1:8765/pdf_startlist.php');
  console.log('qualpos before kept:', await p2.isChecked('input[name="pdf-qualpos"][value="before"]'));
  console.log('teamformat plain kept:', await p2.isChecked('input[name="pdf-teamformat"][value="plain"]'));
  console.log('openall off kept:', !(await p2.isChecked('#pdf-openall')));
  await p2.setInputFiles('#pdf-file', path.resolve(pdf));
  await p2.waitForFunction(() => /読み取りました/.test(document.getElementById('pdf-status').textContent), null, { timeout: 120000 });
  console.log('row:', (await p2.locator('.ex-box td').nth(1).textContent()).trim());
  await browser.close();
})();
