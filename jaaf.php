<?php
//header("Content-type: charset=UTF-8");
header("Content-type:text/html; charset=UTF-8");
//header("Content-type:text/html; charset=Shift-JIS");


$origin_t_url = (htmlspecialchars($_GET['url'], ENT_QUOTES));
//$origin_t_url = (htmlspecialchars($_POST['url'], ENT_QUOTES));


$origin_t_url01 = @file_get_contents($origin_t_url);
$origin_t_url02 = strstr($origin_t_url01, '<iframe');
$origin_t_url03 = strstr($origin_t_url02, '</iframe>', true);
$origin_t_url04 = strstr($origin_t_url03, 'src="');
$origin_t_url05 = strstr($origin_t_url04, '" ', true);
$origin_t_url06 = str_replace('src="', '', $origin_t_url05);
$origin_t_url07 = 'https://www.jaaf.or.jp' . $origin_t_url06;
$t_url = $origin_t_url07;
//echo "<p>" . $t_url . "</p>\r\n";


$t_url = str_replace('TimeTable.html', 'TimeTable.json', $t_url);

$new_t_url = str_replace('TimeTable.json', '', $t_url);
//echo $t_url;




echo "<table align=\"center\" bgcolor=\"#333333\">\r\n";

echo "\r\n<tr>\r\n";
echo "<td align=\"center\" style=\"padding:3px;\" bgcolor=\"#9FCFFF\">\r\n";
//echo "日付";
echo mb_convert_encoding('日付', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
echo "\r\n</td>\r\n";
echo "<td align=\"center\" style=\"padding:3px;\" bgcolor=\"#9FCFFF\">\r\n";
//echo "大会名";
echo mb_convert_encoding('大会名', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
echo "\r\n</td>\r\n";
echo "<td align=\"center\" style=\"padding:3px;\" bgcolor=\"#9FCFFF\">\r\n";
//echo "種目";
echo mb_convert_encoding('種目', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
echo "\r\n</td>\r\n";
echo "<td align=\"center\" style=\"padding:3px;\" bgcolor=\"#9FCFFF\">\r\n";
//echo "風速";
echo mb_convert_encoding('風速', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
echo "\r\n</td>\r\n";
echo "<td align=\"center\" style=\"padding:3px;\" bgcolor=\"#9FCFFF\">\r\n";
//echo "レース状況";
echo mb_convert_encoding('レース状況', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
echo "\r\n</td>\r\n";
echo "<td align=\"center\" style=\"padding:3px;\" bgcolor=\"#9FCFFF\">\r\n";
//echo "組";
echo mb_convert_encoding('組', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
echo "\r\n</td>\r\n";
echo "<td align=\"center\" style=\"padding:3px;\" bgcolor=\"#9FCFFF\">\r\n";
//echo "順位";
echo mb_convert_encoding('順位', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
echo "\r\n</td>\r\n";
echo "<td align=\"center\" style=\"padding:3px;\" bgcolor=\"#9FCFFF\">\r\n";
//echo "記録";
echo mb_convert_encoding('記録', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
echo "\r\n</td>\r\n";
echo "<td align=\"center\" style=\"padding:3px;\" bgcolor=\"#9FCFFF\">\r\n";
//echo "氏名";
echo mb_convert_encoding('氏名', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
echo "\r\n</td>\r\n";
echo "<td align=\"center\" style=\"padding:3px;\" bgcolor=\"#9FCFFF\">\r\n";
//echo "氏名カナ";
echo mb_convert_encoding('氏名カ', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
echo "\r\n</td>\r\n";
echo "<td align=\"center\" style=\"padding:3px;\" bgcolor=\"#9FCFFF\">\r\n";
//echo "学年";
echo mb_convert_encoding('学年', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
echo "\r\n</td>\r\n";
echo "<td align=\"center\" style=\"padding:3px;\" bgcolor=\"#9FCFFF\">\r\n";
//echo "所属1";
echo mb_convert_encoding('所属1', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
echo "\r\n</td>\r\n";
echo "<td align=\"center\" style=\"padding:3px;\" bgcolor=\"#9FCFFF\">\r\n";
//echo "所属2";
echo mb_convert_encoding('所属2', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
echo "\r\n</td>\r\n";
echo "<td align=\"center\" style=\"padding:3px;\" bgcolor=\"#9FCFFF\">\r\n";
//echo "性別";
echo mb_convert_encoding('性別', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
echo "\r\n</td>\r\n";
echo "<td align=\"center\" style=\"padding:3px;\" bgcolor=\"#9FCFFF\">\r\n";
//echo "表示/非表示";
echo mb_convert_encoding('表示/非表示', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
echo "\r\n</td>\r\n";
echo "<td align=\"center\" style=\"padding:3px;\" bgcolor=\"#9FCFFF\">\r\n";
//echo "備考";
echo mb_convert_encoding('備考', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
echo "\r\n</td>\r\n";
echo "</tr>\r\n";



//////////////// 種目毎URL取得 ////////////////

$t_url_base01 = file_get_contents($t_url);
//echo $t_url_base01;
$t_url_base = strstr($t_url_base01, 'SyumokuBetsuList');
preg_match_all('|"LinkRound":"./result/(.*?).html|mis',$t_url_base ,$all_t_url_base);

$new_url_x = array();

foreach ($all_t_url_base[0] as $value_t_url_base) {
//echo '<p>' . $value_t_url_base . '</p>';
$tx_01 = str_replace('"LinkRound":"./', '', $value_t_url_base);
$tx_02 = str_replace('.html', '.json', $tx_01);
$new_url = $new_t_url . $tx_02;
$new_url_x[] .= $new_url;
}

$result0 = array_unique($new_url_x);
foreach($result0 as $value0){
//echo "<p>" . $value0 . "</p>\r\n";



//////////////// 種目毎処理 ////////////////
$t_url_base2 = file_get_contents($value0);
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


//種目名
$event_type_word01 = mb_convert_encoding('決　勝', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word02 = mb_convert_encoding('決勝', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word03 = mb_convert_encoding('　', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word04 = mb_convert_encoding(' ', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word05 = mb_convert_encoding('男子', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word06 = mb_convert_encoding('女子', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word07 = mb_convert_encoding('子', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word08 = mb_convert_encoding('男', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word09 = mb_convert_encoding('女', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word10 = mb_convert_encoding('【', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word11 = mb_convert_encoding('】', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word12 = mb_convert_encoding('混合', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word13 = mb_convert_encoding('パラ', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word14 = mb_convert_encoding('×', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word15 = mb_convert_encoding('種', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word16 = mb_convert_encoding('（', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type01 = strstr($base_data01, '"SubTitle":"');
$event_type02 = strstr($event_type01, '","', true);
$search_event_type01 = strpos($event_type02, $event_type_word13);
$search_event_type02 = strpos($event_type02, $event_type_word15);
if ($search_event_type01 || $search_event_type02){
$x_event_type = '';
}else{
$search_event_type03 = strpos($event_type02, $event_type_word07 . $event_type_word03);
if ($search_event_type03){
$event_type03 = str_replace($event_type_word07 . $event_type_word03, $event_type_word07, $event_type02);
$search_event_type04 = strpos($event_type02, $event_type_word07 . $event_type_word04);
}elseif ($search_event_type04){
$event_type03 = str_replace($event_type_word07 . $event_type_word04, $event_type_word07, $event_type02);
}else{
$event_type03 = $event_type02;
}
$event_type05 = strstr($event_type03, $event_type_word07);
$event_type06 = str_replace($event_type_word07, '', $event_type05);
$event_type07 = mb_convert_kana($event_type06, 'kvrns');
$event_type08 = preg_replace('/.[(+)].+/', '', $event_type07);
$event_type09 = str_replace('X', $event_type_word14, $event_type08);
$event_type10 = $event_type09 . '-';
$event_type11 = str_replace(' -', '', $event_type10);
$event_type12 = str_replace('-', '', $event_type11);
$event_type13 = strrpos($event_type12,  ' ');
$event_type14 = substr($event_type12, 0, $event_type13);
$event_type15 = str_replace(' ', '', $event_type14);
$event_type_word17 = mb_convert_encoding('走', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word18 = mb_convert_encoding('走り', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type16 = str_replace($event_type_word17, $event_type_word18, $event_type15);
$event_type_word19 = mb_convert_encoding('跳', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word20 = mb_convert_encoding('跳び', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type17 = str_replace($event_type_word19, $event_type_word20, $event_type16);
$event_type_word21 = mb_convert_encoding('投', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word22 = mb_convert_encoding('投げ', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type18 = str_replace($event_type_word21, $event_type_word22, $event_type17);
$event_type19 = mb_strtoupper($event_type18);
$search_event_type05 = strpos($event_type19, 'MSC');
if ($search_event_type05){
$event_type20 = strstr($event_type19, 'MSC', true);
$event_type21 = $event_type20 . 'MSC';
}else{
$search_event_type06 = strpos($event_type19, 'MW');
if ($search_event_type06){
$event_type20 = strstr($event_type19, 'MW', true);
$event_type21 = $event_type20 . 'MW';
}else{
$search_event_type07 = strpos($event_type19, 'MR');
if ($search_event_type07){
$event_type20 = strstr($event_type19, 'MR', true);
$event_type21 = $event_type20 . 'MR';
}else{
$search_event_type08 = strpos($event_type19, 'MW');
if ($search_event_type08){
$event_type20 = strstr($event_type19, 'MW', true);
$event_type21 = $event_type20 . 'MW';
}else{
$search_event_type09 = strpos($event_type19, 'H');
if ($search_event_type09){
$event_type20 = strstr($event_type19, 'H', true);
$event_type21 = $event_type20 . 'H';
}else{
$search_event_type10 = strpos($event_type19, 'M');
if ($search_event_type10){
$event_type20 = strstr($event_type19, 'M', true);
$event_type21 = $event_type20 . 'M';
}else{
$search_event_type11 = strpos($event_type19, $event_type_word20);
if ($search_event_type11){
$event_type20 = strstr($event_type19, $event_type_word20, true);
$event_type21 = $event_type20 . $event_type_word20;
}else{
$search_event_type12 = strpos($event_type19, $event_type_word22);
if ($search_event_type12){
$event_type20 = strstr($event_type19, $event_type_word22, true);
$event_type21 = $event_type20 . $event_type_word22;
}else{
$event_type21 = $event_type19;
}//if 投げ
}//if 跳び
}//if M
}//if H
}//if MW
}//if MR
}//if MW
}//if MSC
$event_type_word23 = mb_convert_encoding('年', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word24 = mb_convert_encoding('種目', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$search_event_type13 = strpos($event_type21, $event_type_word23);
$search_event_type14 = strpos($event_type21, $event_type_word24);
if ($search_event_type13){
$event_type22 = strstr($event_type21, $event_type_word23);
$event_type23 = str_replace($event_type_word23, '', $event_type22);
$x_event_type = $event_type23;
}elseif ($search_event_type14){
$event_type22 = strstr($event_type21, $event_type_word24);
$event_type23 = str_replace($event_type_word24, '', $event_type22);
$x_event_type = $event_type23;
}else{
$x_event_type = $event_type21;
}
}





//性別
$search_sex01 = strpos($event_type01, $event_type_word05);
$search_sex02 = strpos($event_type01, $event_type_word06);
$search_sex03 = strpos($event_type01, $event_type_word07);
$search_sex04 = strpos($event_type01, $event_type_word08);
$search_sex05 = strpos($event_type01, $event_type_word09);
if ($search_sex01 || ($search_sex04 && !$search_sex05 && !$search_sex03)){
$x_sex = $event_type_word05;
$x_sex_color = '#A9D0F5';
}elseif ($search_sex02 || ($search_sex05 && !$search_sex04 && !$search_sex03)){
$x_sex = $event_type_word06;
$x_sex_color = '#F5A9A9';
}else{
$x_sex = $event_type_word08 . $event_type_word09 . $event_type_word12;
$x_sex_color = '#BCA9F5';
}


//レース状況
$race_type_word01 = mb_convert_encoding('決 勝', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$race_type_word02 = mb_convert_encoding('決勝', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$race_type_word03 = mb_convert_encoding('予 選', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$race_type_word04 = mb_convert_encoding('予選', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$race_type_word05 = mb_convert_encoding('ﾀｲﾑﾚｰｽ', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$race_type01 = str_replace($race_type_word01, $race_type_word02, $event_type12);
$race_type02 = str_replace($race_type_word03, $race_type_word04, $race_type01);
$race_type03 = strrpos($race_type02,  ' ');
$race_type04 = substr($race_type02, $race_type03);
$race_type05 = str_replace(' ', '', $race_type04);
$new_race_type = $race_type05;


//種別
$race_shubetsu01 = $event_type02;
$race_shubetsu02 = mb_convert_kana($race_shubetsu01, 'kvrns');
$race_shubetsu03 = preg_replace('/.[(+)].+/', '', $race_shubetsu02);
$race_shubetsu04 = str_replace('X', $event_type_word14, $race_shubetsu03);
$race_shubetsu05 = $race_shubetsu04 . '-';
$race_shubetsu06 = str_replace(' -', '', $race_shubetsu05);
$race_shubetsu07 = str_replace('-', '', $race_shubetsu06);
$race_shubetsu08 = str_replace(' ', '', $race_shubetsu07);
$race_shubetsu09 = str_replace($event_type_word17, $event_type_word18, $race_shubetsu08);
$race_shubetsu10 = str_replace($event_type_word19, $event_type_word20, $race_shubetsu09);
$race_shubetsu11 = str_replace($event_type_word21, $event_type_word22, $race_shubetsu10);
$race_shubetsu12 = mb_strtoupper($race_shubetsu11);
$race_shubetsu13 = str_replace($x_sex, '', $race_shubetsu12);
$race_shubetsu14 = str_replace($x_event_type, '', $race_shubetsu13);
$race_shubetsu15 = str_replace($new_race_type, '', $race_shubetsu14);
$race_shubetsu16 = str_replace('"SUBTITLE":"', '', $race_shubetsu15);
if ($race_shubetsu16 ){
$race_shubetsu17 = $event_type_word10 . $race_shubetsu16 . $event_type_word11;
$new_race_shubetsu = $race_shubetsu17;
}else{
$new_race_shubetsu = '';
}
//$new_note = $race_shubetsu01;


//レース状況 + 種別
$x_race_type = $new_race_type . $new_race_shubetsu;








//混成 種目別 判定
$konsei_word = mb_convert_encoding('種', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$search_konsei = strpos($x_race_type, $konsei_word);

if (!$search_konsei){//必要のない競技非表示
/**************************************************************************************************/
/********************************************種目 詳細*********************************************/
/**************************************************************************************************/
/*
echo '<div class="cp_actab">' . "\r\n";
echo '<input id="' . $x_sex . $x_event_type . $x_race_type . '" type="checkbox" name="tabs">' . "\r\n";
echo '<label for="' . $x_sex . $x_event_type . $x_race_type . '" style="color:' . $x_sex_color . ';background-color:#6E6E6E;">' . $x_sex . ' ' . $x_event_type .  ' ' . $x_race_type . '</label>' . "\r\n";
echo '<div class="cp_actab-content">' . "\r\n\r\n";
echo "<table class=\"s-tbl2\" width=\"100%\" style=\"width:100%;\">\r\n";
*/
/**************************************************************************************************/
/********************************************種目 詳細*********************************************/
/**************************************************************************************************/
//////////////// 種目毎処理 ////////////////



//////////////// 組毎処理 ////////////////
$t_kumi_base = @file_get_contents($value0);

$heat_word01 = mb_convert_encoding('組', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$heat_word02 = mb_convert_encoding('招集', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');

$search_track = strpos($value0, '/track/');
$search_leap = strpos($value0, '/leap/');
$search_throwing = strpos($value0, '/throwing/');

//年月日
if ($search_track){
$ymd01 = strstr($value0, '/track/');
$ymd02 = strstr($ymd01, '_', true);
$ymd03 = str_replace('/track/', '', $ymd02);
$new_ymd = $ymd03;
}elseif ($search_leap){
$ymd01 = strstr($value0, '/leap/');
$ymd02 = strstr($ymd01, '_', true);
$ymd03 = str_replace('/leap/', '', $ymd02);
$new_ymd = $ymd03;
}elseif ($search_throwing){
$ymd01 = strstr($value0, '/throwing/');
$ymd02 = strstr($ymd01, '_', true);
$ymd03 = str_replace('/throwing/', '', $ymd02);
$new_ymd = $ymd03;
}else{
$new_ymd = '';
}


//$t_kumi0 = strstr($t_kumi_base, '1":[{"Status"');
$t_kumi0 = strstr($t_kumi_base, '[{"Status"');
$t_kumi0 = strstr($t_kumi0, '":[{"Status"');
$t_kumi0 = str_replace('":[{"Status"', ',{"Status"', $t_kumi0);


//組数確認
$kumi_count = substr_count($t_kumi0, $heat_word02);


if ($search_track){
preg_match_all('|,{"Status"(.*?)}],|mis', $t_kumi0, $all_t_kumi0);
}elseif ($search_leap || $search_throwing){
preg_match_all('|"Status"(.*?)}]}]|mis', $t_kumi0, $all_t_kumi0);
}else{
$all_t_kumi0 = '';
}
foreach ($all_t_kumi0[0] as $value_t_kumi0) {

//組
$heat01 = strstr($value_t_kumi0, '"Status":"');
$heat02 = strstr($heat01, $heat_word01, true);
$heat03 = str_replace('"Status":"', '', $heat02);
if ($kumi_count > 1){
$new_heat = $heat03;
}else{
$new_heat = '';
}

//$new_note = $t_kumi0;

//風速
$wind01 = strstr($value_t_kumi0, '"Kiroku"');
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
$sl01 = strstr($value_t_kumi0, '"Jyuni"');
$sl02 = strstr($sl01, '","', true);
$sl03 = str_replace('"Jyuni":"', '', $sl02);
if ($sl03){
$new_sl = '';
}else{
$new_sl = '<span style="color:#FACC2E;font-weight:bold;">' . $sl_word01 . '</span> ';
}


/**************************************************************************************************/
/*********************************************組 詳細**********************************************/
/**************************************************************************************************/
/*
echo "<tr>\r\n";
echo "<td style=\"color:#FFF;padding-left:1em;\" width=\"100%\" bgcolor=\"#848484\">\r\n";
echo $new_sl . $x_race_type . " " . $new_heat . " " . $new_wind . "\r\n";
echo "</td>\r\n";
echo "</tr>\r\n";
*/
/**************************************************************************************************/
/*********************************************組 詳細**********************************************/
/**************************************************************************************************/



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
$new_no = $no03;
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
$new_field_wind = $field_wind05;
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
$name07 = mb_convert_kana($name06, 'kvrns');
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
if ($search_name_word01){
$grade01 = strstr($name09, $name_word03);
$grade02 = strstr($grade01, $name_word04, true);
$grade03 = str_replace($name_word03, '', $grade02);
$new_grade = $grade03;
}else{
$new_grade = '';
}

//所属1・2
$affiliation01 = strstr($value_t_juni_base, '"Shozoku');
$affiliation02 = strstr($affiliation01, '","', true);
$affiliation03 = strstr($affiliation02, '":"');
$affiliation04 = str_replace('":"', '', $affiliation03);
$affiliation05 = mb_convert_kana($affiliation04, 'kvrns');
$affiliation06 = str_replace(' ', '', $affiliation05);
$search_affiliation_br = strpos($affiliation06, '<br/>');
if ($search_affiliation_br){
$affiliation1 = strstr($affiliation06, '<br/>', true);
$affiliation07 = strstr($affiliation06, '<br/>');
$affiliation08 = str_replace('<br/>', '', $affiliation07);
$affiliation09 = '(' . $affiliation08 . ')';
$new_affiliation2 = $affiliation08;
}else{
$affiliation1 = $affiliation06;
$new_affiliation2 = '';
}
//所属1・2　リレー
if ($search_name_x){
$affiliation_r01 = strstr($value_t_juni_base, '"TeamTitle"');
$affiliation_r02 = strstr($affiliation_r01, '","', true);
$affiliation_r03 = str_replace('"TeamTitle":"', '', $affiliation_r02);
$affiliation_r04 = mb_convert_kana($affiliation_r03, 'kvVrns');
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


/*
echo "<tr>\r\n";
echo "<td>\r\n";
echo $new_no . " " . $new_record . $new_field_wind . " " . $new_name . " " . $new_affiliation1 . $new_affiliation2;
echo "\r\n</td>\r\n";
echo "</tr>\r\n";
*/



echo "\r\n<tr>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo $new_ymd;//日付
echo "\r\n</td>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo $new_tn;//大会名
echo "\r\n</td>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo $x_event_type;//種目
echo "\r\n</td>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo $new_wind . $new_field_wind;//風速
echo "\r\n</td>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo $x_race_type;//レース状況
echo "\r\n</td>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo $new_heat;//組
echo "\r\n</td>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo $new_no;//順位
echo "\r\n</td>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo $new_record;//記録
echo "\r\n</td>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo $new_name;//氏名
echo "\r\n</td>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo "";//氏名カナ
echo "\r\n</td>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo $new_grade;//学年
echo "\r\n</td>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo $new_affiliation1;//所属1
echo "\r\n</td>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo $new_affiliation2;//所属2
echo "\r\n</td>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo $x_sex;//性別
echo "\r\n</td>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo "";//表示/非表示
echo "\r\n</td>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo $new_note;//備考
echo "\r\n</td>\r\n";
}//foreach $value_t_juni_base
//////////////// 順位毎処理 ////////////////







}//foreach $value_t_kumi0
//echo "<p>" . $value0 . "</p>\r\n";
//////////////// 組毎処理 ////////////////

/*
echo "</table>\r\n";
echo "</div>\r\n";
*/
}else{//必要のない競技非表示
echo '';
}//必要のない競技非表示
}
//////////////// 種目毎URL取得 ////////////////





///////////////////////////////////////////////
////////////////// 混成取得 ///////////////////
///////////////////////////////////////////////
$konsei_shutoku01 = $new_t_url . 'konseishukei/KonseiShukei.json';
$konsei_url_base = file_get_contents($konsei_shutoku01);
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


/**************************************************************************************************/
/********************************************種目 詳細*********************************************/
/**************************************************************************************************/
/*
echo '<div class="cp_actab">' . "\r\n";
echo '<input id="' . $x_sex . $x_event_type . '" type="checkbox" name="tabs">' . "\r\n";
echo '<label for="' . $x_sex . $x_event_type . '" style="color:' . $x_sex_color . ';background-color:#6E6E6E;">' . $x_sex . ' ' . $x_event_type . '</label>' . "\r\n";
echo '<div class="cp_actab-content">' . "\r\n\r\n";
echo "<table class=\"s-tbl2\" width=\"100%\" style=\"width:100%;\">\r\n";
*/
/**************************************************************************************************/
/********************************************種目 詳細*********************************************/
/**************************************************************************************************/



//////////////// 順位毎処理 ////////////////
$konsei_juni_base01 = str_replace('.html', '.json', $new_konsei_url_base);
$konsei_juni_base = file_get_contents($konsei_juni_base01);
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

/**************************************************************************************************/
/*********************************************組 詳細**********************************************/
/**************************************************************************************************/
/*
echo "<tr>\r\n";
echo "<td style=\"color:#FFF;padding-left:1em;\" width=\"100%\" bgcolor=\"#848484\">\r\n";
echo $new_sl . $x_race_type . "\r\n";
echo "</td>\r\n";
echo "</tr>\r\n";
*/
/**************************************************************************************************/
/*********************************************組 詳細**********************************************/
/**************************************************************************************************/




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
$k_name07 = mb_convert_kana($k_name06, 'kvrns');
$k_name08 = str_replace($k_name_word01, '(', $k_name07);
$k_name09 = str_replace($k_name_word02, ')', $k_name08);
$k_new_name = $k_name09;

//所属1・2
$k_affiliation01 = strstr($value_k_juni_base, '"Shozoku');
$k_affiliation02 = strstr($k_affiliation01, '","', true);
$k_affiliation03 = strstr($k_affiliation02, '":"');
$k_affiliation04 = str_replace('":"', '', $k_affiliation03);
$k_affiliation05 = mb_convert_kana($k_affiliation04, 'kvrns');
$k_affiliation06 = str_replace(' ', '', $k_affiliation05);
$k_search_affiliation_br = strpos($k_affiliation06, '<br>');
if ($k_search_affiliation_br){
$k_new_affiliation1 = strstr($k_affiliation06, '<br>', true);
$k_affiliation07 = strstr($k_affiliation06, '<br>');
$k_affiliation08 = str_replace('<br>', '', $k_affiliation07);
$k_affiliation09 = '(' . $k_affiliation08 . ')';
$k_new_affiliation2 = $k_affiliation08;
}else{
$k_new_affiliation1 = $k_affiliation06;
$k_new_affiliation2 = '';
}

/*
echo "<tr>\r\n";
echo "<td>\r\n";
echo $k_new_no . " " . $k_new_record . $k_new_field_wind . " " . $k_new_name . " " . $k_new_affiliation1 . $k_new_affiliation2;
echo "\r\n</td>\r\n";
echo "</tr>\r\n";
*/

echo "\r\n<tr>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo $new_ymd;//日付
echo "\r\n</td>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo $new_tn;//大会名
echo "\r\n</td>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo $x_event_type;//種目
echo "\r\n</td>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo $k_new_wind . $k_new_field_wind;//風速
echo "\r\n</td>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo $x_race_type;//レース状況
echo "\r\n</td>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo $new_heat;//組
echo "\r\n</td>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo $k_new_no;//順位
echo "\r\n</td>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo $k_new_record;//記録
echo "\r\n</td>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo $k_new_name;//氏名
echo "\r\n</td>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo "";//氏名カナ
echo "\r\n</td>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo $new_grade;//学年
echo "\r\n</td>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo $k_new_affiliation1;//所属1
echo "\r\n</td>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo $k_new_affiliation2;//所属2
echo "\r\n</td>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo $x_sex;//性別
echo "\r\n</td>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo "";//表示/非表示
echo "\r\n</td>\r\n";
echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n";
echo $new_note;//備考
echo "\r\n</td>\r\n";
echo "\r\n</trd>\r\n";
}//foreach
//////////////// 順位毎処理 ////////////////

/*
echo "</table>\r\n";
echo "</div>\r\n";
*/
}//foreach
}else{//if
echo '';
}//if
///////////////////////////////////////////////
////////////////// 混成取得 ///////////////////
///////////////////////////////////////////////





echo "</table>\r\n";

?>
