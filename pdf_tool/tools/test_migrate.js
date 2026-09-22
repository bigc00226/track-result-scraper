// 以前の設定（グレー背景＋緑文字・資格記録=前）が保存されている状態から開く
const { chromium } = require('playwright-core');
const path = require('path');
(async () => {
  const [pdf, shot] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:8765/pdf_startlist.php');
  await page.evaluate(() => localStorage.setItem('pdfToolOptions.startlist',
    JSON.stringify({ 'pdf-qualpos': 'before', 'pdf-teamformat': 'paren', 'pdf-labelstyle': 'green-text', 'pdf-openall': true })));
  await page.reload();
  console.log('labelstyle green-bg (new default):', await page.isChecked('input[name="pdf-labelstyle"][value="green-bg"]'));
  console.log('qualpos before kept:', await page.isChecked('input[name="pdf-qualpos"][value="before"]'));
  await page.setInputFiles('#pdf-file', path.resolve(pdf));
  await page.waitForFunction(() => /読み取りました/.test(document.getElementById('pdf-status').textContent), null, { timeout: 120000 });
  console.log('status:', await page.textContent('#pdf-status'));
  console.log('warn  :', (await page.textContent('#pdf-warn')).replace(/\s+/g, ' ').slice(0, 200));
  console.log('label style:', await page.locator('.ex-box label').first().getAttribute('style'));
  const tds = page.locator('.ex-box td');
  console.log('row 1:', (await tds.nth(1).textContent()).trim());
  await page.evaluate(() => document.querySelector('.ex-box').scrollIntoView());
  await page.screenshot({ path: shot });
  await browser.close();
})();
