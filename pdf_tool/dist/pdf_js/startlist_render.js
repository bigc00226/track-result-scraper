/*
 * startlist_render.js  スタートリストを HTML にする
 *
 *   NISHI 下段（【info-ch用 ソースコード】）と同じ構成
 *     種目ごとの開閉タブ（cp_actab）＋ 表（s-tbl2）
 *   色（お客様ご指定）
 *     男子：組の行 #93C6F4 ／ 交互の行 #ECF5FF と白
 *     女子：組の行 #FFA4FD ／ 交互の行 #FFECFF と白
 *     種目の見出し：画面で切り替え
 *       green-bg   … 背景 #73E65C ＋ 文字 男子 #0B3D91・女子 #A3004F（初期）
 *       green-text … 背景 #6E6E6E（元のグレー）＋ 文字 #73E65C
 *   各行：氏名(学年) (所属・都道府県) ＋ 資格記録（後ろ・前・なしを選択）
 *     所属の表示は「(所属・都道府県)」と「所属(都道府県)」を画面で切り替え
 *   種目は最初から開いた状態にもできます（画面で切り替え）
 *   見出しの形式（画面で切り替え）
 *     checkbox … NISHI 下段と同じ（サイト側の CSS で開閉・「＋」を表示）
 *     details  … <details> を使い、色・枠・太さを HTML に直接書く
 *                （貼り付け先の CSS が効かない・チェックボックスが消えるサイト用）
 *     plain    … 開閉なし。種目名も表の 1行目にした、ただの表（どのサイトでも表示できる）
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
    var GREEN = '#73E65C';
    var GRAY = '#6E6E6E';
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

    function entryText(e, qualPos, teamFormat) {
        var parts = [];
        if (e.name) parts.push(e.name);
        var pref = e.pref && e.pref !== e.team ? e.pref : '';
        if (e.team || pref) {
            if (teamFormat === 'plain') {
                // 所属(都道府県)
                parts.push(e.team ? e.team + (pref ? '(' + pref + ')' : '') : pref);
            } else {
                // (所属・都道府県)
                parts.push('(' + [e.team, pref].filter(Boolean).join('・') + ')');
            }
        }
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

    // 見出し（種目名）の体裁。貼り付け先の CSS が効かなくても同じ見た目になるように書く
    var LABEL_STYLE = 'font-weight:bold;line-height:3;position:relative;display:block;padding:0 0 0 1em;margin:0 0 1px 0;cursor:pointer;';
    // <summary> は display:block にすると開閉の印（▶）が消えるので、そのままにする
    var SUMMARY_STYLE = LABEL_STYLE.replace('display:block;', '');
    var TD_STYLE = 'border:1px solid #555555;padding:5px;';

    /**
     * events : StartList.parse() の events
     * opts   : { qualPos: 'after'|'before'|'none', teamFormat, labelStyle, openAll, tabStyle }
     * 戻り値 : .ex-box の中に入れる HTML
     */
    function render(events, opts) {
        opts = opts || {};
        var qualPos = opts.qualPos || 'after';
        var teamFormat = opts.teamFormat || 'paren';
        var greenText = opts.labelStyle === 'green-text';     // 初期は緑背景＋濃い文字
        var openAll = !!opts.openAll;
        var details = opts.tabStyle === 'details';            // 初期は NISHI と同じチェックボックス
        var plain = opts.tabStyle === 'plain';
        var usedIds = {};
        var out = [];
        events.forEach(function (ev) {
            var pal = palette(ev.gender);
            var id = ev.label.replace(/\s+/g, '');
            if (usedIds[id]) { usedIds[id]++; id += '_' + usedIds[id]; } else usedIds[id] = 1;
            var labelStyle = 'color:' + (greenText ? GREEN : pal.label) + ';background-color:' + (greenText ? GRAY : GREEN) + ';';

            // 開閉なし（plain）は外側の枠を付けず、見出しを表の 1行目にする
            if (details) {
                out.push('<details class="cp_actab"' + (openAll ? ' open' : '') + ' style="width:100%;margin:0 auto;">');
                out.push('<summary style="' + labelStyle + SUMMARY_STYLE + '">' + esc(ev.label) + '</summary>');
                out.push('<div class="cp_actab-content" style="color:#333333;background:#FFFFFF;">');
            } else if (!plain) {
                out.push('<div class="cp_actab">');
                out.push('<input id="' + esc(id) + '" type="checkbox" name="tabs"' + (openAll ? ' checked' : '') + '>');
                out.push('<label for="' + esc(id) + '" style="' + labelStyle + LABEL_STYLE + '">' + esc(ev.label) + '</label>');
                out.push('<div class="cp_actab-content">');
            }
            if (!plain) out.push('');
            var own = details || plain;      // 色・枠を HTML に直接書く形式
            out.push('<table class="s-tbl2" width="100%" style="width:100%;' + (own ? 'border-collapse:collapse;table-layout:fixed;word-wrap:break-word;' : '') +
                (plain ? 'margin:0 0 12px 0;' : '') + '">');
            var td = own ? TD_STYLE : '';
            if (plain) {
                out.push('<tr>');
                out.push('<td style="' + TD_STYLE + labelStyle + 'font-weight:bold;padding:8px 12px;" width="100%" bgcolor="' + (greenText ? GRAY : GREEN) + '">' + esc(ev.label) + '</td>');
                out.push('</tr>');
            }
            var rowNo = 0;          // 表の中の行番号（組の行も数える）
            ev.heats.forEach(function (h) {
                rowNo++;
                var t = heatTitle(ev, h);
                out.push('<tr>');
                out.push('<td style="' + td + 'color:#000000;text-align:center;" width="100%" bgcolor="' + pal.head + '">');
                out.push('<span style="color:' + TITLE_COLOR + ';font-weight:bold;">スタートリスト</span>' + (t ? ' ' + esc(t) : ''));
                out.push('</td>');
                out.push('</tr>');
                h.entries.forEach(function (e) {
                    rowNo++;
                    out.push('<tr>');
                    out.push('<td' + (td ? ' style="' + td + '"' : '') + ' bgcolor="' + (rowNo % 2 === 0 ? pal.light : WHITE) + '">');
                    out.push(esc(entryText(e, qualPos, teamFormat)));
                    out.push('</td>');
                    out.push('</tr>');
                });
            });
            out.push('</table>');
            if (!plain) {
                out.push('</div>');
                out.push(details ? '</details>' : '</div>');
            }
        });
        return out.join('\r\n') + '\r\n';
    }

    return { render: render, entryText: entryText, COLORS: COLORS };
}));
