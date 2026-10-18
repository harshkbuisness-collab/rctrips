"""Voice Studio: paste many scripts (each inside double quotes) and get one voice file per script.

Start the app:      python voice_studio.py            (opens in your web browser)
Without the app:    python voice_studio.py scripts.txt

Inside a script you can set the feeling with a tag in square brackets. It applies from there on,
until the next tag:  [calm] [serious] [sarcastic] [dramatic] [excited] [neutral]
A blank line inside a script gives a longer pause.

Two speeds: "fast" (Turbo model, over 2x faster, tags ignored: the feeling then comes only from
the voice sample) and "quality" (emotion tags work). With an NVIDIA card or on Google Colab it is much faster.
While it runs, the page shows a progress bar with the time left, and every finished voice can be
played and downloaded right away. Add --fast to use it without the app,
and --share to get a public link (for running on a free Google Colab GPU).

Output (folder "output"): script_01.wav, script_01.json (each sentence with its start/end time), ...
plus all_voices.zip. Finished sentences are remembered in "cache", so if you stop and start again,
it continues where it left off.
"""
import hashlib, json, os, re, sys, time, zipfile

import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
REF_VOICE = os.path.join(HERE, "ref_voice.wav")
OUT_DIR = os.path.join(HERE, "output")
CACHE_DIR = os.path.join(HERE, "cache")
SR = 24000
# feeling -> (exaggeration, cfg_weight): more exaggeration = more emotion, lower cfg = slower, more deliberate
EMOTIONS = {"neutral": (0.45, 0.5), "calm": (0.4, 0.5), "serious": (0.45, 0.5), "sarcastic": (0.5, 0.5),
            "dramatic": (0.55, 0.45), "excited": (0.6, 0.45)}   # calm narrator (owner approved, 18 Oct 2026)
PAUSE, PAUSE_LONG, PAUSE_PARAGRAPH = 0.25, 0.45, 0.7      # seconds after a sentence / "?" or "..." / blank line
MAX_CHARS = 280                                            # longer sentences are split at commas

_models = {}


def model(fast=False):
    """Loads a model once and reads the voice sample once (not again for every sentence)."""
    if fast not in _models:
        import torch
        device = "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"
        torch.set_num_threads(os.cpu_count() or 4)
        print(f"Loading the {'fast' if fast else 'quality'} voice model on {device} "
              "(the first time it downloads a few GB)...", flush=True)
        if fast:
            from chatterbox.tts_turbo import ChatterboxTurboTTS
            m = ChatterboxTurboTTS.from_pretrained(device=device)
        else:
            from chatterbox.tts import ChatterboxTTS
            m = ChatterboxTTS.from_pretrained(device=device)
        m.prepare_conditionals(REF_VOICE)
        _models[fast] = m
    return _models[fast]


# ---------- reading the scripts ----------
def split_scripts(text):
    """Every piece of text inside double quotes ("..." or the curly “...”) is one script."""
    text = text.replace("“", '"').replace("”", '"')
    return [s.strip() for s in re.findall(r'"([^"]+)"', text) if s.strip()]


def split_sentences(script, default_emotion="neutral"):
    """Returns [(sentence, emotion, pause_after)]."""
    out, emo = [], default_emotion
    for para in re.split(r"\n\s*\n", script):
        para = " ".join(para.split())
        pieces = re.split(r"(\[\w+\])", para)
        sents = []
        for piece in pieces:
            m = re.fullmatch(r"\[(\w+)\]", piece)
            if m:
                tag = m.group(1).lower()
                if tag not in EMOTIONS:
                    raise ValueError(f"Unknown feeling [{tag}]. Use one of: {', '.join(EMOTIONS)}")
                emo = tag
                continue
            for s in re.split(r"(?<=[.!?])\s+", piece.strip()):
                if s:
                    for chunk in split_long(s):
                        sents.append([chunk, emo, PAUSE_LONG if chunk.endswith(("?", "...", "…")) else PAUSE])
        if sents:
            sents[-1][2] = PAUSE_PARAGRAPH
            out += [tuple(s) for s in sents]
    return out


def split_long(s):
    if len(s) <= MAX_CHARS:
        return [s]
    parts, cur = [], ""
    for p in re.split(r"(?<=,)\s+", s):
        if cur and len(cur) + len(p) > MAX_CHARS:
            parts.append(cur)
            cur = p
        else:
            cur = (cur + " " + p).strip()
    return parts + [cur]


