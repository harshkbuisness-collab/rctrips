"""Builds a doodle-explainer video from a beat sheet and the image library (v3 style).

Usage:
  KOKORO_DIR=<model dir> python3 tools/make_video.py videos/<slug> [--voice-only | --check]

  --check  renders the last frame of every beat into contact sheets (05_export/check_*.jpg)
           and prints layout warnings (text off screen, text over text, text over a drawing).

Inputs:  <slug>/01_script/beats.txt, <slug>/02_assets/screens/* (real screenshots),
         library/assets/*.jpg, library/fonts/*.ttf
Outputs: <slug>/03_voice/voiceover.wav + timings.json, <slug>/05_export/<slug>.mp4

Beat sheet line:   spoken words || element; element; ...
An element listed again in the next beat stays on screen (a doc keeps zooming). Append +SECONDS to delay it.
  A01@pos[:height[:anchor]]             library image (height = share of screen height; >= 0.9 makes a
                                        close-up cut by the frame). anchor = left|right|top|bottom pins that
                                        edge of the drawing to pos, for peeking in from the frame edge
  H17@pos:height:"WORD"                 blank prop (H16 sticky note, H17 price tag, H18 sign) with WORD on it
  group:E35*6@x0,y0,x1,y1[:height]      small identical icons added one by one inside a box
  title:"The silent tax"                small red handwritten section title, top left
  "TEXT"@pos:size[:color]               text; color black|red|grey; size >= 90 uses the marker font (rare)
  bubble:"TEXT"@pos[:l|r]               speech bubble, tail to the lower left/right
  think:"TEXT"@pos                      thought bubble
  label:"TEXT"@pos>x,y                  black handwritten note with a red arrow pointing at x,y
  note:"TEXT"@pos[>x,y]                 red handwritten note (optional red arrow)
  arrow:x,y>x,y                         red hand-drawn arrow
  circle:x0,y0,x1,y1                    red hand-drawn circle around a screen box
  xmark                                 big red X across the scene
  doc:FILE@pos w=0.7 [h=0.8] [zoom=1.06] [focus=x,y] [scroll] [frame=0] [src="Source"]
      [hl=x0,y0,x1,y1] [box=x0,y0,x1,y1] [circ=x0,y0,x1,y1]
                                        real screenshot with a slow zoom toward focus (or a slow scroll).
                                        hl = yellow highlighter, box/circ = red marks, all in fractions of
                                        the screenshot; each may end in +SECONDS
  bars:"2020"=100,"2025"=81[:circle]    horizontal bar chart of dollar values, built one row per beat
  chart@a-b                             "$100 at 3% inflation" line chart, drawn from year a to b
  source:"TEXT"                         small grey source line, bottom left
  sting                                 short soft music sting (section breaks only)
  endscreen                             "Subscribe for more" end card with a box for the next video
  hold:SECONDS                          length of a beat with no words (default 1.0)
pos = center|left|right|top|bottom|low|tl|tr|bl|br or x,y as screen fractions (0.3,0.5).
"""
import json, math, os, re, subprocess, sys
import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = os.path.join(ROOT, "library", "assets")
FONT_BIG = os.path.join(ROOT, "library", "fonts", "PermanentMarker.ttf")
FONT_HAND = os.path.join(ROOT, "library", "fonts", "PatrickHand.ttf")
W, H, FPS, SR = 1920, 1080, 24, 24000
RED, BLACK, GREY, LIGHT = (214, 38, 38), (20, 20, 20), (120, 120, 120), (225, 225, 225)
YELLOW = (255, 232, 40)
COLORS = {"red": RED, "black": BLACK, "grey": GREY}
POS = {"center": (0.5, 0.52), "left": (0.3, 0.52), "right": (0.7, 0.52), "top": (0.5, 0.14),
       "bottom": (0.5, 0.9), "low": (0.5, 0.78), "tl": (0.18, 0.22), "tr": (0.82, 0.22),
       "bl": (0.18, 0.78), "br": (0.85, 0.75)}
# writable area of the blank props, as fractions of the drawing: x0, y0, x1, y1, ink colour
PROP_AREA = {"H16": (0.1, 0.12, 0.9, 0.88, BLACK), "H17": (0.08, 0.42, 0.7, 0.86, BLACK),
             "H18": (0.44, 0.22, 0.96, 0.56, (255, 255, 255))}
