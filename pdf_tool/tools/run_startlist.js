// スタートリストの読み取り結果を確認する: node tools/run_startlist.js file.pdf [--full]
const { load } = require('./load.js');
const StartList = require('../src/startlist.js');
(async () => {
  const file = process.argv[2];
  const full = process.argv.includes('--full');
  const t0 = Date.now();
  const pages = await load(file);
  const res = StartList.parse(pages);
  console.log(`# ${file}  pages=${pages.length}  events=${res.events.length}  (${Date.now() - t0}ms)`);
  res.warnings.forEach(w => console.log('  ! ' + w.message));
  let total = 0;
  for (const ev of res.events) {
    const n = ev.heats.reduce((s, h) => s + h.entries.length, 0);
    total += n;
    console.log(`- ${ev.label}  heats=${ev.heats.length}${ev.expectHeats ? '/' + ev.expectHeats : ''} entries=${n} p${ev.pages.join(',')}`);
    if (full) for (const h of ev.heats) {
      console.log(`    [${h.no}組]`);
      for (const e of h.entries) console.log(`      ${String(e.order).padStart(2)} ${e.name} | ${e.team} | ${e.pref} | ${e.qual}`);
    }
  }
  console.log(`# total entries ${total}`);
})();
