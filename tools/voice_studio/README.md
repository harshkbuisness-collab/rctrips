# Voice Studio

Turn many scripts into voiceovers at once, in your browser.

- **Pick a voice and hear it first.** Click ▶ on any voice card for a sample. You can type your own sample line. Each sample is saved after the first play, so replaying it is instant.
- **Speed slider.** 0.5× (slower) to 2× (faster).
- **Bulk input.**
  - Paste scripts with a line of `---` between them.
  - Or upload many `.txt` / `.md` files, one script per file.
  - Channel scripts (`scripts/dayNN_*.md`) are cleaned automatically: only the spoken lines are read. The file is named `dayNN`.
- **Parallel generation.**
  - You choose how many scripts run at once. Each script is also split into parts that are made in parallel.
  - Network errors are retried automatically. Finished parts are cached, so a retry only makes what is missing.
- **Progress.**
  - The overall bar shows the percentage, "3 / 10 scripts done", the time left, and what is being made now.
  - Each script has its own bar and part count.
  - Failed scripts show the reason and a ↻ Retry button, and there is ↻ Retry failed for all of them. A retry uses the voice and speed selected at that moment.
- **Listen and download.**
  - Every finished file has a player and a ⬇ Download button.
  - ⬇ Download all (ZIP) gives every finished file together.
  - Optional: tick **Also save dayNN files into the project's voices/ folder**, so `python3 tools/batch.py` can make the videos straight away.

## Voice providers

| Provider | Cost / key | Speed | Notes |
|---|---|---|---|
| **Microsoft Edge voices** (default) | Free, no key | Fast: a 2,000-word script in about 1–2 min | 40+ English neural voices (US, UK, AU, IN…). Needs internet. |
| OpenAI | `OPENAI_API_KEY`, paid per character | Fast | 11 very natural voices (`gpt-4o-mini-tts`). |
| ElevenLabs | `ELEVENLABS_API_KEY`, paid plan | Medium | The most expressive voices, including your own cloned voice from your ElevenLabs account. |
| Kokoro | Free, offline | About 4 s per sentence on a normal computer | 28 English voices. No internet needed after the download. |
| Chatterbox | Free, offline | Slow without an NVIDIA card | Copies the channel voice in `ref_voice.wav`. You can add more samples as `.wav` files in `voice_samples/`. Uses the original `voice_studio.py`. |

Why Edge is the default: it is free, needs no key, sounds natural, runs many requests in parallel, and has a native speed setting. The other providers are ready when you want a different sound.

## Install (one time)

**Windows**
1. Install **Python 3.12** from https://www.python.org/downloads/ and tick **"Add python.exe to PATH"**.
2. Double-click **`1_INSTALL_windows.bat`**. It sets up its own Python folder (`venv`), installs the packages from `requirements.txt`, and installs **ffmpeg** with winget if it is missing. Restart the computer once if ffmpeg was just installed.
3. Optional: `4_INSTALL_offline_voices_windows.bat` adds the Kokoro offline voices (340 MB download), and `3_INSTALL_cloned_voice_windows.bat` adds Chatterbox, your cloned channel voice (a few GB).

**Mac**: the same steps with the `.command` files (right-click, then **Open**, the first time). Install ffmpeg with `brew install ffmpeg`.

**Any computer, by hand**
```
cd tools/voice_studio
python -m venv venv
venv/bin/pip install -r requirements.txt        # Windows: venv\Scripts\pip install -r requirements.txt
# optional:
venv/bin/pip install kokoro-onnx && venv/bin/python download_kokoro.py
venv/bin/pip install chatterbox-tts
```

## Run

Double-click **`2_START_windows.bat`** (Mac: `2_START_mac.command`). Your browser opens at http://localhost:7860.

By hand: `venv/bin/python -m studio` (options: `--port 7860`, `--host 0.0.0.0` to open it from your phone on the same Wi-Fi, `--no-browser`).

## API keys

Click **⚙️ Settings & API keys** in the app and paste the key. It is saved only on your computer, in `tools/voice_studio/config.json`, which is never uploaded to git. You can also set environment variables instead:

| Setting | Where to get it |
|---|---|
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys (optional: `OPENAI_TTS_MODEL`, default `gpt-4o-mini-tts`) |
| `ELEVENLABS_API_KEY` | https://elevenlabs.io → Profile → API keys (optional: `ELEVENLABS_MODEL`, default `eleven_multilingual_v2`; `eleven_flash_v2_5` is faster) |
| `KOKORO_DIR` | Only if you keep the Kokoro model files somewhere other than `tools/voice_studio/kokoro/` |
| `SSL_CERT_FILE` | Only behind a company proxy that uses its own certificate |

## Using it for the channel

1. Upload `scripts/day01_….md … day10_….md` (several files at once). Each one is named `day01` … `day10` automatically.
2. Pick a voice: try a few with ▶, and set the speed to about 1.1× for a lively pace.
3. Set **Scripts at once** to 4, tick **Also save into voices/**, and press **Generate voices**.
4. When everything is done, the files are in `voices/` (and in the ZIP). Then run `python3 tools/batch.py 1 2 3 4 5`.

Output files are also kept in `tools/voice_studio/output/<run>/`. Cached parts are in `cache/`, and you can delete that folder any time to free space.

## Files

```
tools/voice_studio/
  studio/                 the app
    server.py             web API (FastAPI): providers, voices, preview, jobs, retry, stop, ZIP, settings
    jobs.py               bulk runs: parallel scripts and parts, cache, auto-retry, joining with ffmpeg
    providers.py          Edge, OpenAI, ElevenLabs, Kokoro, Chatterbox (+ a test tone for automatic tests)
    textprep.py           cleans channel scripts, splits the box at ---, cuts long text at sentence ends
    static/index.html     the page (no build step)
  tests/test_flow.py      offline end-to-end test (python tests/test_flow.py)
  tests/test_ui.py        browser test with real Edge voices
  voice_studio.py         the original cloned-voice tool (used by the Chatterbox provider)
  requirements.txt, download_kokoro.py, 1_…4_ install/start files
```

## Tests

- `python tests/test_flow.py` starts the app with a built-in test voice, with no internet needed. It checks voices, the preview cache, a bulk run of 6 scripts with 3 at once, progress updates, a failed script with its error, retry, single downloads, and the ZIP.
- `python tests/test_ui.py` drives the real page in a browser with Edge voices. Start the app on port 7880 first.

## Troubleshooting

- **"ffmpeg could not join the audio"**: install ffmpeg (step 2 above) and restart. Without ffmpeg, MP3 parts are still glued together, but WAV and speed changes for Chatterbox need it.
- **Edge voices don't load**: check your internet connection. Behind a proxy, set `HTTPS_PROXY` (and `SSL_CERT_FILE` if the proxy uses its own certificate).
- **A script failed**: read the red message next to it, fix it (for example add a key or pick another voice), then press ↻ Retry. Only the missing parts are made again.
