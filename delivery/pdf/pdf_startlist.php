<?php
/*
 * pdf_startlist.php  スタートリスト（PDF）の出力画面
 *
 *   トップページの「PDF」欄でファイルを選び「GO!!」を押すと、この画面が開きます。
 *   PDF はブラウザの中だけで読み取り、サーバには送信・保存しません。
 *   一番上の灰色の四角をクリックすると、下の表の HTML がまとめてコピーされます。
 */
header('Content-Type: text/html; charset=UTF-8');
?>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="robots" content="noindex">
<title>スタートリスト（PDF）</title>
<link href="https://use.fontawesome.com/releases/v5.6.1/css/all.css" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome-animation/0.0.10/font-awesome-animation.css" type="text/css" media="all" />
<style type="text/css">
.s-tbl2 {
	border-collapse: collapse;
	max-width: 100%;
	table-layout: fixed;
	word-wrap: break-word;
}
.s-tbl2 th {
	border: 1px solid #555;
	padding: 10px;
	background: #848484;
}
.s-tbl2 td {
	border: 1px solid #555;
	padding: 5px;
}
.s-tbl2 tr:nth-child(2n+3) {
	background: #F2F2F2;
}
.s-tbl2 tr:hover {
	background: #F2F5A9;
}

.cp_actab {
position: relative;
overflow: hidden;
width: 100%;
margin: 0 auto;
color: #ffffff;
}
.cp_actab input {
position: absolute;
z-index: -1;
opacity: 0;
}
.cp_actab label {
font-weight: bold;
line-height: 3;
position: relative;
display: block;
padding: 0 0 0 1em;
cursor: pointer;
margin: 0 0 1px 0;
}
.cp_actab .cp_actab-content {
overflow: hidden;
max-height: 0;
-webkit-transition: max-height 1.0s;
transition: max-height 0.5s;
color: #333333;
background: #FFFFFF;
}
.cp_actab .cp_actab-content  {
margin: 0;
}
/* :checked */
.cp_actab input:checked ~ .cp_actab-content {
max-height: 100%;
}
/* Icon */
.cp_actab label::after {
line-height: 3;
position: absolute;
top: 0;
right: 0;
display: block;
width: 3em;
height: 3em;
-webkit-transition: all 0.5s;
transition: all 0.5s;
text-align: center;
}
.cp_actab input[type=checkbox] + label::after {
content: '＋';
}
.cp_actab input[type=checkbox]:checked + label::after {
content: '−';
}

/* 読み込み欄（コピーの対象外） */
#pdf-panel {
max-width: 800px;
margin: 0 auto 30px auto;
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

<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>
<script>
jQuery(function($){
    $('.copy-outer').on('click', function() {
        var target = $(this).data('target');
        var text = $(target).prop('outerHTML');
        $(this).copy(text);
        alert('コピー完了！！');
    });
    $.fn.extend({
        copy: function(text) {
            $(this).after('<textarea>'+text+'</textarea>');
            $(this).next('textarea').select();
            document.execCommand('copy');
            $(this).next('textarea').remove();
        },
    });
});
</script>


<div style="width:300px;text-align:center;margin:50px auto;" class="copy-outer" data-target=".ex-box">
<i class="fas fa-copy fa-10x faa-wrench animated-hover" style="color:#888;"></i>
</div>

<div id="pdf-panel">
<div class="row"><b>スタートリスト（PDF）</b>　<span id="pdf-filename"></span></div>
<div class="row">PDFを選択：<input type="file" id="pdf-file" accept="application/pdf,.pdf"></div>
<div class="row">資格記録：
<label><input type="radio" name="pdf-qualpos" value="after" checked> 後ろ</label>
<label><input type="radio" name="pdf-qualpos" value="before"> 前</label>
<label><input type="radio" name="pdf-qualpos" value="none"> 表示しない</label>
</div>
<div class="row">所属の表示：
<label><input type="radio" name="pdf-teamformat" value="paren" checked> (所属・都道府県)</label>
<label><input type="radio" name="pdf-teamformat" value="plain"> 所属(都道府県)</label>
</div>
<div class="row">種目の見出し：
<label><input type="radio" name="pdf-labelstyle" value="green-bg" checked> 緑背景＋濃い文字</label>
<label><input type="radio" name="pdf-labelstyle" value="green-text"> グレー背景＋緑文字</label>
</div>
<div class="row">
<label><input type="checkbox" id="pdf-openall" checked> 最初から全種目を開いた状態にする</label>
</div>
<div class="row">種目の見出しの形式：
<label><input type="radio" name="pdf-tabstyle" value="checkbox" checked> NISHIと同じ</label>
<label><input type="radio" name="pdf-tabstyle" value="details"> サイトのCSSがなくても開閉できる形式</label>
<label><input type="radio" name="pdf-tabstyle" value="plain"> 開閉なし（表だけ）</label>
<div style="font-size:13px;color:#666666;">貼り付けたサイトで「開閉できない・＋が出ない・文字が細い」場合は、「開閉なし（表だけ）」でコピーすると、どのサイトでもそのまま表示できます。</div>
</div>
<div class="row" id="pdf-status"></div>
<div id="pdf-warn"></div>
</div>

<div class="ex-box">
</div>

<script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.min.js"></script>
<script src="pdf_js/pdfcore.js?v=8"></script>
<script src="pdf_js/startlist.js?v=8"></script>
<script src="pdf_js/startlist_render.js?v=8"></script>
<script src="pdf_js/pdf_page.js?v=8"></script>
<script>
PdfPage.init({
    mode: 'startlist',
    parse: function (pages) { return StartList.parse(pages); },
    render: function (model, opt) { return StartListRender.render(model.events, opt); },
    summary: function (model, pages) {
        var n = 0;
        model.events.forEach(function (ev) { ev.heats.forEach(function (h) { n += h.entries.length; }); });
        return pages.length + 'ページを読み取りました。種目 ' + model.events.length + '・人数（チーム数）' + n;
    }
});
</script>
</body>
</html>
