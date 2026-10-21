"""Voice providers. Each one turns a short piece of text into one audio file.

Every provider has the same small interface:
    available() -> (ok, reason)       can it run on this computer right now?
    voices()    -> [{"id", "name", "gender", "accent"}]
    synth(text, voice, speed, path)   writes one audio chunk to `path` (async)
    ext                               file type it writes ("mp3" or "wav")
    max_chars                         longest text it should get in one call
    parallel                          how many calls may run at the same time

Speed is a number: 1.0 = normal, 0.5 = half speed, 2.0 = twice as fast.
"""
import asyncio, json, os, shutil, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)                       # tools/voice_studio
CONFIG = os.path.join(ROOT, "config.json")         # API keys you type in the app (never committed)


def setting(name):
    """An API key or option: environment variable first, then config.json."""
    if os.environ.get(name):
        return os.environ[name]
    try:
        return json.load(open(CONFIG)).get(name, "")
    except Exception:
        return ""


def save_settings(values):
    try:
        cur = json.load(open(CONFIG))
    except Exception:
        cur = {}
    cur.update({k: v for k, v in values.items() if v is not None})
    json.dump(cur, open(CONFIG, "w"), indent=1)


def _proxy():
    return os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy") or None


def _fix_certs():
    """Behind a company proxy with its own certificate, point SSL_CERT_FILE at it (optional)."""
    ca = os.environ.get("SSL_CERT_FILE")
    if ca and os.path.exists(ca):
        try:
            import certifi
            certifi.where = lambda: ca
        except ImportError:
            pass


def clamp(v, lo, hi):
    return max(lo, min(hi, v))


class ProviderError(Exception):
    """A clear message for the user (bad key, unknown voice, no internet...)."""


# ---------------------------------------------------------------------------------------------
class Edge:
    id, name, ext, max_chars, parallel = "edge", "Microsoft Edge voices (free, no key)", "mp3", 800, 12
    note = "Natural Microsoft neural voices. Free, fast, needs internet."
    _cache = None

    def available(self):
        try:
            import edge_tts  # noqa: F401
            return True, ""
        except ImportError:
            return False, "Install it: pip install edge-tts"

    async def voices(self):
        if Edge._cache is None:
            _fix_certs()
            import edge_tts
            vs = await edge_tts.list_voices(proxy=_proxy())
            Edge._cache = [{"id": v["ShortName"], "name": v["ShortName"].split("-")[-1].replace("Neural", ""),
                            "gender": v.get("Gender", ""), "accent": v["Locale"]}
                           for v in vs if v["Locale"].startswith("en-")]
            Edge._cache.sort(key=lambda v: (v["accent"] != "en-US", v["accent"], v["name"]))
        return Edge._cache

    async def synth(self, text, voice, speed, path):
        _fix_certs()
        import edge_tts
        rate = f"{round((clamp(speed, 0.5, 2.0) - 1) * 100):+d}%"
        try:
            c = edge_tts.Communicate(text, voice, rate=rate, proxy=_proxy())
            await c.save(path)
        except edge_tts.exceptions.NoAudioReceived:
            raise ProviderError(f"Edge returned no audio for voice '{voice}'. Check the voice name.")
        if not os.path.exists(path) or os.path.getsize(path) < 200:
            raise ProviderError("Edge returned an empty file.")


