"""Voice Studio: paste many scripts (each inside double quotes) and get one voice file per script.

Start the app:      python voice_studio.py            (opens in your web browser)
Without the app:    python voice_studio.py scripts.txt

Inside a script you can set the feeling with a tag in square brackets. It applies from there on,
until the next tag:  [calm] [serious] [sarcastic] [dramatic] [excited] [neutral]
A blank line inside a script gives a longer pause.

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
EMOTIONS = {"neutral": (0.7, 0.4), "calm": (0.6, 0.45), "serious": (0.7, 0.4), "sarcastic": (0.85, 0.35),
            "dramatic": (1.0, 0.3), "excited": (1.15, 0.3)}
PAUSE, PAUSE_LONG, PAUSE_PARAGRAPH = 0.25, 0.45, 0.7      # seconds after a sentence / "?" or "..." / blank line
MAX_CHARS = 280                                            # longer sentences are split at commas

_model = None


def model():
    global _model
    if _model is None:
        import torch
        from chatterbox.tts import ChatterboxTTS
        device = "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"
        print(f"Loading the voice model on {device} (first time downloads about 3 GB)...", flush=True)
        _model = ChatterboxTTS.from_pretrained(device=device)
    return _model


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


def speak(sentence, emotion, seed):
    ex, cfg = EMOTIONS[emotion]
    os.makedirs(CACHE_DIR, exist_ok=True)
    key = hashlib.sha1(f"{sentence}|{ex}|{cfg}|{seed}|{os.path.getsize(REF_VOICE)}".encode()).hexdigest()[:20]
    path = os.path.join(CACHE_DIR, key + ".wav")
    if not os.path.exists(path):
        import torch
        torch.manual_seed(seed)
        m = model()
        wav = m.generate(sentence, audio_prompt_path=REF_VOICE, exaggeration=ex, cfg_weight=cfg)
        sf.write(path, wav.squeeze(0).cpu().numpy(), m.sr)
    a, _ = sf.read(path, dtype="float32")
    return trim(a)


def make_voice(script, number, default_emotion="neutral", seed=1, log=print):
    sents = split_sentences(script, default_emotion)
    audio, t, timing = [np.zeros(int(0.2 * SR), dtype=np.float32)], 0.2, []
    for i, (s, emo, pause) in enumerate(sents, 1):
        log(f"Script {number}: sentence {i}/{len(sents)} [{emo}]")
        a = speak(s, emo, seed)
        timing.append({"text": s, "emotion": emo, "start": round(t, 3), "end": round(t + len(a) / SR, 3)})
        audio += [a, np.zeros(int(pause * SR), dtype=np.float32)]
        t += len(a) / SR + pause
    full = np.concatenate(audio)
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


def make_all(text, default_emotion="neutral", seed=1, log=print):
    scripts = split_scripts(text)
    if not scripts:
        raise ValueError('No scripts found. Put every script inside double quotes, like "This is my script."')
    for i, s in enumerate(scripts, 1):           # check every script first, so a typo fails fast
        split_sentences(s, default_emotion)
    files, start = [], time.time()
    for i, s in enumerate(scripts, 1):
        files += make_voice(s, i, default_emotion, seed, log)
        log(f"Done {i}/{len(scripts)} scripts ({(time.time() - start) / 60:.1f} min so far)")
    zpath = os.path.join(OUT_DIR, "all_voices.zip")
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
        for f in files:
            z.write(f, os.path.basename(f))
    return zpath, files, len(scripts)


# ---------- the app ----------
def app():
    import gradio as gr

    def preview(text):
        scripts = split_scripts(text)
        if not scripts:
            return 'No scripts found yet. Put every script inside double quotes: "..."'
        lines = [f"Found {len(scripts)} script(s):"]
        for i, s in enumerate(scripts, 1):
            words = len(re.sub(r"\[\w+\]", "", s).split())
            lines.append(f"  {i:02d}. {words} words (about {words / 150:.1f} min of voice): {s[:70]}...")
        return "\n".join(lines)

    def run(text, emotion, seed, progress=gr.Progress()):
        msgs = []
        def log(m):
            msgs.append(m)
            progress(0, desc=m)
        try:
            zpath, files, n = make_all(text, emotion, int(seed), log)
        except ValueError as e:
            raise gr.Error(str(e))
        wavs = [f for f in files if f.endswith(".wav")]
        return f"Finished {n} script(s). Files are in: {OUT_DIR}", zpath, wavs[0] if wavs else None

    with gr.Blocks(title="Voice Studio") as ui:
        gr.Markdown("# Voice Studio\nPaste all your scripts. **Each script must be inside double quotes \"...\"**. "
                    "Add feelings with tags like `[excited]`, `[sarcastic]`, `[dramatic]`, `[calm]`, `[serious]`.")
        text = gr.Textbox(label="Your scripts", lines=18,
                          placeholder='"[calm] First script goes here. [excited] This part sounds excited!"\n\n"Second script..."')
        found = gr.Textbox(label="What the tool found", lines=6, interactive=False)
        with gr.Row():
            emotion = gr.Dropdown(list(EMOTIONS), value="neutral", label="Feeling when a script has no tag")
            seed = gr.Number(value=1, precision=0, label="Take number (change it to get a different take)")
        go = gr.Button("Make all voices", variant="primary")
        status = gr.Textbox(label="Status", interactive=False)
        zfile = gr.File(label="Download all voices (zip)")
        listen = gr.Audio(label="Listen to script 1", type="filepath")
        text.change(preview, text, found)
        go.click(run, [text, emotion, seed], [status, zfile, listen])
    ui.queue().launch(inbrowser=True)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        zpath, _, n = make_all(open(sys.argv[1], encoding="utf-8").read())
        print(f"Finished {n} script(s): {zpath}")
    else:
        app()
