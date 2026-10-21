"""Turn a style-guide script (scripts/dayNN_x.md) into a beat sheet for make_video.py, with no hand work.

Usage: python3 tools/script_to_beats.py scripts/dayNN_x.md videos/<slug>
Needs <slug>/02_assets/screens/screens.json from get_screens.py (missing screenshots are skipped).
Writes <slug>/01_script/beats.txt.

How a spoken line becomes beats: the line is split into sentences, one beat each. Its SCREEN cues take the
first beats (real screenshot, narrator peeking, yellow highlight where get_screens found the quote). The
library codes named in its VISUAL note are then added one by one over the remaining beats, with the motion
words of the note (from the left/right, drops, pops, walks...) turned into ~l ~r ~drop ~pop ~walk.
Each chapter heading becomes a short title beat with the sting; the last line is followed by the end screen.
"""
import json, os, re, sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "sheet"))
import parse_script
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sentence_visuals as sv

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CODES = {l.split("_")[0] for l in open(os.path.join(ROOT, "library", "ASSET_LIST.txt")).read().split()}
PEOPLE = re.compile(r"^(A\d\d|B\d\d|C\d\d|H0\d|H1[0-4])$")
PROPS_WITH_WORD = {"H15", "H16", "H17", "H18"}
PEOPLE_SLOTS = ["0.2,0.6:0.58", "0.4,0.64:0.46"]
PROP_SLOTS = ["0.62,0.4", "0.85,0.4", "0.62,0.76", "0.85,0.76", "0.42,0.24"]
NOTE_SLOTS = ["0.66,0.12", "0.5,0.92"]
MOTION = [(r"from the left|slides? (in )?left", "l"), (r"from the right|slides? (in )?right", "r"),
          (r"from the top|drops?|falls?|pours?", "drop"), (r"from the bottom|rises?", "b"),
          (r"walks?", "walk"), (r"pops?", "pop"), (r"shakes?|trembles?", "shake"),
          (r"spins?|turns?|rotates?", "spin"), (r"floats?|bobs?|drifts?", "float")]


def sentences(text):
    out = [s for s in re.split(r"(?<=[.!?])\s+", text.strip()) if s]
    res = []
    for s in out:                                   # very long sentences get a second beat at a comma
        if len(s.split()) > 26 and ", " in s:
            a, b = s.split(", ", 1)
            res += [a + ",", b]
        else:
            res.append(s)
    return res


def clean(t):
    return t.replace('"', "'").replace("|", "/").strip()


def visual_items(vis):
    """Ordered elements (without position) from a free-text VISUAL note."""
    items, seen = [], set()
    for clause in re.split(r";|\bthen\b|\. ", vis):
        mo = next((m for pat, m in MOTION if re.search(pat, clause, re.I)), "")
        for code in re.findall(r"\b([A-H]\d\d)(?=_|\b)", clause):
            if code not in CODES or code.startswith("F") or code in seen:
                continue
            seen.add(code)
            word = ""
            if code in PROPS_WITH_WORD:
                m = re.search(code + r'[^"]{0,40}"([^"]{1,18})"', clause)
                word = m.group(1).upper() if m else ""
                if not word:
                    continue
            if code == "E01" and re.search(r"rain|pour|falling", clause, re.I):
                items.append({"rain": "E01"})
                continue
            items.append({"code": code, "mo": mo, "word": word})
        if re.search(r"\bred X\b|\bX mark\b|crossed out", clause, re.I):
            items.append({"xmark": True})
        for q in re.findall(r'"([^"]{2,30})"', clause):
            if not any(i.get("word") == q.upper() for i in items):
                items.append({"note": q})
    return items


