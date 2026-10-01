<?php
/*
 * nishi_timetable.php  タイムテーブル（NISHI）の出力画面
 *
 *   トップページの「NISHI」欄の【タイムテーブル】に、大会ページ（…/shtml/TimeTable.html）の URL を入れて
 *   「GO!!」を押すと、この画面が開きます。
 *   大会ページの TimeTable.json を読み込み、PDF のタイムテーブルと同じ HTML の表
 *   （日付・時刻・性別・種別・種目・ラウンド・組）にします。
 *   一番上の灰色の四角をクリックすると、下の表の HTML がまとめてコピーされます。
 */
header('Content-Type: text/html; charset=UTF-8');

define('NTT_FETCH_TIMEOUT', 30);     // タイムアウト（秒）
define('NTT_USER_AGENT', 'Mozilla/5.0 (compatible; NishiResultExport/1.0)');

$ntt_url = '';
if (isset($_POST['url']) && trim($_POST['url']) !== '') {
    $ntt_url = trim($_POST['url']);
} elseif (isset($_GET['url'])) {
    $ntt_url = trim($_GET['url']);
}

$ntt_data = null;      // 表示に使う TimeTable.json（必要な項目だけ）
$ntt_error = '';
$ntt_meet = '';
if ($ntt_url !== '') {
    $bases = ntt_base_candidates($ntt_url);
    if (!$bases) {
        $ntt_error = 'URL の形式が正しくありません（http:// または https:// で始まる TimeTable.html の URL を入力してください）。';
    }
    foreach ($bases as $base) {
        $tt = ntt_json_decode(ntt_fetch($base . 'TimeTable.json'));
        if (is_array($tt) && isset($tt['TimeTableList']) && is_array($tt['TimeTableList'])) {
            $ntt_data = ntt_trim($tt);
            $taikai = ntt_json_decode(ntt_fetch($base . 'Taikai.json'));
            if (is_array($taikai) && isset($taikai['TaikaiMei'])) {
                $ntt_meet = trim((string)$taikai['TaikaiMei']);
            }
            break;
        }
    }
    if ($ntt_data === null && $ntt_error === '') {
        $ntt_error = 'TimeTable.json を取得できませんでした。URL（…/shtml/TimeTable.html）をご確認ください。';
    }
}

// 画面に渡す JSON（</script> などが入らないように記号を \uXXXX にする）
$ntt_flags = JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT;
if (defined('JSON_INVALID_UTF8_SUBSTITUTE')) {
    $ntt_flags |= JSON_INVALID_UTF8_SUBSTITUTE;
}
$ntt_json_data = json_encode($ntt_data, $ntt_flags);
if ($ntt_json_data === false) {
    $ntt_json_data = 'null';
    $ntt_error = '大会ページのタイムテーブルを読み取れませんでした。';
}
?>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="robots" content="noindex">
<title>タイムテーブル（NISHI）</title>
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
#ntt-url { width: 100%; max-width: 560px; box-sizing: border-box; }
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
<div class="row"><b>タイムテーブル（NISHI）</b>　<span id="ntt-meet"><?php echo ntt_h($ntt_meet); ?></span></div>
<form class="row" action="nishi_timetable.php" method="post">
大会ページの URL：<input type="text" id="ntt-url" name="url" value="<?php echo ntt_h($ntt_url); ?>" placeholder="https://…/shtml/TimeTable.html">
<input type="submit" value=" GO!! ">
</form>
<div class="row">並び順：
<label><input type="radio" name="pdf-ttsort" value="time" checked> 時刻順</label>
<label><input type="radio" name="pdf-ttsort" value="pdf"> 大会ページの順番</label>
</div>
<div class="row">区分の行：
<label><input type="radio" name="pdf-ttsection" value="jt" checked> ●トラック・●跳躍・●投てき</label>
<label><input type="radio" name="pdf-ttsection" value="field"> ●トラック・●フィールド</label>
<label><input type="radio" name="pdf-ttsection" value="none"> 入れない</label>
</div>
<div class="row" id="pdf-status"></div>
<div id="pdf-warn"></div>
</div>

<div class="ex-box">
</div>

