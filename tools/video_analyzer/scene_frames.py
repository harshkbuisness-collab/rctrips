"""Video -> one picture per scene, plus contact sheets with all scenes on one page.

Use: double-click 3_SCENES_drag_video_here_windows.bat (or 3_SCENES_mac.command) and choose one or more videos,
     or:  python scene_frames.py video.mp4 [more.mp4 ...] [--every 0] [--max 300]
Output, next to each video:  <name>_scenes/
     scene_001_0m05s.jpg ...   one full-size picture per scene (the moment just before it changes, so it is complete)
     ALL_SCENES.jpg            every scene on one page with its time (more pages if there are many: ALL_SCENES_2.jpg)
     scenes.txt                list of scene times
--every N   also add a picture every N seconds inside long scenes (0 = only real scene changes, default 8)
--max N     at most N scene pictures (default 300)
Needs: ffmpeg, numpy, pillow (1_INSTALL_... installs them).
"""
import math, os, shutil, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

SW, SH, FPS = 160, 90, 6          # small grey copy used to find changes


def probe(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                       capture_output=True, text=True)
    return float(r.stdout.strip() or 0)


def small_frames(path):
    cmd = ["ffmpeg", "-nostdin", "-v", "error", "-i", path, "-vf", f"fps={FPS},scale={SW}:{SH},format=gray",
           "-f", "rawvideo", "-"]
    raw = subprocess.run(cmd, capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, SH, SW).astype(np.int16)


def scene_times(path, every, most):
    f = small_frames(path)
    if len(f) < 2:
        return [0.0]
    diff = (np.abs(f[1:] - f[:-1]) > 24).mean(axis=(1, 2))           # share of pixels that changed
    starts = [0]
    for i, d in enumerate(diff, 1):
        if d > 0.025 and i - starts[-1] >= FPS * 0.7:                 # a real change, not a tiny wiggle
            starts.append(i)
    starts.append(len(f))
    picks = []
    for a, b in zip(starts, starts[1:]):
        if every:
            k = a + int(every * FPS)
            while k < b - FPS:
                picks.append(k)
                k += int(every * FPS)
        picks.append(max(a, b - 2))                                   # the scene when it is complete
    picks = sorted(set(picks))
    if len(picks) > most:
        picks = [picks[int(i * len(picks) / most)] for i in range(most)]
    return [p / FPS for p in picks]


def grab(path, t, out):
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", path, "-frames:v", "1",
                    "-q:v", "2", out], check=False)


def font(size):
    for f in ("arial.ttf", "DejaVuSans.ttf", "/System/Library/Fonts/Supplemental/Arial.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            pass
    return ImageFont.load_default()


def sheets(files, times, outdir, per_page=48, cols=6):
    tw, th = 480, 270
    pages = []
    for p in range(0, len(files), per_page):
        part = list(zip(files, times))[p:p + per_page]
        rows = math.ceil(len(part) / cols)
        sheet = Image.new("RGB", (cols * (tw + 8) + 8, rows * (th + 40) + 8), (60, 60, 60))
        d = ImageDraw.Draw(sheet)
        for k, (f, t) in enumerate(part):
            x, y = 8 + (k % cols) * (tw + 8), 8 + (k // cols) * (th + 40)
            try:
                im = Image.open(f).convert("RGB").resize((tw, th))
            except OSError:
                continue
            sheet.paste(im, (x, y))
            d.text((x + 4, y + th + 6), f"#{p + k + 1}   {int(t // 60)}:{int(t % 60):02d}", font=font(24), fill="white")
        name = os.path.join(outdir, "ALL_SCENES.jpg" if not pages else f"ALL_SCENES_{len(pages) + 1}.jpg")
        sheet.save(name, quality=88)
        pages.append(name)
    return pages


def main(path, every=8.0, most=300):
    base = os.path.splitext(path)[0]
    outdir = base + "_scenes"
    if os.path.isdir(outdir):
        shutil.rmtree(outdir)
    os.makedirs(outdir)
    times = scene_times(path, every, most)
    files = []
    for i, t in enumerate(times, 1):
        f = os.path.join(outdir, f"scene_{i:03d}_{int(t // 60)}m{int(t % 60):02d}s.jpg")
        grab(path, t, f)
        if os.path.exists(f):
            files.append(f)
        print(f"\r{i}/{len(times)} scenes", end="", flush=True)
    times = times[:len(files)]
    pages = sheets(files, times, outdir)
    with open(os.path.join(outdir, "scenes.txt"), "w", encoding="utf-8") as o:
        for i, t in enumerate(times, 1):
            o.write(f"{i}\t{int(t // 60)}:{t % 60:05.2f}\n")
    print(f"\n{len(files)} scene pictures + {len(pages)} overview page(s) -> {outdir}")
    return outdir


def run_all(paths, every, most):
    return [main(p, every, most) for p in paths]


def pick_and_run(every, most):
    import tkinter as tk
    from tkinter import filedialog, messagebox
    root = tk.Tk()
    root.withdraw()
    paths = list(filedialog.askopenfilenames(title="Choose video(s)",
                                             filetypes=[("Videos", "*.mp4 *.mov *.mkv *.webm *.avi"), ("All", "*.*")]))
    if not paths:
        return
    if not shutil.which("ffmpeg"):
        messagebox.showerror("Scene pictures", "ffmpeg is missing. Run 1_INSTALL first.")
        return
    outs = run_all(paths, every, most)
    messagebox.showinfo("Scene pictures", "Done:\n" + "\n".join(outs))
    try:
        os.startfile(outs[0])                       # Windows: open the folder
    except AttributeError:
        subprocess.run(["open", outs[0]], check=False)


if __name__ == "__main__":
    args = sys.argv[1:]
    every = float(args[args.index("--every") + 1]) if "--every" in args else 8.0
    most = int(args[args.index("--max") + 1]) if "--max" in args else 300
    paths = [a for i, a in enumerate(args) if not a.startswith("--") and (i == 0 or args[i - 1] not in ("--every", "--max"))]
    if paths:
        run_all(paths, every, most)
    else:
        pick_and_run(every, most)
