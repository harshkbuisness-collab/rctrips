"""FreeStack AI video builder: voiceover + scenes.json -> finished vertical video.

Usage (from the repo root):
  python3 -I $SKILL_DIR/engine/build.py transcribe projects/<slug>
  python3 -I $SKILL_DIR/engine/build.py build projects/<slug>
  python3 -I $SKILL_DIR/engine/build.py stills projects/<slug> 1.5,9,20
  python3 -I $SKILL_DIR/engine/build.py qa projects/<slug>

A project folder holds the voiceover audio and scenes.json (see SKILL.md for the format).
Everything generated goes to <project>/build/ and the final video to <project>/output/.
"""
import difflib
import json
import os
import re
import shutil
import subprocess
import sys

import numpy as np
import soundfile as sf

ENGINE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(ENGINE)                      # the skill folder
MASCOT = os.path.join(ROOT, "mascot")
BRAND = os.path.join(ROOT, "brand")
SR = 44100


def run(cmd, **kw):
    print("+", " ".join(str(c) for c in cmd)[:200], flush=True)
    subprocess.run(cmd, check=True, **kw)


def node_env():
    env = dict(os.environ)
    if not env.get("NODE_PATH"):
        env["NODE_PATH"] = subprocess.run(["npm", "root", "-g"], capture_output=True, text=True).stdout.strip()
    return env


NUMS = {"zero": "0", "one": "1", "two": "2", "three": "3", "four": "4", "five": "5", "six": "6", "seven": "7",
        "eight": "8", "nine": "9", "ten": "10", "ek": "1", "do": "2", "teen": "3", "char": "4", "paanch": "5"}


def norm(w):
    w = re.sub(r"[^a-z0-9#]", "", w.lower().replace("+", ""))
    return NUMS.get(w, w)


def load(project):
    cfg = json.load(open(os.path.join(project, "scenes.json")))
    build = os.path.join(project, "build")
    os.makedirs(build, exist_ok=True)
    return cfg, build


# ---------------------------------------------------------------- transcribe
def transcribe(project):
    cfg, build = load(project) if os.path.exists(os.path.join(project, "scenes.json")) else ({}, os.path.join(project, "build"))
    os.makedirs(build, exist_ok=True)
    audio = cfg.get("audio") or next(f for f in sorted(os.listdir(project)) if f.lower().endswith((".wav", ".mp3", ".m4a")))
    raw = os.path.join(build, "vo16.raw")
    run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-i", os.path.join(project, audio), "-ac", "1", "-ar", "16000", "-f", "f32le", raw])
    from faster_whisper import WhisperModel
    model = WhisperModel(cfg.get("whisper_model", "small"), device="cpu", compute_type="int8")
    a = np.fromfile(raw, dtype=np.float32)
    hint = cfg.get("whisper_hint")
    want = len(hint.split()) if hint else 0
    dur = len(a) / 16000
    # Whisper sometimes hallucinates or drops a stretch of audio when given a long prompt.
    # Try a few settings and keep the first transcript that covers the audio with the expected word count.
    tries = [dict(initial_prompt=hint), dict(initial_prompt=hint, condition_on_previous_text=False),
             dict(initial_prompt=hint, condition_on_previous_text=False, vad_filter=True),
             dict(initial_prompt=" ".join(hint.split()[:40]) if hint else None, condition_on_previous_text=False)]
    best = None
    for k, kw in enumerate(tries):
        segs, _ = model.transcribe(a, language=cfg.get("language", "en"), word_timestamps=True, **kw)
        words = [{"w": w.word.strip(), "t0": round(w.start, 3), "t1": round(w.end, 3)} for s in segs for w in s.words]
        times = [w["t0"] for w in words]
        ok = (words and (not want or len(words) >= 0.85 * want) and words[0]["t0"] < 2.0 and words[-1]["t1"] > dur - 3
              and times == sorted(times))
        if best is None or len(words) > len(best):
            best = words
        if ok:
            best = words
            break
        print(f"  transcript attempt {k + 1} looks wrong ({len(words)} words, want ~{want}); retrying")
    words = best
    json.dump(words, open(os.path.join(build, "words.json"), "w"), indent=0)
    print(f"\n{len(words)} words, {len(a) / 16000:.1f}s\n")
    line = []
    for w in words:
        line.append(f"{w['w']}@{w['t0']}")
        if re.search(r"[.?!]$", w["w"]):
            print(" ".join(line)); line = []
    if line:
        print(" ".join(line))
    return words


