"""Make the channel voice for a script with Kokoro (free, offline), so the owner does not have to.

Usage: python3 tools/make_voice.py scripts/dayNN_x.md [voices/dayNN.mp3]
Speaks every spoken line (tags like [calm] removed) with VOICE at SPEED, a short pause between sentences
and a longer one between chapters. Model files: tools/voice_studio/kokoro/ (or $KOKORO_DIR).
"""
import os, re, subprocess, sys
import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "sheet"))
import parse_script

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KDIR = os.environ.get("KOKORO_DIR", os.path.join(ROOT, "tools", "voice_studio", "kokoro"))
VOICE, SPEED = os.environ.get("VOICE", "am_michael"), 1.15  # owner, 25 Oct 2026: male, faster pace
GAP, GAP_CHAPTER, GAP_PUNCH = 0.25, 0.6, 0.55   # longer pause after short punch lines ("Except they didn't.")


def main(script, out):
    from kokoro_onnx import Kokoro
    k = Kokoro(os.path.join(KDIR, "kokoro-v1.0.onnx"), os.path.join(KDIR, "voices-v1.0.bin"))
    parts, sr, chap = [], 24000, None
    for ln in parse_script.parse(script)["lines"]:
        text = re.sub(r"^\s*\[[a-z]+\]\s*", "", ln["text"]).strip()
        if not text:
            continue
        if chap is not None and ln["chap"] != chap:
            parts.append(np.zeros(int(GAP_CHAPTER * sr), dtype=np.float32))
        chap = ln["chap"]
        for s in re.split(r"(?<=[.!?])\s+", text):
            a, sr = k.create(s, voice=VOICE, speed=SPEED, lang="en-us")
            gap = GAP_PUNCH if len(s.split()) <= 4 else GAP
            parts += [a.astype(np.float32), np.zeros(int(gap * sr), dtype=np.float32)]
    wav = out.rsplit(".", 1)[0] + ".wav"
    sf.write(wav, np.concatenate(parts), sr)
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", wav, "-b:a", "192k", out], check=True)
    os.remove(wav)
    print(f"voice: {out} ({sum(len(p) for p in parts) / sr / 60:.1f} min)")


if __name__ == "__main__":
    s = sys.argv[1]
    day = re.search(r"day(\d+)", os.path.basename(s)).group(1)
    main(s, sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, "voices", f"day{day}.mp3"))
