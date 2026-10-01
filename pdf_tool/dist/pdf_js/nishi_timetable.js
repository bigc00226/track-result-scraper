/*
 * nishi_timetable.js  NISHI の大会ページ（…/shtml/TimeTable.html）のタイムテーブル
 *                     → PDF のタイムテーブルと同じ形（時刻・性別・種別・種目・ラウンド・組）
 *
 *   大会ページの TimeTable.json の TimeTableList（日付 → 全種目・男女 → 組ごとの行）を読みます。
 *     ・同じ時刻・種目・ラウンドの組は 1行にまとめて組の数（「3組」）
 *     ・同じ種目・ラウンドの組が何回かに分かれている場合は、時間帯ごとに「1～4組」「5～8組」
 *     ・跳躍・投てきの「Group A」「Group B」の時刻が違う場合は「A組」「B組」
 *     ・「A決勝」「B決勝」はラウンドの欄に表示
 *     ・「ﾀｲﾑﾚｰｽ」→「タイムレース」、「予　選」→「予選」
 *     ・混成競技の各種目は「七種競技 100mH」（PDF のタイムテーブルと同じ）
 *   表の HTML は、PDF のタイムテーブルと同じ TimeTableRender で作ります。
 *
 *   fromJson(TimeTable.json) → { days: [{ date, rows }], rows, warnings }（TimeTable.parse と同じ形）
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./pdfcore.js'));
    } else {
        root.NishiTimeTable = factory(root.PdfCore);
    }
}(typeof self !== 'undefined' ? self : this, function (C) {
    'use strict';

    var WEEK = '日月火水木金土';
    var SEX_RE = /^(.*?)(男女混合|男女|混合|男子|女子)(.*)$/;
    var EVENT_HEAD = /(\d+(?:\.\d+)?(?:m|M|km|KM)|\d+[×xX]|走高跳|棒高跳|走幅跳|三段跳|砲丸投|円盤投|ハンマー投|やり投|ジャベリック|[一二三四五六七八九十]種競技|混成|競歩|リレー)/;

    function text(s) {
        return C.hanToZenKana(C.zenToHanAscii(String(s === null || s === undefined ? '' : s))).replace(/[\s　]+/g, ' ').trim();
    }

    function nospace(s) { return String(s).replace(/[\s　]+/g, ''); }

    // 「高校女子七種競技100mH」→ 性別 女子・種別 高校・種目 七種競技 100mH
    function splitEvent(name) {
        var s = nospace(text(name));
        var m = s.match(SEX_RE);
        var gender = '', cls = '', rest = s;
        if (m) {
            gender = /男女|混合/.test(m[2]) ? '男女' : m[2];
            cls = m[1];
            rest = m[3];
        }
        // 性別の後ろの種別（「男子共通100m」の「共通」）
        var i = rest.search(EVENT_HEAD);
        if (i > 0) { cls += rest.slice(0, i); rest = rest.slice(i); }
        var k = rest.match(/^([一二三四五六七八九十]種競技)(.+)$/);
        if (k) rest = k[1] + ' ' + k[2];
        return { gender: gender, cls: cls, event: rest.replace(/(\d)[xX]/g, '$1×') };
    }

    function roundName(r) {
        return nospace(text(r));
    }

    // 1日分の組ごとの行（全種目・男女）。無い場合は種目別・男女別の行を集める
    function entriesOf(day) {
        if (day && day.Shumoku_a && day.Shumoku_a.Seibetsu_a && day.Shumoku_a.Seibetsu_a.TimeTable) {
            return day.Shumoku_a.Seibetsu_a.TimeTable;
        }
        var out = [], seen = {};
        Object.keys(day || {}).forEach(function (sk) {
            Object.keys(day[sk] || {}).forEach(function (gk) {
                if (gk === 'Seibetsu_a') return;
                ((day[sk][gk] || {}).TimeTable || []).forEach(function (e) {
                    var key = [e.KaishiJikan, e.KyogiMei, e.Round, e.KumiNo, e.Kumi].join('|');
                    if (!seen[key]) { seen[key] = 1; out.push(e); }
                });
            });
        });
        return out.sort(function (a, b) { return String(a.KaishiJikan).localeCompare(String(b.KaishiJikan)); });
    }

    function dateLabel(key, value) {
        var m = String(key || value || '').replace(/\D/g, '').match(/^(\d{4})(\d{2})(\d{2})/);
        if (!m) return String(value || key || '');
        var d = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
        return parseInt(m[2], 10) + '月' + parseInt(m[3], 10) + '日（' + WEEK.charAt(d.getDay()) + '）';
    }

    // 組の表示：数字の組は範囲（「1～4組」）、Group A などは「A組」
    function heatLabel(list, whole) {
        var nums = [], letters = [];
        list.forEach(function (h) {
            var g = text(h.Kumi).match(/^Group\s*([A-Z])$/i);
            if (g) letters.push(g[1].toUpperCase());
            else if (/^\d+$/.test(String(h.KumiNo))) nums.push(parseInt(h.KumiNo, 10));
        });
        if (letters.length && !nums.length) return whole ? (letters.length > 1 ? letters.length + '組' : '') : letters.join('・') + '組';
        if (!nums.length) return '';
        nums.sort(function (a, b) { return a - b; });
        if (whole) return nums.length > 1 ? nums.length + '組' : '';
        var a = nums[0], b = nums[nums.length - 1];
        return (a === b ? a : a + '～' + b) + '組';
    }

    function fromJson(tt) {
        var warnings = [];
        var days = [];
        var list = (tt && tt.TimeTableList) || {};
        var keys = (tt && tt.NitteiList && tt.NitteiList.length)
            ? tt.NitteiList.map(function (n) { return { key: n.Key, value: n.Value }; })
            : Object.keys(list).sort().map(function (k) { return { key: k, value: k }; });
        var total = 0;
        keys.forEach(function (dk) {
            var entries = entriesOf(list[dk.key]);
            if (!entries.length) return;
            // 同じ時刻・種目・ラウンドの組をまとめる（「A決勝」「B決勝」はラウンド）
            var groups = [], byKey = {};
            entries.forEach(function (e) {
                var kumi = text(e.Kumi);
                var round = roundName(e.Round);
                var fin = kumi.match(/^([A-ZＡ-Ｚ])決勝$/);
                if (fin) round = C.zenToHanAscii(fin[1]) + '決勝';
                var time = text(e.KaishiJikan).replace(/^0(\d:)/, '$1');     // 「09:00」→「9:00」（PDF のタイムテーブルと同じ）
                var ev = nospace(text(e.KyogiMei));
                var k = time + '|' + ev + '|' + round;
                var g = byKey[k];
                if (!g) {
                    g = byKey[k] = { time: time, name: ev, round: round, heats: [], seq: groups.length, final: !!fin };
                    groups.push(g);
                }
                g.heats.push(e);
            });
            // 同じ種目・ラウンドが何回かの時間帯に分かれているか
            var slots = {};
            groups.forEach(function (g) {
                var k = g.name + '|' + g.round;
                slots[k] = (slots[k] || 0) + 1;
            });
            var rows = groups.map(function (g) {
                var sp = splitEvent(g.name);
                var whole = slots[g.name + '|' + g.round] === 1;
                return { time: g.time, gender: sp.gender, cls: sp.cls, event: sp.event, round: g.round,
                         heats: g.final ? '' : heatLabel(g.heats, whole), seq: g.seq };
            });
            total += rows.length;
            days.push({ date: dateLabel(dk.key, dk.value), rows: rows });
        });
        if (!days.length) warnings.push({ type: 'none', message: '大会ページのタイムテーブルに種目がありませんでした。' });
        return { days: days, rows: total, warnings: warnings };
    }

    return { fromJson: fromJson, splitEvent: splitEvent };
}));
