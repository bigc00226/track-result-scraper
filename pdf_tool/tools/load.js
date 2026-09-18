// Node 用：PDF を PdfCore.loadPages で読み込む（ブラウザと同じ pdf.js を使用）
const path = require('path');
const fs = require('fs');
// canvas がないことによる警告を抑える
const origWarn = console.warn; console.warn = (...a) => { if (!String(a[0]).includes('polyfill')) origWarn(...a); };
const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
console.warn = origWarn;
const PdfCore = require('../src/pdfcore.js');

function load(file, opts = {}) {
  const data = new Uint8Array(fs.readFileSync(file));
  return PdfCore.loadPages(pdfjs, data, Object.assign({
    cMapUrl: path.join(__dirname, '../node_modules/pdfjs-dist/cmaps/') + '/',
    standardFontDataUrl: path.join(__dirname, '../node_modules/pdfjs-dist/standard_fonts/') + '/',
  }, opts));
}
module.exports = { load, pdfjs, PdfCore };

if (require.main === module) {
  (async () => {
    const [file, pagesArg] = process.argv.slice(2);
    const pages = await load(file);
    const want = pagesArg ? pagesArg.split(',').map(Number) : [1];
    for (const pg of pages.filter(p => want.includes(p.num))) {
      console.log(`=== page ${pg.num} chars=${pg.textChars} hidden=${pg.hiddenItems} path=${pg.pathOps} img=${pg.imageOps}`);
      for (const L of pg.lines) console.log(L.y.toFixed(1).padStart(6), L.words.map(w => `${w.t}@${w.x.toFixed(0)}`).join('  '));
    }
  })();
}
