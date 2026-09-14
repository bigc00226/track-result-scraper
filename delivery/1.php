<?php
/*
 * ============================================================================
 *  NISHI 形式 大会結果 一覧出力（1.php）
 * ============================================================================
 *  対象   : https://.../shtml/TimeTable.html 形式の大会結果ページ
 *           （TimeTable.json / Taikai.json / result/ 以下の各 json を読み込みます）
 *  使い方 : 1.php?url=https://.../shtml/TimeTable.html   （POST の url でも可）
 *
 *  出力列 : 日付 / 大会名 / 種目 / 風速 / レース状況 / 組 / 順位 / 記録 / 氏名 /
 *           氏名カナ / 学年 / 所属1 / 所属2 / 性別 / 表示/非表示 / 備考
 *           ※ 氏名カナ・表示/非表示・備考 は空欄で出力します
 *
 *  記録   : 1/100 表示の記録（Kiroku100）を使用します。
 *           旧仕様のページ（Kiroku のみ）にも対応しています。
 *  文字   : UTF-8
 *  PHP    : 5.4 以降（7.x / 8.x で動作）
 * ============================================================================
 */

header('Content-Type: text/html; charset=UTF-8');
@set_time_limit(300);
mb_internal_encoding('UTF-8');

/* ---------------------------------------------------------------------------
 *  設定
 * ------------------------------------------------------------------------- */
define('NISHI_KONSEI_TOTAL', true);    // 混成競技（八種競技 等）の総合結果を出力する
define('NISHI_KONSEI_EVENTS', false);  // 混成競技の各種目（八種競技100m 等）も出力する
define('NISHI_FETCH_PARALLEL', 8);     // 結果ファイルの同時取得数
define('NISHI_FETCH_TIMEOUT', 30);     // 1ファイルあたりのタイムアウト（秒）
define('NISHI_FETCH_DEADLINE', 240);   // 取得処理全体の上限（秒）
define('NISHI_USER_AGENT', 'Mozilla/5.0 (compatible; NishiResultExport/1.0)');

/* ---------------------------------------------------------------------------
 *  メイン
 * ------------------------------------------------------------------------- */
$nishi_input_url = '';
if (isset($_POST['url']) && trim($_POST['url']) !== '') {
    $nishi_input_url = trim($_POST['url']);
} elseif (isset($_GET['url'])) {
    $nishi_input_url = trim($_GET['url']);
}

$nishi_errors = array();
$nishi_rows = nishi_build_rows($nishi_input_url, $nishi_errors);
nishi_render($nishi_rows, $nishi_errors);


/* ===========================================================================
 *  一覧データ作成
 * ========================================================================= */
