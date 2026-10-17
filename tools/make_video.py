"""Builds a doodle-explainer video from a beat sheet and the image library.

Usage:
  python3 tools/make_video.py videos/<slug>            # Kokoro voice is generated from the beat sheet
  python3 tools/make_video.py videos/<slug> --voice-only

Inputs:  <slug>/01_script/beats.txt, library/assets/*.jpg, library/fonts/*.ttf
Outputs: <slug>/03_voice/voiceover.wav + timings.json, <slug>/05_export/<slug-name>.mp4
"""
import json, os, re, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = os.path.join(ROOT, "library", "assets")
FONT_BIG = os.path.join(ROOT, "library", "fonts", "PermanentMarker.ttf")
FONT_HAND = os.path.join(ROOT, "library", "fonts", "PatrickHand.ttf")
W, H, FPS, SR = 1920, 1080, 24, 24000
ORANGE, BLACK, GREY = (255, 122, 0), (20, 20, 20), (120, 120, 120)
COLORS = {"orange": ORANGE, "black": BLACK, "grey": GREY}
POS = {"center": (0.5, 0.52), "left": (0.3, 0.52), "right": (0.7, 0.52), "top": (0.5, 0.16),
       "bottom": (0.5, 0.88), "low": (0.5, 0.78), "rlow": (0.7, 0.72), "tl": (0.18, 0.22), "tr": (0.82, 0.22), "bl": (0.18, 0.78), "br": (0.85, 0.75)}
VOICE, SPEED = "bm_lewis", 1.1
TTS_MODEL = os.environ.get("KOKORO_DIR", "")


# ---------- beat sheet ----------
def parse_beats(path):
    beats = []
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        words, vis = [s.strip() for s in line.split("||")]
        elems = []
        for item in [v.strip() for v in vis.split(";") if v.strip()]:
            delay = 0.0
            m = re.search(r"\+([\d.]+)$", item)
            if m:
                delay, item = float(m.group(1)), item[:m.start()]
            if item.startswith('"'):
                text, rest = re.match(r'"(.*)"@(.*)', item).groups()
                parts = rest.split(":")
                elems.append({"kind": "text", "text": text, "pos": parts[0], "size": int(parts[1]),
                              "color": parts[2] if len(parts) > 2 else "black", "delay": delay})
            elif item.startswith("chart@"):
                a, b = item[6:].split("-")
                elems.append({"kind": "chart", "a": float(a), "b": float(b), "delay": delay})
            else:
                code, rest = item.split("@")
                parts = rest.split(":")
                elems.append({"kind": "img", "code": code, "pos": parts[0],
                              "h": float(parts[1]) if len(parts) > 1 else 0.7, "delay": delay})
        beats.append({"words": words, "elems": elems})
    return beats


# ---------- voice ----------
def trim(a, thr=0.008, pad=0.03):
    idx = np.where(np.abs(a) > thr)[0]
    if not len(idx):
        return a
    p = int(pad * SR)
    return a[max(0, idx[0] - p): idx[-1] + p]


def make_voice(beats, out_wav, out_json):
    from kokoro_onnx import Kokoro
    k = Kokoro(os.path.join(TTS_MODEL, "kokoro-v1.0.onnx"), os.path.join(TTS_MODEL, "voices-v1.0.bin"))
    audio, t, timings, group = [], 0.25, [], []
    audio.append(np.zeros(int(0.25 * SR), dtype=np.float32))
    for i, b in enumerate(beats):
        group.append(i)
        if not re.search(r"(\.|\?|!)$", b["words"]):
            continue
        text = " ".join(beats[j]["words"] for j in group)
        a, sr = k.create(text, voice=VOICE, speed=SPEED, lang="en-us")
        assert sr == SR
        a = trim(a.astype(np.float32))
        dur = len(a) / SR
        # split the sentence time between its beats by character count (approximate word timing)
        lens = [len(beats[j]["words"]) for j in group]
        acc = t
        for j, n in zip(group, lens):
            d = dur * n / sum(lens)
            timings.append({"beat": j, "start": round(acc, 3), "end": round(acc + d, 3)})
            acc += d
        gap = 0.45 if text.endswith("...") or text.endswith("?") else 0.3
        audio += [a, np.zeros(int(gap * SR), dtype=np.float32)]
        t += dur + gap
        group = []
    full = np.concatenate(audio)
    import soundfile as sf
    sf.write(out_wav, full, SR)
    json.dump(timings, open(out_json, "w"), indent=1)
    return timings, full


