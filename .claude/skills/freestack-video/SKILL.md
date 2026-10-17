---
name: freestack-video
description: Make a finished FreeStack AI vertical Reel (1080x1920) end to end - from the voiceover the user sends (default) or, only when they ask, a Raju AI voiceover from ElevenLabs - with the mascot, a fast multi-shot opening, Paid-vs-Free cards, tool demos, GitHub star zoom, word-synced captions, sound effects and background music. Default look is the cinematic "studio" style. Use whenever the user sends a voiceover (wav/mp3/m4a), gives a topic or script for a FreeStack video, or asks to make/render/rebuild a FreeStack reel.
---

# FreeStack AI: voiceover → Reel

Everything this skill needs is inside this skill's folder. Below, `$SKILL_DIR` means that folder (the one containing this SKILL.md). Set it first, for example:
```bash
SKILL_DIR="$(dirname "$(find / -path '*freestack-video/SKILL.md' 2>/dev/null | head -1)")"
```

| Path | What it is |
|---|---|
| `$SKILL_DIR/engine/build.py` | The pipeline (transcribe, plan, capture GitHub, sound, render, QA) |
| `$SKILL_DIR/engine/template.html` | The animated scene template (themes incl. cinematic `studio`, beats opening, Bold Pop brand) |
| `$SKILL_DIR/mascot/clips/` | Animated mascot clips with transparency (`c1-talk` … `c10-bye`, `c9-cta-room.mp4`) |
| `$SKILL_DIR/mascot/poses/` | Still mascot cutouts as WebP (thumbnails / extra uses) |
| `$SKILL_DIR/brand/` | Logo, icon, `BRAND-KIT.md` |
| `$SKILL_DIR/examples/new-style-immich/` | **Worked example, new style** (`scenes.json` + Raju voiceover). Copy its `scenes.json` as the starting point |
| `$SKILL_DIR/examples/5-paid-ai-tools/` | Older example in the original "wall" style |

Each video gets its own project folder in the **working directory** (not inside the skill folder): `projects/<slug>/` holding `scenes.json`, the voiceover and an optional `music.mp3`.

## Requirements
Python 3 with pip, ffmpeg, Node.js with Playwright + Chromium, and internet access (GitHub pages, Google Fonts, and a one-time Whisper model download). `setup.sh` installs the Python packages and checks the rest. If something is missing and can't be installed, tell the user exactly what is missing instead of producing a lower-quality video.

## Full pipeline (voiceover → finished Reel)

The user records and sends the voiceover themselves. Everything after that is automatic: they should not have to edit anything.

1. **Script** (only if the user asks for one to record). Max 35 s (≤ 85 words), 4 parts: hook → problem → payoff → CTA.
   Natural spoken Hinglish in "tum" (full sentences, like a friend talking, never clipped commands).
   CTA template: "Agar iska link chahiye, toh comment mein KEYWORD likh do, main tumhe DM kar dunga."
   Only real, verified free/open-source tools; marketing/business angle; no income claims.
2. **Voice: use the user's recording.** Never generate a voice unless the user explicitly asks for one.
   Only then: ElevenLabs library voice **Raju – Relatable Voice for Reels & Shorts** (`voice_id: En6h099lt2QcramUUkvb`,
   model `eleven_v4`) via the ElevenLabs connector (`creative_generate_speech`, `generations_count: 1`, poll
   `creative_get_flow_run_status`, download the mp3). Prompt in Devanagari with English words in Latin script and tool
   names spelled phonetically (Immich → इमिच); no style notes in the prompt, since everything in it is spoken.
3. **Clean the audio.** Transcribe, read it, and cut anything that is not the script (spoken instructions,
   retakes, long silences) with ffmpeg `atrim`/`concat`. Tell the user what was cut.
4. **Build** in the new style (below), QA, deliver (steps 5-8 of the Workflow).

## New style (default): `"theme": "studio"`

Modelled on top faceless creators: one calm cinematic set, many small beats. Start from
`examples/new-style-immich/scenes.json`.

- `"theme": "studio"`: soft wall with drifting window light, film grain, vignette, slow camera push-in on every scene.
  Talk and beats mascots are framed as a medium close-up so the clip edges never show.