def place(items):
    """Give each item a fixed spot; later items reuse spots of the oldest ones."""
    out, ppl, prp, nts = [], 0, 0, 0
    for it in items:
        if "rain" in it:
            out.append(f"rain:{it['rain']}*18")
        elif "xmark" in it:
            out.append("xmark")
        elif "note" in it:
            out.append(f'note:"{clean(it["note"])}"@{NOTE_SLOTS[nts % 2]}')
            nts += 1
        else:
            code, mo = it["code"], ("~" + it["mo"]) if it["mo"] else ""
            if PEOPLE.match(code):
                s = PEOPLE_SLOTS[ppl % 2]
                ppl += 1
            else:
                s = PROP_SLOTS[prp % len(PROP_SLOTS)] + ":0.32"
                prp += 1
            word = f':"{clean(it["word"])}"' if it["word"] else ""
            out.append(f"{code}@{s}{word}{mo}")
    # keep only the newest element in each spot
    spot = lambda e: e.split("@")[1].split(":")[0] if "@" in e else e
    keep = {}
    for e in out:
        keep[spot(e)] = e
    return [e for e in out if keep[spot(e)] is e]


SCENE_WORDS = 26           # new scene about every 8-9 s of speech (the reference cuts about every 8 s)


def scene(el, v):
    """Same items, new look: v=0 normal, 1 mirrored left-right (everything enters again), 2 close-up of the newest prop."""
    if v == 1:
        out = []
        for e in el:
            m = re.search(r"@([\d.]+),([\d.]+)", e)
            if m and not e.startswith("note") and float(m.group(2)) >= 0.3:    # keep notes and top items clear of the title
                e = e.replace(m.group(0), f"@{1 - float(m.group(1)):.2f},{m.group(2)}")
            e = e.replace("~l", "~R").replace("~r", "~l").replace("~R", "~r")
            out.append(e)
        return out
    if v == 2:
        props = [e for e in el if "@" in e and not e.startswith("note") and not PEOPLE.match(e.split("@")[0])]
        if len(props) == 1:                             # close-up only when the sentence names one thing
            code = props[0].split("@")[0]
            word = re.search(r':"[^"]*"', props[0].split("@")[1])
            return [f"{code}@0.5,0.6:0.76" + (word.group(0) if word else "")]
    return el


NUM_STYLES = ["sign", "text", "label", "paper", "tag"]
POSES_NOW = {}          # the current video's character poses (set in main)


# Scene layouts: each spoken line gets one, chosen so the next line looks different. Slot = (x, y, height, motion).
LAYOUTS = {
    "grid":   {"me": (0.2, 0.6, 0.58, ""), "slots": [(0.58, 0.36, 0.3, "pop"), (0.84, 0.36, 0.3, "pop"),
               (0.58, 0.74, 0.3, "pop"), (0.84, 0.74, 0.3, "pop")], "num": (0.71, 0.55), "say": (0.36, 0.24)},
    "row":    {"me": (0.86, 1.0, 0.62, "bottom"), "slots": [(0.14, 0.42, 0.28, "l"), (0.38, 0.42, 0.28, "l"),
               (0.62, 0.42, 0.28, "l"), (0.38, 0.8, 0.24, "b")], "num": (0.62, 0.8), "say": (0.62, 0.14), "flow": 1},
    "arc":    {"me": (0.5, 0.68, 0.55, ""), "slots": [(0.18, 0.6, 0.3, "l"), (0.82, 0.6, 0.3, "r"),
               (0.22, 0.24, 0.26, "t"), (0.78, 0.24, 0.26, "t")], "num": (0.5, 0.16), "say": (0.5, 0.18)},
    "column": {"me": (0.8, 0.6, 0.6, ""), "slots": [(0.2, 0.28, 0.22, "drop"), (0.2, 0.54, 0.22, "drop"),
               (0.2, 0.8, 0.22, "drop"), (0.48, 0.5, 0.3, "pop")], "num": (0.5, 0.2), "say": (0.56, 0.2), "flow": 1},
    "hero":   {"me": (0.13, 0.68, 0.48, ""), "slots": [(0.52, 0.5, 0.56, "swing"), (0.86, 0.24, 0.22, "r"),
               (0.86, 0.76, 0.22, "r"), (0.3, 0.18, 0.18, "t")], "num": (0.86, 0.5), "say": (0.3, 0.2)},
    "peek":   {"me": (0.0, 0.62, 0.6, "left"), "slots": [(0.34, 0.3, 0.26, "b"), (0.55, 0.5, 0.28, "b"),
               (0.78, 0.7, 0.3, "b"), (0.82, 0.24, 0.24, "swing")], "num": (0.5, 0.82), "say": (0.4, 0.74), "flow": 1},
}
CAUSE = re.compile(r"\b(so|then|which|because|led|meant|until|turned|became|leads?|caused?)\b", re.I)
BAD = re.compile(r"\b(crash\w*|collaps\w*|panic\w*|fell|fall|lost|broke\w*|fail\w*|bankrupt\w*|shock\w*)\b", re.I)