function nishi_build_rows($input_url, &$errors)
{
    $rows = array();

    if ($input_url === '') {
        $errors[] = 'URL を入力してください。';
        return $rows;
    }
    $bases = nishi_base_candidates($input_url);
    if (!$bases) {
        $errors[] = 'URL の形式が正しくありません（http:// または https:// で始まる TimeTable.html の URL を入力してください）。';
        return $rows;
    }

    // TimeTable.json（種目・ラウンド一覧）
    $base = '';
    $tt = null;
    foreach ($bases as $candidate) {
        $got = nishi_fetch_all(array($candidate . 'TimeTable.json'));
        $json = nishi_json_decode($got[$candidate . 'TimeTable.json']);
        if (is_array($json) && isset($json['SyumokuBetsuList']) && is_array($json['SyumokuBetsuList'])) {
            $base = $candidate;
            $tt = $json;
            break;
        }
    }
    if ($tt === null) {
        $errors[] = 'TimeTable.json を取得できませんでした。URL をご確認ください。';
        return $rows;
    }

    // 種目の並び順（KyogiList の順）
    $event_order = array();
    if (isset($tt['KyogiList']) && is_array($tt['KyogiList'])) {
        foreach ($tt['KyogiList'] as $i => $name) {
            $key = nishi_key($name);
            if (!isset($event_order[$key])) {
                $event_order[$key] = $i;
            }
        }
    }

    // ラウンド一覧（結果ページ単位で重複を除く）
    $rounds = array();
    foreach ($tt['SyumokuBetsuList'] as $seq => $entry) {
        if (!is_array($entry) || !isset($entry['LinkRound'])) {
            continue;
        }
        $link = trim($entry['LinkRound']);
        if ($link === '' || isset($rounds[$link])) {
            continue;
        }
        if (!preg_match('#^\./result/([A-Za-z]+)/((\d{8})_[^/?\#]+)\.html#', $link, $m)) {
            continue;
        }
        $kyogimei = isset($entry['KyogiMei']) ? $entry['KyogiMei'] : '';
        $split = nishi_split_kyogimei($kyogimei);
        $rounds[$link] = array(
            'seq'      => $seq,
            'folder'   => strtolower($m[1]),
            'date'     => $m[3],
            'url'      => $base . 'result/' . $m[1] . '/' . $m[2] . '.json',
            'key'      => nishi_key($kyogimei),
            'round'    => nishi_nospace(nishi_text(isset($entry['Round']) ? $entry['Round'] : '')),
            'sex'      => $split['sex'],
            'category' => $split['category'],
            'event'    => nishi_event_name($split['event']),
            'konsei'   => (bool)preg_match('/種競技./u', $split['event']),
            'para'     => (mb_strpos(nishi_key($kyogimei), 'パラ') !== false),
        );
    }

    // 結果ファイルを取得
    $taikai_url = $base . 'Taikai.json';
    $konsei_url = $base . 'konseishukei/KonseiShukei.json';
    $want_konsei = NISHI_KONSEI_TOTAL && isset($tt['KonseiFlg']) && (string)$tt['KonseiFlg'] === '1';
    $urls = array($taikai_url);
    if ($want_konsei) {
        $urls[] = $konsei_url;
    }
    foreach ($rounds as $r) {
        $urls[] = $r['url'];
    }
    $bodies = nishi_fetch_all($urls);

    // 大会名
    $taikai = nishi_json_decode($bodies[$taikai_url]);
    $taikai_name = (is_array($taikai) && isset($taikai['TaikaiMei'])) ? nishi_text($taikai['TaikaiMei']) : '';

    // 種目・ラウンドごとの行
    $groups = array();
    $grade_map = array();
    $failed = 0;
    foreach ($rounds as $r) {
        $data = nishi_json_decode($bodies[$r['url']]);
        if (!is_array($data)) {
            $failed++;
            continue;
        }
        $round_rows = nishi_round_rows($data, $r, $taikai_name, $grade_map);
        if ($r['para'] || ($r['konsei'] && !NISHI_KONSEI_EVENTS) || !$round_rows) {
            continue;
        }
        $groups[] = array(
            'order' => isset($event_order[$r['key']]) ? $event_order[$r['key']] : 100000,
            'seq'   => $r['seq'],
            'rows'  => $round_rows,
        );
    }
    if ($failed > 0) {
        $errors[] = '結果ファイルを ' . $failed . ' 件取得できませんでした。時間をおいて再度実行してください。';
    }

    // 混成競技（総合）
    if ($want_konsei) {
        $index = nishi_json_decode($bodies[$konsei_url]);
        $list = (is_array($index) && isset($index['KonseiShukeiList']) && is_array($index['KonseiShukeiList'])) ? $index['KonseiShukeiList'] : array();
        $detail_urls = array();
        foreach ($list as $i => $k) {
            if (is_array($k) && isset($k['Link']) && preg_match('#details/([^/?\#]+)\.html#', $k['Link'], $m)) {
                $detail_urls[$i] = $base . 'konseishukei/details/' . $m[1] . '.json';
            }
        }
        $detail_bodies = $detail_urls ? nishi_fetch_all(array_values($detail_urls)) : array();
        foreach ($detail_urls as $i => $detail_url) {
            $data = nishi_json_decode($detail_bodies[$detail_url]);
            if (!is_array($data)) {
                $errors[] = '混成競技の結果ファイルを取得できませんでした（' . nishi_text($list[$i]['KyogiMei']) . '）。';
                continue;
            }
            $kyogimei = isset($list[$i]['KyogiMei']) ? $list[$i]['KyogiMei'] : '';
            $name_key = nishi_key($kyogimei);

            // 日付 = 混成各種目の最終日 / 並び順 = 最初の混成種目の位置
            $date = '';
            if ($name_key !== '') {
                foreach ($rounds as $r) {
                    if (strpos($r['key'], $name_key) === 0 && $r['date'] > $date) {
                        $date = $r['date'];
                    }
                }
            }
            if ($date === '' && isset($tt['NitteiList']) && is_array($tt['NitteiList'])) {
                foreach ($tt['NitteiList'] as $n) {
                    if (is_array($n) && isset($n['Key']) && (string)$n['Key'] > $date) {
                        $date = (string)$n['Key'];
                    }
                }
            }
            $order = 100000;
            foreach ($event_order as $key => $idx) {
                if ($name_key !== '' && strpos($key, $name_key) === 0 && $idx < $order) {
                    $order = $idx;
                }
            }

            $konsei_rows = nishi_konsei_rows($data, $kyogimei, $date, $taikai_name, $grade_map);
            if ($konsei_rows) {
                $groups[] = array('order' => $order, 'seq' => PHP_INT_MAX, 'rows' => $konsei_rows);
            }
        }
    }

    usort($groups, 'nishi_compare_groups');
    foreach ($groups as $g) {
        foreach ($g['rows'] as $row) {
            $rows[] = $row;
        }
    }
    if (!$rows && !$errors) {
        $errors[] = '出力できる結果がありませんでした。';
    }
    return $rows;
}

