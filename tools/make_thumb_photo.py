"""Clickable photo thumbnail: dark real photo, a thick red crash line, 1-2 huge words, one shocked character.
Usage: python3 tools/make_thumb_photo.py <photo> <character.jpg> "WORD" "RED WORD" <out.png>"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance, ImageOps

W, H = 1280, 720
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
RED = (230, 30, 35)
photo, char, w1, w2, out = sys.argv[1:6]

bg = ImageOps.fit(Image.open(photo).convert("L"), (W, H), centering=(0.5, 0.4))
bg = ImageEnhance.Contrast(bg).enhance(1.4)
bg = ImageEnhance.Brightness(bg).enhance(0.55).convert("RGB")
vig = Image.new("L", (W, H), 0); ImageDraw.Draw(vig).ellipse((-300, -250, W + 300, H + 250), fill=255)
bg = Image.composite(bg, Image.new("RGB", (W, H), "black"), vig.filter(ImageFilter.GaussianBlur(160)))

# red crash line: up, peak, straight down off the bottom
pts = [(-20, 640), (120, 610), (240, 560), (360, 520), (470, 450), (580, 360), (650, 330), (690, 360), (730, 520), (770, 480), (840, 680)]
glow = Image.new("RGBA", (W, H)); gd = ImageDraw.Draw(glow)
gd.line(pts, fill=(255, 0, 0, 160), width=44, joint="curve")
bg.paste(glow.filter(ImageFilter.GaussianBlur(18)), (0, 0), glow.filter(ImageFilter.GaussianBlur(18)))
d = ImageDraw.Draw(bg)
d.line(pts, fill=RED, width=20, joint="curve")
d.polygon([(870, 712), (868, 630), (800, 668)], fill=RED)             # arrow head
d.ellipse((650 - 26, 330 - 26, 650 + 26, 330 + 26), outline="white", width=7)

# character: white background -> transparent
c = Image.open(char).convert("RGB")
for xy in [(0, 0), (c.width - 1, 0), (0, c.height - 1), (c.width - 1, c.height - 1)]:
    ImageDraw.floodfill(c, xy, (255, 0, 255), thresh=40)
a = np.array(c.convert("RGBA")); a[(a[..., 0] == 255) & (a[..., 1] == 0) & (a[..., 2] == 255), 3] = 0
c = Image.fromarray(a); c = c.crop(c.getbbox())
ch = 560; c = c.resize((int(c.width * ch / c.height), ch), Image.LANCZOS)
outline = Image.new("RGBA", c.size, (255, 255, 255, 0)); al = c.split()[3].filter(ImageFilter.MaxFilter(15))
outline.putalpha(al)
x = W - c.width - 20; y = H - ch + 10
bg.paste(Image.new("RGB", c.size, "white"), (x, y), al); bg.paste(c, (x, y), c)

# text: huge, white with black stroke, second word red
def fit(t, maxw, size):
    while True:
        f = ImageFont.truetype(FONT, size)
        if d.textlength(t, font=f) <= maxw: return f
        size -= 4
f1 = fit(w1, 760, 190)
d.text((40, 20), w1, font=f1, fill="white", stroke_width=10, stroke_fill="black")
if w2:
    f2 = fit(w2, 760, 190)
    d.text((40, 20 + f1.size + 10), w2, font=f2, fill=RED, stroke_width=10, stroke_fill="black")
bg.save(out)
print(out)
