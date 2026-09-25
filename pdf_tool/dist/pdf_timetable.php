<?php
/*
 * pdf_timetable.php  タイムテーブル（PDF）の出力画面
 *
 *   トップページの「PDF」欄の【タイムテーブル】でファイルを選び「GO!!」を押すと、この画面が開きます。
 *   競技日程・競技順序の表から、日付・時刻・性別・種別・種目・ラウンド・組を HTML の表にします。
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
<title>タイムテーブル（PDF）</title>
<link href="https://use.fontawesome.com/releases/v5.6.1/css/all.css" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome-animation/0.0.10/font-awesome-animation.css" type="text/css" media="all" />
<style type="text/css">
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
<div class="row"><b>タイムテーブル（PDF）</b>　<span id="pdf-filename"></span></div>
<div class="row">PDFを選択：<input type="file" id="pdf-file" accept="application/pdf,.pdf"></div>
<div class="row">並び順：
<label><input type="radio" name="pdf-ttsort" value="time" checked> 時刻順（トラック・フィールドをまとめる）</label>
<label><input type="radio" name="pdf-ttsort" value="pdf"> PDFの順番</label>
</div>
<div class="row" id="pdf-status"></div>
<div id="pdf-warn"></div>
</div>

<div class="ex-box">
</div>

<script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.min.js"></script>
<script src="pdf_js/pdfcore.js?v=7"></script>
<script src="pdf_js/timetable.js?v=7"></script>
<script src="pdf_js/timetable_render.js?v=7"></script>
<script src="pdf_js/pdf_page.js?v=7"></script>
<script>
PdfPage.init({
    mode: 'timetable',
    parse: function (pages) { return TimeTable.parse(pages); },
    render: function (model, opt) { return TimeTableRender.render(model.days, opt); },
    summary: function (model, pages) {
        return pages.length + 'ページを読み取りました。' + model.days.length + '日・' + model.rows + '行';
    }
});
</script>
</body>
</html>
