// 各ページの先頭の数行を表示：node tools/pages_head.js file.pdf [行数] [ページ,ページ...]
const { load } = require('./load.js');
(async () => {
  const [file, nArg, pagesArg] = process.argv.slice(2);
  const n = +(nArg || 4);
  const want = pagesArg ? pagesArg.split(',').map(Number) : null;
  const pages = await load(file);
  pages.filter(p => !want || want.includes(p.num)).forEach(p => {
    console.log(`=== p${p.num} chars=${p.textChars} img=${p.imageOps} path=${p.pathOps}`);
    p.lines.slice(0, n).forEach(L => console.log(L.y.toFixed(1).padStart(6), L.words.map(w => `${w.t}@${w.x.toFixed(0)}`).join('  ').slice(0, 200)));
  });
})();
