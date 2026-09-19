<?php
header("Content-type: charset=UTF-8");
//header("Content-type: charset=Shift-JIS");
//header("Content-type:text/html; charset=EUC-JP");


echo "<html>\r\n";
echo "<head>\r\n";
echo "<meta name='robots' content='noindex' />\r\n";
echo "<link rel='stylesheet' href='https://rikujou.jp/css/smart.css' type='text/css' />\r\n";
echo "</head>\r\n";
echo "<body>\r\n\r\n";


echo "<br />\r\n\r\n";

echo "<table align=\"center\" bgcolor=\"#333333\">\r\n\r\n";
echo "<tr><td align=\"center\" style=\"padding:10px 20px;\" bgcolor=\"#D7E7FF\">\r\n";

//////////////////////////////////////////////////////////////////
//////////////////////// 陸上競技モバイル ////////////////////////
//////////////////////////////////////////////////////////////////
echo "<h2 style='font-size:x-large;'>陸上競技モバイル</h2>\r\n";
echo "<table align=\"center\">\r\n";
echo "<tr>\r\n";
echo "<td align=\"center\" style=\"padding:0px 20px;\">\r\n";
echo "<div style='font-size:18px;font-weight:bold;'>【info-ch用 ソースコード】</div>\r\n";
echo "<form target='_blank' action='tournament_result2_sc.php' method='post'>\r\n";
echo "<input type='text' size='10' name='id' style='font-size:x-large;' placeholder=' ID' />\r\n";
echo "<input type='submit' style='font-size:x-large;' value='  GO!!  ' />\r\n";
echo "</form>\r\n";
echo "</td>\r\n";
echo "</tr>\r\n";
echo "<tr>\r\n";
echo "<td align=\"center\" style=\"padding:0px 20px;\">\r\n";
echo "<div style='font-size:18px;font-weight:bold;'>【info-ch用 ランキング付 ソースコード】</div>\r\n";
echo "<form target='_blank' action='tournament_result2_ranking_sc.php' method='post'>\r\n";
echo "<input type='text' size='10' name='id' style='font-size:x-large;' placeholder=' ID' />\r\n";
echo "<input type='submit' style='font-size:x-large;' value='  GO!!  ' />\r\n";
echo "</form>\r\n";
echo "</td>\r\n";
echo "</tr>\r\n";
echo "</table>\r\n";

/**************************************************
echo "<table align=\"center\">\r\n";
echo "<tr>\r\n";
echo "<td align=\"center\" style=\"padding:0px 20px;\">\r\n";
echo "<b>tournament_result</b><br />\r\n";
echo "<form target='_blank' action='tournament_result.php' method='post'>\r\n";
echo "<input type='text' size='10' name='id' style='font-size:x-large;' placeholder=' ID' />\r\n";
echo "<input type='submit' style='font-size:x-large;' value='  GO!!  ' />\r\n";
echo "</form>\r\n";
echo "</td>\r\n";
echo "<td align=\"center\" style=\"padding:0px 20px;\">\r\n";
echo "<b>tournament_result2</b><br />\r\n";
echo "<form target='_blank' action='tournament_result2.php' method='post'>\r\n";
echo "<input type='text' size='10' name='id' style='font-size:x-large;' placeholder=' ID' />\r\n";
echo "<input type='submit' style='font-size:x-large;' value='  GO!!  ' />\r\n";
echo "</form>\r\n";
echo "</td>\r\n";
echo "</tr>\r\n";
echo "<tr>\r\n";
echo "<td align=\"center\" style=\"padding:0px 20px;\">\r\n";
echo "<b>トップページ　大会一覧</b><br />\r\n";
echo "<form target='_blank' action='top_tournament_list.php' method='post'>\r\n";
echo "<input type='submit' style='font-size:x-large;' value='  GO!!  ' />\r\n";
echo "</form>\r\n";
echo "</td>\r\n";
echo "<td align=\"center\" style=\"padding:0px 20px;\">\r\n";
echo "<b>tournament_result2【ソースコード】</b><br />\r\n";
echo "<form target='_blank' action='tournament_result2_sc.php' method='post'>\r\n";
echo "<input type='text' size='10' name='id' style='font-size:x-large;' placeholder=' ID' />\r\n";
echo "<input type='submit' style='font-size:x-large;' value='  GO!!  ' />\r\n";
echo "</form>\r\n";
echo "</td>\r\n";
echo "</tr>\r\n";
echo "</table>\r\n";
**************************************************/
//////////////////////////////////////////////////////////////////
//////////////////////// 陸上競技モバイル ////////////////////////
//////////////////////////////////////////////////////////////////

