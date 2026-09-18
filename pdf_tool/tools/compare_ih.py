# IH: PDF から読んだ結果と、Web(1.php) の結果を 1行ずつ比べる
import json, sys, collections
S = sys.argv[1]
web = json.load(open(S))[1:]
pdf = [l.rstrip('\n').split('\t') for l in open(sys.argv[2], encoding='utf-8')][1:]
def key(r):
    who = r[8] if r[8] else r[11]
    return (r[13], r[2], r[4], r[5], who.replace(' ', ''))
wk = collections.defaultdict(list); pk = collections.defaultdict(list)
for r in web: wk[key(r)].append(r)
for r in pdf: pk[key(r)].append(r)
names = ['日付','大会名','種目','風速','レース状況','組','順位','記録','氏名','氏名カナ','学年','所属1','所属2','性別','表示','備考']
diff = collections.Counter(); ex = collections.defaultdict(list)
only_w = [k for k in wk if k not in pk]; only_p = [k for k in pk if k not in wk]
for k in wk:
    if k not in pk: continue
    for a, b in zip(wk[k], pk[k]):
        for i in range(16):
            if a[i] != b[i]:
                diff[names[i]] += 1
                if len(ex[names[i]]) < 6: ex[names[i]].append((k, a[i], b[i]))
print('web rows', len(web), 'pdf rows', len(pdf), 'matched keys', len([k for k in wk if k in pk]))
print('only in web', len(only_w), only_w[:8])
print('only in pdf', len(only_p), only_p[:8])
for f, n in diff.most_common():
    print(f'DIFF {f}: {n}')
    for e in ex[f]: print('    ', e)
