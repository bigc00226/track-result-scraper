// 表示の切り替えを確認して画面を保存
const { chromium } = require('playwright-core');
const path = require('path');
(async () => {
  const [pdf, out] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 760 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://127.0.0.1:8765/pdf_startlist.php');
  await page.setInputFiles('#pdf-file', path.resolve(pdf));
  await page.waitForFunction(() => /読み取りました/.test(document.getElementById('pdf-status').textContent), null, { timeout: 120000 });
  console.log('status:', await page.textContent('#pdf-status'));
  // 既定（グレー背景＋緑文字・(所属・都道府県)・最初から開く）
  await page.evaluate(() => document.querySelector('.ex-box').scrollIntoView());
  await page.screenshot({ path: out });
  console.log('default row:', await page.locator('.ex-box td').nth(1).textContent());
  // 緑背景＋濃い文字 / 所属(都道府県) / 閉じた状態
  await page.check('input[name="pdf-labelstyle"][value="green-bg"]');
  await page.check('input[name="pdf-teamformat"][value="plain"]');
  await page.uncheck('#pdf-openall');
  await page.waitForTimeout(300);
  console.log('alt row    :', await page.locator('.ex-box td').nth(1).textContent());
  console.log('open?      :', await page.locator('.ex-box input[type=checkbox]').first().isChecked());
  await page.screenshot({ path: out.replace('.png', '_alt.png') });
  console.log('errors:', errs.length ? errs : 'none');
  await browser.close();
})();