echo "</td></tr>\r\n";
echo "<tr><td align=\"center\" style=\"padding:10px 20px;\" bgcolor=\"#F7F2E0\">\r\n";

//////////////////////////////////////////////////////////////////
///////////////////////// AthleteRanking /////////////////////////
//////////////////////////////////////////////////////////////////
echo "<h2 style='font-size:x-large;'>AthleteRanking（<a target='_blank' href='http://games.athleteranking.com'>PC</a>・<a target='_blank' href='http://games.athleteranking.com/i/'>モバイル</a>）</h2>\r\n";
echo "<table align=\"center\">\r\n<tr>\r\n";
echo "<td align=\"center\" style=\"padding:0px 20px;\">\r\n";
echo "<form target='_blank' action='athleteranking_pc.php' method='post'>\r\n";
echo "<input type='text' size='10' name='id' style='font-size:x-large;' placeholder=' ID' />\r\n";
echo "<input type='submit' style='font-size:x-large;' value='  GO!!  ' />\r\n";
echo "</form>\r\n";
echo "</td>\r\n";
echo "</tr>\r\n";

echo "<tr>\r\n";
echo "<td align=\"center\" style=\"padding:0px 20px;\">\r\n";
echo "<div style='font-size:18px;font-weight:bold;'>【info-ch用 ソースコード】</div>\r\n";
echo "<form target='_blank' action='athleteranking_pc_x-day.php' method='post'>\r\n";
echo "<input type='text' size='10' name='tid' style='font-size:x-large;' placeholder=' ID' />\r\n";
echo "<input type='submit' style='font-size:x-large;' value='  GO!!  ' />\r\n";
echo "</form>\r\n";
echo "</td>\r\n";
echo "</tr>\r\n";
echo "</table>\r\n";
//////////////////////////////////////////////////////////////////
///////////////////////// AthleteRanking /////////////////////////
//////////////////////////////////////////////////////////////////

echo "</td></tr>\r\n";
echo "\r\n<tr><td align=\"center\" style=\"padding:10px 20px;\" bgcolor=\"#E0E0F8\">\r\n";

//////////////////////////////////////////////////////////////////
/////////////////// インフォメーションセンター ///////////////////
//////////////////////////////////////////////////////////////////
echo "<h2 style='font-size:x-large;'>インフォメーションセンター</h2>\r\n";
echo "<form target='_blank' action='ic.php' method='post'>\r\n";
echo "<span  style=\"color:#800000;font-size:x-large;font-weight:bold;\">結果 </span>\r\n";
echo "<input type='text' size='36' name='url' style='font-size:x-large;' placeholder=' URL' />\r\n";
echo "<input type='submit' style='font-size:x-large;' value='  GO!!  ' />\r\n";
echo "</form>\r\n";

echo "<form target='_blank' action='ic_bangumi.php' method='post'>\r\n";
echo "<span  style=\"color:#008000;font-size:x-large;font-weight:bold;\">番組 </span>\r\n";
echo "<input type='text' size='36' name='url' style='font-size:x-large;' placeholder=' URL' />\r\n";
echo "<input type='submit' style='font-size:x-large;' value='  GO!!  ' />\r\n";
echo "</form>\r\n";

echo "<div style='font-size:18px;font-weight:bold;'>【info-ch用 ソースコード】</div>\r\n";
echo "<form target='_blank' action='ic_x-day.php' method='post'>\r\n";
echo "<input type='text' size='40' name='url' style='font-size:x-large;' placeholder=' URL' />\r\n";
echo "<input type='submit' style='font-size:x-large;' value='  GO!!  ' />\r\n";
echo "</form>\r\n";
//////////////////////////////////////////////////////////////////
/////////////////// インフォメーションセンター ///////////////////
//////////////////////////////////////////////////////////////////

echo "</td></tr>\r\n";
echo "\r\n<tr><td align=\"center\" style=\"padding:10px 20px;\" bgcolor=\"#FFFFFF\">\r\n";