VOICE, SPEED = "am_michael", 1.1
GAP, GAP_LONG = 0.18, 0.3            # pause after a sentence / after "..." or "?"
ROOM_TONE_DB = -56                   # faint room noise under everything, like a real microphone
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


def nums(s):
    return [float(v) for v in s.split(",")]


# ---------- beat sheet ----------
def split_delay(s):
    m = re.search(r"\+([\d.]+)$", s)
    return (s[:m.start()], float(m.group(1))) if m else (s, 0.0)


def parse_doc(item):
    head, *opts = re.findall(r'(?:[^\s"]|"[^"]*")+', item[4:])
    f, _, p = head.partition("@")
    e = {"kind": "doc", "file": f, "pos": p, "w": 0.7, "h": 0, "zoom": 1.06, "focus": "0.5,0.5",
         "scroll": False, "frame": 1, "src": "", "marks": []}
    for o in opts:
        k, _, v = o.partition("=")
        if k in ("hl", "box", "circ"):
            v, dl = split_delay(v)
            e["marks"].append({"kind": k, "rect": nums(v), "delay": dl})
        elif k == "scroll":
            e["scroll"] = True
        elif k == "src":
            e["src"] = v.strip('"')
        elif k == "focus":
            e["focus"] = v
        else:
            e[k] = float(v)
    return e


def parse_elem(item):
    if item.startswith("doc:"):          # its marks carry their own +delays
        return {**parse_doc(item), "delay": 0.0}
    item, delay = split_delay(item)
    e = {"delay": delay}
    if item in ("xmark", "sting", "endscreen"):
        return {**e, "kind": item}
    if item.startswith("hold:"):
        return {**e, "kind": "hold", "secs": float(item[5:])}
    if item.startswith(("title:", "source:")):
        k, _, t = item.partition(":")
        return {**e, "kind": k, "text": t.strip('"')}
    if item.startswith("arrow:"):
        a, b = item[6:].split(">")
        return {**e, "kind": "arrow", "a": nums(a), "b": nums(b)}
    if item.startswith("circle:"):
        return {**e, "kind": "circle", "rect": nums(item[7:])}
    if item.startswith("group:"):
        m = re.match(r"group:(\w+)\*(\d+)@([\d.,]+)(?::([\d.]+))?$", item)
        return {**e, "kind": "group", "code": m.group(1), "n": int(m.group(2)), "rect": nums(m.group(3)),
                "h": float(m.group(4) or 0.2)}
    if item.startswith("bars:"):
        body, _, opt = item[5:].partition(":")
        rows = [(k, float(v)) for k, v in re.findall(r'"([^"]+)"=([\d.]+)', body)]
        return {**e, "kind": "bars", "rows": rows, "circle": opt == "circle"}
    if item.startswith("chart@"):
        a, b = item[6:].split("-")
        return {**e, "kind": "chart", "a": float(a), "b": float(b)}
    m = re.match(r'(bubble|think|label|note):"([^"]*)"@([^:>]+)(?:>([\d.]+,[\d.]+))?(?::(.*))?$', item)
    if m:
        kind, text, p, target, opt = m.groups()
        return {**e, "kind": kind, "text": text, "pos": p, "target": target, "opt": opt or ""}
    m = re.match(r'"([^"]*)"@([^:]+):(\d+)(?::(\w+))?$', item)
    if m:
        return {**e, "kind": "text", "text": m.group(1), "pos": m.group(2), "size": int(m.group(3)),
                "color": m.group(4) or "black"}
    code, _, rest = item.partition("@")
    p, _, rest = rest.partition(":")
    h, _, extra = rest.partition(":")
    word = extra.strip('"') if extra.startswith('"') else ""
    anchor = "" if word else extra
    return {**e, "kind": "img", "code": code, "pos": p, "h": float(h) if h else 0.7, "anchor": anchor, "word": word}


def parse_beats(path):
    beats = []
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        words, vis = [s.strip() for s in line.split("||")]
        beats.append({"words": words, "elems": [parse_elem(v.strip()) for v in vis.split(";") if v.strip()]})
    return beats