<script src="pdf_js/pdfcore.js?v=14"></script>
<script src="pdf_js/timetable.js?v=14"></script>
<script src="pdf_js/timetable_render.js?v=14"></script>
<script src="pdf_js/nishi_timetable.js?v=14"></script>
<script>
(function () {
    var DATA = <?php echo $ntt_json_data; ?>;
    var ERROR = <?php echo json_encode($ntt_error, $ntt_flags); ?>;
    var URL_GIVEN = <?php echo $ntt_url !== '' ? 'true' : 'false'; ?>;
    // 並び順・区分の選び方は、PDF のタイムテーブルの画面と同じ設定を使う（このパソコンのブラウザに保存）
    var STORE_KEY = 'pdfToolOptions.timetable';
    var NAMES = { 'pdf-ttsort': 'sort', 'pdf-ttsection': 'section' };
    var model = null;

    function byId(id) { return document.getElementById(id); }

    function setStatus(msg, isError) {
        var el = byId('pdf-status');
        el.textContent = msg;
        el.style.color = isError ? '#CC0000' : '#333333';
    }

    function showWarnings(list) {
        var el = byId('pdf-warn');
        el.innerHTML = '';
        if (!list || !list.length) { el.style.display = 'none'; return; }
        var h = document.createElement('div');
        h.style.fontWeight = 'bold';
        h.textContent = 'ご確認ください';
        var ul = document.createElement('ul');
        list.forEach(function (w) {
            var li = document.createElement('li');
            li.textContent = w.message;
            ul.appendChild(li);
        });
        el.appendChild(h);
        el.appendChild(ul);
        el.style.display = 'block';
    }

    function currentOptions() {
        var opt = {};
        Object.keys(NAMES).forEach(function (name) {
            var radios = document.querySelectorAll('input[name="' + name + '"]');
            for (var i = 0; i < radios.length; i++) if (radios[i].checked) opt[NAMES[name]] = radios[i].value;
        });
        return opt;
    }

    function draw() {
        if (!model) return;
        document.querySelector('.ex-box').innerHTML = TimeTableRender.render(model.days, currentOptions());
    }

    function restoreOptions() {
        try {
            var o = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
            Object.keys(NAMES).forEach(function (name) {
                if (!o[name]) return;
                var r = document.querySelector('#pdf-panel input[name="' + name + '"][value="' + o[name] + '"]');
                if (r) r.checked = true;
            });
        } catch (e) { /* 使えない場合は初期のまま */ }
    }

    function saveOptions() {
        try {
            var o = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
            var opt = currentOptions();
            Object.keys(NAMES).forEach(function (name) { o[name] = opt[NAMES[name]]; });
            if (!o._v) o._v = 2;
            localStorage.setItem(STORE_KEY, JSON.stringify(o));
        } catch (e) { /* 使えない場合は覚えないだけ */ }
    }

    restoreOptions();
    var inputs = document.querySelectorAll('#pdf-panel input[type="radio"]');
    for (var i = 0; i < inputs.length; i++) inputs[i].addEventListener('change', function () { saveOptions(); draw(); });

    if (ERROR) {
        setStatus(ERROR, true);
    } else if (DATA) {
        model = NishiTimeTable.fromJson(DATA);
        draw();
        setStatus('大会ページのタイムテーブルを読み込みました。' + model.days.length + '日・' + model.rows + '行');
        showWarnings(model.warnings);
    } else if (!URL_GIVEN) {
        setStatus('NISHI の大会ページ（…/shtml/TimeTable.html）の URL を入れて「GO!!」を押してください。');
    }
})();
</script>
</body>
</html>
<?php
/* ---------------------------------------------------------------------------
 *  URL・取得（nishi.php と同じ考え方）
 * ------------------------------------------------------------------------- */
