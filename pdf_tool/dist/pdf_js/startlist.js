/*
 * startlist.js  スタートリスト PDF の読み取り
 *
 *   対応している形式
 *   (1) 記録処理ソフトの表形式（ﾚｰﾝ/ORD/試順・ﾅﾝﾊﾞｰ・氏名・所属…、2組が左右に並ぶ形も可）
 *       国スポ・奈良市サーキット・U16・InDesign 版プログラムなど
 *       東信選手権の形（組の見出し「［ 1 組 ］」、「所属/学年」の欄の所属の下に学年、
 *       リレーは見出し「ﾚｰﾝ所属/Bib」でチーム名の下にメンバー）も含む
 *   (2) リレーの枠形式（「1ﾚｰﾝ チーム名 記録」の下にメンバーが並ぶ形）
 *   (3) 1行1人の一覧表形式（種別・種目名・男女・競技者名・学年・学校名・組・レーン）
 *
 *   parse(pages) → { events: [...], warnings: [...] }
 *     event  = { key, gender, cls, event, round, label, heats: [{ no, entries: [...] }] }
 *     entry  = { order, bib, name, team, pref, qual, relay }
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./pdfcore.js'));
    } else {
        root.StartList = factory(root.PdfCore);
    }
}(typeof self !== 'undefined' ? self : this, function (C) {
    'use strict';

    var norm = C.normText, squash = C.squash;

    // ---------------------------------------------------------------
    // 見出しの判定
    // ---------------------------------------------------------------
    var ROUND_RE = /^([A-Z]?(?:タイムレース決勝|タイムレース予選|タイムレース|TR決勝|準々決勝|準決勝|決勝)|予選|記録会|オープン)/;
    var HEAT_RE = /^(\d{1,3})組$/;
    var GENDER_RE = /(男女混合|男女|混合|男子|女子)/;
    var EVENT_START_RE = /(\d|走高跳|棒高跳|走幅跳|三段跳|砲丸投|円盤投|ハンマー投|やり投|ジャベリックスロー|十種|八種|七種|五種|四種|混成|競歩)/;

    function normWord(t) { return squash(norm(t)); }

    function roundOf(line, page) {
        if (!line.words.length || line.words[0].x > page.width * 0.35) return null;
        var s = normWord(line.text).replace(/^[【\[［]([^】\]］]*)[】\]］]/, '$1');     // 「【決勝】」
        var m = s.match(ROUND_RE);
        if (!m) return null;
        var r = m[1] === 'TR決勝' ? 'タイムレース決勝' : m[1];
        var rest = s.slice(m[1].length);
        var info = null, mm = rest.match(/^\(?全?(\d{1,3})組/) || rest.match(/^\(?タイムレース\(?全?(\d{1,3})組/);
        if (mm) info = parseInt(mm[1], 10);
        // 「決勝 3組 タイムレース」「決勝 タイムレース 3組」→ タイムレース決勝（「予選 5組 タイムレース 8」は予選のまま）
        if (r === '決勝' && /^\(?(全?\d{1,3}組)?タイムレース/.test(rest)) r = 'タイムレース決勝';
        return { round: r, heats: info };
    }

    function isTitle(line, page) {
        if (!line.words.length || line.words[0].x > page.width * 0.5) return false;
        if (line.fs < 13.5) return false;
        // 「決勝 ※中学女子800mと同走」のように、ラウンドの語で始まる注記の行は種目名ではない
        if (/^(予選|準々決勝|準決勝|決勝|タイムレース決勝|タイムレース)$/.test(normWord(line.words[0].t)) && /※|同走/.test(norm(line.text))) return false;
        var s = norm(titleText(line));
        return /男|女/.test(s) && EVENT_START_RE.test(s);
    }

    // 種目名の行の文字：種目名と同じ大きさの語だけ
    //   （右端に小さく書かれた日程「決勝13:55」「決勝 14:30」は除く）
    function titleText(line) {
        return line.words.filter(function (w) {
            return w.fs >= line.fs * 0.8 && !/^(予選|準決勝|決勝|タイムレース)?\d{1,2}[:：]\d{2}$/.test(C.zenToHanAscii(w.t));
        }).map(function (w) { return w.t; }).join(' ');
    }

    function parseTitle(text) {
        var s = norm(text).replace(/^[●◆■]/, '');
        var m = s.match(GENDER_RE);
        var gender = '', prefix = '', rest = s;
        if (m) {
            gender = m[1];
            prefix = s.slice(0, m.index);
            rest = s.slice(m.index + m[1].length);
        }
        var suffix = '', ev = rest.trim();
        var sp = rest.trim().lastIndexOf(' ');
        if (sp >= 0) {
            suffix = rest.trim().slice(0, sp);
            ev = rest.trim().slice(sp + 1);
        } else {
            var em = rest.match(EVENT_START_RE);
            if (em && em.index > 0) {
                suffix = rest.slice(0, em.index);
                ev = rest.slice(em.index);
            }
        }
        if (gender === '男女混合') gender = '男女';
        return {
            gender: gender,
            cls: (prefix + suffix).replace(/\s+/g, '').trim(),
            event: ev.replace(/X/g, '×').replace(/\s+/g, '')
        };
    }

    // ---------------------------------------------------------------
    // 名前・所属の整形
    // ---------------------------------------------------------------
    function cleanName(s) {
        s = norm(s);
        s = s.replace(/\s*\(\s*/g, '(').replace(/\s*\)/g, ')');
        // パラの知的障がいクラス「II-2」の「II-」が外字で書かれている PDF がある（〓2 → II-2）
        s = s.replace(/^〓([1-3])(?=\s)/, 'II-$1');
        return s.replace(/\s+/g, ' ').trim();
    }

    function withGrade(name, grade) {
        if (!grade || /\)$/.test(name)) return name;
        return name + '(' + grade + ')';
    }

    function nameScore(text) {
        var sc = 0;
        if (/[぀-ゟ゠-ヿ一-鿿豈-﫿々〆]/.test(text)) sc += 4;   // 漢字・全角かな
        if (/^[｡-ﾟ\s()0-9*]+$/.test(text)) sc -= 2;                                     // 半角カナのみ（フリガナ）
        if (/^[゠-ヿ\s・]+$/.test(text)) sc -= 3;                                             // 全角カタカナのみ（フリガナ）
        if (/^[A-Za-z\s()0-9.'\-*]+$/.test(text)) sc -= 1;                                        // ローマ字のみ
        if (/\(\d{1,2}\)|\([^)]*\d\)/.test(text)) sc += 1;                                         // 学年つき
        return sc;
    }

    // 所属の欄：「宮 城・東北大学」「仙台大学・学 連」どちらの並びにも対応
    var REGION_RE = /^(学連|[東西南北]?[東西南北]?(日本|地区)?|北海道|東北|関東|北信越|東海|近畿|中国|四国|九州|沖縄)$/;

    function splitTeam(lines) {
        var team = [], pref = '', qual = '';
        lines.forEach(function (t) {
            var sq = squash(norm(t));
            if (!sq || /^[()（）〔〕.:\-+･・m\s]*$/.test(sq)) return;    // 「( ) .」「m」「〔 〕 : .」などの空欄の記号
            if (/^[+\-±]?\d{1,2}\.\d$/.test(sq)) return;            // 風
            if (C.isRecord(sq)) { if (!qual) qual = sq; return; }
            // 風の記号（「+」「-」「+･-」）が所属の右に並ぶ表があるので、前後の記号を取り除く
            t = norm(t).replace(/[\s+\-±･・.\/／]+$/, '').replace(/^[\s+\-±･・\/／]+/, '');
            t = t.replace(/(\s+[mｍ])+$/, '');                      // 跳躍の記録の欄の単位「m」
            sq = squash(t);
            if (!sq) return;
            var nt = norm(t), ki = nt.indexOf('・');
            if (ki > 0 && ki < nt.length - 1) {
                // 「都道府県・所属」「所属・都道府県」どちらの並びか、中身を見て決める
                var leftT = nt.slice(0, ki).trim(), rightT = nt.slice(ki + 1).trim();
                var left = squash(leftT), right = squash(rightT);
                var leftPref = C.isPref(left) || REGION_RE.test(left);
                var rightPref = C.isPref(right) || REGION_RE.test(right);
                if (leftPref && !rightPref) { pref = pref || C.prefName(left); team.push(rightT); return; }
                if (rightPref && !leftPref) { pref = pref || C.prefName(right); team.push(leftT); return; }
                if (leftPref && rightPref) { pref = pref || C.prefName(right); team.push(leftT); return; }
                // どちらも都道府県名でない場合（国名コードなど）は、短い方を都道府県の欄に
                if (left.length <= 4 && left.length < right.length) { pref = pref || leftT; team.push(rightT); return; }
                if (right.length <= 4 && right.length < left.length) { pref = pref || rightT; team.push(leftT); return; }
                team.push(nt);
                return;
            }
            if ((C.isPref(sq) || REGION_RE.test(sq)) && !pref) { pref = C.prefName(sq); return; }
            team.push(norm(t));
        });
        return { team: team.join(' ').replace(/\s+/g, ' ').trim(), pref: pref, qual: qual };
    }

    // ---------------------------------------------------------------
    // (1) 表形式
    // ---------------------------------------------------------------
    var HDR = {
        lane: /^(ﾚｰﾝ|レーン|ORD|試順|試|順|ｵｰﾀﾞｰ|ｵｰﾀﾞｰ\(ﾚｰﾝ\))$/,
        name: /^(氏|氏名|競技者名)$/,
        team: /^(所|所属|所属\/資格記録|所属\/学年)$/,
        qual: /^(資格記録|資格|前記録|参考記録|参考)$/,
        result: /順位|^1回目$|^ｺﾒﾝﾄ$/
    };
    // ナンバーと氏名の見出しがくっついた語「Bib氏名」
    var BIB_NAME_RE = /^(Bib|BIB|ビブ)\.?氏名$/;
    // リレーの表の見出し「ﾚｰﾝ所属/Bib」（レーン・チーム名の行と、ナンバー・メンバーの行）
    var RELAY_HDR_RE = /^(ﾚｰﾝ|レーン|ｵｰﾀﾞｰ|オーダー)?所属\/(Bib|BIB)\.?$/;

    function isNameHeader(L) { return L.words.some(function (w) { return /^(氏|氏名|名|競技者名)$/.test(w.t) || BIB_NAME_RE.test(w.t); }); }

    // 表の見出しの語（次の表の見出しが、どの列にあるかを見るのに使う）
    function isHeaderWord(w) {
        return HDR.lane.test(w.t) || HDR.team.test(w.t) || HDR.qual.test(w.t) || /^(氏|氏名|名|競技者名)$/.test(w.t) ||
            /順位|記録|^ｶﾅ\/学年$/.test(w.t) || /^(Bib|BIB|ビブ)\.?$/.test(w.t) || BIB_NAME_RE.test(w.t) || RELAY_HDR_RE.test(w.t) ||
            /ナンバー$/.test(C.hanToZenKana(w.t));
    }

    // 見出しの語がくっついている表（「ﾚｰﾝﾅﾝﾊﾞｰ」）にも対応する
    function numberHeaders(line) {
        var out = [];
        line.words.forEach(function (w) {
            // ナンバーの列の見出し：「ﾅﾝﾊﾞｰ」「Bib.」
            if (/^(Bib|BIB|ビブ)\.?$/.test(w.t)) { out.push({ x: w.x, laneX: null, w: w }); return; }
            // 「Bib氏名」：ナンバーは語の先頭、氏名は「氏」の位置から
            if (BIB_NAME_RE.test(w.t)) {
                out.push({ x: w.x, laneX: null, w: w, nameX: w.x + (w.x2 - w.x) * (w.t.indexOf('氏') / w.t.length) });
                return;
            }
            // 「ﾚｰﾝ所属/Bib」：レーンは語の先頭、ナンバーは「Bib」の位置から
            if (RELAY_HDR_RE.test(w.t)) {
                var bi = w.t.search(/Bib|BIB/);
                out.push({ x: w.x + (w.x2 - w.x) * (bi / w.t.length), laneX: /^所属/.test(w.t) ? null : w.x, w: w, relay: true });
                return;
            }
            var t = C.hanToZenKana(w.t);
            if (t === 'ナンバー') { out.push({ x: w.x, laneX: null, w: w }); return; }
            // 見出しがくっついた語は「レーンナンバー」「ORDナンバー」などだけ（「ナンバーワンクラブ」などの所属名は除く）
            if (!/^(レーン|ORD|試順|オーダー)ナンバー$/.test(t)) return;
            var i = t.indexOf('ナンバー');
            // 「ﾚｰﾝ」「ORD」「試順」などが前にくっついている場合は、文字数で位置を分ける
            var numX = w.x + (w.x2 - w.x) * (i / t.length);
            out.push({ x: numX, laneX: i > 0 ? w.x : null, w: w });
        });
        return out;
    }

    function findBlocks(page, hdrLine) {
        var numWords = numberHeaders(hdrLine);
        // ヘッダーは 2～3 行に分かれていることがある（「試/順」「資格/記録」など）
        var zone = page.lines.filter(function (L) { return L.y >= hdrLine.y - 9 && L.y <= hdrLine.y + 16; });
        var zoneWords = [];
        zone.forEach(function (L) { zoneWords = zoneWords.concat(L.words); });
        var blocks = numWords.map(function (nw) {
            var laneW = zoneWords.filter(function (w) { return HDR.lane.test(w.t) && w.x < nw.x && nw.x - w.x < 45; })
                .sort(function (a, b) { return b.x - a.x; })[0];
            // 列の中央（行の先頭の番号がレーン・試順の列か、ナンバーの列かを見分けるのに使う）
            var numC = (nw.x + nw.w.x2) / 2;
            var laneC = nw.laneX !== null ? (nw.w.x + nw.x) / 2 : (laneW ? (laneW.x + laneW.x2) / 2 : null);
            return { numX: nw.x, laneX: nw.laneX !== null ? nw.laneX : (laneW ? laneW.x : nw.x - 14), numC: numC, laneC: laneC,
                     nameHint: nw.nameX !== undefined ? nw.nameX : null, relay: !!nw.relay };
        }).sort(function (a, b) { return a.laneX - b.laneX; });
        blocks.forEach(function (b, i) {
            b.x0 = b.laneX - 8;
            b.x1 = i + 1 < blocks.length ? blocks[i + 1].laneX - 8 : page.width + 1;
            var inB = zoneWords.filter(function (w) { return w.x >= b.x0 && w.x < b.x1; });
            var first = function (re, minX) {
                var c = inB.filter(function (w) { return re.test(w.t) && w.x > (minX || -1); })
                    .sort(function (a, b2) { return a.x - b2.x; });
                return c.length ? c[0].x : null;
            };
            b.nameX = first(HDR.name, b.numX) || b.nameHint || b.numX + 20;
            b.teamX = first(HDR.team, b.nameX) || b.nameX + 60;
            // 「所属/学年」の列：所属の下の行に「(3)」のように学年が書かれている
            b.teamGrade = inB.some(function (w) { return /^所属\/学年$/.test(w.t); });
            b.qualX = first(HDR.qual, b.teamX);
            b.resultX = first(/順位|^1回目$/, b.teamX) || b.x1;
            if (b.qualX !== null && b.qualX >= b.resultX) b.qualX = null;
            // 列の中央（見出しが列の中央に書かれている表もあるので、境目は中央と中央の間にする）
            var span = function (re, from, to) {
                var ws = inB.filter(function (w) { return re.test(w.t) && w.x >= from && w.x < to; });
                if (!ws.length) return null;
                return (Math.min.apply(null, ws.map(function (w) { return w.x; })) + Math.max.apply(null, ws.map(function (w) { return w.x2; }))) / 2;
            };
            var nameC = span(/^(氏|名|氏名|競技者名)$/, b.nameX - 1, b.teamX - 1) || b.nameX + 20;
            var teamC = span(/^(所|属|所属|属\/資格記録|所属\/資格記録|所属\/学年)$/, b.teamX - 1, b.qualX !== null ? b.qualX - 1 : b.resultX - 1) || b.teamX + 20;
            var qualC = b.qualX !== null ? span(HDR.qual, b.qualX - 1, b.resultX - 1) : null;
            b.nameC = nameC;
            b.teamC = teamC;
            // 氏名と所属の境目：見出しの中央と中央の間（見出しが列の中央に書かれている表に対応）
            b.nameEnd = Math.max(Math.min((nameC + teamC) / 2, b.teamX - 3), nameC);
            b.teamEnd = qualC !== null ? Math.max(Math.min((teamC + qualC) / 2, b.qualX - 3), teamC) : b.resultX - 1;
            b.hasName = b.nameHint !== null || inB.some(function (w) { return HDR.name.test(w.t) && w.x > b.numX - 4; });
            b.hdrY = C.headerBottom(zone, hdrLine, b.x0, b.x1);
        });
        // ラップ表などの「ナンバー」だけの表は対象外
        return blocks.filter(function (b) { return b.hasName; });
    }

    // 行の中で、区間 [x0,x1) に入る単語
    function wordsIn(L, x0, x1) {
        return L.words.filter(function (w) { return w.x >= x0 && w.x < x1; });
    }

    // 1) 行の先頭（レーン・試順の番号）と、振り分ける単語を集める
    function collectBlock(page, b, lines) {
        var anchors = [];
        lines.forEach(function (L) {
            var ws = wordsIn(L, b.x0, b.resultX);
            if (!ws.length) return;
            var w0 = ws[0];
            // 行の先頭はレーン・試順の番号（ナンバーの列より左）。
            //   ナンバーだけが少し上にずれて別の行になっている表では、ナンバーを先頭と間違えない
            //   「ｵｰﾀﾞｰ(ﾚｰﾝ)」の列は「9(10)」のように書かれている（オーダーの番号を使う）
            var om = w0.t.match(/^(\d{1,3})(?:[(（]\d{1,2}[)）])?$/);
            if (!om || w0.x >= b.nameX - 1) return;
            if (b.laneC !== null) {
                var c0 = (w0.x + w0.x2) / 2;
                if (Math.abs(c0 - b.numC) < Math.abs(c0 - b.laneC)) return;
            }
            var bib = '';
            if (ws[1] && ws[1].x < b.nameX - 1 && /^[0-9A-Za-z\-]+$/.test(C.zenToHanAscii(ws[1].t))) bib = C.zenToHanAscii(ws[1].t);   // 「E１０１０」も
            anchors.push({ y: L.y, order: parseInt(om[1], 10), bib: bib, w0: w0, w1: bib ? ws[1] : null });
        });
        anchors.sort(function (a, c) { return a.y - c.y; });
        // 氏名の列の始まり：レーン番号の右（見出しより左から名前が書かれている表もある）
        //   ナンバーは行の先頭として取り除くので、氏名の範囲に入っても問題ない
        var edge = 0;
        anchors.forEach(function (a) { edge = Math.max(edge, a.w0.x2); });
        b.nameStart = Math.min(b.nameX - 3, edge + 0.5);
        var others = [];
        lines.forEach(function (L) {
            wordsIn(L, b.x0, b.resultX).forEach(function (w) {
                if (anchors.some(function (a) { return a.w0 === w || a.w1 === w; })) return;
                others.push(w);
            });
        });

        // 所属の列の始まり：都道府県名が多くの行で同じ位置から書かれていれば、そこを所属の列とする
        //   （見出しが列の中央に書かれていて、見出しの中央の中間では境目がずれる表）
        var starts = {};
        var byY = C.wordsByLine(others.filter(function (w) { return w.x > b.nameStart && w.x < b.teamEnd; }));
        byY.forEach(function (l) {
            for (var i = 0; i < l.words.length; i++) {
                var acc = '';
                for (var j = i; j < l.words.length && j < i + 3; j++) {
                    acc += l.words[j].t;
                    var head = acc.split('・')[0];
                    if (C.isPref(head) && (acc === head || acc.indexOf('・') > 0)) {
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
        if (modeX !== null && modeN >= Math.max(2, anchors.length * 0.3) && modeX - 1.5 < b.nameEnd + 8 && modeX - 1.5 > b.nameStart + 8) {
            b.nameEnd = modeX - 1.5;
        }
        return { anchors: anchors, others: others };
    }

    // 3) 各行を氏名・所属・資格記録に分ける
    function blockEntries(b, anchors, bands) {
        var rows = anchors.map(function (a, idx) { return { a: a, words: bands[idx].words }; });
        var entries = [];
        rows.forEach(function (row) {
            var ws = row.words;
            var byLine = C.wordsByLine;
            if (b.relay) {
                // リレーの表（「ﾚｰﾝ所属/Bib」）：レーン番号の行のチーム名だけ（下に並ぶメンバーの行は使わない）
                var near = Math.max(row.a.w0.fs || 0, 6) * 0.35;
                var tws = ws.filter(function (w) {
                    // 右の順位・記録の欄の「( )」は除く
                    return Math.abs(w.y - row.a.y) <= near && w.x < b.resultX - 1 && !/^[()（）\s]+$/.test(w.t);
                });
                if (row.a.w1) tws.push(row.a.w1);      // 英字だけのチーム名（「MORE」など）はナンバーの欄として拾われている
                tws.sort(function (p, q) { return p.x - q.x; });
                // チームの行に資格記録がある表では、記録はチーム名に入れない
                var rq = '';
                tws = tws.filter(function (w) {
                    var q = squash(norm(w.t));
                    if (C.isRecord(q)) { rq = rq || q; return false; }
                    return true;
                });
                var rawTeam = tws.map(function (w) { return w.t; }).join(' ');
                var rt = splitTeam([rawTeam]);
                if (!rt.team && !rt.pref) return;
                // 「長野」（長野高）・「東京都」など、都道府県名と同じチーム名もチーム名として残す
                entries.push({ order: row.a.order, bib: '', name: '', team: rt.team || squash(norm(rawTeam)), pref: rt.team ? rt.pref : '',
                               qual: rq || rt.qual, relay: true, y: row.a.y });
                return;
            }
            // 学年の列（見出しなし）：氏名と所属の間に、行の基準と同じ高さで数字だけが書かれている表
            //   「6 187 1 西九州大学 11.60」→ 学年 1 → 氏名の後ろに (1)
            var grade = '';
            ws = ws.filter(function (w) {
                if (grade || !/^(\d{1,2}|[MD]\d)$/.test(w.t) || w.x < b.nameStart || w.x >= b.teamEnd) return true;
                if (Math.abs(w.y - row.a.y) > Math.max(w.fs, 6) * 0.35) return true;
                grade = w.t;
                return false;
            });
            // 行の先頭にナンバーがない（ナンバーだけ別の行にずれて書かれている）場合、
            //   ナンバーの列にある語をナンバーとして、氏名には入れない（「T20」などのクラスは氏名のまま）
            var strayBib = null;
            if (!row.a.bib) {
                strayBib = ws.filter(function (w) {
                    var hw = C.zenToHanAscii(w.t), c = (w.x + w.x2) / 2;
                    return /\d/.test(hw) && /^[0-9A-Za-z\-]+$/.test(hw) && Math.abs(c - b.numC) < Math.abs(c - b.nameX);
                })[0] || null;
            }
            var nameWs = ws.filter(function (w) { return w !== strayBib && w.x >= b.nameStart && w.x < b.nameEnd; });
            var teamWs = ws.filter(function (w) { return w.x >= b.nameEnd && w.x < b.teamEnd; });
            // フリガナの続き（半角カナ）が所属の列にはみ出している場合は氏名の側に戻す
            var HK = /^[\uFF61-\uFF9F]+$/;
            teamWs = teamWs.filter(function (w) {
                if (!HK.test(w.t)) return true;
                var cont = nameWs.some(function (n) { return HK.test(n.t) && Math.abs(n.y - w.y) <= Math.max(n.fs, w.fs) * 0.35; });
                if (cont) { nameWs.push(w); return false; }
                return true;
            });
            var nameLines = byLine(nameWs);
            var teamLines = byLine(teamWs);
            var qualLines = b.qualX !== null ? byLine(ws.filter(function (w) { return w.x >= b.teamEnd && w.x < b.resultX - 1; })) : [];

            var best = null;
            nameLines.forEach(function (l) {
                var sc = nameScore(l.text) - Math.abs(l.y - row.a.y) / 100;
                if (!best || sc > best.sc) best = { sc: sc, text: l.text };
            });
            var teamTexts = teamLines.map(function (l) { return l.text; });
            if (b.teamGrade) {
                // 「所属/学年」の列：所属の下の行の「(3)」「(M)」は学年（所属には入れない）
                //   都道府県名が ( ) で書かれている場合は、都道府県として扱う
                teamTexts = teamTexts.map(function (tx) {
                    var gm = squash(norm(tx)).match(/^\(([^()]{1,4})\)$/);
                    if (!gm) return tx;
                    if (C.isPref(gm[1]) || REGION_RE.test(gm[1])) return gm[1];
                    if (!grade) grade = gm[1];
                    return '';
                });
            }
            var t = splitTeam(teamTexts);
            qualLines.forEach(function (l) {
                var q = squash(norm(l.text));
                if (!t.qual && C.isRecord(q)) t.qual = q;
                // 「11.10 ( )」のように、右の順位の欄の「( )」と同じ行になっている表は語ごとに見る
                l.words.forEach(function (w) {
                    var qw = squash(norm(w.t));
                    if (!t.qual && C.isRecord(qw)) t.qual = qw;
                });
            });
            if (!best && !t.team) return;      // 空きレーン
            entries.push({
                order: row.a.order,
                bib: row.a.bib || (strayBib ? C.zenToHanAscii(strayBib.t) : ''),
                name: best ? withGrade(cleanName(best.text), grade) : '',
                team: t.team,
                pref: t.pref,
                qual: t.qual,
                relay: false,
                y: row.a.y
            });
        });
        return entries;
    }

    // ---------------------------------------------------------------
    // (2) リレーの枠形式
    // ---------------------------------------------------------------
    //   レーンの枠は「3ﾚｰﾝ」または丸数字「③」
    var CIRCLED = '①②③④⑤⑥⑦⑧⑨⑩';
    function isLaneBox(w) { return /^\d{1,2}(ﾚｰﾝ|レーン)$/.test(w.t) || (w.t.length === 1 && CIRCLED.indexOf(w.t) >= 0); }
    function laneNo(t) { var k = CIRCLED.indexOf(t); return k >= 0 ? k + 1 : parseInt(t, 10); }
    // リレーの枠の行：丸数字の場合は、行の先頭が丸数字で 2つ以上並んでいるもの（本文の「①」は除く）
    function isRelayLine(L) {
        if (L.words.some(function (w) { return /^\d{1,2}(ﾚｰﾝ|レーン)$/.test(w.t); })) return true;
        var c = L.words.filter(isLaneBox);
        return c.length >= 2 && c[0] === L.words[0];
    }

    function parseRelayLine(page, L) {
        var boxes = L.words.filter(isLaneBox);
        return boxes.map(function (bw, i) {
            var x1 = i + 1 < boxes.length ? boxes[i + 1].x - 2 : page.width + 1;
            var ws = L.words.filter(function (w) { return w.x > bw.x && w.x < x1 && w !== bw; });
            var qual = '', parts = [];
            ws.forEach(function (w) {
                var sq = squash(norm(w.t));
                if (C.isRecord(sq)) { if (!qual) qual = sq; return; }
                parts.push(w);
            });
            var raw = parts.map(function (w) { return w.t; }).join(' ');
            var team = norm(raw);
            var pref = '';
            if (C.isPref(team)) { team = squash(team); }
            else {
                var k = squash(team).indexOf('・');
                if (k > 0 && k <= 4) { pref = squash(team).slice(0, k); team = team.replace(/^[^・]*・\s*/, ''); }
            }
            return {
                order: laneNo(bw.t), bib: '', name: '', team: team, pref: pref, qual: qual, relay: true,
                x: bw.x, y: L.y
            };
        }).filter(function (e) { return e.team; });
    }

    // ---------------------------------------------------------------
    // (3) 一覧表形式
    // ---------------------------------------------------------------
    var FLAT_COLS = { '種別': 'cls', '種目名': 'event', '男女': 'sex', '競技者名': 'name', '学年': 'grade', '学校名': 'team', '組': 'heat', 'レーン': 'lane', '所属': 'team', '氏名': 'name' };

    function flatHeader(L) {
        var ts = L.words.map(function (w) { return w.t; });
        return ts.indexOf('種目名') >= 0 && (ts.indexOf('競技者名') >= 0 || ts.indexOf('氏名') >= 0) && ts.indexOf('組') >= 0;
    }

    function flatBounds(hdr) {
        var cols = hdr.words.map(function (w) { return { key: FLAT_COLS[w.t] || null, c: (w.x + w.x2) / 2 }; });
        return cols.map(function (c, i) {
            var lo = i === 0 ? -1e9 : (cols[i - 1].c + c.c) / 2;
            var hi = i + 1 < cols.length ? (c.c + cols[i + 1].c) / 2 : 1e9;
            return { key: c.key, lo: lo, hi: hi };
        });
    }

    function parseFlatPage(page, hdrIdx, state) {
        // 1ページに複数の表（組ごとの見出し）があるので、見出しが出るたびに列の位置を取り直す
        // 見出しのないページ（前のページの続き）は、前のページの列の位置を使う
        var bounds = hdrIdx >= 0 ? flatBounds(page.lines[hdrIdx]) : state.flatBounds;
        var rows = [];
        for (var i = hdrIdx + 1; i < page.lines.length; i++) {
            var L = page.lines[i];
            if (flatHeader(L)) { bounds = flatBounds(L); continue; }
            var rec = {};
            L.words.forEach(function (w) {
                var cx = (w.x + w.x2) / 2;
                var col = bounds.filter(function (bd) { return cx >= bd.lo && cx < bd.hi; })[0];
                if (!col || !col.key) return;
                rec[col.key] = rec[col.key] ? rec[col.key] + ' ' + w.t : w.t;
            });
            if (!rec.name || !rec.event || !rec.heat) continue;
            // 男女・組・レーンの欄が正しい形の行だけ（オーダー用紙などを除く）
            if (!/^(男|女|男女|混合)$/.test(squash(rec.sex || '')) || !/^(\d{1,3}|[A-ZＡ-Ｚ])$/.test(squash(rec.heat)) ||
                (rec.lane && !/^\d{1,3}$/.test(squash(rec.lane)))) continue;
            rows.push(rec);
        }
        rows.forEach(function (r) {
            var gender = /女/.test(r.sex || '') ? '女子' : /男/.test(r.sex || '') ? '男子' : '';
            var evName = norm(r.event).replace(/\s+/g, '');
            var ev = getEvent(state, { gender: gender, cls: norm(r.cls || ''), event: evName, round: '' });
            var hv = C.zenToHanAscii(squash(r.heat));
            var heat = /^[A-Z]$/.test(hv) ? getHeat(ev, hv.charCodeAt(0) - 64, hv) : getHeat(ev, parseInt(hv, 10) || 0);
            var lane = parseInt(squash(r.lane || ''), 10);
            if (/R$|リレー/.test(evName)) {
                // リレー：メンバーの行をまとめて、レーンごとにチーム名を 1行にする
                var team = norm(r.team || '');
                var ex = heat.entries.filter(function (e) { return e.order === lane && e.team === team; })[0];
                if (!ex) heat.entries.push({ order: lane || heat.entries.length + 1, bib: '', name: '', team: team, pref: '', qual: '', relay: true });
                return;
            }
            // 学年の欄にヨミの一部が入り込むことがあるので、学年の形だけを取り出す
            var grade = r.grade ? norm(r.grade).replace(/\s+/g, '') : '';
            var gm = grade.match(/((?:小学|中学|高校|高専|大学|大|高|中|小)?\d{1,2})$/);
            if (gm) grade = gm[1];
            heat.entries.push({
                order: lane || heat.entries.length + 1,
                bib: '', name: cleanName(r.name) + (grade ? '(' + grade + ')' : ''),
                team: norm(r.team || ''), pref: '', qual: '', relay: false
            });
        });
        state.flatBounds = bounds;
        return rows.length;
    }

    // ---------------------------------------------------------------
    // 種目・組の管理
    // ---------------------------------------------------------------
    function makeLabel(ev) {
        var s = [ev.gender, ev.event, ev.round].filter(Boolean).join(' ');
        return s + (ev.cls ? '【' + ev.cls + '】' : '');
    }

    function getEvent(state, info) {
        var key = [info.gender, info.cls, info.event, info.round].join('|');
        var ev = state.map[key];
        if (!ev) {
            ev = { key: key, gender: info.gender, cls: info.cls, event: info.event, round: info.round,
                   expectHeats: null, heats: [], pages: [] };
            ev.label = makeLabel(ev);
            state.map[key] = ev;
            state.events.push(ev);
        }
        return ev;
    }

    function getHeat(ev, no, tag) {
        var h = ev.heats.filter(function (x) { return x.no === no; })[0];
        if (!h) { h = { no: no, tag: tag || '', entries: [] }; ev.heats.push(h); }
        return h;
    }

    // ---------------------------------------------------------------
    // メイン
    // ---------------------------------------------------------------
    function parse(pages) {
        var state = { map: {}, events: [], warnings: [], bandRatio: null };
        var cur = { title: null, round: null, heats: null };
        var unreadable = [];

        pages.forEach(function (page) {
            // 文字として読み取れないページ
            if (page.textChars < 20 && (page.pathOps > 300 || page.imageOps > 0)) {
                unreadable.push({ num: page.num, image: page.imageOps > 0 && page.pathOps <= 300 });
                return;
            }
            var lines = page.lines;
            // 一覧表形式
            for (var fi = 0; fi < lines.length; fi++) {
                if (flatHeader(lines[fi])) {
                    parseFlatPage(page, fi, state);
                    return;
                }
            }
            if (state.flatBounds && parseFlatPage(page, -1, state) > 0) return;

            // ページの中の区切り行（種目名・ラウンド・組・ヘッダー）
            var marks = [];
            lines.forEach(function (L, idx) {
                if (isTitle(L, page)) marks.push({ type: 'title', y: L.y, idx: idx, info: parseTitle(titleText(L)) });
                else {
                    var r = roundOf(L, page);
                    if (r) marks.push({ type: 'round', y: L.y, idx: idx, info: r });
                }
                // 見出しの行：ナンバーの列と氏名の列がある行
                //（「氏名」にフリガナ「シメイ」が付いていて、少し下の別の行になっている表もある）
                var nhs = numberHeaders(L);
                if (nhs.length && lines.some(function (L2) { return Math.abs(L2.y - L.y) <= 6 && isNameHeader(L2); })) {
                    marks.push({ type: 'header', y: L.y, idx: idx, hdrXs: L.words.filter(isHeaderWord).map(function (w) { return w.x; }) });
                }
                if (isRelayLine(L)) marks.push({ type: 'relay', y: L.y, idx: idx });
                L.words.forEach(function (w, wi) {
                    // 組の見出し：「1組」「［1組］」、括弧・番号・「組」が別々の語になっている「[ 1 組 ]」
                    var hw = C.zenToHanAscii(w.t);
                    var m = hw.replace(/^[\[【]\s*/, '').replace(/\s*[\]】]$/, '').match(HEAT_RE);
                    if (!m && /^[\[【]/.test(hw)) {
                        // 括弧で始まる語から 4語までをつなげて「[1組]」の形になれば組の見出し（「[ 1 組 ]」「[1 組]」など）
                        var joined = '';
                        for (var j = wi; j < L.words.length && j < wi + 4; j++) {
                            joined += squash(C.zenToHanAscii(L.words[j].t));
                            var jm = joined.match(/^[\[【](\d{1,3})組[\]】]?$/);
                            if (jm) { m = jm; break; }
                        }
                    }
                    if (m) marks.push({ type: 'heat', y: L.y, x: w.x, no: parseInt(m[1], 10) });
                    // 跳躍・投てきのピットごとの組「Group A」「A組」→ A組（1組）・B組（2組）
                    var g = null, ht = C.zenToHanAscii(w.t);
                    if (/^Group$/i.test(ht) && L.words[wi + 1] && /^[A-Z]$/.test(C.zenToHanAscii(L.words[wi + 1].t))) g = C.zenToHanAscii(L.words[wi + 1].t);
                    else if (/^Group([A-Z])$/i.test(ht)) g = ht.slice(-1).toUpperCase();
                    else if (/^[A-Z]組$/.test(ht) && w.x < page.width * 0.6) g = ht.charAt(0);
                    if (g) marks.push({ type: 'heat', y: L.y, x: w.x, no: g.charCodeAt(0) - 64, tag: g });
                });
                if (/^(凡例|ラップ表|ﾗｯﾌﾟ表)/.test(squash(L.text))) marks.push({ type: 'end', y: L.y });
            });
            marks.sort(function (a, b) { return a.y - b.y; });

            var heatLabels = marks.filter(function (m) { return m.type === 'heat'; });
            var pending = [];           // このページの表（あとでまとめて 1人分の範囲を決める）
            var sectionY = -1;          // このページで最後に出てきた種目名・ラウンドの位置

            marks.forEach(function (m, mi) {
                if (m.type === 'title') {
                    var same = cur.title && cur.title.gender === m.info.gender && cur.title.cls === m.info.cls && cur.title.event === m.info.event;
                    cur.title = m.info;
                    if (!same) { cur.round = null; cur.heats = null; cur.lastHeat = 0; }
                    cur.stopped = false;
                    sectionY = m.y;
                    return;
                }
                if (m.type === 'end') { cur.stopped = true; return; }
                if (cur.stopped) return;
                if (m.type === 'round') { cur.round = m.info.round; cur.heats = m.info.heats; cur.lastHeat = 0; sectionY = m.y; return; }
                if (m.type !== 'header' && m.type !== 'relay') return;
                if (!cur.title) return;
                var ev = getEvent(state, {
                    gender: cur.title.gender, cls: cur.title.cls, event: cur.title.event, round: cur.round || ''
                });
                if (cur.heats && !ev.expectHeats) ev.expectHeats = cur.heats;
                if (ev.pages.indexOf(page.num) < 0) ev.pages.push(page.num);

                // この区切りの下端（次の区切り）
                //   次の表の見出しは、同じ列の表のときだけ区切りにする（左右に並んだ表で、右の列だけにある
                //   「決勝」の空の表などの見出しで、左の列の組の途中から下が切れないように）
                var stopFor = function (b) {
                    for (var k = mi + 1; k < marks.length; k++) {
                        var mk = marks[k], t = mk.type;
                        if (t === 'title' || t === 'round' || t === 'end') return mk.y - 1;
                        if (t === 'heat' && mk.y > m.y + 16) return mk.y - 1;
                        if (t === 'header' && mk.y > m.y + 16 &&
                            mk.hdrXs.some(function (x) { return x >= b.x0 && x < b.resultX; })) return mk.y - 1;
                    }
                    return page.height + 1;
                };

                if (m.type === 'header') {
                    var blocks = findBlocks(page, lines[m.idx]);
                    blocks.forEach(function (b) {
                        var stopY = stopFor(b);
                        var region = lines.filter(function (L) { return L.y > b.hdrY + 1 && L.y < stopY; });
                        var label = heatLabels.filter(function (h) {
                            return h.y < m.y && m.y - h.y < 30 && h.x >= b.x0 - 20 && h.x < b.x1;
                        }).sort(function (a, c) { return c.y - a.y; })[0];
                        var col = collectBlock(page, b, region);
                        if (!col.anchors.length) return;
                        // 最初・最後の空きレーン（レーン番号だけの行）は、1人分の範囲を決めるときに使わない
                        //   （フリガナ・都道府県が名前の行の上にある表で、空きレーンの下の行を、次のレーンのものと分かるように）
                        var topY = b.hdrY + 1, bottomY = stopY;
                        //   空きレーン：ナンバーがなく、レーン番号の行とそのすぐ上下（行の間隔の 3割以内）に何も書かれていない
                        var ys = col.anchors.map(function (a) { return a.y; }), gaps = [];
                        for (var gi = 1; gi < ys.length; gi++) gaps.push(ys[gi] - ys[gi - 1]);
                        gaps.sort(function (p, q) { return p - q; });
                        var near = Math.max(4, (gaps.length ? gaps[Math.floor(gaps.length / 2)] : 18) * 0.3);
                        var isEmpty = function (a) {
                            return !a.w1 && !region.some(function (L) {
                                return Math.abs(L.y - a.y) < near && L.words.some(function (w) { return w !== a.w0 && w.x >= b.x0 && w.x < b.resultX; });
                            });
                        };
                        while (col.anchors.length > 1 && isEmpty(col.anchors[0])) topY = col.anchors.shift().y + 1;
                        while (col.anchors.length > 1 && isEmpty(col.anchors[col.anchors.length - 1])) bottomY = col.anchors.pop().y - 1;
                        pending.push({ b: b, col: col, heat: getHeat(ev, label ? label.no : 0, label ? label.tag : ''), topY: topY, bottomY: bottomY });
                    });
                } else if (m.type === 'relay') {
                    var label2 = heatLabels.filter(function (h) { return h.y < m.y && h.y > sectionY; })
                        .sort(function (a, c) { return c.y - a.y; })[0];
                    var no = label2 ? label2.no : (cur.lastHeat || 0);
                    cur.lastHeat = no;
                    var ents = parseRelayLine(page, lines[m.idx]);
                    var heat2 = getHeat(ev, no);
                    ents.forEach(function (e) { heat2.entries.push(e); });
                }
            });

            if (pending.length) {
                var asg = C.assignBandsPage(pending.map(function (p) {
                    return { anchorsY: p.col.anchors.map(function (a) { return a.y; }), words: p.col.others, topY: p.topY, bottomY: p.bottomY };
                }), state.bandRatio);
                if (asg.informative) state.bandRatio = asg.ratio;
                pending.forEach(function (p, i) {
                    blockEntries(p.b, p.col.anchors, asg.bands[i]).forEach(function (e) { p.heat.entries.push(e); });
                });
            }
        });

        // 仕上げ：並べ替え・空の組の除去・確認
        state.events.forEach(function (ev) {
            ev.heats.forEach(function (h) {
                var seen = {};
                h.entries = h.entries.filter(function (e) {
                    var k = e.order + '|' + e.name + '|' + e.team;
                    if (seen[k]) return false;
                    seen[k] = true;
                    return true;
                });
                h.entries.sort(function (a, b) { return a.order - b.order; });
            });
            ev.heats = ev.heats.filter(function (h) { return h.entries.length; });
            ev.heats.sort(function (a, b) { return a.no - b.no; });
        });
        state.events = state.events.filter(function (ev) { return ev.heats.length; });

        // 外字（〓）が残っている人を、種目名つきで知らせる
        var gaijiList = [];
        state.events.forEach(function (ev) {
            ev.heats.forEach(function (h) {
                h.entries.forEach(function (e) {
                    var txt = [e.name, e.team, e.pref].join(' ');
                    if (txt.indexOf('〓') >= 0) {
                        var who = (e.name || e.team) + '（' + ev.label + '）';
                        if (gaijiList.indexOf(who) < 0) gaijiList.push(who);
                    }
                });
            });
        });
        if (gaijiList.length) {
            state.warnings.push({ type: 'gaiji', message: 'PDF の中で文字の情報がない特殊な文字（外字）があり、「〓」で表示しています。手直しをお願いします：' +
                gaijiList.slice(0, 15).join('、') + (gaijiList.length > 15 ? ' ほか' + (gaijiList.length - 15) + '件' : '') });
        }
        if (unreadable.length) {
            var nums = unreadable.map(function (u) { return u.num; });
            state.warnings.push({
                type: 'unreadable',
                pages: nums,
                message: pageRanges(nums) + 'ページ目は、文字が図形・画像に変換されているため読み取れませんでした（表紙・広告などのページであれば問題ありません）。'
            });
        }
        state.events.forEach(function (ev) {
            var nos = ev.heats.map(function (h) { return h.no; }).filter(function (n) { return n > 0; });
            if (!nos.length) return;
            var max = Math.max.apply(null, nos.concat(ev.expectHeats || 0));
            var missing = [];
            for (var n = 1; n <= max; n++) if (nos.indexOf(n) < 0) missing.push(n);
            if (missing.length) {
                state.warnings.push({
                    type: 'missing-heat',
                    event: ev.label,
                    message: ev.label + '：' + missing.join('・') + '組が見つかりません（読み取れないページにある可能性があります）。'
                });
            }
        });
        return { events: state.events, warnings: state.warnings };
    }

    function pageRanges(nums) {
        var out = [], s = null, p = null;
        nums.concat([null]).forEach(function (n) {
            if (s === null) { s = p = n; return; }
            if (n === p + 1) { p = n; return; }
            out.push(s === p ? String(s) : s + '～' + p);
            s = p = n;
        });
        return out.join('・');
    }

    return { parse: parse, parseTitle: parseTitle, makeLabel: makeLabel };
}));