//////////////////////////////////////////////////////////////////
/////////////////////////////// 123 //////////////////////////////
//////////////////////////////////////////////////////////////////
echo "<h2 style='font-size:x-large;'>123<br /></h2>\r\n";
echo "<form target='_blank' action='123_1.php' method='post'>\r\n";
echo "<input type='text' size='40' name='url' style='font-size:x-large;' placeholder=' URL' />\r\n";
echo "<input type='submit' style='font-size:x-large;' value='  GO!!  ' />\r\n";
echo "</form>\r\n";

echo "<div style='font-size:18px;font-weight:bold;'>【info-ch用 ソースコード】</div>\r\n";
echo "<form target='_blank' action='123_x-day.php' method='post'>\r\n";
echo "<input type='text' size='40' name='url' style='font-size:x-large;' placeholder=' URL' />\r\n";
echo "<input type='submit' style='font-size:x-large;' value='  GO!!  ' />\r\n";
echo "</form>\r\n";
//////////////////////////////////////////////////////////////////
/////////////////////////////// 123 //////////////////////////////
//////////////////////////////////////////////////////////////////

echo "</td></tr>\r\n";
echo "\r\n<tr><td align=\"center\" style=\"padding:10px 20px;\" bgcolor=\"#E3CEF6\">\r\n";

//////////////////////////////////////////////////////////////////
////////////////////////////// 1234 //////////////////////////////
//////////////////////////////////////////////////////////////////
echo "<h2 style='font-size:x-large;'>東京高体連（1234）</h2>\r\n";
echo "<form target='_blank' action='1234.php' method='post'>\r\n";
echo "<input type='text' size='40' name='url' style='font-size:x-large;' placeholder=' URL' />\r\n";
echo "<input type='submit' style='font-size:x-large;' value='  GO!!  ' />\r\n";
echo "</form>\r\n";

echo "<div style='font-size:18px;font-weight:bold;'>【info-ch用 ソースコード】</div>\r\n";
echo "<form target='_blank' action='1234_x-day.php' method='post'>\r\n";
echo "<input type='text' size='40' name='url' style='font-size:x-large;' placeholder=' URL' />\r\n";
echo "<input type='submit' style='font-size:x-large;' value='  GO!!  ' />\r\n";
echo "</form>\r\n";
//////////////////////////////////////////////////////////////////
////////////////////////////// 1234 //////////////////////////////
//////////////////////////////////////////////////////////////////

echo "</td></tr>\r\n";
echo "\r\n<tr><td align=\"center\" style=\"padding:10px 20px;\" bgcolor=\"#81BEF7\">\r\n";

//////////////////////////////////////////////////////////////////
////////////////////////////// NISHI /////////////////////////////
//////////////////////////////////////////////////////////////////
echo "<h2 style='font-size:x-large;'>NISHI</h2>\r\n";
echo "<form target='_blank' action='nishi.php' method='post'>\r\n";
echo "<input type='text' size='40' name='url' style='font-size:x-large;' placeholder=' URL' />\r\n";
echo "<input type='submit' style='font-size:x-large;' value='  GO!!  ' />\r\n";
echo "</form>\r\n";

echo "<div style='font-size:18px;font-weight:bold;'>【info-ch用 ソースコード】</div>\r\n";
echo "<form target='_blank' action='nishi_x-day.php' method='post'>\r\n";
echo "<input type='text' size='40' name='url' style='font-size:x-large;' placeholder=' URL' />\r\n";
echo "<input type='submit' style='font-size:x-large;' value='  GO!!  ' />\r\n";
echo "</form>\r\n";
//////////////////////////////////////////////////////////////////
////////////////////////////// NISHI /////////////////////////////
//////////////////////////////////////////////////////////////////

echo "</td></tr>\r\n";
echo "\r\n<tr><td align=\"center\" style=\"padding:10px 20px;\" bgcolor=\"#F6E3CE\">\r\n";

//////////////////////////////////////////////////////////////////
////////////////////////////// PDF ///////////////////////////////
//////////////////////////////////////////////////////////////////
// PDF をブラウザの中で読み取ります（サーバには送信しません）
//   【結果】        → pdf_result.php（1.php と同じ一覧表）
//   【スタートリスト】→ pdf_startlist.php（info-ch 用の HTML）
echo "<h2 style='font-size:x-large;'>PDF（結果・スタートリスト）</h2>\r\n";
echo "<div style='font-size:18px;font-weight:bold;'>【結果】</div>\r\n";
echo "<form onsubmit=\"return pdfToolGo(this, 'pdf_result.php', 'result');\">\r\n";
echo "<input type='file' name='pdf' accept='application/pdf,.pdf' style='font-size:large;' />\r\n";
echo "<input type='submit' style='font-size:x-large;' value='  GO!!  ' />\r\n";
echo "</form>\r\n";

