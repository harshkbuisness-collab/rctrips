#!/usr/bin/env python3
"""Reel Engine plan checker.

Checks a JSON video plan the way the Reel Engine tool does (time phrases, ids, order) and also
for quality (rhythm, empty moments, sound spacing, safe zone, 16:9 style). Run it after writing
a plan and fix everything it reports, then run it again until it prints ALL CLEAN.

usage: python reel_check.py request.txt plan.json
   or: double-click it: a window opens where you paste the request and the plan and press CHECK
  request.txt = the whole request copied from the tool (rules + library + sound effects + script)
  plan.json   = your JSON plan (several parts pasted one after another are fine)
Without request.txt the id checks are skipped:  python reel_check.py - plan.json script.txt
"""
import json, os, re, sys

SEC_PER_TOKEN = 0.33  # average speaking speed, used to estimate times (the tool uses the real ones)
ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split()
TENS = 'zero ten twenty thirty forty fifty sixty seventy eighty ninety'.split()
ANCHORS = {'head', 'face', 'neck', 'shoulders', 'shoulder', 'shoulder_blades', 'upper_back', 'chest', 'back', 'abs', 'core',
           'hips', 'hip', 'glutes', 'glute', 'arms', 'arm', 'elbows', 'elbow', 'forearms', 'forearm', 'hands', 'hand', 'wrists',
           'wrist', 'thighs', 'thigh', 'legs', 'leg', 'knees', 'knee', 'calves', 'calf', 'feet', 'foot', 'ankles', 'ankle',
           'heels', 'heel', 'toes', 'body', 'waist', 'lats', 'biceps', 'triceps', 'quads', 'hamstrings', 'spine', 'lower_back'}
LAYER_TYPES = {'image', 'poses', 'video', 'text', 'arrow', 'highlight', 'measure', 'zoomBubble', 'split', 'pattern',
               'burst', 'counter', 'progress', 'checklist', 'bars', 'ring', 'banner', 'versus', 'chat', 'callout', 'accent',
               'icon', 'stat', 'comment', 'timeline', 'slider', 'kinetic', 'chip', 'glow', 'path', 'pulse', 'speed'}
BIG = {'checklist', 'bars', 'ring', 'chat', 'versus', 'stat', 'comment', 'timeline', 'slider', 'kinetic'}
GRAPHICS = BIG | {'banner', 'callout', 'accent', 'icon', 'counter', 'progress', 'chip', 'glow', 'path'}
THEMES = {'classic', 'purple', 'coral', 'tomato', 'lime', 'pink', 'gold', 'ocean', 'mint', 'royal', 'blackred', 'volt', 'blaze', 'candy', 'effortless'}
FONTS = {'classic', 'sport', 'modern', 'playful', 'brand'}
ICONS = {'dumbbell', 'clock', 'timer', 'fire', 'water', 'calendar', 'heart', 'bolt', 'trophy', 'check', 'cross', 'apple', 'moon',
         'scale', 'phone', 'warning', 'arrowUp', 'arrowDown', 'thumbsUp', 'muscle', 'steps', 'brain', 'bed'}
STRONG_TRANSITIONS = {'circle', 'wipe', 'zoomThrough', 'glitch', 'flash', 'zoomBlur', 'whip'}
CHARACTER = {'image', 'poses', 'video'}
OVERLAY = {'highlight', 'arrow', 'measure', 'zoomBubble', 'callout'}
ENTERS = set('cut fade up down left right pop punch slam zoom blur elastic smear flyLeft flyRight flyUp flyDown squash whip'.split())
TRANSITIONS = set('cut fade slideLeft slideRight slideUp zoom flash circle wipe zoomThrough glitch zoomBlur slideBlur whip'.split())
LOOKS = {'plain', 'pop', 'box', 'thumb', 'hook', 'comic', 'giant', 'outline', 'neon', 'echo', 'marquee', 'tape'}
BACKDROPS = {'none', 'rays', 'dots', 'grid', 'spotlight', 'stripes', 'halftone', 'blobs', 'notebook', 'plus', 'checker', 'waves'}