def new_layout(i, pick):
    """A layout for spoken line i: the least used so far, never the same as the line before, sometimes mirrored."""
    import random
    r = random.Random(i * 7 + 3)
    last = pick.used.get("layout:last")
    names = [n for n in LAYOUTS if n != last]
    r.shuffle(names)
    name = min(names, key=lambda n: pick.used.get("layout:" + n, 0))
    pick.used["layout:" + name] = pick.used.get("layout:" + name, 0) + 1
    pick.used["layout:last"] = name
    return {"name": name, "mirror": r.random() < 0.5, "mot": {}, **LAYOUTS[name]}


def sentence_elements(s, person, pick, names, line, lay):
    """One sentence inside a scene that builds up: things named earlier in the same spoken line stay where they
    are (`line` holds them, max 4), new ones come in the layout's own way, the narrator swaps pose, and the key
    number is shown in a rotating style (sign, red text, red label with arrow, paper note, price tag) or as icons."""
    mirror = lay["mirror"]
    X = (lambda x: round(1 - x, 2)) if mirror else (lambda x: x)
    flip = {"l": "r", "r": "l", "left": "right", "right": "left"}
    F = (lambda m: flip.get(m, m)) if mirror else (lambda m: m)
    props = [c[:3] for c in sv.sentence_props(s)]
    about_person = person and (re.search(r"\b(she|he|her|his|him)\b", s, re.I) or any(n in s for n in names))
    who = person if about_person else pick.pose(s)
    order = lay.setdefault("order", [])
    for c in (pick.prop(c) for c in props):
        if c and c != who and c not in line:
            if len(line) < 4:
                line.append(c)
            else:                                   # full: the oldest leaves and the new one takes its place
                line[line.index(order.pop(0))] = c
            order.append(c)
            lay["mot"][c] = "shake" if BAD.search(s) and len(line) > 1 else None
    slots = lay["slots"]
    mx, my, mh, anchor = lay["me"]
    if POSES_NOW:
        out = [person_elem(s, pick, POSES_NOW, names, mirror, (mx if mx > 0.05 else 0.12, min(my, 0.66), mh))]
    else:
        out = [f"{who}@{X(mx)},{my}:{mh}" + (f":{F(anchor)}" if anchor else "") + "~none"]
    num = sv.number_sign(s)
    m = re.match(r"(\d{1,2}) ([A-Z]+)$", num or "")
    group = line[-1] if (m and 2 <= int(m.group(1)) <= 12 and line) else ""
    for k, c in enumerate(line):
        x, y, h, mot = slots[k]
        if c == group:                              # "three banks" -> three small banks
            g = h * 0.45
            out.append(f"group:{c}*{m.group(1)}@{X(x) - g:.2f},{y - g:.2f},{X(x) + g:.2f},{y + g:.2f}:{h * 0.42:.2f}")
        else:
            out.append(f"{c}@{X(x)},{y}:{h}~{lay['mot'].get(c) or F(mot)}")
    if lay.get("flow") and len(line) >= 2 and CAUSE.search(s):   # one thing leads to the next: draw the arrow
        (x0, y0, h0, _), (x1, y1, h1, _) = slots[line.index(order[-2])], slots[line.index(order[-1])]
        dx, dy = x1 - x0, y1 - y0
        n = max((dx * dx + dy * dy) ** 0.5, 0.01)
        a, b = 0.13 / n, 1 - 0.13 / n
        out.append(f"arrow:{X(x0 + dx * a):.2f},{y0 + dy * a:.2f}>{X(x0 + dx * b):.2f},{y0 + dy * b:.2f}")
    quote = re.search(r'[“"]([^”"]{3,40})[”"]', s)
    sx, sy = lay["say"]
    if quote:
        out.append(f'bubble:"{clean(quote.group(1))}"@{X(sx)},{sy}:{"r" if X(sx) > X(mx) else "l"}')
    elif s.endswith("?") and len(s) <= 46:
        out.append(f'think:"{clean(s)}"@{X(sx)},{sy}')
    if num and not group:
        style = min((st for st in NUM_STYLES if st != "tag" or num.startswith("$")),
                    key=lambda st: (pick.used.get("style:" + st, 0), NUM_STYLES.index(st)))
        pick.used["style:" + style] = pick.used.get("style:" + style, 0) + 1
        t = clean(num)[:18]
        free = slots[len(line)][:2] if len(line) < 4 else lay["num"]
        if style == "label" and line:
            tx, ty = slots[line.index(order[-1])][:2]
            out.append(f'label:"{t}"@{X(sx)},{sy}>{X(tx)},{ty - 0.12:.2f}')
        elif style == "text" or (style == "label" and not line):
            out.append(f'"{t}"@{X(lay["num"][0])},{lay["num"][1]}:64:red')
        elif style == "paper":
            out.append(f'note:"{t}"@{X(free[0])},{free[1]}')
        else:
            code = {"sign": "H18", "tag": "H17"}[style]
            out.append(f'{code}@{X(free[0])},{free[1]}:0.3:"{t}"~{"drop" if style == "sign" else "swing"}')
    pick.take([who] + line)
    return out


