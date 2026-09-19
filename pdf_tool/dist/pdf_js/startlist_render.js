/*
 * startlist_render.js  スタートリストを HTML にする
 *
 *   NISHI 下段（【info-ch用 ソースコード】）と同じ構成
 *     種目ごとの開閉タブ（cp_actab）＋ 表（s-tbl2）
 *   色（お客様ご指定）
 *     種目の見出し：背景 #73E65C（文字は男子 #0B3D91・女子 #A3004F）
 *     男子：組の行 #93C6F4 ／ 交互の行 #ECF5FF と白
 *     女子：組の行 #FFA4FD ／ 交互の行 #FFECFF と白
 *   各行：氏名(学年) 所属(都道府県) ＋ 資格記録（後ろ・前・なしを選択）
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.StartListRender = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // 種目の見出し（開閉タブ）の背景はお客様ご指定の #73E65C。
    // 文字色は緑の背景でも読めるように、男子は濃い青・女子は濃いピンク
    var LABEL_BG = '#73E65C';
    var COLORS = {
        '男子': { head: '#93C6F4', light: '#ECF5FF', label: '#0B3D91' },
        '女子': { head: '#FFA4FD', light: '#FFECFF', label: '#A3004F' }
    };
    var TITLE_COLOR = '#FF0000';     // 「スタートリスト」の文字色
    var WHITE = '#FFFFFF';

    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function palette(gender) {
        return COLORS[gender] || COLORS['男子'];
    }

    function entryText(e, qualPos) {
        var parts = [];
        if (e.name) parts.push(e.name);
        if (e.team || e.pref) parts.push(e.team ? e.team + (e.pref && e.pref !== e.team ? '(' + e.pref + ')' : '') : e.pref);
        var body = parts.join(' ');
        if (e.qual && qualPos === 'before') return e.qual + ' ' + body;
        if (e.qual && qualPos === 'after') return body + ' ' + e.qual;
        return body;
    }

    function heatTitle(ev, h) {
        var s = [];
        if (ev.round) s.push(ev.round);
        if (ev.heats.length > 1 || h.no > 0) {
            if (h.tag) s.push(h.tag + '組');
            else if (h.no > 0) s.push(h.no + '組');
        }
        return s.join(' ');
    }

    /**
     * events : StartList.parse() の events
     * opts   : { qualPos: 'after' | 'before' | 'none' }
     * 戻り値 : .ex-box の中に入れる HTML
     */
    function render(events, opts) {
        opts = opts || {};
        var qualPos = opts.qualPos || 'after';
        var usedIds = {};
        var out = [];
        events.forEach(function (ev) {
            var pal = palette(ev.gender);
            var id = ev.label.replace(/\s+/g, '');
            if (usedIds[id]) { usedIds[id]++; id += '_' + usedIds[id]; } else usedIds[id] = 1;

            out.push('<div class="cp_actab">');
            out.push('<input id="' + esc(id) + '" type="checkbox" name="tabs">');
            out.push('<label for="' + esc(id) + '" style="color:' + pal.label + ';background-color:' + LABEL_BG + ';">' + esc(ev.label) + '</label>');
            out.push('<div class="cp_actab-content">');
            out.push('');
            out.push('<table class="s-tbl2" width="100%" style="width:100%;">');
            var rowNo = 0;          // 表の中の行番号（組の行も数える）
            ev.heats.forEach(function (h) {
                rowNo++;
                var t = heatTitle(ev, h);
                out.push('<tr>');
                out.push('<td style="color:#000000;text-align:center;" width="100%" bgcolor="' + pal.head + '">');
                out.push('<span style="color:' + TITLE_COLOR + ';font-weight:bold;">スタートリスト</span>' + (t ? ' ' + esc(t) : ''));
                out.push('</td>');
                out.push('</tr>');
                h.entries.forEach(function (e) {
                    rowNo++;
                    out.push('<tr>');
                    out.push('<td bgcolor="' + (rowNo % 2 === 0 ? pal.light : WHITE) + '">');
                    out.push(esc(entryText(e, qualPos)));
                    out.push('</td>');
                    out.push('</tr>');
                });
            });
            out.push('</table>');
            out.push('</div>');
            out.push('</div>');
        });
        return out.join('\r\n') + '\r\n';
    }

    return { render: render, entryText: entryText, COLORS: COLORS };
}));
