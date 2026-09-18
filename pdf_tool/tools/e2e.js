// ブラウザでの動作確認: node tools/e2e.js <mode> <pdf> [screenshot.png]
//   トップページ(テスト用)で PDF を選んで GO!! → 新しいタブで読み取り → コピーを確認
const { chromium } = require('playwright-core');
const path = require('path');
(async () => {
  const [mode, pdf, shot] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
  const ctx = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'], viewport: { width: 1100, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  ctx.on('page', p => p.on('pageerror', e => errors.push(e.message)));
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/top_test.html');
  const formSel = mode === 'result' ? 'form:nth-of-type(1)' : 'form:nth-of-type(2)';
  await page.setInputFiles(`${formSel} input[type=file]`, path.resolve(pdf));
  const [out] = await Promise.all([ctx.waitForEvent('page'), page.click(`${formSel} input[type=submit]`)]);
  out.on('dialog', d => d.accept());
  await out.waitForLoadState('domcontentloaded');
  const t0 = Date.now();
  await out.waitForFunction(() => { const s = document.getElementById('pdf-status'); return s && /読み取りました|読み込めません|できませんでした|選択してください/.test(s.textContent); }, null, { timeout: 180000 });
  const status = await out.textContent('#pdf-status');
  const warn = await out.textContent('#pdf-warn');
  const tabs = await out.locator('.ex-box .cp_actab').count();
  const rows = await out.locator('.ex-box tr').count();
  console.log('status:', status, `(${Date.now() - t0}ms)`);
  console.log('warn  :', warn.trim().replace(/\s+/g, ' ').slice(0, 300));
  console.log('tabs  :', tabs, ' rows:', rows);
  if (mode === 'result') {
    // 画面の表を TSV にして保存（Node での読み取り結果と同じか確認するため）
    const tsv = await out.evaluate(() => Array.from(document.querySelectorAll('.ex-box tr')).map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim()).join('\t')).join('\n'));
    require('fs').writeFileSync((shot || 'out/result').replace('.png', '') + '_browser.tsv', tsv + '\n');
    console.log('table :', tsv.split('\n').length, 'lines saved');
  } else {
    // 灰色の四角（コピー）
    await out.click('.copy-outer');
    const clip = await out.evaluate(() => navigator.clipboard.readText());
    console.log('copy  :', clip.length, 'chars, starts', JSON.stringify(clip.slice(0, 60)));
  }
  if (shot) {
    await out.evaluate(() => { const i = document.querySelector('.ex-box input[type=checkbox]'); if (i) i.checked = true; });
    await out.screenshot({ path: shot, fullPage: false });
    await out.evaluate(() => window.scrollTo(0, 420));
    await out.screenshot({ path: shot.replace('.png', '_2.png') });
  }
  console.log('errors:', errors.length ? errors : 'none');
  await browser.close();
})().catch(e => { console.error('E2E FAILED', e); process.exit(1); });