echo "<div style='font-size:18px;font-weight:bold;'>【スタートリスト　info-ch用 ソースコード】</div>\r\n";
echo "<form onsubmit=\"return pdfToolGo(this, 'pdf_startlist.php', 'startlist');\">\r\n";
echo "<input type='file' name='pdf' accept='application/pdf,.pdf' style='font-size:large;' />\r\n";
echo "<input type='submit' style='font-size:x-large;' value='  GO!!  ' />\r\n";
echo "</form>\r\n";

// 選んだ PDF を、新しいタブの画面に直接渡す
echo '<script>' . "\r\n";
echo 'function pdfToolGo(form, page, mode) {' . "\r\n";
echo '    var f = form.pdf.files && form.pdf.files[0];' . "\r\n";
echo '    if (!f) { alert("PDFファイルを選択してください"); return false; }' . "\r\n";
echo '    window.__pdfToolFile = f;' . "\r\n";
echo '    window.__pdfToolMode = mode;' . "\r\n";
echo '    window.open(page, "_blank");' . "\r\n";
echo '    return false;' . "\r\n";
echo '}' . "\r\n";
echo '</script>' . "\r\n";
//////////////////////////////////////////////////////////////////
////////////////////////////// PDF ///////////////////////////////
//////////////////////////////////////////////////////////////////

echo "</td></tr>\r\n";
echo "\r\n<tr><td align=\"center\" style=\"padding:10px 20px;\" bgcolor=\"#E6E6E6\">\r\n";

//////////////////////////////////////////////////////////////////
/////////////////////////// 福岡・宮崎 ///////////////////////////
//////////////////////////////////////////////////////////////////
echo "<h2 style='font-size:x-large;'>福岡陸恊（<a target='_blank' href='http://www.fukuriku.com'>PC</a>・<a target='_blank' href='http://frk.jpn.org/mobile/'>モバイル</a>）・宮崎陸恊（<a target='_blank' href='http://www.miyariku.org'>PC</a>・<a target='_blank' href='http://www.miyariku.org/keitai/'>モバイル</a>）</h2>\r\n";
echo "<form target='_blank' action='fm.php' method='post'>\r\n";
echo "<input type='text' size='40' name='url' style='font-size:x-large;' placeholder=' URL' />\r\n";
echo "<input type='submit' style='font-size:x-large;' value='  GO!!  ' />\r\n";
echo "</form>\r\n";

echo "<div style='font-size:18px;font-weight:bold;'>【info-ch用 ソースコード】</div>\r\n";
echo "<form target='_blank' action='fm_x-day.php' method='post'>\r\n";
echo "<input type='text' size='40' name='url' style='font-size:x-large;' placeholder=' URL' />\r\n";
echo "<input type='submit' style='font-size:x-large;' value='  GO!!  ' />\r\n";
echo "</form>\r\n";
//////////////////////////////////////////////////////////////////
/////////////////////////// 福岡・宮崎 ///////////////////////////
//////////////////////////////////////////////////////////////////

echo "</td></tr>\r\n";
echo "\r\n<tr><td align=\"center\" style=\"padding:10px 20px;\" bgcolor=\"#E8A399\">\r\n";

//////////////////////////////////////////////////////////////////
//////////////////////////// 静岡陸恊 ////////////////////////////
//////////////////////////////////////////////////////////////////
echo "<h2 style='font-size:x-large;'>静岡陸恊（<a target='_blank' href='http://shizuoka-jaaf.com/srksoku.html'>PC</a>）</h2>\r\n";
echo "<form target='_blank' action='shizuoka.php' method='get'>\r\n";
echo "<input type='text' size='40' name='url' style='font-size:x-large;' placeholder=' URL' />\r\n";
echo "<input type='submit' style='font-size:x-large;' value='  GO!!  ' />\r\n";
echo "</form>\r\n";
/*
echo "<form target='_blank' action='shizuoka_sokuhou.php' method='post'>\r\n";
echo "<span  style=\"color:#DF0101;font-size:x-large;font-weight:bold;\">速報 </span><input type='text' size='36' name='url' style='font-size:x-large;' placeholder=' URL' />\r\n";
echo "<input type='submit' style='font-size:x-large;' value='  GO!!  ' />\r\n";
echo "</form>\r\n";
*/

