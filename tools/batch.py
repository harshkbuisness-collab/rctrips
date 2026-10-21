"""Make many videos in one run: screenshots -> beats -> layout check -> render, one day after another.

Usage: python3 tools/batch.py 2 3 4 5 6          (day numbers; "all" = every script in scripts/)
       python3 tools/batch.py 2 --no-render      (stop after the layout check)
Inputs:  scripts/dayNN_<name>.md and the owner's voice at voices/dayNN.mp3 (or .wav/.m4a).
Outputs: videos/dayNN_<name>/05_export/dayNN_<name>.mp4, and a summary in videos/batch_log.txt.
A day whose video already exists is skipped; delete the mp4 to make it again. A day without a voice
file stops after the layout check.
"""
import glob, os, shutil, subprocess, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
import get_screens, get_photos, script_to_beats

LOG = os.path.join(ROOT, "videos", "batch_log.txt")


def log(msg):
    line = time.strftime("%Y-%m-%d %H:%M ") + msg
    print(line, flush=True)
    open(LOG, "a").write(line + "\n")


def voice_of(day):
    for ext in ("mp3", "wav", "m4a", "flac", "ogg"):
        p = os.path.join(ROOT, "voices", f"day{day:02d}.{ext}")
        if os.path.exists(p):
            return p
    return ""


def run_day(script, render=True):
    name = os.path.basename(script)[:-3]
    day = int(name[3:5])
    vdir = os.path.join(ROOT, "videos", name)
    mp4 = os.path.join(vdir, "05_export", f"{name}.mp4")
    if os.path.exists(mp4):
        return log(f"day {day}: video already made, skipped")
    bad = get_screens.main(script, vdir)
    try:
        get_photos.main(script, vdir)                 # free real photos from Wikimedia Commons
    except Exception as e:
        print('photos skipped:', e)
    script_to_beats.main(script, vdir)
    mv = [sys.executable, os.path.join(ROOT, "tools", "make_video.py"), vdir]
    chk = subprocess.run(mv + ["--check"], capture_output=True, text=True)
    warns = [l for l in chk.stdout.splitlines() if l.startswith("beat ") and "only" not in l]
    note = f"{len(bad)} screenshots failed ({', '.join(c['file'] for c in bad)})" if bad else "all screenshots ok"
    v = voice_of(day)
    if not render or not v:
        return log(f"day {day}: checked, {note}, {len(warns)} layout warnings" + ("" if v else ", NO VOICE FILE"))
    os.makedirs(os.path.join(vdir, "03_voice"), exist_ok=True)
    for old in glob.glob(os.path.join(vdir, "03_voice", "owner_voice.*")):
        os.remove(old)
    shutil.copy(v, os.path.join(vdir, "03_voice", "owner_voice" + os.path.splitext(v)[1]))
    t = time.time()
    r = subprocess.run(mv, capture_output=True, text=True)
    if r.returncode or not os.path.exists(mp4):
        err = (r.stderr or r.stdout).strip().splitlines()[-1:] or ["?"]
        return log(f"day {day}: RENDER FAILED: {err[0][:200]}")
    log(f"day {day}: done in {(time.time() - t) / 60:.0f} min, {note}, {len(warns)} layout warnings -> {mp4}")


def main(args):
    render = "--no-render" not in args
    days = [a for a in args if not a.startswith("--")]
    scripts = sorted(glob.glob(os.path.join(ROOT, "scripts", "day*.md")))
    if days != ["all"]:
        want = {int(d) for d in days}
        scripts = [s for s in scripts if int(os.path.basename(s)[3:5]) in want]
    for s in scripts:
        try:
            run_day(s, render)
        except Exception as e:
            log(f"{os.path.basename(s)}: ERROR {e}")


if __name__ == "__main__":
    main(sys.argv[1:])
