"""Give the script's own words the timings from an outside word-level .srt (e.g. TurboScribe, any script/language,
Devanagari included), optionally merged with an existing Whisper words.json for stretches the .srt gets wrong.
Words are matched by consonant skeleton with a sequence alignment; unmatched words are interpolated.
Usage: python3 align_srt.py <project> <file.srt> [--srt-until SEC] [--whisper-from SEC]
Writes <project>/build/words.json using the script in scenes.json "whisper_hint"."""
import json, os, re, sys
from difflib import SequenceMatcher

DEV = {'क':'k','ख':'kh','ग':'g','घ':'gh','ङ':'n','च':'ch','छ':'chh','ज':'j','झ':'jh','ञ':'n','ट':'t','ठ':'th','ड':'d','ढ':'dh',
       'ण':'n','त':'t','थ':'th','द':'d','ध':'dh','न':'n','प':'p','फ':'f','ब':'b','भ':'bh','म':'m','य':'y','र':'r','ल':'l','व':'v',
       'श':'sh','ष':'sh','स':'s','ह':'h','ळ':'l','क़':'k','ख़':'kh','ग़':'g','ज़':'j','ड़':'r','ढ़':'rh','फ़':'f','ं':'n','ँ':'n'}
def skel(w):
    w = w.lower()
    w = ''.join(DEV.get(c, c) for c in w)
    w = re.sub(r'[^a-z0-9]', '', w)
    for a, b in (('ph', 'f'), ('c', 'k'), ('q', 'k'), ('w', 'v'), ('z', 'j'), ('x', 'ks'), ('ee', 'i'), ('oo', 'u')):
        w = w.replace(a, b)
    s = w[:1] + re.sub(r'[aeiouy]', '', w[1:])
    return re.sub(r'(.)\1+', r'\1', s) or w

def parse_srt(path):
    ts = lambda h, m, s, ms: int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000
    out = []
    for blk in re.split(r'\n\s*\n', open(path, encoding='utf-8').read().strip()):
        L = blk.strip().split('\n')
        m = re.match(r'(\d+):(\d+):(\d+),(\d+) --> (\d+):(\d+):(\d+),(\d+)', L[1])
        txt = re.sub(r'\(Transcribed by.*?\)', '', ' '.join(L[2:])).split()
        t0, t1 = ts(*m.groups()[:4]), ts(*m.groups()[4:])
        for i, w in enumerate(txt):
            out.append({'w': w, 't0': t0 + (t1 - t0) * i / len(txt), 't1': t0 + (t1 - t0) * (i + 1) / len(txt)})
    return out

def align(script, ref):
    a, b = [skel(w) for w in script], [skel(r['w']) for r in ref]
    n, m, G = len(a), len(b), -0.45
    S = [[0.0] * (m + 1) for _ in range(n + 1)]; B = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1): S[i][0] = i * G; B[i][0] = 1
    for j in range(1, m + 1): S[0][j] = j * G; B[0][j] = 2
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            r = SequenceMatcher(None, a[i - 1], b[j - 1]).ratio()
            c = [S[i - 1][j - 1] + (r * 2 - 0.8), S[i - 1][j] + G, S[i][j - 1] + G]
            k = max(range(3), key=lambda x: c[x]); S[i][j] = c[k]; B[i][j] = (0, 1, 2)[k]
    i, j, pairs = n, m, {}
    while i > 0 and j > 0:
        k = B[i][j]
        if k == 0:
            if SequenceMatcher(None, a[i - 1], b[j - 1]).ratio() >= 0.5: pairs[i - 1] = j - 1
            i, j = i - 1, j - 1
        elif k == 1: i -= 1
        else: j -= 1
    return pairs

def main():
    proj, srt = sys.argv[1], sys.argv[2]
    opt = dict(zip(sys.argv[3::2], sys.argv[4::2]))
    script = json.load(open(os.path.join(proj, 'scenes.json')))['whisper_hint'].split()
    ref = parse_srt(srt)
    if '--srt-until' in opt:
        ref = [r for r in ref if r['t1'] <= float(opt['--srt-until']) + 0.01]
    if '--whisper-from' in opt:
        wj = json.load(open(os.path.join(proj, 'build', 'words.json')))
        ref += [w for w in wj if w['t0'] >= float(opt['--whisper-from'])]
    pairs = align(script, ref)
    t = [None] * len(script)
    for i, j in pairs.items(): t[i] = (ref[j]['t0'], ref[j]['t1'])
    known = [i for i in range(len(script)) if t[i]]
    for i in range(len(script)):                       # interpolate the gaps by character length
        if t[i]: continue
        p = max([k for k in known if k < i], default=None); q = min([k for k in known if k > i], default=None)
        lo = t[p][1] if p is not None else 0.0; hi = t[q][0] if q is not None else lo + 0.4 * (len(script) - i)
        run = list(range((p if p is not None else -1) + 1, q if q is not None else len(script)))
        tot = sum(len(script[k]) for k in run) or 1; acc = sum(len(script[k]) for k in run if k < i)
        t[i] = (lo + (hi - lo) * acc / tot, lo + (hi - lo) * (acc + len(script[i])) / tot)
    words = [{'w': w, 't0': round(a, 3), 't1': round(b, 3)} for w, (a, b) in zip(script, t)]
    os.makedirs(os.path.join(proj, 'build'), exist_ok=True)
    json.dump(words, open(os.path.join(proj, 'build', 'words.json'), 'w'), indent=0)
    print(f'{len(script)} script words, {len(pairs)} matched to the srt, {len(script) - len(pairs)} interpolated')
    for w in words:
        if re.sub(r'\W', '', w['w']).lower() in ('subscription', 'kal', 'bye', 'link', 'comment'): print('  ', w)

if __name__ == '__main__':
    main()