def hold_of(b):
    return next((e["secs"] for e in b["elems"] if e["kind"] == "hold"), 1.0)


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
            dur, text = hold_of(b), ""          # wordless beat: section break or end screen
            a = np.zeros(int(dur * SR), dtype=np.float32)
        # split the sentence time between its beats by character count (approximate word timing)
        lens = [max(1, len(beats[j]["words"])) for j in group]
        acc = t
        for j, n in zip(group, lens):
            d = dur * n / sum(lens)
            timings.append({"beat": j, "start": round(acc, 3), "end": round(acc + d, 3)})
            acc += d
        gap = GAP_LONG if text.endswith(("...", "?")) else GAP if text else 0.0
        audio += [a, np.zeros(int(gap * SR), dtype=np.float32)]
        t += dur + gap
        group = []
    full = np.concatenate(audio)
    sf.write(out_wav, full, SR)
    json.dump(timings, open(out_json, "w"), indent=1)
    return timings, full


# ---------- hand-drawn strokes ----------
def rough(pts, seed, amp=3.0):
    """Adds a small, smooth wobble to a polyline so it looks drawn with a marker."""
    rng = np.random.default_rng(seed)
    out = []
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        n = max(2, int(math.hypot(x1 - x0, y1 - y0) / 25))
        nx, ny = -(y1 - y0), x1 - x0
        ln = math.hypot(nx, ny) or 1
        ph, fr = rng.uniform(0, 6.3), rng.uniform(1.5, 3)
        for i in range(n):
            u = i / n
            w = amp * math.sin(ph + fr * math.pi * u)
            out.append((x0 + (x1 - x0) * u + w * nx / ln, y0 + (y1 - y0) * u + w * ny / ln))
    return out + [pts[-1]]


def stroke(d, pts, color, width):
    d.line(pts, fill=color, width=width, joint="curve")
    r = width / 2
    for x, y in (pts[0], pts[-1]):
        d.ellipse([x - r, y - r, x + r, y + r], fill=color)


def rough_arrow(d, a, b, color=RED, width=7, seed=1):
    (sx, sy), (ex, ey) = a, b
    mx, my = (sx + ex) / 2 + (ey - sy) * 0.08, (sy + ey) / 2 - (ex - sx) * 0.08    # slight curve
    curve = [((1 - u) ** 2 * sx + 2 * u * (1 - u) * mx + u * u * ex, (1 - u) ** 2 * sy + 2 * u * (1 - u) * my + u * u * ey)
             for u in np.linspace(0, 1, 12)]
    stroke(d, rough(curve, seed, 1.2), color, width)
    ang = math.atan2(ey - my, ex - mx)
    for da in (2.6, -2.6):
        stroke(d, [(ex, ey), (ex + 34 * math.cos(ang + da), ey + 34 * math.sin(ang + da))], color, width)


def rough_ellipse(d, box, color=RED, width=7, seed=1):
    x0, y0, x1, y1 = box
    cx, cy, rx, ry = (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2
    rng = np.random.default_rng(seed)
    start, wob = rng.uniform(0, 6.3), rng.uniform(0.03, 0.06)
    pts = []
    for i in range(73):                             # a bit more than one lap, like a quick pen circle
        a = start + i / 72 * 2 * math.pi * 1.1
        k = 1 + wob * math.sin(3 * a) + 0.05 * i / 72
        pts.append((cx + rx * k * math.cos(a), cy + ry * k * math.sin(a)))
    stroke(d, pts, color, width)


# ---------- library images ----------
_cache = {}
def load_img(code, h_frac, word=""):
    key = (code, h_frac, word)
    if key not in _cache:
        path = next(os.path.join(LIB, f) for f in sorted(os.listdir(LIB)) if f.startswith(code + "_"))
        im = Image.open(path).convert("RGB")
        bbox = ImageOps.invert(im.convert("L")).point(lambda v: 255 if v > 18 else 0).getbbox()
        im = im.crop(bbox) if bbox else im
        if word:
            write_on_prop(im, code, word)
        max_w = W * (0.42 if h_frac < 0.9 else 2)       # close-ups may be wider than the frame
        scale = min(H * h_frac / im.height, max_w / im.width)
        im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.LANCZOS)
        # make the white surrounding the drawing transparent, so overlapping items don't show white boxes
        rgba = im.convert("RGBA")
        flood = im.copy()
        for corner in [(0, 0), (im.width - 1, 0), (0, im.height - 1), (im.width - 1, im.height - 1)]:
            ImageDraw.floodfill(flood, corner, (255, 0, 255), thresh=40)
        a = np.array(flood)
        outside = (a[..., 0] == 255) & (a[..., 1] == 0) & (a[..., 2] == 255)
        alpha = np.where(outside, 0, 255).astype(np.uint8)
        rgba.putalpha(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.8)))
        _cache[key] = rgba
    return _cache[key]