echo "<div style='font-size:18px;font-weight:bold;'>【info-ch用 ソースコード】</div>\r\n";
echo "<form target='_blank' action='shizuoka_x-day.php' method='get'>\r\n";
echo "<input type='text' size='40' name='url' style='font-size:x-large;' placeholder=' URL' />\r\n";
echo "<input type='submit' style='font-size:x-large;' value='  GO!!  ' />\r\n";
echo "</form>\r\n";
//////////////////////////////////////////////////////////////////
//////////////////////////// 静岡陸恊 ////////////////////////////
//////////////////////////////////////////////////////////////////

echo "</td></tr>\r\n";
echo "\r\n<tr><td align=\"center\" style=\"padding:10px 20px;color:#F2F2F2;\" bgcolor=\"#B40404\">\r\n";

//////////////////////////////////////////////////////////////////
////////////////////////// 日本陸連 JAAF /////////////////////////
//////////////////////////////////////////////////////////////////
echo "<h2 style='font-size:x-large;'>日本陸連 JAAF（<a target='_blank' style='color:#F2F2F2;' href='https://www.jaaf.or.jp'>PC</a>）</h2>\r\n";
echo "<form target='_blank' action='' method='post'>\r\n";
echo "<input type='text' size='40' name='url' style='font-size:x-large;' placeholder=' URL※未完成※作成中※' />\r\n";
echo "<input type='submit' style='font-size:x-large;' value='  GO!!  ' />\r\n";
echo "</form>\r\n";

echo "<div style='font-size:18px;font-weight:bold;'>【info-ch用 ソースコード】</div>\r\n";
echo "<form target='_blank' action='' method='post'>\r\n";
echo "<input type='text' size='40' name='url' style='font-size:x-large;' placeholder=' URL※未完成※作成中※' />\r\n";
echo "<input type='submit' style='font-size:x-large;' value='  GO!!  ' />\r\n";
echo "</form>\r\n";
//////////////////////////////////////////////////////////////////
////////////////////////// 日本陸連 JAAF /////////////////////////
//////////////////////////////////////////////////////////////////

echo "</td></tr>\r\n";
echo "\r\n<tr><td align=\"center\" style=\"padding:10px 20px;color:#F2F2F2;\" bgcolor=\"#FA5858\">\r\n";

//////////////////////////////////////////////////////////////////
////////////////////////// 世界陸連 IAAF /////////////////////////
//////////////////////////////////////////////////////////////////
echo "<h2 style='font-size:x-large;'>世界陸連 IAAF（<a target='_blank' style='color:#585858;' href='https://www.iaaf.org'>PC</a>）</h2>\r\n";
echo "<h2 style='font-size:x-large;'>世界陸上（<a target='_blank' style='color:#585858;' href='https://www.iaaf.org/competitions/iaaf-world-championships'>PC</a>）・ダイヤモンドリーグ（<a target='_blank' style='color:#585858;' href='https://www.iaaf.org/competitions/iaaf-diamond-league'>PC</a>）</h2>\r\n";
echo "<form target='_blank' action='iaaf.php' method='post'>\r\n";
echo "<input type='text' size='40' name='url' style='font-size:x-large;' placeholder=' URL' />\r\n";
echo "<input type='submit' style='font-size:x-large;' value='  GO!!  ' />\r\n";
echo "</form>\r\n";
//////////////////////////////////////////////////////////////////
////////////////////////// 世界陸連 IAAF /////////////////////////
//////////////////////////////////////////////////////////////////

echo "</td></tr>\r\n";
echo "\r\n<tr name=\"rikuranall\" id=\"rikuranall\"><td name=\"rikuranevent\" id=\"rikuranevent\" align=\"center\" style=\"padding:10px 20px;color:#B40404;\" bgcolor=\"#F2F2F2\">\r\n";