# Picture scenes (owner pictures, photos, bar charts): where the person and the picture go, how the picture enters.
DOC_LAYOUTS = [((0.16, 0.62, 0.5), (0.6, 0.54), "b"), ((0.84, 0.62, 0.5), (0.4, 0.54), "l"),
               ((0.88, 0.74, 0.4), (0.44, 0.5), "t"), ((0.12, 0.74, 0.4), (0.56, 0.5), "r"),
               ((0.5, 0.8, 0.34), (0.5, 0.4), "pop")]


def doc_layout(pick):
    k = pick.used.get("doclay", 0)
    pick.used["doclay"] = k + 1
    return DOC_LAYOUTS[(k * 3) % len(DOC_LAYOUTS)]


CH_MOOD = {"question": "CH3", "shock": "CH4", "sad": "CH8", "suspicious": "CH3", "good": "CH2", "teach": "CH5",
           "neutral": "CH1"}


def load_custom(day, vdir):
    """Owner-made pictures in library/custom/dayNN/: scene pictures (S01..) and the character's poses (CH1..)."""
    import shutil
    tag = f"day{int(day):02d}"
    src = os.path.join(ROOT, "library", "custom", tag)
    meta = os.path.join(ROOT, "assets_needed", f"{tag}_assets.json")
    if not os.path.isdir(src) or not os.path.exists(meta):
        return {}, {}, {}
    assets = json.load(open(meta))
    dst = os.path.join(vdir, "02_assets", "screens")
    os.makedirs(dst, exist_ok=True)
    files = {}
    for f in os.listdir(src):
        aid, ext = os.path.splitext(f)
        if aid in assets and ext.lower() in (".png", ".jpg", ".jpeg", ".webp"):
            shutil.copy(os.path.join(src, f), os.path.join(dst, f"c_{tag}_{aid}{ext.lower()}"))
            files[aid] = f"c_{tag}_{aid}{ext.lower()}"
    scene_of = {a["sentence"]: files[k] for k, a in assets.items() if a["type"] == "scene" and k in files}
    poses = {k: files[k] for k, a in assets.items() if a["type"] == "pose" and k in files}
    return files, scene_of, poses


