<?php
//header("Content-type: charset=UTF-8");
header("Content-type:text/html; charset=UTF-8");
//header("Content-type:text/html; charset=Shift-JIS");


//$t_url = (htmlspecialchars($_GET['url'], ENT_QUOTES));
$t_url = (htmlspecialchars($_POST['url'], ENT_QUOTES));
$t_url = str_replace('TimeTable.html', 'TimeTable.json', $t_url);

$new_t_url = str_replace('TimeTable.json', '', $t_url);
//echo $new_t_url;

$minus_word = mb_convert_encoding('－', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$plus_word = mb_convert_encoding('＋', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$kanryou_word = mb_convert_encoding('コピー完了！！', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');


?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD Compact HTML 1.0 Draft//EN">
<html>
<head>
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
content: '<?php echo $plus_word; ?>';
}
.cp_actab input[type=checkbox]:checked + label::after {
content: '<?php echo $minus_word; ?>';
}
</style>
</head>
<body>

<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>
<script>
jQuery(function($){
    $('.copy-inner').on('click', function() {
        var target = $(this).data('target');
        var text = $(target).html();
        $(this).copy(text);
        alert('<?php echo $kanryou_word; ?>');
    });
    $('.copy-outer').on('click', function() {
        var target = $(this).data('target');
        var text = $(target).prop('outerHTML');
        $(this).copy(text);
        alert('<?php echo $kanryou_word; ?>');
    });
    $('.copy-css-with-style').on('click', function() {
        var target = $(this).data('target');
        var text = $(target).next('style').prop('outerHTML');
        $(this).copy(text);
        alert('<?php echo $kanryou_word; ?>');
    });
    $('.copy-css').on('click', function() {
        var target = $(this).data('target');
        var text = $(target).next('style').text();
        $(this).copy(text);
        alert('<?php echo $kanryou_word; ?>');
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
<div class="ex-box">
<?php



//////////////// 種目毎URL取得 ////////////////

$t_url_base01 = @file_get_contents($t_url);
//echo $t_url_base01;
$t_url_base = strstr($t_url_base01, 'SyumokuBetsuList');


//男女テスト用
//echo $t_url_base;//※※男女取得ポイント！！


preg_match_all('|"KyogiMei":"(.*?).html","LinkKumi|mis', $t_url_base, $all_t_url_base0);
$new_url_x0 = array();
foreach ($all_t_url_base0[0] as $value_t_url_base0) {
//echo "<p>" . $value_t_url_base0 . "</p>\r\n";

//性別【元】
$kyogimei01 = strstr($value_t_url_base0, '"KyogiMei":"');
$kyogimei02 = strstr($kyogimei01, '","', true);
$kyogimei03 = str_replace('"KyogiMei":"', '', $kyogimei02);
//echo "<p>" . $kyogimei03 . "</p>\r\n";

//レース状況【元】
$round01 = strstr($value_t_url_base0, '"Round":"');
$round02 = strstr($round01, '","', true);
$round03 = str_replace('"Round":"', '', $round02);
//echo "<p>" . $round03 . "</p>\r\n";

//リンク【元】
$linkround01 = strstr($value_t_url_base0, '"LinkRound":"./');
$linkround02 = strstr($linkround01, '.html', true);
$linkround03 = str_replace('"LinkRound":"./', '', $linkround02);
$linkround04 = $linkround03 . '.json';
//echo "<p>" . $linkround04 . "</p>\r\n";

$new_url_x0[] .= $kyogimei02 . '-xxx-' . $round03 . '-zzz-' . $linkround04;
}

$total_result0 = array_unique($new_url_x0);

foreach($total_result0 as $total_value0){
//echo "<p>" . $total_value0 . "</p>\r\n";


//組リンク
$new_link01 = strstr($total_value0, '-zzz-');
$new_link02 = str_replace('-zzz-', $new_t_url, $new_link01);
$new_url = $new_link02;
//echo "<p>" . new_url . "</p>\r\n";


//性別
$new_sex_word01 = mb_convert_encoding('男', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$new_sex_word02 = mb_convert_encoding('女', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$new_sex_word03 = mb_convert_encoding('子', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$new_sex_word04 = mb_convert_encoding('混合', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');

$search_new_sex01 = strpos($total_value0, $new_sex_word04);
$search_new_sex02 = strpos($total_value0, $new_sex_word01 . $new_sex_word02);
$search_new_sex03 = strpos($total_value0, $new_sex_word01);
$search_new_sex04 = strpos($total_value0, $new_sex_word02);
if ($search_new_sex01 || $search_new_sex02){
$x_sex = $new_sex_word01 . $new_sex_word02 . $new_sex_word04;
$x_sex_color = '#BCA9F5';
}elseif ($search_new_sex03){
$x_sex = $new_sex_word01 . $new_sex_word03;
$x_sex_color = '#A9D0F5';
}elseif ($search_new_sex04){
$x_sex = $new_sex_word02 . $new_sex_word03;
$x_sex_color = '#F5A9A9';
}else{
$x_sex = $new_sex_word01 . $new_sex_word02 . $new_sex_word04;
$x_sex_color = '#BCA9F5';
}
//echo "<p>" . $x_sex . "</p>\r\n";


//種目名
$new_event_type_word01 = mb_convert_encoding('男', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$new_event_type_word02 = mb_convert_encoding('女', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$new_event_type_word03 = mb_convert_encoding('子', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$new_event_type_word04 = mb_convert_encoding('混合', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$search_new_event_type01 = strpos($total_value0, $new_event_type_word01);
$search_new_event_type02 = strpos($total_value0, $new_event_type_word02);
$new_event_type01 = strstr($total_value0, '-xxx-', true);
if ($search_new_event_type04){
$new_event_type02 = strstr($new_event_type01, $new_event_type_word04);
}elseif ($search_new_event_type01){
$new_event_type02 = strstr($new_event_type01, $new_event_type_word01);
}elseif ($search_new_event_type02){
$new_event_type02 = strstr($new_event_type01, $new_event_type_word02);
}else{
$new_event_type02 = $new_event_type01;
}
$new_event_type03 = str_replace($new_event_type_word01, '', $new_event_type02);
$new_event_type04 = str_replace($new_event_type_word02, '', $new_event_type03);
$new_event_type05 = str_replace($new_event_type_word03, '', $new_event_type04);
$new_event_type_word05 = mb_convert_encoding('走', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$new_event_type_word06 = mb_convert_encoding('走り', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$new_event_type06 = str_replace($new_event_type_word05, $new_event_type_word06, $new_event_type05);
$new_event_type_word07 = mb_convert_encoding('跳', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$new_event_type_word08 = mb_convert_encoding('跳び', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$new_event_type07 = str_replace($new_event_type_word07, $new_event_type_word08, $new_event_type06);
$new_event_type_word09 = mb_convert_encoding('投', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$new_event_type_word10 = mb_convert_encoding('投げ', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$new_event_type08 = str_replace($new_event_type_word09, $new_event_type_word10, $new_event_type07);
$new_event_type09 = mb_convert_kana($new_event_type08, 'KVrns');
$new_event_type_word11 = mb_convert_encoding('4種', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$new_event_type_word12 = mb_convert_encoding('四種', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$new_event_type_word13 = mb_convert_encoding('7種', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$new_event_type_word14 = mb_convert_encoding('七種', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$new_event_type_word15 = mb_convert_encoding('8種', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$new_event_type_word16 = mb_convert_encoding('八種', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$new_event_type_word17 = mb_convert_encoding('10種', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$new_event_type_word18 = mb_convert_encoding('十種', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$new_event_type10 = str_replace($new_event_type_word11, $new_event_type_word12, $new_event_type09);
$new_event_type11 = str_replace($new_event_type_word13, $new_event_type_word14, $new_event_type10);
$new_event_type12 = str_replace($new_event_type_word15, $new_event_type_word16, $new_event_type11);
$new_event_type13 = str_replace($new_event_type_word17, $new_event_type_word18, $new_event_type12);
$new_event_type_word19 = mb_convert_encoding('×', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$new_event_type14 = str_replace('X', $new_event_type_word19, $new_event_type13);
$new_event_type15 = str_replace('"KyogiMei":"', '', $new_event_type14);
$x_event_type = $new_event_type15;
//echo "<p>" . $x_event_type . "</p>\r\n";


//レース状況
$new_race_type01 = strstr($total_value0, '-xxx-');
$new_race_type02 = strstr($new_race_type01, '-zzz-', true);
$new_race_type03 = str_replace(' ', '', $new_race_type02);
$new_race_type_word01 = mb_convert_encoding('　', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$new_race_type04 = str_replace($new_race_type_word01, '', $new_race_type03);
$new_race_type05 = mb_convert_kana($new_race_type04, 'KVrns');
$new_race_type06 = str_replace('-xxx-', '', $new_race_type05);
$x_race_type00 = $new_race_type06;
//echo "<p>" . $new_x_race_type00 . "</p>\r\n";


//種別
$new_race_shubetsu01 =  strstr($total_value0, '-xxx-', true);
if ($search_new_event_type04){
$new_race_shubetsu02 = strstr($new_race_shubetsue01, $new_event_type_word04, true);
}elseif ($search_new_event_type01){
$new_race_shubetsu02 = strstr($new_race_shubetsu01, $new_event_type_word01, true);
}elseif ($search_new_event_type02){
$new_race_shubetsu02 = strstr($new_race_shubetsu01, $new_event_type_word02, true);
}else{
$new_race_shubetsu02 = '';
}
$new_race_shubetsu_word01 = mb_convert_encoding('決勝', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$new_race_shubetsu03 = str_replace($new_race_shubetsu_word01, '', $new_race_shubetsu02);
$new_race_shubetsu04 = mb_convert_kana($new_race_shubetsu03, 'KVrns');
$new_race_shubetsu05 = str_replace('"KyogiMei":" ', '', $new_race_shubetsu04);
$new_race_shubetsu06 = str_replace('"KyogiMei":"', '', $new_race_shubetsu05);
if ($new_race_shubetsu06){
$new_race_shubetsu_word02 = mb_convert_encoding('【', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$new_race_shubetsu_word03 = mb_convert_encoding('】', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$new_race_shubetsu07 =  $new_race_shubetsu_word02 . $new_race_shubetsu06 . $new_race_shubetsu_word03;
}else{
$new_race_shubetsu07 = $new_race_shubetsu06;
}
$race_shubetsu00 = $new_race_shubetsu07;
//echo "<p>" . $race_shubetsu00 . "</p>\r\n";



//レース状況 + 種別
$x_race_type = $x_race_type00 . $race_shubetsu00;




//////////////// 種目毎処理 ////////////////
$t_url_base2 = @file_get_contents($new_url);
//echo "<p>" . $t_url_base2 . "</p>\r\n";

$search_t_url_base01 = strpos($t_url_base2, '],"1":');//結果
$search_t_url_base02 = strpos($t_url_base2, '"}]}],"');//結果 ＆ スタートリスト
$search_t_url_base03 = strpos($t_url_base2, '],"2":');//スタートリスト
if ($search_t_url_base01){
$x1 = strstr($t_url_base2, '],"1":');
}elseif ($search_t_url_base02){
$x1 = strstr($t_url_base2, '"}]}],"');
}elseif ($search_t_url_base03){
$x1 = strstr($t_url_base2, '],"2":');
}else{
$x1  = '';
}
//echo "<p>" . $x1 . "</p>\r\n";


//ベース情報取得
//$base_data01 = strstr($x1, '"Title":"');
$base_data01 = strstr($t_url_base2, '"SubTitle"');
//echo "<p>" . $base_data01 . "</p>\r\n";





//混成 種目別 判定
$konsei_word1 = mb_convert_encoding('種', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$konsei_word2 = mb_convert_encoding('種目', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$search_konsei1 = strpos($x_event_type, $konsei_word1);
$search_konsei2 = strpos($x_event_type, $konsei_word2);

if (!$search_konsei1 || $search_konsei2){//必要のない競技非表示
////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////種目 詳細//////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
echo '<div class="cp_actab">' . "\r\n";
echo '<input id="' . $x_sex . $x_event_type . $x_race_type . '" type="checkbox" name="tabs">' . "\r\n";
echo '<label for="' . $x_sex . $x_event_type . $x_race_type . '" style="color:' . $x_sex_color . ';background-color:#6E6E6E;">' . $x_sex . ' ' . $x_event_type .  ' ' . $x_race_type . '</label>' . "\r\n";
echo '<div class="cp_actab-content">' . "\r\n\r\n";
echo "<table class=\"s-tbl2\" width=\"100%\" style=\"width:100%;\">\r\n";
////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////種目 詳細//////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////// 種目毎処理 ////////////////



//////////////// 組毎処理 ////////////////
$t_kumi_base = @file_get_contents($new_url);
//echo "<p>" . $new_url . "</p>\r\n";

$heat_word01 = mb_convert_encoding('組', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$heat_word02 = mb_convert_encoding('招集', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$heat_word03 = mb_convert_encoding('確定', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$heat_word04 = mb_convert_encoding('ラップ', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');

$search_track = strpos($new_url, '/track/');
$search_leap = strpos($new_url, '/leap/');
$search_throwing = strpos($new_url, '/throwing/');

//年月日
if ($search_track){
$ymd01 = strstr($new_url, '/track/');
$ymd02 = strstr($ymd01, '_', true);
$ymd03 = str_replace('/track/', '', $ymd02);
$new_ymd = $ymd03;
}elseif ($search_leap){
$ymd01 = strstr($new_url, '/leap/');
$ymd02 = strstr($ymd01, '_', true);
$ymd03 = str_replace('/leap/', '', $ymd02);
$new_ymd = $ymd03;
}elseif ($search_throwing){
$ymd01 = strstr($new_url, '/throwing/');
$ymd02 = strstr($ymd01, '_', true);
$ymd03 = str_replace('/throwing/', '', $ymd02);
$new_ymd = $ymd03;
}else{
$new_ymd = '';
}


$search_status0 = strpos($t_kumi_base, '1":[{"Status"');
if ($search_status0){
$t_kumi01 = strstr($t_kumi_base, '1":[{"Status"');
}else{
$t_kumi01 = $t_kumi_base;
}


$search_status1 = strpos($t_kumi01, '2":[{"Status"');
$search_status2 = strpos($t_kumi01, '}]},"ReactionTimeDispFlg"');
if ($search_status1){
$t_kumi02 = strstr($t_kumi01, '2":[{"Status"', true);
}elseif ($search_status2){
$t_kumi02 = strstr($t_kumi01, '}]},"ReactionTimeDispFlg"', true);
}else{
$t_kumi02 = $t_kumi01;
}
$t_kumi0 = $t_kumi02;
//echo "<p>" . $t_kumi0 . "</p>\r\n";


//組数確認
$kumi_count = substr_count($t_kumi0, $heat_word02);
//echo "<p>" . $kumi_count . "</p>\r\n";

//ラップのバグ削除
$t_kumi0 = str_replace('"LapInfo":{"Status":"', '', $t_kumi0);

if ($search_track){
$search_status3 = strpos($t_kumi0, '"TeamOrder"');
if ($search_status3){
preg_match_all('|{"Status"(.*?)"TeamOrder"|mis', $t_kumi0, $all_t_kumi0);
}else{
preg_match_all('|{"Status"(.*?)}],|mis', $t_kumi0, $all_t_kumi0);
}
}elseif ($search_leap || $search_throwing){
preg_match_all('|"Status"(.*?)}]}|mis', $t_kumi0, $all_t_kumi0);
}else{
//$all_t_kumi0 = '';
}
foreach ($all_t_kumi0[0] as $value_t_kumi0) {
//echo "<p>" . $value_t_kumi0 . "</p>\r\n";

$value_t_kumi0_shousai = $value_t_kumi0;


$search_status4 = strpos($value_t_kumi0, '1":[{"Shigi"');
if ($search_status4){
$value_t_kumi0 = strstr($value_t_kumi0, '1":[{"Shigi"');
}else{
$value_t_kumi0 = $value_t_kumi0;
}



//組
$heat01 = strstr($value_t_kumi0_shousai, '"Status":"');
$heat02 = strstr($heat01, $heat_word01, true);
$heat03 = str_replace('"Status":"', '', $heat02);
if ($kumi_count > 1){
$new_heat = $heat03 . $heat_word01;
}else{
$new_heat = '';
}

//風速
$wind01 = strstr($value_t_kumi0_shousai, '"Kiroku"');
$wind02 = strstr($wind01, '","', true);
$wind03 = strstr($wind02, '<br/>');
$wind04 = str_replace('<br/>', '', $wind03);
$wind05 = str_replace('+', '', $wind04);
if ($search_track && $wind05){
$new_wind = $wind05;
}else{
$new_wind = '';
}

//スタートリスト確認
$sl_word01 = mb_convert_encoding('スタートリスト', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$sl01 = strstr($value_t_kumi0_shousai, '"Status":"');
$sl02 = strstr($sl01, '","', true);
$search_sl1 = strpos($sl02, $heat_word04); //ラップ
if ($search_sl1){
$sl03 = strstr($sl01, '","');
$sl04 = strstr($sl03, '"Status":"');
$sl05 = strstr($sl04, '","', true);
}else{
$sl05 = $sl02;
}
$search_sl2 = strpos($sl05, $heat_word03); //確定
if ($search_sl2){
$new_sl = '';
}else{
$new_sl = '<span style="color:#FACC2E;font-weight:bold;">' . $sl_word01 . '</span> ';
}


////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////組 詳細///////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
echo "<tr>\r\n";
echo "<td style=\"color:#FFF;padding-left:1em;\" width=\"100%\" bgcolor=\"#848484\">\r\n";
echo $new_sl . $x_race_type . " " . $new_heat . " " . $new_wind . "\r\n";
echo "</td>\r\n";
echo "</tr>\r\n";
////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////組 詳細///////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////



//////////////// 順位毎処理 ////////////////
//順位　td
if ($search_track){
preg_match_all('|"Lane"(.*?)"DnsFlg"|mis', $value_t_kumi0, $all_t_juni_base);
}elseif ($search_leap || $search_throwing){
preg_match_all('|"Shigi"(.*?)"DnsFlg"|mis', $value_t_kumi0, $all_t_juni_base);
}else{
$all_t_juni_base = '';
}
foreach ($all_t_juni_base[0] as $value_t_juni_base) {
//echo "<p>" . $value_t_juni_base . "</p>\r\n";

//順位
$no_word01 = mb_convert_encoding('位', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$no01 = strstr($value_t_juni_base, '"Jyuni"');
$no02 = strstr($no01, '","', true);
$no03 = str_replace('"Jyuni":"', '', $no02);
if ($no03){
if ($no03 >= 1){
$new_no = $no03 . $no_word01;
}else{
$new_no = $no03;
}
}else{
$new_no = '';
}

//記録
$record01 = strstr($value_t_juni_base, '"Kiroku"');
$search_br = strpos($record01, '<br/>');
if ($search_br){
$record02 = strstr($record01, '<br/>', true);
}else{
$record02 = strstr($record01, '","', true);
}
$record03 = str_replace('"Kiroku":"', '', $record02);
if ($record03){
$record04 = preg_replace('/[m:]/', '.', $record03);

if (($x_event_type == "100M") || ($x_event_type == "200M") || ($x_event_type == "300M") || ($x_event_type == "400M") || ($x_event_type == "100MH") || ($x_event_type == "110MH") || ($x_event_type == "400MH") || ($x_event_type == "4×100MR")){
$dotto = substr_count($record04, '.');
if ($dotto == 2){
$record_001_front = substr($record04, 0, 3);
if ($record_001_front == "1.0"){ $record_001_front = "6";
}elseif ($record_001_front == "1.1"){ $record_001_front = "7";
}elseif ($record_001_front == "1.2"){ $record_001_front = "8";
}elseif ($record_001_front == "1.3"){ $record_001_front = "9";
}elseif ($record_001_front == "1.4"){ $record_001_front = "10";
}elseif ($record_001_front == "1.5"){ $record_001_front = "11";
}elseif ($record_001_front == "2.0"){ $record_001_front = "12";
}elseif ($record_001_front == "2.1"){ $record_001_front = "13";
}else{ $record_001_front = $record_001_front;
}
$record_001_back = substr($record04, 3);
$new_record = $record_001_front . $record_001_back;
}else{
$new_record = $record04;
}
}else{
$new_record = $record04;
}
//$new_record = $record04;
}else{
//DNS等確認
$record05 = strstr($value_t_juni_base, '"Comment"');
$record06 = strstr($record05, '","', true);
$record07 = str_replace('"Comment":"', '', $record06);
$search_qcoma = strpos($record07, ',');
if ($search_qcoma){
$record08 = strstr($record07, ',', true);
}else{
$record08 = $record07;
}
if ($record08 == 'DNS' || $record08 == 'DNF' || $record08 == 'DQ' || $record08 == 'NM'){
$new_record = $record08;
}else{
$new_record = '';
}
}

//風速 走り幅跳び・三段跳び
if ($search_leap){
$field_wind01 = strstr($value_t_juni_base, '"Kiroku"');
$field_wind02 = strstr($field_wind01, '","', true);
$search_field_wind_br = strpos($field_wind02, '<br/>');
if ($search_field_wind_br){
$field_wind03 = strstr($field_wind02, '<br/>');
$field_wind04 = str_replace('<br/>', '', $field_wind03);
$field_wind05 = str_replace('+', '', $field_wind04);
if ($new_no){
$new_field_wind = '(' . $field_wind05 . ')';
}else{
$new_field_wind = '';
}
}else{
$new_field_wind = '';
}
}else{
$new_field_wind = '';
}

//氏名
$name_word01 = mb_convert_encoding('（', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$name_word02 = mb_convert_encoding('）', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$search_name_x = strpos($x_event_type, $event_type_word14);
if ($search_name_x){
$new_name = '';
}else{
$name01 = strstr($value_t_juni_base, '"Kyogisha');
$name02 = strstr($name01, '","', true);
$name03 = strstr($name02, '":"');
$name04 = str_replace('":"', '', $name03);
$search_name_br = strpos($name04, '<br/>');
if ($search_name_br){
$name05 = strstr($name04, '<br/>');
$name06 = str_replace('<br/>', '', $name05);
}else{
$name06 = $name04;
}
$name07 = mb_convert_kana($name06, 'KVrns');
$name08 = str_replace($name_word01, '(', $name07);
$name09 = str_replace($name_word02, ')', $name08);
$name_word03 = mb_convert_encoding('(', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$name_word04 = mb_convert_encoding(')', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$search_name_word01 = strpos($name09, $name_word03);
if ($search_name_word01){
$name10 = strstr($name09, $name_word03, true);
}else{
$name10 = $name09;
}
$name11 = str_replace('<br/>', '', $name10);
$new_name = $name11;
}

//学年
if ($search_name_x){
$new_grade = '';
}else{
if ($search_name_word01){
$grade01 = strstr($name09, $name_word03);
$grade02 = strstr($grade01, $name_word04, true);
$grade03 = str_replace($name_word03, '', $grade02);
$new_grade = '(' . $grade03 . ')';
}else{
$new_grade = '';
}
}

//所属1・2
$affiliation01 = strstr($value_t_juni_base, '"Shozoku');
$affiliation02 = strstr($affiliation01, '","', true);
$affiliation03 = strstr($affiliation02, '":"');
$affiliation04 = str_replace('":"', '', $affiliation03);
$affiliation05 = mb_convert_kana($affiliation04, 'KVrns');
$affiliation06 = str_replace(' ', '', $affiliation05);
$search_affiliation_br = strpos($affiliation06, '<br/>');
if ($search_affiliation_br){
$affiliation1 = strstr($affiliation06, '<br/>', true);
$affiliation07 = strstr($affiliation06, '<br/>');
$affiliation08 = str_replace('<br/>', '', $affiliation07);
$affiliation09 = '(' . $affiliation08 . ')';
$new_affiliation2 = $affiliation09;
}else{
$affiliation1 = $affiliation06;
$new_affiliation2 = '';
}
//所属1・2　リレー
if ($search_name_x){
$affiliation_r01 = strstr($value_t_juni_base, '"TeamTitle"');
$affiliation_r02 = strstr($affiliation_r01, '","', true);
$affiliation_r03 = str_replace('"TeamTitle":"', '', $affiliation_r02);
$affiliation_r04 = mb_convert_kana($affiliation_r03, 'KVrns');
$affiliation_r05 = str_replace(' ', '', $affiliation_r04);
$search_affiliation_x = strpos($affiliation_r05, '":"');
if ($search_affiliation_x){
$affiliation_r06 = strstr($affiliation_r05, '":"');
$affiliation_r07 = str_replace('":"', '', $affiliation_r06);
$search_affiliation_xbr = strpos($affiliation_r07 , '<br/>');
if ($search_affiliation_xbr){
$affiliation_r08 = strstr($affiliation_r07, '<br/>', true);
}else{
$affiliation_r08 = $affiliation_r07;
}
}else{
$affiliation_r08 = $affiliation_r05;
}
$new_affiliation1 = $affiliation_r08;
}else{
$new_affiliation1 = $affiliation1;
}



echo "<tr>\r\n";
echo "<td>\r\n";
echo $new_no . " " . $new_record . $new_field_wind . " " . $new_name . $new_grade . " " . $new_affiliation1 . $new_affiliation2;
echo "\r\n</td>\r\n";
echo "</tr>\r\n";

}//foreach $value_t_juni_base
//////////////// 順位毎処理 ////////////////







}//foreach $value_t_kumi0
//echo "<p>" . $new_url . "</p>\r\n";
//////////////// 組毎処理 ////////////////

echo "</table>\r\n";
echo "</div>\r\n";
echo "</div>\r\n";

}else{//必要のない競技非表示
echo '';
}//必要のない競技非表示
}
//////////////// 種目毎URL取得 ////////////////





///////////////////////////////////////////////
////////////////// 混成取得 ///////////////////
///////////////////////////////////////////////
$konsei_shutoku01 = $new_t_url . 'konseishukei/KonseiShukei.json';
$konsei_url_base = @file_get_contents($konsei_shutoku01);
//echo $konsei_url_base;
$search_konsei_link = strpos($konsei_url_base, '.html');
if ($search_konsei_link){
preg_match_all('|"KyogiMei"(.*?).html|mis' ,$konsei_url_base ,$all_konsei_url_base);
foreach ($all_konsei_url_base[0] as $value_konsei_url_base) {
//echo '<p>' . $value_konsei_url_base . '</p>';

//混成URLページ取得
$konsei_page01 = strstr($value_konsei_url_base, '/details/');
$new_konsei_url_base = $new_t_url . 'konseishukei' . $konsei_page01;
//echo '<p>' . $new_konsei_url_base . '</p>';


//種目名
$k_event_type_word01 = mb_convert_encoding('男子', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$k_event_type_word02 = mb_convert_encoding('女子', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$k_event_type_word03 = mb_convert_encoding('子', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$k_event_type_word04 = mb_convert_encoding('男', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$k_event_type_word05 = mb_convert_encoding('女', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$k_event_type01 = strstr($value_konsei_url_base, '","', true);
$k_event_type02 = strstr($k_event_type01, $k_event_type_word03);
$k_event_type03 = str_replace($k_event_type_word03, '', $k_event_type02);
$k_event_type04 = mb_convert_kana($k_event_type03, 'KVrns');
$k_event_type_word06 = mb_convert_encoding('4種', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$k_event_type_word07 = mb_convert_encoding('四種', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$k_event_type_word08 = mb_convert_encoding('7種', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$k_event_type_word09 = mb_convert_encoding('七種', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$k_event_type_word10 = mb_convert_encoding('8種', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$k_event_type_word11 = mb_convert_encoding('八種', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$k_event_type_word12 = mb_convert_encoding('10種', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$k_event_type_word13 = mb_convert_encoding('十種', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$k_event_type05 = str_replace($k_event_type_word06, $k_event_type_word07, $k_event_type04);
$k_event_type06 = str_replace($k_event_type_word08, $k_event_type_word09, $k_event_type05);
$k_event_type07 = str_replace($k_event_type_word10, $k_event_type_word11, $k_event_type06);
$k_event_type08 = str_replace($k_event_type_word12, $k_event_type_word13, $k_event_type07);
$x_event_type = $k_event_type08;
//echo '<p>' . $x_event_type . '</p>';

//レース状況
$k_race_type_word01 = mb_convert_encoding('決勝', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$x_race_type = $k_race_type_word01;

//性別
$search_k_sex01 = strpos($k_event_type01, $k_event_type_word04);
$search_k_sex02 = strpos($k_event_type01, $k_event_type_word05);
if ($search_k_sex01){
$x_sex = $k_event_type_word01;
$x_sex_color = '#A9D0F5';
}elseif ($search_k_sex02){
$x_sex = $k_event_type_word02;
$x_sex_color = '#F5A9A9';
}else{
$x_sex = '';
$x_sex_color = '';
}
//echo '<p>' . $new_sex . "-" . $new_event_type . '</p>';


////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////種目 詳細//////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
echo '<div class="cp_actab">' . "\r\n";
echo '<input id="' . $x_sex . $x_event_type . '" type="checkbox" name="tabs">' . "\r\n";
echo '<label for="' . $x_sex . $x_event_type . '" style="color:' . $x_sex_color . ';background-color:#6E6E6E;">' . $x_sex . ' ' . $x_event_type . ' ' . $x_race_type . '</label>' . "\r\n";
echo '<div class="cp_actab-content">' . "\r\n\r\n";
echo "<table class=\"s-tbl2\" width=\"100%\" style=\"width:100%;\">\r\n";
////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////種目 詳細//////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////



//////////////// 順位毎処理 ////////////////
$konsei_juni_base01 = str_replace('.html', '.json', $new_konsei_url_base);
$konsei_juni_base = @file_get_contents($konsei_juni_base01);
//echo '<p>' . $konsei_juni_base . '</p>';


//スタートリスト確認
$k_sl_word01 = mb_convert_encoding('スタートリスト', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$k_sl01 = strstr($konsei_juni_base, '"Jyuni"');
$k_sl02 = strstr($k_sl01, '","', true);
$k_sl03 = str_replace('"Jyuni":"', '', $k_sl02);
if ($k_sl03){
$new_sl = '';
}else{
$new_sl = '<span style="color:#FACC2E;font-weight:bold;">' . $k_sl_word01 . '</span> ';
}

////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////組 詳細///////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
echo "<tr>\r\n";
echo "<td style=\"color:#FFF;padding-left:1em;\" width=\"100%\" bgcolor=\"#848484\">\r\n";
echo $new_sl . $x_race_type . "\r\n";
echo "</td>\r\n";
echo "</tr>\r\n";
////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////組 詳細///////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////




preg_match_all('|"Jyuni"(.*?)"KyogiKirokuList"|mis', $konsei_juni_base, $all_k_juni_base);
foreach ($all_k_juni_base[0] as $value_k_juni_base) {

//順位
$k_no_word01 = mb_convert_encoding('位', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$k_no01 = strstr($value_k_juni_base, '"Jyuni"');
$k_no02 = strstr($k_no01, '","', true);
$k_no03 = str_replace('"Jyuni":"', '', $k_no02);
if ($k_no03){
if ($k_no03 >= 1){
$k_new_no = $k_no03;
}else{
$k_new_no = $k_no03;
}
}else{
$k_new_no = '';
}

//記録
$k_record01 = strstr($value_k_juni_base, '"Sougou"');
$k_record02 = strstr($k_record01, '","', true);
$k_record03 = str_replace('"Sougou":"', '', $k_record02);
if ($k_record03){
$k_new_record = $k_record03;
}else{
//DNS等確認
$k_record04 = strstr($value_k_juni_base, '"Comment"');
$k_record05 = strstr($k_record04, '","', true);
$k_record06 = str_replace('"Comment":"', '', $k_record05);
$k_search_qcoma = strpos($k_record06, ',');
if ($k_search_qcoma){
$k_record07 = strstr($k_record06, ',', true);
}else{
$k_record07 = $k_record06;
}
if ($k_record07 == 'DNS' || $k_record07 == 'DNF' || $k_record07 == 'DQ' || $k_record07 == 'NM'){
$k_new_record = $k_record07;
}else{
$k_new_record = '';
}
}

//氏名
$k_name_word01 = mb_convert_encoding('（', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$k_name_word02 = mb_convert_encoding('）', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$k_name01 = strstr($value_k_juni_base, '"Kyogisha');
$k_name02 = strstr($k_name01, '","', true);
$k_name03 = strstr($k_name02, '":"');
$k_search_name_br = strpos($k_name03, '<br>');
if ($k_search_name_br){
$k_name04 = strstr($k_name03, '<br>');
$k_name05 = str_replace('<br>', '', $k_name04);
}else{
$k_name05 = $k_name03;
}
$k_name06 = str_replace('":"', '', $k_name05);
$k_name07 = mb_convert_kana($k_name06, 'KVrns');
$k_name08 = str_replace($k_name_word01, '(', $k_name07);
$k_name09 = str_replace($k_name_word02, ')', $k_name08);
$k_new_name = $k_name09;

//所属1・2
$k_affiliation01 = strstr($value_k_juni_base, '"Shozoku');
$k_affiliation02 = strstr($k_affiliation01, '","', true);
$k_affiliation03 = strstr($k_affiliation02, '":"');
$k_affiliation04 = str_replace('":"', '', $k_affiliation03);
$k_affiliation05 = mb_convert_kana($k_affiliation04, 'KVrns');
$k_affiliation06 = str_replace(' ', '', $k_affiliation05);
$k_search_affiliation_br = strpos($k_affiliation06, '<br>');
if ($k_search_affiliation_br){
$k_new_affiliation1 = strstr($k_affiliation06, '<br>', true);
$k_affiliation07 = strstr($k_affiliation06, '<br>');
$k_affiliation08 = str_replace('<br>', '', $k_affiliation07);
$k_affiliation09 = '(' . $k_affiliation08 . ')';
$k_new_affiliation2 = $k_affiliation09;
}else{
$k_new_affiliation1 = $k_affiliation06;
$k_new_affiliation2 = '';
}


echo "<tr>\r\n";
echo "<td>\r\n";
echo $k_new_no . " " . $k_new_record . " " . $k_new_name . " " . $k_new_affiliation1 . $k_new_affiliation2;
echo "\r\n</td>\r\n";
echo "</tr>\r\n";

}//foreach
//////////////// 順位毎処理 ////////////////


echo "</table>\r\n";
echo "</div>\r\n";
echo "</div>\r\n";

}//foreach
}else{//if
echo '';
}//if
///////////////////////////////////////////////
////////////////// 混成取得 ///////////////////
///////////////////////////////////////////////


?>

</div>
</body>
</html>