# ---------------------------------------------------------------- plan
def make_plan(cfg, build, shots, frames):
    ww = json.load(open(os.path.join(build, "words.json")))
    keys = [norm(w["w"]) for w in ww]
    scenes, idx = cfg["scenes"], []
    pos = 0
    for sc in scenes:
        toks = [norm(t) for t in sc["start"].split()]
        hit = next((i for i in range(pos, len(ww) - len(toks) + 1)
                    if all(keys[i + j].startswith(toks[j]) for j in range(len(toks)))), None)
        if hit is None:
            near = " ".join(w["w"] for w in ww[pos:pos + 25])
            sys.exit(f"Scene start phrase not found: '{sc['start']}'. Words after the previous scene: {near}")
        idx.append(hit)
        pos = hit + 1
    idx[0] = 0
    end = ww[-1]["t1"] + cfg.get("tail", 1.3)
    words = []
    for s, sc in enumerate(scenes):
        a, b = idx[s], (idx[s + 1] if s + 1 < len(idx) else len(ww))
        seg = ww[a:b]
        sc["start"] = 0.0 if s == 0 else seg[0]["t0"]
        sc["dur"] = round((ww[idx[s + 1]]["t0"] if s + 1 < len(idx) else end) - sc["start"], 3)
        if not seg:
            continue
        disp = sc.get("text", "").split() or [w["w"] for w in seg]
        sm = difflib.SequenceMatcher(a=[norm(x) for x in disp], b=[norm(x["w"]) for x in seg], autojunk=False)
        times = [None] * len(disp)
        for blk in sm.get_matching_blocks():
            for k in range(blk.size):
                times[blk.a + k] = (seg[blk.b + k]["t0"], seg[blk.b + k]["t1"])
        lo = seg[0]["t0"]
        for i in range(len(disp)):          # spread unmatched words evenly between matched neighbours
            if times[i] is None:
                prev = next((times[j][1] for j in range(i - 1, -1, -1) if times[j]), lo)
                nj = next((j for j in range(i + 1, len(disp)) if times[j]), None)
                nxt = times[nj][0] if nj is not None else seg[-1]["t1"]
                gap = (nj if nj is not None else len(disp)) - i
                step = max(0.05, (nxt - prev) / (gap + 0))
                times[i] = (prev, prev + step)
        for w, (t0, t1) in zip(disp, times):
            words.append({"w": w, "t0": round(t0, 3), "t1": round(t1, 3), "line": s})
    plan = {"total": round(end, 3), "scenes": scenes, "words": words, "shots": shots, "frames": frames,
            "no_captions": cfg.get("no_captions", False), "series": cfg.get("series"),
            "theme": cfg.get("theme", "wall")}
    json.dump(plan, open(os.path.join(build, "plan.json"), "w"), indent=1)
    for sc in scenes:
        print(f"  {sc['type']:6s} {sc['start']:6.2f}s  +{sc['dur']:.2f}s  {sc.get('free') or sc.get('title') or sc.get('keyword') or ''}")
    print(f"  total {end:.2f}s")
    return plan