def person_elem(s, pick, poses, names, mirror, at=None):
    """The narrator pose, or the story character's own pose picture when the sentence is about them."""
    x, y, h = at or (0.2, 0.6, 0.58)
    x = round(1 - x, 2) if mirror else x
    if poses and (re.search(r"\b(she|he|her|his|him)\b", s, re.I) or any(n in s for n in names)):
        mood = sv.MOOD.get(sv.narrator_for(s)[:3], "neutral")
        f = poses.get(CH_MOOD[mood]) or poses.get("CH1") or next(iter(poses.values()))
        return f"doc:{f}@{x},{y} w={h * 0.52:.2f} h={h + 0.04:.2f} frame=0"
    return f"{pick.pose(s)}@{x},{y}:{h}~none"


def photo_for(s, photos, used, now):
    """The photo whose name (or a person's surname) is said in this sentence; each photo at most twice, far apart."""
    for p in photos:
        words = p["name"].split()
        keys = [p["name"]] + ([words[-1]] if len(words) > 1 and words[-1][0].isupper() and len(words[-1]) > 4 else [])
        if any(re.search(r"\b" + re.escape(k) + r"\b", s) for k in keys):
            last = used.get(p["file"], [])
            if len(last) < 2 and (not last or now - last[-1] > 60):
                used.setdefault(p["file"], []).append(now)
                return p
    return None


def doc_elem(c, meta):
    m = meta.get(c)
    if not m or not m.get("ok"):
        return None
    hl = " hl=" + ",".join(str(v) for v in m["box"]) + "+0.8" if m.get("box") else ""
    return (f'doc:{m["file"]}@0.44,0.54 w=0.72 h=0.76 src="Source: {clean(m["source"])}"{hl}; '
            f"H04@0.9,1.0:0.3:bottom")


