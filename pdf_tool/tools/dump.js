// Dump pdf.js text items of given pages: node tools/dump.js file.pdf 1,2,3
const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
const path = require('path');
const fs = require('fs');
(async () => {
  const [file, pagesArg] = process.argv.slice(2);
  const data = new Uint8Array(fs.readFileSync(file));
  const doc = await pdfjs.getDocument({
    data,
    cMapUrl: path.join(__dirname, '../node_modules/pdfjs-dist/cmaps/'),
    cMapPacked: true,
    verbosity: 0,
  }).promise;
  const pages = pagesArg ? pagesArg.split(',').map(Number) : [1];
  for (const p of pages) {
    const page = await doc.getPage(p);
    const vp = page.getViewport({ scale: 1 });
    const tc = await page.getTextContent();
    console.log(`=== page ${p} ${vp.width.toFixed(0)}x${vp.height.toFixed(0)} items=${tc.items.length}`);
    for (const it of tc.items) {
      if (!it.str) continue;
      const t = pdfjs.Util.transform(vp.transform, it.transform);
      const fs_ = Math.hypot(t[2], t[3]);
      console.log(`${t[4].toFixed(1).padStart(6)} ${t[5].toFixed(1).padStart(6)} w=${it.width.toFixed(1).padStart(5)} fs=${fs_.toFixed(1)} ${JSON.stringify(it.str)}`);
    }
  }
})();
