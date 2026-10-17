"""Batch helpers for big runs (15-60 reels).

  render  : python3 batch.py render name1 name2 ...  [--work work] [--out work/videos]
            Renders one after another (never in parallel), skips videos already rendered, prints DONE / ERROR per
            video. A shell job has a 2-hour limit in some sessions: render about 12-15 reels per call.
  cover   : python3 batch.py cover --thumbs work/thumbnails --out work/final [--start 1] name1 name2 ...
            Matches thumbnails named "<n>-<name>.jpg" or "<name>.jpg", writes <out>/<NN>-<name>.mp4 with the cover on
            the first 0.1 s. Prints the videos that still have no thumbnail.
  pack    : python3 batch.py pack --src work/final --zip work/Batch.zip [--text UPLOAD.md] [--crf 24 | --full]
            One zip under the 400 MB upload limit (re-encode with --crf, default 24).
            --full keeps the original quality and splits into balanced parts (Batch-part1-of-3.zip ...).
"""
import os, re, subprocess, sys, glob

HERE = os.path.dirname(os.path.abspath(__file__))
LIMIT = 375e6


def opt(args, k, default=None, flag=False):
    if k in args:
        i = args.index(k)
        if flag: del args[i]; return True
        v = args[i + 1]; del args[i:i + 2]; return v
    return False if flag else default


def render(args):
    work = opt(args, "--work", "work"); out = opt(args, "--out", os.path.join(work, "videos"))
    for n in args:
        if os.path.exists(os.path.join(out, n + ".mp4")): print("skip", n); continue
        r = subprocess.run([sys.executable, os.path.join(HERE, "make_video.py"), "video", "--script", f"{work}/{n}.txt",
                            "--plan", f"{work}/{n}.json", "--name", n, "--out", out], capture_output=True, text=True)
        tail = [l for l in (r.stdout + r.stderr).splitlines() if re.search("DONE|ERROR|REFUSED|rror", l)]
        print(n, tail[0] if tail else ("DONE" if r.returncode == 0 else "FAILED"), flush=True)


def cover(args):
    th = opt(args, "--thumbs"); out = opt(args, "--out"); start = int(opt(args, "--start", 1))
    vids = opt(args, "--videos", "work/videos"); os.makedirs(out, exist_ok=True); missing = []
    for i, n in enumerate(args, start):
        c = [f for p in (f"{i}-{n}", n, f"{i}") for f in glob.glob(os.path.join(th, p + ".*"))]
        if not c: missing.append(f"{i}-{n}"); continue
        subprocess.run([sys.executable, os.path.join(HERE, "add_cover.py"), os.path.join(vids, n + ".mp4"), c[0],
                        os.path.join(out, f"{i:02d}-{n}.mp4")], check=True)
    print("covers done;", "missing thumbnails: " + ", ".join(missing) if missing else "all thumbnails found")


def pack(args):
    src = opt(args, "--src"); z = opt(args, "--zip"); text = opt(args, "--text")
    crf = opt(args, "--crf", "24"); full = opt(args, "--full", flag=True)
    fs = sorted(glob.glob(os.path.join(src, "*.mp4")), key=lambda f: int(re.match(r"\d+", os.path.basename(f)).group() or 0))
    if not full:
        small = os.path.join(src, "_small"); os.makedirs(small, exist_ok=True); new = []
        for f in fs:
            o = os.path.join(small, os.path.basename(f)); new.append(o)
            if not os.path.exists(o):
                subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", f, "-c:v", "libx264", "-preset", "medium",
                                "-crf", crf, "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", o], check=True)
        fs = new
    tot = sum(map(os.path.getsize, fs)); n = max(1, -(-int(tot) // int(LIMIT)))
    parts = [[] for _ in range(n)]; c = 0
    for f in fs:
        s = os.path.getsize(f); parts[min(n - 1, int((c + s / 2) / (tot / n)))].append(f); c += s
    for i, p in enumerate(parts, 1):
        name = z if n == 1 else z.replace(".zip", f"-part{i}-of-{n}.zip")
        if os.path.exists(name): os.remove(name)
        subprocess.run(["zip", "-0", "-j", "-q", name, *p] + ([text] if text else []), check=True)
        print(name, round(os.path.getsize(name) / 1e6), "MB,", len(p), "videos")
    if not full and n > 1: print("still over the limit: use a higher --crf for one zip")


if __name__ == "__main__":
    {"render": render, "cover": cover, "pack": pack}[sys.argv[1]](sys.argv[2:])
