"""Vertical YouTube Short (1080x1920) cut from a finished long video, in the brand look: green background, the clip in the
middle, a 2-line title on top, word-group captions under it, and a 3 s end card pointing to the full video.
Usage: python3 tools/make_short.py videos/<slug> START END "TITLE LINE 1" "TITLE LINE 2" [out.mp4]
START/END in seconds of the long video (cut on sentence ends: see 03_voice/timings.json)."""
import json, os, subprocess, sys

vdir, a, b, t1, t2 = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4], sys.argv[5]
slug = os.path.basename(vdir.rstrip("/"))
out = sys.argv[6] if len(sys.argv) > 6 else os.path.join(vdir, "05_export", f"{slug}_short.mp4")
src = os.path.join(vdir, "05_export", f"{slug}.mp4")
END = 3.0
dur = b - a

# captions from the beats that fall inside the clip, split into groups of about 4 words
times = json.load(open(os.path.join(vdir, "03_voice", "timings.json")))
lines = [l.strip().split("||")[0].strip() for l in open(os.path.join(vdir, "01_script", "beats.txt"))
         if l.strip() and not l.strip().startswith("#")]
def ts(x):
    return f"{int(x // 3600)}:{int(x % 3600 // 60):02d}:{x % 60:05.2f}"
ev = []
for x in times:
    s, e = x["start"], x["end"]
    if e <= a or s >= b or x["beat"] >= len(lines) or not lines[x["beat"]]:
        continue
    words = lines[x["beat"]].split()
    groups = [words[i:i + 4] for i in range(0, len(words), 4)]
    n = sum(len(g) for g in groups)
    t = s
    for g in groups:
        d = (e - s) * len(g) / n
        if t + d > a and t < b:
            ev.append(f"Dialogue: 0,{ts(max(0, t - a))},{ts(min(dur, t + d - a))},Cap,,0,0,0,,{' '.join(g).upper()}")
        t += d
ass = f"""[Script Info]
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: T1,DejaVu Sans,96,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,6,0,8,40,40,250,1
Style: T2,DejaVu Sans,96,&H00FFFFFF,&H00FFFFFF,&H002827D6,&H002827D6,1,0,0,0,100,100,0,0,3,18,0,8,40,40,380,1
Style: Cap,DejaVu Sans,74,&H0000D7FF,&H0000D7FF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,6,0,8,60,60,1300,1
Style: End,DejaVu Sans,84,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,5,0,5,80,80,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,{ts(0)},{ts(dur)},T1,,0,0,0,,{t1}
Dialogue: 0,{ts(0)},{ts(dur)},T2,,0,0,0,,{t2}
""" + "\n".join(ev) + f"""
Dialogue: 0,{ts(dur)},{ts(dur + END)},End,,0,0,0,,THE FULL STORY\\NIS ON OUR CHANNEL\\N\\N{{\\c&H0000D7FF&}}DOLLAR DIARIES
"""
af = out[:-4] + ".ass"
open(af, "w").write(ass)
fc = (f"color=c=0x0F3D2A:s=1080x1920:d={dur + END}[bg];"
      f"[0:v]trim={a}:{b},setpts=PTS-STARTPTS,scale=1080:-2[v];"
      f"[bg][v]overlay=0:560:eof_action=pass[o];[o]ass={af}[out];"
      f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=out:st={dur - 0.6}:d=0.6,apad=pad_dur={END}[aout]")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-filter_complex", fc, "-map", "[out]", "-map", "[aout]",
                "-t", str(dur + END), "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-c:a", "aac", "-b:a", "160k",
                "-pix_fmt", "yuv420p", out], check=True)
os.remove(af)
print(out)
