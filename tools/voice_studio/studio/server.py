"""Voice Studio web app (FastAPI). Start it with:  python -m studio   (from tools/voice_studio)."""
import os

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from . import jobs, textprep
from .providers import PROVIDERS, ProviderError, ROOT, save_settings, setting

HERE = os.path.dirname(os.path.abspath(__file__))
PREVIEWS = os.path.join(ROOT, "cache", "previews")
SAMPLE = ("Hi there. This is how I sound. Money is really a story about trust, "
          "and today we'll follow one dollar from the moment it's created to the moment it's spent.")

app = FastAPI(title="Voice Studio")
os.makedirs(jobs.OUT, exist_ok=True)
os.makedirs(PREVIEWS, exist_ok=True)
app.mount("/output", StaticFiles(directory=jobs.OUT), name="output")
app.mount("/previews", StaticFiles(directory=PREVIEWS), name="previews")


@app.exception_handler(ProviderError)
async def provider_error(_, e):
    return JSONResponse({"detail": str(e)}, status_code=400)


@app.get("/")
def index():
    return FileResponse(os.path.join(HERE, "static", "index.html"))


@app.get("/api/providers")
def providers():
    out = []
    for p in PROVIDERS.values():
        ok, why = p.available()
        out.append({"id": p.id, "name": p.name, "note": p.note, "available": ok, "reason": why,
                    "parallel": p.parallel})
    return {"providers": out, "project_voices": os.path.isdir(jobs.PROJECT_VOICES)}


@app.get("/api/voices")
async def voices(provider: str):
    p = PROVIDERS.get(provider)
    if not p:
        raise HTTPException(404, "Unknown provider")
    ok, why = p.available()
    if not ok:
        raise ProviderError(why)
    try:
        return {"voices": await p.voices()}
    except ProviderError:
        raise
    except Exception as e:
        raise ProviderError(f"Could not load voices: {type(e).__name__}: {str(e)[:200]}")


class Preview(BaseModel):
    provider: str
    voice: str
    speed: float = 1.0
    text: str = ""


@app.post("/api/preview")
async def preview(r: Preview):
    """A short sample of one voice. Cached, so playing it again is instant."""
    if r.provider not in PROVIDERS:
        raise HTTPException(404, "Unknown provider")
    text = textprep.spoken_text(r.text)[:400] or SAMPLE
    path = await jobs.synth_cached(r.provider, text, r.voice, r.speed, folder=PREVIEWS)
    return {"url": "/previews/" + os.path.basename(path)}


class Script(BaseModel):
    name: str = ""
    text: str


class NewJob(BaseModel):
    provider: str
    voice: str
    speed: float = 1.0
    format: str = "mp3"
    at_once: int = 3
    copy_to_project: bool = False
    scripts: list[Script]


@app.post("/api/split")
def split(body: dict):
    """Preview how the box will be split into scripts (name + word count), before generating."""
    parts = textprep.split_box(body.get("text", ""))
    return {"scripts": [{"name": textprep.script_name(p, f"script_{i + 1:02d}"),
                         "words": len(textprep.spoken_text(p).split())} for i, p in enumerate(parts)]}


@app.post("/api/jobs")
async def create(r: NewJob):
    if not r.scripts:
        raise ProviderError("Add at least one script.")
    j = jobs.new_job(provider=r.provider, voice=r.voice, speed=r.speed, fmt=r.format, at_once=r.at_once,
                     scripts=[s.model_dump() for s in r.scripts], copy_to_project=r.copy_to_project)
    return j.view()


@app.get("/api/jobs/{jid}")
def status(jid: str):
    j = jobs.JOBS.get(jid)
    if not j:
        raise HTTPException(404, "Job not found (the app may have restarted)")
    return j.view()


class Retry(BaseModel):
    items: list[int] = []          # empty = every failed or stopped script
    provider: str = ""
    voice: str = ""
    speed: float | None = None


@app.post("/api/jobs/{jid}/retry")
async def retry(jid: str, r: Retry):
    j = jobs.JOBS.get(jid)
    if not j:
        raise HTTPException(404, "Job not found")
    if j.state == "running":
        raise ProviderError("Wait until the current run finishes, or press Stop.")
    if r.provider:
        ok, why = PROVIDERS[r.provider].available()
        if not ok:
            raise ProviderError(why)
    only = set(r.items) or {it.idx for it in j.items if it.state in ("failed", "cancelled")}
    if not only:
        raise ProviderError("Nothing to retry: every script finished.")
    j.start(only=only, provider=r.provider, voice=r.voice, speed=r.speed)
    return j.view()


@app.post("/api/jobs/{jid}/cancel")
def cancel(jid: str):
    j = jobs.JOBS.get(jid)
    if not j:
        raise HTTPException(404, "Job not found")
    j.cancelled = True
    return j.view()


@app.get("/api/jobs/{jid}/zip")
def download_all(jid: str):
    j = jobs.JOBS.get(jid)
    if not j:
        raise HTTPException(404, "Job not found")
    return FileResponse(j.zip(), filename=f"voices_{jid}.zip", media_type="application/zip")


class Settings(BaseModel):
    OPENAI_API_KEY: str | None = None
    ELEVENLABS_API_KEY: str | None = None
    KOKORO_DIR: str | None = None


@app.get("/api/settings")
def get_settings():
    mask = lambda v: (v[:4] + "…" + v[-4:]) if len(v) > 10 else ("set" if v else "")
    return {k: mask(setting(k)) if "KEY" in k else setting(k) for k in Settings.model_fields}


@app.post("/api/settings")
def set_settings(s: Settings):
    save_settings({k: v.strip() for k, v in s.model_dump().items() if v})
    for p in PROVIDERS.values():                      # reload voice lists with the new keys
        if hasattr(type(p), "_cache"):
            type(p)._cache = None
    return providers()
