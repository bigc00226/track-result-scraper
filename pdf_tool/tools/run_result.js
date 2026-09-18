// 結果 PDF の読み取り結果: node tools/run_result.js file.pdf [out.tsv]
const { load } = require('./load.js');
const ResultPdf = require('../src/result.js');
const fs = require('fs');
(async () => {
  const [file, outTsv] = process.argv.slice(2);
  const t0 = Date.now();
  const pages = await load(file);
  const res = ResultPdf.parse(pages);
  console.log(`# ${file} pages=${pages.length} rows=${res.rows.length} events=${res.events.length} (${Date.now() - t0}ms)`);
  console.log(`# meet: ${res.meet.name} / year ${res.meet.year} / first ${res.meet.firstDate} / summaryDates ${Object.keys(res.meet.dates).length}`);
  res.warnings.forEach(w => console.log('  ! ' + w.message));
  const by = {};
  res.rows.forEach(r => { const k = r[13] + ' ' + r[2] + ' ' + r[4]; by[k] = (by[k] || 0) + 1; });
  Object.entries(by).forEach(([k, v]) => console.log(`- ${k}: ${v}`));
  if (outTsv) fs.writeFileSync(outTsv, [res.headers].concat(res.rows).map(r => r.join('\t')).join('\n') + '\n');
})();