//////////////////////////////////////////////////////////////////
///////////////////////// 陸上競技RANKING ////////////////////////
//////////////////////////////////////////////////////////////////
echo "<h2 style='font-size:x-large;'>陸上競技RANKING（<a target='_blank' href='https://rikumaga.com/'>PC</a>）</h2>\r\n";
echo "<table align=\"center\"><tr>\r\n\r\n";
echo "<td align=\"center\" valign=\"top\" style=\"padding:0px 10px;\">\r\n";
echo "<div style=\"font-size:x-large;color:#2E2E2E;font-weight:bold;\">全種目一括<br />100位まで（&rr=100）</div>";
echo "<form enctype='multipart/form-data'  action='#rikuranall' method='POST'>";
echo "<input type='hidden' name='seikouall' value='100'>";
echo "<input type='file' name='upload' style='font-size:18px;padding:10px;'>";
echo "<br />";
echo "<input type='submit' style='font-size:18px;padding:10px;' value='  ファイル送信  ' />";
echo "</form>";
// ファイルの保存先
$uploadfile = 'rikuranranking-data-all.php';
// アップロードされたファイルに、パスとファイル名を設定して保存
move_uploaded_file($_FILES['upload']['tmp_name'], $uploadfile);
 // 完了メッセージを表示
if ($_POST['seikouall']){
echo "<form target='_blank' action='rikuranranking-all.php' method='post'>\r\n";
echo "<input type='hidden' name='url' value='http://nextentertainmen.sakura.ne.jp/test/rikuranranking-data-all.php'>";
echo "<span style='font-size:x-large;color:#B40404;'>　<b>↓</b>　アップロード完了！　<b>↓</b>　</span><br />";
echo "<input type='submit' style='font-size:x-large;' value='  GO!!  ' />\r\n";
echo "</form>\r\n";
}else{
echo "";
}

echo "<td align=\"center\" valign=\"top\" style=\"padding:0px 10px;\">\r\n";
echo "<div style=\"font-size:x-large;color:#084B8A;font-weight:bold;\">各種目毎<br />1000位まで</div>";
echo "<form enctype='multipart/form-data' action='#rikuranevent' method='POST'>";
echo "<input type='hidden' name='seikouevent' value='100'>";
echo "<input type='file' name='upload2' style='font-size:18px;padding:10px;'>";
echo "<br />";
echo "<input type='submit' style='font-size:18px;padding:10px;' value='  ファイル送信  ' />";
echo "</form>";
// ファイルの保存先
$uploadfile2 = 'rikuranranking-data-event.php';
// アップロードされたファイルに、パスとファイル名を設定して保存
move_uploaded_file($_FILES['upload2']['tmp_name'], $uploadfile2);
 // 完了メッセージを表示
if ($_POST['seikouevent']){
echo "<form target='_blank' action='rikuranranking-event.php' method='post'>\r\n";
echo "<input type='hidden' name='url' value='http://nextentertainmen.sakura.ne.jp/test/rikuranranking-data-event.php'>";
echo "<span style='font-size:x-large;color:#B40404;'>　<b>↓</b>　アップロード完了！　<b>↓</b>　</span><br />";
echo "<input type='submit' style='font-size:x-large;' value='  GO!!  ' />\r\n";
echo "</form>\r\n";
}else{
echo "";
}
echo "</td>\r\n";
echo "</tr></table>\r\n";
//////////////////////////////////////////////////////////////////
///////////////////////// 陸上競技RANKING ////////////////////////
//////////////////////////////////////////////////////////////////

echo "</td></tr>\r\n";
echo "\r\n<tr><td align=\"center\" style=\"padding:10px 20px;\" bgcolor=\"#F7F6EB\">\r\n";

//////////////////////////////////////////////////////////////////
///////////////////////////// ニート /////////////////////////////
//////////////////////////////////////////////////////////////////
echo "<h2 style='font-size:x-large;'>ニート（<a target='_blank' href='https://blog.neet-shikakugets.com'>PC</a>）<img src='img/ni-to.jpg'  width='' height='40' style='vertical-align:middle;' /></h2>\r\n";
echo "<form target='_blank' action='ni-to.php' method='post'>\r\n";
echo "<input type='text' size='40' name='url' style='font-size:x-large;' placeholder=' URL' />\r\n";
echo "<input type='submit' style='font-size:x-large;' value='  GO!!  ' />\r\n";
echo "</form>\r\n";
//////////////////////////////////////////////////////////////////
///////////////////////////// ニート /////////////////////////////
//////////////////////////////////////////////////////////////////

echo "</td></tr>\r\n";
echo "\r\n</table>\r\n";

echo "<br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br />\r\n\r\n";

echo "\r\n\r\n\r\n\r\n</body>\r\n";
echo "</html>";

?>