# ---------------------------------------------------------------- assets
def prepare_assets(cfg, build):
    shutil.copy(os.path.join(ENGINE, "template.html"), os.path.join(build, "index.html"))
    shutil.copy(os.path.join(BRAND, "icon.png"), os.path.join(build, "icon.png"))
    for f in os.listdir(cfg["_project"]):          # images referenced by scenes (e.g. upscale demo)
        if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
            shutil.copy(os.path.join(cfg["_project"], f), os.path.join(build, f))
    clips = {"c9-cta-room", "c10-bye"}
    for sc in cfg["scenes"]:
        for k in ("mascot",):
            if sc.get(k):
                clips.add(sc[k])
        if sc.get("reveal"):
            clips.add(sc["reveal"].get("mascot", "c3-shocked"))
        if sc.get("style") == "polaroid":
            clips.add((sc.get("polaroid") or {}).get("clip", "c1-talk"))
            os.makedirs(os.path.join(build, "poses"), exist_ok=True)
            for f in os.listdir(os.path.join(MASCOT, "poses")):
                shutil.copy(os.path.join(MASCOT, "poses", f), os.path.join(build, "poses", f))
        if sc["type"] == "talk" and not sc.get("mascot"):
            clips.add("c1-talk")
    frames = {}
    for c in sorted(clips):
        out = os.path.join(build, "frames", c)
        if not (os.path.isdir(out) and os.listdir(out)):
            os.makedirs(out, exist_ok=True)
            if c.startswith("c9"):
                run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-i", os.path.join(MASCOT, "clips", c + ".mp4"),
                     "-vf", "fps=24,scale=1080:1920", "-q:v", "3", os.path.join(out, "%04d.jpg")])
            else:
                src = os.path.join(MASCOT, "clips", c + ".webm")
                if not os.path.exists(src):
                    sys.exit(f"Unknown mascot clip '{c}'. Available: " + ", ".join(sorted(f[:-5] for f in os.listdir(os.path.join(MASCOT, 'clips')))))
                run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-c:v", "libvpx-vp9", "-i", src,
                     "-vf", "fps=24", os.path.join(out, "%04d.png")])
        frames[c] = len(os.listdir(out))
    repos = [sc["repo"] for sc in cfg["scenes"] if sc.get("repo")]
    shots = {}
    if repos:
        sj = os.path.join(build, "shots", "shots.json")
        have = json.load(open(sj)) if os.path.exists(sj) else {}
        todo = [r for r in repos if r not in have]
        if todo:
            run(["node", os.path.join(ENGINE, "capture.js"), os.path.join(build, "shots")] + todo, env=node_env())
            have.update(json.load(open(sj)))
            json.dump(have, open(sj, "w"), indent=2)
        for r in repos:
            if have.get(r, {}).get("box"):
                shots[r] = have[r]
            else:
                print(f"  WARNING: no star count found for {r}; its GitHub card is skipped")
    return shots, frames


