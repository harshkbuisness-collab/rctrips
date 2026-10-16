# AI voiceover from a script with Kokoro (free, offline after the first download, Apache-2.0: fine for monetised videos).
# usage: python3 scripts/tts.py <script.txt> <out.wav> <voice> [speed]
#        python3 scripts/tts.py --sample <out.wav> <voice> [speed]
#        python3 scripts/tts.py --many <jobs.json>   [{"script": file, "out": wav, "voice": id, "speed": x}, ...]
#          makes all of them with the model loaded once (much faster for a batch); prints "DONE <i>" / "FAIL <i> <why>" per job
# The voice model (~350 MB) is downloaded once into .cache/kokoro/ the first time.
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(ROOT, '.cache', 'kokoro')
BASE = 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/'
FILES = ['voices-v1.0.bin', 'kokoro-v1.0.onnx']
SAMPLE = "You're doing these exercises wrong. Here's how to fix your form in thirty seconds."
SAMPLE_HI = 'Aap ye exercise galat kar rahe ho. Chaliye sahi tarika dekhte hain.'


def download():
    os.makedirs(MODEL_DIR, exist_ok=True)
    for f in FILES:
        dest = os.path.join(MODEL_DIR, f)
        if os.path.exists(dest) and os.path.getsize(dest) > 1_000_000:
            continue
        tmp = dest + '.part'
        # progress lines (the tool shows them), and a timeout so a dead connection never hangs forever
        with urllib.request.urlopen(BASE + f, timeout=60) as r, open(tmp, 'wb') as out:
            size = int(r.headers.get('Content-Length') or 0)
            got, shown = 0, -1
            while True:
                chunk = r.read(1 << 20)
                if not chunk:
                    break
                out.write(chunk)
                got += len(chunk)
                pct = int(got * 100 / size) if size else -1
                if pct // 5 != shown // 5:
                    shown = pct
                    print(f'Downloading the voice model once ({f}): {pct}% of {size // 1_000_000} MB', file=sys.stderr, flush=True)
        os.replace(tmp, dest)


def lang_of(voice):
    # first letter of the voice id: a = American, b = British, h = Hindi, e/f/i/j/p/z = other languages
    return {'a': 'en-us', 'b': 'en-gb', 'h': 'hi', 'e': 'es', 'f': 'fr-fr', 'i': 'it', 'j': 'ja', 'p': 'pt-br', 'z': 'cmn'}.get(voice[:1], 'en-us')


_model = None


def model():
    global _model
    if _model is None:
        try:
            import soundfile  # noqa: F401
            from kokoro_onnx import Kokoro
        except ImportError:
            sys.exit('The AI voice needs: pip install kokoro-onnx soundfile')
        download()
        _model = Kokoro(os.path.join(MODEL_DIR, 'kokoro-v1.0.onnx'), os.path.join(MODEL_DIR, 'voices-v1.0.bin'))
    return _model


def speak(text, out, voice, speed):
    k = model()
    import numpy as np
    import soundfile as sf
    if voice not in k.get_voices():
        raise ValueError(f'Unknown voice "{voice}"')
    # one sentence at a time (long texts lose quality), joined with a short natural pause
    parts = [p.strip() for p in re.split(r'(?<=[.!?])\s+', text.strip()) if p.strip()]
    audio, sr, segments, pos = [], 24000, [], 0
    for p in parts:
        samples, sr = k.create(p, voice=voice, speed=speed, lang=lang_of(voice))
        # where the speech starts and ends inside this sentence (the model adds a little silence around it)
        loud = np.flatnonzero(np.abs(samples) > max(0.02, float(np.abs(samples).max()) * 0.06))
        a, b = (int(loud[0]), int(loud[-1])) if len(loud) else (0, len(samples))
        # short silences inside the sentence (commas): [start, end] in seconds, longest first
        quiet = np.abs(samples[a:b]) < max(0.01, float(np.abs(samples).max()) * 0.03)
        pauses, run = [], None
        for i in range(0, len(quiet), int(sr * 0.01)):
            q = quiet[i:i + int(sr * 0.01)].all()
            if q and run is None: run = i
            if not q and run is not None:
                if i - run >= sr * 0.06: pauses.append([round((pos + a + run) / sr, 3), round((pos + a + i) / sr, 3)])
                run = None
        segments.append({'text': p, 'start': round((pos + a) / sr, 3), 'end': round((pos + b) / sr, 3),
                         'pauses': sorted(pauses, key=lambda x: x[0] - x[1])})
        audio.append(samples)
        pad = np.zeros(int(sr * 0.12), dtype=samples.dtype)
        audio.append(pad)
        pos += len(samples) + len(pad)
    sf.write(out, np.concatenate(audio), sr)
    # sentence times: the tool uses them to time the words when the speech aligner (pocketsphinx) is not installed
    with open(out + '.segments.json', 'w', encoding='utf-8') as f:
        json.dump({'segments': segments}, f)
    print(f'{out}: {pos / sr:.1f} s')


if __name__ == '__main__':
    a = sys.argv[1:]
    if not a:
        sys.exit(__doc__ if __doc__ else 'usage: tts.py <script.txt> <out.wav> <voice> [speed]')
    if a[0] == '--many':
        jobs = json.load(open(a[1], encoding='utf-8'))
        model()
        for i, j in enumerate(jobs):
            try:
                speak(open(j['script'], encoding='utf-8').read(), j['out'], j['voice'], float(j.get('speed', 1.1)))
                print(f'DONE {i}', flush=True)
            except Exception as e:  # one bad script never stops the others
                print(f'FAIL {i} {e}', flush=True)
    elif a[0] == '--sample':
        out, voice = a[1], a[2]
        speak(SAMPLE_HI if voice.startswith('h') else SAMPLE, out, voice, float(a[3]) if len(a) > 3 else 1.1)
    else:
        text = open(a[0], encoding='utf-8').read()
        speak(text, a[1], a[2], float(a[3]) if len(a) > 3 else 1.1)