def main(script, vdir):
    d = parse_script.parse(script)
    sp = os.path.join(vdir, "02_assets", "screens", "screens.json")
    shots = json.load(open(sp)) if os.path.exists(sp) else []
    by_line = {}
    for s in shots:
        by_line.setdefault(s["line"], []).append(s)
    meta = {id(s): s for s in shots}
    import hashlib
    seen = set()                                   # the same screenshot is shown only once
    for s_ in shots:
        f_ = os.path.join(vdir, "02_assets", "screens", s_.get("file", ""))
        if s_.get("ok") and os.path.exists(f_):
            h_ = hashlib.md5(open(f_, "rb").read()).hexdigest()
            if h_ in seen:
                s_["ok"] = False
            seen.add(h_)
    pick = sv.Picker()
    pp = os.path.join(vdir, "02_assets", "screens", "photos.json")
    photos = [p_ for p_ in (json.load(open(pp)) if os.path.exists(pp) else [])
              if os.path.exists(os.path.join(vdir, "02_assets", "screens", p_["file"]))]
    photo_used = {}
    custom, scene_of, poses = load_custom(d["day"], vdir)
    global POSES_NOW
    POSES_NOW = poses
    thread = re.search(r"^THREAD:\s*(.*)$", open(script, encoding="utf-8").read(), re.M)
    names = tuple(w for w in re.findall(r"\b[A-Z][a-z]{2,}\b", thread.group(1)) if w not in ("The", "One", "Ohio")) if thread else ()
    spoken, lines, chap, title, missing, last_person = 0, [f"# Day {d['day']}: {d['title']}. Built by tools/script_to_beats.py."], None, "", 0, ""
    for i, ln in enumerate(d["lines"]):
        if ln["chap"] != chap:
            chap, last_person = ln["chap"], ""
            title = re.sub(r"^CHAPTER\s*\d+\s*:\s*", "", chap, flags=re.I)
            title = re.split(r"\s*[:(]\s*", title)[0].strip()             # planning notes after ':' stay off screen
            while len(title) > 30 and " " in title:
                title = title.rsplit(" ", 1)[0].rstrip(",&-")
            lines += ["", f"# ---------- {chap} ----------",
                      f'|| title:"{clean(title)}"; sting; A23@0.5,0.56:0.6; hold:1.2']
        sents = sentences(ln["text"])
        docs = [doc_elem(id(s), meta) for s in by_line.get(i, [])]
        missing += docs.count(None)
        docs = [x for x in docs if x]
        while len(sents) < len(docs) + (1 if docs else 0) and any(", " in s for s in sents):
            k = max(range(len(sents)), key=lambda j: len(sents[j]) if ", " in sents[j] else 0)
            a, b = sents[k].split(", ", 1)
            sents[k:k + 1] = [a + ",", b]
        para = [it["code"] for it in visual_items(ln["visual"]) if "code" in it]
        chars = [c for c in para if PEOPLE.match(c) and not re.match(r"^(A\d\d|H0\d|C28)$", c)]   # C28 = a crowd, not a person
        if chars:
            last_person = chars[0]                 # the story's person (not the narrator) stays on screen
        spare = [c for c in para if not PEOPLE.match(c)]
        narr = sv.narrator_for(ln["text"], i)[:3]          # one narrator pose per spoken line, not per sentence
        tag = f"[{ln['tag']}] " if ln["tag"] else ""
        line_items = []                              # the scene of this spoken line builds up sentence by sentence
        lay = new_layout(i, pick)
        for j, s in enumerate(sents):
            words = (tag if j == 0 else "") + s
            if j < len(docs):
                el = [f'title:"{clean(title)}"', docs[j]]
            else:
                ph = photo_for(s, photos, photo_used, len(lines))
                (px, py, ph_), (dx, dy), dm = doc_layout(pick)
                dw = 0.5 if px == 0.5 else 0.56
                if s in scene_of:                        # the owner's own picture made for this sentence
                    el = [f'title:"{clean(title)}"', person_elem(s, pick, poses, names, False, (px, py, ph_)),
                          f"doc:{scene_of[s]}@{dx},{dy} w={dw} h={0.6 if px == 0.5 else 0.74} frame=0 ~{dm}"]
                    lines.append(f"{words} || " + "; ".join(el))
                    spoken += len(s.split())
                    continue
                money = sv.money_values(s)
                if ph:                                   # a real photo of the person, company or place just named
                    el = [f'title:"{clean(title)}"', f"{pick.pose(s)}@{px},{py}:{ph_}~none",
                          f'doc:{ph["file"]}@{dx},{dy} w={dw} h={0.56 if px == 0.5 else 0.68} ~{dm} src="Photo: Wikimedia Commons – {clean(ph["title"])}"']
                elif len(money) >= 2:                    # two or more dollar amounts: a bar chart builds up
                    el = [f'title:"{clean(title)}"', f"{pick.pose(s)}@0.16,0.62:0.5~none",
                          "bars:" + ",".join(f'"{clean(a)}"={v:.0f}' for a, v in money[:4])]
                else:
                    el = [f'title:"{clean(title)}"'] + sentence_elements(s, last_person, pick, names, line_items, lay)
            lines.append(f"{words} || " + "; ".join(el))
            spoken += len(s.split())
    lines += ["", "|| endscreen; hold:10"]
    out = os.path.join(vdir, "01_script")
    os.makedirs(out, exist_ok=True)
    open(os.path.join(out, "beats.txt"), "w", encoding="utf-8").write("\n".join(lines) + "\n")
    nb = sum(1 for l in lines if "||" in l)
    print(f"{nb} beats -> {out}/beats.txt ({missing} screenshots missing)")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
