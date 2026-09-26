#!/bin/sh
# タイムテーブルの読み取り結果を、保存しておいた結果と比べる（修正の確認用）
#   sh tools/tt_compare.sh <保存先フォルダ>
cd "$(dirname "$0")/.."
B="$1"
for f in ../lanp2/time-table.pdf "../lanp2/lanp2_2/タイムテーブル①.pdf" "../lanp2/lanp2_2/タイムテーブル②＿スタートリスト.pdf" \
         "../lanp2/lanp2_2/タイムテーブル③.pdf" "../lanp2/lanp2_9/2026小郡陸上プログラムVol.4.pdf" \
         "../lanp2/lanp2_2/スタートリスト②.pdf" "../lanp2/lanp2_2/スタートリスト③.pdf" \
         ../lanp2/lanp2_10/*.pdf; do
  n=$(basename "$f" .pdf)
  node tools/run_timetable.js "$f" 2>/dev/null | grep -v "^Warning\|^Require\|^- /\|^#" > "$B/new_$n.txt"
  if diff -q "$B/$n.txt" "$B/new_$n.txt" > /dev/null; then echo "SAME: $n"; else echo "DIFF: $n"; diff "$B/$n.txt" "$B/new_$n.txt" | head -12; fi
done
