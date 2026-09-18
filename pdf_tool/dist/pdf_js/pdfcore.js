/*
 * pdfcore.js  PDF の文字を「位置つきの単語・行」に変換する共通処理
 *
 *   ブラウザ : <script src="pdfcore.js"> で PdfCore として使用
 *   Node     : require('./pdfcore.js')（動作確認用）
 *
 *   pdf.js の getTextContent() は、PDF の作り方によって
 *   ・1文字ずつ／単語ごと／行ごとなど、まとまり方がばらばら
 *   ・同じ文字が重ねて描かれている（太字表現・InDesign の書き出しなど）
 *   ・ページの外（印刷範囲外）に見えない文字が残っている
 *   といった違いがあるため、いったん 1文字ずつに分解し、重複を除いてから
 *   位置をもとに単語・行へまとめ直します。
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.PdfCore = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // ---------------------------------------------------------------
    // 文字の種類
    // ---------------------------------------------------------------
    function isHalfWidth(ch) {
        var c = ch.charCodeAt(0);
        return (c >= 0x20 && c <= 0x7E) || (c >= 0xFF61 && c <= 0xFF9F);
    }

    // 半角カナ → 全角カナ（濁点・半濁点も合成）
    var HANKANA = 'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ｡｢｣､･';
    var ZENKANA = 'ヲァィゥェォャュョッーアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン。「」、・';
    var DAKU = { 'カ': 'ガ', 'キ': 'ギ', 'ク': 'グ', 'ケ': 'ゲ', 'コ': 'ゴ', 'サ': 'ザ', 'シ': 'ジ', 'ス': 'ズ', 'セ': 'ゼ', 'ソ': 'ゾ',
        'タ': 'ダ', 'チ': 'ヂ', 'ツ': 'ヅ', 'テ': 'デ', 'ト': 'ド', 'ハ': 'バ', 'ヒ': 'ビ', 'フ': 'ブ', 'ヘ': 'ベ', 'ホ': 'ボ', 'ウ': 'ヴ' };
    var HANDAKU = { 'ハ': 'パ', 'ヒ': 'ピ', 'フ': 'プ', 'ヘ': 'ペ', 'ホ': 'ポ' };

    function hanToZenKana(s) {
        var out = '';
        for (var i = 0; i < s.length; i++) {
            var ch = s.charAt(i);
            var k = HANKANA.indexOf(ch);
            if (k < 0) {
                if (ch === 'ﾞ' && out) {
                    var last = out.charAt(out.length - 1);
                    if (DAKU[last]) { out = out.slice(0, -1) + DAKU[last]; continue; }
                    out += '゛'; continue;
                }
                if (ch === 'ﾟ' && out) {
                    var last2 = out.charAt(out.length - 1);
                    if (HANDAKU[last2]) { out = out.slice(0, -1) + HANDAKU[last2]; continue; }
                    out += '゜'; continue;
                }
                out += ch;
                continue;
            }
            out += ZENKANA.charAt(k);
        }
        return out;
    }

    // 全角英数字・記号 → 半角（「﨑」などの漢字は変えない）
    function zenToHanAscii(s) {
        return s.replace(/[！-～]/g, function (ch) {
            return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
        }).replace(/　/g, ' ');
    }

    // 表示用の正規化：全角英数 → 半角、半角カナ → 全角、空白の整理
    function normText(s) {
        return hanToZenKana(zenToHanAscii(s)).replace(/\s+/g, ' ').trim();
    }

    // 空白をすべて除く（「佐   賀」→「佐賀」）
    function squash(s) {
        return s.replace(/[\s　]+/g, '');
    }

    // ---------------------------------------------------------------
    // 都道府県
    // ---------------------------------------------------------------
    var PREFS = ('北海道 青森 岩手 宮城 秋田 山形 福島 茨城 栃木 群馬 埼玉 千葉 東京 神奈川 新潟 富山 石川 福井 山梨 長野 ' +
        '岐阜 静岡 愛知 三重 滋賀 京都 大阪 兵庫 奈良 和歌山 鳥取 島根 岡山 広島 山口 徳島 香川 愛媛 高知 ' +
        '福岡 佐賀 長崎 熊本 大分 宮崎 鹿児島 沖縄').split(' ');
    var PREF_SET = {};
    PREFS.forEach(function (p) { PREF_SET[p] = true; });

    function isPref(s) {
        s = squash(s);
        if (PREF_SET[s]) return true;
        return !!PREF_SET[s.replace(/[都道府県]$/, '')];
    }

    // 都道府県名の表記をそろえる（「京都府」→「京都」、「京都」はそのまま）
    function prefName(s) {
        s = squash(s);
        if (PREF_SET[s]) return s;
        var t = s.replace(/[都道府県]$/, '');
        return PREF_SET[t] ? t : s;
    }

    // ---------------------------------------------------------------
    // PDF → ページごとの単語・行
    // ---------------------------------------------------------------

    // 1つのテキスト片を 1文字ずつに分解（全角=1、半角=0.5 の比率で位置を割り振る）
    function explode(str, x, y, w, fs, out) {
        var n = str.length;
        if (!n) return;
        var units = 0, i;
        for (i = 0; i < n; i++) units += isHalfWidth(str.charAt(i)) ? 0.5 : 1;
        if (units <= 0) return;
        var unitW = w > 0 ? w / units : fs;
        var cx = x;
        for (i = 0; i < n; i++) {
            var ch = str.charAt(i);
            var cw = (isHalfWidth(ch) ? 0.5 : 1) * unitW;
            out.push({ c: ch, x: cx, w: cw, y: y, fs: fs });
            cx += cw;
        }
    }

    // 同じ位置に重ねて描かれた同じ文字を 1つにする
    function dedupeChars(chars) {
        chars.sort(function (a, b) { return a.y - b.y || a.x - b.x; });
        var out = [];
        var recent = [];            // 近い y の文字だけを保持して比較
        for (var i = 0; i < chars.length; i++) {
            var ch = chars[i];
            recent = recent.filter(function (r) { return ch.y - r.y <= r.fs * 0.3 + 0.5; });
            var dup = false;
            for (var j = 0; j < recent.length; j++) {
                var r = recent[j];
                if (r.c === ch.c && Math.abs(r.x - ch.x) < Math.max(r.w, ch.w) * 0.45 &&
                    Math.abs(r.y - ch.y) <= Math.max(r.fs, ch.fs) * 0.3 + 0.5) {
                    dup = true;
                    break;
                }
            }
            if (!dup) {
                out.push(ch);
                recent.push(ch);
            }
        }
        return out;
    }

    // 文字 → 行（y が近いもの）
    function groupLines(elems, getFs) {
        var sorted = elems.slice().sort(function (a, b) { return a.y - b.y || a.x - b.x; });
        var lines = [];
        sorted.forEach(function (e) {
            var fs = getFs(e);
            var line = null;
            for (var k = lines.length - 1; k >= 0 && k >= lines.length - 4; k--) {
                var L = lines[k];
                if (Math.abs(L.y - e.y) <= Math.min(Math.max(L.fs, fs) * 0.3, 3)) { line = L; break; }
            }
            if (!line) {
                line = { y: e.y, fs: fs, items: [] };
                lines.push(line);
            }
            line.items.push(e);
            if (fs > line.fs) line.fs = fs;
        });
        lines.forEach(function (L) {
            L.items.sort(function (a, b) { return a.x - b.x; });
            // 行の y は項目の中央値
            var ys = L.items.map(function (e) { return e.y; }).sort(function (a, b) { return a - b; });
            L.y = ys[Math.floor(ys.length / 2)];
        });
        lines.sort(function (a, b) { return a.y - b.y; });
        return lines;
    }

    // 行の中の文字 → 単語（空白・大きな隙間で区切る）
    function charsToWords(chars) {
        var lines = groupLines(chars, function (c) { return c.fs; });
        var words = [];
        lines.forEach(function (L) {
            var cur = null;
            L.items.forEach(function (ch) {
                var isSpace = /\s|　/.test(ch.c);
                if (isSpace) { cur = null; return; }
                var gapLimit = Math.max(ch.fs, cur ? cur.fs : 0) * 0.3;
                if (cur && ch.x - cur.x2 <= gapLimit && ch.x - cur.x2 > -Math.max(ch.w, 1) * 0.6) {
                    cur.t += ch.c;
                    cur.x2 = Math.max(cur.x2, ch.x + ch.w);
                    if (ch.fs > cur.fs) cur.fs = ch.fs;
                } else {
                    cur = { t: ch.c, x: ch.x, x2: ch.x + ch.w, y: ch.y, fs: ch.fs };
                    words.push(cur);
                }
            });
        });
        return words;
    }

    // 単語 → 行（表示用のテキストつき）
    function wordsToLines(words) {
        var lines = groupLines(words, function (w) { return w.fs; });
        lines.forEach(function (L) {
            L.words = L.items;
            delete L.items;
            L.text = L.words.map(function (w) { return w.t; }).join(' ');
            L.x = L.words.length ? L.words[0].x : 0;
            L.x2 = L.words.length ? L.words[L.words.length - 1].x2 : 0;
        });
        return lines;
    }

    /**
     * PDF を読み込み、ページごとに単語・行を返す
     *   pdfjsLib : pdf.js（ブラウザでは window.pdfjsLib）
     *   data     : Uint8Array
     *   opts     : { cMapUrl, onProgress(done, total), countOps: true }
     */
    function loadPages(pdfjsLib, data, opts) {
        opts = opts || {};
        var params = { data: data, cMapPacked: true, verbosity: 0 };
        if (opts.cMapUrl) params.cMapUrl = opts.cMapUrl;
        if (opts.standardFontDataUrl) params.standardFontDataUrl = opts.standardFontDataUrl;
        return pdfjsLib.getDocument(params).promise.then(function (doc) {
            var pages = [];
            var n = doc.numPages;
            var chain = Promise.resolve();
            for (var p = 1; p <= n; p++) {
                (function (pno) {
                    chain = chain.then(function () {
                        return readPage(pdfjsLib, doc, pno, opts).then(function (pg) {
                            pages.push(pg);
                            if (opts.onProgress) opts.onProgress(pno, n);
                        });
                    });
                }(p));
            }
            return chain.then(function () {
                if (doc.destroy) doc.destroy();
                return pages;
            });
        });
    }

    function readPage(pdfjsLib, doc, pno, opts) {
        return doc.getPage(pno).then(function (page) {
            var vp = page.getViewport({ scale: 1 });
            return page.getTextContent().then(function (tc) {
                var raw = [];
                var hidden = 0;
                var dirCount = { 0: 0, 90: 0, 180: 0, 270: 0 };
                tc.items.forEach(function (it) {
                    if (!it.str) return;
                    var t = pdfjsLib.Util.transform(vp.transform, it.transform);
                    var fs = Math.hypot(t[2], t[3]) || Math.hypot(t[0], t[1]) || 8;
                    var x = t[4], y = t[5];
                    var w = it.width * (vp.scale || 1);
                    if (!(w > 0)) w = fs * it.str.length;
                    // 文字の向き（横書き=0、90度回転したページなど）
                    var ang = Math.round(Math.atan2(t[1], t[0]) * 180 / Math.PI / 90) * 90;
                    ang = ((ang % 360) + 360) % 360;
                    // ページの外にある文字は印刷されない（見えない）ので除く
                    // （文字の中央で判定する。回転していても中心はほぼ同じ位置）
                    var rad = ang * Math.PI / 180;
                    var cx = x + Math.cos(rad) * w / 2 + Math.sin(rad) * fs * 0.4;
                    var cy = y + Math.sin(rad) * w / 2 - Math.cos(rad) * fs * 0.4;
                    if (cy < 0 || cy > vp.height || cx < 0 || cx > vp.width) {
                        if (/\S/.test(it.str)) hidden++;
                        return;
                    }
                    if (/\S/.test(it.str)) dirCount[ang] += it.str.length;
                    raw.push({ str: it.str, x: x, y: y, w: w, fs: fs });
                });
                // 横向きに置かれた表（ページが 90度回転しているもの）は、向きを戻してから読む
                var dom = 0;
                [90, 180, 270].forEach(function (a) { if (dirCount[a] > dirCount[dom]) dom = a; });
                var pw = vp.width, ph = vp.height;
                if (dom) {
                    var th = -dom * Math.PI / 180;
                    var c = Math.cos(th), sn = Math.sin(th);
                    var rot = function (px, py) { return [px * c - py * sn, px * sn + py * c]; };
                    var corners = [rot(0, 0), rot(vp.width, 0), rot(0, vp.height), rot(vp.width, vp.height)];
                    var minX = Math.min.apply(null, corners.map(function (p) { return p[0]; }));
                    var minY = Math.min.apply(null, corners.map(function (p) { return p[1]; }));
                    pw = Math.max.apply(null, corners.map(function (p) { return p[0]; })) - minX;
                    ph = Math.max.apply(null, corners.map(function (p) { return p[1]; })) - minY;
                    raw.forEach(function (r) {
                        var q = rot(r.x, r.y);
                        r.x = q[0] - minX;
                        r.y = q[1] - minY;
                    });
                }
                var chars = [];
                raw.forEach(function (r) { explode(r.str, r.x, r.y, r.w, r.fs, chars); });
                chars = dedupeChars(chars.filter(function (c) { return true; }));
                var words = charsToWords(chars);
                var lines = wordsToLines(words);
                var pg = {
                    num: pno,
                    width: pw,
                    height: ph,
                    rotated: dom,
                    words: words,
                    lines: lines,
                    textChars: chars.filter(function (c) { return /\S/.test(c.c); }).length,
                    hiddenItems: hidden,
                    pathOps: 0,
                    imageOps: 0
                };
                if (opts.countOps === false || pg.textChars > 40) {
                    page.cleanup();
                    return pg;
                }
                // 文字がほとんどないページは、図形・画像になっていないかを調べる
                return page.getOperatorList().then(function (ol) {
                    var OPS = pdfjsLib.OPS;
                    var fnArray = ol.fnArray;
                    for (var i = 0; i < fnArray.length; i++) {
                        var f = fnArray[i];
                        if (f === OPS.constructPath || f === OPS.fill || f === OPS.eoFill) pg.pathOps++;
                        else if (f === OPS.paintImageXObject || f === OPS.paintInlineImageXObject ||
                                 f === OPS.paintImageMaskXObject || f === OPS.paintJpegXObject) pg.imageOps++;
                    }
                    page.cleanup();
                    return pg;
                }, function () { return pg; });
            });
        });
    }

    // ---------------------------------------------------------------
    // 表の 1人分（1チーム分）の範囲を決める
    //   anchorsY : 各行の基準となる y（レーン・ナンバーなどの行）
    //   words    : 振り分ける単語
    //   1人分は「フリガナ行＋氏名行」「氏名行＋ローマ字行＋資格記録行」など複数行に
    //   なるため、基準行からの位置のずれを周期として調べ、いちばん大きな空白の位置で区切る
    // ---------------------------------------------------------------
    function median(arr) {
        if (!arr.length) return null;
        var s = arr.slice().sort(function (a, b) { return a - b; });
        return s[Math.floor(s.length / 2)];
    }

    function assignBands(anchorsY, words, pitchHint) {
        var ys = anchorsY.slice().sort(function (a, b) { return a - b; });
        var diffs = [];
        for (var i = 1; i < ys.length; i++) diffs.push(ys[i] - ys[i - 1]);
        var pitch = median(diffs) || pitchHint || 18;
        var phases = [0];
        words.forEach(function (w) {
            var best = null;
            ys.forEach(function (y) { if (best === null || Math.abs(w.y - y) < Math.abs(w.y - best)) best = y; });
            var d = w.y - best;
            if (Math.abs(d) >= pitch) return;
            phases.push(((d % pitch) + pitch) % pitch);
        });
        phases.sort(function (a, b) { return a - b; });
        var bestGap = -1, boundary = pitch / 2;
        for (var k = 0; k < phases.length; k++) {
            var cur = phases[k], nxt = k + 1 < phases.length ? phases[k + 1] : phases[0] + pitch;
            if (nxt - cur > bestGap) { bestGap = nxt - cur; boundary = (cur + nxt) / 2; }
        }
        if (boundary >= pitch) boundary -= pitch;
        if (boundary <= 0) boundary += pitch;
        var bands = anchorsY.map(function (y) {
            var idx = ys.indexOf(y);
            var lo = idx > 0 ? ys[idx - 1] + boundary : y + boundary - pitch;
            return { y: y, lo: lo, hi: y + boundary, words: [] };
        });
        words.forEach(function (w) {
            for (var r = 0; r < bands.length; r++) {
                if (w.y >= bands[r].lo && w.y < bands[r].hi) { bands[r].words.push(w); return; }
            }
        });
        return { bands: bands, pitch: pitch };
    }

    /**
     * 1ページの複数の表をまとめて、1人分の範囲を決める
     *   blocks : [{ anchorsY: [...], words: [...], topY, bottomY }]
     *     topY    = 表の見出しの下端（ここから最初の行の間の文字は 1行目のもの）
     *     bottomY = 表の終わり（最後の行より下の文字は最後の行のもの）
     *   手がかり
     *     ・見出しと 1行目の間にある文字 → 1行目の「上側」に書かれる項目（フリガナなど）
     *     ・最後の行より下にある文字     → 各行の「下側」に書かれる項目（ローマ字・資格記録など）
     *   この 2つから「前の行の下側／次の行の上側」の区切りの位置を決め、ページ内の表で共通に使う
     *   prior : 前のページで決めた区切り（行の間隔に対する割合）
     * 戻り値 : { bands: [[band...] per block], ratio }
     */
    function assignBandsPage(blocks, prior) {
        var allDiffs = [];
        blocks.forEach(function (bk) {
            bk.ys = bk.anchorsY.slice().sort(function (a, b) { return a - b; });
            for (var i = 1; i < bk.ys.length; i++) allDiffs.push(bk.ys[i] - bk.ys[i - 1]);
        });
        var pagePitch = median(allDiffs) || 18;
        var lower = -Infinity, upper = Infinity;     // 区切り（前の行からの距離 / 行間隔）の範囲
        var phases = [0, 1];
        blocks.forEach(function (bk) {
            if (!bk.ys.length) return;
            var d = [];
            for (var i = 1; i < bk.ys.length; i++) d.push(bk.ys[i] - bk.ys[i - 1]);
            var pitch = bk.pitch = median(d) || pagePitch;
            var a0 = bk.ys[0], an = bk.ys[bk.ys.length - 1];
            bk.words.forEach(function (w) {
                if (w.y < a0 - 0.5) {
                    if (bk.topY === undefined || w.y > bk.topY) {
                        var r = (w.y - (a0 - pitch)) / pitch;
                        if (r > 0.02 && r < 1) { upper = Math.min(upper, r); phases.push(r); }
                    }
                } else if (w.y > an + 0.5) {
                    if (bk.bottomY === undefined || w.y < bk.bottomY) {
                        var r2 = (w.y - an) / pitch;
                        if (r2 > 0 && r2 < 0.98) { lower = Math.max(lower, r2); phases.push(r2); }
                    }
                } else {
                    // 行と行の間：前の行からの距離
                    var prev = null;
                    for (var k = 0; k < bk.ys.length; k++) if (bk.ys[k] <= w.y + 0.5) prev = bk.ys[k];
                    var idx = bk.ys.indexOf(prev);
                    var gap = idx + 1 < bk.ys.length ? bk.ys[idx + 1] - prev : pitch;
                    var r3 = (w.y - prev) / gap;
                    if (r3 > 0.02 && r3 < 0.98) phases.push(r3);
                }
            });
        });
        phases.sort(function (a, b) { return a - b; });
        var lo = lower > -Infinity ? lower : 0;
        var hi = upper < Infinity ? upper : 1;
        var ratio = null;
        if (lo < hi) {
            // 範囲内で、いちばん大きな空白の真ん中
            var pts = phases.filter(function (p) { return p > lo && p < hi; });
            pts = [lo].concat(pts, [hi]);
            var best = -1;
            for (var i = 1; i < pts.length; i++) {
                if (pts[i] - pts[i - 1] > best) { best = pts[i] - pts[i - 1]; ratio = (pts[i] + pts[i - 1]) / 2; }
            }
            if (lower === -Infinity && upper === Infinity && prior) ratio = prior;
        }
        if (ratio === null) ratio = prior || 0.5;

        var result = blocks.map(function (bk) {
            var ys = bk.ys;
            var bands = bk.anchorsY.map(function (y) {
                var idx = ys.indexOf(y);
                var pitch = bk.pitch || pagePitch;
                var loY = idx > 0 ? ys[idx - 1] + (ys[idx] - ys[idx - 1]) * ratio : y - pitch * (1 - ratio);
                var hiY = idx + 1 < ys.length ? y + (ys[idx + 1] - y) * ratio : y + pitch * ratio;
                // 見出しと 1行目の間の文字は 1行目、最後の行より下の文字は最後の行のもの（1行分の高さまで）
                if (idx === 0 && bk.topY !== undefined) loY = Math.min(loY, Math.max(bk.topY, y - pitch));
                if (idx === ys.length - 1 && bk.bottomY !== undefined) hiY = Math.max(hiY, Math.min(bk.bottomY, y + pitch));
                return { y: y, lo: loY, hi: hiY, words: [] };
            });
            bk.words.forEach(function (w) {
                for (var r = 0; r < bands.length; r++) {
                    if (w.y >= bands[r].lo && w.y < bands[r].hi) { bands[r].words.push(w); return; }
                }
            });
            return bands;
        });
        var informative = lower > -Infinity || upper < Infinity;
        return { bands: result, ratio: ratio, informative: informative };
    }

    // 表の見出しの下端：見出しの語だけでできている行（2～3行に分かれた見出しも含む）の一番下
    var HEADER_WORD = /^(ﾚｰﾝ|レーン|ORD|試|順|試順|ﾅﾝﾊﾞｰ|ナンバー|氏|名|氏名|所|属|所属|資格|記録|資格記録|前記録|参考記録|順位|ｺﾒﾝﾄ|コメント|通過|得点|ﾁｰﾑ|ｵｰﾀﾞｰ|ｶﾅ|3回|ﾍﾞｽﾄ|ﾄｯﾌﾟ8|総合|[1-6]回目|.*\/(資格|参考)記録|順位\(ﾅﾝﾊﾞｰ\)記録)$/;

    function headerBottom(zone, hdrLine, x0, x1) {
        var y = hdrLine.y;
        zone.forEach(function (L) {
            var ws = L.words.filter(function (w) { return w.x >= x0 && w.x < x1; });
            if (!ws.length) return;
            var hdr = ws.filter(function (w) { return HEADER_WORD.test(w.t); }).length;
            if (hdr >= Math.max(1, ws.length * 0.6) && L.y > y) y = L.y;
        });
        return y;
    }

    // 単語 → 行ごとの文字列（y が近いものを 1行に）
    function wordsByLine(list) {
        var ls = [];
        list.slice().sort(function (p, q) { return p.y - q.y || p.x - q.x; }).forEach(function (w) {
            var L = ls.filter(function (l) { return Math.abs(l.y - w.y) <= Math.max(l.fs, w.fs) * 0.35; })[0];
            if (!L) { L = { y: w.y, fs: w.fs, ws: [] }; ls.push(L); }
            L.ws.push(w);
        });
        return ls.map(function (l) {
            l.ws.sort(function (p, q) { return p.x - q.x; });
            return { y: l.y, words: l.ws, text: l.ws.map(function (w) { return w.t; }).join(' ') };
        });
    }

    // ---------------------------------------------------------------
    // 記録の形
    // ---------------------------------------------------------------
    var RE_RECORD = /^(\d{1,2}:)?\d{1,2}[.:]\d{2}(\.\d{2})?$|^\d{1,2}m\d{2}$|^\d{3,4}$|^\d{1,2}[.′']\d{2}["″]\d{2}$|^\d+\.\d{2}\.\d{2}$/;

    function isRecord(s) {
        return RE_RECORD.test(zenToHanAscii(squash(s)));
    }

    return {
        loadPages: loadPages,
        normText: normText,
        squash: squash,
        hanToZenKana: hanToZenKana,
        zenToHanAscii: zenToHanAscii,
        isPref: isPref,
        prefName: prefName,
        isRecord: isRecord,
        wordsToLines: wordsToLines,
        assignBands: assignBands,
        assignBandsPage: assignBandsPage,
        headerBottom: headerBottom,
        wordsByLine: wordsByLine,
        median: median,
        PREFS: PREFS
    };
}));
