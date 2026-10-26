"""YouTube banner (2560x1440). Everything important sits in the 1546x423 mobile safe area in the middle;
the wider strip only shows small chart doodles. Usage: python3 tools/make_banner.py  -> channel/banner.png"""
from PIL import Image, ImageDraw, ImageFont

W, H = 2560, 1440
SX0, SY0, SX1, SY1 = 507, 508, 2053, 931                # mobile safe area
BLACK, GREY, RED, GREEN = "#111111", "#b9b9b9", "#d62728", "#2e9e44"
img = Image.new("RGB", (W, H), "white")
d = ImageDraw.Draw(img)

logo = Image.open("channel/logo.webp").convert("RGBA")
bb = Image.eval(logo.convert("L"), lambda v: 255 if v < 245 else 0).getbbox()
logo = logo.crop(bb)
lh = 350
logo = logo.resize((int(logo.width * lh / logo.height), lh), Image.LANCZOS)
title = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf", 150)
tag = ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-Regular.otf", 44)
t1, t2 = "Dollar Diaries.", "Money, explained simply. Real charts, real stories."
w1, w2 = d.textlength(t1, font=title), d.textlength(t2, font=tag)
gap = 55
total = logo.width + gap + max(w1, w2)
x = int((W - total) // 2)
img.paste(logo, (x, (H - lh) // 2), logo)
tx = x + logo.width + gap
d.text((tx, 580), t1, font=title, fill=BLACK)
d.line((tx + 4, 758, tx + w1 * 0.62, 758), fill=RED, width=9)          # marker underline
d.text((tx, 790), t2, font=tag, fill="#444444")

# wide-screen doodles (outside the safe area, desktop/TV only)
pts = [(60, 880), (150, 840), (230, 860), (320, 770), (400, 800), (470, 690)]
d.line(pts, fill=GREY, width=10, joint="curve")
d.line(pts[-2:], fill=RED, width=10)
d.ellipse((440, 660, 500, 720), outline=RED, width=7)
for i, (bx, bh) in enumerate([(2120, 90), (2210, 150), (2300, 120), (2390, 230)]):
    d.rectangle((bx, 900 - bh, bx + 60, 900), fill=RED if i == 3 else GREY)
d.line((2090, 902, 2480, 902), fill=BLACK, width=6)
img.save("channel/banner.png")
print("channel/banner.png")
