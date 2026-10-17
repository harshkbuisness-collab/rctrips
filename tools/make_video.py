"""Builds a doodle-explainer video from a beat sheet and the image library.

Usage:
  KOKORO_DIR=<model dir> python3 tools/make_video.py videos/<slug> [--voice-only]

Inputs:  <slug>/01_script/beats.txt, library/assets/*.jpg, library/fonts/*.ttf
Outputs: <slug>/03_voice/voiceover.wav + timings.json, <slug>/05_export/<slug>.mp4

Beat sheet line:   spoken words || element; element; ...
Elements (append +SECONDS to delay, ! to pop with a sound):
  A01@pos[:height]                      library image (height = share of screen height)
  "TEXT"@pos:size[:color]               plain text (size >= 90 uses the marker font)
  bubble:"TEXT"@pos[:l|r]               speech bubble, tail to the lower left/right
  think:"TEXT"@pos                      thought bubble
  label:"TEXT"@pos>x,y                  handwritten note with an arrow pointing at x,y
  card:"TITLE"|"SUBTITLE"               black chapter card (whoosh sound)
  bars:"2020"=100,"2025"=81[:circle]    horizontal bar chart of dollar values
  headline:"TITLE"|"SOURCE"@pos[:WORD]  news-style card, WORD circled
  chart@a-b                             "$100 at 3% inflation" line chart, drawn from year a to b
pos = center|left|right|top|bottom|low|tl|tr|bl|br or x,y as screen fractions (0.3,0.5).
"""
import json, os, re, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = os.path.join(ROOT, "library", "assets")
FONT_BIG = os.path.join(ROOT, "library", "fonts", "PermanentMarker.ttf")
FONT_HAND = os.path.join(ROOT, "library", "fonts", "PatrickHand.ttf")
FONT_NEWS = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
W, H, FPS, SR = 1920, 1080, 24, 24000
ORANGE, BLACK, GREY, LIGHT = (255, 122, 0), (20, 20, 20), (120, 120, 120), (225, 225, 225)
COLORS = {"orange": ORANGE, "black": BLACK, "grey": GREY}
POS = {"center": (0.5, 0.52), "left": (0.3, 0.52), "right": (0.7, 0.52), "top": (0.5, 0.14),
       "bottom": (0.5, 0.9), "low": (0.5, 0.78), "tl": (0.18, 0.22), "tr": (0.82, 0.22),
       "bl": (0.18, 0.78), "br": (0.85, 0.75)}
VOICE, SPEED = "bm_lewis", 1.1
TTS_MODEL = os.environ.get("KOKORO_DIR", "")
_fonts = {}


def font(path, size):
    if (path, size) not in _fonts:
        _fonts[(path, size)] = ImageFont.truetype(path, size)
    return _fonts[(path, size)]


def pos(p):
    if "," in p:
        x, y = p.split(",")
        return float(x), float(y)
    return POS[p]


# ---------- beat sheet ----------
def parse_elem(item):
    e = {"delay": 0.0, "pop": False}
    if item.endswith("!"):
        e["pop"], item = True, item[:-1]
    m = re.search(r"\+([\d.]+)$", item)
    if m:
        e["delay"], item = float(m.group(1)), item[:m.start()]
    if item.startswith("card:"):
        t = re.findall(r'"([^"]*)"', item)
        return {**e, "kind": "card", "title": t[0], "sub": t[1] if len(t) > 1 else ""}
    if item.startswith("bars:"):
        body, _, opt = item[5:].partition(":")
        rows = [(k, float(v)) for k, v in re.findall(r'"([^"]+)"=([\d.]+)', body)]
        return {**e, "kind": "bars", "rows": rows, "circle": opt == "circle"}
    if item.startswith("chart@"):
        a, b = item[6:].split("-")
        return {**e, "kind": "chart", "a": float(a), "b": float(b)}
    m = re.match(r'(bubble|think|label|headline):"([^"]*)"(?:\|"([^"]*)")?@([^:>]+)(?:>([\d.]+,[\d.]+))?(?::(.*))?$', item)
    if m:
        kind, text, text2, p, target, opt = m.groups()
        return {**e, "kind": kind, "text": text, "text2": text2 or "", "pos": p, "target": target, "opt": opt or ""}
    m = re.match(r'"([^"]*)"@([^:]+):(\d+)(?::(\w+))?$', item)
    if m:
        return {**e, "kind": "text", "text": m.group(1), "pos": m.group(2), "size": int(m.group(3)),
                "color": m.group(4) or "black"}
    code, _, rest = item.partition("@")
    p, _, h = rest.partition(":")
    return {**e, "kind": "img", "code": code, "pos": p, "h": float(h) if h else 0.7}


