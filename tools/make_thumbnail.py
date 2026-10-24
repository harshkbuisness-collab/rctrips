"""Casual Finance style thumbnail: 2-4 word serif text with a period, one real chart, doodle characters.
See research/11-casual-finance-thumbnails.md.

Usage: python3 tools/make_thumbnail.py videos/<slug>   (reads 06_thumbnail/thumb.json, writes 06_thumbnail/thumbnail*.png)
thumb.json: {"texts": ["It Took|25 Years."], "red_word": "", "chart": {... like charts.json, plus "red": [i0, i1]},
             "chars": [{"file": "flow_v1.jpg", "crop": [x0,y0,x1,y1], "pos": [x, y], "h": 300}]}
"""
import io, json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

W, H = 1280, 720
SERIF = "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf"
RED, GREY = "#d62728", "#9a9a9a"


def chart_img(c, w, h):
    fig, ax = plt.subplots(figsize=(w / 100, h / 100), dpi=100)
    fig.subplots_adjust(left=0.02, right=0.98, top=0.84, bottom=0.1)
    x, y = c["x"], c["y"]
    a, b = c["red"]
    ax.plot(x[:a + 1], y[:a + 1], color=GREY, lw=4)
    ax.plot(x[a:b + 1], y[a:b + 1], color=RED, lw=5)
    ax.plot(x[b:], y[b:], color=GREY, lw=4)
    for k, (i, t) in enumerate(c["labels"].items()):
        i = int(i)
        ax.annotate(t, (x[i], y[i]), xytext=(0, 16 if y[i] > 200 else -46), textcoords="offset points",
                    ha="right" if i == len(x) - 1 else "center",
                    fontsize=30, fontweight="bold", color=RED, family="DejaVu Serif")
    ax.scatter([x[a]], [y[a]], s=1600, facecolors="none", edgecolors=RED, linewidths=3.5)
    for s in ("top", "right", "left"):
        ax.spines[s].set_visible(False)
    ax.set_yticks([]); ax.set_xticks([])
    ax.set_ylim(min(y) * 0.2, max(y) * 1.25)
    fig.text(0.02, 0.92, c["title"], fontsize=19, fontweight="bold", color="#111")
    buf = io.BytesIO()
    fig.savefig(buf, format="png", facecolor="white")
    plt.close(fig)
    return Image.open(buf).convert("RGB")


def cutout(path, crop, h):
    im = Image.open(path).convert("RGB").crop(crop)
    im = im.resize((int(im.width * h / im.height), h), Image.LANCZOS)
    flood = im.copy()
    for p in [(0, 0), (im.width - 1, 0), (0, im.height - 1), (im.width - 1, im.height - 1)]:
        ImageDraw.floodfill(flood, p, (255, 0, 255), thresh=40)
    a = np.array(flood)
    alpha = np.where((a[..., 0] == 255) & (a[..., 1] == 0) & (a[..., 2] == 255), 0, 255).astype(np.uint8)
    rgba = im.convert("RGBA")
    rgba.putalpha(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.7)))
    return rgba


def main(vdir):
    d = os.path.join(vdir, "06_thumbnail")
    spec = json.load(open(os.path.join(d, "thumb.json")))
    for n, text in enumerate(spec["texts"], 1):
        im = Image.new("RGB", (W, H), "white")
        cw = spec.get("chart_w", 700)
        im.paste(chart_img(spec["chart"], cw, 470), (W - cw - 140, 240))
        for ch in spec["chars"]:
            c = cutout(os.path.join(d, ch["file"]), ch["crop"], ch["h"])
            im.paste(c, tuple(ch["pos"]), c)
        dr = ImageDraw.Draw(im)
        f = ImageFont.truetype(SERIF, spec.get("size", 96))
        y = 34
        for line in text.split("|"):
            x = 40
            for word in line.split(" "):
                col = RED if word.strip(".") == spec.get("red_word") else "#111"
                dr.text((x, y), word, font=f, fill=col)
                x += f.getlength(word + " ")
            y += int(spec.get("size", 96) * 1.05)
        out = os.path.join(d, f"thumbnail{n}.png")
        im.save(out)
        print(out)


if __name__ == "__main__":
    main(sys.argv[1])