# ---------------------------------------------------------------- sound
def sfx(plan, build):
    rng = np.random.default_rng(3)
    total = plan["total"]
    buf = np.zeros(int((total + 1) * SR))

    def ta(x): return np.arange(int(x * SR)) / SR
    def env(x, a, r): t = ta(x); return np.minimum(1, t / a) * np.exp(-t / r)
    def place(sig, at, g):
        i = int(max(0, at) * SR); j = min(len(buf), i + len(sig)); buf[i:j] += sig[: j - i] * g
    def whoosh(x=0.3):
        n = rng.normal(0, 1, int(x * SR)); t = ta(x); lo = np.convolve(n, np.ones(30) / 30, "same")
        return (lo * (1 - t / x) + (n - lo) * (t / x) * 0.6) * np.sin(np.pi * t / x) ** 2
    def pop(f=900, x=0.09):
        t = ta(x); return np.sin(2 * np.pi * np.cumsum(f * (1 + 1.5 * np.exp(-t / 0.01))) / SR) * env(x, 0.001, 0.025)
    def hit():
        t = ta(0.5); return np.sin(2 * np.pi * np.cumsum(45 + 120 * np.exp(-t / 0.04)) / SR) * env(0.5, 0.001, 0.18) + rng.normal(0, 1, len(t)) * env(0.5, 0.001, 0.04) * 0.5
    def ding(f=1568, x=0.6):
        t = ta(x); return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.01 * t)) * env(x, 0.002, 0.18)
    def wt(line, phrase):
        toks = [norm(t) for t in phrase.split()]
        ws = [w for w in plan["words"] if w["line"] == line]
        for i in range(len(ws) - len(toks) + 1):
            if all(norm(ws[i + j]["w"]).startswith(toks[j]) for j in range(len(toks))):
                return ws[i]["t0"]
        return None

    for i, sc in enumerate(plan["scenes"]):
        a, d = sc["start"], sc["dur"]
        if i:
            place(whoosh(), a - 0.28, 0.45)
        if sc["type"] == "hook":
            for k in range(min(4, len(sc.get("notifications", [])))):
                place(ding(1760, 0.35) * 0.7 + ding(2637, 0.35) * 0.5, a + 0.15 + k * 0.45, 0.45)
            if sc.get("impact") and wt(i, sc["impact"]["at"]) is not None:
                place(hit(), wt(i, sc["impact"]["at"]), 1.0)
            ts = wt(i, "subscription band") if plan.get("series") else None
            if ts is not None:                       # series ident: whoosh, stamp hit, day ding
                tb_, td_ = wt(i, "band"), wt(i, "day")
                place(whoosh(0.35), ts - 0.25, 0.6)
                place(hit(), tb_ if tb_ is not None else ts + 0.45, 0.9)
                td_ = td_ if td_ is not None else ts + 0.9
                for k in range(4):
                    place(pop(900 + k * 150, 0.05), td_ + k * 0.06, 0.25)
                place(ding(1760, 0.5), td_ + 0.28, 0.45)
            if sc.get("reveal") and wt(i, sc["reveal"]["at"]) is not None:
                place(pop(1000, 0.12), wt(i, sc["reveal"]["at"]) + 0.2, 0.5)
        elif sc["type"] == "tool":
            have = {"intro": bool(sc.get("mascot")), "vs": bool(sc.get("paid")),
                    "demo": bool(sc.get("demo")) and sc["demo"].get("kind") != "none", "card": sc.get("repo") in plan["shots"]}
            flow = [k for k in sc.get("flow", ["intro", "vs", "demo", "card"]) if have[k]]
            rest = max(0.5, d - 1.5 * sum(k in ("intro", "vs") for k in flow))
            both = "demo" in flow and "card" in flow
            ln = {"intro": 1.5, "vs": 1.5, "card": max(1.9, rest * 0.52) if both else rest}
            ln["demo"] = rest - ln["card"] if both else rest
            place(pop(700, 0.12), a + 0.05, 0.35)
            x = 0
            for j, k in enumerate(flow):
                if j:
                    place(whoosh(), a + x - 0.15, 0.4)
                if k == "vs":
                    place(pop(520, 0.12), a + x + 0.3, 0.25); place(whoosh(0.25) * 0.8, a + x + 0.55, 0.45)
                if k == "card":
                    place(ding(), a + x + 0.65, 0.35); place(pop(1100), a + x + 0.82, 0.4)
                x += ln[k]
        elif sc["type"] == "talk":
            place(pop(800, 0.12), a + 0.05, 0.4)
        elif sc["type"] == "cta":
            t = wt(i, sc.get("banner_at", "follow"))
            place(pop(600, 0.14), t if t is not None else a + 0.6, 0.5)
        elif sc["type"] == "outro":
            place(ding(1320, 0.8), a + 0.2, 0.4)
    buf = buf[: int(total * SR)]
    buf /= np.max(np.abs(buf)) + 1e-9
    sf.write(os.path.join(build, "sfx.wav"), buf * 0.9, SR)