# ---------- speaking ----------
def trim(a, thr=0.01, pad=0.04):
    idx = np.where(np.abs(a) > thr)[0]
    if not len(idx):
        return a
    p = int(pad * SR)
    return a[max(0, idx[0] - p): idx[-1] + p]


def speak(sentence, emotion, seed, fast=False):
    ex, cfg = EMOTIONS[emotion] if not fast else ("turbo", "")
    os.makedirs(CACHE_DIR, exist_ok=True)
    key = hashlib.sha1(f"{sentence}|{ex}|{cfg}|{seed}|{os.path.getsize(REF_VOICE)}".encode()).hexdigest()[:20]
    path = os.path.join(CACHE_DIR, key + ".wav")
    if not os.path.exists(path):
        import torch
        torch.manual_seed(seed)
        m = model(fast)
        wav = m.generate(sentence) if fast else m.generate(sentence, exaggeration=ex, cfg_weight=cfg)
        sf.write(path, wav.squeeze(0).cpu().numpy(), m.sr)
    a, _ = sf.read(path, dtype="float32")
    return trim(a)


def save_voice(script, number, parts):
    """parts = [(sentence, emotion, pause, audio)] -> script_NN.wav + script_NN.json."""
    audio, t, timing = [np.zeros(int(0.2 * SR), dtype=np.float32)], 0.2, []
    for s, emo, pause, a in parts:
        timing.append({"text": s, "emotion": emo, "start": round(t, 3), "end": round(t + len(a) / SR, 3)})
        audio += [a, np.zeros(int(pause * SR), dtype=np.float32)]
        t += len(a) / SR + pause
    full = np.concatenate(audio)
    try:                                   # soften the sharp top end so the voice is easy on the ears
        from scipy.signal import butter, sosfilt
        full = sosfilt(butter(2, 9500, "low", fs=SR, output="sos"), full).astype(np.float32)
    except Exception:
        pass
    try:                                   # even loudness for every file (-16 LUFS)
        import pyloudnorm
        full = pyloudnorm.normalize.loudness(full, pyloudnorm.Meter(SR).integrated_loudness(full), -16.0)
    except Exception:
        pass
    full = np.clip(full, -0.99, 0.99).astype(np.float32)
    os.makedirs(OUT_DIR, exist_ok=True)
    base = os.path.join(OUT_DIR, f"script_{number:02d}")
    sf.write(base + ".wav", full, SR)
    json.dump({"script": script, "duration": round(len(full) / SR, 3), "sentences": timing},
              open(base + ".json", "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    return base + ".wav", base + ".json"


def clock(sec):
    sec = int(sec)
    return f"{sec // 3600}h {sec // 60 % 60:02d}m" if sec >= 3600 else f"{sec // 60}m {sec % 60:02d}s"


def generate_all(text, default_emotion="neutral", seed=1, fast=False):
    """Makes every script, yielding progress after each sentence:
    {"done": 0..1, "msg": str, "eta": str, "finished": [(number, wav, json)], "zip": path or None}"""
    scripts = split_scripts(text)
    if not scripts:
        raise ValueError('No scripts found. Put every script inside double quotes, like "This is my script."')
    plans = [split_sentences(s, default_emotion) for s in scripts]     # a typo in any script fails fast
    total = sum(len(x[0]) for p in plans for x in p)
    state = {"done": 0.0, "msg": "Loading the voice model...", "eta": "calculating...", "finished": [], "zip": None}
    yield state
    model(fast)
    done = work_chars = 0
    work_time, start = 0.0, time.time()
    for n, (script, plan) in enumerate(zip(scripts, plans), 1):
        parts = []
        for i, (s, emo, pause) in enumerate(plan, 1):
            t0 = time.time()
            a = speak(s, emo, seed, fast)
            if time.time() - t0 > 0.5:                     # not from the cache: counts for the time estimate
                work_time += time.time() - t0
                work_chars += len(s)
            parts.append((s, emo, pause, a))
            done += len(s)
            left = (total - done) * work_time / work_chars if work_chars else 0
            state.update(done=done / total, eta=clock(left) if work_chars else "calculating...",
                         msg=f"Script {n} of {len(scripts)}, sentence {i} of {len(plan)}  |  "
                             f"running for {clock(time.time() - start)}")
            yield state
        state["finished"].append((n, *save_voice(script, n, parts)))
        yield state
    zpath = os.path.join(OUT_DIR, "all_voices.zip")
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
        for _, w, j in state["finished"]:
            z.write(w, os.path.basename(w))
            z.write(j, os.path.basename(j))
    state.update(done=1.0, eta="0m 00s", zip=zpath,
                 msg=f"Finished all {len(scripts)} script(s) in {clock(time.time() - start)}. Files are in: {OUT_DIR}")
    yield state


# ---------- the app ----------
BAR = """<div style="font-family:sans-serif">
<div style="display:flex;justify-content:space-between;font-size:15px;margin-bottom:6px">
<b>{pct:.0f}% done</b><span>Time left: <b>{eta}</b></span></div>
<div style="background:#e5e5e5;border-radius:8px;height:22px;overflow:hidden">
<div style="background:#f97316;height:100%;width:{pct:.1f}%;transition:width .4s"></div></div>
<div style="font-size:13px;color:#666;margin-top:6px">{msg}</div></div>"""


def app(share=False):
    import gradio as gr

    def preview(text):
        scripts = split_scripts(text)
        if not scripts:
            return 'No scripts found yet. Put every script inside double quotes: "..."'
        lines = [f"Found {len(scripts)} script(s):"]
        for i, s in enumerate(scripts, 1):
            words = len(re.sub(r"\[\w+\]", "", s).split())
            lines.append(f"  {i:02d}. {words} words (about {words / 150:.1f} min of voice): {" ".join(s.split())[:70]}...")
        return "\n".join(lines)

    def choices(finished):
        return [f"Script {n:02d}" for n, _, _ in finished]

    def run(text, emotion, seed, speed):
        try:
            for st in generate_all(text, emotion, int(seed), fast=speed.startswith("Fast")):
                done = st["finished"]
                files = [f for _, w, j in done for f in (w, j)] + ([st["zip"]] if st["zip"] else [])
                latest = done[-1][1] if done else None
                yield (BAR.format(pct=st["done"] * 100, eta=st["eta"], msg=st["msg"]), files or None,
                       gr.update(choices=choices(done), value=f"Script {done[-1][0]:02d}" if done else None),
                       latest)
        except ValueError as e:
            raise gr.Error(str(e))

    def listen(name):
        if not name:
            return None
        path = os.path.join(OUT_DIR, f"script_{name.split()[-1]}.wav")
        return path if os.path.exists(path) else None

    with gr.Blocks(title="Voice Studio") as ui:
        gr.Markdown("# Voice Studio\nPaste all your scripts. **Each script must be inside double quotes \"...\"**. "
                    "Feelings (Quality speed only): `[excited]` `[sarcastic]` `[dramatic]` `[calm]` `[serious]`.")
        text = gr.Textbox(label="Your scripts", lines=14,
                          placeholder='"[calm] First script goes here. [excited] This part sounds excited!"\n\n"Second script..."')
        found = gr.Textbox(label="What the tool found", lines=5, interactive=False)
        with gr.Row():
            speed = gr.Radio(["Fast (over 2x faster, feeling tags ignored)", "Quality (feeling tags work, slower)"],
                             value="Fast (over 2x faster, feeling tags ignored)", label="Speed")
            emotion = gr.Dropdown(list(EMOTIONS), value="neutral", label="Feeling when a script has no tag")
            seed = gr.Number(value=1, precision=0, label="Take number (change for a different take)")
        go = gr.Button("Make all voices", variant="primary")
        bar = gr.HTML(BAR.format(pct=0, eta="-", msg="Waiting to start"))
        gr.Markdown("### Finished voices (you can listen and download while the rest are being made)")
        with gr.Row():
            pick = gr.Dropdown([], label="Listen to")
            player = gr.Audio(label="Player", type="filepath")
        files = gr.File(label="Download (each .wav with its .json, and all_voices.zip at the end)", file_count="multiple")
        text.change(preview, text, found)
        go.click(run, [text, emotion, seed, speed], [bar, files, pick, player])
        pick.change(listen, pick, player, concurrency_limit=None)
    ui.queue().launch(inbrowser=not share, share=share)


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if args:
        for st in generate_all(open(args[0], encoding="utf-8").read(), fast="--fast" in sys.argv):
            print(f"{st['done'] * 100:5.1f}%  time left {st['eta']:>14}  {st['msg']}", flush=True)
    else:
        app(share="--share" in sys.argv)
