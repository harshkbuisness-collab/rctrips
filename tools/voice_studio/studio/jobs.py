"""Bulk voice jobs: many scripts, each cut into chunks, generated in parallel, then joined into one file.

Speed tricks:
- several scripts run at once (you choose how many), and inside each script several chunks run at once,
  up to the provider's safe limit (Edge 6, OpenAI 4, ElevenLabs 3, local models 1);
- every chunk is cached by (provider, voice, speed, text): a retry or a re-run only makes what is missing;
- no waiting between scripts; network errors are retried automatically (5 tries, growing back-off).
"""
import asyncio, hashlib, os, re, shutil, subprocess, time, uuid, zipfile

from . import textprep
from .providers import PROVIDERS, ProviderError, ROOT

OUT = os.path.join(ROOT, "output")
CACHE = os.path.join(ROOT, "cache", "chunks")
PROJECT_VOICES = os.path.abspath(os.path.join(ROOT, "..", "..", "voices"))   # repo voices/ (used by tools/batch.py)
JOBS = {}
_provider_sems = {}


def _sem(pid):
    if pid not in _provider_sems:
        _provider_sems[pid] = asyncio.Semaphore(PROVIDERS[pid].parallel)
    return _provider_sems[pid]


def key(*parts):
    return hashlib.sha1("|".join(str(p) for p in parts).encode()).hexdigest()[:24]


async def synth_cached(pid, text, voice, speed, folder=CACHE):
    """One chunk of audio, from the cache if it was made before. Returns the file path."""
    p = PROVIDERS[pid]
    os.makedirs(folder, exist_ok=True)
    path = os.path.join(folder, key(pid, voice, round(speed, 2), text) + "." + p.ext)
    if os.path.exists(path) and os.path.getsize(path) > 100:
        return path
    tmp = path + ".part." + p.ext
    last = None
    for attempt in range(5):
        try:
            async with _sem(pid):
                await p.synth(text, voice, speed, tmp)
            os.replace(tmp, path)
            return path
        except ProviderError:
            raise                                   # a clear problem (bad key, bad voice): retrying won't help
        except Exception as e:                      # network hiccup: try again soon
            last = e
            await asyncio.sleep(2 ** attempt)          # 1, 2, 4, 8, 16 s: gives a busy service time to recover
    raise ProviderError(f"Failed after 5 tries: {type(last).__name__}: {str(last)[:160]}")


def join_audio(files, out_path, fmt):
    """Join the chunks into one file (mp3 or wav)."""
    if shutil.which("ffmpeg"):
        lst = out_path + ".list.txt"
        with open(lst, "w", encoding="utf-8") as f:
            for p in files:
                f.write("file '" + os.path.abspath(p).replace("'", "'\\''") + "'\n")
        codec = ["-c:a", "libmp3lame", "-b:a", "160k"] if fmt == "mp3" else ["-c:a", "pcm_s16le"]
        r = subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, *codec, out_path],
                           capture_output=True, text=True)
        os.remove(lst)
        if r.returncode:
            raise ProviderError("ffmpeg could not join the audio: " + r.stderr[-200:])
        return
    # without ffmpeg: mp3 chunks can be glued byte by byte, wav chunks with soundfile
    if all(p.endswith(".mp3") for p in files) and fmt == "mp3":
        with open(out_path, "wb") as o:
            for p in files:
                o.write(open(p, "rb").read())
        return
    import numpy as np, soundfile as sf
    parts, sr = [], 24000
    for p in files:
        a, sr = sf.read(p, dtype="float32")
        parts.append(a if a.ndim == 1 else a.mean(axis=1))
    sf.write(out_path if fmt == "wav" else out_path[:-4] + ".wav", np.concatenate(parts), sr)


def duration(path):
    if shutil.which("ffprobe"):
        r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                           capture_output=True, text=True)
        try:
            return float(r.stdout.strip())
        except ValueError:
            pass
    return 0.0


class Item:
    def __init__(self, idx, name, text):
        self.idx, self.name, self.text = idx, name, text
        self.reset()

    def reset(self):
        self.state, self.error, self.file, self.seconds = "queued", "", "", 0.0
        self.chunks_total = self.chunks_done = 0
        self.chars_done = 0

    def view(self, job):
        total = max(len(self.text), 1)
        pct = 100.0 if self.state == "done" else round(100 * self.chars_done / total, 1)
        return {"idx": self.idx, "name": self.name, "state": self.state, "error": self.error, "pct": pct,
                "chunks_done": self.chunks_done, "chunks_total": self.chunks_total, "chars": len(self.text),
                "words": len(self.text.split()), "seconds": round(self.seconds, 1),
                "url": f"/output/{job.id}/{os.path.basename(self.file)}" if self.file else ""}