function nishi_compare_groups($a, $b)
{
    if ($a['order'] != $b['order']) {
        return ($a['order'] < $b['order']) ? -1 : 1;
    }
    if ($a['seq'] != $b['seq']) {
        return ($a['seq'] < $b['seq']) ? -1 : 1;
    }
    return 0;
}

/* ---------------------------------------------------------------------------
 *  1 ラウンド（トラック / 跳躍 / 投てき）の行
 * ------------------------------------------------------------------------- */
function nishi_round_rows($data, $r, $taikai_name, &$grade_map)
{
    $heats = nishi_heats($data);

    // 学年の対応表（混成の総合結果で学年が無い場合に使用）
    foreach ($heats as $h) {
        foreach ($h['athletes'] as $a) {
            if (isset($a['No']) && trim($a['No']) !== '' && !nishi_is_relay($a)) {
                list($name, $grade) = nishi_person(nishi_person_raw($a));
                if ($grade !== '') {
                    $grade_map[trim($a['No']) . '|' . $name] = $grade;
                }
            }
        }
    }

    // スタートリスト（結果未入力）の組は出力しない
    $done = array();
    foreach ($heats as $h) {
        if (nishi_heat_has_result($h['athletes'])) {
            $done[] = $h;
        }
    }

    $rows = array();
    $race = $r['round'] . ($r['category'] !== '' ? '【' . $r['category'] . '】' : '');
    $is_track = ($r['folder'] === 'track');
    $multi = (count($done) > 1);

    foreach ($done as $n => $h) {
        $heat_no = '';
        if ($multi) {
            $heat_no = nishi_heat_no($h['status']);
            if ($heat_no === '') {
                $heat_no = (string)($n + 1);
            }
        }

        // トラック種目の風速は組単位
        $heat_wind = '';
        if ($is_track) {
            foreach ($h['athletes'] as $a) {
                $heat_wind = nishi_wind(nishi_record_raw($a));
                if ($heat_wind !== '') {
                    break;
                }
            }
        }

        foreach ($h['athletes'] as $a) {
            $raw = nishi_record_raw($a);
            $record = nishi_record($raw, $r['event']);
            if ($record === '') {
                $record = nishi_status($a);
            }
            // 走幅跳・三段跳の風速は選手単位（最高記録の風速）
            $wind = $is_track ? $heat_wind : nishi_wind($raw);

            if (nishi_is_relay($a)) {
                $name = '';
                $grade = '';
                $team = isset($a['TeamTitle']) ? nishi_org($a['TeamTitle']) : '';
                if ($team === '') {
                    list($team, $pref) = nishi_affiliation(isset($a['ShozokuMei']) ? $a['ShozokuMei'] : '');
                }
                $aff1 = $team;
                $aff2 = '';
            } else {
                list($name, $grade) = nishi_person(nishi_person_raw($a));
                list($school, $pref) = nishi_affiliation(isset($a['ShozokuMei']) ? $a['ShozokuMei'] : (isset($a['Shozoku']) ? $a['Shozoku'] : ''));
                $aff1 = $pref;
                $aff2 = $school;
            }

            $rows[] = array(
                $r['date'], $taikai_name, $r['event'], $wind, $race, $heat_no,
                nishi_rank($a), $record, $name, '', $grade, $aff1, $aff2, $r['sex'], '', '',
            );
        }
    }
    return $rows;
}

