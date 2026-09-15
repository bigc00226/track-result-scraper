<?php
//header("Content-type: charset=UTF-8");
header("Content-type:text/html; charset=UTF-8");
//header("Content-type:text/html; charset=Shift-JIS");


$t_url = (htmlspecialchars($_GET['url'], ENT_QUOTES));
//$t_url = (htmlspecialchars($_POST['url'], ENT_QUOTES));
$t_url = str_replace('TimeTable.html', 'TimeTable.json', $t_url);

$new_t_url = str_replace('TimeTable.json', '', $t_url);
//echo $new_t_url;


//echo "★";

$get_url = $_GET['url'];
$get_sex = $_GET['sex'];
$get_event = $_GET['event'];
$get_rt = $_GET['rt'];
$get_purl = $_GET['purl'];

$this_url = $get_purl;


//echo '<p>' . $_SERVER['REQUEST_URI'] . '</p>';
//echo '<p>' . $get_url . '</p>';
//echo '<p>' . $get_sex . '</p>';
//echo '<p>' . $get_event . '</p>';
//echo '<p>' . $get_rt . '</p>';
//echo '<p>' . $get_purl . '</p>';



//////////////// 種目毎URL取得 ////////////////

$t_url_base01 = @file_get_contents($t_url);
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
$t_url_base2 = @file_get_contents($value0);
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