# ---------------------------------------------------------------------------------------------
class OpenAI:
    id, name, ext, max_chars, parallel = "openai", "OpenAI voices (API key)", "mp3", 3800, 4
    note = "Very natural voices. Needs an OpenAI API key (paid per character)."
    VOICES = ["alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer", "verse"]
    MODEL = "gpt-4o-mini-tts"

    def available(self):
        return (True, "") if setting("OPENAI_API_KEY") else (False, "Add your OPENAI_API_KEY in Settings")

    async def voices(self):
        return [{"id": v, "name": v.title(), "gender": "", "accent": "en"} for v in self.VOICES]

    async def synth(self, text, voice, speed, path):
        import aiohttp
        body = {"model": setting("OPENAI_TTS_MODEL") or self.MODEL, "voice": voice, "input": text,
                "speed": clamp(speed, 0.25, 4.0), "response_format": "mp3"}
        hdr = {"Authorization": f"Bearer {setting('OPENAI_API_KEY')}"}
        async with aiohttp.ClientSession() as s:
            async with s.post("https://api.openai.com/v1/audio/speech", json=body, headers=hdr,
                              proxy=_proxy(), timeout=aiohttp.ClientTimeout(total=180)) as r:
                if r.status != 200:
                    raise ProviderError(f"OpenAI error {r.status}: {(await r.text())[:200]}")
                open(path, "wb").write(await r.read())


# ---------------------------------------------------------------------------------------------
class ElevenLabs:
    id, name, ext, max_chars, parallel = "elevenlabs", "ElevenLabs voices (API key)", "mp3", 2400, 3
    note = "Most expressive voices, including your own cloned voice. Needs an ElevenLabs API key."
    _cache = None

    def available(self):
        return (True, "") if setting("ELEVENLABS_API_KEY") else (False, "Add your ELEVENLABS_API_KEY in Settings")

    async def voices(self):
        if ElevenLabs._cache is None:
            import aiohttp
            async with aiohttp.ClientSession() as s:
                async with s.get("https://api.elevenlabs.io/v1/voices", proxy=_proxy(),
                                 headers={"xi-api-key": setting("ELEVENLABS_API_KEY")}) as r:
                    if r.status != 200:
                        raise ProviderError(f"ElevenLabs error {r.status}: {(await r.text())[:200]}")
                    data = await r.json()
            ElevenLabs._cache = [{"id": v["voice_id"], "name": v["name"],
                                  "gender": (v.get("labels") or {}).get("gender", ""),
                                  "accent": (v.get("labels") or {}).get("accent", "")} for v in data.get("voices", [])]
        return ElevenLabs._cache

    async def synth(self, text, voice, speed, path):
        import aiohttp
        model = setting("ELEVENLABS_MODEL") or "eleven_multilingual_v2"
        body = {"text": text, "model_id": model, "voice_settings": {"speed": clamp(speed, 0.7, 1.2)}}
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128"
        async with aiohttp.ClientSession() as s:
            async with s.post(url, json=body, headers={"xi-api-key": setting("ELEVENLABS_API_KEY")},
                              proxy=_proxy(), timeout=aiohttp.ClientTimeout(total=300)) as r:
                if r.status != 200:
                    raise ProviderError(f"ElevenLabs error {r.status}: {(await r.text())[:200]}")
                open(path, "wb").write(await r.read())


# ---------------------------------------------------------------------------------------------
class Kokoro:
    id, name, ext, max_chars, parallel = "kokoro", "Kokoro (offline, free)", "wav", 400, 1
    note = "Runs on your own computer, no internet. Needs the Kokoro model files (KOKORO_DIR)."
    _model = None

    def _dir(self):
        return setting("KOKORO_DIR") or os.path.join(ROOT, "kokoro")

    def available(self):
        try:
            import kokoro_onnx  # noqa: F401
        except ImportError:
            return False, "Install it: pip install kokoro-onnx soundfile"
        if not os.path.exists(os.path.join(self._dir(), "kokoro-v1.0.onnx")):
            return False, "Put kokoro-v1.0.onnx and voices-v1.0.bin in tools/voice_studio/kokoro (see README)"
        return True, ""

    def _load(self):
        if Kokoro._model is None:
            from kokoro_onnx import Kokoro as K
            d = self._dir()
            Kokoro._model = K(os.path.join(d, "kokoro-v1.0.onnx"), os.path.join(d, "voices-v1.0.bin"))
        return Kokoro._model

    async def voices(self):
        names = sorted(self._load().get_voices())
        return [{"id": v, "name": v.split("_", 1)[-1].title(), "gender": "female" if v[1:2] == "f" else "male",
                 "accent": "en-US" if v.startswith("a") else "en-GB" if v.startswith("b") else v[:1]}
                for v in names if v[:1] in "ab"]

    async def synth(self, text, voice, speed, path):
        import soundfile as sf

        def run():
            a, sr = self._load().create(text, voice=voice, speed=clamp(speed, 0.5, 2.0), lang="en-us")
            sf.write(path, a, sr)
        await asyncio.to_thread(run)