/* ---------------------------------------------------------------------------
 *  混成競技 総合結果の行
 * ------------------------------------------------------------------------- */
function nishi_konsei_rows($data, $kyogimei, $date, $taikai_name, $grade_map)
{
    $rows = array();
    $list = (isset($data['KonseiResultList']) && is_array($data['KonseiResultList'])) ? $data['KonseiResultList'] : array();

    $has_result = false;
    foreach ($list as $a) {
        if (is_array($a) && (nishi_rank($a) !== '' || nishi_text(isset($a['Sougou']) ? $a['Sougou'] : '') !== '')) {
            $has_result = true;
            break;
        }
    }
    if (!$has_result) {
        return $rows;
    }

    $split = nishi_split_kyogimei($kyogimei);
    $event = nishi_event_name($split['event']);
    $race = '決勝' . ($split['category'] !== '' ? '【' . $split['category'] . '】' : '');

    foreach ($list as $a) {
        if (!is_array($a)) {
            continue;
        }
        $record = nishi_nospace(mb_convert_kana(nishi_text(isset($a['Sougou']) ? $a['Sougou'] : ''), 'as', 'UTF-8'));
        if ($record === '') {
            $record = nishi_status($a);
        }
        list($name, $grade) = nishi_person(isset($a['Kyogisha']) ? $a['Kyogisha'] : '');
        $no = isset($a['No']) ? trim($a['No']) : '';
        if ($grade === '' && isset($grade_map[$no . '|' . $name])) {
            $grade = $grade_map[$no . '|' . $name];
        }
        list($school, $pref) = nishi_affiliation(isset($a['Shozoku']) ? $a['Shozoku'] : '');

        $rows[] = array(
            $date, $taikai_name, $event, '', $race, '',
            nishi_rank($a), $record, $name, '', $grade, $pref, $school, $split['sex'], '', '',
        );
    }
    return $rows;
}

/* ---------------------------------------------------------------------------
 *  JSON 構造の読み取り
 * ------------------------------------------------------------------------- */

// 組の一覧 array(array('status' => '1組 確定', 'athletes' => array(...)), ...)
function nishi_heats($data)
{
    $info = array();
    if (isset($data['ResultInfo'])) {
        $info = $data['ResultInfo'];
    } else {
        // 走高跳・棒高跳は ResultInfo0（ComboList で切替）
        if (isset($data['ComboList'][0]['ComboKey']) && isset($data['ResultInfo' . $data['ComboList'][0]['ComboKey']])) {
            $info = $data['ResultInfo' . $data['ComboList'][0]['ComboKey']];
        } else {
            foreach ($data as $k => $v) {
                if (strpos((string)$k, 'ResultInfo') === 0 && is_array($v)) {
                    $info = $v;
                    break;
                }
            }
        }
    }
    if (!is_array($info)) {
        return array();
    }

    // トラック: {"2":[組...], "1":[組...]}  跳躍・投てき: [組{"ResultList":{"2":[...], "1":[...]}}]
    // "1" = 順位順 / "2" = レーン・試技順
    $list = nishi_is_list($info) ? $info : nishi_pick_list($info);
    $heats = array();
    foreach ($list as $h) {
        if (!is_array($h)) {
            continue;
        }
        $athletes = array();
        foreach (nishi_pick_list(isset($h['ResultList']) ? $h['ResultList'] : array()) as $a) {
            if (is_array($a)) {
                $athletes[] = $a;
            }
        }
        $heats[] = array(
            'status'   => isset($h['Status']) ? (string)$h['Status'] : '',
            'athletes' => $athletes,
        );
    }
    return $heats;
}

