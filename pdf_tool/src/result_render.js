/*
 * result_render.js  結果を 1.php（nishi.php）と同じ表の HTML にする
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.ResultRender = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    function h(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    function render(headers, rows) {
        var out = '<table align="center" bgcolor="#333333">\r\n\r\n<tr>\r\n';
        headers.forEach(function (x) {
            out += '<td align="center" style="padding:3px;" bgcolor="#9FCFFF">\r\n' + h(x) + '\r\n</td>\r\n';
        });
        out += '</tr>\r\n';
        rows.forEach(function (row) {
            out += '\r\n<tr>\r\n';
            row.forEach(function (v) {
                out += '<td style="padding:3px;" bgcolor="#FFFFFF">\r\n' + h(v) + '\r\n</td>\r\n';
            });
            out += '\r\n</tr>\r\n';
        });
        out += '</table>\r\n';
        return out;
    }

    return { render: render };
}));
