/*
 * timetable_render.js  タイムテーブルを HTML にする
 *
 *   日ごとに 1つの表：日付の行 → 項目名の行 → 種目の行
 *   項目：時刻／性別／種別／種目／ラウンド／組（種別がない大会は種別の列を出しません）
 *   色（お客様ご指定）：種目の行は #FFFFFF と #D0D6D4 を 1行ずつ交互
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
    var TD = 'border:1px solid #999999;padding:5px 6px;';

    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /**
     * days : TimeTable.parse() の days
     * opts : { sort: 'time' | 'pdf' }
     */
    function render(days, opts) {
        opts = opts || {};
        var byTime = opts.sort !== 'pdf';
        var hasCls = days.some(function (d) { return d.rows.some(function (r) { return r.cls; }); });
        var cols = [
            { key: 'time', label: '時刻', width: '10%', center: true },
            { key: 'gender', label: '性別', width: '9%', center: true }
        ];
        if (hasCls) cols.push({ key: 'cls', label: '種別', width: '15%' });
        cols.push({ key: 'event', label: '種目' }, { key: 'round', label: 'ラウンド', width: '17%' }, { key: 'heats', label: '組', width: '13%', center: true });

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
                out.push('<td style="' + TD + 'font-weight:bold;text-align:center;"' + (c.width ? ' width="' + c.width + '"' : '') + ' bgcolor="' + HEAD_BG + '">' + c.label + '</td>');
            });
            out.push('</tr>');
            rows.forEach(function (r, i) {
                var bg = ROW_COLORS[i % 2];
                out.push('<tr>');
                cols.forEach(function (c) {
                    out.push('<td style="' + TD + (c.center ? 'text-align:center;' : '') + '" bgcolor="' + bg + '">' + esc(r[c.key] || '') + '</td>');
                });
                out.push('</tr>');
            });
            out.push('</table>');
        });
        return out.join('\r\n') + '\r\n';
    }

    return { render: render };
}));