# ---------------------------------------------------------------------------------------------
class Chatterbox:
    id, name, ext, max_chars, parallel = "chatterbox", "Chatterbox (your cloned voice, offline)", "wav", 280, 1
    note = "Copies the voice in a sample file (ref_voice.wav or any .wav in voice_samples/). Slow without an NVIDIA card."

    def available(self):
        try:
            import chatterbox  # noqa: F401
            return True, ""
        except ImportError:
            return False, "Install it with 3_INSTALL_cloned_voice_windows.bat (or pip install chatterbox-tts)"

    async def voices(self):
        out = [{"id": os.path.join(ROOT, "ref_voice.wav"), "name": "Channel voice (ref_voice.wav)",
                "gender": "", "accent": "clone"}]
        d = os.path.join(ROOT, "voice_samples")
        for f in sorted(os.listdir(d)) if os.path.isdir(d) else []:
            if f.lower().endswith(".wav"):
                out.append({"id": os.path.join(d, f), "name": f[:-4], "gender": "", "accent": "clone"})
        return out

    async def synth(self, text, voice, speed, path):
        import soundfile as sf
        import sys
        sys.path.insert(0, ROOT)
        import voice_studio as old          # reuse the original Voice Studio model code

        def run():
            m = old.model(False)
            if getattr(old, "_ref", old.REF_VOICE) != voice:     # switch the copied voice
                m.prepare_conditionals(voice)
            old._ref = old.REF_VOICE = voice                        # REF_VOICE is part of the cache key
            a = old.speak(text, "calm", 1)
            sf.write(path, a, old.SR)
        await asyncio.to_thread(run)
        if abs(speed - 1) > 0.01:
            retime(path, speed)


# ---------------------------------------------------------------------------------------------
class Mock:
    """Test-only provider (STUDIO_TEST=1): makes a short tone, fails on the word FAIL."""
    id, name, ext, max_chars, parallel = "mock", "Test tone (offline test)", "wav", 200, 8
    note = "Only for automatic tests."
    fail_words = {"FAIL"}

    def available(self):
        return True, ""

    async def voices(self):
        return [{"id": "low", "name": "Low", "gender": "", "accent": "test"},
                {"id": "high", "name": "High", "gender": "", "accent": "test"}]

    async def synth(self, text, voice, speed, path):
        import numpy as np, soundfile as sf
        await asyncio.sleep(0.05)
        if any(w in text for w in self.fail_words):
            raise ProviderError("Test failure (the text contains FAIL)")
        sr, f = 24000, 220 if voice == "low" else 440
        t = np.arange(int(sr * min(2.0, 0.02 * len(text)) / speed)) / sr
        sf.write(path, 0.2 * np.sin(2 * np.pi * f * t).astype("float32"), sr)


def retime(path, speed):
    """Change speed without changing pitch (ffmpeg atempo), for providers that can't do it themselves."""
    if not shutil.which("ffmpeg"):
        return
    tmp = path + ".tmp" + os.path.splitext(path)[1]
    f, chain = clamp(speed, 0.5, 2.0), []
    chain.append(f"atempo={f:.3f}")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path, "-filter:a", ",".join(chain), tmp], check=True)
    os.replace(tmp, path)


PROVIDERS = {p.id: p for p in (Edge(), OpenAI(), ElevenLabs(), Kokoro(), Chatterbox())}
if os.environ.get("STUDIO_TEST"):
    PROVIDERS["mock"] = Mock()