def parse_beats(path):
    beats = []
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        words, vis = [s.strip() for s in line.split("||")]
        beats.append({"words": words, "elems": [parse_elem(v.strip()) for v in vis.split(";") if v.strip()]})
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
    import soundfile as sf
    k = Kokoro(os.path.join(TTS_MODEL, "kokoro-v1.0.onnx"), os.path.join(TTS_MODEL, "voices-v1.0.bin"))
    audio, t, timings, group = [np.zeros(int(0.25 * SR), dtype=np.float32)], 0.25, [], []
    for i, b in enumerate(beats):
        group.append(i)
        last = i == len(beats) - 1
        if not (not b["words"] or re.search(r"[.?!]$", b["words"]) or last or (i + 1 < len(beats) and not beats[i + 1]["words"])):
            continue
        spoken = [j for j in group if beats[j]["words"]]
        if spoken:
            text = " ".join(beats[j]["words"] for j in spoken)
            a, sr = k.create(text, voice=VOICE, speed=SPEED, lang="en-us")
            a = trim(a.astype(np.float32))
            dur = len(a) / SR
        else:
            a, dur, text = np.zeros(int(1.6 * SR), dtype=np.float32), 1.6, ""   # silent beat, e.g. a chapter card
        # split the sentence time between its beats by character count (approximate word timing)
        lens = [max(1, len(beats[j]["words"])) for j in group]
        acc = t
        for j, n in zip(group, lens):
            d = dur * n / sum(lens)
            timings.append({"beat": j, "start": round(acc, 3), "end": round(acc + d, 3)})
            acc += d
        gap = 0.45 if text.endswith(("...", "?")) else 0.3 if text else 0.0
        audio += [a, np.zeros(int(gap * SR), dtype=np.float32)]
        t += dur + gap
        group = []
    full = np.concatenate(audio)
    sf.write(out_wav, full, SR)
    json.dump(timings, open(out_json, "w"), indent=1)
    return timings, full


# ---------- drawing ----------
_cache = {}
def load_img(code, h_frac):
    key = (code, h_frac)
    if key not in _cache:
        path = next(os.path.join(LIB, f) for f in sorted(os.listdir(LIB)) if f.startswith(code + "_"))
        im = Image.open(path).convert("RGB")
        bbox = ImageOps.invert(im.convert("L")).point(lambda v: 255 if v > 18 else 0).getbbox()
        im = im.crop(bbox) if bbox else im
        scale = min(H * h_frac / im.height, (W * 0.42) / im.width)
        im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.LANCZOS)
        # make the white surrounding the drawing transparent, so overlapping items don't show white boxes
        rgba = im.convert("RGBA")
        mask = Image.new("L", im.size, 0)
        flood = im.copy()
        for corner in [(0, 0), (im.width - 1, 0), (0, im.height - 1), (im.width - 1, im.height - 1)]:
            ImageDraw.floodfill(flood, corner, (255, 0, 255), thresh=40)
        a = np.array(flood)
        outside = (a[..., 0] == 255) & (a[..., 1] == 0) & (a[..., 2] == 255)
        alpha = np.where(outside, 0, 255).astype(np.uint8)
        rgba.putalpha(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.8)))
        _cache[key] = rgba
    return _cache[key]


def pop_scale(t):
    """Pop-in: grow from 60% to 108% in 0.12 s, settle to 100% by 0.22 s."""
    if t < 0.12:
        return 0.6 + 0.48 * (t / 0.12)
    if t < 0.22:
        return 1.08 - 0.08 * ((t - 0.12) / 0.1)
    return 1.0


def paste_center(canvas, im, cx, cy, s):
    if s != 1.0:
        im = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.BILINEAR)
    canvas.paste(im, (int(cx - im.width / 2), int(cy - im.height / 2)), im)


def wrap(text, f, max_w):
    lines, cur = [], ""
    for w in text.split():
        trial = (cur + " " + w).strip()
        if f.getlength(trial) > max_w and cur:
            lines.append(cur)
            cur = w
        else:
            cur = trial
    return lines + [cur]


