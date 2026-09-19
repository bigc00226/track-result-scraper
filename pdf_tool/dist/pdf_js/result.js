/*
 * result.js  結果 PDF の読み取り（1.php と同じ 16列の一覧表にする）
 *
 *   対応している形式：記録処理ソフトの結果表（インターハイ・県大会・市民大会など）
 *     トラック（2組が左右に並ぶ形も可）・リレー・跳躍・投てき・走高跳/棒高跳・混成競技（総合）
 *
 *   出力列（1.php と同じ）
 *     日付 / 大会名 / 種目 / 風速 / レース状況 / 組 / 順位 / 記録 / 氏名 /
 *     氏名カナ / 学年 / 所属1 / 所属2 / 性別 / 表示/非表示 / 備考
 *   整形のルールも 1.php と同じです
 *     種目：100m → 100M、走高跳 → 走り高跳び、砲丸投(6.000kg) → 砲丸投げ
 *     記録：1:50.87 → 1.50.87、6m85 → 6.85、400m 以下で 1分を超える記録は秒に換算
 *     風速：+1.4 → 1.4（トラックは組ごと、走幅跳・三段跳は各選手の記録の風）
 *     リレー：チーム名を所属1に
 *     混成競技：総合の記録のみ
 *     カタカナは半角（1.php と同じ）
 *
 *   parse(pages) → { meet, rows: [[16列], ...], events: [...], warnings: [...] }
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./pdfcore.js'));
    } else {
        root.ResultPdf = factory(root.PdfCore);
    }
}(typeof self !== 'undefined' ? self : this, function (C) {
    'use strict';

    var norm = C.normText, squash = C.squash;

    var HEADERS = ['日付', '大会名', '種目', '風速', 'レース状況', '組', '順位', '記録', '氏名',
                   '氏名カナ', '学年', '所属1', '所属2', '性別', '表示/非表示', '備考'];

    // ---------------------------------------------------------------
    // 1.php と同じ文字の整形
    // ---------------------------------------------------------------
    var ZEN = 'ァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロワヲンヴー・「」、。';
    var HAN = ['ｧ', 'ｱ', 'ｨ', 'ｲ', 'ｩ', 'ｳ', 'ｪ', 'ｴ', 'ｫ', 'ｵ', 'ｶ', 'ｶﾞ', 'ｷ', 'ｷﾞ', 'ｸ', 'ｸﾞ', 'ｹ', 'ｹﾞ', 'ｺ', 'ｺﾞ',
        'ｻ', 'ｻﾞ', 'ｼ', 'ｼﾞ', 'ｽ', 'ｽﾞ', 'ｾ', 'ｾﾞ', 'ｿ', 'ｿﾞ', 'ﾀ', 'ﾀﾞ', 'ﾁ', 'ﾁﾞ', 'ｯ', 'ﾂ', 'ﾂﾞ', 'ﾃ', 'ﾃﾞ', 'ﾄ', 'ﾄﾞ',
        'ﾅ', 'ﾆ', 'ﾇ', 'ﾈ', 'ﾉ', 'ﾊ', 'ﾊﾞ', 'ﾊﾟ', 'ﾋ', 'ﾋﾞ', 'ﾋﾟ', 'ﾌ', 'ﾌﾞ', 'ﾌﾟ', 'ﾍ', 'ﾍﾞ', 'ﾍﾟ', 'ﾎ', 'ﾎﾞ', 'ﾎﾟ',
        'ﾏ', 'ﾐ', 'ﾑ', 'ﾒ', 'ﾓ', 'ｬ', 'ﾔ', 'ｭ', 'ﾕ', 'ｮ', 'ﾖ', 'ﾗ', 'ﾘ', 'ﾙ', 'ﾚ', 'ﾛ', 'ﾜ', 'ｦ', 'ﾝ', 'ｳﾞ', 'ｰ', '･', '｢', '｣', '､', '｡'];

    // 全角カタカナ → 半角（mb_convert_kana の 'k' と同じ。「ヶ」などはそのまま）
    function zenToHanKana(s) {
        var out = '';
        for (var i = 0; i < s.length; i++) {
            var k = ZEN.indexOf(s.charAt(i));
            out += k >= 0 ? HAN[k] : s.charAt(i);
        }
        return out;
    }

    // mb_convert_kana($s, 'ask') 相当（英数字・空白は半角、カタカナは半角）
    function kanaAsk(s) {
        return zenToHanKana(C.zenToHanAscii(C.hanToZenKana(s)));
    }

    function nospace(s) { return String(s).replace(/[\s　]+/g, ''); }

    // 氏名：「鈴木 郁(3)」→ ['鈴木 郁', '3']
    function person(raw) {
        var s = kanaAsk(raw).replace(/\s+/g, ' ').trim();
        var grade = '';
        var m = s.match(/^(.*?) *\(([^()]*)\) *$/);
        if (m) { s = m[1]; grade = m[2].replace(/ /g, ''); }
        return [s.replace(/ +/g, ' ').trim(), grade];
    }

    function org(raw) { return nospace(kanaAsk(raw)); }

    // 種目名：100m → 100M / 4X100mR → 4×100MR / 走高跳 → 走り高跳び / 砲丸投(5.000kg) → 砲丸投げ
    function eventName(s) {
        s = nospace(C.zenToHanAscii(C.hanToZenKana(s)));
        s = s.replace(/\([^()]*\)|（[^（）]*）/g, '');
        s = s.replace(/(\d)[xX×✕]/g, '$1×');
        s = s.replace(/[a-z]+/g, function (m) { return m.toUpperCase(); });
        s = s.replace(/(\d+)種競技/g, function (m, n) {
            var map = { '3': '三', '4': '四', '5': '五', '6': '六', '7': '七', '8': '八', '9': '九', '10': '十' };
            return (map[n] || n) + '種競技';
        });
        s = s.replace(/^(\d×\d+M)$/, '$1R');           // 決勝一覧表の「４×１００ｍ」→ 4×100MR
        s = s.replace(/走(?=[高幅])/g, '走り');
        s = s.replace(/跳(?!び)/g, '跳び');
        s = s.replace(/投(?!げ)/g, '投げ');
        return s;
    }

    // 種目名の分解：「一般男子100m」→ 性別=男子 / 種別=一般 / 種目=100m
    //   性別の後ろの種別（「男子1年100m」の 1年、「男子共通走幅跳」の 共通）も種別にする
    //   → レース状況に【1年】【共通】として表示（お客様のご要望）
    var EVENT_HEAD = /^(\d+(?:\.\d+)?(?:m|M|km|KM|ｍ)|\d+[×xX]|[×xX]\d|走高跳|棒高跳|走幅跳|三段跳|砲丸投|円盤投|ハンマー投|やり投|ジャベリック|[一二三四五六七八九十]種|\d+種|混成|競歩|リレー)/;

    function splitKyogimei(title) {
        var s = nospace(C.zenToHanAscii(C.hanToZenKana(title)));
        var map = { '男子': '男子', '女子': '女子', '男': '男子', '女': '女子', '男女混合': '男女混合', '男女': '男女混合', '混合': '男女混合' };
        var m = s.match(/^(.*?)(男女混合|男女|混合|男子|女子)(.*)$/) || s.match(/^(.*?)(男|女)(?=[0-9走棒三砲円ハやジボ立])(.*)$/);
        if (!m) return { sex: '', category: '', event: s };
        var rest = m[3], suffix = '';
        for (var i = 0; i < rest.length; i++) {
            if (EVENT_HEAD.test(rest.slice(i))) { suffix = rest.slice(0, i); rest = rest.slice(i); break; }
        }
        return { sex: map[m[2]], category: m[1] + suffix, event: rest };
    }

    // 記録：11.83 / 1.57.54 / 6.85（m・: は . に）。400m 以下で 1分を超えた記録は秒に換算
    function record(raw, ev) {
        var s = nospace(kanaAsk(raw));
        if (!s) return '';
        s = s.replace(/(\d)m(\d)/, '$1.$2').replace(/:/g, '.');
        if (ev && /^(?:(?:100|110|200|300|400)M(?:[A-Z]{0,2}H)?|4×100MR)$/.test(ev)) {
            var m = s.match(/^(\d+)\.(\d{2})\.(\d{2})$/);
            if (m) s = (parseInt(m[1], 10) * 60 + parseInt(m[2], 10)) + '.' + m[3];
        }
        return s;
    }

    function wind(raw) {
        var s = nospace(C.zenToHanAscii(raw)).replace(/m\/s$/i, '');
        return s.replace(/[+±]/g, '');
    }

    var RE_STATUS = /^(DNS|DNF|DQ|DSQ|NM|NR)(?![A-Z])/;
    var RE_WIND = /^[+\-±]?\d{1,2}\.\d$/;
    var RE_TRACKREC = /^(\d{1,2}[:.])?\d{1,2}[.:]\d{2}$|^\d{1,2}\.\d{2}$|^\d{1,2}:\d{2}\.\d{2}$/;
    var RE_FIELDREC = /^\d{1,2}m\d{2}$/;
    var RE_POINTS = /^\d{3,5}$/;

    // ---------------------------------------------------------------
    // 見出しの判定
    // ---------------------------------------------------------------
    var ROUND_RE = /^(タイムレース決勝|タイムレース予選|タイムレース|TR決勝|準々決勝|準決勝|決勝|予選|記録会|オープン)/;
    var EVENT_RE = /(\d|走高跳|棒高跳|走幅跳|三段跳|砲丸投|円盤投|ハンマー投|やり投|ジャベリックスロー|種競技|混成|競歩)/;

    function isTitle(L, page) {
        if (!L.words.length || L.words[0].x > page.width * 0.5 || L.fs < 13.5) return false;
        var s = norm(L.text);
        return /男|女/.test(s) && EVENT_RE.test(s) && !/[位点]$/.test(squash(s));
    }

    // ラウンド名は PDF の表記のまま（空白だけ除く）。「予 選 8組2着＋8」→「予選」
    function roundOf(L, page) {
        if (!L.words.length || L.words[0].x > page.width * 0.35) return null;
        var raw = squash(L.text);
        var m = norm(raw).match(ROUND_RE);
        if (!m) return null;
        // ラウンド名の部分だけを PDF の表記のまま取り出す（「予選通過記録4m70」→「予選」）
        var cut = m[1];
        for (var n = 1; n <= raw.length; n++) {
            if (norm(raw.slice(0, n)) === m[1]) { cut = raw.slice(0, n); break; }
        }
        var info = null, mm = norm(raw).slice(m[1].length).match(/^全?(\d{1,3})組/);
        if (mm) info = parseInt(mm[1], 10);
        return { round: C.zenToHanAscii(cut), heats: info };
    }

    // ---------------------------------------------------------------
    // 大会名・日付
    // ---------------------------------------------------------------
    function findMeet(pages) {
        var meet = { name: '', year: '', firstDate: '', dates: {} };
        pages.forEach(function (page) {
            page.lines.forEach(function (L, i) {
                var t = L.text;
                if (!meet.name) {
                    var m = t.match(/^(.*?)\s*【\d{8}】/);
                    if (m && m[1].trim()) meet.name = m[1].replace(/\s+/g, ' ').trim();
                }
                if (!meet.year) {
                    var d = C.zenToHanAscii(t).match(/(20\d{2})\/(\d{1,2})\/(\d{1,2})\s*[～〜~]/) ||
                            C.zenToHanAscii(squash(t)).match(/期日(20\d{2})年(\d{1,2})月(\d{1,2})日/);
                    if (d) {
                        meet.year = d[1];
                        meet.firstDate = d[1] + pad(d[2]) + pad(d[3]);
                    }
                }
            });
            // 上位8位一覧（日付・種目・1位…）から、種目ごとの日付を読む
            var hdr = page.lines.filter(function (L) {
                var ts = L.words.map(function (w) { return w.t; });
                return ts.indexOf('日付') >= 0 && ts.indexOf('種目') >= 0 && (ts.indexOf('1位') >= 0 || ts.indexOf('1') >= 0);
            })[0];
            if (!hdr) return;
            var evW = hdr.words.filter(function (w) { return w.t === '種目'; })[0];
            var firstPlace = hdr.words.filter(function (w) { return /^1位?$/.test(w.t) && w.x > evW.x; })[0];
            var evX0 = evW.x - 40, evX1 = firstPlace ? firstPlace.x - 2 : evW.x + 90;
            var dateWords = [], genderWords = [], all = [];
            page.lines.forEach(function (L) {
                if (L.y <= hdr.y) return;
                L.words.forEach(function (w) {
                    all.push(w);
                    if (/^\d{1,2}月\d{1,2}日$/.test(C.zenToHanAscii(w.t)) && w.x < evX0 + 45) dateWords.push(w);
                    else if (w.x >= evX0 && w.x < evX1 && /男|女/.test(w.t) && !/\(\d{1,2}\)$/.test(w.t)) genderWords.push(w);
                });
            });
            // 種目名 = 性別を含む語 ＋（すぐ下の行に同じ位置から続く語）
            var groups = [];
            genderWords.forEach(function (w) {
                var title = w.t;
                var cont = all.filter(function (c) { return c.y > w.y + 1 && c.y < w.y + 12 && Math.abs(c.x - w.x) < 4 && !/男|女/.test(c.t) && /^[0-9０-９]|[跳投走競]/.test(c.t); })[0];
                if (!/\d|跳|投|走|競技|リレー|ｍ|m$/.test(title) && cont) title += cont.t;
                var near = null;
                dateWords.forEach(function (d) { if (!near || Math.abs(d.y - w.y) < Math.abs(near.y - w.y)) near = d; });
                if (!near || Math.abs(near.y - w.y) > 14) return;
                groups.push({ d: near, title: title });
            });
            groups.forEach(function (g) {
                var title = g.title;
                var dm = C.zenToHanAscii(g.d.t).match(/(\d{1,2})月(\d{1,2})日/);
                var key = titleKey(title);
                if (key && !meet.dates[key]) meet.dates[key] = pad(dm[1]) + pad(dm[2]);
            });
        });
        return meet;
    }

    function pad(n) { n = String(parseInt(n, 10)); return n.length < 2 ? '0' + n : n; }

    function titleKey(t) {
        return nospace(C.zenToHanAscii(C.hanToZenKana(t))).replace(/\([^()]*\)|（[^（）]*）/g, '').replace(/[xX]/g, '×').toLowerCase();
    }

    // 種目ページの右上「7月31日 18:30 予 選」→ ラウンドごとの日付
    function roundDates(page) {
        var map = {};
        page.lines.forEach(function (L) {
            if (L.y > page.height * 0.25) return;
            L.words.forEach(function (w, i) {
                if (w.x < page.width * 0.55) return;
                var dm = C.zenToHanAscii(w.t).match(/^(\d{1,2})月(\d{1,2})日$/);
                if (!dm) return;
                // 日付の右にある語（時刻・ラウンド名）
                var rest = L.words.slice(i + 1).map(function (x) { return x.t; }).join('');
                rest = norm(C.zenToHanAscii(rest)).replace(/^\d{1,2}:\d{2}/, '').replace(/\d+組$/, '');
                var rm = squash(rest).match(ROUND_RE);
                if (rm && !map[rm[1]]) map[rm[1]] = pad(dm[1]) + pad(dm[2]);
            });
        });
        return map;
    }

    // ---------------------------------------------------------------
    // 表のヘッダー
    // ---------------------------------------------------------------
    function findBlocks(page, hdrLine) {
        var zone = page.lines.filter(function (L) { return L.y >= hdrLine.y - 9 && L.y <= hdrLine.y + 14; });
        var zw = [];
        zone.forEach(function (L) { zw = zw.concat(L.words); });
        var starts = hdrLine.words.filter(function (w) { return w.t === '順位'; }).sort(function (a, b) { return a.x - b.x; });
        if (!starts.length) return [];
        return starts.map(function (s, i) {
            var x0 = s.x - 10, x1 = i + 1 < starts.length ? starts[i + 1].x - 10 : page.width + 1;
            var inB = zw.filter(function (w) { return w.x >= x0 && w.x < x1; });
            var col = function (re, after) {
                var c = inB.filter(function (w) { return re.test(w.t) && w.x > (after || -1); }).sort(function (a, b) { return a.x - b.x; });
                return c.length ? c[0].x : null;
            };
            var b = { x0: x0, x1: x1, rankX: s.x };
            b.laneX = col(/^(ﾚｰﾝ|レーン|試順|ORD)$/, s.x);
            b.teamColX = col(/^(ﾁｰﾑ|チーム)$/, s.x);
            b.numX = col(/^(ﾅﾝﾊﾞｰ|ナンバー)$/, s.x);
            b.relay = b.teamColX !== null;
            b.nameX = b.relay ? col(/^(ｵｰﾀﾞｰ|オーダー)$/, b.numX) : col(/^(氏名|氏)$/, b.numX);
            b.kanaX = col(/^(ｶﾅ|カナ)$/, b.nameX);
            b.teamX = b.relay ? null : col(/^(所属|所)$/, b.nameX);
            b.attX = col(/^1回目$/, b.nameX);
            b.totalX = col(/^総合$/, b.nameX);
            b.cmtX = col(/^(ｺﾒﾝﾄ|コメント)$/, b.nameX);
            b.passX = col(/^通過$/, b.nameX);
            // 記録の列（「3回ﾍﾞｽﾄ」ではなく、ｺﾒﾝﾄの左の「記録」）
            var recs = inB.filter(function (w) { return w.t === '記録' && w.x > (b.nameX || 0); }).sort(function (a, c) { return a.x - c.x; });
            b.recX = recs.length ? recs[recs.length - 1].x : null;
            b.hdrY = C.headerBottom(zone, hdrLine, x0, x1);
            b.hdrLineY = hdrLine.y;
            b.ok = b.numX !== null && b.nameX !== null;
            return b;
        }).filter(function (b) { return b.ok; });
    }

    function wordsIn(L, x0, x1) { return L.words.filter(function (w) { return w.x >= x0 && w.x < x1; }); }

    function nameScore(text) {
        var sc = 0;
        if (/[぀-ゟ゠-ヿ一-鿿豈-﫿々〆]/.test(text)) sc += 4;
        if (/^[｡-ﾟ\s()0-9*]+$/.test(text)) sc -= 2;
        if (/^[A-Za-z\s()0-9.'\-*]+$/.test(text)) sc -= 1;
        if (/\(\d{1,2}\)|\([^)]*\d\)/.test(text)) sc += 1;
        return sc;
    }

    // ---------------------------------------------------------------
    // 1つの組（ブロック）の行を読む
    //   (1) collectBlock : 行の基準（ナンバー／リレーは順位・レーン＋チーム名）と、振り分ける単語
    //   (2) ページ内の表をまとめて 1人分（1チーム分）の範囲を決める（PdfCore.assignBandsPage）
    //   (3) blockRows    : 範囲の中の単語を 順位・氏名・所属・記録 に分ける
    // ---------------------------------------------------------------
    function collectBlock(page, b, lines) {
        var nameX = b.nameX;
        var anchors = [];
        lines.forEach(function (L) {
            var ws = wordsIn(L, b.x0, b.x1);
            if (!ws.length) return;
            var left = ws.filter(function (w) { return w.x < nameX - 1; });
            if (b.relay) {
                // リレー：順位・レーン と チーム名がある行
                var laneRight = b.laneX !== null ? b.laneX + 4 : b.teamColX - 30;
                var teamWs = left.filter(function (w) { return w.x >= laneRight && w.x < b.numX - 2 && !/^\d{1,3}$/.test(w.t); });
                var nums = left.filter(function (w) { return /^\d{1,3}$/.test(w.t) && w.x < (b.laneX !== null ? b.laneX + 12 : b.teamColX - 10); });
                if (!nums.length || !teamWs.length || /^[(（]/.test(teamWs[0].t)) return;
                anchors.push({ y: L.y, line: L, left: nums, team: teamWs });
                return;
            }
            // 個人：ナンバーがある行（氏名の列のすぐ左）
            var bibs = left.filter(function (w) { return /^[0-9A-Za-z][0-9A-Za-z\-]*$/.test(w.t) && w.x >= b.numX - 16; });
            if (!bibs.length) return;
            var bib = bibs[bibs.length - 1];
            var before = left.filter(function (w) { return w.x < bib.x && /^\d{1,3}$/.test(w.t); });
            anchors.push({ y: L.y, line: L, left: before, bib: bib });
        });
        anchors.sort(function (p, q) { return p.y - q.y; });
        var used = [];
        anchors.forEach(function (a) { used = used.concat(a.left, a.bib ? [a.bib] : [], a.team || []); });
        var others = [];
        lines.forEach(function (L) {
            wordsIn(L, b.x0, b.x1).forEach(function (w) { if (used.indexOf(w) < 0) others.push(w); });
        });
        // 氏名の列の始まり：順位・レーンの右（ナンバーは行の基準として取り除き済み）
        var edge = b.x0;
        anchors.forEach(function (a) { a.left.forEach(function (w) { edge = Math.max(edge, w.x2); }); });
        b.nameStart = b.relay ? b.nameX - 3 : Math.min(b.nameX - 3, edge + 0.5);
        // 所属の列の始まり（都道府県名がそろって書かれている位置）
        if (!b.relay && b.teamX !== null) {
            var starts = {};
            C.wordsByLine(others.filter(function (w) { return w.x > b.nameStart && w.x < b.teamX + 20; })).forEach(function (l) {
                for (var i = 0; i < l.words.length; i++) {
                    var acc = '';
                    for (var j = i; j < l.words.length && j < i + 3; j++) {
                        acc += l.words[j].t;
                        if (C.isPref(acc.replace(/[()（）]/g, ''))) {
                            var k = Math.round(l.words[i].x);
                            starts[k] = (starts[k] || 0) + 1;
                            break;
                        }
                    }
                }
            });
            var modeX = null, modeN = 0;
            Object.keys(starts).forEach(function (k) {
                var n = (starts[k] || 0) + (starts[+k - 1] || 0) + (starts[+k + 1] || 0);
                if (n > modeN) { modeN = n; modeX = +k; }
            });
            b.teamStart = b.teamX - 3;
            if (modeX !== null && modeN >= Math.max(2, anchors.length * 0.3) && modeX - 1.5 < b.teamStart && modeX - 1.5 > b.nameStart + 8) {
                b.teamStart = modeX - 1.5;
            }
        }
        return { anchors: anchors, others: others };
    }

    function blockRows(page, b, anchors, bands, kind) {
        var out = [];
        var recX0 = b.recX !== null ? b.recX - 16 : null;
        var recX1 = b.cmtX !== null ? b.cmtX - 1 : b.x1;
        anchors.forEach(function (a, idx) {
            var ws = bands[idx].words;
            var own = ws.concat(a.line.words.filter(function (w) { return w !== a.bib && a.left.indexOf(w) < 0 && (a.team || []).indexOf(w) < 0 && w.x >= b.x0 && w.x < b.x1; }))
                .filter(function (w, i, arr) { return arr.indexOf(w) === i; });
            var r = { rank: '', lane: '', bib: a.bib ? a.bib.t : '', name: '', grade: '', team: '', pref: '', rec: '', wind: '', status: '' };
            // 順位・レーン
            var rankLimit = b.laneX !== null ? b.laneX - 3 : (b.relay ? b.teamColX - 10 : (a.bib ? a.bib.x - 1 : b.numX));
            a.left.forEach(function (w) {
                if (w.x < rankLimit && !r.rank) r.rank = w.t;
                else if (!r.lane) r.lane = w.t;
            });
            // 記録なしの表記（DNS など）：記録・総合・ｺﾒﾝﾄの列の、基準の行にあるものを優先
            var stX = b.totalX !== null ? b.totalX - 16 : (recX0 !== null ? recX0 : b.nameX);
            var stCands = own.filter(function (w) { return w.x >= stX; })
                .sort(function (p, q) { return Math.abs(p.y - a.y) - Math.abs(q.y - a.y); });
            stCands.forEach(function (w) {
                var m = C.zenToHanAscii(w.t).toUpperCase().match(RE_STATUS);
                if (m && !r.status) r.status = m[1];
            });

            if (b.relay) {
                r.team = a.team.map(function (w) { return w.t; }).join(' ');
                wordsIn(a.line, recX0 !== null ? recX0 : b.x0, recX1).forEach(function (w) {
                    if (!r.rec && RE_TRACKREC.test(C.zenToHanAscii(w.t))) r.rec = w.t;
                });
                out.push(r);
                return;
            }

            // 氏名・学年
            var nameEnd = b.teamX !== null ? b.teamStart : (b.kanaX !== null ? b.kanaX - 3 : b.nameX + 60);
            var nameWs = own.filter(function (w) { return w.x >= b.nameStart && w.x < nameEnd; });
            var HK = /^[\uFF61-\uFF9F]+$/;
            var teamEnd = b.x1;
            if (b.teamX !== null) {
                teamEnd = b.attX !== null ? b.attX - 3 : (recX0 !== null ? recX0 : b.x1);
                // 混成の表は所属の右に各種目の記録が並ぶので、次の列の見出しの手前まで
                //（走高跳・棒高跳は見出しの上の「高さ」の行も見る）
                var hdrL = page.lines.filter(function (L) { return L.y >= b.hdrLineY - 12 && L.y <= b.hdrY + 0.5; });
                hdrL.forEach(function (L) {
                    var nextCol = L.words.filter(function (w) { return w.x > b.teamX + 10 && w.x < b.x1; }).sort(function (p, q) { return p.x - q.x; })[0];
                    if (nextCol && nextCol.x - 12 < teamEnd) teamEnd = nextCol.x - 12;
                });
            }
            var teamWs = b.teamX !== null ? own.filter(function (w) { return w.x >= nameEnd && w.x < teamEnd && !/^[○×－\-―/ｰ]+$/.test(w.t); }) : [];
            // フリガナの続きが所属の列にはみ出している場合は氏名の側に戻す
            teamWs = teamWs.filter(function (w) {
                if (!HK.test(w.t)) return true;
                var cont = nameWs.some(function (n) { return HK.test(n.t) && Math.abs(n.y - w.y) <= Math.max(n.fs, w.fs) * 0.35; });
                if (cont) { nameWs.push(w); return false; }
                return true;
            });
            var best = null;
            C.wordsByLine(nameWs).forEach(function (l) {
                var sq = squash(l.text);
                if (/^\(\d{1,2}\)$/.test(sq)) { r.grade = r.grade || sq.replace(/[()]/g, ''); return; }
                var sc = nameScore(l.text) - Math.abs(l.y - a.y) / 100;
                if (!best || sc > best.sc) best = { sc: sc, text: l.text };
            });
            if (best) {
                var pg = person(best.text);
                r.name = pg[0];
                if (pg[1]) r.grade = pg[1];
            }
            // 所属・都道府県
            var teams = [];
            C.wordsByLine(teamWs).forEach(function (l) {
                var sq = squash(norm(l.text));
                if (!sq || RE_WIND.test(sq) || /^0\.\d{3}$/.test(sq) || C.isRecord(sq) || RE_STATUS.test(sq)) return;
                var inner = sq.replace(/^[(（](.*)[)）]$/, '$1');
                if (C.isPref(inner) && !r.pref) { r.pref = C.prefName(inner); return; }
                var k = sq.indexOf('・');
                if (k > 0 && k <= 4 && C.isPref(sq.slice(0, k))) {
                    r.pref = r.pref || C.prefName(sq.slice(0, k));
                    teams.push(norm(l.text).replace(/^[^・]*・\s*/, ''));
                    return;
                }
                teams.push(l.text);
            });
            r.team = teams.join(' ');
            // 記録
            if (b.totalX !== null) {
                wordsIn(a.line, b.totalX - 14, b.cmtX !== null ? b.cmtX - 1 : b.x1).forEach(function (w) {
                    if (!r.rec && RE_POINTS.test(w.t)) r.rec = w.t;
                });
            } else if (recX0 !== null) {
                var inRec = own.filter(function (w) { return w.x >= recX0 && w.x < recX1; })
                    .sort(function (p, q) { return Math.abs(p.y - a.y) - Math.abs(q.y - a.y); });
                inRec.forEach(function (w) {
                    var t = C.zenToHanAscii(w.t);
                    if (kind === 'field') {
                        if (RE_WIND.test(t)) { if (!r.wind) r.wind = t; return; }
                        if (!r.rec && (RE_FIELDREC.test(t) || /^\d{1,2}\.\d{2}$/.test(t))) r.rec = t;
                    } else {
                        if (Math.abs(w.y - a.y) > Math.max(w.fs, 6) * 0.5) return;      // 反応時間などは別の行
                        if (!r.rec && RE_TRACKREC.test(t)) r.rec = t;
                    }
                });
            }
            out.push(r);
        });
        return out;
    }

    // ---------------------------------------------------------------
    // 決勝一覧表・上位8位一覧（詳しい結果の表がない PDF 用）
    //   列：［種別］・種目名・日付・1位～8位（各位：氏名(学年) 記録 ／ 所属）
    //   種別の欄は複数の種目にまたがって上下中央に書かれているので、
    //   種目の並びと種別の位置から、どの種目の種別かを決める
    // ---------------------------------------------------------------
    var RE_SUM_REC = /^(\d{1,2}:)?\d{1,2}\.\d{2}(\/[+\-±]?\d{1,2}\.\d|\([+\-±]?\d{1,2}\.\d\))?$|^\d{1,2}m\d{2}(\/[+\-±]?\d{1,2}\.\d|\([+\-±]?\d{1,2}\.\d\))?$|^\d{3,5}$/;
    var RE_MARK = /^(N?GR|=?GR|NGR|NR|=NR|JH|NJH|大会新|大会タイ|\*+|DNS|DNF|DQ|NM)$/;

    function splitRec(t) {
        t = C.zenToHanAscii(t);
        var m = t.match(/^(.*?)(?:\/([+\-±]?\d{1,2}\.\d)|\(([+\-±]?\d{1,2}\.\d)\))$/);
        if (m) return { rec: m[1], wind: m[2] || m[3] };
        return { rec: t, wind: '' };
    }

    // 1語の中で、x の位置で 2つに分ける（種別と種目名がくっついている「男子中１００ｍ」など）
    function splitWordAt(w, x) {
        var units = [], total = 0;
        for (var i = 0; i < w.t.length; i++) {
            var c = w.t.charCodeAt(i);
            var u = (c < 0x7F || (c >= 0xFF61 && c <= 0xFF9F)) ? 0.5 : 1;
            units.push(u); total += u;
        }
        var acc = 0, k = 0;
        for (; k < units.length; k++) {
            if (w.x + (w.x2 - w.x) * (acc + units[k] / 2) / total >= x) break;
            acc += units[k];
        }
        if (k <= 0 || k >= w.t.length) return null;
        var xs = w.x + (w.x2 - w.x) * acc / total;
        return [{ t: w.t.slice(0, k), x: w.x, x2: xs, y: w.y, fs: w.fs }, { t: w.t.slice(k), x: xs, x2: w.x2, y: w.y, fs: w.fs }];
    }

    function summaryPage(page, prevLabel, meet) {
        var PLACE = /^([1-8１-８])位$/;
        var hdr = page.lines.filter(function (L) {
            var n = L.words.filter(function (w) { return PLACE.test(w.t); }).length;
            return n >= 3 && L.words.some(function (w) { return /^種目(名)?$/.test(w.t); });
        })[0];
        if (!hdr) return null;
        var places = hdr.words.filter(function (w) { return PLACE.test(w.t); }).map(function (w) {
            return { k: parseInt(C.zenToHanAscii(w.t.charAt(0)), 10), c: (w.x + w.x2) / 2 };
        }).sort(function (a, b) { return a.c - b.c; });
        var diffs = [];
        for (var i = 1; i < places.length; i++) diffs.push(places[i].c - places[i - 1].c);
        var colW = C.median(diffs) || 90;
        places.forEach(function (p) { p.x0 = p.c - colW / 2; p.x1 = p.c + colW / 2; });
        var place1X = places[0].x0;

        // 大会名・日付（ページの上の方）
        var info = { name: '', year: '', date: '' };
        page.lines.forEach(function (L) {
            if (L.y >= hdr.y) return;
            if (!info.name) {
                // 大会名：大会コード（8桁）・日付・「決勝一覧表」より前の部分
                var ws = [];
                for (var wi = 0; wi < L.words.length; wi++) {
                    var wt = C.zenToHanAscii(L.words[wi].t);
                    if (/^【?\d{8}】?$/.test(wt) || /^20\d{2}[年\/]/.test(wt) || /決勝一覧|一覧表/.test(wt) || L.words[wi].x > page.width * 0.6) break;
                    ws.push(L.words[wi].t);
                }
                var nm = ws.join(' ');
                if (/大会|選考会|選手権|競技会|記録会|の部/.test(nm) && !/^[（(]?兼/.test(nm)) info.name = nm;
            }
            var t = C.zenToHanAscii(squash(L.text));
            var jm = t.match(/(20\d{2})年(\d{1,2})月(\d{1,2})日/);
            if (jm && !info.date) { info.year = jm[1]; info.date = jm[1] + pad(jm[2]) + pad(jm[3]); }
            var sm = t.match(/(20\d{2})\/(\d{1,2})\/(\d{1,2})/);
            if (sm && !info.year) info.year = sm[1];
        });

        var body = page.lines.filter(function (L) { return L.y > hdr.y + 1; });
        var inPlace = function (w) { return places.some(function (p) { return w.x >= p.x0 && w.x < p.x1; }); };
        // 記録の行（1位～8位の欄に記録がある行）
        var recLines = body.filter(function (L) {
            return L.words.some(function (w) { return w.x >= place1X && inPlace(w) && RE_SUM_REC.test(C.zenToHanAscii(w.t)); });
        });
        if (!recLines.length) return { info: info, rows: [], lastLabel: prevLabel };

        // 種目名の列の始まり（種目名らしい語の位置）
        var cand = [];
        recLines.forEach(function (L) {
            L.words.forEach(function (w) {
                if (w.x >= place1X) return;
                var n = C.zenToHanAscii(C.hanToZenKana(w.t));
                if (EVENT_HEAD.test(n) || /^(男子|女子)/.test(n) && EVENT_HEAD.test(n.replace(/^.*?(男子|女子)[^0-9走棒三砲円ハやジ×]*/, ''))) cand.push(w.x);
            });
        });
        var hist = {};
        cand.forEach(function (x) { var k = Math.round(x / 3); hist[k] = (hist[k] || 0) + 1; });
        var modeK = null;
        Object.keys(hist).forEach(function (k) { if (modeK === null || hist[k] > hist[modeK]) modeK = k; });
        var evColX = modeK !== null ? Math.min.apply(null, cand.filter(function (x) { return x >= modeK * 3 - 15; })) - 1.5 : place1X - 60;

        // 各行の語を分ける：種別（左端）・種目名・日付・風
        var labelWords = [], lineInfo = {};
        body.forEach(function (L) {
            var li = { ev: [], date: '', wind: '' };
            var pre = [];
            L.words.forEach(function (w) {
                if (w.x >= place1X) return;
                if (w.x < evColX) {
                    var parts = [w];
                    if (w.x2 > evColX + 3) { var sp = splitWordAt(w, evColX + 1); if (sp) parts = sp; }
                    // 種目名の一部（「110mH」「１１」など、列から少しはみ出したもの）は種目名に戻す
                    var pn = C.zenToHanAscii(C.hanToZenKana(parts[0].t));
                    if (EVENT_HEAD.test(pn)) { li.ev.push(parts[0]); if (parts.length > 1) li.ev.push(parts[1]); return; }
                    pre.push(parts[0]);
                    if (parts.length > 1) li.ev.push(parts[1]);
                    return;
                }
                var n = C.zenToHanAscii(w.t);
                var d = n.match(/^(\d{1,2})\/(\d{1,2})$/) || n.match(/^(\d{1,2})月(\d{1,2})日$/);
                if (d) { li.date = li.date || pad(d[1]) + pad(d[2]); return; }
                var wm = n.match(/^風?[:：]?([+\-±]\d{1,2}\.\d)$/) || n.match(/^風[:：]?(\d{1,2}\.\d)$/);
                if (wm) { li.wind = li.wind || wm[1]; return; }
                li.ev.push(w);
            });
            if (pre.length) {
                // 種別と日付が重なって書かれている場合：半角の数字と「/」は日付、それ以外は種別
                pre.sort(function (a, b) { return a.x - b.x; });
                // 日付（/）のない行で、数字だけの語は種目名の一部
                if (!/\//.test(pre.map(function (w) { return w.t; }).join(''))) {
                    pre = pre.filter(function (w) {
                        if (/^[0-9０-９]+$/.test(w.t)) { li.ev.push(w); return false; }
                        return true;
                    });
                    if (!pre.length) { lineInfo[L.y] = li; return; }
                }
                var t = pre.map(function (w) { return w.t; }).join('');
                var md = C.zenToHanAscii(t).match(/(\d{1,2})月(\d{1,2})日/);
                if (md) { li.date = li.date || pad(md[1]) + pad(md[2]); t = t.replace(/\d{1,2}月\d{1,2}日/, ''); }
                var ascii = t.replace(/[^0-9\/]/g, '');
                var dm = ascii.match(/^(\d{1,2})\/(\d{1,2})$/);
                if (dm) { li.date = li.date || pad(dm[1]) + pad(dm[2]); t = t.replace(/[0-9\/]/g, ''); }
                t = t.replace(/[()（）\s]/g, '');
                if (t) labelWords.push({ t: t, x: pre[0].x, x2: pre[pre.length - 1].x2, y: L.y, fs: Math.max.apply(null, pre.map(function (w) { return w.fs; })) });
            }
            lineInfo[L.y] = li;
        });

        // 1種目 = 記録の行から次の記録の行の手前まで
        var blocks = recLines.map(function (L, i) {
            var nextY = i + 1 < recLines.length ? recLines[i + 1].y : page.height;
            var lines = body.filter(function (b) { return b.y >= L.y - 4 && b.y < nextY - 2; });
            return { rec: L, lines: lines, top: L.y - 6, bottom: Math.min(nextY - 2, lines.length ? lines[lines.length - 1].y + 2 : L.y + 8) };
        });
        blocks.forEach(function (bk) {
            var parts = [];
            bk.date = ''; bk.wind = '';
            bk.lines.forEach(function (L) {
                var li = lineInfo[L.y];
                if (!li || Math.abs(L.y - bk.rec.y) > 12) return;
                if (li.date && !bk.date) bk.date = li.date;
                if (li.wind && !bk.wind) bk.wind = li.wind;
                if (L.y <= bk.rec.y + 9) li.ev.forEach(function (w) { parts.push(w); });
            });
            bk.event = parts.sort(function (a, b) { return a.y - b.y || a.x - b.x; }).map(function (w) { return w.t; }).join('');
        });

        // 種別の割り当て
        var lw = labelWords.sort(function (a, b) { return a.y - b.y || a.x - b.x; });
        if (lw.length) {
            var assigned = false;
            // 表の罫線がある場合：種別の欄を横切る線で区切る（結合セルの境目）
            var lx0 = Math.min.apply(null, lw.map(function (w) { return w.x; }));
            var borders = (page.hrules || []).filter(function (h) { return h.x1 <= lx0 + 2 && h.x2 >= evColX - 2 && h.y > hdr.y; })
                .map(function (h) { return h.y; }).sort(function (a, b) { return a - b; });
            var uniq = [];
            var firstRec = recLines[0].y, lastRec = recLines[recLines.length - 1].y;
            borders.forEach(function (y) { if (y > hdr.y + 1 && (!uniq.length || y - uniq[uniq.length - 1] > 1)) uniq.push(y); });
            // 表の中（最初と最後の種目の間）に区切りの線があるときだけ使う
            if (uniq.some(function (y) { return y > firstRec && y < lastRec; })) {
                var edges = [hdr.y + 1].concat(uniq, [page.height]);
                var lastText = prevLabel;
                for (var ci = 0; ci + 1 < edges.length; ci++) {
                    var y0 = edges[ci], y1 = edges[ci + 1];
                    var txt = lw.filter(function (w) { var cy = w.y - w.fs * 0.4; return cy > y0 && cy < y1; }).map(function (w) { return w.t; }).join('');
                    var inCell = blocks.filter(function (bk) { return bk.rec.y > y0 && bk.rec.y < y1; });
                    if (!inCell.length) continue;
                    var t2 = txt || lastText;
                    inCell.forEach(function (bk) { bk.label = t2; });
                    lastText = t2;
                }
                prevLabel = lastText;
                assigned = true;
            }
            if (!assigned) {
                // 罫線がない場合：種別の文字の位置が、種目の並びの中央になるように区切る
                var labels = [];
                lw.forEach(function (w) {
                    var last = labels[labels.length - 1];
                    if (last && w.y - last.yMax < 10.5) { last.text += w.t; last.yMax = w.y; last.ys.push(w.y); }   // 縦書きの種別も 1つに
                    else labels.push({ text: w.t, yMax: w.y, ys: [w.y] });
                });
                labels.forEach(function (l) { l.c = (Math.min.apply(null, l.ys) - 4 + l.yMax + 2) / 2; });
                var n = blocks.length, m = labels.length, INF = 1e18, cost = [], from = [];
                for (var j = 0; j <= m; j++) { cost.push([]); from.push([]); for (var q = 0; q <= n; q++) { cost[j].push(INF); from[j].push(-1); } }
                cost[0][0] = 0;
                for (var q0 = 1; q0 <= n && prevLabel; q0++) {
                    if (blocks[q0 - 1].bottom < labels[0].c - 20) { cost[0][q0] = 0; from[0][q0] = 0; } else break;
                }
                var SKIP = 200;          // 種目のない種別（読み取りの誤り）を飛ばす場合の重み
                for (var jj = 1; jj <= m; jj++) for (var e = 0; e <= n; e++) {
                    if (cost[jj - 1][e] + SKIP < cost[jj][e]) { cost[jj][e] = cost[jj - 1][e] + SKIP; from[jj][e] = -2; }
                    for (var st = 0; st < e; st++) {
                        if (cost[jj - 1][st] >= INF) continue;
                        var c2 = cost[jj - 1][st] + Math.abs((blocks[st].top + blocks[e - 1].bottom) / 2 - labels[jj - 1].c);
                        if (c2 < cost[jj][e]) { cost[jj][e] = c2; from[jj][e] = st; }
                    }
                }
                if (cost[m][n] < INF) {
                    var e2 = n;
                    for (var j2 = m; j2 >= 1; j2--) {
                        var st2 = from[j2][e2];
                        if (st2 === -2) continue;
                        for (var b2 = st2; b2 < e2; b2++) blocks[b2].label = labels[j2 - 1].text;
                        e2 = st2;
                    }
                    for (var b3 = 0; b3 < e2; b3++) blocks[b3].label = prevLabel;
                }
                if (globalThis.__dbg) console.log('DBG DP p' + page.num, JSON.stringify(labels.map(function (l) { return l.text + '@' + l.c.toFixed(0); })), JSON.stringify(blocks.map(function (b) { return b.event + ':' + b.rec.y.toFixed(0) + '=' + b.label; })));
                prevLabel = labels[m - 1].text;
            }
        } else {
            blocks.forEach(function (bk) { bk.label = prevLabel; });
        }

        // 行の作成
        var rows = [];
        blocks.forEach(function (bk) {
            if (!bk.event || /得点$|^得点/.test(bk.event)) return;
            var title = (bk.label || '') + bk.event;
            var sp = splitKyogimei(title);
            var ev = eventName(sp.event);
            if (!ev) return;
            var relay = /×|R$|リレー/.test(ev);
            var isJump = /走り幅跳び|三段跳び/.test(ev), isTrack = !/跳|投|スロー|種競技/.test(ev);
            var inX = function (L, x0, x1) { return L.words.filter(function (w) { return w.x >= x0 && w.x < x1; }); };
            var cols = places.map(function (p) {
                var ws = inX(bk.rec, p.x0, p.x1), recW = null;
                ws.forEach(function (w) { if (RE_SUM_REC.test(C.zenToHanAscii(w.t))) recW = w; });
                var nameWs = ws.filter(function (w) { return w !== recW && !RE_MARK.test(w.t); });
                return { p: p, recW: recW, nameWs: nameWs };
            });
            var push = function (rank, nameText, team, recW, aWind) {
                var rw = splitRec(recW.t);
                var w = rw.wind || aWind || bk.wind;
                var row = { rank: String(rank), rec: record(rw.rec, ev), wind: '', name: '', grade: '', team: '', relay: relay };
                if (isTrack || isJump) row.wind = wind(w || '');
                if (relay) row.team = org(nameText);
                else {
                    var pg = person(nameText);
                    row.name = pg[0]; row.grade = pg[1]; row.team = org(team);
                }
                rows.push({ date: bk.date, meet: info.name, event: ev, sex: sp.sex, category: sp.category, row: row });
            };
            var cleanTeam = function (ws2) {
                var aW = '', tw = [];
                ws2.forEach(function (w) {
                    var n = C.zenToHanAscii(w.t);
                    if (/^[+\-±]\d{1,2}\.\d$/.test(n)) { aW = aW || n; return; }          // 記録の下の風
                    if (RE_MARK.test(w.t) || RE_SUM_REC.test(n) || /\d\.\d{2}|^予/.test(n)) return;   // 大会新などの印・予選の記録
                    tw.push(w.t);
                });
                return { team: tw.join(' '), wind: aW };
            };
            for (var ci = 0; ci < cols.length; ci++) {
                var col = cols[ci];
                if (!col.recW) continue;
                // 同じ記録（同順位）で欄が結合されている場合：左の欄から名前が書かれている
                var from = ci;
                while (!col.nameWs.length && from > 0 && !cols[from - 1].recW && cols[from - 1].nameWs.length) from--;
                if (from < ci) {
                    var x0 = cols[from].p.x0, x1 = col.p.x1;
                    var cellLines = bk.lines.filter(function (L) { return L.y >= bk.rec.y - 1 && L.y < bk.rec.y + 18 && inX(L, x0, x1).length; });
                    cellLines.forEach(function (L) {
                        var ws3 = inX(L, x0, x1).filter(function (w) { return w !== col.recW && !RE_SUM_REC.test(C.zenToHanAscii(w.t)) && !RE_MARK.test(w.t); });
                        var t = ws3.map(function (w) { return w.t; }).join(' ');
                        var mm = t.match(/^(.*?\(\s*\d{1,2}\s*\))\s*(.*)$/);
                        if (mm) push(cols[from].p.k, mm[1], mm[2], col.recW, '');
                    });
                    continue;
                }
                var p = col.p;
                var inCol = function (L) { return inX(L, p.x0, p.x1); };
                var nameText = col.nameWs.map(function (w) { return w.t; }).join(' ');
                var team = '', aWind = '';
                var below = bk.lines.filter(function (L) { return L.y > bk.rec.y + 1 && L.y < bk.rec.y + 14 && inCol(L).length; })[0];
                if (below) {
                    var ct = cleanTeam(inCol(below));
                    aWind = ct.wind;
                    if (!relay) team = ct.team;
                }
                if (!relay) {
                    // 名前の後ろに所属が続いている（欄からはみ出した）場合
                    var ov = nameText.match(/^(.*?\(\s*\d{1,2}\s*\))\s*(.+)$/);
                    if (ov) { nameText = ov[1]; team = team || ov[2]; }
                }
                push(p.k, nameText, team, col.recW, aWind);
            }
        });
        return { info: info, rows: rows, lastLabel: prevLabel };
    }

    function parseSummary(pages, meet) {
        var out = [], label = null, lastInfo = { name: meet.name, year: meet.year };
        var lastName = null;
        pages.forEach(function (page) {
            var r = summaryPage(page, label, meet);
            if (!r) return;
            // 大会が変わったら、前のページの種別は引き継がない
            if (r.info.name && lastName !== null && r.info.name !== lastName) {
                r = summaryPage(page, null, meet);
            }
            if (r.info.name) lastName = r.info.name;
            label = r.lastLabel;
            if (r.info.name) lastInfo.name = r.info.name;
            if (r.info.year) lastInfo.year = r.info.year;
            if (r.info.date) lastInfo.date = r.info.date;
            r.rows.forEach(function (x) {
                var year = r.info.year || lastInfo.year || meet.year;
                out.push([x.date ? year + x.date : (r.info.date || lastInfo.date || meet.firstDate || ''), r.info.name || lastInfo.name, x.event, x.row.wind,
                    '決勝' + (x.category ? '【' + x.category + '】' : ''), '', x.row.rank, x.row.rec,
                    x.row.name, '', x.row.grade, x.row.team, '', x.sex, '', '']);
            });
        });
        return out;
    }

    // ---------------------------------------------------------------
    // メイン
    // ---------------------------------------------------------------
    function parse(pages) {
        var meet = findMeet(pages);
        var events = [];          // { title, sex, category, event, rounds: [{ round, date, heats: [{no, wind, rows}] }] }
        var warnings = [];
        var unreadable = [];
        var cur = { ev: null, round: null, skip: false, stopped: false, roundDates: {} };
        var bandRatio = null;
        var konseiDates = {};   // 混成競技の最終日

        function getRound(name) {
            var ev = cur.ev;
            var r = ev.rounds.filter(function (x) { return x.round === name; })[0];
            if (!r) {
                r = { round: name, heats: [], expect: null, date: '' };
                ev.rounds.push(r);
            }
            return r;
        }

        pages.forEach(function (page) {
            if (page.textChars < 20 && (page.pathOps > 300 || page.imageOps > 0)) { unreadable.push(page.num); return; }
            var lines = page.lines;
            var marks = [];
            var excluders = [];
            lines.forEach(function (L, idx) {
                if (isTitle(L, page)) { marks.push({ type: 'title', y: L.y, text: L.text }); return; }
                var rd = roundOf(L, page);
                if (rd) marks.push({ type: 'round', y: L.y, info: rd });
                var ts = L.words.map(function (w) { return w.t; });
                if (ts.indexOf('順位') >= 0 && (ts.indexOf('ﾅﾝﾊﾞｰ') >= 0 || ts.indexOf('ナンバー') >= 0)) marks.push({ type: 'header', y: L.y, idx: idx });
                L.words.forEach(function (w, wi) {
                    var m = w.t.match(/^(\d{1,3})組$/);
                    if (m) marks.push({ type: 'heat', y: L.y, x: w.x, no: parseInt(m[1], 10), line: L });
                    // 跳躍・投てきの予選の「Group A」「A組」→ 1組、「Group B」→ 2組
                    var g = null;
                    if (/^Group$/i.test(w.t) && L.words[wi + 1] && /^[A-Z]$/.test(L.words[wi + 1].t)) g = L.words[wi + 1].t;
                    else if (/^Group([A-Z])$/i.test(w.t)) g = w.t.slice(-1).toUpperCase();
                    else if (/^[A-ZＡ-Ｚ]組$/.test(w.t) && w.x < page.width * 0.6) g = C.zenToHanAscii(w.t.charAt(0));
                    if (g) marks.push({ type: 'heat', y: L.y, x: w.x, no: g.charCodeAt(0) - 64, line: L });
                });
                var sq = squash(norm(L.text));
                if (/^(凡例|ラップ表)/.test(sq)) marks.push({ type: 'end', y: L.y });
                // 「タイムレース上位8位」などの表：左端にあれば以降を読まない、右側にあればその下の表だけ除く
                L.words.forEach(function (w) {
                    if (!/上位\d+位$/.test(norm(w.t))) return;
                    if (w.x < page.width * 0.35) marks.push({ type: 'end', y: L.y });
                    else excluders.push({ y: L.y, x: w.x });
                });
            });
            marks.sort(function (a, b) { return a.y - b.y; });
            var rdates = roundDates(page);
            var heatLabels = marks.filter(function (m) { return m.type === 'heat'; });
            var pending = [];

            marks.forEach(function (m, mi) {
                if (m.type === 'title') {
                    var title = squash(m.text);
                    // 混成競技の各種目のページ・パラ種目は出力しない（1.php と同じ）
                    var isSub = /種競技./.test(norm(title)) && !/種競技$/.test(norm(title));
                    cur.skip = isSub || /パラ/.test(norm(title));
                    if (isSub) {
                        // 混成の各種目の日付 → 総合の日付（最終日）に使う（1.php と同じ）
                        var parent = norm(title).replace(/(種競技).*$/, '$1');
                        Object.keys(rdates).forEach(function (k) {
                            if (!konseiDates[parent] || rdates[k] > konseiDates[parent]) konseiDates[parent] = rdates[k];
                        });
                    }
                    if (!cur.ev || cur.ev.title !== title) {
                        var sp = splitKyogimei(title);
                        cur.ev = { title: title, sex: sp.sex, category: sp.category, event: eventName(sp.event),
                                   konsei: /種競技$/.test(norm(sp.event)), rounds: [], pages: [] };
                        if (!cur.skip) events.push(cur.ev);
                        cur.round = null;
                    }
                    cur.roundDates = rdates;
                    cur.stopped = false;
                    return;
                }
                if (!cur.ev || cur.skip) return;
                if (m.type === 'end') { cur.stopped = true; return; }
                if (m.type === 'round') {
                    if (cur.stopped) return;
                    cur.round = getRound(m.info.round);
                    if (m.info.heats && !cur.round.expect) cur.round.expect = m.info.heats;
                    return;
                }
                if (m.type !== 'header' || cur.stopped) return;
                if (!cur.round) cur.round = getRound(cur.ev.konsei ? '決勝' : '決勝');
                if (cur.ev.pages.indexOf(page.num) < 0) cur.ev.pages.push(page.num);
                var rd = cur.round;
                if (!rd.date) {
                    var key = norm(rd.round).match(ROUND_RE);
                    rd.date = (key && (cur.roundDates[key[1]] || rdates[key[1]])) || '';
                }

                var stopY = page.height + 1;
                for (var k = mi + 1; k < marks.length; k++) {
                    var t = marks[k].type;
                    if (t === 'title' || t === 'round' || t === 'end' || ((t === 'header' || t === 'heat') && marks[k].y > m.y + 16)) {
                        stopY = marks[k].y - 1;
                        break;
                    }
                }
                var blocks = findBlocks(page, lines[m.idx]);
                var kind = /跳|投|スロー/.test(cur.ev.event) ? 'field' : 'track';
                blocks.forEach(function (b) {
                    // 「上位8位」などの見出しの下にある表は、組の結果ではないので除く
                    if (excluders.some(function (e) { return e.y < m.y && m.y - e.y < 40 && e.x >= b.x0 - 30 && e.x < b.x1; })) return;
                    var region = lines.filter(function (L) { return L.y > b.hdrY + 1 && L.y < stopY; });
                    var label = heatLabels.filter(function (h) { return h.y < m.y && m.y - h.y < 30 && h.x >= b.x0 - 20 && h.x < b.x1; })
                        .sort(function (a, c) { return c.y - a.y; })[0];
                    var col = collectBlock(page, b, region);
                    if (!col.anchors.length) return;
                    // 風速（組の見出しの行、または表の上の行）
                    var heatWind = '';
                    lines.filter(function (L) { return L.y < m.y && m.y - L.y < 32; }).forEach(function (L) {
                        wordsIn(L, b.x0 - 20, b.x1).forEach(function (w) {
                            var wm = C.zenToHanAscii(w.t).match(/風[:：]?\s*([+\-±]?\d{1,2}\.\d)/);
                            if (wm) heatWind = wm[1];
                        });
                    });
                    var no = label ? label.no : 0;
                    var heat = rd.heats.filter(function (h) { return h.no === no; })[0];
                    if (!heat) { heat = { no: no, wind: heatWind, rows: [] }; rd.heats.push(heat); }
                    if (!heat.wind && heatWind) heat.wind = heatWind;
                    pending.push({ b: b, col: col, heat: heat, kind: kind, topY: b.hdrY + 1, bottomY: stopY });
                });
            });

            if (pending.length) {
                var asg = C.assignBandsPage(pending.map(function (p) {
                    return { anchorsY: p.col.anchors.map(function (a) { return a.y; }), words: p.col.others, topY: p.topY, bottomY: p.bottomY };
                }), bandRatio);
                if (asg.informative) bandRatio = asg.ratio;
                pending.forEach(function (p, i) {
                    blockRows(page, p.b, p.col.anchors, asg.bands[i], p.kind).forEach(function (r) { p.heat.rows.push(r); });
                });
            }
        });

        // 行の組み立て（1.php と同じ並び）
        var outRows = [];
        events.forEach(function (ev) {
            ev.rounds.forEach(function (rd) {
                var heats = rd.heats.filter(function (h) {
                    return h.rows.some(function (r) { return r.rank || r.rec || r.status; });
                }).sort(function (a, b) { return a.no - b.no; });
                var multi = heats.length > 1;
                if (ev.konsei && konseiDates[norm(ev.title)]) rd.date = konseiDates[norm(ev.title)];
                var date = rd.date ? meet.year + rd.date : '';
                if (!rd.date) {
                    var dk = meet.dates[titleKey(ev.title)];
                    date = dk ? meet.year + dk : meet.firstDate;
                }
                if (!date && heats.length) warnings.push({ type: 'date', message: ev.title + ' ' + rd.round + '：日付が見つかりませんでした。' });
                var race = rd.round + (ev.category ? '【' + ev.category + '】' : '');
                var isTrack = !/跳|投|スロー|種競技/.test(ev.event);
                heats.forEach(function (h, i) {
                    var heatNo = multi ? String(h.no || i + 1) : '';
                    h.rows.forEach(function (r) {
                        var rec = record(r.rec, ev.event);
                        if (!rec) rec = r.status;
                        var w = isTrack ? wind(h.wind || '') : (/走り幅跳び|三段跳び/.test(ev.event) ? wind(r.wind) : '');
                        var name = '', grade = '', aff1 = '', aff2 = '';
                        if (r.team && !r.name && !r.bib) {
                            aff1 = org(r.team);        // リレーはチーム名を所属1に
                        } else {
                            name = r.name; grade = r.grade;
                            aff1 = org(r.team); aff2 = org(r.pref);
                        }
                        outRows.push([date, meet.name, ev.event, w, race, heatNo,
                            nospace(C.zenToHanAscii(r.rank)), rec, name, '', grade, aff1, aff2, ev.sex, '', '']);
                    });
                });
                // 組の抜け
                var nos = heats.map(function (h) { return h.no; }).filter(function (n) { return n > 0; });
                var max = Math.max.apply(null, nos.concat([rd.expect || 0]));
                var missing = [];
                for (var n = 1; n <= max; n++) if (nos.length && nos.indexOf(n) < 0) missing.push(n);
                if (missing.length) warnings.push({ type: 'missing-heat', message: ev.title + ' ' + rd.round + '：' + missing.join('・') + '組が見つかりません。' });
            });
        });
        // 詳しい結果の表がない PDF（決勝一覧表・上位8位一覧だけの PDF）
        var summaryUsed = false;
        if (!outRows.length) {
            outRows = parseSummary(pages, meet);
            summaryUsed = outRows.length > 0;
            if (summaryUsed) {
                warnings = warnings.filter(function (w) { return w.type !== 'meet'; });
                events = [];
                var seenEv = {};
                outRows.forEach(function (r) { var k = r[1] + '|' + r[13] + '|' + r[2] + '|' + r[4]; if (!seenEv[k]) { seenEv[k] = 1; events.push(k); } });
            }
        }
        var gaijiPages = pages.filter(function (pg) { return pg.gaiji; }).map(function (pg) { return pg.num; });
        if (gaijiPages.length) {
            warnings.push({ type: 'gaiji', message: gaijiPages.join('・') + 'ページ目に、PDF の中で文字の情報がない特殊な文字（外字）があり、「〓」で表示しています。該当の氏名・所属を確認してください。' });
        }
        if (unreadable.length) {
            warnings.unshift({ type: 'unreadable', message: unreadable.join('・') + 'ページ目は、文字が図形・画像に変換されているため読み取れませんでした（表紙・広告などのページであれば問題ありません）。' });
        }
        if (!meet.name && !summaryUsed) warnings.push({ type: 'meet', message: '大会名が見つかりませんでした。' });
        return { meet: meet, events: events, rows: outRows, warnings: warnings, headers: HEADERS, summary: summaryUsed };
    }

    return {
        parse: parse, HEADERS: HEADERS, parseSummary: parseSummary,
        _test: { eventName: eventName, record: record, splitKyogimei: splitKyogimei, person: person, kanaAsk: kanaAsk }
    };
}));