// 順位順（"1"）を優先して取り出す
function nishi_pick_list($value)
{
    if (!is_array($value)) {
        return array();
    }
    if (nishi_is_list($value)) {
        return $value;
    }
    foreach (array(1, 2) as $key) {
        if (isset($value[$key]) && is_array($value[$key]) && $value[$key]) {
            return $value[$key];
        }
    }
    foreach ($value as $v) {
        if (is_array($v) && $v) {
            return $v;
        }
    }
    return array();
}

function nishi_is_list($array)
{
    $i = 0;
    foreach ($array as $k => $v) {
        if ($k !== $i) {
            return false;
        }
        $i++;
    }
    return true;
}

function nishi_is_relay($a)
{
    return isset($a['TeamTitle']) || isset($a['TeamMember']) || isset($a['Team']);
}

function nishi_heat_has_result($athletes)
{
    foreach ($athletes as $a) {
        if (nishi_rank($a) !== '' || nishi_record(nishi_record_raw($a), '') !== '') {
            return true;
        }
        if (in_array(nishi_status($a), array('DNF', 'DQ', 'DSQ', 'NM'), true)) {
            return true;
        }
    }
    return false;
}

// 記録（新仕様: Kiroku100 = 1/100 表示 / 旧仕様: Kiroku）
function nishi_record_raw($a)
{
    if (isset($a['Kiroku100']) && trim($a['Kiroku100']) !== '') {
        return (string)$a['Kiroku100'];
    }
    if (isset($a['Kiroku'])) {
        return (string)$a['Kiroku'];
    }
    return '';
}

function nishi_person_raw($a)
{
    if (isset($a['KyogishaMei'])) {
        return (string)$a['KyogishaMei'];
    }
    return isset($a['Kyogisha']) ? (string)$a['Kyogisha'] : '';
}

/* ---------------------------------------------------------------------------
 *  値の整形
 * ------------------------------------------------------------------------- */

// 記録: 11.83 / 1.57.54 / 6.85（m・: は . に変換）
function nishi_record($raw, $event)
{
    $parts = nishi_br_split($raw);
    $s = nishi_nospace(mb_convert_kana(nishi_text($parts[0]), 'as', 'UTF-8'));
    if ($s === '') {
        return '';
    }
    $s = preg_replace('/(\d)m(\d)/', '$1.$2', $s);
    $s = str_replace(':', '.', $s);

    // 400m 以下の種目で 1分を超えた記録は秒に換算（1.05.23 → 65.23）
    if ($event !== '' && preg_match('/^(?:(?:100|110|200|300|400)M(?:[A-Z]{0,2}H)?|4×100MR)$/', $event)
        && preg_match('/^(\d+)\.(\d{2})\.(\d{2})$/', $s, $m)) {
        $s = ((int)$m[1] * 60 + (int)$m[2]) . '.' . $m[3];
    }
    return $s;
}

// 風速: +1.4 → 1.4 / -0.7 → -0.7
function nishi_wind($raw)
{
    $parts = nishi_br_split($raw);
    if (count($parts) < 2) {
        return '';
    }
    $w = nishi_nospace(mb_convert_kana(nishi_text($parts[1]), 'as', 'UTF-8'));
    return str_replace(array('+', '±'), '', $w);
}