// 「…/shtml/TimeTable.html」「…/shtml/」「…/」のどれでも、TimeTable.json のあるフォルダを探す
function ntt_base_candidates($url)
{
    $url = preg_replace('/[?#].*$/s', '', trim($url));
    if (!preg_match('#^(https?://[^/]+)(/.*)?$#i', $url, $m)) {
        return array();
    }
    $origin = $m[1];
    $path = (isset($m[2]) && $m[2] !== '') ? $m[2] : '/';
    $candidates = array();
    $pos = strpos($path, '/shtml/');
    if ($pos !== false) {
        $candidates[] = $origin . substr($path, 0, $pos + 7);
    }
    if (substr($path, -1) === '/') {
        $dir = $path;
    } elseif (strpos(basename($path), '.') !== false) {
        $dir = rtrim(dirname($path), '/') . '/';
    } else {
        $dir = $path . '/';
    }
    $candidates[] = $origin . $dir;
    $candidates[] = $origin . $dir . 'shtml/';
    return array_values(array_unique($candidates));
}

function ntt_fetch($url)
{
    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        @curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
        curl_setopt($ch, CURLOPT_TIMEOUT, NTT_FETCH_TIMEOUT);
        curl_setopt($ch, CURLOPT_USERAGENT, NTT_USER_AGENT);
        curl_setopt($ch, CURLOPT_ENCODING, '');
        $body = curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($body !== false && $code >= 200 && $code < 300) {
            return $body;
        }
        if ($code >= 400 && $code < 500) {
            return false;       // ファイルがない（別のフォルダを探す）
        }
    }
    $context = stream_context_create(array('http' => array(
        'timeout'         => NTT_FETCH_TIMEOUT,
        'user_agent'      => NTT_USER_AGENT,
        'follow_location' => 1,
    )));
    $body = @file_get_contents($url, false, $context);
    return ($body === false) ? false : $body;
}

function ntt_json_decode($body)
{
    if (!is_string($body) || $body === '') {
        return null;
    }
    if (substr($body, 0, 3) === "\xEF\xBB\xBF") {
        $body = substr($body, 3);
    }
    if (!mb_check_encoding($body, 'UTF-8')) {
        $body = mb_convert_encoding($body, 'UTF-8', 'SJIS-win');
    }
    $data = json_decode($body, true);
    return is_array($data) ? $data : null;
}

// 画面に渡す分だけ（日付の一覧と、日ごとの全種目・男女の組の行。項目は時刻・種目・ラウンド・組）
function ntt_trim($tt)
{
    $keep = array('KaishiJikan', 'KyogiMei', 'Round', 'KumiNo', 'Kumi');
    $trimEntries = function ($list) use ($keep) {
        $out = array();
        foreach ((array)$list as $e) {
            if (!is_array($e)) {
                continue;
            }
            $row = array();
            foreach ($keep as $k) {
                $row[$k] = isset($e[$k]) ? (string)$e[$k] : '';
            }
            $out[] = $row;
        }
        return $out;
    };
    $days = array();
    foreach ($tt['TimeTableList'] as $date => $day) {
        if (!is_array($day)) {
            continue;
        }
        if (isset($day['Shumoku_a']['Seibetsu_a']['TimeTable'])) {
            $days[$date] = array('Shumoku_a' => array('Seibetsu_a' => array(
                'TimeTable' => $trimEntries($day['Shumoku_a']['Seibetsu_a']['TimeTable']))));
            continue;
        }
        // 「全種目・男女」の一覧がない大会は、種目別・男女別の一覧を全部渡す
        $all = array();
        foreach ($day as $sk => $sv) {
            if (!is_array($sv)) {
                continue;
            }
            foreach ($sv as $gk => $gv) {
                if (is_array($gv) && isset($gv['TimeTable'])) {
                    $all[$sk][$gk] = array('TimeTable' => $trimEntries($gv['TimeTable']));
                }
            }
        }
        $days[$date] = $all;
    }
    $nittei = array();
    if (isset($tt['NitteiList']) && is_array($tt['NitteiList'])) {
        foreach ($tt['NitteiList'] as $n) {
            if (is_array($n) && isset($n['Key'])) {
                $nittei[] = array('Key' => (string)$n['Key'], 'Value' => isset($n['Value']) ? (string)$n['Value'] : '');
            }
        }
    }
    return array('NitteiList' => $nittei, 'TimeTableList' => $days);
}

function ntt_h($s)
{
    return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
}
