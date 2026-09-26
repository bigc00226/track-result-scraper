<?php
/*
 * pdf_result.php  結果（PDF）の出力画面
 *
 *   トップページの「PDF」欄の【結果】でファイルを選び「GO!!」を押すと、この画面が開きます。
 *   1.php（nishi.php）と同じ 16列の一覧表で出力します。
 *   PDF はブラウザの中だけで読み取り、サーバには送信・保存しません。
 */
header('Content-Type: text/html; charset=UTF-8');
?>
<html>
<head>
<meta charset="UTF-8">
<meta name="robots" content="noindex">
<title>結果一覧（PDF）</title>
<style type="text/css">
/* 読み込み欄（表の外） */
#pdf-panel {
max-width: 800px;
margin: 10px auto 20px auto;
padding: 12px 16px;
border: 1px solid #BDBDBD;
background: #FAFAFA;
font-size: 15px;
line-height: 1.8;
color: #333333;
}
#pdf-panel .row { margin: 4px 0; }
#pdf-status { font-weight: bold; }
#pdf-warn {
display: none;
margin-top: 8px;
padding: 8px 12px;
border: 1px solid #E0A800;
background: #FFF8E1;
color: #6D4C00;
}
#pdf-warn ul { margin: 4px 0 0 0; padding-left: 1.4em; }
</style>
</head>
<body>

<div id="pdf-panel">
<div class="row"><b>結果（PDF）</b>　<span id="pdf-filename"></span></div>
<div class="row">PDFを選択：<input type="file" id="pdf-file" accept="application/pdf,.pdf"></div>
<div class="row" id="pdf-status"></div>
<div id="pdf-warn"></div>
</div>

<div class="ex-box">
</div>

<script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.min.js"></script>
<script src="pdf_js/pdfcore.js?v=8"></script>
<script src="pdf_js/result.js?v=8"></script>
<script src="pdf_js/result_render.js?v=8"></script>
<script src="pdf_js/pdf_page.js?v=8"></script>
<script>
PdfPage.init({
    mode: 'result',
    parse: function (pages) { return ResultPdf.parse(pages); },
    render: function (model) { return ResultRender.render(model.headers, model.rows); },
    summary: function (model, pages) {
        return pages.length + 'ページを読み取りました。種目 ' + model.events.length + '・' + model.rows.length + '行' +
            (model.summary ? '（決勝一覧表から出力）' : '');
    }
});
</script>
</body>
</html>
