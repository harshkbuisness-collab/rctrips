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
            e = e.replace("~none", "").replace("~l", "~R").replace("~r", "~l").replace("~R", "~r")
            out.append(e)
        return out
    if v == 2:
        props = [e for e in el if "@" in e and not e.startswith("note") and not PEOPLE.match(e.split("@")[0])]
        if props:
            code = props[0].split("@")[0]
            word = re.search(r':"[^"]*"', props[0].split("@")[1])
            return [f"{code}@0.5,0.6:0.76" + (word.group(0) if word else "")]
    return el


def sentence_elements(s, j, person, spare):
    """What this one sentence shows: a person, its key number on a sign, and the things it names."""
    props = [c[:3] for c in sv.sentence_props(s)]
    if not props:                                   # nothing named: fall back to the script's VISUAL note
        props = spare[j % len(spare):][:2] if spare else []
    who = person or sv.narrator_for(s, j)[:3]
    out = [f"{who}@{PEOPLE_SLOTS[0]}"]
    sign = sv.number_sign(s)
    slots = iter(PROP_SLOTS)
    if sign:
        out.append(f'H18@{next(slots)}:0.34:"{clean(sign)[:18]}"~pop')
    for c in props[:3 if not sign else 2]:
        out.append(f"{c}@{next(slots)}:0.32")
    return out


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
        chars = [c for c in para if PEOPLE.match(c) and not re.match(r"^(A\d\d|H0\d)$", c)]
        if chars:
            last_person = chars[0]                 # the story's person (not the narrator) stays on screen
        spare = [c for c in para if not PEOPLE.match(c)]
        narr = sv.narrator_for(ln["text"], i)[:3]          # one narrator pose per spoken line, not per sentence
        tag = f"[{ln['tag']}] " if ln["tag"] else ""
        for j, s in enumerate(sents):
            words = (tag if j == 0 else "") + s
            if j < len(docs):
                el = [f'title:"{clean(title)}"', docs[j]]
            else:
                el = scene(sentence_elements(s, j, last_person or narr, spare), (spoken // SCENE_WORDS) % 3)
                el = [f'title:"{clean(title)}"'] + el
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