def draw_bubble(d, e, s, think=False):
    f = font(FONT_HAND, int(50 * s))
    lines = wrap(e["text"], f, 420 * s)
    lh = int(58 * s)
    tw = max(f.getlength(l) for l in lines)
    th = lh * len(lines)
    x, y = pos(e["pos"]); cx, cy = x * W, y * H
    rw, rh = tw / 2 + 60 * s, th / 2 + 45 * s
    side = -1 if e["opt"] != "r" else 1
    if think:
        for i, r in enumerate((16, 11, 7)):
            px, py = cx + side * (rw * 0.55 + i * 30 * s), cy + rh + (20 + i * 28) * s
            d.ellipse([px - r * s, py - r * s, px + r * s, py + r * s], fill="white", outline=BLACK, width=4)
    else:
        base = [(cx + side * rw * 0.25, cy + rh * 0.8), (cx + side * rw * 0.55, cy + rh * 0.6)]
        tip = (cx + side * rw * 0.75, cy + rh + 55 * s)
        d.polygon(base + [tip], fill="white", outline=BLACK, width=5)
    d.ellipse([cx - rw, cy - rh, cx + rw, cy + rh], fill="white", outline=BLACK, width=5)
    if not think:   # hide the tail's base line inside the bubble
        d.polygon([(cx + side * rw * 0.27, cy + rh * 0.78), (cx + side * rw * 0.53, cy + rh * 0.6),
                   (cx + side * rw * 0.45, cy + rh * 0.5)], fill="white")
    for i, l in enumerate(lines):
        d.text((cx, cy - th / 2 + lh * (i + 0.5)), l, font=f, fill=BLACK, anchor="mm")


def draw_label(d, e, s):
    f = font(FONT_HAND, int(58 * s))
    x, y = pos(e["pos"]); cx, cy = x * W, y * H
    d.text((cx, cy), e["text"], font=f, fill=BLACK, anchor="mm")
    if not e["target"]:
        return
    tx, ty = [float(v) for v in e["target"].split(",")]
    tx, ty = tx * W, ty * H
    tw = f.getlength(e["text"])
    dx, dy = tx - cx, ty - cy
    sx, sy = (cx + np.sign(dx) * (tw / 2 + 15), cy) if abs(dx) > abs(dy) else (cx, cy + np.sign(dy) * 35)
    ex, ey = tx - 0.12 * (tx - sx), ty - 0.12 * (ty - sy)
    d.line([(sx, sy), (ex, ey)], fill=ORANGE, width=6)
    ang = np.arctan2(ey - sy, ex - sx)
    for da in (2.6, -2.6):
        d.line([(ex, ey), (ex + 32 * np.cos(ang + da), ey + 32 * np.sin(ang + da))], fill=ORANGE, width=6)


def draw_text(d, e, s):
    f = font(FONT_BIG if e["size"] >= 90 else FONT_HAND, max(8, int(e["size"] * s)))
    x, y = pos(e["pos"])
    d.text((x * W, y * H), e["text"], font=f, fill=COLORS[e["color"]], anchor="mm")


def card_image(e):
    key = ("card", e["title"], e["sub"])
    if key not in _cache:
        im = Image.new("RGB", (W, H), (8, 8, 8))
        glow = Image.new("RGB", (W, H), (0, 0, 0))
        f, f2 = font(FONT_BIG, 150), font(FONT_HAND, 70)
        ImageDraw.Draw(glow).text((W / 2, H / 2 - 40), e["title"], font=f, fill=ORANGE, anchor="mm")
        im = Image.blend(im, glow.filter(ImageFilter.GaussianBlur(22)), 0.9)
        d = ImageDraw.Draw(im)
        d.text((W / 2, H / 2 - 40), e["title"], font=f, fill="white", anchor="mm")
        if e["sub"]:
            d.text((W / 2, H / 2 + 100), e["sub"], font=f2, fill=ORANGE, anchor="mm")
        _cache[key] = im
    return _cache[key]


def draw_bars(d, e):
    f_lab, f_val = font(FONT_BIG, 66), font(FONT_BIG, 66)
    x0, x1, y = 470, 1450, 360
    for i, (k, v) in enumerate(e["rows"]):
        last = i == len(e["rows"]) - 1
        yy = y + i * 165
        d.text((x0 - 40, yy), k, font=f_lab, fill=BLACK, anchor="rm")
        xe = x0 + (x1 - x0) * v / 100
        d.rectangle([x0, yy - 50, xe, yy + 50], fill=ORANGE if last else LIGHT, outline=BLACK, width=5)
        d.text((xe + 30, yy), f"${v:g}", font=f_val, fill=ORANGE if last else BLACK, anchor="lm")
        if last and e["circle"]:
            tw = f_val.getlength(f"${v:g}")
            d.ellipse([xe + 5, yy - 70, xe + tw + 55, yy + 70], outline=ORANGE, width=7)


def draw_headline(d, e):
    x, y = pos(e["pos"]); cx, cy = x * W, y * H
    f, f2 = font(FONT_NEWS, 56), font(FONT_HAND, 38)
    lines = wrap(e["text"], f, 1000)
    bw, bh = 1120, 90 + 72 * len(lines) + 50
    d.rounded_rectangle([cx - bw / 2 + 10, cy - bh / 2 + 12, cx + bw / 2 + 10, cy + bh / 2 + 12], 18, fill=LIGHT)
    d.rounded_rectangle([cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2], 18, fill="white", outline=GREY, width=3)
    d.rectangle([cx - bw / 2 + 40, cy - bh / 2 + 30, cx - bw / 2 + 200, cy - bh / 2 + 42], fill=ORANGE)
    top = cy - bh / 2 + 70
    for i, l in enumerate(lines):
        lx, ly = cx - bw / 2 + 40, top + 72 * i
        d.text((lx, ly), l, font=f, fill=BLACK, anchor="lt")
        word = e["opt"]
        if word and word in l:
            wx = lx + f.getlength(l[:l.index(word)])
            ww = f.getlength(word)
            d.ellipse([wx - 25, ly - 22, wx + ww + 25, ly + 82], outline=ORANGE, width=7)
    d.text((cx - bw / 2 + 40, cy + bh / 2 - 45), e["text2"], font=f2, fill=GREY, anchor="lm")