def write_on_prop(im, code, word):
    x0, y0, x1, y1, ink = PROP_AREA[code]
    bw, bh = (x1 - x0) * im.width, (y1 - y0) * im.height
    size = int(bh * 0.7)
    while size > 10 and font(FONT_BIG, size).getlength(word) > bw * 0.9:
        size -= 2
    ImageDraw.Draw(im).text(((x0 + x1) / 2 * im.width, (y0 + y1) / 2 * im.height), word,
                            font=font(FONT_BIG, size), fill=ink, anchor="mm")


def place(im, e):
    """Top-left corner for an image, honouring the anchor (edge pinned to pos)."""
    x, y = pos(e["pos"])
    cx, cy = x * W, y * H
    a = e.get("anchor", "")
    left = cx if a == "left" else cx - im.width if a == "right" else cx - im.width / 2
    top = cy if a == "top" else cy - im.height if a == "bottom" else cy - im.height / 2
    return int(left), int(top)


# ---------- real screenshots ----------
_marked = {}
def doc_base(vdir, e):
    key = ("doc", e["file"])
    if key not in _cache:
        _cache[key] = Image.open(os.path.join(vdir, "02_assets", "screens", e["file"])).convert("RGB")
    return _cache[key]


def doc_marked(vdir, e, ages):
    """The screenshot with its highlights and red marks; ages = seconds each mark has been visible."""
    prog = tuple(min(1.0, round(a / 0.3, 1)) if a >= 0 else -1 for a in ages)   # highlighter wipes in 0.3 s
    key = (e["file"], json.dumps([[m["kind"], m["rect"]] for m in e["marks"]]), prog)
    if key not in _marked:
        im = doc_base(vdir, e).copy()
        iw, ih = im.size
        lw = max(4, int(iw / 260))
        for i, (m, p) in enumerate(zip(e["marks"], prog)):
            if p < 0:
                continue
            x0, y0, x1, y1 = m["rect"][0] * iw, m["rect"][1] * ih, m["rect"][2] * iw, m["rect"][3] * ih
            if m["kind"] == "hl":     # multiply with yellow so the text stays dark
                xe = x0 + (x1 - x0) * p
                if xe - x0 < 2:
                    continue
                reg = im.crop((int(x0), int(y0), int(xe), int(y1)))
                yel = Image.new("RGB", reg.size, YELLOW)
                im.paste(Image.blend(reg, ImageChops.multiply(reg, yel), 0.85), (int(x0), int(y0)))
            elif m["kind"] == "box":
                d = ImageDraw.Draw(im)
                stroke(d, rough([(x0, y0), (x1, y0), (x1, y1), (x0, y1), (x0, y0 - lw)], i + 7, lw * 0.5), RED, lw)
            else:
                rough_ellipse(ImageDraw.Draw(im), (x0, y0, x1, y1), RED, lw, seed=i + 3)
        if len(_marked) > 60:
            _marked.clear()
        _marked[key] = im
    return _marked[key]


def draw_doc(canvas, vdir, e, t, boxes):
    base = doc_base(vdir, e)
    iw, ih = base.size
    dw = int(e["w"] * W)
    dh = int(e["h"] * H) if e["h"] else int(dw * ih / iw)
    win_h = iw * dh / dw                                   # screenshot pixels visible at zoom 1
    life = max(0.5, e["t_end"] - e["t0"])
    p = min(1.0, max(0.0, (t - e["t0"]) / life))
    oy = (ih - win_h) * p if e["scroll"] and ih > win_h else 0
    z = 1 + (e["zoom"] - 1) * p
    fx, fy = nums(e["focus"])
    rw, rh = iw / z, min(ih, win_h) / z
    left, top = fx * iw * (1 - 1 / z), oy + fy * min(ih, win_h) * (1 - 1 / z)
    ages = [t - m["t0"] for m in e["marks"]]
    im = doc_marked(vdir, e, ages).crop((int(left), int(top), int(left + rw), int(top + rh))).resize((dw, dh), Image.BILINEAR)
    x, y = pos(e["pos"])
    px, py = int(x * W - dw / 2), int(y * H - dh / 2)
    d = ImageDraw.Draw(canvas)
    if e["frame"]:
        d.rectangle([px + 9, py + 11, px + dw + 9, py + dh + 11], fill=(205, 205, 205))
    canvas.paste(im, (px, py))
    if e["frame"]:
        d.rectangle([px - 1, py - 1, px + dw, py + dh], outline=(150, 150, 150), width=2)
    if e["src"]:
        d.text((px, py + dh + 22), e["src"], font=font(FONT_HAND, 34), fill=GREY, anchor="lm")
    boxes.append(("doc", (px, py, px + dw, py + dh)))


