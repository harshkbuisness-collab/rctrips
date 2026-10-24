"""Speaks a list of lines with Chatterbox (emotion control), copying the voice in a reference clip.

Usage (run with the Python that has chatterbox-tts installed): python chatterbox_tts.py jobs.json
jobs.json = {"ref": "voice.wav", "jobs": [{"text": ..., "ex": 0.5, "cfg": 0.5, "out": "x.wav"}, ...]}
Called by make_video.py when CHATTERBOX_PY is set. Output is 24 kHz mono, like Kokoro.
"""
import json, sys
import soundfile as sf
import torch
from chatterbox.tts import ChatterboxTTS

spec = json.load(open(sys.argv[1]))
model = ChatterboxTTS.from_pretrained(device="cpu")
for n, j in enumerate(spec["jobs"], 1):
    torch.manual_seed(1)                      # same text + emotion -> same take
    wav = model.generate(j["text"], audio_prompt_path=spec["ref"], exaggeration=j["ex"], cfg_weight=j["cfg"])
    sf.write(j["out"], wav.squeeze(0).numpy(), model.sr)
    print(f"voice {n}/{len(spec['jobs'])}", flush=True)