def draw_chart(d, year):
    f_title, f_lab, f_big = font(FONT_HAND, 64), font(FONT_HAND, 44), font(FONT_BIG, 64)
    x0, x1, y0, y1 = 260, 1640, 220, 920
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


ORDER = {"card": 0, "img": 1, "chart": 2, "bars": 2, "headline": 3, "text": 4, "bubble": 5, "think": 5, "label": 6}


def render(beats, timings, audio, out_mp4, workdir):
    import soundfile as sf
    tm = {t["beat"]: t for t in timings}
    n_frames = int((len(audio) / SR + 0.6) * FPS)
    same = lambda a, b: {**a, "delay": 0, "persist": 0, "pop": 0} == {**b, "delay": 0, "persist": 0, "pop": 0}
    pops, whooshes = [], []
    for i, b in enumerate(beats):
        prev = beats[i - 1]["elems"] if i else []
        for e in b["elems"]:
            e["persist"] = any(same(p, e) for p in prev)
            if not e["persist"]:
                t0 = tm[i]["start"] + e["delay"]
                (whooshes if e["kind"] == "card" else pops if e["pop"] else []).append(t0)
    # sound effects: a short pop for '!' elements, a soft whoosh for chapter cards
    mix = np.concatenate([audio, np.zeros(int(0.6 * SR), dtype=np.float32)])
    tt = np.arange(int(0.07 * SR)) / SR
    pop = (np.sin(2 * np.pi * (700 - 3000 * tt) * tt) * np.exp(-tt * 55) * 0.18).astype(np.float32)
    tw = np.arange(int(0.5 * SR)) / SR
    noise = np.convolve(np.random.default_rng(1).standard_normal(len(tw)), np.ones(30) / 30, "same")
    whoosh = (noise * np.sin(np.pi * tw / tw[-1]) ** 2 * 0.25).astype(np.float32)
    for times, snd in ((pops, pop), (whooshes, whoosh)):
        for s in times:
            i = int(s * SR)
            mix[i:i + len(snd)] += snd[: len(mix[i:i + len(snd)])]
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
        for e in sorted(b["elems"], key=lambda e: ORDER[e["kind"]]):
            age = t - bt["start"] - e["delay"]
            if age < 0 and not e["persist"]:
                continue
            s = pop_scale(age) if e["pop"] and not e["persist"] else 1.0
            d = ImageDraw.Draw(canvas)
            k = e["kind"]
            if k == "img":
                x, y = pos(e["pos"])
                paste_center(canvas, load_img(e["code"], e["h"]), x * W, y * H, s)
            elif k == "card":
                canvas.paste(card_image(e))
            elif k == "text":
                draw_text(d, e, s)
            elif k in ("bubble", "think"):
                draw_bubble(d, e, s, think=k == "think")
            elif k == "label":
                draw_label(d, e, s)
            elif k == "bars":
                draw_bars(d, e)
            elif k == "headline":
                draw_headline(d, e)
            else:
                span = max(0.01, (bt["end"] - bt["start"]) * 0.85)
                draw_chart(d, e["a"] + (e["b"] - e["a"]) * min(1.0, max(0.0, t - bt["start"]) / span))
        ff.stdin.write(canvas.tobytes())
    ff.stdin.close()
    ff.wait()


def main():
    vdir = os.path.abspath(sys.argv[1])
    beats = parse_beats(os.path.join(vdir, "01_script", "beats.txt"))
    for sub in ("03_voice", "05_export"):
        os.makedirs(os.path.join(vdir, sub), exist_ok=True)
    timings, audio = make_voice(beats, os.path.join(vdir, "03_voice", "voiceover.wav"),
                                os.path.join(vdir, "03_voice", "timings.json"))
    print(f"voice: {len(audio) / SR:.1f}s, {len(beats)} beats")
    if "--voice-only" in sys.argv:
        return
    out = os.path.join(vdir, "05_export", os.path.basename(vdir) + ".mp4")
    render(beats, timings, audio, out, os.path.join(vdir, "03_voice"))
    print("video:", out)


if __name__ == "__main__":
    main()