# ---------- drawing ----------
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


def draw_bubble(d, e, think=False):
    f = font(FONT_HAND, 50)
    lines = wrap(e["text"], f, 420)
    lh = 58
    tw = max(f.getlength(l) for l in lines)
    th = lh * len(lines)
    x, y = pos(e["pos"]); cx, cy = x * W, y * H
    rw, rh = tw / 2 + 60, th / 2 + 45
    side = -1 if e["opt"] != "r" else 1
    if think:
        for i, r in enumerate((16, 11, 7)):
            px, py = cx + side * (rw * 0.55 + i * 30), cy + rh + (20 + i * 28)
            d.ellipse([px - r, py - r, px + r, py + r], fill="white", outline=BLACK, width=4)
    else:
        base = [(cx + side * rw * 0.25, cy + rh * 0.8), (cx + side * rw * 0.55, cy + rh * 0.6)]
        tip = (cx + side * rw * 0.75, cy + rh + 55)
        d.polygon(base + [tip], fill="white", outline=BLACK, width=5)
    d.ellipse([cx - rw, cy - rh, cx + rw, cy + rh], fill="white", outline=BLACK, width=5)
    if not think:   # hide the tail's base line inside the bubble
        d.polygon([(cx + side * rw * 0.27, cy + rh * 0.78), (cx + side * rw * 0.53, cy + rh * 0.6),
                   (cx + side * rw * 0.45, cy + rh * 0.5)], fill="white")
    for i, l in enumerate(lines):
        d.text((cx, cy - th / 2 + lh * (i + 0.5)), l, font=f, fill=BLACK, anchor="mm")
    return (cx - rw, cy - rh, cx + rw, cy + rh)


def draw_label(d, e, color):
    f = font(FONT_HAND, 58)
    x, y = pos(e["pos"]); cx, cy = x * W, y * H
    d.text((cx, cy), e["text"], font=f, fill=color, anchor="mm")
    tw = f.getlength(e["text"])
    box = (cx - tw / 2, cy - 32, cx + tw / 2, cy + 32)
    if e["target"]:
        tx, ty = [float(v) * s for v, s in zip(e["target"].split(","), (W, H))]
        dx, dy = tx - cx, ty - cy
        sx, sy = (cx + np.sign(dx) * (tw / 2 + 15), cy) if abs(dx) > abs(dy) else (cx, cy + np.sign(dy) * 38)
        rough_arrow(d, (sx, sy), (tx - 0.12 * (tx - sx), ty - 0.12 * (ty - sy)), seed=len(e["text"]))
    return box


def draw_text(d, e):
    f = font(FONT_BIG if e["size"] >= 90 else FONT_HAND, e["size"])
    x, y = pos(e["pos"])
    d.text((x * W, y * H), e["text"], font=f, fill=COLORS[e["color"]], anchor="mm")
    return d.textbbox((x * W, y * H), e["text"], font=f, anchor="mm")


def draw_title(d, e):
    f = font(FONT_HAND, 66)
    d.text((70, 48), e["text"], font=f, fill=RED, anchor="lt")
    x0, y0, x1, y1 = d.textbbox((70, 48), e["text"], font=f, anchor="lt")
    stroke(d, rough([(66, y1 + 12), (x1 + 6, y1 + 8)], 5, 1.5), RED, 5)
    return (x0, y0, x1, y1 + 14)


def draw_xmark(d):
    stroke(d, rough([(W * 0.22, H * 0.12), (W * 0.78, H * 0.88)], 11, 6), RED, 30)
    stroke(d, rough([(W * 0.77, H * 0.1), (W * 0.24, H * 0.9)], 12, 6), RED, 30)