def mix(cfg, plan, build):
    project, total = cfg["_project"], plan["total"]
    vo = os.path.join(build, "vo_proc.wav")
    run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-i", os.path.join(project, cfg["audio"]),
         "-af", f"aresample={SR},highpass=f=80,acompressor=threshold=-18dB:ratio=3:attack=5:release=80,apad,atrim=0:{total}",
         "-ac", "2", vo])
    inputs, filt, n = ["-i", vo, "-i", os.path.join(build, "sfx.wav")], "[1:a]aformat=channel_layouts=stereo,volume=0.35[fx];", 2
    labels = "[0:a][fx]"
    m = cfg.get("music")
    if m and m.get("file"):
        mf = m["file"] if os.path.isabs(m["file"]) else os.path.join(project, m["file"])
        seg = os.path.join(build, "music_seg.wav")
        run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-ss", str(m.get("start", 0)), "-t", str(total), "-i", mf, "-ac", "2", "-ar", str(SR), seg])
        v, _ = sf.read(vo); s_, _ = sf.read(seg)
        mono = v.mean(axis=1)
        fr = int(0.05 * SR)
        rms = np.array([np.sqrt(np.mean(mono[i:i + fr] ** 2)) for i in range(0, len(mono) - fr, fr)])
        vo_db = 20 * np.log10(np.sqrt(np.mean(rms[rms > np.percentile(rms, 40)] ** 2)) + 1e-9)
        s_db = 20 * np.log10(np.sqrt(np.mean(s_.mean(axis=1) ** 2)) + 1e-9)
        gain = 10 ** ((vo_db - m.get("db_below_voice", 8) - s_db) / 20)
        print(f"  music gain {gain:.3f} ({m.get('db_below_voice', 8)} dB under the voice)")
        inputs += ["-i", seg]
        filt += f"[2:a]volume={gain:.4f},afade=t=out:st={max(0, total - 1.2):.2f}:d=1.2[mus];"
        labels += "[mus]"; n = 3
    filt += f"{labels}amix=inputs={n}:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[out]"
    run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error"] + inputs + ["-filter_complex", filt, "-map", "[out]", "-ar", str(SR), os.path.join(build, "mix.wav")])


# ---------------------------------------------------------------- commands
def build_all(project):
    cfg, build = load(project)
    cfg["_project"] = project
    if not os.path.exists(os.path.join(build, "words.json")):
        transcribe(project)
    shots, frames = prepare_assets(cfg, build)
    plan = make_plan(cfg, build, shots, frames)
    sfx(plan, build)
    mix(cfg, plan, build)
    run(["node", os.path.join(ENGINE, "render.js"), os.path.abspath(build), "full", "30"], env=node_env())
    out_dir = os.path.join(project, "output")
    os.makedirs(out_dir, exist_ok=True)
    out = os.path.join(out_dir, os.path.basename(os.path.abspath(project)) + ".mp4")
    run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-framerate", "30", "-i", os.path.join(build, "frames_out", "f%05d.jpg"),
         "-i", os.path.join(build, "mix.wav"), "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "medium", "-crf", "18",
         "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out])
    print("\nDONE:", out)
    qa(project)


def stills(project, times):
    cfg, build = load(project)
    cfg["_project"] = project
    if not os.path.exists(os.path.join(build, "words.json")):
        transcribe(project)
    shots, frames = prepare_assets(cfg, build)
    make_plan(cfg, build, shots, frames)
    run(["node", os.path.join(ENGINE, "render.js"), os.path.abspath(build), "stills", times], env=node_env())


def qa(project):
    """Contact sheets with one frame per second, for checking overlaps before delivering."""
    out = os.path.join(project, "output", os.path.basename(os.path.abspath(project)) + ".mp4")
    qd = os.path.join(project, "build", "qa")
    shutil.rmtree(qd, ignore_errors=True); os.makedirs(qd)
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out], capture_output=True, text=True).stdout)
    n = int(dur)
    for i in range(n):
        run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-ss", f"{i + 0.5}", "-i", out, "-frames:v", "1",
             "-vf", f"scale=150:-1,drawtext=text='{i + 0.5}':x=4:y=4:fontsize=16:fontcolor=red:box=1:boxcolor=white",
             os.path.join(qd, f"c{i:03d}.png")])
    for r in range(0, n, 14):
        files = [os.path.join(qd, f"c{i:03d}.png") for i in range(r, min(n, r + 14))]
        args = sum([["-i", f] for f in files], [])
        run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error"] + args + ["-filter_complex", f"hstack={len(files)}" if len(files) > 1 else "null",
             os.path.join(qd, f"sheet{r // 14}.png")])
    print("QA sheets:", sorted(f for f in os.listdir(qd) if f.startswith("sheet")))


if __name__ == "__main__":
    cmd, project = sys.argv[1], sys.argv[2].rstrip("/")
    {"transcribe": lambda: transcribe(project), "build": lambda: build_all(project),
     "stills": lambda: stills(project, sys.argv[3]), "qa": lambda: qa(project)}[cmd]()
