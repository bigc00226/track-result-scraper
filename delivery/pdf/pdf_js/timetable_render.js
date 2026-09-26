/*
 * timetable_render.js  タイムテーブルを HTML にする
 *
 *   日ごとに 1つの表：日付の行 → 項目名の行 →（区分の行「●トラック」など）→ 種目の行
 *   項目：時刻／性別／種別／種目／ラウンド／組（種別がない大会は種別の列を出しません）
 *   色（お客様ご指定）：種目の行は #FFFFFF と #D0D6D4 を 1行ずつ交互
 *   スマートフォンで見たときに「男子」などが縦に 1文字ずつ折り返さないよう、
 *   時刻・性別・組の列は折り返さない指定にしています。
 *   貼り付け先のサイトの CSS が効かなくても同じ見た目になるように、色・枠は HTML に直接書きます。
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./timetable.js'));
    } else {
        root.TimeTableRender = factory(root.TimeTable);
    }
}(typeof self !== 'undefined' ? self : this, function (TT) {
    'use strict';

    var ROW_COLORS = ['#FFFFFF', '#D0D6D4'];
    var DATE_BG = '#6E6E6E';          // 日付の行（NISHI の見出しと同じグレー）
    var HEAD_BG = '#A9B3AF';          // 項目名の行
    var SECTION_BG = '#73E65C';       // 区分の行（スタートリストの種目の見出しと同じ緑）
    var TD = 'border:1px solid #999999;padding:5px 4px;';
    var NOWRAP = 'white-space:nowrap;';
    var WRAP = 'overflow-wrap:anywhere;';     // 「110mH(0.991m/9.14m)」のような長い語も、画面の幅で折り返す

    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function isJump(r) { return /走高跳|棒高跳|走幅跳|三段跳/.test(r.event); }
    function isThrow(r) { return /砲丸投|円盤投|ハンマー投|やり投|ジャベリック/.test(r.event); }
    function isTrack(r) { return !isJump(r) && !isThrow(r); }

    // 区分の分け方
    var SECTIONS = {
        jt: [['トラック', isTrack], ['跳躍', isJump], ['投てき', isThrow]],
        field: [['トラック', isTrack], ['フィールド', function (r) { return !isTrack(r); }]]
    };

    /**
     * days : TimeTable.parse() の days
     * opts : { sort: 'time' | 'pdf', section: 'jt' | 'field' | 'none' }
     */
    function render(days, opts) {
        opts = opts || {};
        var byTime = opts.sort !== 'pdf';
        var sections = SECTIONS[opts.section || 'jt'] || null;
        var hasCls = days.some(function (d) { return d.rows.some(function (r) { return r.cls; }); });
        // 列の幅は中身に合わせる（スマートフォンでは、長い種別・種目だけが折り返す）
        var cols = [
            { key: 'time', label: '時刻', center: true, nowrap: true },
            { key: 'gender', label: '性別', center: true, nowrap: true }
        ];
        if (hasCls) cols.push({ key: 'cls', label: '種別' });
        cols.push({ key: 'event', label: '種目' }, { key: 'round', label: 'ラウンド' },
                  { key: 'heats', label: '組', center: true, nowrap: true });

        var out = [];
        days.forEach(function (d) {
            var rows = d.rows.slice();
            if (byTime) {
                rows.sort(function (a, b) {
                    var ta = TT.minutes(a.time), tb = TT.minutes(b.time);
                    if (ta === null) ta = 24 * 60;
                    if (tb === null) tb = 24 * 60;
                    return ta - tb || a.seq - b.seq;
                });
            }
            out.push('<table class="t-tbl" width="100%" style="width:100%;border-collapse:collapse;word-wrap:break-word;margin:0 0 12px 0;">');
            if (d.date) {
                out.push('<tr>');
                out.push('<td colspan="' + cols.length + '" style="' + TD + 'color:#FFFFFF;font-weight:bold;" bgcolor="' + DATE_BG + '">' + esc(d.date) + '</td>');
                out.push('</tr>');
            }
            out.push('<tr>');
            cols.forEach(function (c) {
                out.push('<td style="' + TD + NOWRAP + 'font-weight:bold;text-align:center;" bgcolor="' + HEAD_BG + '">' + c.label + '</td>');
            });
            out.push('</tr>');
            var groups = sections
                ? sections.map(function (s) { return { name: s[0], rows: rows.filter(s[1]) }; }).filter(function (g) { return g.rows.length; })
                : [{ name: '', rows: rows }];
            groups.forEach(function (g) {
                if (g.name) {
                    out.push('<tr>');
                    out.push('<td colspan="' + cols.length + '" style="' + TD + 'color:#000000;font-weight:bold;" bgcolor="' + SECTION_BG + '">●' + esc(g.name) + '</td>');
                    out.push('</tr>');
                }
                g.rows.forEach(function (r, i) {
                    var bg = ROW_COLORS[i % 2];
                    out.push('<tr>');
                    cols.forEach(function (c) {
                        out.push('<td style="' + TD + (c.center ? 'text-align:center;' : '') + (c.nowrap ? NOWRAP : WRAP) + '" bgcolor="' + bg + '">' + esc(r[c.key] || '') + '</td>');
                    });
                    out.push('</tr>');
                });
            });
            out.push('</table>');
        });
        return out.join('\r\n') + '\r\n';
    }

    return { render: render, isTrack: isTrack, isJump: isJump, isThrow: isThrow };
}));