- `"captions": "minimal"`: white outlined words, active word on yellow, no white boxes.
- **First 3 seconds must change at least 3 times.** Open with a `beats` scene, never one held shot:
```jsonc
{"type": "beats", "start": "<first words as Whisper wrote them>", "text": "<hook + problem sentences>",
 "beats": [
  {"pose": "15-point-viewer", "shot": "mid", "zoomout": true, "tags": ["TUM BHI?"]},          // face fills frame, pulls back
  {"at": "google", "pose": "17-money", "shot": "full", "big": "PAISE?", "tags": ["HAR MAHINE"]},
  {"at": "rakhne", "pose": "12-annoyed", "shot": "mid", "bubble": "sirf photos ke liye?!", "bubble_side": "left"},
  {"at": "phone", "pose": "06-phone", "notif": {"app": "Google One", "text": "Storage full · upgrade your plan", "amt": "100%"}},
  {"at": "aur", "pose": "02-shocked", "shot": "close", "big": "UPGRADE?", "big_top": 240, "bubble": "plan upgrade karo...", "bubble_top": 1250}
 ]}
```
  - `at`: word in this scene's `text` where the cut happens (first beat starts at the scene start). Aim for a cut every 0.7-1.5 s.
  - `pose`: still from `mascot/poses/` (01-wave, 02-shocked, 03-point-left, 04-point-right, 05-thinking, 06-phone,
    07-laptop, 08-excited, 10-bye, 11-sign, 12-annoyed, 13-laughing, 14-wink, 15-point-viewer, 16-whisper, 17-money, 18-thumbnail).
    Never the same pose twice in a row.
  - `shot`: `full` | `mid` | `close`. Mix them. Each cut gets a punch-in zoom, a whoosh, and a pop per label.
  - Extras (any mix): `big` (huge dark-red word behind the mascot), `tags` (yellow sticky labels, max 2),
    `bubble` (handwritten speech bubble; move with `bubble_top`/`bubble_side` so it never covers the mouth),
    `chips` (numbered red squares), `notif` (phone notification card).
- `talk` scenes also take `"bigword": "STORAGE"` (word behind the mascot) and `"chip": ["1", "GOOGLE PHOTOS"]` (step label).
- Demo kind `photos`: photo-library search, `{"kind": "photos", "query": "beach", "pill": "SMART SEARCH"}` (drawn, illustrative).
- CTA stays in the warm night room (`cta` scene), which is the second "set" of the style.


## Workflow

### 0. Setup (once per session)
```bash
bash "$SKILL_DIR/engine/setup.sh"
```

### 1. Create the project
- Slug from the topic, e.g. `projects/free-ai-image-tools/` in the working directory.
- Copy the user's audio in as `voiceover.wav` (or .mp3) (any format ffmpeg reads is fine; set `"audio"` to the file name).
- If the user sent background music, copy it as `music.mp3`. Music files are git-ignored (copyright).
  The user's default track is Eminem "Without Me", started at 3.5 s, 16 dB under the voice (8 dB was too loud). If no music file is available, ask for it or leave `music` out.

### 2. Transcribe
```bash
python3 -I "$SKILL_DIR/engine/build.py" transcribe projects/<slug>
```
Prints the transcript with a timestamp per word. Read it to understand the video: hook, list items, CTA keyword, sign-off.
Hinglish speech comes out in Roman script with `"language": "en"`. Add a `whisper_hint` with tool names to improve spelling.

### 3. Research the tools named in the audio
For each tool: find its GitHub repo (or official site), confirm it is really free / open source, and note the paid tool it replaces.
Never invent star counts, prices or features. The build reads star counts live from GitHub.

### 4. Write `scenes.json`
Scenes run in order. Each scene starts at its `start` phrase: the first words spoken in that scene, matched in order against the transcript **as Whisper wrote it** (e.g. "voice studio", not "VoiceStudio"; check the transcribe output) (number words and digits both match).
`text` is the on-screen caption text for that scene. Write the voiceover's words with correct spellings (Upscayl, ComfyUI, 25+, 50,000+). Words are aligned to the audio automatically.
Use `*word*` to highlight a word in yellow, and `<br>` for line breaks in big titles.

