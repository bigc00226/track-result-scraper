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
    // 「種」「目」のように 1文字ずつ離れて書かれた見出しを 1語にする
    function joinSpaced(words) {
        var out = [];
        for (var i = 0; i < words.length; i++) {
            var w = words[i], n = words[i + 1];
            if (n && ((w.t === '種' && (n.t === '目' || n.t === '別')) || (w.t === '順' && n.t === '序') || (w.t === '性' && n.t === '別')) && n.x - w.x2 < 30) {
                out.push({ t: w.t + n.t, x: w.x, x2: n.x2, y: w.y, fs: w.fs });
                i++;
                continue;
            }
            out.push(w);
        }
        return out;
    }

    function isEventHeader(w) { return /^種目/.test(w.t); }

    // 列の役割（見出しの文字から）
    function roleOf(text) {
        var t = squash(norm(text));
        if (/招集|参加|人数|場所|ピット|通過|検査|記録|備考|エントリー|コール/.test(t)) {
            if (/招集組/.test(t)) return 'slot';
            return 'ignore';
        }
        if (/競技開始|開始時刻|競技時間|開始時間|^時刻$|^開始$/.test(t)) return 'time';
        if (/組数|組-着|組[－\-]着/.test(t)) return 'heats';
        if (/^組$/.test(t)) return 'slot';
        if (/^順序?$/.test(t)) return 'order';
        if (/^種目/.test(t)) return 'event';
        if (/種別|クラス/.test(t)) return 'class';
        if (/性別/.test(t)) return 'gender';
        if (/ラウンド|予・決|予決/.test(t)) return 'round';
        return 'other';
    }

    // 見出しの行の候補：「種目」があり、開始時刻の見出しが近くにある行
    function isTimeHeader(w) { return roleOf(w.t) === 'time' && /競技|時刻|時間/.test(w.t); }

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
            // 見出しの範囲（上下 2段まで）。数字や時刻のある行はデータの行なので含めない
            var zone = page.lines.filter(function (Z) {
                if (Math.abs(Z.y - L.y) > 12) return false;
                if (Z === L) return true;
                return !Z.words.some(function (w) { return /\d/.test(hw(w.t)); });
            });
            var zw = [];
            zone.forEach(function (Z) { zw = zw.concat(joinSpaced(Z.words)); });
            // 見出しの語だけ（見出しと同じ高さに左の表のデータが書かれていることがある）
            var hdrWs = zw.filter(function (w) { return !/\d/.test(hw(w.t)); });
            // 左右に並んだ表：「種目」の数だけ表がある
            evs.sort(function (a, b) { return a.x - b.x; });
            var known = ws.filter(function (w) { return roleOf(w.t) !== 'other' || isEventHeader(w); });
            var firstX = Math.min.apply(null, (known.length ? known : ws).map(function (w) { return w.x; }));
            var lead = evs[0].x - firstX;
            // 各表の左端（見出しの語）と、表と表の境目（左の表の見出しの右端と、右の表の左端の中間）
            var lefts = evs.map(function (ev, i) {
                if (i === 0) return firstX;
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
                var cols = buildColumns(zw.filter(function (w) { return cx(w) >= x0 && cx(w) < x1; }));
                if (!cols.some(function (c) { return c.role === 'time'; })) return;
                out.push({ y: Math.max.apply(null, zone.map(function (Z) { return Z.y; })), topY: L.y, x0: x0, x1: x1, cols: cols, idx: idx,
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
            var best = times.filter(function (c) { return /競技|時刻|時間/.test(c.text); })[0] || times[0];
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
    var GENDER_WORD = /^(男女混合|男女|混合|男子|女子|男|女)$/;
    var GENDER_IN = /(男女混合|男女|男子|女子)/;

    function normGender(g) {
        if (!g) return '';
        if (/男女|混合/.test(g)) return '男女';
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
        ws.forEach(function (w) {
            var t = hw(w.t).replace(/\s+/g, '');
            if (t === '〃') {
                var role = w.col ? w.col.role : 'round';
                if (role === 'gender') r.gender = prev ? prev.gender : '';
                else if (role === 'event') r.event = prev ? prev.event : '';
                else if (role === 'class') r.cls = prev ? prev.cls : '';
                else r.round = prev ? prev.round : '';
                return;
            }
            if (!r.gender && GENDER_WORD.test(t)) { r.gender = normGender(t); return; }
            if (!r.event && EVENT_RE.test(C.hanToZenKana(t).replace(/ｍ/g, 'm'))) { r.event = t; return; }
            var sr = shortRound(t);
            if (!r.round && sr) { r.round = sr.round; if (sr.heats) r.heats = sr.heats; return; }
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
        r.cls = r.cls || cls.replace(/^[・･]+|[・･]+$/g, '').trim();
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
            var rec = { y: L.y, time: '', heatsTxt: '', slot: '', desc: [], order: '', text: false };
            // 時刻・組・数字・記号以外の文字がある行（「秩父宮章授与式」など）
            //   ピット・ゾーン（「A/B」「Aピット」）は種目の続きの行にも書かれる
            rec.text = ws.some(function (w) {
                var t = hw(w.t);
                return !/^[\d:：～~〜\-－+＋×組着〃()（）\s]+$/.test(t) && !/^[A-Z]{1,2}([\/・][A-Z]{1,2})*(ピット|ゾーン)?$/.test(t) && !/ピット|ゾーン/.test(t);
            });
            var slotWs = [];
            ws.forEach(function (w) {
                var col = columnOf(hdr.cols, w);
                var t = hw(w.t);
                var rg = t.replace(/\s+/g, '').match(RE_RANGE);
                if (rg && col.role !== 'time') { rec.slot = rec.slot || (rg[1] + '～' + rg[2]); rec.hadRange = true; return; }
                if (col.role === 'time') { if (RE_TIME.test(t) && !rec.time) rec.time = t.replace('：', ':'); else if (t === '〃') rec.time = '〃'; return; }
                if (col.role === 'slot') { slotWs.push(w); return; }
                if (col.role === 'heats') { rec.heatsTxt += t; return; }
                if (col.role === 'order') { rec.order += t; return; }
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

    function hasEvent(r) {
        return r.desc.some(function (w) { return EVENT_RE.test(C.hanToZenKana(hw(w.t)).replace(/ｍ/g, 'm')); });
    }

    function rangeOf(s) {
        var m = /^(\d{1,3})(?:～(\d{1,3}))?$/.exec(s || '');
        return m ? { a: parseInt(m[1], 10), b: parseInt(m[2] || m[1], 10) } : null;
    }

    // 行 → 種目ごとの時間帯
    //   carry：前のページから続く種目（「…～80組」の次のページが「81組～」から始まる表）
    function buildEntries(rows, carry) {
        // 2行に折り返したセル（「成年少年」／「女子共通」が種目の行の上下にある）は、種目の行にまとめる
        var evRows = rows.filter(hasEvent);
        rows = rows.filter(function (r) {
            if (hasEvent(r) || r.time || r.slot || !r.desc.length) return true;
            if (r.desc.every(function (w) { return w.t === '〃'; })) return true;
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
            var d = r.desc.length ? parseDesc(r.desc, prev) : null;
            if (d && d.event) {
                var hm = hw(r.heatsTxt).match(/^(\d{1,3})/);
                var ev = {
                    y: r.y, gender: d.gender, cls: d.cls, event: d.event, round: d.round,
                    heats: hm ? parseInt(hm[1], 10) : d.heats,
                    time: r.time === '〃' ? (prev ? prev.time : '') : r.time,
                    slot: r.slot, slots: []
                };
                events.push(ev);
                prev = ev;
                r.ev = ev;
            } else if (r.time && r.time !== '〃' && !r.text) {
                // 時刻だけの行（「〃」はあってもよい）。「13:00 秩父宮章授与式」のような行は種目ではない
                r.timeOnly = true;
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
                    foreign.push({ time: it.t.time, gender: carry.ev.gender, cls: carry.ev.cls, event: carry.ev.event, round: carry.ev.round,
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
            // 複数の種目にまたがる開始時刻（セルの結合）：上下の種目に時刻がなく、ちょうど真ん中にある
            if (!t.slot && above && below && !above.time && !below.time && Math.abs((above.y + below.y) / 2 - t.y) < 2.5) {
                var ia = events.indexOf(above), ib = events.indexOf(below);
                var block = [above, below];
                while (ia - 1 >= 0 && ib + 1 < events.length && !events[ia - 1].time && !events[ib + 1].time &&
                       Math.abs((events[ia - 1].y + events[ib + 1].y) / 2 - t.y) < 2.5) {
                    ia--; ib++;
                    block.push(events[ia], events[ib]);
                }
                block.forEach(function (e) { e.time = t.time; e.merged = true; });
                return;
            }
            // 同じ種目の次の時間帯：上の種目に開始時刻があれば、その種目の続き
            var owner = null;
            if (above && above.time && !above.merged) owner = above;
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
                if (Math.abs((a.y + b.y) / 2 - e.y) > 2.5) break;
                a.time = b.time = e.time;
            }
        });
        // 時間帯に分ける
        var out = [];
        events.forEach(function (e) {
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
                out.push({ time: s.time, gender: e.gender, cls: e.cls, event: e.event, round: e.round, heats: heats, y: s.y });
            });
        });
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
                if (joinSpaced(L.words).some(isEventHeader)) bounds.push({ topY: L.y, left: L.words[0].x });
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
                        if (wsIn.some(isEventHeader) || joinSpaced(wsIn).some(isEventHeader)) stopY = o.topY - 1;
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
