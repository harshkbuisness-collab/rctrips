---
name: reel-video-maker
description: Makes complete, ready-to-upload YouTube Shorts (MP4, 9:16, the cartoon character H, channel Effortless Exercise) with the Reel Engine tool, from a voiceover script or a topic: writes the JSON plan in the approved v5 animation style, makes the AI voice, renders, compresses, checks the frames, and writes the title, description and thumbnail prompt. Use when the user pastes a script / a batch of scripts / a topic and wants the video, or says "video bana do", "reel bana do", "make the video".
---

# Reel video maker (end to end)

You turn a voiceover script into a finished MP4 with the **Reel Engine** tool (Remotion + Node + Kokoro AI voice),
in the owner's approved **v5 animation style**: H moving in animation clips on plain white, giant words behind him,
impact frames, whip transitions, red progress bar, brand palette only.

Needs a computer with a shell (Claude Code on desktop / web / terminal). In plain claude.ai chat you can only write
the JSON (follow steps 2–3 and give the file).

## Files

| File | What |
|---|---|
| `tool/` | The whole Reel Engine tool, H images included (`tool/public/library/hero`); `setup` copies it to `~/reel-engine-tool` |
| `scripts/make_video.py` | Does everything after the plan: server, voice, cover, render, compress, frame sheet |
| `scripts/add_cover.py` | Puts the owner's thumbnail on the first 0.1 s of a finished MP4 (no re-render) |
| `scripts/check_plan.py` | Checks a plan against its script and the v5 style rules |
| `scripts/plan_lib.py` | Plan builder: a whole v5 plan in ~25 lines of Python (beats, scenes, CTA, auto sound effects) |
| `scripts/thumb_prompts.py` | Writes the upload text and all thumbnail prompts in ONE box |
| `scripts/batch.py` | Big batches: `render` (one after another, skips done), `cover` (match thumbnails), `pack` (zips under 400 MB) |
| `scripts/frame_strips.py` | One contact sheet for up to 10 videos (10 frames each) to check a batch fast |
| `references/style-guide.md` | **The approved look**. Read first, always |
| `references/spec.md` | Plan format: time phrases, layer types and fields |
| `references/library.md` | Every allowed image / clip / sound id. Never use an id not in it |
| `references/lessons.md` | Past mistakes and their rules |
| `references/thumbnail-prompts.md` | How to write the thumbnail image prompts (owner's own rules) |
| `references/clip-prompt.md` | Prompt for a new animation clip when an exercise has none |
| `examples/05-glute-bridge-v5.json` + `.txt` | The gold plan. Copy its structure, never its phrases |
| `examples/plan-builder-example.py` | Two real reels (lovehandles, wallsit) written with `plan_lib.py`, with their `.txt` and `.json` |

## Step 0: the tool (bundled, nothing to ask the owner)

The whole Reel Engine tool (code, H images, animation clips, sounds) is inside this skill in `tool/`. Never ask the
owner for tool files, never fall back to "JSON only". Once per computer / session run:
```bash
python3 <skill>/scripts/make_video.py setup
```
It copies `tool/` to `~/reel-engine-tool` (writable), runs `npm install`, installs the Python helpers and the AI
voice; the first voice downloads the voice model (~350 MB from github.com) once. `check` and `video` do this by
themselves if it was not done. Needs Node 18+ and Python 3.9+ (ffmpeg optional). No API keys.
`TOOL` below means `~/reel-engine-tool`; `--tool` can be left out everywhere.

## Step 0.5: thumbnail prompts FIRST (owner's rule, 16 Oct)

Before making any video, give the owner the thumbnail prompts for every video in the batch (one code block, see
`references/thumbnail-prompts.md`). The owner makes the thumbnails and sends them back. Render the videos meanwhile;
when a thumbnail arrives, put it on the first 0.1 s of its video:
```bash
python3 scripts/add_cover.py <out>/<name>.mp4 <thumbnail.jpg>      # seconds, no re-render
```
Deliver videos only with their cover on. Ask the owner to name each thumbnail after its video (or its number).

## Step 1: script

Use the owner's script as is (English, ~30–45 s, ends with "Send this to …"). If they only gave a topic, write the
script first in that style (hook ≤ 8 words, problem, 1–2 exercises with clear form cues, sets/reps, "Send this to
the friend who …", closing echo of the hook) and show it to them in the answer. Save it as `work/<name>.txt`.

## Step 2: plan

Read `references/style-guide.md`, `spec.md`, `library.md` and the example, then write `work/<name>.json`
(scene template: hook → truth/mistake → one scene per exercise → plan → CTA). Exercise moments use the matching
`clip_*` with a `rate` fitting the words. No clip for the exercise → still poses, and tell the owner which clip to
make with `references/clip-prompt.md`.

## Step 3: check until clean

```bash
python3 scripts/check_plan.py work/<name>.txt work/<name>.json        # fix every ERROR and STYLE line
python3 scripts/make_video.py check --script work/<name>.txt --plan work/<name>.json --name <name>
```
The second command makes the voice and loads the plan in the real tool; fix every error it prints. A quality note
about the script's first sentence is about the script, not the plan: mention it once, don't block on it.

## Step 4: render

```bash
python3 scripts/make_video.py video --script work/<name>.txt --plan work/<name>.json --name <name> \
  [--cover thumbnail.jpg] [--out <folder>]
```
Gives `<out>/<name>.mp4` (default `TOOL/out/final/`) and `<name>-frames.jpg` (one frame per second).
`--cover` puts the owner's thumbnail on the first 0.1 s (they pick it as the cover in the YouTube app).
One render takes ~3–8 min; run batches one after another, not in parallel.

## Step 5: look before you deliver

Open `<name>-frames.jpg` and check: H big in every frame, no word hidden behind his head, no text on his face,
clips on white, nothing small. Fix the plan and render again if anything is wrong (max one re-render per video).

## Batch mode (15–60 reels at once, the usual case)

1. Write all scripts (`work/<name>.txt`), show them to the owner, and give the thumbnail prompts in one box.
2. Write the plans with `plan_lib.py` (one builder file per 15 videos, see `examples/plan-builder-example.py`), then
   `check_plan.py` + `make_video.py check` for each.
3. `python3 scripts/batch.py render name1 … name15` (12–15 per call; re-run to continue, it skips finished ones).
4. `python3 scripts/frame_strips.py sheet.jpg name1 … name10` and look at every sheet; fix and re-render (max once).
5. When the thumbnails arrive: `python3 scripts/batch.py cover --thumbs work/thumbnails --out work/final --start 46 name…`
   (thumbnail files named `<number>-<name>.jpg`; it lists the missing ones → give a prompt box for only those).
6. `python3 scripts/batch.py pack --src work/final --zip work/<Batch>.zip --text work/UPLOAD-TEXT.md`.

## Step 6: deliver

A batch goes in ONE zip (owner's choice). The file upload limit is 400 MB: `batch.py pack` re-encodes the covered MP4s
at crf 24 (6–8 MB per reel, 60 reels ≈ 365 MB, no visible loss on a phone) and zips with `zip -0`.
When the owner wants full quality and the total is over 400 MB, `--full` makes balanced parts (`-part1-of-3.zip` …);
tell them one zip is impossible at that size. Number the files `<NN>-<name>.mp4` and the upload text to match.

Give the MP4 (send the file if you can), then for each video:

```
<name>.mp4
TITLE: <hook as a question or claim, ≤ 70 chars> #shorts
DESCRIPTION:
<1–2 sentences: the problem and why>
✅ <exercise 1: one form cue, reps>
✅ <exercise 2 …>
✅ <sets, days per week>
Send this to the friend who <…> 👇
#<topic> #<muscle> #homeworkout #calisthenics #fitness #effortlessexercise
```

Thumbnail prompt: follow `references/thumbnail-prompts.md` exactly (the owner's thumbnail skill: full standalone
prompt per video, attached H character, plain white background, two-line text label with the Anton font line,
crop-safe spacing, AVOID list; ALL prompts in ONE box starting "CREATE ALL IMAGES FOR THESE N THUMBNAILS"; failed
images → one new box with only the missing ones). `scripts/thumb_prompts.py` writes it.
Thumbnail prompts are always in English.

Answer the owner in simple Hinglish; titles, descriptions, scripts and JSON stay English.
Before choosing a new topic, ask which videos are already uploaded so topics don't repeat.

## Troubleshooting

- `the server did not start` → read `TOOL/out/server.log`; if another program uses the port, add `--port 3021`.
- Render fails with a Chrome error → run `npx remotion browser ensure` inside TOOL once.
- Voice fails → run `setup` again; check `python3 -c "import kokoro_onnx"`.
- Project names are made from `--name` (letters and numbers only); a re-run with the same name reuses its voice.
