// タイムテーブル PDF の読み取り結果: node tools/run_timetable.js file.pdf
const { load } = require('./load.js');
const TT = require('../src/timetable.js');
(async () => {
  const [file] = process.argv.slice(2);
  const t0 = Date.now();
  const pages = await load(file);
  const res = TT.parse(pages);
  console.log(`# ${file} pages=${pages.length} days=${res.days.length} rows=${res.rows} (${Date.now() - t0}ms)`);
  res.warnings.forEach(w => console.log('  ! ' + w.message));
  res.days.forEach(d => {
    console.log(`== ${d.date}`);
    d.rows.forEach(r => console.log(`   ${(r.time || '--:--').padStart(5)} | ${r.gender || '  '} | ${r.event}${r.round ? ' ' + r.round : ''}${r.cls ? '【' + r.cls + '】' : ''} | ${r.heats}  (p${r.page})`));
  });
})();