// 記録なしの場合の表記（DNS / DNF / DQ / NM 等）
function nishi_status($a)
{
    $c = isset($a['Comment']) ? nishi_nospace(mb_convert_kana(nishi_text($a['Comment']), 'as', 'UTF-8')) : '';
    $first = explode(',', strtoupper($c));
    if (in_array($first[0], array('DNS', 'DNF', 'DQ', 'DSQ', 'NM', 'NR'), true)) {
        return $first[0];
    }
    if (isset($a['DnsFlg']) && (string)$a['DnsFlg'] === '1') {
        return 'DNS';
    }
    return '';
}

function nishi_rank($a)
{
    return isset($a['Jyuni']) ? nishi_nospace(mb_convert_kana(nishi_text($a['Jyuni']), 'as', 'UTF-8')) : '';
}

function nishi_heat_no($status)
{
    if (preg_match('/(\d+)\s*組/u', mb_convert_kana((string)$status, 'n', 'UTF-8'), $m)) {
        return (string)(int)$m[1];
    }
    return '';
}

// 氏名・学年: "ｽｽﾞｷ ﾕｳｷ<br/>鈴木　郁（3）" → array('鈴木 郁', '3')
function nishi_person($raw)
{
    $s = '';
    $parts = nishi_br_split($raw);
    for ($i = count($parts) - 1; $i >= 0; $i--) {
        $s = nishi_text($parts[$i]);
        if ($s !== '') {
            break;
        }
    }
    $s = mb_convert_kana($s, 'ask', 'UTF-8');
    $grade = '';
    if (preg_match('/^(.*?) *\(([^()]*)\) *$/u', $s, $m)) {
        $s = $m[1];
        $grade = str_replace(' ', '', $m[2]);
    }
    $s = trim(preg_replace('/ +/', ' ', $s));
    return array($s, $grade);
}

// 所属: "東日大昌平<br/>福　島" → array('東日大昌平', '福島')
function nishi_affiliation($raw)
{
    $parts = nishi_br_split($raw);
    $school = nishi_org($parts[0]);
    $pref = (count($parts) > 1) ? nishi_org($parts[1]) : '';
    return array($school, $pref);
}

function nishi_org($s)
{
    return nishi_nospace(mb_convert_kana(nishi_text($s), 'ask', 'UTF-8'));
}

// 種目名・性別・種別の分解: "中学男子100m" → sex=男子 / category=中学 / event=100m
function nishi_split_kyogimei($kyogimei)
{
    $s = nishi_nospace(mb_convert_kana(nishi_text($kyogimei), 'KVas', 'UTF-8'));
    $result = array('sex' => '', 'category' => '', 'event' => $s);
    $map = array(
        '男子' => '男子', '女子' => '女子', '男' => '男子', '女' => '女子',
        '男女混合' => '男女混合', '男女' => '男女混合', '混合' => '男女混合',
    );
    if (preg_match('/^(.*?)(男女混合|男女|混合|男子|女子)(.*)$/u', $s, $m)
        || preg_match('/^(.*?)(男|女)(?=[0-9走棒三砲円ハやジボ立])(.*)$/u', $s, $m)) {
        $result = array('sex' => $map[$m[2]], 'category' => $m[1], 'event' => $m[3]);
    } elseif (preg_match("/^(.*?)(Women's|Men's|Mix(?:ed)?(?:'s)?)(.*)$/i", $s, $m)) {
        $sex = (stripos($m[2], 'Women') === 0) ? '女子' : ((stripos($m[2], 'Men') === 0) ? '男子' : '男女混合');
        $result = array('sex' => $sex, 'category' => $m[1], 'event' => $m[3]);
    }
    return $result;
}

