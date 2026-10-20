"""Analyze a video without Claude and write one short report to paste into Claude.

Usage:  python3 tools/video_analyzer/analyze_video.py <video.mp4> [--no-speech]
Needs:  ffmpeg, numpy, pillow; for speech also `pip install faster-whisper` (runs on CPU).
Output (next to the video, in <name>_analysis/):
  REPORT.md        short text report: copy all of it into Claude
  transcript.txt   full spoken text with times (only send it if Claude asks)
  sheet.jpg        24 small frames from the main scene changes (send only if Claude asks to see the look)

Pace is measured like research/03: frames scaled to 160x90 grey; a frame "changes" when more than 0.05% of
pixels change by more than 25; runs of 3+ changed frames count as one animated move; a cut is a frame where
more than 30% of pixels change.
"""
import json, os, subprocess, sys
import numpy as np
from PIL import Image

W, H = 160, 90


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height,r_frame_rate:format=duration", "-of", "json", path],
                         capture_output=True, text=True).stdout
    j = json.loads(out)
    s, (a, b) = j["streams"][0], j["streams"][0]["r_frame_rate"].split("/")
    return float(j["format"]["duration"]), s["width"], s["height"], float(a) / float(b)


def frames(path, fps):
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", path, "-vf", f"fps={fps},scale={W}:{H}", "-f", "rawvideo",
                          "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    n = W * H * 3
    while True:
        b = p.stdout.read(n)
        if len(b) < n:
            break
        yield np.frombuffer(b, np.uint8).reshape(H, W, 3)


def pace(path, fps):
    changed, cuts, thumbs, bright, evenly, prev = [], [], [], [], [], None
    for i, f in enumerate(frames(path, fps)):
        g = f.mean(axis=2)
        bright.append(g.mean())
        if prev is None:
            changed.append(False)
            thumbs.append((0.0, f))
        else:
            share = (np.abs(g - prev) > 25).mean()
            changed.append(share > 0.0005)
            if share > 0.30:
                cuts.append(i / fps)
                thumbs.append((i / fps, f))
            elif i % int(fps * 5) == 0:
                evenly.append((i / fps, f))
        prev = g
    moves, run = [], 0
    for c in changed + [False]:
        if c:
            run += 1
        else:
            if run >= 3:
                moves.append(run / fps)
            run = 0
    events = [i / fps for i in range(1, len(changed)) if changed[i] and not changed[i - 1]]
    if len(thumbs) < 24:                     # few cuts: fill the sheet with evenly spaced frames
        pick = np.linspace(0, len(evenly) - 1, min(len(evenly), 24 - len(thumbs))).astype(int) if evenly else []
        thumbs = sorted(thumbs + [evenly[i] for i in pick], key=lambda x: x[0])
    return np.array(changed), events, moves, cuts, thumbs, np.array(bright)


def per10(times, start, end):
    return 10 * sum(start <= t < end for t in times) / max(end - start, 1e-6)


def speech(path):
    from faster_whisper import WhisperModel
    m = WhisperModel("base.en", device="cpu", compute_type="int8")
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                         capture_output=True).stdout          # decode with ffmpeg: the av package breaks on some files
    segs, _ = m.transcribe(np.frombuffer(raw, np.float32), vad_filter=True)
    return [(s.start, s.end, s.text.strip()) for s in segs]


