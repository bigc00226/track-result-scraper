// タイムテーブルをスマートフォンの幅で表示した画面：node tools/shot_tt_phone.js <pdf> <out.png> [jt|field|none]
//   コピーした HTML を CSS のない素のページに貼った状態で、幅 375px で表示する
const { chromium } = require('playwright-core');
const path = require('path');
(async () => {
  const [pdf, out, section = 'jt'] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://127.0.0.1:8765/pdf_timetable.php');
  await page.setInputFiles('#pdf-file', path.resolve(pdf));
  await page.waitForFunction(() => /読み取りました/.test(document.getElementById('pdf-status').textContent), null, { timeout: 120000 });
  await page.check(`input[name="pdf-ttsection"][value="${section}"]`);
  await page.waitForTimeout(300);
  console.log('status:', await page.textContent('#pdf-status'));
  const body = await page.evaluate(() => document.querySelector('.ex-box').outerHTML);
  const phone = await browser.newPage({ viewport: { width: 375, height: 800 }, deviceScaleFactor: 2 });
  await phone.setContent('<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:8px;">' + body + '</body></html>');
  // 性別の列が 1行で表示されているか（セルの高さが 1行分か）
  const multi = await phone.evaluate(() => {
    const bad = [];
    document.querySelectorAll('.t-tbl tr').forEach(tr => {
      const tds = tr.querySelectorAll('td');
      if (tds.length < 5) return;
      [0, 1, tds.length - 1].forEach(i => {
        const td = tds[i], r = document.createRange(); r.selectNodeContents(td);
        const lines = r.getClientRects().length;
        if (lines > 1) bad.push(td.textContent);
      });
    });
    return bad.slice(0, 5);
  });
  console.log('wrapped time/gender/heats cells:', multi.length ? multi : 'none');
  console.log('page width fits:', await phone.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await phone.screenshot({ path: out });
  console.log('errors:', errs.length ? errs : 'none');
  await browser.close();
})();