// 種目名の表記: 100m → 100M / 4X100mR → 4×100MR / 走高跳 → 走り高跳び / 砲丸投(5.000kg) → 砲丸投げ
function nishi_event_name($s)
{
    $s = nishi_nospace(mb_convert_kana(nishi_text($s), 'KVas', 'UTF-8'));
    $s = preg_replace('/\([^()]*\)/u', '', $s);
    $s = preg_replace('/(\d)[xX×✕]/u', '$1×', $s);
    $s = preg_replace_callback('/[a-z]+/', 'nishi_upper', $s);
    $s = preg_replace_callback('/(\d+)種競技/u', 'nishi_kansuji_konsei', $s);
    $s = preg_replace('/走(?=[高幅])/u', '走り', $s);
    $s = preg_replace('/跳(?!び)/u', '跳び', $s);
    $s = preg_replace('/投(?!げ)/u', '投げ', $s);
    return $s;
}

function nishi_upper($m)
{
    return strtoupper($m[0]);
}

function nishi_kansuji_konsei($m)
{
    $map = array('3' => '三', '4' => '四', '5' => '五', '6' => '六', '7' => '七', '8' => '八', '9' => '九', '10' => '十');
    return (isset($map[$m[1]]) ? $map[$m[1]] : $m[1]) . '種競技';
}

// 比較用キー（空白除去・全角英数→半角・半角カナ→全角）
function nishi_key($s)
{
    return nishi_nospace(mb_convert_kana(nishi_text($s), 'KVas', 'UTF-8'));
}

function nishi_br_split($s)
{
    return preg_split('#<br\s*/?>#i', (string)$s);
}

function nishi_text($s)
{
    $s = html_entity_decode(strip_tags((string)$s), ENT_QUOTES, 'UTF-8');
    return preg_replace('/^[\s\x{3000}]+|[\s\x{3000}]+$/u', '', $s);
}

function nishi_nospace($s)
{
    return preg_replace('/[\s\x{3000}]+/u', '', (string)$s);
}

/* ---------------------------------------------------------------------------
 *  URL・取得
 * ------------------------------------------------------------------------- */
function nishi_base_candidates($url)
{
    $url = preg_replace('/[?#].*$/s', '', trim($url));
    if (!preg_match('#^(https?://[^/]+)(/.*)?$#i', $url, $m)) {
        return array();
    }
    $origin = $m[1];
    $path = (isset($m[2]) && $m[2] !== '') ? $m[2] : '/';

    $candidates = array();
    $pos = strpos($path, '/shtml/');
    if ($pos !== false) {
        $candidates[] = $origin . substr($path, 0, $pos + 7);
    }
    if (substr($path, -1) === '/') {
        $dir = $path;
    } elseif (strpos(basename($path), '.') !== false) {
        $dir = rtrim(dirname($path), '/') . '/';
    } else {
        $dir = $path . '/';
    }
    $candidates[] = $origin . $dir;
    $candidates[] = $origin . $dir . 'shtml/';
    return array_values(array_unique($candidates));
}

function nishi_json_decode($body)
{
    if (!is_string($body) || $body === '') {
        return null;
    }
    if (substr($body, 0, 3) === "\xEF\xBB\xBF") {
        $body = substr($body, 3);
    }
    if (!mb_check_encoding($body, 'UTF-8')) {
        $body = mb_convert_encoding($body, 'UTF-8', 'SJIS-win');
    }
    $data = json_decode($body, true);
    return is_array($data) ? $data : null;
}

// 複数 URL をまとめて取得（curl があれば並列取得、失敗分は file_get_contents で再取得）
function nishi_fetch_all($urls)
{
    $urls = array_values(array_unique($urls));
    $bodies = array();
    foreach ($urls as $u) {
        $bodies[$u] = false;
    }
    if (!$urls) {
        return $bodies;
    }

    $retry = $urls;
    if (function_exists('curl_multi_init')) {
        $retry = array();
        foreach (nishi_fetch_curl($urls) as $u => $res) {
            if ($res['body'] !== false) {
                $bodies[$u] = $res['body'];
            } elseif ($res['code'] === 0 || $res['code'] >= 500) {
                $retry[] = $u; // 通信エラー・サーバエラーのみ再取得（404 等は再取得しない）
            }
        }
    }
    foreach ($retry as $u) {
        $bodies[$u] = nishi_fetch_stream($u);
    }
    return $bodies;
}