def sheet(thumbs, out, n=24):
    if len(thumbs) > n:
        idx = np.linspace(0, len(thumbs) - 1, n).astype(int)
        thumbs = [thumbs[i] for i in idx]
    S = Image.new("RGB", (6 * W, ((len(thumbs) + 5) // 6) * H), "white")
    for k, (t, f) in enumerate(thumbs):
        S.paste(Image.fromarray(f), ((k % 6) * W, (k // 6) * H))
    S.save(out, quality=70)
    return [round(t, 1) for t, _ in thumbs]


def main(path, use_speech=True):
    dur, w, h, vfps = probe(path)
    fps = min(25.0, round(vfps))
    changed, events, moves, cuts, thumbs, bright = pace(path, fps)
    out = os.path.splitext(path)[0] + "_analysis"
    os.makedirs(out, exist_ok=True)
    times = sheet(thumbs, os.path.join(out, "sheet.jpg"))

    r = [f"# Video analysis: {os.path.basename(path)}",
         f"Length {dur / 60:.1f} min ({dur:.0f} s), {w}x{h}, {vfps:.0f} fps.", "",
         "## Pace (whole video)",
         f"- Visual changes: {per10(events, 0, dur):.1f} per 10 s (one every {dur / max(len(events), 1):.2f} s); "
         f"first minute {per10(events, 0, min(60, dur)):.1f} per 10 s",
         f"- Time with something moving: {100 * changed.mean():.0f}%",
         f"- Animated moves: {len(moves) / (dur / 60):.1f} per minute, median {np.median(moves) if moves else 0:.2f} s, "
         f"longest {max(moves) if moves else 0:.1f} s",
         f"- Hard cuts (new scene): {len(cuts)} ({len(cuts) / (dur / 60):.1f} per minute)",
         f"- Average brightness {bright.mean():.0f}/255 (white background is about 240)", "",
         "## Pace every 30 s", "| from | changes/10s | moving % | cuts |", "|---|---|---|---|"]
    for a in range(0, int(dur), 30):
        b = min(a + 30, dur)
        sl = changed[int(a * fps):int(b * fps)]
        r.append(f"| {a // 60}:{a % 60:02d} | {per10(events, a, b):.1f} | {100 * sl.mean() if len(sl) else 0:.0f} | "
                 f"{sum(a <= t < b for t in cuts)} |")
    if use_speech:
        try:
            segs = speech(path)
            words = sum(len(s[2].split()) for s in segs)
            talk = sum(e - s for s, e, _ in segs)
            open(os.path.join(out, "transcript.txt"), "w", encoding="utf-8").write(
                "\n".join(f"[{int(s) // 60}:{int(s) % 60:02d}] {t}" for s, e, t in segs))
            first = " ".join(t for s, e, t in segs if s < 60)
            r += ["", "## Speech",
                  f"- {words} words, {60 * words / dur:.0f} words per minute overall "
                  f"({60 * words / max(talk, 1):.0f} while talking); silence {100 * (1 - talk / dur):.0f}% of the time",
                  f"- Average sentence part {words / max(len(segs), 1):.0f} words",
                  f"- First 60 seconds (the hook): {first}"]
        except Exception as e:
            r += ["", f"## Speech\n- skipped ({e.__class__.__name__}: {str(e)[:80]}); install faster-whisper"]
    r += ["", f"## Files", f"- sheet.jpg: 24 frames (scene changes, else evenly spaced), times (s): {times}",
          "- transcript.txt: full text with times"]
    open(os.path.join(out, "REPORT.md"), "w", encoding="utf-8").write("\n".join(r) + "\n")
    print("\n".join(r))
    print(f"\nSaved in {out}/  -> paste REPORT.md into Claude")
    return out


def pick_and_run():
    """Double-click mode: choose one or many videos in a window, then open the result folder(s)."""
    import shutil, tkinter as tk
    from tkinter import filedialog, messagebox
    root = tk.Tk()
    root.withdraw()
    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        messagebox.showerror("Video Analyzer", "ffmpeg is not installed.\nWindows: open PowerShell and run\n"
                             "winget install ffmpeg\nthen restart the computer and try again.")
        return
    paths = [a for a in sys.argv[1:] if not a.startswith("--")] or list(filedialog.askopenfilenames(
        title="Choose the videos to analyze (Ctrl+click or Ctrl+A for many)",
        filetypes=[("Videos", "*.mp4 *.mov *.mkv *.webm *.avi"), ("All", "*.*")]))
    if not paths:
        return
    done, failed = [], []
    for n, path in enumerate(paths, 1):
        print(f"\n[{n}/{len(paths)}] Analyzing {path} - keep this window open...")
        try:
            done.append(main(path, "--no-speech" not in sys.argv))
        except Exception as e:
            print("ERROR:", e)
            failed.append(f"{os.path.basename(path)}: {e}")
    if len(done) > 1:                          # one file with every report, to paste into Claude at once
        allp = os.path.join(os.path.dirname(done[0]), "ALL_REPORTS.md")
        with open(allp, "w", encoding="utf-8") as f:
            for d in done:
                f.write(open(os.path.join(d, "REPORT.md"), encoding="utf-8").read() + "\n---\n\n")
        msg = f"Done: {len(done)} videos.\nPaste ALL_REPORTS.md into Claude:\n{allp}"
    else:
        msg = f"Done! Paste REPORT.md into Claude.\n\nFolder:\n{done[0]}" if done else "Nothing finished."
    if failed:
        msg += "\n\nFailed:\n" + "\n".join(failed)
    messagebox.showinfo("Video Analyzer", msg)
    if done and os.name == "nt":
        os.startfile(os.path.dirname(done[0]) if len(done) > 1 else done[0])


if __name__ == "__main__":
    pick_and_run()
