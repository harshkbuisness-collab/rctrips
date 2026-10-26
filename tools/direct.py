"""Hand direction for a video: replaces the automatic scene of chosen beats with scenes written by hand.

File: videos/<slug>/01_script/direction.txt, one line per beat:
    12: A16@0.8,0.6:0.56; "SPARK"@0.4,0.45:150:red~pop
    13: + bubble:"oops"@0.6,0.2      '+' keeps the previous beat's scene and adds to it (a build-up)
    14: =                            same scene as the beat before (the narrator may change with '+ A08@...')
    15: AUTO                         keep the automatic scene; AUTODOC = only its screenshot (and narrator)
Beat numbers count the '||' lines of beats.txt (1 = first). Lines starting with # are notes.
Own pictures: M03|D16@x,y:h~pop uses library/custom/<day>/M03.png when it exists, else library image D16.
The automatic beats are kept in beats_auto.txt. script_to_beats.py calls this at the end, so batch.py uses it too.
"""
import os, re, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NARR = re.compile(r"^(A\d\d|H0[1-8])@")


def resolve(el, own):
    m = re.match(r"^([MS]\d\d)\|(\w+)(@.*)$", el)
    if not m:
        return el
    return ("X" + m.group(1) if m.group(1) in own else m.group(2)) + m.group(3)


def apply(vdir, day):
    d = os.path.join(vdir, "01_script")
    plan = os.path.join(d, "direction.txt")
    if not os.path.exists(plan):
        return
    src = os.path.join(ROOT, "library", "custom", f"day{int(day):02d}")
    dst = os.path.join(vdir, "02_assets", "custom")
    os.makedirs(dst, exist_ok=True)
    own = set()
    for f in os.listdir(src) if os.path.isdir(src) else []:
        shutil.copy(os.path.join(src, f), os.path.join(dst, f))
        own.add(f.rsplit(".", 1)[0])
    beats = os.path.join(d, "beats.txt")
    shutil.copy(beats, os.path.join(d, "beats_auto.txt"))
    lines = open(beats, encoding="utf-8").read().split("\n")
    rows = [i for i, l in enumerate(lines) if "||" in l]
    want = {}
    for l in open(plan, encoding="utf-8"):
        m = re.match(r"^\s*(\d+)\s*:\s*(.*?)\s*$", l)
        if m and not l.lstrip().startswith("#"):
            want[int(m.group(1))] = m.group(2)
    prev, done = [], 0
    for n, i in enumerate(rows, 1):
        words, auto = lines[i].split("||", 1)
        auto_el = [e.strip() for e in auto.split(";") if e.strip()]
        keep = [e for e in auto_el if e in ("sting", "endscreen") or e.startswith("hold:")]
        if n not in want:
            prev = [e for e in auto_el if not e.startswith("title:")]
            continue
        w = want[n]
        if w == "AUTO":
            el = [e for e in auto_el if not e.startswith("title:")]
        elif w == "AUTODOC":
            el = [e for e in auto_el if e.startswith("doc:") or NARR.match(e)]
        elif w == "=":
            el = list(prev)
        else:
            add = w.startswith("+")
            new = [resolve(e.strip(), own) for e in w.lstrip("+").split(";") if e.strip()]
            if add:
                el = list(prev)
                if any(NARR.match(e) for e in new):          # a new narrator pose replaces the old one
                    el = [e for e in el if not NARR.match(e)]
                el += new
            else:
                el = new
        el = [e for e in el if e not in ("sting",) and not e.startswith("hold:")] + keep
        lines[i] = words + "|| " + "; ".join(el)
        prev = [e for e in el if e not in keep]
        done += 1
    open(beats, "w", encoding="utf-8").write("\n".join(lines))
    print(f"direction: {done} beats directed by hand ({len(own)} own pictures)")


if __name__ == "__main__":
    apply(sys.argv[1], sys.argv[2])
