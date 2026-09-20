#!/bin/sh
# サンプル PDF すべてで読み取り結果を確認する（修正後の確認用）
#   スタートリスト：件数を表示
#   結果：インターハイの PDF を Web（1.php）の出力と 1行ずつ比較
cd "$(dirname "$0")/.."
F='polyfill|Require stack|node_modules|tools/'
for f in ../lanp2/start-list.pdf ../lanp2/lanp2_2/スタートリスト①.pdf ../lanp2/lanp2_2/スタートリスト②.pdf \
         ../lanp2/lanp2_2/スタートリスト③.pdf "../lanp2/lanp2_2/タイムテーブル②＿スタートリスト.pdf" \
         "../lanp2/lanp2_5/2026個人選スタリ0917.pdf"; do
  node tools/run_startlist.js "$f" 2>&1 | grep -Ev "$F" | grep "^#\|^  !"
done
for f in ../lanp2/lanp2_1/結果①.pdf ../lanp2/lanp2_1/結果④.pdf ../lanp2/lanp2_4/大会結果TOP8.pdf; do
  node tools/run_result.js "$f" 2>&1 | grep -Ev "$F" | grep "^#\|^  !"
done
node tools/run_result.js ../lanp2/results.pdf out/ih_pdf.tsv > /dev/null 2>&1
WEB="${IH_WEB_JSON:-out/ih_web_rows.json}"
[ -f "$WEB" ] && python3 tools/compare_ih.py "$WEB" out/ih_pdf.tsv
