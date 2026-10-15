---
name: freestack-video
description: Turn a voiceover audio file into a finished FreeStack AI vertical Reel (1080x1920) with the mascot, Paid-vs-Free cards, tool demos, GitHub star zoom, word-synced captions, sound effects and optional background music. Use whenever the user sends a voiceover (wav/mp3/m4a) for a FreeStack AI video, or asks to make/render/rebuild a FreeStack reel from audio or a script.
---

# FreeStack AI: voiceover → Reel

Everything lives in `freestack/` at the repo root:

| Path | What it is |
|---|---|
| `freestack/engine/build.py` | The pipeline (transcribe, plan, capture GitHub, sound, render, QA) |
| `freestack/engine/template.html` | The animated scene template (white wall theme, Bold Pop brand) |
| `freestack/mascot/clips/` | Animated mascot clips with transparency (`c1-talk` … `c10-bye`, `c9-cta-room.mp4`) |
| `freestack/mascot/poses/` | Still mascot cutouts as WebP (for thumbnails / extra uses) |
| `freestack/brand/` | Logo, icon, `BRAND-KIT.md` |
| `freestack/projects/<slug>/` | One folder per video: `scenes.json`, the voiceover, optional `music.mp3` |
| `freestack/projects/5-paid-ai-tools/` | **Worked example.** Copy its `scenes.json` as the starting point |

## Workflow

### 0. Setup (once per session)
```bash
bash freestack/engine/setup.sh
```

### 1. Create the project
- Slug from the topic, e.g. `freestack/projects/free-ai-image-tools/`.
- Copy the user's audio in as `voiceover.wav` (or .mp3) (any format ffmpeg reads is fine; set `"audio"` to the file name).
- If the user sent background music, copy it as `music.mp3`. Music files are git-ignored (copyright).
  The user's default track is Eminem "Without Me", started at 3.5 s, 8 dB under the voice. If no music file is available, ask for it or leave `music` out.

### 2. Transcribe
```bash
python3 -I freestack/engine/build.py transcribe freestack/projects/<slug>
```
Prints the transcript with a timestamp per word. Read it to understand the video: hook, list items, CTA keyword, sign-off.
Hinglish speech comes out in Roman script with `"language": "en"`. Add a `whisper_hint` with tool names to improve spelling.

### 3. Research the tools named in the audio
For each tool: find its GitHub repo (or official site), confirm it is really free / open source, and note the paid tool it replaces.
Never invent star counts, prices or features. The build reads star counts live from GitHub.

### 4. Write `scenes.json`
Scenes run in order. Each scene starts at its `start` phrase: the first words spoken in that scene, matched in order against the transcript (number words and digits both match).
`text` is the on-screen caption text for that scene. Write the voiceover's words with correct spellings (Upscayl, ComfyUI, 25+, 50,000+). Words are aligned to the audio automatically.
Use `*word*` to highlight a word in yellow, and `<br>` for line breaks in big titles.

Scene types:

```jsonc
{"type": "hook", "start": "bhai tum",
 "headline": "Abhi bhi *pay* kar rahe ho?",              // first frame text (on screen from frame 1)
 "notifications": ["Midjourney", "ElevenLabs"],           // up to 4 "Subscription renewed · PAID" cards (optional)
 "impact": {"at": "inke", "text": "Free<br>*versions*<br>hain!"},   // red flash + shake at this word (optional)
 "reveal": {"at": "aur number", "text": "#1 dekh ke<br>*shock* ho jaoge", "mascot": "c3-shocked"},  // optional
 "text": "caption text..."}

{"type": "tool", "start": "number 5", "n": 5,
 "paid": "Otter.ai", "free": "Buzz",                      // Paid vs Free cards (omit "paid" to skip)
 "repo": "owner/name",                                    // GitHub star-zoom card (omit to skip)
 "mascot": "c4-point-left", "flip": false, "tag": "offline subtitles",   // mascot intro shot with big #n
 "demo": {...},                                           // see demo kinds below
 "text": "caption text..."}

{"type": "talk", "start": "...", "mascot": "c1-talk", "title": "Big *title*", "tag": "handwritten line", "text": "..."}

{"type": "cta", "start": "saare links", "keyword": "TOOLS", "line": "Follow &amp; Comment...", "banner_at": "follow", "text": "..."}

{"type": "outro", "start": "bye", "handle": "@freestack.ai", "text": "Bye!"}
```

Demo kinds (`demo.kind`):
- `wave`: waveform + typing subtitle. `{"text": "...", "pill": "OFFLINE · NO INTERNET"}` (audio, transcription, music tools)
- `voice`: pink waveform + checklist. `{"items": ["Voice cloning", "Dubbing"]}` (voice / TTS tools)
- `grammar`: wrong sentence auto-fixes. `{"bad": "*Their* going", "good": "*They're* going", "pill": "25+ LANGUAGES"}`
- `upscale`: before/after slider. Optional `{"image": "file.png"}` placed in the project folder (default: logo). Say it's illustrative if it isn't a real output.
- `nodes`: 3 boxes lighting up + big number. `{"labels": ["PROMPT","MODEL","IMAGE"], "label": "MONTHLY BILL", "big": "&#8377;0"}`
- `checklist`: up to 5 ticked items. `{"items": [...]}`
- `text`: one big animated title. `{"text": "*100%* free", "size": 150}`
- `none`: skip the demo

Mascot clips (match the clip to what's being said):
`c1-talk` talking · `c2-hello` wave hello · `c3-shocked` shock · `c4-point-left` / `c5-point-right` pointing · `c6-thinking` thinking → idea · `c7-phone` holding phone · `c8-celebrate` jump · `c9-cta-room` (used by cta) · `c10-bye` (used by outro).
Use a different clip for each list item where possible.

### 5. Preview before the full render
```bash
python3 -I freestack/engine/build.py stills freestack/projects/<slug> 0.3,3.5,8,12,20,30
```
Look at the `build/still-*.png` files. Check the first frame shows the hook text, and scene starts are right.

### 6. Build
```bash
python3 -I freestack/engine/build.py build freestack/projects/<slug>
```
About 3–4 minutes for a 50 s video. Output: `freestack/projects/<slug>/output/<slug>.mp4`, plus QA sheets in `build/qa/`.

### 7. QA (mandatory, before sending)
Read every `build/qa/sheet*.png` (one frame per second) and check:
- **Nothing covers the mascot's face or mouth** (titles, banners, badges, captions).
- No overlapping text; captions sit on one line inside their white box.
- Each GitHub card shows the right repo and a highlighted star count (a WARNING in the log means no card).
- Scene changes land on the right words.
Fix `scenes.json` (or the template, for layout bugs) and rebuild until clean.

### 8. Deliver
Send the MP4 with `SendUserFile`, then give:
- a short scene summary,
- a ready-to-paste Instagram caption (hook line, numbered tools, "Comment KEYWORD", follow line, 5–8 hashtags),
- any accuracy notes (e.g. "needs a GPU", "illustrative demo").

## Brand rules (keep)
- White warm wall background; black text; key words on yellow `#FFE500` blocks; pink `#FF3D7F` proof badges; red `#FF3B30` only for paid tools.
- Fonts: Anton (titles/captions, uppercase), Inter (labels), Caveat (handwritten tags).
- Mascot face must always be clear. CTA banner sits on his chest, below the face.
- Content rules: only real, verified free / open-source tools; no fake reviews, no income claims, no cracked "pro" apps.
