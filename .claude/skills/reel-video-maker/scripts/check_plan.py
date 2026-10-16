#!/usr/bin/env python3
"""Checks a Reel Engine JSON plan against its voiceover script, the way the tool will, plus the approved style.

usage: python3 scripts/check_plan.py script.txt plan.json [--library references/library.md]

ERROR  = the tool will reject the plan (phrase not in the script, phrase spoken twice without #n,
         occurrence that does not exist, unknown image / sound / icon id, broken JSON).
STYLE  = breaks the approved reference look (references/style-guide.md): fix it.
NOTE   = advice.
Exit code 0 when there are no ERROR and no STYLE lines.
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split()
TENS = 'zero ten twenty thirty forty fifty sixty seventy eighty ninety'.split()
TIME_KEYS = {'start', 'at', 'until', 'revealAt', 'marker', 'strike', 'fromAt', 'toAt'}
BIG_CARDS = {'checklist', 'bars', 'ring', 'chat', 'versus', 'stat', 'comment', 'timeline', 'slider', 'kinetic'}
ALLOWED_BACKDROPS = {'spotlight', 'rays', 'grid'}
LYING = ('pushup', 'plank', 'glute_bridge', 'leg_raise', 'mountain', 'pike', 'reverse_crunch', 'lying', 'cobra', 'bear_crawl')
PAIRS = {'arms', 'hands', 'elbows', 'forearms', 'shoulders', 'knees', 'feet', 'legs', 'thighs', 'calves', 'hips', 'glutes'}
ICONS = set('dumbbell clock timer fire water calendar heart bolt trophy check cross apple moon scale phone warning arrowUp arrowDown thumbsUp muscle steps brain bed'.split())


def number_words(n):
    if n < 20:
        return [ONES[n]]
    if n < 100:
        return [TENS[n // 10]] + (number_words(n % 10) if n % 10 else [])
    return number_words(n // 100) + ['hundred'] + (number_words(n % 100) if n % 100 else [])


def spoken(w):
    n = re.sub(r"[^\w']+", '', w.lower()).replace("'", '').replace('_', '')
    if re.fullmatch(r'\d{1,3}', n):
        return number_words(int(n))
    return [n] if n else []


def load_library(path):
    ids = set()
    for line in open(path, encoding='utf-8'):
        m = re.match(r'^- ([a-z0-9_]+):', line)
        if m:
            ids.add(m.group(1))
            alts = re.search(r'\(other drawings: ([^)]*)\)', line)
            if alts:
                ids.update(m.group(1) + a.strip() for a in alts.group(1).split(','))
        m = re.match(r'^(hero_[a-z0-9_]+): (.+)$', line.strip())
        if m:
            ids.update(x.strip() for x in m.group(2).split('→'))
    return ids


def main():
    args = sys.argv[1:]
    lib_path = os.path.join(HERE, '..', 'references', 'library.md')
    if '--library' in args:
        k = args.index('--library')
        lib_path = args[k + 1]
        del args[k:k + 2]
    if len(args) < 2:
        print(__doc__)
        sys.exit(2)
    script = open(args[0], encoding='utf-8-sig').read()
    errors, style, notes = [], [], []
    try:
        text = open(args[1], encoding='utf-8-sig').read().strip()
        text = re.sub(r'^```(?:json)?|```$', '', text).strip()
        plan = json.loads(text)
    except Exception as e:  # noqa: BLE001
        print(f'ERROR  the JSON is not valid: {e}')
        sys.exit(1)
    library = load_library(lib_path)

    tokens = [t for w in script.split() for t in spoken(w)]

    def check_time(value, where):
        if isinstance(value, (int, float)) or value is None:
            return
        raw = str(value).strip()
        if re.fullmatch(r'-?\d+(\.\d+)?', raw):
            return
        m = re.fullmatch(r'(.*?)(\|end)?(#\d+)?\s*([+-]\s*\d+(?:\.\d+)?)?', raw, flags=re.I)
        phrase, nth = m.group(1).strip(), m.group(3)
        if re.search(r'#\d+\s*\|end', raw):
            errors.append(f'{where}: "{raw}": write |end before #n, e.g. "{phrase.split("#")[0]}|end#2"')
            return
        if phrase.lower() in ('start', 'end'):
            return
        want = [t for w in phrase.split() for t in spoken(w)]
        if not want:
            errors.append(f'{where}: empty time "{raw}"')
            return
        hits = [i for i in range(len(tokens) - len(want) + 1) if tokens[i:i + len(want)] == want]
        if not hits:
            errors.append(f'{where}: "{phrase}" is not in the script (copy the words exactly, apostrophes included)')
            return
        n = int(nth[1:]) if nth else 1
        if not nth and len(hits) > 1:
            errors.append(f'{where}: "{phrase}" is spoken {len(hits)} times: add #1 / #2 or use a longer phrase')
        if n < 1 or n > len(hits):
            errors.append(f'{where}: "{phrase}" is spoken {len(hits)} time(s); #{n} does not exist')

    def walk(node, where):
        if isinstance(node, dict):
            for k, v in node.items():
                w = f'{where}.{k}' if where else k
                if k in TIME_KEYS and isinstance(v, (str, int, float)) and not (k == 'start' and where.endswith('count')):
                    check_time(v, w)
                if k == 'asset' and isinstance(v, str) and v not in library:
                    errors.append(f'{w}: unknown image id "{v}"')
                walk(v, w)
        elif isinstance(node, list):
            for i, v in enumerate(node):
                walk(v, f'{where}[{i}]')

    walk({k: v for k, v in plan.items() if k not in ('captions', 'sfx')}, '')
    for i, s in enumerate(plan.get('sfx', [])):
        check_time(s.get('at'), f'sfx[{i}].at')
        if s.get('src') not in library:
            errors.append(f'sfx[{i}].src: unknown sound "{s.get("src")}"')
    caps = plan.get('captions', {})
    for i, pair in enumerate(caps.get('bottom', [])):
        for j, v in enumerate(pair):
            check_time(v, f'captions.bottom[{i}][{j}]')

    # ---- style (references/style-guide.md) ----
    if 'theme' in plan or 'font' in plan:
        style.append('top level: leave out "theme" / "font" (the default look is the approved one)')
    if not plan.get('progressBar'):
        style.append('top level: add "progressBar": true (the red retention bar)')
    PALETTE = {'#111111', '#FFFFFF', '#E3262E', '#2FD94E', '#FFD23F', '#B0B6BE'}
    def colours(node, where):
        if isinstance(node, dict):
            for k, v in node.items():
                if k in ('color', 'boxColor', 'accentColor', 'backdropColor', 'markerColor', 'background') and isinstance(v, str) and v.startswith('#') and v.upper() not in PALETTE:
                    style.append(f'{where}.{k} {v}: only palette colours (#111111 #FFFFFF #E3262E #2FD94E #FFD23F, grid #B0B6BE)')
                colours(v, f'{where}.{k}')
        elif isinstance(node, list):
            for i, v in enumerate(node):
                colours(v, f'{where}[{i}]')
    colours(plan.get('scenes', []), 'scenes')
    if not caps.get('bottom'):
        style.append('captions.bottom is missing: set it from the first words of scene 2 to the first words of the CTA')
    scenes = plan.get('scenes', [])
    if not scenes:
        errors.append('no scenes')
    last_bd = None
    for si, sc in enumerate(scenes):
        sw = f'scenes[{si}] "{sc.get("id", si)}"'
        bd = sc.get('backdrop')
        clip_scene = any(l.get('type') == 'video' for l in sc.get('layers', []))
        if clip_scene and bd not in (None, 'none'):
            style.append(f'{sw}: a scene with an animation clip is plain white: "backdrop": "none"')
        if not clip_scene and bd not in ALLOWED_BACKDROPS:
            style.append(f'{sw}: backdrop {bd!r}: use spotlight / rays / grid (see the style guide table)')
        key = (bd, str(sc.get('backdropColor', '')).upper())
        if key == last_bd and bd not in (None, 'none'):
            style.append(f'{sw}: same backdrop and colour as the scene before ({bd}): change one of them')
        if bd == 'grid' and (sc.get('backdropOpacity', 1) > 0.7 or sc.get('backdropColor', '').upper() not in ('#B0B6BE',)):
            style.append(f'{sw}: grid must be grey and faint: "backdropColor": "#B0B6BE", "backdropOpacity": 0.6')
        last_bd = key
        tr = sc.get('transition')
        trt = tr.get('type') if isinstance(tr, dict) else tr
        if si > 0 and trt not in ('whip', 'zoomBlur', 'circle', 'zoomThrough'):
            style.append(f'{sw}: transition {trt!r}: use {{"type": "whip", "duration": 0.32}} (zoomBlur for the plan)')
        lying_scene = any(any(k in (a or '') for k in LYING) for l in sc.get('layers', []) if l.get('type') in ('image', 'poses')
                          for a in [l.get('asset', '')] + [f.get('asset', '') for f in l.get('frames', [])])
        fx = 0
        chars = 0
        boxes = [i for i, l in enumerate(sc.get('layers', [])) if l.get('type') == 'text' and l.get('look') == 'box']
        for li, l in enumerate(sc.get('layers', [])):
            lw = f'{sw}.layers[{li}] ({l.get("type")})'
            t = l.get('type')
            if t in ('image', 'video'):
                chars += 1
            if t == 'poses':
                chars += len({f.get('asset') for f in l.get('frames', [])})
            assets = [l.get('asset', '')] + [f.get('asset', '') for f in l.get('frames', [])] if t in ('image', 'poses') else []
            if any(any(k in (a or '') for k in LYING) for a in assets):
                if l.get('width', 0.8) > 0.85:
                    style.append(f'{lw}: lying pose width {l.get("width")}: use 0.82 (wider cuts the feet off)')
                if sc.get('camera'):
                    notes.append(f'{sw}: camera zoom with a lying pose can cut his feet off')
            if t == 'burst':
                style.append(f'{lw}: never a burst')
            if t in BIG_CARDS:
                style.append(f'{lw}: big cards shrink H: use a box label and a pose instead')
            if t == 'banner':
                style.append(f'{lw}: banners have outlined text: use a box label')
            if t == 'text':
                lk = l.get('look')
                if lk in ('box', 'thumb', 'hook', 'pop', 'comic', 'neon'):
                    style.append(f'{lw}: look "{lk}" ("{l.get("text")}"): no small stickers; use a big word (giant / echo / marquee / tape / outline behind H)')
                elif lk is None and l.get('strike') is None:
                    style.append(f'{lw}: plain text "{l.get("text")}": use a big look (giant / echo / marquee / tape) or a crossed-out word ("strike")')
                if lk in ('giant', 'echo', 'marquee', 'outline') and not l.get('behind'):
                    notes.append(f'{lw}: big word "{l.get("text")}" in front of H: add "behind": true')
                if lk in ('giant', 'echo', 'outline') and '\n' in str(l.get('text', '')) and not str(l.get('text', '')).replace('\n', '').replace('-', '').isdigit():
                    style.append(f'{lw}: "{l.get("text")}" on two lines: his head hides the second line; one line at y 0.19')
                if lk == 'outline' and str(l.get('color', '')).upper() == '#2FD94E':
                    style.append(f'{lw}: green outline is too thin to read: black or red')
                fx += lk in ('giant', 'echo', 'marquee', 'tape', 'outline')
            if l.get('enter') == 'squash':
                style.append(f'{lw}: "enter": "squash" makes H vanish for a moment: use "punch"')
            if t == 'poses' and l.get('crossfade', 0) != 0:
                style.append(f'{lw}: poses need "crossfade": 0 (a crossfade shows two bodies at once)')
            if t == 'progress' and len(str(l.get('label', ''))) > 3:
                style.append(f'{lw}: progress label "{l.get("label")}" is drawn huge: 3 characters max ("1/3")')
            if t == 'callout' and l.get('anchor') in PAIRS:
                style.append(f'{lw}: callout on "{l.get("anchor")}" points between the pair: use one side ("left_{l.get("anchor")[:-1]}")')
            if t in ('chip', 'glow', 'path', 'pulse', 'speed'):
                fx += 1
            if t == 'pulse' and l.get('kind') == 'flash' and si == 0 and str(l.get('at', 'start')).startswith('start'):
                style.append(f'{lw}: no white flash at start: it washes out the first frame (use "speed" + an edge pulse later)')
            if t == 'path':
                if lying_scene:
                    style.append(f'{lw}: no path on lying poses (the chest barely moves, it is invisible): use it on curls / raises / presses')
                for k in ('from', 'to'):
                    if l.get(k) in PAIRS:
                        style.append(f'{lw}: path {k} "{l.get(k)}" is a pair: use one side ("left_{l.get(k)[:-1]}")')
                if 'fromAt' not in l or 'toAt' not in l:
                    style.append(f'{lw}: a path needs "fromAt" (part at the start position) and "toAt" (part at the end position)')
            if t == 'chip':
                style.append(f'{lw}: no chips (the owner rejected small labels): use a big word')
                if len(str(l.get('text', ''))) > 24:
                    errors.append(f'{lw}: chip text longer than 24 letters')
                if 0.3 < l.get('x', 0.8) < 0.7:
                    style.append(f'{lw}: chip at x {l.get("x")}: beside H only (x 0.22–0.24 or 0.78–0.8)')
                if l.get('icon') and l.get('icon') not in ICONS:
                    errors.append(f'{lw}: unknown icon "{l.get("icon")}"')
            if t == 'glow' and l.get('anchor') in ('head', 'face', 'neck'):
                style.append(f'{lw}: glow on "{l.get("anchor")}": glow a muscle, never the head / face')
            if t == 'icon' and l.get('name') not in ICONS:
                errors.append(f'{lw}: unknown icon "{l.get("name")}"')
        if fx == 0 and sc.get('id') != 'cta':
            notes.append(f'{sw}: nothing big happens: add a big word (giant / echo / marquee), an impact or speed lines like examples/05')
        if chars == 0:
            errors.append(f'{sw}: no image of H: H must be on screen in every scene')
        elif chars < 2 and si not in (0,):
            notes.append(f'{sw}: only one picture of H: change the picture every 2-3 s')
    first = scenes[0] if scenes else {}
    if first and not any(l.get('type') == 'speed' and str(l.get('at', 'start')) == 'start' for l in first.get('layers', [])):
        notes.append('hook: add {"type": "speed", "at": "start"} (speed lines on the first frame)')
    if not any(l.get('type') == 'video' for sc in scenes for l in sc.get('layers', [])):
        notes.append('no animation clip used: show the exercise with a clip_* video when one exists (references/library.md)')
    if sum(1 for sc in scenes for l in sc.get('layers', []) if l.get('type') == 'pulse' and l.get('kind') == 'impact') == 0:
        notes.append('no impact frames: add {"type": "pulse", "kind": "impact", "duration": 0.2} on the 2-3 strongest words')
    if first and not any(l.get('type') in ('image', 'poses', 'video') and l.get('at', 'start') == 'start' for l in first.get('layers', [])):
        style.append('hook: H must be on the first frame (an image at "start", "enter": "cut")')

    for e in errors:
        print('ERROR ', e)
    for s in style:
        print('STYLE ', s)
    for n in notes:
        print('NOTE  ', n)
    if errors or style:
        print(f'✘ {len(errors)} error(s), {len(style)} style problem(s)')
        sys.exit(1)
    print(f'OK  (no errors, no style problems{", " + str(len(notes)) + " note(s)" if notes else ""})')


if __name__ == '__main__':
    main()
