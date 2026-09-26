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
    var ROUND_RE = /^(タイムレース決勝|タイムレース予選|タイムレース|ﾀｲﾑﾚｰｽ決勝|ﾀｲﾑﾚｰｽ|TR決勝|準々決勝|準決勝|決勝|予選|記録会|オープン)/;
    var WEEK = '日月火水木金土';

    function hw(t) { return C.zenToHanAscii(t); }
    function minutes(t) { var m = hw(t).match(RE_TIME); return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null; }
    function cx(w) { return (w.x + w.x2) / 2; }

    // ---------------------------------------------------------------
    // 見出しの行
    // ---------------------------------------------------------------
    // 「種」「目」「投」「て」「き」のように 1文字ずつ離れて書かれた見出しを 1語にする
    var SPACED = ['種目', '種別', '順序', '性別', '跳躍', '投てき', '投擲', '招集時刻', '招集時間', '招集', '時刻', '時間', '競技日程'];
    function joinSpaced(words) {
        var out = [];
        for (var i = 0; i < words.length; i++) {
            var w = words[i];
            if (w.t.length === 1) {
                var t = w.t, k = i, last = w;
                while (k + 1 < words.length && words[k + 1].t.length === 1 && words[k + 1].x - last.x2 < 30 &&
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
    function isEventHeader(w) { return /^種目/.test(w.t) || /^(トラック|フィールド|跳躍|投てき|投擲)$/.test(w.t); }

    // 列の役割（見出しの文字から）
    function roleOf(text) {
        var t = squash(norm(text));
        if (/予・準・決|予・決|予決|ラウンド/.test(t)) return 'round';       // 「予・準・決・人数・組」も
        if (/招集|集合|参加|人数|場所|ピット|通過|検査|記録|備考|エントリー|コール/.test(t)) {
            if (/招集組/.test(t)) return 'slot';
            return 'ignore';
        }
        if (/競技開始|開始時刻|競技時間|競技時刻|開始時間|^時刻$|^開始$/.test(t)) return 'time';
        if (/組数|組-着|組[－\-]着/.test(t)) return 'heats';
        if (/^組$/.test(t)) return 'slot';
        if (/^(順序?|No\.?|NO\.?|№)$/.test(t)) return 'order';
        if (/^種目/.test(t) || /^(トラック|フィールド|跳躍|投てき|投擲)$/.test(t)) return 'event';
        if (/種別|クラス/.test(t)) return 'class';
        if (/性別|^男女$/.test(t)) return 'gender';
        return 'other';
    }

    // 見出しの行の候補：「種目」があり、開始時刻の見出しが近くにある行
    function isTimeHeader(w) { return roleOf(w.t) === 'time' && /競技|時刻|時間/.test(w.t); }

    // 見出しの範囲の語（データの語：数字・時刻・種目名・性別・〃 は除く）
    function headerWord(w) {
        var t = hw(w.t);
        return !/\d/.test(t) && t !== '〃' && !/^(男|女|男子|女子)$/.test(t) && !EVENT_RE.test(t);
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
            page.lines.forEach(function (Z) {
                if (Math.abs(Z.y - L.y) > 12) return;
                joinSpaced(Z.words).forEach(function (w) { if (headerWord(w)) { w.ly = Z.y; zw.push(w); } });
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
                c.text += w.t;
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
    var EV_CORE = /(\d+(?:\.\d+)?(?:m|M|km)(?:[A-Za-z]{1,3})?(?:\([^)]*\))?|\d[×xX]\d+m?R?(?:\([^)]*\))?|走高跳|棒高跳|走幅跳|三段跳|(?:砲丸投|円盤投|ハンマー投|やり投)(?:\([^)]*\))?|ジャベリックスロー|ジャベリック|[一二三四五六七八九十]種競技|競歩)/;
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
        if (r === 'TR決勝') return 'タイムレース決勝';
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
            var kt = C.hanToZenKana(t);
            if (PIT_RE.test(kt)) return;                                      // ピット・ゾーン（「ﾊﾞｯｸA･B」「Bｿﾞｰﾝ」）
            if (t === '〃') {
                var role = w.col ? w.col.role : 'round';
                if (role === 'gender') r.gender = prev ? prev.gender : '';
                else if (role === 'event') r.event = prev ? prev.event : '';
                else if (role === 'class') r.cls = prev ? prev.cls : '';
                else r.round = prev ? prev.round : '';
                return;
            }
            if (!r.gender && GENDER_WORD.test(t)) { r.gender = normGender(t); return; }
            if (KONSEI_MARK[t]) { r.konsei = KONSEI_MARK[t][0]; impliedGender = KONSEI_MARK[t][1]; return; }
            var sr = shortRound(t);
            if (!r.round && sr) { r.round = sr.round; if (sr.heats) r.heats = sr.heats; return; }
            // 組の数「4組3着+4」「3組」
            var hm = t.match(/^(\d{1,3})組(\d{1,2}着.*|ﾀｲﾑ.*|タイム.*)?$/);
            if (hm) { if (r.heats === null) r.heats = parseInt(hm[1], 10); return; }
            // 種目名（前に性別・種別、後ろにラウンドがくっついていることがある）
            var em = r.event || /[《【\[＜<]/.test(kt) ? null : kt.replace(/ｍ/g, 'm').match(EV_CORE);
            if (em) {
                var pre = kt.slice(0, em.index), post = kt.slice(em.index + em[1].length);
                r.event = em[1];
                if (pre) {
                    var gp = pre.match(/^(男女混合|男女|男\/女|男・女|男子|女子|男|女)/);
                    if (gp && !r.gender) { r.gender = normGender(gp[1]); pre = pre.slice(gp[1].length); }
                    pre = pre.replace(/[-－・]+$/, '');
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
            if (!r.round && rm) { r.round = normRound(rm[1]); return; }
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
        r.cls = r.cls || C.hanToZenKana(cls).replace(/^[・･]+|[・･]+$/g, '').trim();
        r.genderWritten = !!r.gender;                  // PDF に性別が書かれている（⑧⑦から決めた性別ではない）
        if (!r.gender && impliedGender) r.gender = impliedGender;
        if (r.konsei) { r.event = r.konsei + ' ' + r.event; }
        r.event = r.event.replace(/[xX]/g, '×');
        return r;
    }

    // ---------------------------------------------------------------
    // 表の行を読む
    // ---------------------------------------------------------------
    function readTable(page, hdr, stopY) {
        var lines = page.lines.filter(function (L) { return L.y > hdr.y + 1 && L.y < stopY; });
        var rows = [];
        lines.forEach(function (L) {
            var ws = L.words.filter(function (w) { return cx(w) >= hdr.x0 && cx(w) < hdr.x1; });
            if (!ws.length) return;
            // 見出しの行（「競技開始時刻 《走幅跳・三段跳》 予・決 ピット」）は読まない
            if (ws.some(function (w) { return isTimeHeader(w) || /^(種目|予・決|予・準・決.*|ラウンド)$/.test(w.t); })) return;
            var rec = { y: L.y, time: '', heatsTxt: '', slot: '', desc: [], order: '', text: false, numCols: {} };
            var slotWs = [];
            ws.forEach(function (w) {
                var col = columnOf(hdr.cols, w);
                var t = hw(w.t);
                // 時刻・組・数字・記号以外の文字がある行（「秩父宮章授与式」など。備考・招集などの列は見ない）
                //   ピット・ゾーン（「A/B」「Aピット」）は種目の続きの行にも書かれる
                if (col.role !== 'ignore' && !/^[\d:：～~〜\-－+＋×組着〃()（）\s]+$/.test(t) &&
                    !/^[A-Z]{1,2}([\/・][A-Z]{1,2})*(ピット|ゾーン)?$/.test(t) && !/ピット|ゾーン/.test(t)) rec.text = true;
                // 数字だけの語がある列（人数・組など。種目の行とその下の行が、同じ列に数字を持つかを見る）
                if (/^\d{1,3}$/.test(t) && col.role !== 'order' && col.role !== 'time') rec.numCols[hdr.cols.indexOf(col)] = true;
                var rg = t.replace(/\s+/g, '').match(RE_RANGE);
                if (rg && col.role !== 'time') { rec.slot = rec.slot || (rg[1] + '～' + rg[2]); rec.hadRange = true; return; }
                if (col.role === 'time') { if (RE_TIME.test(t) && !rec.time) rec.time = t.replace('：', ':'); else if (t === '〃') rec.time = '〃'; return; }
                if (col.role === 'slot') { slotWs.push(w); return; }
                if (col.role === 'heats') { rec.heatsTxt += t; return; }
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
    function buildEntries(rows, carry) {
        var onlyDitto = function (r) { return r.desc.length && r.desc.every(function (w) { return w.t === '〃'; }); };
        // 種目のない行で、性別・種別と自分の数字（人数・組）か時刻がある行（「男子 1 7」「27 男子 中学1年 1 8」）
        //   → 上下の種目の行の「中の 1行」（同じ種目・時刻で、性別・種別が違う）
        //   組と人数だけの行（「A 1組 20」：ピットごとの組）も、中の 1行
        var subRows = rows.filter(function (r) {
            if (hasEvent(r)) return false;
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
                    slot: r.slot, slots: [], order: r.order, numCols: r.numCols, subs: []
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
            ts.forEach(function (it) { it.t.done = true; owner.slots.push({ y: it.y, time: it.t.time, slot: it.t.slot }); });
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
            if (owner) owner.slots.push({ y: t.y, time: t.time, slot: t.slot });
        });
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
                               cls: r.cls || e.cls, event: e.event, round: e.round, heats: heats, y: r.y });
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
                else if (e.heats && e.heats > 1) heats = e.heats + '組';
                else if (e.heats === 1) heats = '';
                else if (/^\d{1,3}$/.test(s.slot || '')) heats = s.slot + '組';     // 組ごとに行が分かれている表（「5000m ＴＲ決勝 1」）
                else if (/^1～(\d{1,3})$/.test(s.slot || '')) heats = s.slot.replace(/^1～/, '') + '組';   // 「1～3」→ 3組
                else if (s.slot) heats = s.slot + '組';
                if (!heats && !multi && e.heatsLabel) heats = e.heatsLabel;
                out.push({ grp: ei, time: s.time, ownTime: !!s.time && !e.merged, gender: e.gender, ownGender: !!e.gender, genderWritten: e.genderWritten,
                           cls: e.cls, event: e.event, round: e.round, heats: heats, y: s.y });
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

        pages.forEach(function (page) {
            var hdrs = findHeaders(page);
            var dates = [];
            page.lines.forEach(function (L) { var d = dateOf(L); if (d) dates.push({ y: L.y, date: d }); });
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
                var dAbove = dates.filter(function (d) { return d.y < h.topY; }).sort(function (a, b) { return b.y - a.y; })[0];
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
                var rows = readTable(page, h, stopY);
                var ck = Math.round(h.left / 40);          // 左右の表ごとに、前のページからの続きを覚えておく
                carries[ck] = carries[ck] || {};
                buildEntries(rows, carries[ck]).forEach(function (e) {
                    if (!e.time) noTime.push(e);
                    if (!dayMap[date]) { dayMap[date] = { date: date, rows: [] }; days.push(dayMap[date]); }
                    e.page = page.num;
                    e.seq = dayMap[date].rows.length;
                    dayMap[date].rows.push(e);
                });
            });
            if (dates.length) curDate = dates[dates.length - 1].date;
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
        if (days.length && !days[0].date) warnings.push({ type: 'date', message: '日付が見つかりませんでした。' });
        var n = 0;
        days.forEach(function (d) { n += d.rows.length; });
        return { days: days, rows: n, warnings: warnings };
    }

    return { parse: parse, minutes: minutes, _test: { parseDesc: parseDesc, shortRound: shortRound } };
}));