def draw_endscreen(canvas, d):
    d.text((W / 2, 150), "Subscribe for more!", font=font(FONT_HAND, 110), fill=BLACK, anchor="mm")
    # dashed box where YouTube's "next video" end-screen element goes
    x0, y0, x1, y1 = 900, 330, 1760, 814
    for x in range(x0, x1, 40):
        d.line([(x, y0), (min(x + 22, x1), y0)], fill=GREY, width=4)
        d.line([(x, y1), (min(x + 22, x1), y1)], fill=GREY, width=4)
    for y in range(y0, y1, 40):
        d.line([(x0, y), (x0, min(y + 22, y1))], fill=GREY, width=4)
        d.line([(x1, y), (x1, min(y + 22, y1))], fill=GREY, width=4)
    d.text(((x0 + x1) / 2, (y0 + y1) / 2), "next video", font=font(FONT_HAND, 60), fill=GREY, anchor="mm")
    im = load_img("A23", 0.62)
    canvas.paste(im, (int(470 - im.width / 2), int(600 - im.height / 2)), im)
    rough_arrow(d, (640, 880), (880, 760), seed=4)


def draw_bars(d, e):
    f = font(FONT_BIG, 66)
    x0, x1, y = 470, 1450, 360
    for i, (k, v) in enumerate(e["rows"]):
        last = i == len(e["rows"]) - 1
        yy = y + i * 165
        d.text((x0 - 40, yy), k, font=f, fill=BLACK, anchor="rm")
        xe = x0 + (x1 - x0) * v / 100
        d.rectangle([x0, yy - 50, xe, yy + 50], fill=RED if last and i else LIGHT, outline=BLACK, width=5)
        d.text((xe + 30, yy), f"${v:g}", font=f, fill=RED if last and i else BLACK, anchor="lm")
        if last and e["circle"]:
            tw = f.getlength(f"${v:g}")
            rough_ellipse(d, (xe + 5, yy - 70, xe + tw + 55, yy + 70), seed=9)
    return (x0 - 200, y - 60, x1 + 250, y + 165 * (len(e["rows"]) - 1) + 60)


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
        d.line(pts, fill=RED, width=12, joint="curve")
    d.text((X(0) + 20, Y(100) - 50), "$100", font=f_big, fill=BLACK, anchor="lm")
    for yr, lab in ((10, "$74"), (24, "$49")):
        if year >= yr:
            cx, cy = X(yr), Y(v(yr))
            rough_ellipse(d, (cx - 34, cy - 34, cx + 34, cy + 34), seed=yr)
            d.text((cx, cy - 85), lab, font=f_big, fill=RED, anchor="mm")
    return (x0, 70, x1 + 40, y1 + 130)


ORDER = {"endscreen": 0, "img": 1, "group": 1, "doc": 1, "chart": 2, "bars": 2, "text": 4, "source": 4,
         "bubble": 5, "think": 5, "label": 6, "note": 6, "arrow": 6, "circle": 6, "title": 7, "xmark": 8}
TEXT_KINDS = ("text", "bubble", "think", "label", "note", "title", "source")


def ident(e):
    """What makes an element 'the same one' as in the previous beat (so it stays and keeps animating)."""
    if e["kind"] == "doc":
        return ("doc", e["file"], e["pos"], e["w"], e["h"])
    return json.dumps({k: v for k, v in e.items() if k not in ("delay", "t0", "t_end", "chain")}, sort_keys=True)


def link_elements(beats, tm):
    """Gives every element its first-appearance time t0 and the time t_end it leaves the screen."""
    for i, b in enumerate(beats):
        prev = {ident(p): p for p in beats[i - 1]["elems"]} if i else {}
        for e in b["elems"]:
            p = prev.get(ident(e))
            e["chain"] = p["chain"] if p else [e]
            e["t0"] = p["t0"] if p else tm[i]["start"] + e["delay"]
            if p is not None and p is not e:
                e["chain"].append(e)
            if e["kind"] == "doc":
                old = {json.dumps(m["rect"]) + m["kind"]: m for m in (p["marks"] if p else [])}
                for m in e["marks"]:
                    o = old.get(json.dumps(m["rect"]) + m["kind"])
                    m["t0"] = o["t0"] if o else tm[i]["start"] + m["delay"]
        for e in b["elems"]:
            for c in e["chain"]:
                c["t_end"] = tm[i]["end"]