Series (for "Day X/30" videos), at the top level of `scenes.json`:
```jsonc
"series": {"name": "30 Din, 30 Free AI Tools", "day": 1, "total": 30, "next": "Kal"}
```
This adds a "DAY 1/30 · <name>" stamp above the hook from the first frame, the fixed **series ident** (black screen: SUBSCRIPTION → struck out, BAND KARO stamp, DAY N/30 + 30-segment progress bar, with sound) when the voice says "Subscription Band Karo, Day N" (same in every video, only the number changes), a "DAY 1/30" pill next to the logo during the video, and a "KAL: DAY 2 →" teaser on the outro. Title the Instagram post "Day (1/30) …" as well.

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

**Make every video look different.** Never reuse the same opening, theme and tool order two videos in a row, and don't open every video with the PAID notification cards.
- `"theme"` (top level): `wall` (default), `grid`, `yellow`, `blush`, `mint`, `sky`.
- Hook `"style"` (opening widget, shown until `impact`/`reveal`):
  - `chat`: AI chat window. `"chat": {"title": "AI Engineer", "ask": "...", "reply": "...", "ticks": ["...", "..."]}`
  - `build`: prompt box types, then a website builds itself. `"build": {"prompt": "...", "brand": "SWEET BAKES", "hero": "Fresh cakes<br>every day", "url": "..."}`
  - `editor`: dark code editor typing code. `"editor": {"file": "app.js", "lines": ["..."], "type_dur": 2.2}`
  - `terminal`: terminal typing commands. `"terminal": {"lines": [{"cmd": "..."}, {"out": "..."}, {"big": "TOOL NAME"}]}` (only real commands)
  - `polaroid`: a photo of the mascot that starts talking at a word. `"polaroid": {"pose": "01-wave", "at": "bolne", "say": "Hello!", "label": "sirf ek photo"}`
  - `tiles`: grid of tool tiles + stamp (recaps). `"tiles": {"items": [["OpenHands", "AI ENGINEER"], ...], "stamp": "Sab *free*"}`
  - `player`: music player with moving waveform. `"player": {"art": "AI<br>Song", "title": "...", "artist": "..."}`
  - `mic`: recording mic with pulse rings and REC timer (voice topics).
  - `dub`: video with a subtitle that flips EN → HI. `"dub": {"en": "...", "hi": "...", "switch": 1.2}`
  - `render`: prompt types, a video frame renders 0–100%. `"render": {"prompt": "...", "label": "AI VIDEO CLIP"}` (placeholder, not a real output)
  - no style + `notifications`: the original PAID cards (use rarely).
- Tool `"flow"`: order of the tool's parts, any of `intro` (mascot + #n), `vs` (Paid vs Free), `demo`, `card` (GitHub stars), e.g. `["card", "demo"]` or `["vs", "intro", "card", "demo"]`. Parts not listed are skipped. Omit `n` to show the tool name instead of "#n".

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
python3 -I "$SKILL_DIR/engine/build.py" stills projects/<slug> 0.3,3.5,8,12,20,30
```
Look at the `build/still-*.png` files. Check the first frame shows the hook text, and scene starts are right.

### 6. Build
```bash
python3 -I "$SKILL_DIR/engine/build.py" build projects/<slug>
```
About 3–4 minutes for a 50 s video. Output: `projects/<slug>/output/<slug>.mp4`, plus QA sheets in `build/qa/`.

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

Keep the first 3 seconds fast: the opening widget finishes in about 1.5 s, the impact line lasts about 1 s, then the series ident.

## Brand rules (keep)
- White warm wall background; black text; key words on yellow `#FFE500` blocks; pink `#FF3D7F` proof badges; red `#FF3B30` only for paid tools.
- Fonts: Anton (titles/captions, uppercase), Inter (labels), Caveat (handwritten tags).
- Mascot face must always be clear. CTA banner sits on his chest, below the face.
- Content rules: only real, verified free / open-source tools; no fake reviews, no income claims, no cracked "pro" apps.
