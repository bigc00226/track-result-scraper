/*
 * timetable.js  タイムテーブル（競技日程・競技順序）の PDF を読み取る
 *
 *   出力する項目（お客様ご指定）：日付・曜日／性別／競技開始時刻／種目／ラウンド／組
 *   招集時刻・参加数は出力しません。種別（中学・少年A・共通など）は【】で種目の後ろに付けます。
 *
 *   PDF によって表の作りが違うため、見出しの行から列の位置を決め、各行を読みます。
 *     ・見出しが 2～3段に分かれている表（「競技／開始／時間」）
 *     ・左右に 2つの表が並んでいる表（トラックと跳躍）
 *     ・同じ種目の組が時間帯に分かれている表（「1～3組 9:30」「4～6組 9:50」）
 *         → 時間帯ごとに 1行（お客様ご指定）
 *     ・招集の時間帯だけが分かれている表（開始時刻は 1つ） → 1行
 *     ・「〃」（上と同じ）
 *     ・複数の種目にまたがって書かれた開始時刻（セルの結合）
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./pdfcore.js'));
    } else {
        root.TimeTable = factory(root.PdfCore);
    }
}(typeof self !== 'undefined' ? self : this, function (C) {
    'use strict';

    var norm = C.normText, squash = C.squash;

    var RE_TIME = /^([0-2]?\d)[:：]([0-5]\d)$/;
    var RE_DATE = /(\d{1,2})(?:月|\/)(\d{1,2})日?\s*[(（]([日月火水木金土])/;
    var RE_RANGE = /^(\d{1,3})組?[～~〜\-－](\d{1,3})組?$/;
    var EVENT_RE = /^(?:[^\d\s]{0,6}\d+(?:\.\d+)?(?:m|M|km|K|ｍ)(?![a-z]{2})|\d[×xX]\d+|走高跳|棒高跳|走幅跳|三段跳|砲丸投|円盤投|ハンマー投|やり投|ジャベリックスロー|ジャベリック|[一二三四五六七八九十]種競技|混成|競歩)/;
    var ROUND_RE = /^(タイムレース決勝|タイムレース予選|タイムレース|ﾀｲﾑﾚｰｽ決勝|ﾀｲﾑﾚｰｽ|タイム決勝|TR決勝|準々決勝|準決勝|[A-DＡ-Ｄ]決勝|決勝|予選|記録会|オープン)/;
    var WEEK = '日月火水木金土';
    // 「タイムレース」だけの語・「3組タイムレース」（競技方法の列）
    var TR_WORD = /^(\d{1,3}組)?(タイムレース|ﾀｲﾑﾚｰｽ)$/;
    // 1文字ずつ離れて書かれることのある語（「男 子」「走 高 跳」「円 盤 投」）
    var LETTER_WORDS = /^(男子|女子|男女|決勝|予選|準決勝|走高跳|棒高跳|走幅跳|三段跳|砲丸投|円盤投|やり投|ハンマー投|競歩)$/;
    // 区分の題名（「トラック」「【フィールド競技】」「＜跳躍＞」）
    var TITLE_RE = /^[【《＜<◇◆■●〔\[（(]?(トラック|フィールド|跳躍|投てき|投擲)(競技|種目)?[】》＞>◇◆■〕\]）)]?$/;

    function hw(t) { return C.zenToHanAscii(t); }
    function minutes(t) { var m = hw(t).match(RE_TIME); return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null; }
    function cx(w) { return (w.x + w.x2) / 2; }

    // ---------------------------------------------------------------
    // 見出しの行
    // ---------------------------------------------------------------
    // 「種」「目」「投」「て」「き」のように 1文字ずつ離れて書かれた見出しを 1語にする
    var SPACED = ['競技種目', '種目', '種別', '順序', '性別', '跳躍', '投てき', '投擲', '招集時刻', '招集時間', '招集', '時刻', '時間', '競技日程'];
    function joinSpaced(words) {
        var out = [];
        for (var i = 0; i < words.length; i++) {
            var w = words[i];
            if (w.t.length === 1) {
                var t = w.t, k = i, last = w;
                // 「種　　目」のように大きく離れた 2文字の見出しもある
                while (k + 1 < words.length && words[k + 1].t.length === 1 &&
                       (words[k + 1].x - last.x2 < 30 || (k === i && SPACED.indexOf(t + words[k + 1].t) >= 0 && words[k + 1].x - last.x2 < 60)) &&
                       SPACED.some(function (h) { return h.indexOf(t + words[k + 1].t) === 0; })) {
                    k++; t += words[k].t; last = words[k];
                }
                if (k > i && SPACED.indexOf(t) >= 0) {
                    out.push({ t: t, x: w.x, x2: last.x2, y: w.y, fs: w.fs });
                    i = k;
                    continue;
                }
            }
            out.push(w);
        }
        return out;
    }

    // 種目の列の見出し（「トラック」「跳躍」「投てき」が種目の列の見出しになっている表もある）
    function isEventHeader(w) { return /^種目/.test(w.t) || /^(競技種目|競技名|種目名|トラック|フィールド|跳躍|投てき|投擲)$/.test(w.t); }

    // 列の役割（見出しの文字から）
    function roleOf(text) {
        var t = squash(norm(text));
        if (/予・準・決|予・決|予決|ラウンド/.test(t)) return 'round';       // 「予・準・決・人数・組」も
        if (/招集|集合|参加|人数|場所|ピット|通過|検査|記録|備考|エントリー|コール|ページ|表彰|地点|進出|条件/.test(t)) {
            if (/招集組/.test(t)) return 'slot';
            return 'ignore';
        }
        if (/競技開始|開始時刻|競技時間|競技時刻|開始時間|^時刻$|^開始$/.test(t)) return 'time';
        if (/組数|組-着|組[－\-ー‐]着/.test(t)) return 'heats';
        if (/^組$/.test(t)) return 'slot';
        if (/^(順序?|No\.?|NO\.?|№)$/.test(t)) return 'order';
        if (/^種目/.test(t) || /^(競技種目|競技名|種目名|トラック|フィールド|跳躍|投てき|投擲)$/.test(t)) return 'event';
        if (/種別|クラス/.test(t)) return 'class';
        if (/性別|^男女$/.test(t)) return 'gender';
        return 'other';
    }

    // 見出しの行の候補：「種目」があり、開始時刻の見出しが近くにある行
    function isTimeHeader(w) { return roleOf(w.t) === 'time' && /競技|時刻|時間/.test(w.t); }

    // 見出しの範囲の語（データの語：数字・時刻・種目名・性別・〃 は除く）
    function headerWord(w) {
        var t = hw(w.t);
        return !/\d/.test(t) && t !== '〃' && !/^(男|女)$/.test(t) && !/男子|女子/.test(t) && !EVENT_RE.test(t) &&
            !/^(予選|準決勝|決勝|タイムレース|タイムレース決勝|予|準|決)$/.test(t);
    }

    function findHeaders(page) {
        var out = [];
        page.lines.forEach(function (L, idx) {
            var ws = joinSpaced(L.words);
            var evs = ws.filter(isEventHeader);
            // 右の表に「種目」の見出しがない（「《走高跳/棒高跳》」など）場合は、「競技開始時刻」が 2つあることで左右の表を分ける
            var ths = ws.filter(isTimeHeader);
            if (evs.length && ths.length > evs.length) {
                var base = ths[0].x - evs[0].x;
                evs = ths.map(function (t) { return { t: '種目', x: t.x - base, x2: t.x2 - base, y: t.y, fs: t.fs }; });
            }
            if (!evs.length) return;
            // 見出しの範囲（上下 2段まで）の見出しの語。見出しと同じ高さに、左の表のデータが書かれていることもある
            var zw = [];
            var lx0 = Math.min.apply(null, ws.map(function (w) { return w.x; }));
            var lx1 = Math.max.apply(null, ws.map(function (w) { return w.x2; }));
            page.lines.forEach(function (Z) {
                if (Math.abs(Z.y - L.y) > 12) return;
                var zj = joinSpaced(Z.words);
                // 区分の題名だけの行（「トラック」「フィールド」）は見出しではない
                if (Z !== L && zj.every(function (w) { return TITLE_RE.test(w.t); })) return;
                // 見出しの下に時刻のある行は、見出しのすぐ下の種目の行（「10:45 小学女子 100ｍ 予選 1 組」）
                //   （横に並んだ別の表の種目の行は見ない）
                if (Z !== L && zj.some(function (w) { return RE_TIME.test(hw(w.t)) && cx(w) > lx0 - 20 && cx(w) < lx1 + 20; })) return;
                zj.forEach(function (w) { if (headerWord(w)) { w.ly = Z.y; zw.push(w); } });
            });
            var hdrWs = zw;
            // 左右に並んだ表：「種目」の数だけ表がある
            evs.sort(function (a, b) { return a.x - b.x; });
            var known = zw.filter(function (w) { return roleOf(w.t) !== 'other' || isEventHeader(w); });
            var firstX = Math.min.apply(null, (known.length ? known : ws).map(function (w) { return w.x; }));
            var lead = evs[0].x - firstX;
            // 各表の左端（見出しの語）と、表と表の境目（左の表の見出しの右端と、右の表の左端の中間）
            // 右の表の左端：左の表の最初の見出しの語（「順序」「集合」など）が、もう一度出てくる位置
            var firstW = known.filter(function (w) { return w.x === firstX; })[0];
            var lefts = evs.map(function (ev, i) {
                if (i === 0) return firstX;
                var again = firstW ? known.filter(function (w) { return w.t === firstW.t && w.x > evs[i - 1].x && w.x < ev.x; })
                    .sort(function (a, b) { return a.x - b.x; })[0] : null;
                if (again) return again.x;
                var approx = ev.x - lead;
                var near = hdrWs.filter(function (w) { return w.x >= approx - 12 && w.x <= ev.x; }).sort(function (a, b) { return a.x - b.x; })[0];
                return near ? near.x : approx;
            });
            var cuts = lefts.map(function (lx, i) {
                if (i === 0) return firstX - 20;
                var leftW = hdrWs.filter(function (w) { return w.x2 <= lx && w.x >= lefts[i - 1]; });
                var r = leftW.length ? Math.max.apply(null, leftW.map(function (w) { return w.x2; })) : lx - 12;
                return (r + lx) / 2;
            });
            evs.forEach(function (ev, i) {
                // 表の横の範囲（右側だけに書かれた見出しの表もある：「投擲」の表）
                var x0 = cuts[i];
                var x1 = i + 1 < evs.length ? cuts[i + 1] : page.width + 1;
                var inT = zw.filter(function (w) { return cx(w) >= x0 && cx(w) < x1; });
                var cols = buildColumns(inT);
                if (!cols.some(function (c) { return c.role === 'time'; })) return;
                out.push({ y: Math.max.apply(null, inT.map(function (w) { return w.ly; })), topY: L.y, x0: x0, x1: x1, cols: cols, idx: idx,
                           left: lefts[i] });
            });
        });
        return out;
    }

    // 見出しの語 → 列（上下に重なった語は 1つの列にまとめる：「競技／開始／時間」）
    function buildColumns(words) {
        var cols = [];
        words.slice().sort(function (a, b) { return a.y - b.y || a.x - b.x; }).forEach(function (w) {
            var c = cols.filter(function (k) { return Math.abs(k.x - w.x) < 8 || Math.abs(k.c - cx(w)) < 6; })[0];
            if (c) {
                if (c.text !== w.t) c.text += w.t;
                c.x = Math.min(c.x, w.x);
                c.x2 = Math.max(c.x2, w.x2);
            } else {
                cols.push({ text: w.t, x: w.x, x2: w.x2 });
            }
            (c || cols[cols.length - 1]).c = ((c || cols[cols.length - 1]).x + (c || cols[cols.length - 1]).x2) / 2;
        });
        cols.forEach(function (c) { c.role = roleOf(c.text); });
        // 開始時刻の列が 2つ以上ある場合（「開始」だけの列は招集の開始のことがある）は、はっきりした見出しの方
        var times = cols.filter(function (c) { return c.role === 'time'; });
        if (times.length > 1) {
            var score = function (c) { return (/競技/.test(c.text) ? 4 : 0) + (/開始/.test(c.text) ? 2 : 0) + (/時刻|時間/.test(c.text) ? 1 : 0); };
            var best = times.slice().sort(function (a, b) { return score(b) - score(a) || a.x - b.x; })[0];
            times.forEach(function (c) { if (c !== best) c.role = 'ignore'; });
        }
        return cols.sort(function (a, b) { return a.c - b.c; });
    }

    // 語 → いちばん近い列（数字だけの語はラウンド・種目の列に入れない）
    function columnOf(cols, w) {
        var c0 = cx(w);
        var ranked = cols.slice().sort(function (a, b) { return Math.abs(a.c - c0) - Math.abs(b.c - c0); });
        var t = hw(w.t);
        for (var i = 0; i < ranked.length && i < 2; i++) {
            var r = ranked[i].role;
            if (r === 'time' && !RE_TIME.test(t) && t !== '〃') continue;
            if ((r === 'round' || r === 'event' || r === 'gender') && /^\d{1,3}$/.test(t) && ranked[1]) continue;
            return ranked[i];
        }
        return ranked[0];
    }

    // ---------------------------------------------------------------
    // 1行の中身（種目・性別・種別・ラウンド・組）
    // ---------------------------------------------------------------
    var GENDER_WORD = /^(男女混合|男女|混合|男子|女子|男|女|男\/女|男・女)$/;
    var GENDER_IN = /(男女混合|男女|男子|女子)/;
    // 種目名の部分（前後に性別・種別・ラウンドがくっついている語「男一高5000m」「100m決勝」から取り出す）
    var EV_CORE = /(\d+(?:\.\d+)?(?:m|M|km)(?:[A-Za-z]{1,3})?(?:\([^)]*\))?|\d[×xX]\d{2,}m?R?(?:\([^)]*\))?|走高跳|棒高跳|走幅跳|三段跳|(?:砲丸投|円盤投|ハンマー投|やり投)(?:\([^)]*\))?|ジャベリックスロー|ジャベリック|[一二三四五六七八九十]種競技|競歩)/;
    // ⑧＝八種競技（男子）・⑦＝七種競技（女子）など
    var KONSEI_MARK = { '④': ['四種競技', ''], '⑤': ['五種競技', ''], '⑦': ['七種競技', '女子'], '⑧': ['八種競技', '男子'], '⑩': ['十種競技', '男子'] };
    var PIT_RE = /(ピット|ゾーン|バック|メイン|サークル)|^[A-Z]([･・,，\/][A-Z])*$/;

    function normGender(g) {
        if (!g) return '';
        if (/男女|混合/.test(g) || (/男/.test(g) && /女/.test(g))) return '男女';      // 「男/女」も
        return /男/.test(g) ? '男子' : '女子';
    }

    function normRound(r) {
        r = hw(r).replace(/ﾀｲﾑﾚｰｽ/g, 'タイムレース');
        if (r === 'TR決勝' || r === 'タイム決勝') return 'タイムレース決勝';
        return r;
    }

    // 「予7組3着＋3」「準3組2着＋2」「決勝」「予6組ﾀｲﾑ」
    function shortRound(t) {
        var s = hw(squash(t));
        var m = s.match(/^(予|準|決)(\d{1,3})組/);
        if (m) return { round: { '予': '予選', '準': '準決勝', '決': '決勝' }[m[1]], heats: parseInt(m[2], 10) };
        if (/^(予|準|決)$/.test(s)) return { round: { '予': '予選', '準': '準決勝', '決': '決勝' }[s], heats: null };
        if (/^タ決$/.test(s)) return { round: 'タイムレース決勝', heats: null };
        if (/^[A-Z]決$/.test(s)) return { round: s.charAt(0) + '決勝', heats: null };      // 「B決」「A決」
        if (/^タ予$/.test(s)) return { round: 'タイムレース予選', heats: null };
        return null;
    }

    function trRound(r) {
        if (!r || r === '決勝') return 'タイムレース決勝';
        if (r === '予選') return 'タイムレース予選';
        return r;
    }

    function parseDesc(words, prev) {
        var r = { gender: '', cls: '', event: '', round: '', heats: null, konsei: '' };
        // 「決」「勝」のように 1文字ずつ離れた語をつなぐ
        var ws = [];
        words.forEach(function (w) {
            var last = ws[ws.length - 1];
            if (last && /^(決|予|準)$/.test(last.t) && /^(勝|選)$/.test(w.t)) { last.t += w.t; return; }
            ws.push({ t: w.t, col: w.col });
        });
        var rest = [];
        var impliedGender = '';
        ws.forEach(function (w) {
            var t = hw(w.t).replace(/\s+/g, '').replace(/[※＊*]/g, '');
            if (!t) return;
            // 「※男女混合実施」などの注意書き
            if (/^※/.test(w.t) && t.length >= 3 && !EV_CORE.test(t)) return;
            var kt = C.hanToZenKana(t);
            if (PIT_RE.test(kt)) {                                            // ピット・ゾーン（「ﾊﾞｯｸA･B」「Bｿﾞｰﾝ」）
                var pg = t.match(/^(\d{1,2})組/);                               // 「1組BゾーンAピット（11名）」→ 1組
                if (pg && !r.heatNo) r.heatNo = parseInt(pg[1], 10);
                var kg = t.match(/[（(](\d+(?:\.\d+)?kg)[)）]/i);                // 「Bゾーン(2.721kg)」→ 砲丸投(2.721kg)
                if (kg) r.spec = '(' + kg[1] + ')';
                return;
            }
            // 人数「（９名）」、決勝進出の条件「上位８名決勝」「４着＋６」は出さない
            if (/^[（(]\d{1,3}名[)）]$/.test(t) || /^上位\d{1,3}(名|チーム)/.test(t) || /^\d{1,2}着[+＋]\d{1,2}$/.test(t)) return;
            // リレーのオーダー用紙の提出・締切の案内
            if (/オーダー|締切|締め切り/.test(t)) return;
            // 「タイムレース上位１５名」→ タイムレース
            if (/^(タイムレース|ﾀｲﾑﾚｰｽ)上位/.test(t)) { r.tr = true; return; }
            if (t === '〃') {
                var role = w.col ? w.col.role : 'round';
                if (role === 'gender') r.gender = prev ? prev.gender : '';
                else if (role === 'event') r.event = prev ? prev.event : '';
                else if (role === 'class') r.cls = prev ? prev.cls : '';
                else r.round = prev ? prev.round : '';
                return;
            }
            if (!r.gender && GENDER_WORD.test(t)) { r.gender = normGender(t); return; }
            // 種別と性別の 1文字が 1語になっている：「共男」「１女」「OP男」／「女共通」
            if (!r.gender && !isEventWord(t)) {
                var g1 = t.match(/^([^男女子\d\s]{1,3}|[1-6])(男|女)$/);
                if (g1) { r.gender = normGender(g1[2]); rest.push(g1[1] === '共' ? '共通' : /^[1-6]$/.test(g1[1]) ? g1[1] + '年' : g1[1]); return; }
                var g2 = t.match(/^(男|女)([^男女子\d\s]{1,4})$/);
                if (g2 && !ROUND_RE.test(norm(g2[2]))) { r.gender = normGender(g2[1]); rest.push(g2[2]); return; }
            }
            if (KONSEI_MARK[t]) { r.konsei = KONSEI_MARK[t][0]; impliedGender = KONSEI_MARK[t][1]; return; }
            if (/^(OP|オープン参加)$/i.test(t)) { r.open = true; return; }     // オープン参加の種目
            // 種別の列とラウンドの列の両方に「オープン」と書かれた行（「オープン 100ｍ オープン」）：種別の列の方は種別
            if (t === 'オープン' && w.col && w.col.role === 'class' &&
                ws.filter(function (x) { return hw(x.t) === 'オープン'; }).length > 1) { rest.push(t); return; }
            var sr = shortRound(t);
            if (!r.round && sr) { r.round = sr.round; if (sr.heats) r.heats = sr.heats; return; }
            // 組の数「4組3着+4」「3組」
            var hm = t.match(/^(\d{1,3})組([‐\-－―]?\d{1,2}着.*|ﾀｲﾑ.*|タイム.*)?$/);
            if (hm) {
                if (r.heats === null) r.heats = parseInt(hm[1], 10);
                if (!hm[2] && !r.heatNo) r.heatNo = parseInt(hm[1], 10);     // 「1組」だけの語（組の番号のこともある）
                if (hm[2] && /タイムレース|ﾀｲﾑﾚｰｽ/.test(hm[2])) r.tr = true;   // 「3組タイムレース」
                return;
            }
            // 種目名（前に性別・種別、後ろにラウンドがくっついていることがある）
            var em = r.event || /[《【\[＜<]/.test(kt) ? null : kt.replace(/ｍ/g, 'm').match(EV_CORE);
            if (em) {
                var pre = kt.slice(0, em.index), post = kt.slice(em.index + em[1].length);
                r.event = em[1];
                if (pre) {
                    var gp = pre.match(/^(男女混合|男女|男\/女|男・女|男子|女子|男|女)/);
                    if (gp && !r.gender) { r.gender = normGender(gp[1]); pre = pre.slice(gp[1].length); }
                    pre = pre.replace(/[-－・]+$/, '');
                    // 「四種100mH」「四種走高跳」→ 四種競技
                    var kp = pre.match(/([一二三四五六七八九十])種(競技)?$/);
                    if (kp && !r.konsei) { r.konsei = kp[1] + '種競技'; pre = pre.slice(0, kp.index); }
                    if (pre) rest.push(pre);
                }
                if (post) {
                    var pr = norm(post).match(ROUND_RE), ps = shortRound(post), ph = post.match(/^\(?([\d.・,]+)組\)?$/);
                    if (pr && pr[1] === norm(post)) r.round = r.round || normRound(pr[1]);
                    else if (ps) r.round = r.round || ps.round;
                    else if (ph) r.heatsLabel = ph[1].replace(/[.,]/g, '・') + '組';   // 「走幅跳（1.2組）」「走高跳1組」
                    else r.event += post;
                }
                return;
            }
            var rm = norm(t).match(ROUND_RE);
            // 「決勝」と、競技方法の列の「タイムレース」→ タイムレース決勝
            if (r.round && TR_WORD.test(t)) { r.tr = true; return; }
            if (!r.round && rm) { r.round = normRound(rm[1]); return; }
            if (rm && rm[1] === norm(t)) {                                      // 2つ目のラウンド（組の列の「決勝」など）
                if (r.round === 'タイムレース' && /^(決勝|予選)$/.test(rm[1])) { r.round = rm[1]; r.tr = true; }
                if (/^(決勝|予選)$/.test(r.round) && /^タイムレース(決勝|予選)$/.test(rm[1])) r.tr = true;   // 「決」「タイムレース決勝」
                return;
            }
            if (t === '組') return;
            if (/^[一二三四五六七八九十]種$/.test(t)) { r.konsei = t + '競技'; return; }
            if (/^\(.*\)$/.test(t) && r.event) { r.event += t; return; }      // 「(0.840m)」
            rest.push(t);
        });
        // 「中学男子」「少年男子共通」「成年少年男女混合」→ 性別と種別
        var cls = rest.join('');
        var gm = cls.match(GENDER_IN);
        if (gm) {
            if (!r.gender) r.gender = normGender(gm[1]);
            cls = cls.replace(gm[1], '');
        }
        cls = C.hanToZenKana(cls);
        //   「男子一般（１組）タイムレース」→ 種別「一般」・組「1組」・ラウンド「タイムレース決勝」
        var cm = cls.match(/[(（](\d{1,2})組[)）]/);
        if (cm) { r.heatsLabel = r.heatsLabel || cm[1] + '組'; cls = cls.replace(cm[0], ''); }
        if (/タイムレース/.test(cls)) {
            cls = cls.replace(/タイムレース/, '');
            r.round = /^タイムレース/.test(r.round) ? r.round : 'タイムレース' + (r.round || '決勝');
        }
        if (r.tr) r.round = trRound(r.round);
        if (r.spec && r.event && r.event.indexOf('(') < 0) r.event += r.spec;
        if (r.open) cls += '(OP)';
        r.cls = r.cls || cls.replace(/^[・･]+|[・･]+$/g, '').trim();
        r.genderWritten = !!r.gender;                  // PDF に性別が書かれている（⑧⑦から決めた性別ではない）
        if (!r.gender && impliedGender) r.gender = impliedGender;
        if (r.konsei) { r.event = r.konsei + ' ' + r.event; }
        r.event = r.event.replace(/[xX]/g, '×');
        return r;
    }

    // ---------------------------------------------------------------
    // 表の行を読む
    // ---------------------------------------------------------------
    // 1文字ずつ離れて書かれた語（「男 子」「走 高 跳」）を 1語にする（知っている語になる場合だけ）
    function joinLetters(ws) {
        var out = [];
        for (var i = 0; i < ws.length; i++) {
            var w = ws[i];
            if (w.t.length === 1 && !/[\d〃]/.test(w.t)) {
                var t = w.t, k = i, best = -1, bt = '';
                while (k + 1 < ws.length && ws[k + 1].t.length === 1 && ws[k + 1].x - ws[k].x2 < Math.max(6, (w.fs || 10) * 0.9)) {
                    k++;
                    t += ws[k].t;
                    if (LETTER_WORDS.test(t)) { best = k; bt = t; }
                }
                if (best > i) {
                    out.push({ t: bt, x: w.x, x2: ws[best].x2, y: w.y, fs: w.fs });
                    i = best;
                    continue;
                }
            }
            out.push(w);
        }
        return out;
    }

    // 「1 ～ 3 組」「4 組」のように分かれた組の語を 1語にする（項目名の行がない表）
    function joinRange(ws) {
        var FULL = /^(\d{1,3}組|\d{1,3}[～~〜]\d{1,3}組?)$/, PART = /^\d{1,3}([～~〜](\d{1,3}組?)?|組)?$/;
        var out = [];
        for (var i = 0; i < ws.length; i++) {
            var t = hw(ws[i].t).replace(/\s+/g, '');
            if (PART.test(t)) {
                var k = i, best = -1, bt = '';
                while (k + 1 < ws.length && ws[k + 1].x - ws[k].x2 < 16) {
                    var nt = t + hw(ws[k + 1].t).replace(/\s+/g, '');
                    if (!PART.test(nt)) break;
                    k++;
                    t = nt;
                    if (FULL.test(t)) { best = k; bt = t; }
                }
                if (best > i) {
                    out.push({ t: bt, x: ws[i].x, x2: ws[best].x2, y: ws[i].y, fs: ws[i].fs });
                    i = best;
                    continue;
                }
            }
            out.push(ws[i]);
        }
        return out;
    }

    function readTable(page, hdr, stopY) {
        var lines = page.lines.filter(function (L) { return L.y > hdr.y + 1 && L.y < stopY; });
        var rows = [];
        var ended = false;
        lines.forEach(function (L) {
            if (ended) return;
            var ws = joinLetters(L.words.filter(function (w) { return cx(w) >= hdr.x0 && cx(w) < hdr.x1; }));
            if (hdr.titled) ws = joinRange(ws);
            if (!ws.length) return;
            // 見出しの行（「競技開始時刻 《走幅跳・三段跳》 予・決 ピット」）は読まない
            if (ws.some(function (w) { return isTimeHeader(w) || /^(種目|予・決|予・準・決.*|ラウンド)$/.test(w.t); })) return;
            // 注意事項などの文章（「。」のある長い文、「※」で始まる行）は読まない（表の途中に書かれていることもある）
            if (ws.some(function (w) { return w.t.length >= 20 && /。/.test(w.t); }) || /^※/.test(ws[0].t) && ws.length > 1 && ws[1].t.length >= 15) return;
            var rec = { y: L.y, time: '', heatsTxt: '', slot: '', desc: [], order: '', text: false, numCols: {} };
            var slotWs = [];
            ws.forEach(function (w) {
                var col = columnOf(hdr.cols, w);
                var t = hw(w.t);
                // 種目名・性別・「OP」は、招集などの列の近くに書かれていても種目の内容として読む
                if (col.role === 'ignore' && ((/^(男|女)/.test(t) && isEventWord(t)) || GENDER_WORD.test(t) || /^OP$/i.test(t))) {
                    col = hdr.cols.filter(function (c) { return c.role === 'event'; })[0] || col;
                }
                // 「競技終了」「開始式」などの行は、時刻だけの行（次の時間帯）ではない
                if (/競技終了|終了予定|開始式|開会式|閉会式|表彰式|休憩|昼休|オーダー|受付/.test(t)) rec.text = true;
                // 時刻・組・数字・記号以外の文字がある行（「秩父宮章授与式」など。備考・招集などの列は見ない）
                //   ピット・ゾーン（「A/B」「Aピット」）は種目の続きの行にも書かれる
                //   「タイムレース」「3組タイムレース」（競技方法の列）は、時間帯の行にも書かれる
                if (col.role !== 'ignore' && TR_WORD.test(squash(t))) rec.tr = true;
                if (col.role !== 'ignore' && !/^[\d:：～~〜\-－+＋×組着〃()（）\s]+$/.test(t) &&
                    !/^[A-Z]{1,2}([\/・][A-Z]{1,2})*(ピット|ゾーン)?$/.test(t) && !/ピット|ゾーン/.test(t) && !TR_WORD.test(squash(t))) rec.text = true;
                // 数字だけの語がある列（人数・組など。種目の行とその下の行が、同じ列に数字を持つかを見る）
                if (/^\d{1,3}$/.test(t) && col.role !== 'order' && col.role !== 'time') rec.numCols[hdr.cols.indexOf(col)] = true;
                var rg = t.replace(/\s+/g, '').match(RE_RANGE);
                //   組-着の列の「1－8」（1組・8着まで）は範囲ではない
                if (rg && col.role === 'heats' && /[\-－‐]/.test(t)) rg = null;
                if (rg && col.role !== 'time') { rec.slot = rec.slot || (rg[1] + '～' + rg[2]); rec.hadRange = true; return; }
                if (col.role === 'time') { if (RE_TIME.test(t) && !rec.time) rec.time = t.replace('：', ':'); else if (t === '〃') rec.time = '〃'; return; }
                // 組の列：数字のある語だけ（「決勝」などが組の列の近くに書かれている表もある）
                //   ピット・ゾーン・人数の語（「1組BゾーンAピット（11名）」「Bゾーン(2.721kg)」）は、組の列の近くにあっても種目の内容として読む
                var pitW = PIT_RE.test(C.hanToZenKana(t)) || /名[)）]?$/.test(t);
                if (col.role === 'slot' && !pitW && (/\d/.test(t) || /^[～~〜組]$/.test(t))) { slotWs.push(w); return; }
                if (col.role === 'heats' && !pitW && (/\d/.test(t) || t === '組')) { rec.heatsTxt += t; if (/TR|ＴＲ|タイムレース/i.test(t)) rec.tr = true; return; }
                if (col.role === 'order' && /^\d/.test(t)) { rec.order += t; return; }
                if (col.role === 'order' && /^[A-Za-z]{1,3}$/.test(t)) return;        // 「OP」（オープン種目の印）
                if (col.role === 'ignore') return;
                if (RE_TIME.test(t)) return;                   // 招集などの時刻
                if (/^\d{1,3}$/.test(t)) return;               // 順序・人数などの数字だけの語（種別・種目には入らない）
                w.col = col;
                rec.desc.push(w);
            });
            // 招集組の列：「1 ～ 3」のように分かれた語
            if (!rec.slot && slotWs.length) {
                var st = slotWs.map(function (w) { return hw(w.t); }).join('').replace(/\s+/g, '');
                var sm = st.match(RE_RANGE);
                if (sm) rec.slot = sm[1] + '～' + sm[2];
                else if (/^\d{1,3}組?$/.test(st)) rec.slot = st.replace('組', '');
            }
            rec.slotRaw = slotWs.map(function (w) { return hw(w.t); }).join('').replace(/\s+/g, '');
            rows.push(rec);
        });
        // 「組」だけの見出しの列：範囲（「1～3」）が 1つもなければ、組の数の列（「3」「1」）
        var slotCol = hdr.cols.filter(function (c) { return c.role === 'slot' && squash(c.text) === '組'; })[0];
        if (slotCol && !rows.some(function (r) { return r.hadRange || /[～~〜]/.test(r.slotRaw || ''); })) {
            rows.forEach(function (r) {
                if (r.slotRaw && /^\d{1,3}$/.test(r.slotRaw) && !r.heatsTxt) { r.heatsTxt = r.slotRaw; r.slot = ''; }
            });
        }
        return rows;
    }

    // 種目名を含む語（「男走高跳」「女4×100mR」のように前に性別・種別がくっついた語も）
    function isEventWord(t) {
        var kt = C.hanToZenKana(hw(t)).replace(/ｍ/g, 'm').replace(/[※＊*]/g, '');
        if (EVENT_RE.test(kt)) return true;
        if (/^[(（《【\[＜<]/.test(kt) || /[《【\[＜<]/.test(kt)) return false;
        return EV_CORE.test(kt) && !PIT_RE.test(kt);
    }

    function hasEvent(r) {
        return r.desc.some(function (w) { return isEventWord(w.t); });
    }

    function rangeOf(s) {
        var m = /^(\d{1,3})(?:～(\d{1,3}))?$/.exec(s || '');
        return m ? { a: parseInt(m[1], 10), b: parseInt(m[2] || m[1], 10) } : null;
    }

    // 行 → 種目ごとの時間帯
    //   carry：前のページから続く種目（「…～80組」の次のページが「81組～」から始まる表）
    function heatNo(r) {
        var s = /^\d{1,3}$/.test(r.slot || '') ? r.slot : hw(r.heatsTxt || '');
        return /^\d{1,3}$/.test(s) ? parseInt(s, 10) : 0;
    }

    // 1組ごとに 1行で、開始時刻は最初の組の行だけに書かれている表か
    //   （時刻のない行が、すぐ上の行と同じ種目で、組の番号が 1つ多い）
    function perHeatRows(rows) {
        var key = function (r) { return r.desc.map(function (w) { return w.t; }).join('|'); };
        for (var i = 1; i < rows.length; i++) {
            var a = rows[i - 1], b = rows[i], na = heatNo(a), nb = heatNo(b);
            if (!b.time && na && nb === na + 1 && b.y - a.y < 20 && a.desc.length && key(a) === key(b)) return true;
        }
        return false;
    }

    function buildEntries(rows, carry, topAligned) {
        var onlyDitto = function (r) { return r.desc.length && r.desc.every(function (w) { return w.t === '〃'; }); };
        // 種目のセルが上下 2行に折り返し、時刻・性別などは真ん中の行にある
        //   （「５・６年生男女混合」／「23 男女 決勝 タイムレース 3組 15:15」／「４×１００ｍリレー」）
        rows.forEach(function (r) {
            if (!r.time || r.slot || hasEvent(r) || !r.desc.length || onlyDitto(r) || Object.keys(r.numCols).length) return;
            var nb = rows.filter(function (o) {
                return o !== r && !o.wrapped && Math.abs(o.y - r.y) <= 8 && !o.time && !o.slot && !o.order && !o.heatsTxt &&
                    !Object.keys(o.numCols).length && o.desc.length && !onlyDitto(o);
            });
            if (!nb.some(hasEvent)) return;
            nb.forEach(function (o) { o.wrapped = true; });
            var desc = [];
            nb.filter(function (o) { return o.y < r.y; }).forEach(function (o) { desc = desc.concat(o.desc); });
            desc = desc.concat(r.desc);
            nb.filter(function (o) { return o.y > r.y; }).forEach(function (o) { desc = desc.concat(o.desc); });
            r.desc = desc;
        });
        rows = rows.filter(function (r) { return !r.wrapped; });
        // 「タイムレース」「3組タイムレース」だけの行（競技方法のセル）は、中の行ではない
        var trOnly = function (r) {
            return r.desc.length && r.desc.every(function (w) { var t = squash(hw(w.t)); return TR_WORD.test(t) || /^\d{1,3}組$/.test(t); }) &&
                r.desc.some(function (w) { return TR_WORD.test(squash(hw(w.t))); });
        };
        // 種目のない行で、性別・種別と自分の数字（人数・組）か時刻がある行（「男子 1 7」「27 男子 中学1年 1 8」）
        //   → 上下の種目の行の「中の 1行」（同じ種目・時刻で、性別・種別が違う）
        //   組と人数だけの行（「A 1組 20」：ピットごとの組）も、中の 1行
        var subRows = rows.filter(function (r) {
            if (hasEvent(r) || trOnly(r)) return false;
            if (r.desc.length && !onlyDitto(r) && (Object.keys(r.numCols).length || r.time)) return true;
            return !r.desc.length && !r.time && /^\d{1,3}$/.test(r.slot || '') && Object.keys(r.numCols).length > 0;
        });
        rows = rows.filter(function (r) { return subRows.indexOf(r) < 0; });
        // 2行に折り返したセル（「成年少年」／「女子共通」が種目の行の上下にある）は、種目の行にまとめる
        var evRows = rows.filter(hasEvent);
        rows = rows.filter(function (r) {
            if (hasEvent(r) || r.time || r.slot || !r.desc.length) return true;
            if (onlyDitto(r)) return true;
            var near = null;
            evRows.forEach(function (e) { if (Math.abs(e.y - r.y) <= 8 && (!near || Math.abs(e.y - r.y) < Math.abs(near.y - r.y))) near = e; });
            if (!near) return true;
            (r.y < near.y ? near.above = near.above || [] : near.below = near.below || []).push.apply(r.y < near.y ? near.above : near.below, r.desc);
            return false;
        });
        rows.forEach(function (r) {
            if (r.above || r.below) r.desc = (r.above || []).concat(r.desc, r.below || []);
        });
        var events = [], prev = null;
        rows.forEach(function (r) {
            // 「〃」だけの行（種目の列も「〃」）は、上の種目の次の時間帯
            var d = r.desc.length && !onlyDitto(r) ? parseDesc(r.desc, prev) : null;
            if (d && d.event) {
                var hm = hw(r.heatsTxt).match(/^(\d{1,3})/);
                var ev = {
                    y: r.y, gender: d.gender, cls: d.cls, event: d.event, round: d.round,
                    heats: hm ? parseInt(hm[1], 10) : d.heats, heatsLabel: d.heatsLabel || '', genderWritten: d.genderWritten,
                    time: r.time === '〃' ? (prev ? prev.time : '') : r.time,
                    slot: r.slot, slots: [], order: r.order, numCols: r.numCols, subs: [], heatMark: !!r.heatsTxt,
                    heatNo: d.heatNo || (/^\d{1,3}組$/.test(hw(r.heatsTxt)) ? parseInt(hw(r.heatsTxt), 10) : 0), tr: !!(d.tr || r.tr)
                };
                events.push(ev);
                prev = ev;
                r.ev = ev;
            } else if (r.time && r.time !== '〃' && !r.text) {
                // 時刻だけの行（「〃」はあってもよい）。「13:00 秩父宮章授与式」のような行は種目ではない
                r.timeOnly = true;
            }
        });
        // 中の行を、いちばん近い種目の行（8pt 以内）に付ける
        //   離れている行は、種目の行を中心に上下に同じ数だけ並んだまとまり（種目名のセルが何行にもまたがる表）
        var orphans = [];
        subRows.forEach(function (r) {
            var near = null;
            events.forEach(function (e) { if (Math.abs(e.y - r.y) <= 8 && (!near || Math.abs(e.y - r.y) < Math.abs(near.y - r.y))) near = e; });
            if (near) near.subs.push(r); else orphans.push(r);
        });
        if (orphans.length) {
            events.forEach(function (e) {
                var up = orphans.filter(function (o) { return o.y < e.y && !o.owner; }).sort(function (a, b) { return b.y - a.y; });
                var dn = orphans.filter(function (o) { return o.y > e.y && !o.owner; }).sort(function (a, b) { return a.y - b.y; });
                for (var k = 0; k < up.length && k < dn.length; k++) {
                    var a = up[k], b = dn[k];
                    if (events.some(function (x) { return x !== e && x.y > a.y && x.y < b.y; })) break;
                    if (Math.abs((a.y + b.y) / 2 - e.y) > 4) break;
                    a.owner = b.owner = e;
                    e.subs.push(a, b);
                }
            });
        }
        events.forEach(function (e) {
            e.subs.sort(function (a, b) { return a.y - b.y; });
            if (!e.time) {
                var st = e.subs.filter(function (r) { return r.time && r.time !== '〃'; })[0];
                if (st) e.time = st.time;
            }
        });
        if (topAligned) {
            // 1組ごとに 1行の表（「小学男子 100m 予選 1組」「〃 2組」…）：時刻のない次の組の行は、上の行にまとめて「5組」
            var kept = [], cur = null;
            events.forEach(function (e) {
                var n = heatNo(e);
                if (cur && !e.time && !e.subs.length && n && cur.lastHeat && n === cur.lastHeat + 1 && e.y - cur.lastY < 20 &&
                    [e.gender, e.cls, e.event, e.round].join('|') === [cur.gender, cur.cls, cur.event, cur.round].join('|')) {
                    cur.lastHeat = n; cur.lastY = e.y;
                    return;
                }
                e.firstHeat = e.lastHeat = n; e.lastY = e.y;
                cur = e;
                kept.push(e);
            });
            kept.forEach(function (e) {
                if (e.lastHeat <= e.firstHeat) return;
                if (e.firstHeat === 1) { e.heats = e.lastHeat; e.slot = ''; }
                else e.slot = e.firstHeat + '～' + e.lastHeat;
            });
            events = kept;
            // 時刻のセルは上そろえ（時刻は最初の行だけに書かれている）：時刻のない種目は、すぐ上の種目と同じ時刻
            //   （「休憩」などの行をはさんだ種目は除く）
            var lastEv = null;
            events.forEach(function (e) {
                if (!e.time && lastEv && lastEv.time && e.y - lastEv.lastY < 20 &&
                    !rows.some(function (r) { return !r.ev && r.y > lastEv.lastY + 1 && r.y < e.y - 1; })) {
                    e.time = lastEv.time;
                    e.merged = true;
                    e.lastY = e.y;
                }
                lastEv = e;
            });
        }
        // 同じ種目が組ごとに何行かに分かれ、行ごとに開始時刻がある（「100m 1組～4組」「5組～8組」…、「10000m 1組」「2組」「3組」）
        //   → 行ごとに組の番号（「1～4組」「1組」）。ラウンド・「タイムレース」が真ん中の行だけに書かれている表もある
        var marker = function (e) {
            var g = rangeOf(e.slot);
            if (g) return g;
            return e.heatNo ? { a: e.heatNo, b: e.heatNo } : null;
        };
        for (var ci = 0; ci < events.length;) {
            var run = [events[ci]], m0 = marker(events[ci]);
            if (m0 && m0.a === 1 && events[ci].time && !events[ci].subs.length) {
                for (var cj = ci + 1, lastM = m0; cj < events.length; cj++) {
                    var e2 = events[cj], p2 = events[cj - 1], m2 = marker(e2);
                    if (!m2 || !e2.time || e2.subs.length || m2.a !== lastM.b + 1 || e2.y - p2.y > 40 ||
                        e2.event !== p2.event || e2.gender !== p2.gender || e2.cls !== p2.cls ||
                        (e2.round && p2.round && e2.round.replace('タイムレース', '') !== p2.round.replace('タイムレース', ''))) break;
                    run.push(e2);
                    lastM = m2;
                }
            }
            if (run.length > 1) {
                var rnd = run.map(function (e) { return e.round; }).filter(Boolean).sort(function (a, b) { return b.length - a.length; })[0] || '';
                var anyTr = run.some(function (e) { return e.tr; });
                run.forEach(function (e) {
                    var m = marker(e);
                    e.chainLabel = (m.a === m.b ? m.a : m.a + '～' + m.b) + '組';
                    if (!e.round || rnd.indexOf(e.round) > 0) e.round = rnd;
                    if (anyTr) e.tr = true;
                });
            }
            ci += run.length;
        }
        // 時刻だけの行（同じ種目の次の時間帯、または複数の種目にまたがる開始時刻）
        var timeLines = rows.filter(function (r) { return r.timeOnly; });
        var foreign = [];
        // (1) 組の番号が続いている行（「1組～4組」「5組～8組」…）は同じ種目
        //     種目の行が組の途中に書かれている表（種目名のセルが上下の時間帯にまたがる）にも対応
        var items = [];
        events.forEach(function (e) { var g = rangeOf(e.slot); if (g && e.time) items.push({ y: e.y, a: g.a, b: g.b, ev: e }); });
        timeLines.forEach(function (t) { var g = rangeOf(t.slot); if (g) items.push({ y: t.y, a: g.a, b: g.b, t: t }); });
        items.sort(function (p, q) { return p.y - q.y; });
        var chains = [], cur = null;
        items.forEach(function (it) {
            if (cur && it.a === cur.b + 1 && !(it.ev && cur.ev) && it.y - cur.lastY < 80) {
                cur.items.push(it); cur.b = it.b; cur.lastY = it.y;
                if (it.ev) cur.ev = it.ev;
            } else {
                cur = { items: [it], a: it.a, b: it.b, ev: it.ev || null, lastY: it.y };
                chains.push(cur);
            }
        });
        chains.forEach(function (ch, ci) {
            var ts = ch.items.filter(function (it) { return it.t; });
            if (!ts.length || (ch.items.length < 2 && !ch.ev)) return;
            var owner = ch.ev;
            var y0 = ch.items[0].y, y1 = ch.items[ch.items.length - 1].y;
            // 前のページからの続き（この表で最初の時間帯が、前の種目の続きの番号から始まる）
            if (!owner && ci === 0 && carry && carry.ev && ch.a === carry.b + 1 && !events.some(function (e) { return e.y < y0; })) {
                ts.forEach(function (it) {
                    it.t.done = true;
                    foreign.push({ time: it.t.time, gender: carry.ev.gender, genderWritten: carry.ev.genderWritten, cls: carry.ev.cls, event: carry.ev.event, round: carry.ev.round,
                                   heats: it.t.slot + '組', y: it.y });
                });
                carry.b = ch.b;
                return;
            }
            if (!owner) {
                var mid = (y0 + y1) / 2, best = null;
                events.forEach(function (e) {
                    if (e.time || e.y < y0 - 8 || e.y > y1 + 8) return;
                    if (!best || Math.abs(e.y - mid) < Math.abs(best.y - mid)) best = e;
                });
                owner = best;
            }
            if (!owner) return;
            ts.forEach(function (it) { it.t.done = true; owner.slots.push({ y: it.y, time: it.t.time, slot: it.t.slot }); if (it.t.tr) owner.tr = true; });
            ch.owner = owner;
        });
        chains.forEach(function (ch) { if (ch.owner) carry.ev = ch.owner, carry.b = ch.b; });
        timeLines.forEach(function (t) {
            if (t.done) return;
            var above = null, below = null;
            events.forEach(function (e) {
                if (e.y < t.y && (!above || e.y > above.y)) above = e;
                if (e.y > t.y && (!below || e.y < below.y)) below = e;
            });
            // 複数の種目にまたがる開始時刻（セルの結合）：上下の種目に時刻がなく、時刻がそのまとまりの真ん中にある
            //   種目の上下に中の行がある場合は、中の行も含めた高さで真ん中を見る。いちばん多くの種目がそろうまとまり
            if (!t.slot && above && below && !above.time && !below.time) {
                var top = function (e) { return e.subs.length ? Math.min(e.y, e.subs[0].y) : e.y; };
                var bot = function (e) { return e.subs.length ? Math.max(e.y, e.subs[e.subs.length - 1].y) : e.y; };
                var ia0 = events.indexOf(above), ib0 = events.indexOf(below), best = null;
                for (var ia = ia0; ia >= 0 && !events[ia].time; ia--) {
                    for (var ib = ib0; ib < events.length && !events[ib].time; ib++) {
                        if (Math.abs((top(events[ia]) + bot(events[ib])) / 2 - t.y) < 4 && (!best || ib - ia > best[1] - best[0])) best = [ia, ib];
                    }
                }
                if (best) {
                    for (var bi = best[0]; bi <= best[1]; bi++) { events[bi].time = t.time; events[bi].merged = true; }
                    return;
                }
            }
            // 同じ種目の次の時間帯：上の種目に開始時刻があれば、その種目の続き
            var owner = null;
            // （種目のすぐ下に続く行だけ。表の下の「オーダー提出締切 15:05」などは除く）
            var lastY = above ? Math.max.apply(null, [above.y].concat(above.slots.map(function (x) { return x.y; }))) : 0;
            if (above && above.time && !above.merged) owner = t.y - lastY <= 30 ? above : null;
            else if (above && below && !below.time) owner = (t.y - above.y <= below.y - t.y) ? above : below;
            else if (below && !below.time && !above) owner = below;
            else if (above && !above.time) owner = above;
            if (owner) { owner.slots.push({ y: t.y, time: t.time, slot: t.slot }); if (t.tr) owner.tr = true; }
        });
        // 同じ組で走る何行かの真ん中に「1組」と書かれ、開始時刻はそのまとまりの 1行だけに書かれている表
        //   → 印を中心に上下にそろった行のまとまりに、時刻のある行が 1つだけなら、ほかの行もその時刻
        var markYs = [];
        rows.forEach(function (r) { if (r.heatsTxt && !r.time && !r.desc.length && !r.ev) markYs.push(r.y); });
        events.forEach(function (e) { if (e.heatMark) markYs.push(e.y); });
        if (events.some(function (e) { return !e.time; })) {
            markYs.forEach(function (y) {
                var ia, ib, grp;
                var on = events.filter(function (e) { return Math.abs(e.y - y) < 2; })[0];
                if (on) { ia = ib = events.indexOf(on); grp = [on]; }
                else {
                    var a = null, b = null;
                    events.forEach(function (e) {
                        if (e.y < y && (!a || e.y > a.y)) a = e;
                        if (e.y > y && (!b || e.y < b.y)) b = e;
                    });
                    if (!a || !b || Math.abs((a.y + b.y) / 2 - y) > 3) return;
                    ia = events.indexOf(a); ib = events.indexOf(b); grp = [a, b];
                }
                var timed = function (list) { return list.filter(function (e) { return e.time; }); };
                if (timed(grp).length > 1) return;
                while (ia - 1 >= 0 && ib + 1 < events.length) {
                    var pa = events[ia - 1], pb = events[ib + 1];
                    if (Math.abs((pa.y + pb.y) / 2 - y) > 3 || timed(grp.concat([pa, pb])).length > 1) break;
                    grp.push(pa, pb); ia--; ib++;
                }
                var t = timed(grp);
                if (t.length !== 1) return;
                grp.forEach(function (e) { if (!e.time) { e.time = t[0].time; e.merged = true; } });
            });
        }
        // 3行以上にまたがる開始時刻：時刻のある種目の上下に、時刻のない種目が同じ数だけある
        events.forEach(function (e, i) {
            if (!e.time) return;
            for (var k = 1; i - k >= 0 && i + k < events.length; k++) {
                var a = events[i - k], b = events[i + k];
                if (a.time || b.time || a.slots.length || b.slots.length) break;
                if (Math.abs((a.y + b.y) / 2 - e.y) > 4) break;
                a.time = b.time = e.time;
            }
        });
        // 時間帯に分ける
        var out = [];
        events.forEach(function (e, ei) {
            // 中の行がある種目：1行ずつ（性別・種別が違う）。種目の行も、中の行と同じ列に数字があれば 1行
            if (e.subs.length) {
                var own = Object.keys(e.numCols).some(function (k) { return e.subs.some(function (r) { return r.numCols[k]; }); });
                var recs = e.subs.map(function (r) {
                    var d = parseDesc(r.desc, null);
                    var hm2 = hw(r.heatsTxt).match(/^(\d{1,3})/);
                    return { y: r.y, gender: d.gender, genderWritten: d.genderWritten, cls: d.cls, heats: hm2 ? parseInt(hm2[1], 10) : d.heats, slot: r.slot,
                             time: r.time && r.time !== '〃' ? r.time : '' };
                });
                if (own) recs.push({ y: e.y, gender: e.gender, genderWritten: e.genderWritten, cls: e.cls, heats: e.heats, slot: e.slot, time: e.time, self: true });
                recs.sort(function (a, b) { return a.y - b.y; });
                var gs = recs.map(function (r) { return r.gender; }).filter(function (g, i, a) { return g && a.indexOf(g) === i; });
                recs.forEach(function (r) {
                    var heats = '';
                    if (r.heats && r.heats > 1) heats = r.heats + '組';
                    else if (r.heats !== 1 && /^\d{1,3}$/.test(r.slot || '')) heats = r.slot + '組';
                    else if (!r.self && !r.heats && e.heats > 1) heats = e.heats + '組';
                    // その行に書かれた時刻・性別は「own」。種目の行から引き継いだものは、あとで上下の行の値に置き換えることがある
                    var ownTime = !!(r.time || (r.self && e.time && !e.merged));
                    out.push({ grp: ei, time: r.time || e.time, ownTime: ownTime, gender: r.gender || e.gender || (gs.length === 1 ? gs[0] : ''),
                               ownGender: !!r.gender, genderWritten: !!(r.genderWritten || (!r.gender && e.genderWritten)),
                               cls: r.cls || e.cls, event: e.event, round: e.tr ? trRound(e.round) : e.round, heats: heats, y: r.y });
                });
                return;
            }
            var slots = [];
            if (e.time) slots.push({ y: e.y, time: e.time, slot: e.slot });
            e.slots.forEach(function (s) { slots.push(s); });
            slots.sort(function (a, b) { return a.y - b.y; });
            if (!slots.length) slots.push({ y: e.y, time: '', slot: '' });
            var multi = slots.length > 1;
            slots.forEach(function (s) {
                var heats = '';
                if (multi) heats = s.slot ? s.slot + '組' : '';
                else if (e.chainLabel) heats = e.chainLabel;
                else if (e.heats && e.heats > 1) heats = e.heats + '組';
                else if (e.heats === 1) heats = '';
                else if (/^\d{1,3}$/.test(s.slot || '')) heats = s.slot + '組';     // 組ごとに行が分かれている表（「5000m ＴＲ決勝 1」）
                else if (/^1～(\d{1,3})$/.test(s.slot || '')) heats = s.slot.replace(/^1～/, '') + '組';   // 「1～3」→ 3組
                else if (s.slot) heats = s.slot + '組';
                if (!heats && !multi && e.heatsLabel) heats = e.heatsLabel;
                out.push({ grp: ei, time: s.time, ownTime: !!s.time && !e.merged, gender: e.gender, ownGender: !!e.gender, genderWritten: e.genderWritten,
                           cls: e.cls, event: e.event, round: e.tr ? trRound(e.round) : e.round, heats: heats, y: s.y });
            });
        });
        // 開始時刻のない行（または種目の行から引き継いだだけの行）：その行に時刻が書かれた行の上下に、同じ数だけ並んでいれば
        //   その時刻（時刻のセルが何行にもまたがる表）
        out.sort(function (a, b) { return a.y - b.y; });
        //   置き換えるのは、時刻のない行か、同じ種目の行から引き継いだだけの行
        var soft = function (x, seed) { return !x.time || (x.ownTime === false && x.grp === seed.grp); };
        out.forEach(function (e, i) {
            if (!e.time || !e.ownTime || e.filled) return;
            for (var k = 1; i - k >= 0 && i + k < out.length; k++) {
                var a = out[i - k], b = out[i + k];
                if (!soft(a, e) || !soft(b, e) || a.filled || b.filled || Math.abs((a.y + b.y) / 2 - e.y) > 4) break;
                a.time = b.time = e.time;
                a.filled = b.filled = true;
            }
        });
        // 性別も同じ（男子・女子の両方が書かれている表だけ。性別が空欄＝男子の表もあるため）
        var gset = {};
        out.forEach(function (e) { if (e.gender && e.genderWritten) gset[e.gender] = true; });
        if (gset['男子'] && gset['女子']) {
            var softG = function (x, seed) { return !x.gender || (!x.ownGender && x.grp === seed.grp); };
            out.forEach(function (e, i) {
                if (!e.gender || !e.ownGender) return;
                for (var k = 1; i - k >= 0 && i + k < out.length; k++) {
                    var a = out[i - k], b = out[i + k];
                    if (!softG(a, e) || !softG(b, e) || (a.gender && b.gender) || Math.abs((a.y + b.y) / 2 - e.y) > 4) break;
                    a.gender = e.gender;
                    if (!b.gender) b.gender = e.gender;
                    a.genderWritten = b.genderWritten = true;
                }
            });
        }
        return foreign.concat(out);
    }

    // ---------------------------------------------------------------
    // 日付
    // ---------------------------------------------------------------
    function dateOf(L) {
        var s = hw(squash(L.text));
        var m = s.match(RE_DATE);
        if (!m) return null;
        // 見出しのような短い行（「10月15日（木） 第１日」「期日 2026年9月27日（日）」）
        if (L.words.length > 6) return null;
        return parseInt(m[1], 10) + '月' + parseInt(m[2], 10) + '日（' + m[3] + '）';
    }

    // 1行に日付が 2つ以上ある（左右に並んだ 2日分の表：「1日目 10月3日（土）　2日目 10月4日（日）」）→ 日付ごとの左端
    function datesOf(L) {
        if (L.words.length > 6) return [];
        var s = '', xs = [];
        L.words.forEach(function (w) {
            var t = hw(squash(w.t));
            for (var i = 0; i < t.length; i++) xs.push(w.x);
            s += t;
        });
        var re = new RegExp(RE_DATE.source, 'g'), m, out = [];
        while ((m = re.exec(s))) out.push({ x: xs[m.index], date: parseInt(m[1], 10) + '月' + parseInt(m[2], 10) + '日（' + m[3] + '）' });
        return out;
    }

    // ---------------------------------------------------------------
    // 項目名の行がない表：区分の題名（「トラック」「フィールド」）のすぐ下から、時刻・性別・種目・ラウンド・組が並ぶ
    //   列の位置は、中身の語（時刻・性別・種目名・ラウンド・「4-0+8」）の位置から決める
    // ---------------------------------------------------------------
    function findTitleTables(page) {
        var out = [];
        // 題名の行：区分の題名があり、ほかの語は項目名だけ
        //   （「トラック」だけの行、「トラック競技 組 招集時間 集合時刻 集合場所」「（トラック） 決勝進出条件 開始時刻 …」）
        var titles = [];
        page.lines.forEach(function (L) {
            var jw = joinSpaced(L.words);
            var tw = jw.filter(function (w) { return TITLE_RE.test(w.t); });
            if (!tw.length || !jw.every(function (w) { return TITLE_RE.test(w.t) || headerWord(w); })) return;
            // 題名のすぐ下の、項目名だけの行（「開始時刻 完了時刻 競技時間」）
            var hws = jw.filter(function (w) { return !TITLE_RE.test(w.t); });
            hws.forEach(function (w) { w.ly = L.y; });
            var lastY = L.y;
            page.lines.forEach(function (Z) {
                if (Z.y <= L.y || Z.y > L.y + 12) return;
                var zj = joinSpaced(Z.words);
                if (!zj.every(headerWord)) return;
                zj.forEach(function (w) { w.ly = Z.y; hws.push(w); });
                lastY = Math.max(lastY, Z.y);
            });
            titles.push({ L: L, tw: tw.sort(function (p, q) { return p.x - q.x; }), hws: hws, lastY: lastY });
        });
        var med = function (a) { a = a.slice().sort(function (p, q) { return p - q; }); return a[Math.floor(a.length / 2)]; };
        titles.forEach(function (T, ti) {
            var L = T.L, ts = T.tw;
            var next = titles[ti + 1];
            var stop = next ? next.L.y : page.height + 1;
            ts.forEach(function (tw, i) {
                // 左右に並んだ表の境目：題名と題名の中間
                var x0 = i === 0 ? 0 : (cx(ts[i - 1]) + cx(tw)) / 2;
                var x1 = i + 1 < ts.length ? (cx(tw) + cx(ts[i + 1])) / 2 : page.width + 1;
                var hws = T.hws.filter(function (w) { return cx(w) >= x0 && cx(w) < x1; });
                // 項目名のある列より左：中身の語（時刻・性別・種別・種目・ラウンド・組）の位置から列を決める
                var lim = hws.length ? Math.min.apply(null, hws.map(function (w) { return w.x; })) : x1;
                var pos = { time: [], gender: [], cls: [], event: [], round: [], slot: [], heats: [] };
                var nData = 0;
                var groups = [];
                page.lines.forEach(function (D) {
                    if (D.y <= T.lastY || D.y >= stop) return;
                    var hasT = false, hasE = false;
                    joinRange(joinLetters(D.words.filter(function (w) { return cx(w) >= x0 && cx(w) < lim; }))).forEach(function (w) {
                        var t = hw(w.t).replace(/\s+/g, '');
                        if (RE_TIME.test(t)) { if (!hasT) pos.time.push(cx(w)); hasT = true; }
                        else if (GENDER_WORD.test(t)) pos.gender.push(cx(w));
                        else if (isEventWord(t)) { pos.event.push(cx(w)); hasE = true; }
                        else if (/(男|女)/.test(t) && t.length <= 8) pos.cls.push(cx(w));
                        else if (ROUND_RE.test(norm(t)) || shortRound(t)) pos.round.push(cx(w));
                        else if (RE_RANGE.test(t)) pos.slot.push(cx(w));
                        else if (/^\d{1,3}組$/.test(t)) groups.push(cx(w));
                        else if (/^\d{1,3}([‐\-－―]\S+|組.+|TR)$/i.test(t) && !PIT_RE.test(C.hanToZenKana(t)) && !/名/.test(t)) pos.heats.push(cx(w));
                    });
                    if (hasT && hasE) nData++;
                });
                if (nData < 2 || !pos.time.length || !pos.event.length) return;
                // 「3組」：範囲（「1～3組」）の列の近くなら組の番号、それ以外は組の数
                var sc = pos.slot.length ? med(pos.slot) : null;
                groups.forEach(function (c) { (sc !== null && Math.abs(c - sc) < 30 ? pos.slot : pos.heats).push(c); });
                var hcols = buildColumns(hws);
                var cols = [];
                ['time', 'gender', 'cls', 'event', 'round', 'slot', 'heats'].forEach(function (role) {
                    if (!pos[role].length) return;
                    if (role === 'slot' && hcols.some(function (c) { return c.role === 'slot'; })) return;
                    var c = med(pos[role]);
                    cols.push({ text: role, role: role === 'cls' ? 'class' : role, x: c - 1, x2: c + 1, c: c });
                });
                // 項目名の「開始時刻」「競技時間」などは、招集や競技の時間（開始時刻は左の列）
                hcols.forEach(function (c) { if (c.role === 'time') c.role = 'ignore'; cols.push(c); });
                cols.sort(function (a, b) { return a.c - b.c; });
                out.push({ y: T.lastY, topY: L.y, x0: x0, x1: x1, cols: cols, idx: page.lines.indexOf(L), left: x0, titled: true });
            });
        });
        return out;
    }

    // ---------------------------------------------------------------
    // メイン
    // ---------------------------------------------------------------
    function parse(pages) {
        var days = [], dayMap = {};
        var warnings = [];
        var firstDate = null;
        pages.forEach(function (page) {
            page.lines.forEach(function (L) { if (!firstDate) firstDate = dateOf(L); });
        });
        var curDate = firstDate || '';
        var noTime = [];
        var carries = {};
        var tables = [];
        var hdrsByPage = pages.map(findHeaders);
        var anyHdr = hdrsByPage.some(function (h) { return h.length; });

        pages.forEach(function (page, pi) {
            var hdrs = hdrsByPage[pi];
            // 項目名の行のある表が 1つもない PDF：区分の題名の下の表
            if (!hdrs.length && !anyHdr) hdrs = findTitleTables(page);
            var dates = [];
            page.lines.forEach(function (L) { datesOf(L).forEach(function (d) { dates.push({ y: L.y, x: d.x, date: d.date }); }); });
            if (!hdrs.length) {
                if (dates.length) curDate = dates[dates.length - 1].date;
                return;
            }
            // 「種目 招集開始時刻 招集完了時刻」などの別の表の見出しも、表の下端にする
            var bounds = [];
            page.lines.forEach(function (L) {
                // 「種目」、または種目の列の見出し（「トラック」など）と別の見出しの語がある行（「跳躍」だけの行は区切りの題名）
                var jw = joinSpaced(L.words);
                if (jw.some(function (w) { return /^種目/.test(w.t); }) ||
                    (jw.some(isEventHeader) && jw.filter(function (w) { return roleOf(w.t) !== 'other'; }).length >= 2)) bounds.push({ topY: L.y, left: L.words[0].x });
            });
            hdrs.forEach(function (h) {
                // この表の日付：見出しより上にある、いちばん近い日付
                //   同じ行に日付が 2つ以上ある場合は、この表の横の範囲にある日付
                var above = dates.filter(function (d) { return d.y < h.topY; });
                var dy = above.length ? Math.max.apply(null, above.map(function (d) { return d.y; })) : 0;
                var sameY = above.filter(function (d) { return Math.abs(d.y - dy) < 1; });
                var dAbove = sameY.filter(function (d) { return d.x >= h.x0 - 30 && d.x < h.x1; })[0] || sameY[0];
                var date = dAbove ? dAbove.date : curDate;
                // 表の下端：同じ横の範囲にある次の見出し
                var stopY = page.height + 1;
                hdrs.forEach(function (o) {
                    if (o !== h && o.topY > h.y && o.topY < stopY && o.left >= h.x0 && o.left < h.x1) stopY = o.topY - 1;
                });
                dates.forEach(function (d) { if (d.y > h.y && d.y < stopY) stopY = d.y - 1; });
                bounds.forEach(function (o) {
                    if (o.topY > h.y + 2 && o.topY < stopY && !hdrs.some(function (x) { return Math.abs(x.topY - o.topY) < 1; })) {
                        var wsIn = page.lines.filter(function (L) { return Math.abs(L.y - o.topY) < 1; })[0].words.filter(function (w) { return cx(w) >= h.x0 && cx(w) < h.x1; });
                        if (joinSpaced(wsIn).some(isEventHeader)) stopY = o.topY - 1;
                    }
                });
                tables.push({ page: page, date: date, rows: readTable(page, h, stopY), ck: Math.round(h.left / 40) });
            });
            if (dates.length) curDate = dates[dates.length - 1].date;
        });
        // 1組ごとに 1行の表がある PDF は、時刻のセルが上そろえ（同じ PDF のフィールドの表なども）
        var topAligned = tables.some(function (t) { return perHeatRows(t.rows); });
        tables.forEach(function (t) {
            carries[t.ck] = carries[t.ck] || {};          // 左右の表ごとに、前のページからの続きを覚えておく
            buildEntries(t.rows, carries[t.ck], topAligned).forEach(function (e) {
                if (!e.time) noTime.push(e);
                if (!dayMap[t.date]) { dayMap[t.date] = { date: t.date, rows: [] }; days.push(dayMap[t.date]); }
                e.page = t.page.num;
                e.seq = dayMap[t.date].rows.length;
                dayMap[t.date].rows.push(e);
            });
        });

        // 女子だけに「女」と書かれ、男子の種目は性別が空欄の PDF（高校の大会など）→ 空欄は男子
        var all = [];
        days.forEach(function (d) { all = all.concat(d.rows); });
        var wroteF = all.some(function (e) { return e.genderWritten && e.gender === '女子'; });
        var wroteM = all.some(function (e) { return e.genderWritten && e.gender === '男子'; });
        var blanks = all.filter(function (e) { return !e.gender; });
        if (wroteF && !wroteM && blanks.length) {
            blanks.forEach(function (e) { e.gender = '男子'; });
            warnings.push({ type: 'gender', message: 'この PDF は女子の種目だけに「女」と書かれているため、性別が書かれていない種目（' + blanks.length + '件）は男子として出力しています。' });
        }
        if (!days.length) warnings.push({ type: 'none', message: 'タイムテーブル（競技開始時刻と種目の表）が見つかりませんでした。' });
        if (noTime.length) {
            warnings.push({ type: 'no-time', message: '開始時刻が読み取れなかった種目があります（空欄で出力しています）：' +
                noTime.slice(0, 10).map(function (e) { return [e.gender, e.event, e.round].filter(Boolean).join(' ') + (e.cls ? '【' + e.cls + '】' : ''); }).join('、') +
                (noTime.length > 10 ? ' ほか' + (noTime.length - 10) + '件' : '') });
        }
        if (days.length && !days[0].date) warnings.push({ type: 'date', message: 'PDF に日付が書かれていないため、日付の行は出力していません。必要な場合は、貼り付けたあとに日付を入力してください。' });
        var n = 0;
        days.forEach(function (d) { n += d.rows.length; });
        return { days: days, rows: n, warnings: warnings };
    }

    return { parse: parse, minutes: minutes, _test: { parseDesc: parseDesc, shortRound: shortRound, findHeaders: findHeaders, readTable: readTable } };
}));
