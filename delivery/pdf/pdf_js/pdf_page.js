/*
 * pdf_page.js  出力画面（pdf_startlist.php / pdf_result.php）の共通処理
 *
 *   ・トップページで選んだ PDF を受け取る（window.opener.__pdfToolFile）
 *     受け取れない場合は、この画面の「PDFを選択」から読み込めます
 *   ・PDF はブラウザの中だけで読み取り、サーバには送信・保存しません
 */
(function (root) {
    'use strict';

    var PDFJS_VER = '3.11.174';
    var CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + PDFJS_VER + '/';

    var cfg = null;
    var lastModel = null;

    function $(id) { return document.getElementById(id); }

    function setStatus(msg, isError) {
        var el = $('pdf-status');
        el.textContent = msg;
        el.style.color = isError ? '#CC0000' : '#333333';
    }

    function showWarnings(list) {
        var el = $('pdf-warn');
        el.innerHTML = '';
        if (!list || !list.length) { el.style.display = 'none'; return; }
        var ul = document.createElement('ul');
        list.forEach(function (w) {
            var li = document.createElement('li');
            li.textContent = w.message;
            ul.appendChild(li);
        });
        var h = document.createElement('div');
        h.style.fontWeight = 'bold';
        h.textContent = 'ご確認ください';
        el.appendChild(h);
        el.appendChild(ul);
        el.style.display = 'block';
    }

    function readFile(file) {
        if (file.arrayBuffer) return file.arrayBuffer();
        return new Promise(function (resolve, reject) {
            var fr = new FileReader();
            fr.onload = function () { resolve(fr.result); };
            fr.onerror = function () { reject(fr.error); };
            fr.readAsArrayBuffer(file);
        });
    }

    function process(file) {
        if (!file) return;
        if (!/\.pdf$/i.test(file.name || '') && file.type && file.type !== 'application/pdf') {
            setStatus('PDFファイルを選択してください。', true);
            return;
        }
        $('pdf-filename').textContent = file.name || '';
        document.querySelector('.ex-box').innerHTML = '';
        showWarnings([]);
        setStatus('PDFを読み込んでいます…');
        var t0 = Date.now();
        readFile(file).then(function (buf) {
            // 別のウィンドウのデータなので、この画面の中にコピーしてから使う
            var data = new Uint8Array(buf.byteLength);
            data.set(new Uint8Array(buf));
            return PdfCore.loadPages(root.pdfjsLib, data, {
                cMapUrl: CDN + 'cmaps/',
                standardFontDataUrl: CDN + 'standard_fonts/',
                onProgress: function (done, total) {
                    setStatus('PDFを読み取っています… ' + done + ' / ' + total + ' ページ');
                }
            });
        }).then(function (pages) {
            var model = cfg.parse(pages);
            lastModel = model;
            draw();
            var sec = ((Date.now() - t0) / 1000).toFixed(1);
            setStatus(cfg.summary(model, pages) + '（' + sec + '秒）');
            showWarnings(model.warnings);
        }).catch(function (err) {
            var msg = err && err.name === 'PasswordException'
                ? 'パスワードのかかったPDFのため読み込めませんでした。'
                : 'PDFを読み込めませんでした。ファイルが壊れていないかご確認ください。';
            setStatus(msg + (err && err.message ? '（' + err.message + '）' : ''), true);
            if (root.console) console.error(err);
        });
    }

    function draw() {
        if (!lastModel) return;
        document.querySelector('.ex-box').innerHTML = cfg.render(lastModel, currentOptions());
    }

    function currentOptions() {
        var opt = {};
        ['pdf-qualpos', 'pdf-teamformat', 'pdf-labelstyle'].forEach(function (name) {
            var radios = document.querySelectorAll('input[name="' + name + '"]');
            for (var i = 0; i < radios.length; i++) {
                if (!radios[i].checked) continue;
                if (name === 'pdf-qualpos') opt.qualPos = radios[i].value;
                else if (name === 'pdf-teamformat') opt.teamFormat = radios[i].value;
                else opt.labelStyle = radios[i].value;
            }
        });
        var open = document.getElementById('pdf-openall');
        opt.openAll = !!(open && open.checked);
        return opt;
    }

    // 表示の選び方を、このパソコンのブラウザに覚えさせる
    var STORE_KEY = 'pdfToolOptions';

    function saveOptions() {
        try {
            var o = {};
            var inputs = document.querySelectorAll('#pdf-panel input[type="radio"], #pdf-panel input[type="checkbox"]');
            for (var i = 0; i < inputs.length; i++) {
                var el = inputs[i];
                if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; }
                else o[el.id] = el.checked;
            }
            localStorage.setItem(STORE_KEY + '.' + cfg.mode, JSON.stringify(o));
        } catch (e) { /* 使えない場合は覚えないだけ */ }
    }

    function restoreOptions() {
        try {
            var raw = localStorage.getItem(STORE_KEY + '.' + cfg.mode);
            if (!raw) return;
            var o = JSON.parse(raw);
            Object.keys(o).forEach(function (k) {
                if (typeof o[k] === 'boolean') {
                    var el = document.getElementById(k);
                    if (el) el.checked = o[k];
                } else {
                    var r = document.querySelector('#pdf-panel input[name="' + k + '"][value="' + o[k] + '"]');
                    if (r) r.checked = true;
                }
            });
        } catch (e) { /* 壊れていたら既定のまま */ }
    }

    function init(c) {
        cfg = c;
        if (!root.pdfjsLib) {
            setStatus('PDFの読み取り機能（pdf.js）を読み込めませんでした。インターネット接続をご確認ください。', true);
            return;
        }
        root.pdfjsLib.GlobalWorkerOptions.workerSrc = CDN + 'legacy/build/pdf.worker.min.js';

        $('pdf-file').addEventListener('change', function () {
            if (this.files && this.files[0]) process(this.files[0]);
        });
        restoreOptions();
        var inputs = document.querySelectorAll('#pdf-panel input[type="radio"], #pdf-panel input[type="checkbox"]');
        for (var i = 0; i < inputs.length; i++) inputs[i].addEventListener('change', function () { saveOptions(); draw(); });

        // トップページで選んだ PDF を受け取る
        var file = null;
        try {
            if (root.opener && root.opener.__pdfToolFile && root.opener.__pdfToolMode === cfg.mode) {
                file = root.opener.__pdfToolFile;
                root.opener.__pdfToolFile = null;
            }
        } catch (e) { file = null; }
        if (file) process(file);
        else setStatus('PDFファイルを選択してください。');
    }

    root.PdfPage = { init: init };
}(typeof self !== 'undefined' ? self : this));
