# Reel Engine

Makes illustrated vertical fitness reels starring **H** from a voiceover and a video plan written by Claude.
You give it the voiceover and Claude's JSON; the tool does the rest: syncs every word, places H's poses,
rings, arrows, zooms and captions, and renders the MP4.

## Start (Windows)

1. Install **Node.js 20+** (https://nodejs.org) and **Python 3.11** (https://www.python.org, tick "Add python.exe to PATH").
2. Double-click **`START.bat`**. The first start installs everything (a few minutes), then the tool opens at http://localhost:3000.

macOS / Linux: `./start.sh`. The first render downloads a headless Chrome once, so it needs internet.

## Make a video

1. **Project**: type a name and press *Open / create*.
2. **Voiceover + script**: choose the voiceover file, paste the exact script, press *Upload & sync*.
   English voiceovers sync automatically. For Hindi / Hinglish voiceovers also add an SRT file
   (ElevenLabs and most voice tools export one).
   **No voiceover?** Paste the script, pick a voice in *Make an AI voice from the script* (press *Listen* to hear it),
   choose the speed and press *Make AI voice & sync*: the tool speaks the script and syncs it in one go. It is free
   (Kokoro, Apache-2.0, fine for monetised videos) and runs on your PC; the first time it downloads the voice model
   (~350 MB). English voices sync automatically; Hindi voices need an SRT.
3. **Ask Claude**: press *Copy prompt for Claude*, paste it into a Claude chat, and copy Claude's JSON answer.
4. **Paste Claude's JSON** and press *Check & preview*. If there are problems, press
   *Copy these errors for Claude*, paste them into the same chat, and paste the corrected JSON back.
5. **Preview & render**: watch the preview, press *Render MP4*, then *Download MP4*.

To change something, ask Claude in the same chat ("make the hook faster", "add a zoom on the abs"),
paste the new JSON and check again.

### Vertical 9:16 or landscape 16:9

After *Open / create*, pick the **video format**: *9:16 vertical* (Reels / Shorts, 1080×1920) or *16:9 landscape*
(YouTube, 1920×1080). The prompt for Claude/ChatGPT then includes the matching style rules (for 16:9: H on one side,
big keywords, circles, comparisons, section cards, no running captions). For long 16:9 scripts the AI answers in parts:
say "next" for each part and paste all the parts one after another into the JSON box; the tool joins them.

### Let the tool write the plan (Claude, Gemini or OpenAI)

**Claude with your Pro / Max plan:** if the Claude Code app is installed on this computer and logged in, open
*Library → AI settings → Claude* and press *Test & use Claude*. The tool runs Claude Code in the background (no window,
no tools, an empty folder) and uses your plan's usage; no API key or extra cost. Not logged in? Open a Command Prompt,
type `claude`, log in once.

In *Library → AI settings* paste a **Gemini** key (free, from aistudio.google.com) and/or your own **OpenAI** API key
(platform.openai.com; billed per use, separate from a ChatGPT Plus plan) and press *Save*. The tool checks the key,
lists the models it can use and tests the chosen one. The provider you saved last (or picked with *Use …*) makes the
plans. Keys are stored only in `settings/ai.json` on this computer (or `GEMINI_API_KEY` / `OPENAI_API_KEY`).

Step 2 then has *Make the plan with …*: the tool sends the prompt plus the matching worked examples, checks the JSON,
sends any errors back (up to 3 times) and opens the preview. When the AI's servers are busy it keeps trying other
models for a few minutes. Copy-paste with Claude / ChatGPT still works as before.

### 16:9 style

16:9 videos have a white background so H stands out, and every text has a style (`look`): `hook` (fat cartoon letters),
`box` (coloured sticker), `pop` (bold outlined letters) or `comic`. New layers make the right side busy: `burst`
(comic explosion behind a word), `counter` (numbers counting up), `progress` (a bar like "DAY 7 / 30"), and each scene
can have a `backdrop` (rays, dots, grid, spotlight). The prompt for Claude/ChatGPT explains all of it; 9:16 videos are
unchanged. After an update START.bat installs the new fonts by itself (it re-runs npm install when package.json changed).

### Quality check

After *Check & preview* the tool also runs its quality check (`tools/reel_check.py`) with the real word times: moments with
nothing new on screen, sounds too close together, text outside the safe zone, 16:9 text without a style, rings that outlive
their picture, scenes that are too long. The notes appear in a yellow box: *Copy these notes for the AI*, paste them into the
same chat and paste the improved JSON back. The tool's own AI planner does two such improvement rounds by itself.
For ChatGPT / Claude projects upload `reel_check.py` as a knowledge file and turn on code execution: the instructions tell
the AI to run it on every plan and fix everything before answering.

### Shorts safe zone

In 9:16 videos every text and the captions stay inside the Shorts / Reels safe zone (measured on a 1080×1920 template:
113–988 px wide, 269–1492 px high, and left of 848 px below the middle where the like / comment buttons are), so the title,
channel name and buttons in the app never hide them. Texts the plan puts too low or too far right are moved in automatically.

### Thumbnail for Shorts

In step 3 (*Thumbnail*) upload your ready thumbnail (PNG / JPG / WEBP, 1080×1920 looks best). For 9:16 videos the
tool shows it full screen for the first 0.1 s of the video (3 frames), on top of the video, so the voice timing does
not change; on YouTube Shorts you can then pick that frame as the cover. 16:9 videos never get it: upload their
thumbnail on YouTube itself. *Remove* takes it out again.

### Voiceover without an SRT

Just upload the voiceover and paste the script: the tool listens to the audio and finds the time of every word
itself (offline, English). The script must be exactly what the voice says. Numbers can be written as digits or
words ("10", "90%", "1st", "push-ups" are understood), and unusual words (names, slang) get a guessed pronunciation.
For Hindi / Hinglish voiceovers upload an SRT as well.

After syncing, *Download SRT (word by word)* or *(caption lines)* gives an accurate SRT of the voiceover for other
editors (CapCut, Premiere…). If you upload an SRT for an English voiceover, the tool checks it against the audio and,
when its timing is off, uses the timing it heard instead (the message after *Upload & sync* says so).

## Bulk videos (5, 10 or more at once)

Open the **Bulk videos** tab and start a batch:
- **A · Choose how many videos** (3, 5, 10, 15, 20 or any number up to 50): you get that many empty video sections.
- **B · Paste all titles + scripts**: titles one per line, scripts in the same order, each in double quotes `"…"` (blank lines inside are fine) or separated by a line with `---`
  (or a blank line). The tool shows how they pair up and makes one project per title.

Then, in the batch. **Fastest: three clicks.**
- **⚡ Do it all**: makes every missing voice, checks every JSON (and asks the AI for missing plans if one is set up in the
  Library tab) and renders each video by itself as soon as its voice and JSON are ready.
- **Copy all JSON prompts**: ONE master prompt with every script. Paste it into Claude; it writes one JSON per video
  (files `01-….json`, `02-….json`, or `=== VIDEO 1 ===` before each). Paste its whole answer into the box and press
  **Import all JSON**, or press **Open .json files** and pick all its files at once (the number in each file name says which
  video it is). JSON imported before the voices exist is kept and checked as soon as each voice is ready.
- **Saved voices**: every AI voice is kept in `settings/voices/`. The same script + voice + speed is reused at once instead
  of being made again; *Add voices from older videos* saves the AI voices of earlier projects too.
- All missing voices are made in one run (the voice model loads only once), so a batch is much faster than one by one.

Step by step:
1. **AI voices**: pick a voice (▶ *Listen*, or *All voices* to hear each one first) and a speed (0.75x – 4x) and press *Make all voices (one click)* (they are made one after
   another). Or give one video its own voiceover with *Upload voiceover*. Each video can change its own speed later,
   and each card has a player to listen to its voice and a *Thumbnail* upload (shown for the first 0.1 s of the Short).
2. **JSON**: in each card press *Copy prompt*, paste it into ChatGPT / Claude, paste that video's JSON answer into the card
   and press *Validate & save*. Each card only ever changes its own video.
3. **Preview / Storyboard** per card (click a preview to open it large).
4. **Render all ready videos**: they render one after another; a video that fails does not stop the others.
5. **Download** each video, or **Download all as ZIP**.

Every video of a batch is also a normal project in *Make a video*, so the single-video workflow still works as before.

### Voice speed
Under the voiceover (single video) or in each card (bulk), pick 0.75x up to 4x. AI voices are spoken again
at that speed (above 2x they are spoken at 2x and sped up, same pitch); an uploaded voiceover is time-stretched (same pitch) and its word timings are scaled with it, so captions and
every phrase time in the plan stay in sync. Press *Check & preview* again afterwards.

## Library

The *Library* tab shows every image. To add images: choose *character poses* or *props*, press *Add images*
and select files on a plain white background. The tool removes the background, finds H's body parts and
adds the image. The file name becomes the id, e.g. `hero_pushup_bottom.png` → `hero_pushup_bottom`
(an existing id gets `_v2`, `_v3`, …). Remove an image with ✕.

**Background music** (top of the Library tab): the default track plays softly under every video, with a
short fade-in and a fade-out at the end. Choose another default, change the volume, or add a new track with
*Add a new track* (it becomes the default). Tracks live in `public/library/music/`. For one video only,
pick a track or *No music* in step 3, next to *Check & preview*.

**Sound effects** (Library tab, under the music): 73 sounds in six groups (transitions, pops/clicks/dings, impacts,
reactions & memes, body, ambience). Press ▶ to listen, *Edit* to change the description Claude/ChatGPT read
("what it sounds like → when to use it"), ✕ to delete. *Add sounds* adds your own files to the chosen group: the tool
cuts the silence at the start (so the sound lands exactly on its word) and evens out the loudness. Files live in
`public/library/sfx/`, the list in `public/library/sfx/library.json`.

**Voice and music loudness for one video:** under the preview (step 4) move the *Voice* (0–200%) and
*Background music* sliders (and *Sound effects*, for all sounds together) while the video plays. The MP4 uses the same levels; *Reset* goes back to normal.

## How it works

Claude never writes seconds or coordinates:

- **Times are words from the script.** `"at": "lift your legs"` means the moment the voice says it.
  The tool knows each word's time from the sync step (`src/timeRefs.js`).
- **Positions are body parts.** `{"type": "highlight", "anchor": "hips"}` puts a ring on H's hips in
  whatever pose is on screen, even while it zooms or moves. Body points come from MediaPipe Pose
  (`tools/body_points.py`), stored per image in `library.json` (`src/anchors.js`).
- **Pose changes stay aligned.** Frames of a `poses` layer are scaled to the same body size and pinned at the feet.

The instructions Claude receives are in `prompts/generate-timeline.md`; the tool adds the image list and the script.

## For developers

```bash
npm install && pip install -r requirements.txt
npm start                                   # web tool
npm test                                    # schema, time and body-part tests
npm run validate -- public/projects/core-v2 # check a project
npm run render -- public/projects/core-v2   # render from the command line
npm run studio -- public/projects/core-v2   # Remotion Studio preview
python3 scripts/align_words.py voice.wav script.txt words.json   # sync without the UI
python3 tools/measure_library.py public/library/hero/library.json  # body points for new images
```

```
src/schema.js        timeline format + validator
src/timeRefs.js      script words → seconds
src/anchors.js       body parts → canvas positions, pose alignment
src/layers.jsx       image, poses, text, highlight, arrow, measure, zoomBubble, split, pattern, video
src/Video.jsx        scenes, camera, shakes, transitions, audio
src/ui/              web tool page
tools/server.mjs     web tool server
tools/*.py           background removal, body points, single-image import
scripts/             CLI, word sync, batch import, prompt lists
public/library/hero  H images + library.json
public/projects/     one folder per video (core-v2 = example in the Claude format)
```
