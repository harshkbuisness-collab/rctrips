"""Contact sheet for checking many reels at once: one row per video, 10 frames across.

    python3 frame_strips.py sheet.jpg name1 name2 ... [--dir work/videos]

Check up to 10 videos per sheet. Look for: H big in every frame, no word behind his head, no text on his face,
captions clear of the tape, clips on white.
"""
import subprocess, sys, os, tempfile
from PIL import Image, ImageDraw

args = sys.argv[1:]
d = "work/videos"
if "--dir" in args:
    i = args.index("--dir"); d = args[i + 1]; del args[i:i + 2]
out, names = args[0], args[1:]
W, H, K = 108, 192, 10
sheet = Image.new("RGB", (W * K, (H + 16) * len(names)), "white"); dr = ImageDraw.Draw(sheet)
tmp = os.path.join(tempfile.gettempdir(), "_strip.png")
for r, n in enumerate(names):
    v = os.path.join(d, n if n.endswith(".mp4") else n + ".mp4")
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", v],
                               capture_output=True, text=True).stdout)
    dr.text((2, r * (H + 16) + 2), n, fill="red")
    for k in range(K):
        t = 0.6 + (dur - 1.2) * k / (K - 1)
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", str(t), "-i", v, "-frames:v", "1", "-vf", f"scale={W}:{H}", tmp])
        sheet.paste(Image.open(tmp), (k * W, r * (H + 16) + 16))
sheet.save(out, quality=80)
print("sheet:", out)