# ---------- visuals ----------
_cache = {}
def load_img(code, h_frac):
    key = (code, h_frac)
    if key not in _cache:
        path = next(os.path.join(LIB, f) for f in sorted(os.listdir(LIB)) if f.startswith(code + "_"))
        im = Image.open(path).convert("RGB")
        bbox = ImageOps.invert(im.convert("L")).point(lambda v: 255 if v > 18 else 0).getbbox()
        im = im.crop(bbox) if bbox else im
        target_h = int(H * h_frac)
        scale = min(target_h / im.height, (W * 0.42) / im.width)
        _cache[key] = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.LANCZOS)
    return _cache[key]


def pop_scale(t):
    """Pop-in: grow from 60% to 108% in 0.12 s, settle to 100% by 0.22 s."""
    if t < 0:
        return 0
    if t < 0.12:
        return 0.6 + 0.48 * (t / 0.12)
    if t < 0.22:
        return 1.08 - 0.08 * ((t - 0.12) / 0.1)
    return 1.0


def paste_center(canvas, im, cx, cy, s):
    if s <= 0:
        return
    if s != 1.0:
        im = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.BILINEAR)
    canvas.paste(im, (int(cx - im.width / 2), int(cy - im.height / 2)))


def draw_text(canvas, e, s):
    if s <= 0:
        return
    font = ImageFont.truetype(FONT_BIG if e["size"] >= 90 else FONT_HAND, max(8, int(e["size"] * s)))
    d = ImageDraw.Draw(canvas)
    x, y = POS[e["pos"]]
    d.text((x * W, y * H), e["text"], font=font, fill=COLORS[e["color"]], anchor="mm")


def draw_chart(canvas, year):
    d = ImageDraw.Draw(canvas)
    f_title = ImageFont.truetype(FONT_HAND, 64)
    f_lab = ImageFont.truetype(FONT_HAND, 44)
    f_big = ImageFont.truetype(FONT_BIG, 64)
    x0, x1, y0, y1 = 260, 1640, 220, 920          # plot area
    X = lambda yr: x0 + (x1 - x0) * yr / 24
    Y = lambda v: y1 - (y1 - y0) * v / 110
    d.text((W / 2, 110), "What $100 buys at 3% inflation", font=f_title, fill=BLACK, anchor="mm")
    d.line([(x0, y0 - 20), (x0, y1), (x1 + 40, y1)], fill=BLACK, width=6)
    for yr in (0, 5, 10, 15, 20, 24):
        d.text((X(yr), y1 + 45), str(yr), font=f_lab, fill=BLACK, anchor="mm")
    d.text(((x0 + x1) / 2, y1 + 105), "years", font=f_lab, fill=GREY, anchor="mm")
    v = lambda yr: 100 / 1.03 ** yr
    pts = [(X(i / 10), Y(v(i / 10))) for i in range(0, int(year * 10) + 1)]
    if len(pts) > 1:
        d.line(pts, fill=ORANGE, width=12, joint="curve")
    d.text((X(0) + 20, Y(100) - 50), "$100", font=f_big, fill=BLACK, anchor="lm")
    for yr, lab in ((10, "$74"), (24, "$49")):
        if year >= yr:
            cx, cy = X(yr), Y(v(yr))
            d.ellipse([cx - 34, cy - 34, cx + 34, cy + 34], outline=ORANGE, width=7)
            d.text((cx, cy - 85), lab, font=f_big, fill=ORANGE, anchor="mm")