class Job:
    def __init__(self, provider, voice, speed, fmt, at_once, scripts, copy_to_project=False):
        if provider not in PROVIDERS:
            raise ProviderError(f"Unknown provider '{provider}'")
        ok, why = PROVIDERS[provider].available()
        if not ok:
            raise ProviderError(why)
        self.id = time.strftime("%Y%m%d-%H%M%S-") + uuid.uuid4().hex[:4]
        self.provider, self.voice, self.speed = provider, voice, float(speed)
        self.fmt = "wav" if fmt == "wav" else "mp3"
        self.at_once = max(1, min(int(at_once), 20))
        self.copy_to_project = copy_to_project
        self.dir = os.path.join(OUT, self.id)
        os.makedirs(self.dir, exist_ok=True)
        names, self.items = set(), []
        for i, s in enumerate(scripts):
            text = textprep.spoken_text(s.get("text", ""))
            name = textprep.script_name(s.get("text", ""), s.get("name") or f"script_{i + 1:02d}")
            base, n = name, 2
            while name in names:
                name, n = f"{base}_{n}", n + 1
            names.add(name)
            self.items.append(Item(i, name, text))
        self.state, self.started, self.finished, self.cancelled = "running", time.time(), 0.0, False
        self.task = None

    def view(self):
        items = [it.view(self) for it in self.items]
        chars = sum(max(len(it.text), 1) for it in self.items)
        done_chars = sum(max(len(it.text), 1) if it.state == "done" else it.chars_done for it in self.items)
        done = sum(it.state == "done" for it in self.items)
        failed = sum(it.state in ("failed", "cancelled") for it in self.items)
        running = [it.name for it in self.items if it.state == "running"]
        el = (self.finished or time.time()) - self.started
        eta = el / done_chars * (chars - done_chars) if 0 < done_chars < chars else 0
        if self.state == "running":
            status = (f"Generating {', '.join(running[:3])}{'…' if len(running) > 3 else ''}" if running
                      else "Starting…")
        else:
            status = {"done": "All finished", "partial": f"Finished with {failed} failed", "cancelled": "Stopped"}[self.state]
        return {"id": self.id, "state": self.state, "status": status, "provider": self.provider, "voice": self.voice,
                "speed": self.speed, "pct": round(100 * done_chars / chars, 1), "done": done, "failed": failed,
                "total": len(self.items), "elapsed": round(el), "eta": round(eta), "items": items,
                "zip": f"/api/jobs/{self.id}/zip" if done else ""}

    async def run_item(self, it, sem):
        async with sem:
            if self.cancelled:
                it.state = "cancelled"
                return
            it.reset()
            it.state = "running"
            t0 = time.time()
            try:
                if not it.text.strip():
                    raise ProviderError("This script has no spoken text.")
                p = PROVIDERS[self.provider]
                parts = textprep.chunks(it.text, p.max_chars)
                it.chunks_total = len(parts)

                async def one(piece):
                    if self.cancelled:
                        raise asyncio.CancelledError
                    path = await synth_cached(self.provider, piece, self.voice, self.speed)
                    it.chunks_done += 1
                    it.chars_done += len(piece) + 1
                    return path

                files = await asyncio.gather(*(one(x) for x in parts))
                out = os.path.join(self.dir, f"{it.name}.{self.fmt}")
                await asyncio.to_thread(join_audio, files, out, self.fmt)
                if not os.path.exists(out):                     # no ffmpeg: fell back to .wav
                    out = out[:-4] + ".wav"
                it.file, it.seconds = out, await asyncio.to_thread(duration, out)
                if self.copy_to_project and re.fullmatch(r"day\d\d", it.name) and os.path.isdir(PROJECT_VOICES):
                    shutil.copy(out, os.path.join(PROJECT_VOICES, os.path.basename(out)))
                it.state = "done"
            except asyncio.CancelledError:
                it.state, it.error = "cancelled", "Stopped"
            except ProviderError as e:
                it.state, it.error = "failed", str(e)
            except Exception as e:
                it.state, it.error = "failed", f"{type(e).__name__}: {str(e)[:200]}"
            finally:
                if it.state == "running":
                    it.state = "failed"
                print(f"[{self.id}] {it.name}: {it.state} in {time.time() - t0:.1f}s {it.error}", flush=True)

    async def run(self, only=None):
        self.state, self.cancelled, self.finished = "running", False, 0.0
        sem = asyncio.Semaphore(self.at_once)
        todo = [it for it in self.items if only is None or it.idx in only]
        for it in todo:
            it.reset()
        await asyncio.gather(*(self.run_item(it, sem) for it in todo))
        self.finished = time.time()
        bad = sum(it.state != "done" for it in self.items)
        self.state = "cancelled" if self.cancelled else ("done" if not bad else "partial")

    def start(self, only=None, **changes):
        for k, v in changes.items():
            if v not in (None, ""):
                setattr(self, k, float(v) if k == "speed" else v)
        self.started, self.state, self.cancelled = time.time(), "running", False
        for it in self.items:
            if only is None or it.idx in only:
                it.reset()                                  # shows as "queued" right away
        self.task = asyncio.create_task(self.run(only))

    def zip(self):
        path = os.path.join(self.dir, f"voices_{self.id}.zip")
        with zipfile.ZipFile(path, "w", zipfile.ZIP_STORED) as z:     # audio is already compressed
            for it in self.items:
                if it.state == "done" and os.path.exists(it.file):
                    z.write(it.file, os.path.basename(it.file))
        return path


def new_job(**kw):
    j = Job(**kw)
    JOBS[j.id] = j
    j.start()
    return j