///////////////////////////////////////////////////////////////
$race_type_word01 = mb_convert_encoding('決 勝', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$race_type_word02 = mb_convert_encoding('決勝', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$race_type_word03 = mb_convert_encoding('予 選', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$race_type_word04 = mb_convert_encoding('予選', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');

$event_type_word_man = "Men's";
$event_type_word_woman = "Women's";
$event_type_word_mix = "Mix's";
$event_type_word01 = mb_convert_encoding('決 勝', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
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
$event_type_word17 = mb_convert_encoding('走', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word18 = mb_convert_encoding('走り', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word19 = mb_convert_encoding('跳', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word20 = mb_convert_encoding('跳び', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word21 = mb_convert_encoding('投', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word22 = mb_convert_encoding('投げ', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word23 = mb_convert_encoding('走高跳', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word24 = mb_convert_encoding('棒高跳', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word25 = mb_convert_encoding('走幅跳', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word26 = mb_convert_encoding('三段跳', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word27 = mb_convert_encoding('砲丸投', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word28 = mb_convert_encoding('円盤投', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word29 = mb_convert_encoding('ハンマー投', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word30 = mb_convert_encoding('やり投', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word31 = mb_convert_encoding('予 選', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word32 = mb_convert_encoding('予選', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word33 = mb_convert_encoding('ジュニア', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word34 = mb_convert_encoding('ジャベリックスロー', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word35 = mb_convert_encoding('ジャベリックボール投', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word36 = mb_convert_encoding('ボール投', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$event_type_word37 = mb_convert_encoding(' 通過', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
///////////////////////////////////////////////////////////////



//レース状況
$search_race_type_tsuka = strpos($base_data01, $event_type_word37);
if ($search_race_type_tsuka){
$race_type01 = strstr($base_data01, $event_type_word37, true);
}else{
$race_type01 = strstr($base_data01, '","', true);
}
$race_type02 = mb_convert_kana($race_type01, 'KVrns');
$race_type03 = str_replace($race_type_word01, $race_type_word02, $race_type02);
$race_type04 = str_replace($race_type_word03, $race_type_word04, $race_type03);
$search_race_type01 = strpos($race_type04, '+');
if ($search_race_type01){
$race_type05 = strrpos($race_type04, ' ');
$race_type06 = substr($race_type04, 1, $race_type05-1);
}else{
$race_type06 = $race_type04;
}
$race_type07 = $race_type06 . 'xxx';
$race_type08 = str_replace(' xxx', '', $race_type07);
$race_type09 = str_replace('xxx', '', $race_type08);
$race_type10 = strrpos($race_type09, ' ');
$race_type11 = substr($race_type09, $race_type10+1);
$new_race_type = $race_type11;
//echo '<p>' . $new_race_type . '</p>';


//種目
$search_event_type_tsuka = strpos($base_data01, $event_type_word37);
if ($search_event_type_tsuka){
$event_type01 = strstr($base_data01, $event_type_word37, true);
}else{
$event_type01 = strstr($base_data01, '","', true);
}
$search_event_type01 = strpos($event_type01, $event_type_word13);
$search_event_type02 = strpos($event_type01, $event_type_word15);
if ($search_event_type01 || $search_event_type02){//パラ・混成以外
$x_event_type = '';
}else{
$event_type02 = mb_convert_kana($event_type01, 'KVrns');
$event_type03 = str_replace('4X', '4' . $event_type_word14, $event_type02);
$event_type04 = str_replace('4x', '4' . $event_type_word14, $event_type03);
$event_type05 = str_replace('Metres Relay', 'mR', $event_type04);
$event_type06 = str_replace('HighJump', $event_type_word23, $event_type05);
$event_type07 = str_replace('PoleVault', $event_type_word24, $event_type06);
$event_type08 = str_replace('LongJump', $event_type_word25, $event_type07);
$event_type09 = str_replace('TripleJump', $event_type_word26, $event_type08);
$event_type10 = str_replace('ShotPut', $event_type_word27, $event_type09);
$event_type11 = str_replace('DiscusThrow', $event_type_word28, $event_type10);
$event_type12 = str_replace('HammerThrow', $event_type_word29, $event_type11);
$event_type13 = str_replace('JavelinThrow', $event_type_word30, $event_type12);
$event_type14 = str_replace($event_type_word_man, $event_type_word05, $event_type13);//男子変換
$event_type15 = str_replace($event_type_word_woman, $event_type_word06, $event_type14);//女子変換
$event_type16 = str_replace($event_type_word_mix, $event_type_word08 . $event_type_word09, $event_type15);//男女変換
$event_type17 = str_replace($event_type_word05, '', $event_type16);//男子
$event_type18 = str_replace($event_type_word06, '', $event_type17);//女子
$event_type19 = str_replace($event_type_word08 . $event_type_word09, '', $event_type18);//男女
$event_type20 = str_replace($event_type_word08, '', $event_type19);//男
$event_type21 = str_replace($event_type_word09, '', $event_type20);//女
$event_type22 = str_replace($event_type_word12, '', $event_type21);//混合
$event_type23 = str_replace($event_type_word01, $event_type_word02, $event_type22);
$event_type24 = str_replace($event_type_word31, $event_type_word32, $event_type23);
$search_event_type03 = strpos($event_type24, '+');
if ($search_event_type03){
$event_type25 = strrpos($event_type24, ' ');
$event_type26 = substr($event_type24, 1, $event_type25-1);
}else{
$event_type26 = $event_type24;
}
$event_type27 = str_replace(' ' . $new_race_type, '', $event_type26);


$search_event_x = strpos($event_type27, $event_type_word14);
$search_event_100m = strpos($event_type27, '100m');
$search_event_145m = strpos($event_type27, '145m');
$search_event_150m = strpos($event_type27, '150m');
$search_event_200m = strpos($event_type27, '200m');
$search_event_300m = strpos($event_type27, '300m');
$search_event_400m = strpos($event_type27, '400m');
$search_event_800m = strpos($event_type27, '800m');
$search_event_1000m = strpos($event_type27, '1000m');
$search_event_1500m = strpos($event_type27, '1500m');
$search_event_2000m = strpos($event_type27, '2000m');
$search_event_3000m = strpos($event_type27, '3000m');
$search_event_5000m = strpos($event_type27, '5000m');
$search_event_10000m = strpos($event_type27, '10000m');
$search_event_10km = strpos($event_type27, '10Km');
$search_event_20km = strpos($event_type27, '20Km');
$search_event_50km = strpos($event_type27, '50Km');
$search_event_80mh = strpos($event_type27, '80mH');
$search_event_100mh = strpos($event_type27, '100mH');
$search_event_100myh = strpos($event_type27, '100mYH');
$search_event_100mjh = strpos($event_type27, '100mJH');
$search_event_110mh = strpos($event_type27, '110mH');
$search_event_110myh = strpos($event_type27, '110mYH');
$search_event_110mjh = strpos($event_type27, '110mJH');
$search_event_300mh = strpos($event_type27, '300mH');
$search_event_400mh = strpos($event_type27, '400mH');
$search_event_2000msc = strpos($event_type27, '2000mSC');
$search_event_3000msc = strpos($event_type27, '3000mSC');
$search_event_3000mw = strpos($event_type27, '3000mW');
$search_event_5000mw = strpos($event_type27, '5000mW');
$search_event_hj = strpos($event_type27, $event_type_word23);
$search_event_pv = strpos($event_type27, $event_type_word24);
$search_event_lj = strpos($event_type27, $event_type_word25);
$search_event_tj = strpos($event_type27, $event_type_word26);
$search_event_sp = strpos($event_type27, $event_type_word27);
$search_event_dt = strpos($event_type27, $event_type_word28);
$search_event_ht = strpos($event_type27, $event_type_word29);
$search_event_jt = strpos($event_type27, $event_type_word30);
$search_event_javelict = strpos($event_type27, $event_type_word34);
$search_event_jbt = strpos($event_type27, $event_type_word35);
$search_event_bt = strpos($event_type27, $event_type_word36);


if ($search_event_x){
$event_type28 = strstr($event_type27, '4' . $event_type_word14);
$event_type29 = strstr($event_type28, 'R', true);
$event_type100 = $event_type29 . 'R';
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_100m && !$search_event_100mh && !$search_event_100myh && !$search_event_100mjh){
$event_type100 = '100m';
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_145m){
$event_type100 = '145m';
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_150m){
$event_type100 = '150m';
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_200m){
$event_type100 = '200m';
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_300m && !$search_event_300mh){
$event_type100 = '300m';
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_400m && !$search_event_400mh){
$event_type100 = '400m';
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_800m){
$event_type100 = '800m';
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_1000m){
$event_type100 = '1000m';
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_1500m){
$event_type100 = '1500m';
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_2000m && !$search_event_2000msc){
$event_type100 = '2000m';
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_3000m && !$search_event_3000msc && !$search_event_3000mw){
$event_type100 = '3000m';
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_5000m && !$search_event_5000mw){
$event_type100 = '5000m';
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_10000m){
$event_type100 = '10000m';
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_10km){
$event_type100 = '10Km';
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_20km){
$event_type100 = '20Km';
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_50km){
$event_type100 = '50Km';
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_80mh){
$event_type100 = '80mH';
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_100mh){
$event_type100 = '100mH';
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_100myh){
$event_type100 = '100mYH';
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_100mjh){
$event_type100 = '100mJH';
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_110mh){
$event_type100 = '110mH';
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_110myh){
$event_type100 = '110mYH';
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_110mjh){
$event_type100 = '110mJH';
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_300mh){
$event_type100 = '300mH';
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_400mh){
$event_type100 = '400mH';
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_2000msc){
$event_type100 = '2000mSC';
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_3000msc){
$event_type100 = '3000mSC';
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_3000mw){
$event_type100 = '3000mW';
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_5000mw){
$event_type100 = '5000mW';
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_hj){
$event_type100 = $event_type_word23;
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_pv){
$event_type100 = $event_type_word24;
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_lj){
$event_type100 = $event_type_word25;
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_tj){
$event_type100 = $event_type_word26;
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_sp){
$event_type100 = $event_type_word27;
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_dt){
$event_type100 = $event_type_word28;
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_ht){
$event_type100 = $event_type_word29;
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_jt){
$event_type100 = $event_type_word30;
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_javelict){
$event_type100 = $event_type_word34;
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_jbt){
$event_type100 = $event_type_word35;
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}elseif ($search_event_bt && $search_event_jbt){
$event_type100 = $event_type_word36;
$race_shubetsu00 = str_replace($event_type100, '', $event_type27);
}else{
$event_type100 = $event_type27;
}
$x_event_type = $event_type100;
}//パラ・混成以外


//性別
$sex01 = strstr($base_data01,  '","', true);
$search_sex01 = strpos($sex01, $event_type_word05);
$search_sex02 = strpos($sex01, $event_type_word06);
$search_sex03 = strpos($sex01, $event_type_word07);
$search_sex04 = strpos($sex01, $event_type_word08);
$search_sex05 = strpos($sex01, $event_type_word09);
$search_sex07 = strpos($sex01, $event_type_word_man);
$search_sex08 = strpos($sex01, $event_type_word_woman);
$search_sex09 = strpos($sex01, $event_type_word_mix);
if ($search_sex01 || ($search_sex04 && !$search_sex05 && !$search_sex03) || $search_sex07){
$x_sex = $event_type_word05;
$x_sex_color = '#A9D0F5';
}elseif ($search_sex02 || ($search_sex05 && !$search_sex04 && !$search_sex03) || $search_sex08){
$x_sex = $event_type_word06;
$x_sex_color = '#F5A9A9';
}else{
$x_sex = $event_type_word08 . $event_type_word09 . $event_type_word12;
$x_sex_color = '#BCA9F5';
}


//種別
$race_shubetsu01 = str_replace('  ', ' ', $race_shubetsu00);
$race_shubetsu02 = str_replace('"SubTitle":"', '', $race_shubetsu01);
$race_shubetsu03 = str_replace('SubTitle":"', '', $race_shubetsu02);
$race_shubetsu04 = $race_shubetsu03 . '000';
$race_shubetsu05 = str_replace(' 000', '', $race_shubetsu04);
$race_shubetsu06 = str_replace('000', '', $race_shubetsu05);
$race_shubetsu07 = '000' . $race_shubetsu06;
$race_shubetsu08 = str_replace('000 ', '', $race_shubetsu07);
$race_shubetsu09 = str_replace('000', '', $race_shubetsu08);
if ($race_shubetsu09){
$race_shubetsu10 = $event_type_word10 . $race_shubetsu09 . $event_type_word11;
}else{
$race_shubetsu10 = '';
}
$new_race_shubetsu = $race_shubetsu10;


//レース状況 + 種別
$x_race_type01 = str_replace(' ', '_', $new_race_shubetsu);
$x_race_type = $new_race_type . $x_race_type01;





//混成 種目別 判定
$konsei_word = mb_convert_encoding('種', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$search_konsei = strpos($event_type01, $konsei_word);

if (!$search_konsei){//必要のない競技非表示
////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////種目 詳細//////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
$minus_word = mb_convert_encoding('－', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$plus_word = mb_convert_encoding('＋', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
if ($get_sex == $x_sex && $get_event == $x_event_type && $get_rt == $x_race_type) {
echo "\r\n" . '<a name="' .  $x_sex . $x_event_type . $x_race_type . '"></a>' . "\r\n";
echo "\r\n" . '<a href="' . $this_url . '" style="text-decoration:none;">' . "\r\n";
}else{
echo "\r\n" . '<a href="' . $this_url . "?sex=" . $x_sex . '&event=' . $x_event_type . '&rt=' . $x_race_type . '#' .  $x_sex . $x_event_type . $x_race_type . '" style="text-decoration:none;">' . "\r\n";
}
echo '<div style="width:100%;background-color:#6E6E6E;color:' . $x_sex_color . ';margin:5px 0;font-weight:bold;">' . "\r\n";
echo '<div style="display:inline-block;padding:10px;">' . "\r\n";
if ($get_sex == $x_sex && $get_event == $x_event_type && $get_rt == $x_race_type) {
echo $minus_word . "\r\n";
}else{
echo $plus_word . "\r\n";
}
echo '</div>' . "\r\n";
echo '<div style="display:inline-block;">' . "\r\n";
echo $x_sex . ' ' . $x_event_type . ' ' . $x_race_type . "\r\n";
echo '</div>' . "\r\n";
echo '</div>' . "\r\n";
echo '</a>' . "\r\n";



if ($get_sex == $x_sex && $get_event == $x_event_type && $get_rt == $x_race_type) {
echo '<table class="s-tbl2" width="100%" style="width:100%;">' . "\r\n";
////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////種目 詳細//////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////// 種目毎処理 ////////////////



//////////////// 組毎処理 ////////////////
$t_kumi_base = @file_get_contents($value0);
//記録表示（1/100・1/1000切替）の新仕様対応：1/100表示の記録 "Kiroku100" を従来の "Kiroku" として扱う
$t_kumi_base = str_replace('"Kiroku100":', '"Kiroku":', $t_kumi_base);

$heat_word01 = mb_convert_encoding('組', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$heat_word02 = mb_convert_encoding('招集', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$heat_word03 = mb_convert_encoding('確定', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');

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
/*
$sl01 = strstr($value_t_kumi0_shousai, '"Jyuni"');
$sl02 = strstr($sl01, '","', true);
$sl03 = str_replace('"Jyuni":"', '', $sl02);
if ($sl03){
$new_sl = '';
}else{
$new_sl = '<span style="color:#FACC2E;font-weight:bold;">' . $sl_word01 . '</span> ';
}
*/
$sl01 = strstr($value_t_kumi0_shousai, '"Status":"');
$sl02 = strstr($sl01, '","', true);
$search_sl = strpos($sl02, $heat_word03);
if ($search_sl){
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

//400m以下の種目（100m～400m・ハードル・4×100mR）で1分を超える記録は秒に換算（1.01.90 → 61.90）
if (preg_match('/^(100|110|200|300|400)m([a-z]{0,2}h)?$/i', $x_event_type) || preg_match('/^4\x{00D7}100mR$/iu', $x_event_type)){
if (preg_match('/^(\d+)\.(\d{2})\.(\d{2})$/', $record04, $record_sec)){
$new_record = ((int)$record_sec[1] * 60 + (int)$record_sec[2]) . '.' . $record_sec[3];
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
//echo "<p>" . $value0 . "</p>\r\n";
//////////////// 組毎処理 ////////////////


echo '</table>' . "\r\n";
}else{
echo '';
}


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
$x_event_type = $k_event_type03;
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
$minus_word = mb_convert_encoding('－', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
$plus_word = mb_convert_encoding('＋', 'UTF-8', 'EUC-JP,Shift-JIS,UTF-8');
if ($get_sex == $x_sex && $get_event == $x_event_type && $get_rt == $x_race_type) {
echo "\r\n" . '<a name="' .  $x_sex . $x_event_type . $x_race_type . '"></a>' . "\r\n";
echo "\r\n" . '<a href="' . $this_url . '" style="text-decoration:none;">' . "\r\n";
}else{
echo "\r\n" . '<a href="' . $this_url . "?sex=" . $x_sex . '&event=' . $x_event_type . '&rt=' . $x_race_type . '#' .  $x_sex . $x_event_type . $x_race_type . '" style="text-decoration:none;">' . "\r\n";
}
echo '<div style="width:100%;background-color:#6E6E6E;color:' . $x_sex_color . ';margin:5px 0;font-weight:bold;">' . "\r\n";
echo '<div style="display:inline-block;padding:10px;">' . "\r\n";
if ($get_sex == $x_sex && $get_event == $x_event_type && $get_rt == $x_race_type) {
echo $minus_word . "\r\n";
}else{
echo $plus_word . "\r\n";
}
echo '</div>' . "\r\n";
echo '<div style="display:inline-block;">' . "\r\n";
echo $x_sex . ' ' . $x_event_type . ' ' . $x_race_type . "\r\n";
echo '</div>' . "\r\n";
echo '</div>' . "\r\n";
echo '</a>' . "\r\n";


if ($get_sex == $x_sex && $get_event == $x_event_type && $get_rt == $x_race_type) {
echo '<table class="s-tbl2" width="100%" style="width:100%;">' . "\r\n";
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
$k_new_no = $k_no03 . $k_no_word01;
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
$k_name04 = str_replace('":"', '', $k_name03);
$k_search_name_br = strpos($k_name04, '<br>');
if ($k_search_name_br){
$k_name05 = strstr($k_name04, '<br>');
$k_name06 = str_replace('<br>', '', $k_name05);
}else{
$k_name06 = $k_name04;
}
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
echo $k_new_no . " " . $k_new_record . $k_new_field_wind . " " . $k_new_name . " " . $k_new_affiliation1 . $k_new_affiliation2 . ' (' . $k_name06 . ') ';
echo "\r\n</td>\r\n";
echo "</tr>\r\n";


}//foreach
//////////////// 順位毎処理 ////////////////


echo '</table>' . "\r\n";
}else{
echo '';
}


}//foreach
}else{//if
echo '';
}//if
///////////////////////////////////////////////
////////////////// 混成取得 ///////////////////
///////////////////////////////////////////////




?>
