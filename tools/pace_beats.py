"""Owner rule (24 Oct 2026): no scene stands still for more than about 2 seconds.

Usage: python3 tools/pace_beats.py videos/<slug>      (after make_video.py <slug> --voice-only made timings.json)
Finds every stretch longer than GAP seconds where nothing new enters the screen, and adds a keyword note
(the word being spoken at that moment) there with a +delay. Rewrites 01_script/beats.txt in place; run again
after editing beats (it first removes the notes it added before: note:"..."@x,y~pop+N.NN).
"""
import json, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import make_video as mv

GAP = 2.2
SLOTS = ["0.5,0.92", "0.66,0.12"]
STOP = set("that this with from they them their there these those what when where which while would could should "
           "about because every after before again still just only really other being been have were your into "
           "than then also some more most much many very like does didn't doesn't don't it's that's here's "
           "people thing things something nobody everyone everybody".split())


def keyword(words, frac, used):
    ws = re.findall(r"[A-Za-z0-9$%.,'-]+", words)
    if not ws:
        return ""
    at = min(len(ws) - 1, int(frac * len(ws)))
    order = sorted(range(len(ws)), key=lambda k: abs(k - at))
    for k in order:
        w = ws[k].strip(".,'").replace("'s", "")
        if (len(w) >= 5 or re.search(r"\d", w)) and w.lower() not in STOP and w.upper() not in used:
            return w.upper()[:14]
    return ""


def main(vdir):
    bp = os.path.join(vdir, "01_script", "beats.txt")
    tj = os.path.join(vdir, "03_voice", "timings.json")
    raw = [re.sub(r';\s*note:"[^"]*"@[\d.,]+~pop\+[\d.]+(?=;|$)', "", l.rstrip("\n")) for l in open(bp, encoding="utf-8")]
    open(bp, "w", encoding="utf-8").write("\n".join(raw) + "\n")
    beats, tm = mv.parse_beats(bp), json.load(open(tj))
    mv.link_elements(beats, tm)
    idx = [k for k, l in enumerate(raw) if l.strip() and not l.startswith("#")]
    added, last = 0, 0.0
    for i, b in enumerate(beats):
        s, e = tm[i]["start"], tm[i]["end"]
        ts = [x["t0"] for x in b["elems"] if "t0" in x and s - 0.01 <= x["t0"] <= e]
        ts += [m["t0"] for x in b["elems"] if x["kind"] == "doc" for m in x["marks"] if s - 0.01 <= m.get("t0", -1) <= e]
        ts = sorted(set([t for t in ts]))
        if not b["words"]:
            last = max([last] + ts)
            continue
        busy = {x.get("pos") for x in b["elems"] if x["kind"] == "note"}
        slots = [p for p in SLOTS if p not in busy]
        used = {x.get("text", "").upper() for x in b["elems"]}
        new, t = [], last
        for nxt in ts + [e]:
            while nxt - t > GAP and slots:
                at = max(s + 0.3, t + 1.8)
                if at > e - 0.4:
                    break
                w = keyword(b["words"], (at - s) / max(0.1, e - s), used)
                if not w:
                    break
                used.add(w)
                new.append(f'note:"{w}"@{slots.pop(0)}~pop+{at - s:.2f}')
                t = at
            t = max(t, nxt)
        last = t if t <= e else e
        if new:
            raw[idx[i]] += "; " + "; ".join(new)
            added += len(new)
    open(bp, "w", encoding="utf-8").write("\n".join(raw) + "\n")
    os.utime(tj)                                   # same words and beats: keep the voice timings
    print(f"pace: {added} keyword notes added")


if __name__ == "__main__":
    main(os.path.abspath(sys.argv[1]))