def render(beats, timings, audio, out_mp4, workdir):
    tm = {t["beat"]: t for t in timings}
    total = len(audio) / SR + 0.6
    n_frames = int(total * FPS)
    # an element identical to the previous beat's stays on screen without popping again
    starts = []
    for i, b in enumerate(beats):
        prev = beats[i - 1]["elems"] if i else []
        for e in b["elems"]:
            e["persist"] = any({**p, "delay": 0, "persist": None} == {**e, "delay": 0, "persist": None} for p in prev)
            if not e["persist"] and e["kind"] != "chart":
                starts.append(tm[i]["start"] + e["delay"])
    # pop sound effect at each new element
    sfx_len = int(0.07 * SR)
    tt = np.arange(sfx_len) / SR
    pop = (np.sin(2 * np.pi * (700 - 3000 * tt) * tt) * np.exp(-tt * 55) * 0.18).astype(np.float32)
    mix = np.concatenate([audio, np.zeros(int(0.6 * SR), dtype=np.float32)])
    for s in starts:
        i = int(s * SR)
        mix[i:i + sfx_len] += pop[: len(mix[i:i + sfx_len])]
    import soundfile as sf
    mix_path = os.path.join(workdir, "mix.wav")
    sf.write(mix_path, mix, SR)
    comp = "acompressor=threshold=-22dB:ratio=4:attack=3:release=80"  # evens out TTS peaks
    meas = subprocess.run(["ffmpeg", "-nostdin", "-i", mix_path, "-af", comp + ",loudnorm=I=-14:TP=-1.5:LRA=7:print_format=json",
                           "-f", "null", "-"], capture_output=True, text=True).stderr
    m = json.loads(meas[meas.rindex("{"):meas.rindex("}") + 1])
    # raise to -14 LUFS (YouTube's level) with a peak limiter so loud syllables don't clip
    loud = comp + f",volume={-14 - float(m['input_i']):.2f}dB,alimiter=limit=0.74:level=false"

    ff = subprocess.Popen(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
                           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", mix_path,
                           "-af", loud, "-ar", "48000",
                           "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
                           "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", out_mp4],
                          stdin=subprocess.PIPE)
    cur = 0
    for f in range(n_frames):
        t = f / FPS
        while cur + 1 < len(beats) and t >= tm[cur + 1]["start"]:
            cur += 1
        b, bt = beats[cur], tm[cur]
        canvas = Image.new("RGB", (W, H), "white")
        # images first, then chart, then text on top
        for e in sorted(b["elems"], key=lambda e: {"img": 0, "chart": 1, "text": 2}[e["kind"]]):
            age = t - bt["start"] - e["delay"]
            s = 1.0 if e.get("persist") else pop_scale(age)
            if e["kind"] == "img":
                x, y = POS[e["pos"]]
                paste_center(canvas, load_img(e["code"], e["h"]), x * W, y * H, s)
            elif e["kind"] == "text":
                draw_text(canvas, e, s)
            else:
                span = max(0.01, (bt["end"] - bt["start"]) * 0.85)
                draw_chart(canvas, e["a"] + (e["b"] - e["a"]) * min(1.0, max(0.0, t - bt["start"]) / span))
        ff.stdin.write(canvas.tobytes())
    ff.stdin.close()
    ff.wait()


def main():
    vdir = os.path.abspath(sys.argv[1])
    beats = parse_beats(os.path.join(vdir, "01_script", "beats.txt"))
    os.makedirs(os.path.join(vdir, "03_voice"), exist_ok=True)
    os.makedirs(os.path.join(vdir, "05_export"), exist_ok=True)
    wav = os.path.join(vdir, "03_voice", "voiceover.wav")
    js = os.path.join(vdir, "03_voice", "timings.json")
    timings, audio = make_voice(beats, wav, js)
    print(f"voice: {len(audio) / SR:.1f}s, {len(beats)} beats")
    if "--voice-only" in sys.argv:
        return
    out = os.path.join(vdir, "05_export", os.path.basename(vdir) + ".mp4")
    render(beats, timings, audio, out, os.path.join(vdir, "03_voice"))
    print("video:", out)


if __name__ == "__main__":
    main()