def render_frame(beats, tm, cur, t, vdir, boxes, masks):
    b, bt = beats[cur], tm[cur]
    canvas = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(canvas)
    for e in sorted(b["elems"], key=lambda e: ORDER.get(e["kind"], 3)):
        k = e["kind"]
        if k in ("sting", "hold") or t < e["t0"]:
            continue
        if k == "img":
            im = load_img(e["code"], e["h"], e["word"])
            xy = place(im, e)
            canvas.paste(im, xy, im)
            masks.append((xy, im.getchannel("A")))
        elif k == "group":
            x0, y0, x1, y1 = e["rect"]
            cols = e["n"] if e["n"] <= 6 else math.ceil(e["n"] / 2)
            rows = math.ceil(e["n"] / cols)
            im = load_img(e["code"], e["h"])
            for j in range(e["n"]):
                if t < e["t0"] + 0.15 * j:
                    break
                cx = (x0 + (x1 - x0) * (j % cols + 0.5) / cols) * W
                cy = (y0 + (y1 - y0) * (j // cols + 0.5) / rows) * H
                canvas.paste(im, (int(cx - im.width / 2), int(cy - im.height / 2)), im)
        elif k == "doc":
            draw_doc(canvas, vdir, e, t, boxes)
        elif k == "endscreen":
            draw_endscreen(canvas, d)
        elif k == "text":
            boxes.append((k, draw_text(d, e)))
        elif k == "title":
            boxes.append((k, draw_title(d, e)))
        elif k == "source":
            f = font(FONT_HAND, 34)
            d.text((70, H - 50), e["text"], font=f, fill=GREY, anchor="lm")
            boxes.append((k, d.textbbox((70, H - 50), e["text"], font=f, anchor="lm")))
        elif k in ("bubble", "think"):
            boxes.append((k, draw_bubble(d, e, think=k == "think")))
        elif k in ("label", "note"):
            boxes.append((k, draw_label(d, e, BLACK if k == "label" else RED)))
        elif k == "arrow":
            rough_arrow(d, (e["a"][0] * W, e["a"][1] * H), (e["b"][0] * W, e["b"][1] * H), seed=3)
        elif k == "circle":
            x0, y0, x1, y1 = e["rect"]
            rough_ellipse(d, (x0 * W, y0 * H, x1 * W, y1 * H), seed=6)
        elif k == "xmark":
            draw_xmark(d)
        elif k == "bars":
            boxes.append((k, draw_bars(d, e)))
        elif k == "chart":
            span = max(0.01, (bt["end"] - bt["start"]) * 0.85)
            boxes.append((k, draw_chart(d, e["a"] + (e["b"] - e["a"]) * min(1.0, max(0.0, t - bt["start"]) / span))))
    return canvas


# ---------- audio ----------
def make_sting():
    """A soft 1.5 s plucked chord (generated here, so there is no licence question)."""
    n = int(1.6 * SR)
    out = np.zeros(n, dtype=np.float32)
    rng = np.random.default_rng(7)
    for j, f in enumerate((261.63, 329.63, 392.0, 523.25)):
        p = int(SR / f)
        buf = rng.uniform(-1, 1, p)
        y = np.zeros(n - int(j * 0.07 * SR))
        for i in range(len(y)):                       # Karplus-Strong string
            y[i] = buf[i % p]
            buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.996
        out[int(j * 0.07 * SR):] += y.astype(np.float32)
    out *= np.linspace(1, 0, n) ** 1.5
    return out / np.abs(out).max() * 0.22


def room_tone(n):
    """Quiet broadband noise with a soft low end, like an untreated room through a microphone."""
    rng = np.random.default_rng(3)
    white = rng.standard_normal(n + 64)
    pink = np.convolve(white, np.exp(-np.arange(64) / 12.0), "same")[:n] * 0.4 + white[:n] * 0.6
    return (pink / np.sqrt(np.mean(pink ** 2))).astype(np.float32)


def render(beats, timings, audio, out_mp4, workdir, vdir):
    import soundfile as sf
    tm = {t["beat"]: t for t in timings}
    link_elements(beats, tm)
    n_frames = int((len(audio) / SR + 0.3) * FPS)
    mix = np.concatenate([audio, np.zeros(int(0.3 * SR), dtype=np.float32)])
    sting = make_sting()
    for i, b in enumerate(beats):
        for e in b["elems"]:
            if e["kind"] == "sting":
                s = int((tm[i]["start"] + e["delay"]) * SR)
                mix[s:s + len(sting)] += sting[: len(mix[s:s + len(sting)])]
    voice_path = os.path.join(workdir, "mix_voice.wav")
    sf.write(voice_path, mix, SR)
    comp = "acompressor=threshold=-22dB:ratio=4:attack=3:release=80"  # evens out TTS peaks
    meas = subprocess.run(["ffmpeg", "-nostdin", "-i", voice_path, "-af", comp + ",loudnorm=I=-14:TP=-1.5:LRA=7:print_format=json",
                           "-f", "null", "-"], capture_output=True, text=True).stderr
    m = json.loads(meas[meas.rindex("{"):meas.rindex("}") + 1])
    gain = -14 - float(m["input_i"])
    # room tone is added before the gain, at the level that lands on ROOM_TONE_DB after it
    mix = mix + room_tone(len(mix)) * 10 ** ((ROOM_TONE_DB - gain) / 20)
    mix_path = os.path.join(workdir, "mix.wav")
    sf.write(mix_path, mix, SR)
    os.remove(voice_path)
    # raise to -14 LUFS (YouTube's level) with a peak limiter so loud syllables don't clip
    loud = comp + f",volume={gain:.2f}dB,alimiter=limit=0.74:level=false"

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
        ff.stdin.write(render_frame(beats, tm, cur, t, vdir, [], []).tobytes())
    ff.stdin.close()
    ff.wait()


# ---------- layout check ----------
def check(beats, timings, vdir):
    tm = {t["beat"]: t for t in timings}
    link_elements(beats, tm)
    thumbs, warnings = [], []
    for i, b in enumerate(beats):
        boxes, masks = [], []
        im = render_frame(beats, tm, i, tm[i]["end"] - 0.02, vdir, boxes, masks)
        texts = [(k, bx) for k, bx in boxes if k in TEXT_KINDS]
        cov = Image.new("L", (W, H), 0)
        for xy, a in masks:
            cov.paste(a, xy, a)
        for k, (x0, y0, x1, y1) in texts:
            if x0 < 20 or y0 < 10 or x1 > W - 20 or y1 > H - 10:
                warnings.append(f"beat {i + 1}: {k} goes off screen")
            reg = np.array(cov.crop((int(x0), int(y0), int(x1), int(y1))))
            if reg.size and (reg > 128).mean() > 0.08:
                warnings.append(f"beat {i + 1}: {k} covers a drawing ({(reg > 128).mean():.0%})")
        for k, A in texts:
            for C in [bx for kd, bx in boxes if kd == "doc"]:
                if k in ("title", "source") and A[0] < C[2] and C[0] < A[2] and A[1] < C[3] and C[1] < A[3]:
                    warnings.append(f"beat {i + 1}: {k} overlaps a screenshot")
        for a in range(len(texts)):
            for c in range(a + 1, len(texts)):
                (ka, A), (kc, C) = texts[a], texts[c]
                if A[0] < C[2] and C[0] < A[2] and A[1] < C[3] and C[1] < A[3]:
                    warnings.append(f"beat {i + 1}: {ka} overlaps {kc}")
        th = im.resize((480, 270))
        ImageDraw.Draw(th).text((8, 6), str(i + 1), font=font(FONT_HAND, 36), fill=(0, 90, 255))
        thumbs.append(th)
    for s in range(0, len(thumbs), 16):
        sheet = Image.new("RGB", (4 * 484, 4 * 274), (90, 90, 90))
        for j, th in enumerate(thumbs[s:s + 16]):
            sheet.paste(th, ((j % 4) * 484 + 2, (j // 4) * 274 + 2))
        sheet.save(os.path.join(vdir, "05_export", f"check_{s // 16 + 1}.jpg"), quality=85)
    print("\n".join(warnings) or "no layout warnings")


def main():
    vdir = os.path.abspath(sys.argv[1])
    beats = parse_beats(os.path.join(vdir, "01_script", "beats.txt"))
    for sub in ("03_voice", "05_export"):
        os.makedirs(os.path.join(vdir, sub), exist_ok=True)
    wav, tj = os.path.join(vdir, "03_voice", "voiceover.wav"), os.path.join(vdir, "03_voice", "timings.json")
    if "--check" in sys.argv and os.path.exists(tj) and len(json.load(open(tj))) == len(beats):
        timings = json.load(open(tj))       # reuse the voice timings while fixing the layout
    else:
        timings, audio = make_voice(beats, wav, tj)
        print(f"voice: {len(audio) / SR:.1f}s, {len(beats)} beats")
    if "--voice-only" in sys.argv:
        return
    if "--check" in sys.argv:
        check(beats, timings, vdir)
        return
    import soundfile as sf
    audio, _ = sf.read(wav, dtype="float32")
    out = os.path.join(vdir, "05_export", os.path.basename(vdir) + ".mp4")
    render(beats, timings, audio, out, os.path.join(vdir, "03_voice"), vdir)
    print("video:", out)


if __name__ == "__main__":
    main()