def number_words(n):
    if n < 20: return [ONES[n]]
    if n < 100: return [TENS[n // 10]] + ([ONES[n % 10]] if n % 10 else [])
    if n < 1000: return [ONES[n // 100], 'hundred'] + (number_words(n % 100) if n % 100 else [])
    return [str(n)]


def norm(w):
    return re.sub(r"[^\w']+", '', str(w).lower()).replace("'", '').replace('_', '')


def spoken(w):
    n = norm(w)
    if re.fullmatch(r'\d{1,3}', n): return number_words(int(n))
    return [n] if n else []


def parse_request(text):
    req = {'script': None, 'assets': set(), 'sfx': set(), 'landscape': 'FORMAT: LANDSCAPE' in text, 'nopoints': set(), 'sets': []}
    m = re.search(r'## Script[^\n]*\n(.*?)(?:\n\s*Now write the JSON|\Z)', text, re.S)
    if m: req['script'] = m.group(1).strip()
    for line in text.splitlines():
        a = re.match(r'\s*-\s+((?:hero|prop|sfx)_[a-z0-9_]+)\s*:', line)
        if a:
            aid = a.group(1)
            if aid.startswith('sfx_'):
                req['sfx'].add(aid)
                continue
            req['assets'].add(aid)
            for v in re.findall(r'_v\d+', line.split('other drawings', 1)[1] if 'other drawings' in line else ''):
                req['assets'].add(aid + v)
            if 'no body parts' in line: req['nopoints'].add(aid)
        s = re.match(r'\s*(hero_[a-z0-9_]+):\s*(hero_[a-z0-9_]+(?:\s*→\s*hero_[a-z0-9_]+)+)\s*$', line)
        if s: req['sets'].append([x.strip() for x in s.group(2).split('→')])
    return req


def load_plan(text):
    text = re.sub(r'```(?:json)?', '', text).strip()
    parts, depth, in_str, esc, start = [], 0, False, False, -1
    for i, ch in enumerate(text):
        if in_str:
            if esc: esc = False
            elif ch == '\\': esc = True
            elif ch == '"': in_str = False
            continue
        if ch == '"': in_str = True
        elif ch == '{':
            if depth == 0: start = i
            depth += 1
        elif ch == '}' and depth > 0:
            depth -= 1
            if depth == 0: parts.append(text[start:i + 1])
    if not parts: parts = [text]
    objs = [json.loads(p) for p in parts]
    plan = objs[0]
    for o in objs[1:]:
        plan['scenes'] = plan.get('scenes', []) + o.get('scenes', [])
        plan['sfx'] = plan.get('sfx', []) + o.get('sfx', [])
    return plan


class Times:
    def __init__(self, script, timed=None):
        self.tokens, self.owner = [], []
        self.timed = timed  # real word times from the tool (words.json), else estimated
        self.words = [w['text'] for w in timed] if timed else script.split()
        for i, w in enumerate(self.words):
            for t in spoken(w):
                self.tokens.append(t)
                self.owner.append(i)
        self.end = (timed[-1]['end'] if timed else len(self.words) * SEC_PER_TOKEN) + 0.4

    def word_time(self, i, end=False):
        if self.timed: return self.timed[i]['end' if end else 'start']
        return i * SEC_PER_TOKEN + (0.3 if end else 0)

    def resolve(self, value, where, errors):
        if isinstance(value, (int, float)): return float(value)
        if value is None: return None
        raw = str(value).strip()
        if re.fullmatch(r'-?\d+(\.\d+)?', raw): return float(raw)
        m = re.match(r'^(.*?)(\|end)?(#\d+)?\s*([+-]\s*\d+(?:\.\d+)?)?$', raw, re.I)
        phrase, end_flag, nth, off = m.group(1).strip(), m.group(2), m.group(3), m.group(4)
        off = float(off.replace(' ', '')) if off else 0.0
        if phrase.lower() == 'start': return max(0.0, off)
        if phrase.lower() == 'end': return self.end + off
        want = [t for w in phrase.split() for t in spoken(w)]
        if not want:
            errors.append(f'{where}: empty time "{raw}"')
            return 0.0
        hits = [i for i in range(len(self.tokens) - len(want) + 1) if self.tokens[i:i + len(want)] == want]
        if not hits:
            near = [w for w in want if w not in self.tokens]
            hint = f' (not in the script: {", ".join(near)})' if near else ' (the words are there but not in this order: copy them exactly)'
            errors.append(f'{where}: "{phrase}" is not in the script{hint}.')
            return 0.0
        n = int(nth[1:]) if nth else 1
        if not nth and len(hits) > 1:
            errors.append(f'{where}: "{phrase}" is spoken {len(hits)} times. Use a longer phrase that is spoken once, or "{phrase}#2".')
        if nth and n > len(hits):
            errors.append(f'{where}: "{phrase}" is spoken only {len(hits)} time(s), so #{n} does not exist.')
        i = hits[min(len(hits), max(1, n)) - 1]
        w = self.owner[i + len(want) - 1] if end_flag else self.owner[i]
        t = self.word_time(w, bool(end_flag))
        return max(0.0, round(t + off, 2))


def check(plan, req, script, timed=None):
    E, Wn = [], []  # errors (the tool refuses the plan) and quality warnings (the video will look worse)
    land = req['landscape']
    T = Times(script, timed)
    r = lambda v, where: T.resolve(v, where, E)
    for k in ('canvas', 'audio', 'wordsFile', 'duration'):
        if k in plan: E.append(f'"{k}": remove it, the tool fills it in.')
    scenes = plan.get('scenes') or []
    if not scenes: E.append('"scenes" is missing or empty.')
    cap = plan.get('captions') or {}
    if land and cap.get('mode', 'none') not in ('none', 'phrase'):
        Wn.append('16:9: use "captions": {"mode": "none"} and put the key words on screen as stickers / hook words.')
    events = []  # (time, what) of everything that changes on screen
    mg_events = []  # times a motion graphic appears
    hook_words = []  # times words appear on screen
    big_count = [0]
    strong = []  # times of pattern interrupts (strong transitions, shakes)
    if plan.get('theme') is not None and plan['theme'] not in THEMES: E.append(f'theme must be one of {sorted(THEMES)}')
    if plan.get('font') is not None and plan['font'] not in FONTS: E.append(f'font must be one of {sorted(FONTS)}')
    # the approved look (the reference video): no theme, clean backdrops, box labels, H big
    if not land and (plan.get('theme') or plan.get('font')):
        Wn.append('style: leave out "theme" / "font"; the default look is the approved one.')
    if not land and scenes and not cap.get('bottom'):
        Wn.append('style: set "captions.bottom" from the first words of scene 2 to the first words of the call to action.')
    starts = []
    for si, s in enumerate(scenes):
        w = f'scenes[{si}]' + (f' "{s.get("id")}"' if s.get('id') else '')
        st = r(s.get('start', 'start'), f'{w}.start')
        starts.append(st)
        trn = s.get('transition', 'cut')
        trn = trn.get('type') if isinstance(trn, dict) else trn
        if trn not in TRANSITIONS: E.append(f'{w}.transition "{trn}" is not one of {sorted(TRANSITIONS)}')
        if s.get('backdrop', 'none') not in BACKDROPS: E.append(f'{w}.backdrop must be one of {sorted(BACKDROPS)}')
        for k, cam in enumerate(s.get('camera') or []):
            events.append((r(cam.get('at'), f'{w}.camera[{k}].at'), 'camera'))
        for k, sh in enumerate(s.get('shakes') or []):
            strong.append(r(sh.get('at'), f'{w}.shakes[{k}].at'))
        if trn in STRONG_TRANSITIONS: strong.append(st)
        s['_start'] = st
    for i in range(1, len(starts)):
        if starts[i] is not None and starts[i - 1] is not None and starts[i] <= starts[i - 1]:
            E.append(f'scenes[{i}].start comes before or at the start of scenes[{i - 1}]: scenes must be in script order.')
    for si, s in enumerate(scenes):
        w = f'scenes[{si}]' + (f' "{s.get("id")}"' if s.get('id') else '')
        st = s['_start'] or 0
        en = starts[si + 1] if si + 1 < len(starts) else T.end
        events.append((st, 'scene'))
        if en - st > (14 if land else 12):
            Wn.append(f'{w} lasts about {en - st:.0f} s: split it into more scenes (one per idea).')
        layers = s.get('layers') or []
        has_char = False
        dark_card = land and s.get('background') and all(l.get('type') == 'text' for l in layers)
        if dark_card: Wn.append(f'{w}: a text-only card is an empty screen. Show H with a sticker / progress bar on the normal background instead.')
        clip_scene = any(l.get('type') == 'video' for l in (s.get('layers') or []))  # clips always play on plain white
        if not land and not clip_scene and s.get('backdrop') not in ('spotlight', 'rays', 'grid'):
            Wn.append(f'{w}: backdrop {s.get("backdrop")!r}: use "spotlight", "rays" or a grey "grid" ("backdropColor": "#B0B6BE", "backdropOpacity": 0.6).')
        if si and not clip_scene and s.get('backdrop') and s.get('backdrop') == scenes[si - 1].get('backdrop') and s.get('backdropColor') == scenes[si - 1].get('backdropColor'):
            Wn.append(f'{w}: same backdrop and colour as the scene before; vary it.')
        chars = []
        for li, l in enumerate(layers):
            lw = f'{w}.layers[{li}] ({l.get("type")})'
            ty = l.get('type')
            nulls = [k for k, v in l.items() if v is None]
            if nulls: E.append(f'{lw}: {", ".join(nulls)} is null; give a value or leave the field out.')
            if ty not in LAYER_TYPES:
                E.append(f'{lw}: unknown layer type. Use one of {sorted(LAYER_TYPES)}')
                continue
            a = r(l['at'], f'{lw}.at') if 'at' in l else st
            u = r(l['until'], f'{lw}.until') if 'until' in l else en
            if 'strike' in l: r(l['strike'], f'{lw}.strike')
            if 'marker' in l: events.append((r(l['marker'], f'{lw}.marker'), 'marker'))
            if ty == 'burst': Wn.append(f'{lw}: stars / bursts are not drawn any more. Use a box label, a "chip" or a "glow" instead.')
            if not land and ty in BIG: Wn.append(f'{lw}: big cards make H small: use a box label, a "chip" and a pose instead.')
            if not land and ty == 'banner': Wn.append(f'{lw}: banners have outlined text: use a box label ("look": "box").')
            if not land and ty == 'text' and l.get('look') in ('thumb', 'hook', 'pop', 'comic'):
                Wn.append(f'{lw}: look "{l.get("look")}" has outlined letters: use "look": "box" with a "boxColor".')
            if l.get('enter') == 'squash': Wn.append(f'{lw}: "enter": "squash" hides H for a moment: use "punch".')
            if ty == 'poses' and l.get('crossfade', 0) not in (0, None): Wn.append(f'{lw}: use "crossfade": 0 (a crossfade shows two bodies at once).')
            if ty in GRAPHICS or (ty == 'text' and l.get('look') in ('giant', 'echo', 'marquee', 'tape', 'outline')): mg_events.append(a)
            if ty in ('text', 'banner', 'comment', 'counter', 'stat', 'chip'): hook_words.append(a)
            if ty == 'kinetic' and l.get('lines'):
                lt = r(l['lines'][0]['at'], f'{lw}.lines[0].at') if 'at' in l['lines'][0] else a
                hook_words.append(lt)
            if ty in BIG: big_count[0] += 1
            if ty == 'icon' and l.get('name') not in ICONS: E.append(f'{lw}: icon name must be one of {sorted(ICONS)}')
            if ty == 'stat' and not l.get('value') and not l.get('count'): E.append(f'{lw}: a stat needs "value" or "count".')
            if ty == 'kinetic' and not l.get('lines'): E.append(f'{lw}: kinetic needs "lines": [{{"text", "at"}}].')
            if ty == 'timeline' and len(l.get('steps') or []) < 2: E.append(f'{lw}: a timeline needs 2–6 "steps".')
            if ty == 'slider':
                for key in ('before', 'after'):
                    if not isinstance(l.get(key), dict): E.append(f'{lw}: a slider needs "{key}": {{"asset", "label"}}.')
            if ty == 'comment' and not l.get('text'): E.append(f'{lw}: a comment needs "text".')
            if 'revealAt' in l: events.append((r(l['revealAt'], f'{lw}.revealAt'), 'slider'))
            for key in ('items', 'messages', 'steps', 'lines'):
                for k, it in enumerate(l.get(key) or []):
                    if 'at' in it: events.append((r(it['at'], f'{lw}.{key}[{k}].at'), key))
            for key in ('left', 'right'):
                side = l.get(key)
                if isinstance(side, dict) and 'at' in side: events.append((r(side['at'], f'{lw}.{key}.at'), 'versus'))
            if ty == 'versus':
                for key in ('left', 'right'):
                    if not isinstance(l.get(key), dict) or not l[key].get('label'): E.append(f'{lw}: a versus needs "{key}": {{"label": ...}}.')
            if ty in ('checklist', 'bars') and not l.get('items'): E.append(f'{lw}: a {ty} needs "items".')
            if ty == 'chat' and not l.get('messages'): E.append(f'{lw}: a chat needs "messages".')
            if ty in ('banner', 'callout') and not l.get('text'): E.append(f'{lw}: a {ty} needs "text".')
            if ty == 'callout' and not l.get('anchor') and not l.get('to'): E.append(f'{lw}: a callout needs "anchor" (a body part) or "to": [x, y].')
            if a is not None and en is not None and st is not None and (a < st - 0.3 or a >= en):
                Wn.append(f'{lw}: "at" ({l.get("at")}) is outside its scene, so it never shows. Pick the phrase spoken during this scene (use #2 if the words come earlier too).')
            if a is not None and u is not None and u <= a: E.append(f'{lw}: "until" ({l.get("until")}) is not after "at" ({l.get("at", "scene start")}).')
            for k in ('enter', 'exit'):
                v = l.get(k)
                if isinstance(v, dict): v = v.get('type')
                if v is not None and v not in ENTERS: E.append(f'{lw}.{k} "{v}" is not one of {sorted(ENTERS)}')
            events.append((a, ty))
            assets = []
            if ty == 'versus':
                assets += [l[k].get('asset') for k in ('left', 'right') if isinstance(l.get(k), dict) and l[k].get('asset')]
            if ty == 'slider':
                assets += [l[k].get('asset') for k in ('before', 'after') if isinstance(l.get(k), dict) and l[k].get('asset')]
            if ty in ('image', 'video', 'pattern') or (ty == 'zoomBubble' and l.get('asset')):
                assets.append(l.get('asset'))
            if ty == 'poses':
                fr = l.get('frames') or []
                ts = []
                for k, f in enumerate(fr):
                    assets.append(f.get('asset'))
                    ft = r(f.get('at'), f'{lw}.frames[{k}].at')
                    ts.append(ft)
                    events.append((ft, 'pose'))
                if any(ts[k] is not None and ts[k - 1] is not None and ts[k] <= ts[k - 1] for k in range(1, len(ts))):
                    E.append(f'{lw}: frame times must increase.')
                if req['sets'] and len({f.get('asset') for f in fr}) > 1:
                    ok = any(all(f.get('asset') in s2 or re.sub(r'_v\d+$', '', f.get('asset', '')) in s2 for f in fr) for s2 in req['sets'])
                    if not ok: Wn.append(f'{lw}: these frames are not one movement set ({", ".join(f.get("asset", "?") for f in fr)}). Only alternate frames of the same movement and angle.')
            if ty == 'split':
                for k, c in enumerate(l.get('cells') or []):
                    if c.get('asset'): assets.append(c['asset'])
                    if 'at' in c: events.append((r(c['at'], f'{lw}.cells[{k}].at'), 'cell'))
            for aid in assets:
                if aid and req['assets'] and aid not in req['assets']:
                    E.append(f'{lw}: unknown asset "{aid}". Use only ids from the image library.')
            if ty in CHARACTER and not any(str(x).startswith('prop_') for x in assets):
                has_char = True
                chars.append((a, u, assets))
            if ty in OVERLAY:
                anc = l.get('anchor')
                for part in [anc, l.get('from') if isinstance(l.get('from'), str) else None, l.get('to') if isinstance(l.get('to'), str) else None]:
                    if part:
                        base = re.sub(r'^(left|right|l|r)_', '', part)
                        if base not in ANCHORS: E.append(f'{lw}: unknown body part "{part}". Use: head, face, neck, shoulders, shoulder_blades, upper_back, chest, back, abs, hips, glutes, arms, elbows, forearms, hands, thighs, legs, knees, calves, feet, body.')
                if (anc or ty == 'measure') and not has_char and not l.get('target'):
                    E.append(f'{lw}: a {ty} needs a character layer ABOVE it in the same scene (it attaches to the closest one above).')
                tgt = next((c for c in reversed(chars)), None)
                if tgt and any(x in req['nopoints'] for x in tgt[2]) and anc:
                    Wn.append(f'{lw}: the character above has no body points ({", ".join(tgt[2])}); place this with x/y or pick another pose.')
                if ty == 'highlight' and tgt and u is not None and tgt[1] is not None and u > tgt[1] + 0.05:
                    Wn.append(f'{lw}: the ring stays after its character picture ends; end it (until) when the picture changes.')
            if ty == 'text':
                txt = l.get('text', '')
                if l.get('look') is not None and l['look'] not in LOOKS: E.append(f'{lw}: look must be one of {sorted(LOOKS)}')
                if land and not l.get('look'): Wn.append(f'{lw} "{txt}": 16:9 text needs a "look" (hook / box / pop / comic), plain coloured letters disappear on white.')
                txt = txt.replace('*', '')
                if len(txt) > (18 if land else 22): Wn.append(f'{lw} "{txt}": too long for one line; use 1–3 words.')
                y = l.get('y', 0.17)
                if not land and (y > 0.75 or y < 0.13):
                    Wn.append(f'{lw} "{txt}": y {y} is outside the Shorts safe zone (keep 0.15–0.75).')
            if ty in ('burst', 'counter', 'progress') and ty == 'counter' and 'to' not in l:
                E.append(f'{lw}: a counter needs "to".')
            if ty == 'image' and str(l.get('asset', '')).startswith('prop_') and not land:
                x = l.get('x', 0.5)
                if 0.3 < x < 0.7 and l.get("y", 0.58) < 0.75: Wn.append(f'{lw}: prop at x {x} sits on H; use x 0.2 or 0.8.')
        if not has_char and not dark_card and not any(l.get('type') in ({'split'} | BIG) - {'kinetic'} for l in layers):
            Wn.append(f'{w}: no picture of H in this scene.')
    # sounds
    sfx = []
    for i, x in enumerate(plan.get('sfx') or []):
        t = r(x.get('at'), f'sfx[{i}].at')
        if req['sfx'] and x.get('src') not in req['sfx']:
            E.append(f'sfx[{i}]: unknown sound "{x.get("src")}". Use only ids from the Sound effects list.')
        if 'volume' in x: Wn.append(f'sfx[{i}]: leave out "volume".')
        sfx.append((t or 0, x.get('src')))
    sfx.sort()
    for (t1, a), (t2, b) in zip(sfx, sfx[1:]):
        if t2 - t1 < 0.3: Wn.append(f'sounds "{a}" and "{b}" are only {t2 - t1:.1f} s apart (keep 0.5 s); move or drop one.')
        if a == b: Wn.append(f'"{a}" twice in a row; vary the sounds.')
    dur = T.end
    # motion graphics: something designed (chip, glow, highlight, arrow, callout…) at least every ~10 s; big cards are not required (they shrink H)
    mg = sorted({round(x, 2) for x in mg_events if x is not None} | {0.0, round(dur, 2)})
    for a, b in zip(mg, mg[1:]):
        if b - a > 10: Wn.append(f'no motion graphic for {b - a:.0f} s ({a:.0f}–{b:.0f} s): add a chip, glow, highlight, arrow or callout there.')
    st_ = sorted({round(x, 2) for x in strong if x is not None} | {0.0, round(dur, 2)})
    for a, b in zip(st_, st_[1:]):
        if b - a > 12: Wn.append(f'no pattern interrupt for {b - a:.0f} s ({a:.0f}–{b:.0f} s): give a scene a "circle", "zoomThrough" or "zoomBlur" transition, or a shake.')
    auto = len(mg_events) if plan.get('audio', {}).get('autoSfx', True) else 0
    if sfx and dur / max(1, len(sfx) + auto) > 2.6:
        Wn.append(f'only {len(sfx)} sounds for ~{dur:.0f} s: add more (about one every 1.5–2.5 s).')
    # HOOK: the first 3 seconds decide if people keep watching
    first = [(t, ty) for t, ty in events if t is not None and t < 3.0 and ty != 'scene']
    if not any(t <= 0.05 for t, _ in first):
        Wn.append('hook: nothing appears on the very first frame. Start with H AND the hook words at "start" (no empty or slow opening).')
    if not any(x is not None and x <= 0.6 for x in hook_words):
        Wn.append('hook: no hook words in the first 0.6 s. Put a box label with the hook words at "start" ("look": "box", "animation": "words", "y": 0.7).')
    changes = sorted({round(t, 1) for t, _ in first})
    if len(changes) < 4:
        Wn.append(f'hook: only {len(changes)} visual change(s) in the first 3 s. Make it fast: 4+ changes (new pose on the key words, second hook line, ring / highlight, camera punch, shake on the strongest word).')
    if not any(ty in ('camera', 'pose') for t, ty in first) and not any(x is not None and x < 3.0 for x in strong):
        Wn.append('hook: no movement in the first 3 s. Add a camera punch (zoom 1.3 on the key word) or a "shakes" entry on the strongest word.')
    if not any(t <= 0.15 for t, _ in sfx):
        Wn.append('hook: no sound on the first frame. Start with a whoosh / hit at "start".')
    ends = [i for i, w in enumerate(T.words) if re.search(r'[.?!]["\')]*$', w)]
    if ends:
        hook_end = T.word_time(ends[0], end=True)
        if hook_end > 3.2:
            Wn.append(f'hook: the first sentence takes {hook_end:.1f} s ("{" ".join(T.words[:ends[0] + 1])}"). The hook must land in under 3 s: rewrite it to 8 words or fewer (a shocking claim, a number, a question or "you are doing X wrong").')
    if T.words and re.match(r"(?i)^(hey|hi|hello|welcome|so|today|in this video|guys)", ' '.join(T.words[:3])):
        Wn.append('hook: the script opens with a greeting / intro. Start directly with the hook (the problem, the claim or the number).')

    # rhythm: longest time without anything new on screen
    ts = sorted({round(t, 2) for t, _ in events if t is not None} | {0.0, round(dur, 2)})
    limit = 2.8 if land else 3.2
    gaps = [(b - a, a, b) for a, b in zip(ts, ts[1:]) if b - a > limit]
    for g, a, b in sorted(gaps, reverse=True)[:8]:
        idx = [i for i in range(len(T.words)) if a - 0.05 <= T.word_time(i) <= b] if T.timed else list(range(int(a / SEC_PER_TOKEN), int(b / SEC_PER_TOKEN) + 1))
        words = ' '.join(T.words[i] for i in idx if i < len(T.words))
        Wn.append(f'nothing new on screen for ~{g:.1f} s, while the voice says: "{words}". Add a pose change, sticker, ring, counter or camera punch there.')
    return E, Wn


def report(req_text, plan_text, script=None, timed=None, as_json=False):
    """Prints the check result; returns True when clean."""
    req = parse_request(req_text)
    script = script or req['script']
    if not script:
        print('Could not find the script: use the whole request from the tool (it ends with "## Script ..." and the script).')
        return False
    try:
        plan = load_plan(plan_text)
    except json.JSONDecodeError as e:
        print(f'ERROR: the JSON is not valid: {e}')
        return False
    E, Wn = check(plan, req, script, timed)
    if as_json:
        print(json.dumps({'errors': E, 'quality': Wn}))
        return not E and not Wn
    dur = Times(script, timed).end
    print(f'format: {"16:9 landscape" if req["landscape"] else "9:16 vertical"}, ~{dur:.0f} s of voice, {len(plan.get("scenes") or [])} scenes, {len(plan.get("sfx") or [])} sounds')
    for e in E: print('ERROR:', e)
    for w in Wn: print('FIX:', w)
    if not E and not Wn: print('ALL CLEAN')
    return not E and not Wn


def ask_file(question, default):
    here = os.path.dirname(os.path.abspath(__file__))
    d = os.path.join(here, default)
    hint = f' (Enter = {default} next to this file)' if os.path.exists(d) else ''
    while True:
        ans = input(f'{question}{hint}: ').strip().strip('"').strip("'")
        path = ans or (d if hint else '')
        if path and os.path.isfile(path):
            return path
        print('  File not found. Drag the file into this window and press Enter.')


def interactive():
    # double-clicked on Windows: ask for the files instead of closing at once
    print('Reel Engine plan checker')
    print('1) the request copied from the tool, saved as a .txt file')
    print('2) the JSON plan, saved as a .json or .txt file\n')
    req = ask_file('Request file', 'request.txt')
    while True:
        plan = ask_file('Plan file', 'plan.json')
        print()
        report(open(req, encoding='utf-8-sig').read(), open(plan, encoding='utf-8-sig').read())
        if input('\nEnter = check again (after editing the plan), q = quit: ').strip().lower() == 'q':
            return


def gui():
    """A window: paste the request and the plan, press CHECK. Used when the file is double-clicked."""
    import io, contextlib
    import tkinter as tk
    from tkinter import filedialog, scrolledtext

    root = tk.Tk()
    root.title('Reel Engine plan checker')
    root.geometry('1100x780')
    root.configure(bg='#F4F1FB')
    font = ('Segoe UI', 10)

    def box(parent, title, hint):
        frame = tk.Frame(parent, bg='#F4F1FB')
        top = tk.Frame(frame, bg='#F4F1FB')
        top.pack(fill='x')
        tk.Label(top, text=title, font=('Segoe UI', 11, 'bold'), bg='#F4F1FB').pack(side='left')
        text = scrolledtext.ScrolledText(frame, height=12, wrap='word', font=('Consolas', 9), undo=True)

        def paste():
            try:
                text.delete('1.0', 'end')
                text.insert('1.0', root.clipboard_get())
            except tk.TclError:
                pass

        def open_file():
            f = filedialog.askopenfilename(filetypes=[('Text / JSON', '*.txt *.json *.md'), ('All files', '*.*')])
            if f:
                text.delete('1.0', 'end')
                text.insert('1.0', open(f, encoding='utf-8-sig', errors='replace').read())

        for label, cmd in (('Clear', lambda: text.delete('1.0', 'end')), ('Open file…', open_file), ('Paste', paste)):
            tk.Button(top, text=label, command=cmd, font=font, padx=8).pack(side='right', padx=3)
        tk.Label(frame, text=hint, font=('Segoe UI', 9), fg='#666', bg='#F4F1FB').pack(anchor='w')
        text.pack(fill='both', expand=True, pady=(2, 0))
        return frame, text

    panes = tk.Frame(root, bg='#F4F1FB')
    panes.pack(fill='both', expand=True, padx=12, pady=(10, 4))
    f1, req_box = box(panes, '1. Request from the tool', 'In the tool press "Copy prompt", then press Paste here.')
    f2, plan_box = box(panes, '2. JSON plan', 'The JSON the AI gave you. Press Paste here.')
    f1.pack(side='left', fill='both', expand=True, padx=(0, 6))
    f2.pack(side='left', fill='both', expand=True, padx=(6, 0))

    out = scrolledtext.ScrolledText(root, height=14, wrap='word', font=('Consolas', 10))
    out.tag_config('err', foreground='#C62828')
    out.tag_config('fix', foreground='#B26A00')
    out.tag_config('ok', foreground='#1B8A3A', font=('Consolas', 13, 'bold'))
    out.tag_config('info', foreground='#333333')

    def run():
        buf = io.StringIO()
        req_text, plan_text = req_box.get('1.0', 'end').strip(), plan_box.get('1.0', 'end').strip()
        out.delete('1.0', 'end')
        if not req_text or not plan_text:
            out.insert('end', 'Paste the request (box 1) and the JSON plan (box 2) first.\n', 'err')
            return
        try:
            with contextlib.redirect_stdout(buf):
                report(req_text, plan_text)
        except Exception as e:
            buf.write(f'ERROR: could not check: {e}\n')
        lines = buf.getvalue().splitlines()
        n_err = sum(l.startswith('ERROR') for l in lines)
        n_fix = sum(l.startswith('FIX') for l in lines)
        for l in lines:
            tag = 'err' if l.startswith('ERROR') else 'fix' if l.startswith('FIX') else 'ok' if l.startswith('ALL CLEAN') else 'info'
            out.insert('end', l + '\n\n' if tag in ('err', 'fix') else l + '\n', tag)
        status.config(text=('ALL CLEAN: the plan is ready.' if not n_err and not n_fix else
                            f'{n_err} error(s), {n_fix} point(s) to improve. Press "Copy for the AI" and paste it in the AI chat.'))

    def copy_for_ai():
        lines = [l for l in out.get('1.0', 'end').splitlines() if l.startswith(('ERROR', 'FIX'))]
        if not lines:
            return
        root.clipboard_clear()
        root.clipboard_append('The checker found these problems in your JSON. Fix all of them and send the FULL corrected JSON again:\n\n'
                              + '\n'.join('- ' + l.split(':', 1)[1].strip() for l in lines))
        status.config(text='Copied. Paste it in the AI chat, then paste the new JSON in box 2 and press CHECK again.')

    bar = tk.Frame(root, bg='#F4F1FB')
    bar.pack(fill='x', padx=12, pady=4)
    tk.Button(bar, text='CHECK', command=run, font=('Segoe UI', 13, 'bold'), bg='#7C4DFF', fg='white',
              activebackground='#6A3DE8', padx=30, pady=4).pack(side='left')
    tk.Button(bar, text='Copy for the AI', command=copy_for_ai, font=font, padx=10).pack(side='left', padx=10)
    status = tk.Label(bar, text='', font=('Segoe UI', 10, 'bold'), bg='#F4F1FB', fg='#333')
    status.pack(side='left', padx=6)
    out.pack(fill='both', expand=True, padx=12, pady=(4, 12))
    root.mainloop()


def main():
    try:  # Windows consoles are not UTF-8 by default: never crash on a dash or an arrow
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
    if len(sys.argv) == 1:
        try:
            gui()
            return
        except ImportError:
            pass  # no tkinter: ask in the console instead
        try:
            interactive()
        except (KeyboardInterrupt, EOFError):
            pass
        except Exception as e:
            print(f'\nSomething went wrong: {e}')
            input('Press Enter to close.')
        return
    as_json = '--json' in sys.argv
    timed = None
    if '--words' in sys.argv:
        k = sys.argv.index('--words')
        timed = json.load(open(sys.argv[k + 1], encoding='utf-8'))['words']
        del sys.argv[k:k + 2]
    sys.argv = [a for a in sys.argv if a != '--json']
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(2)
    req_text = '' if sys.argv[1] == '-' else open(sys.argv[1], encoding='utf-8-sig').read()
    script = open(sys.argv[3], encoding='utf-8-sig').read() if len(sys.argv) > 3 else None
    ok = report(req_text, open(sys.argv[2], encoding='utf-8-sig').read(), script, timed, as_json)
    sys.exit(0 if ok or as_json else 1)


if __name__ == '__main__':
    main()