function nishi_fetch_curl($urls)
{
    $results = array();
    foreach ($urls as $u) {
        $results[$u] = array('body' => false, 'code' => 0);
    }
    $deadline = time() + NISHI_FETCH_DEADLINE;
    $mh = curl_multi_init();
    $pending = $urls;
    $inflight = 0;

    do {
        while ($inflight < NISHI_FETCH_PARALLEL && $pending) {
            $u = array_shift($pending);
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $u);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            @curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
            curl_setopt($ch, CURLOPT_TIMEOUT, NISHI_FETCH_TIMEOUT);
            curl_setopt($ch, CURLOPT_USERAGENT, NISHI_USER_AGENT);
            curl_setopt($ch, CURLOPT_ENCODING, '');
            curl_setopt($ch, CURLOPT_PRIVATE, $u);
            curl_multi_add_handle($mh, $ch);
            $inflight++;
        }

        do {
            $status = curl_multi_exec($mh, $running);
        } while ($status === CURLM_CALL_MULTI_PERFORM);

        while (($info = curl_multi_info_read($mh)) !== false) {
            $ch = $info['handle'];
            $u = curl_getinfo($ch, CURLINFO_PRIVATE);
            $code = ($info['result'] === CURLE_OK) ? (int)curl_getinfo($ch, CURLINFO_HTTP_CODE) : 0;
            $body = curl_multi_getcontent($ch);
            $results[$u] = array(
                'body' => ($code >= 200 && $code < 300 && is_string($body)) ? $body : false,
                'code' => $code,
            );
            curl_multi_remove_handle($mh, $ch);
            curl_close($ch);
            $inflight--;
        }

        if ($inflight > 0 && curl_multi_select($mh, 1.0) === -1) {
            usleep(50000);
        }
    } while (($inflight > 0 || $pending) && time() < $deadline);

    curl_multi_close($mh);
    return $results;
}

function nishi_fetch_stream($url)
{
    $context = stream_context_create(array('http' => array(
        'timeout'         => NISHI_FETCH_TIMEOUT,
        'user_agent'      => NISHI_USER_AGENT,
        'follow_location' => 1,
    )));
    $body = @file_get_contents($url, false, $context);
    return ($body === false) ? false : $body;
}

/* ---------------------------------------------------------------------------
 *  出力
 * ------------------------------------------------------------------------- */
function nishi_render($rows, $errors)
{
    $headers = array('日付', '大会名', '種目', '風速', 'レース状況', '組', '順位', '記録', '氏名',
                     '氏名カナ', '学年', '所属1', '所属2', '性別', '表示/非表示', '備考');

    echo "<html>\r\n<head>\r\n<meta charset=\"UTF-8\">\r\n<meta name=\"robots\" content=\"noindex\">\r\n<title>結果一覧</title>\r\n</head>\r\n<body>\r\n";
    foreach ($errors as $e) {
        echo '<p style="color:#CC0000;font-weight:bold;">' . nishi_h($e) . "</p>\r\n";
    }

    echo "<table align=\"center\" bgcolor=\"#333333\">\r\n\r\n<tr>\r\n";
    foreach ($headers as $h) {
        echo "<td align=\"center\" style=\"padding:3px;\" bgcolor=\"#9FCFFF\">\r\n" . nishi_h($h) . "\r\n</td>\r\n";
    }
    echo "</tr>\r\n";

    foreach ($rows as $row) {
        echo "\r\n<tr>\r\n";
        foreach ($row as $value) {
            echo "<td style=\"padding:3px;\" bgcolor=\"#FFFFFF\">\r\n" . nishi_h($value) . "\r\n</td>\r\n";
        }
        echo "\r\n</tr>\r\n";
    }
    echo "</table>\r\n</body>\r\n</html>\r\n";
}

function nishi_h($s)
{
    return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
}
