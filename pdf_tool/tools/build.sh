#!/bin/sh
# 納品用ファイルを dist/ にまとめる
set -e
cd "$(dirname "$0")/.."
rm -rf dist && mkdir -p dist/pdf_js
cp web/pdf_startlist.php dist/
[ -f web/pdf_result.php ] && cp web/pdf_result.php dist/
for f in pdfcore.js startlist.js startlist_render.js result.js result_render.js pdf_page.js; do
  [ -f src/$f ] && cp src/$f dist/pdf_js/
done
# テスト用のトップページ（本番では tournament_result_top.php に snippet を追加）
{
  echo '<html><head><meta charset="UTF-8"><title>top test</title></head><body><table align="center" bgcolor="#333333">'
  cat web/top_snippet_utf8.html
  echo '</table></body></html>'
} > dist/top_test.html
ls -R dist
