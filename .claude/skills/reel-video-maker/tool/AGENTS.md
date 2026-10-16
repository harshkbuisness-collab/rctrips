# Reel Engine: handoff for coding agents (Codex, Claude Code, …)

Read this whole file before changing anything. It explains what the tool is for, how the parts fit together, how to test
the whole thing for real, and the weak spots already known. **Do not assume the current code is correct**: check it
against the end-to-end tests below and fix the root cause of anything that fails.

## 1. What the tool does

A local web app (Node server + React UI + Remotion renderer + small Python helpers) that turns a **voiceover script**
into a finished **fitness YouTube Short (1080×1920)** for the channel *Effortless Exercise*. The star is **H**, a bald,
muscular cartoon man drawn in ~190 poses (`public/library/hero/`).

Pipeline for one video:

```
script text
  → AI voice (Kokoro, offline)                     scripts/tts.py
  → word timings (pocketsphinx aligner, or estimated from sentence times)
                                                   scripts/align_words.py / wordsFromSegments() in tools/server.mjs
  → JSON plan written by an LLM (Claude / ChatGPT / Gemini) from a generated prompt
                                                   tools/prompt.mjs + prompts/generate-timeline.md
  → plan validated, phrase times resolved to seconds, quality checked
                                                   src/timeRefs.js, src/schema.js, tools/reel_check.py
  → preview in the browser (@remotion/player), storyboard stills, MP4 render
                                                   src/Video.jsx and friends, scripts/render-lib.mjs
```

The owner works on **Windows**, starts the tool with `START.bat` (installs npm + pip packages, then `node tools/server.mjs`),
opens `http://localhost:3000`, and mostly uses the **Bulk videos** tab (5–10 videos at a time).

## 2. Run it

```bash
npm install                      # Node 20+; Remotion 4.0.x, React 19, zod 4
pip install -r requirements.txt  # Python 3.9–3.13 (3.14 has no pocketsphinx / onnxruntime wheels yet)
npm start                        # = node tools/server.mjs, PORT env var to change 3000
npm test                         # fast checks without a browser (schema, time refs, anchors, SRT)
```

- Kokoro voice model (~350 MB) downloads on first use into `.cache/kokoro/` from GitHub releases.
- ffmpeg is the one shipped with Remotion (`npx remotion ffmpeg …`, see `remotionCli()` in the server).
- The UI is bundled by esbuild at server start (`buildUi()`); there is no separate build step.
- User data lives in `public/projects/<name>/` (script, voice, words, timeline, meta), `settings/` (batches, AI keys,
  saved voices; git-ignored) and `out/` (renders, storyboards, samples; git-ignored).

## 3. Map of the code

| Area | Files | Notes |
|---|---|---|
| HTTP API + jobs | `tools/server.mjs` | All routes (`route(method, regex, fn)`), job queues (voices, AI plans, renders, storyboards), batch logic |
| Prompt for the LLM | `tools/prompt.mjs`, `prompts/generate-timeline.md` | `buildPrompt()` (one video), `buildBatchPrompt()` (master prompt for a whole batch), `libraryText()` |
| LLM providers | `tools/ai.mjs` | Gemini, OpenAI, Claude Code CLI; `planWithAi()` asks, validates and retries with the errors |
| Plan schema | `src/schema.js` | zod schema of every layer type, defaults, `checkTimeline()`, safe zone, formats |
| Phrase times | `src/timeRefs.js`, `src/mergeWords.js`, `src/words.js` | `"phrase"`, `"phrase|end"`, `"phrase#2"`, `"phrase+0.3"`, `start`, `end`; digits = number words |
| Project loading | `scripts/project.mjs` | `loadLibrary()`, `loadProject()` (reads words.json, resolves times, validates) |
| Rendering | `src/Video.jsx` (scenes, camera, transitions, auto layout, hook punch, captions), `src/layers.jsx` (image, poses, text, highlight, arrow, measure, zoomBubble …), `src/graphics.jsx` (motion graphics: banner, callout, checklist, bars, ring, versus, chat, accent, icon, stat, comment, timeline, slider, kinetic, progress), `src/fx.jsx` (chip, glow, path, pulse, speed: the approved motion graphics around H), `src/mgLayout.js` (shared sizes / times / auto sounds / face guard), `src/anchors.js` (body-part points per image), `src/textSafety.js`, `src/theme.js`, `src/icons.jsx`, `src/Captions.jsx`, `src/motion.js` | |
| Render / storyboard | `scripts/render-lib.mjs` | `renderProject()`, `storyboardProject()` (HTML with stills at every change) |
| Quality checker | `tools/reel_check.py` | Editor rules: hook in 3 s, ≥4 changes, motion graphic every ~10 s, empty moments, sound spacing, safe zone … Prints "quality notes" (the plan still works) |
| Voice | `scripts/tts.py` | Kokoro; `--many jobs.json` makes many voices with the model loaded once; writes `voice.wav.segments.json` (sentence + comma-pause times) |
| Word sync | `scripts/align_words.py` | pocketsphinx forced alignment of the script against the audio |
| UI | `src/ui/main.jsx` (single video), `src/ui/bulk.jsx` (batches), `src/ui/common.jsx` (api, VoicePicker, SpeedPicker), `src/ui/splitBulk.js` (split pasted titles/scripts), `src/ui/ui.css` | |
| Library | `public/library/hero/` (+ `library.json` with descriptions and body points), `public/library/sfx/`, `public/library/music/`, props | Asset ids are the contract between the prompt and the renderer |

### Main API routes (all JSON)
- Project: `GET /api/projects/:n`, `POST …/voice` (upload), `POST …/sync`, `POST …/tts` `{script, voice, speed}`, `GET …/tts`,
  `POST …/speed` `{speed 0.5–4}`, `GET …/prompt`, `POST …/timeline` (body = plan JSON text → validation + preview props),
  `POST …/autoplan`, `POST …/render`, `GET …/render`, `POST …/storyboard`, `POST …/cover`, `POST …/details`.
- Voices: `GET /api/tts/voices`, `POST /api/tts/sample` `{voice, speed}`, `GET /api/voices` (saved voices),
  `POST /api/voices/import`, `POST /api/voices/delete`; saved voice audio at `/_voices/<key>.wav`.
- Batches: `GET/POST /api/batches`, `GET /api/batches/:id`, `…/add`, `…/remove`, `…/delete`, `…/tts` `{voice, speed, all}`,
  `GET …/prompt` (master prompt), `POST …/plans` (body = LLM answer with `=== VIDEO n ===` markers or plain JSON objects in
  order), `POST …/run` ("Do it all"), `POST …/aiplans`, `POST …/render`, `GET …/zip`.

## 4. The JSON plan (the contract)

The LLM writes it; the tool validates and renders it. Full spec for the LLM: `prompts/generate-timeline.md` (keep it and
`src/schema.js` in sync; a field documented there but missing in the schema, or the other way round, is a bug).

- Times are **words of the script**, resolved against `words.json` → speed changes never break a plan.
  Grammar in `src/timeRefs.js`: `phrase`, `phrase|end`, `phrase#n`, `phrase±s`; the order is `phrase|end#n+0.3`.
- Scenes are in time order; a scene ends where the next starts. Layers are drawn in order.
- Body parts (`chest`, `hands`, `left_hand` …) attach rings/arrows/measures/callouts to the character layer above
  them; their positions per image come from `library.json` (`tools/body_points.py`, `tools/measure_library.py`).
- `src/Video.jsx` adds things the plan does not write: hook zoom punch, H breathing / keyword bounce, auto backdrops,
  auto sounds per graphic (`graphicSounds()`), H moving down and shrinking under big cards (`prepareScene` / `fitBelow`),
  face guard (`avoidFaces`), caption hiding while a card is up, safe-zone moves.

**Writing plans yourself** (the main job for an agent here): follow `prompts/json-writer-guide.md` and check every plan
with `node scripts/plan-check.mjs <script.txt> <plan.json> [--words words.json]` (no server, no voice needed) until it
has 0 errors.

Reference plans that render correctly (use them as regression fixtures): `examples/plans/*.json` with their scripts in
`examples/scripts/*.txt` (made with Kokoro voice `am_michael`, speed 1.1).

## 5. Product rules (the owner insists on these; the checker and prompt enforce most)

1. Look: the approved reference style (see `prompts/generate-timeline.md`, gold plans `examples/plans/07-…` and
   `08-pushups-motion-graphics.json`): no `theme`, `spotlight` / `rays` / grey `grid` backdrops, colourful `box` labels
   with word-pop, `captions.bottom` from scene 2 to the CTA, `circle` transitions. Plans `01`–`06` are an older,
   rejected style (effortless theme, outlined stickers, big cards): fixtures only.
2. **H is big and visible in every frame**, including the very first; never a text-only moment, never shrunk under a card.
3. **Nothing on H's face** (props, icons, drops, callout labels, accents, glows).
4. **Hook in the first 3 s**, fast: H + a box label with the hook words + speed lines on frame 1, ≥4 visual changes
   before 3 s (chip, glow, new pose + label, edge pulse + shake), a sound at the start, a hit on the strongest word.
5. No stars / `burst`, no big cards / kinetic / banners. Motion graphics around H instead: `chip`, `glow`, `path`,
   `pulse` (edge), `speed` (`src/fx.jsx`).
6. Pictures must match the words: alternate only frames of the same movement set; a mistake must look wrong.
7. Storyboard first: the owner approves a storyboard before a final video is made for them.
8. Captions synced to the voice; sounds from the library only, not too dense (≥0.5 s apart).

## 6. Known weak spots (verify, then fix properly)

These are real issues seen while building it, not guesses. Re-check each one; some may hide others.

1. **Job state is in memory.** Voice / AI-plan / render queues (`ttsQueue`, `aiPlanQueue`, `renderQueue`, `ttsJobs`,
   `renders`, `plans` maps) are lost when the server restarts; `meta.autoRender` / `autoPlan` flags stay set but nothing
   resumes them. A restart during "Do it all" leaves videos stuck. Persist the queues or resume from project meta at start.
2. **Word timing without pocketsphinx is estimated** (`wordsFromSegments`: sentence times + comma pauses, ~0.1 s average
   error). On Python 3.14 or when the wheel is missing it is silently the only option. Hindi voices always use it.
   Measure caption/phrase sync on real renders; consider a better aligner (e.g. a CTC/whisper-based one that runs on CPU).
3. **Kokoro above 2x** is made at 2x then sped up with ffmpeg `atempo` (`speedUpFile`). Check quality and that word
   timings after speed-up still match (segments are scaled; the aligner re-runs on the final audio).
4. **LLM output is the weakest link.** Plans often use phrases not in the script, repeat a phrase without `#n`, invent
   asset ids, or break the hook rules. `planWithAi()` retries with the validator errors; the master prompt for a batch
   can be cut off for many videos ("continue from VIDEO n"). `POST /api/batches/:id/plans` splits answers by
   `VIDEO n` marker lines or by top-level JSON objects in order; test it with messy real answers (prose, fences,
   files, partial answers, a video answered twice).
5. **Missing poses** force approximations: no side plank (uses `hero_plank`), no bicycle crunch (`hero_reverse_crunch`),
   no lateral raise (`hero_arm_circles`), table rows use the bar drawing (`hero_row_*`), chair dips use parallel bars
   (`hero_dip_*`). The LLM cannot know this; the prompt only lists what exists. Report gaps, do not fake images.
6. **`measure` labels** between left/right body parts (e.g. `left_hip` → `right_hip`) sit awkwardly (on the shorts);
   check label placement in stills.
7. **Quality notes vs errors**: `reel_check.py` hook rules about the *script* (first sentence > 3 s) cannot be fixed by the
   plan; they are notes. Don't turn them into hard errors.
8. `checkTimelineText()` throws (instead of returning errors) when a project has no `words.json`; callers must handle it
   (the batch import does).
9. Renders are sequential and slow on CPU (~3–4 min for a 37 s Short in the cloud sandbox). `renderProject` uses Remotion's
   default concurrency (no setting in `scripts/render-lib.mjs`); do not run renders in parallel without measuring memory.
10. UI state for long jobs is polled every 2 s per batch; very large batches (50) poll a lot of data (`itemStatus()` reads
    every script and timeline on each call).

## 7. How to test for real (do this before claiming anything works)

Never report success from reading code. Run the tool and look at the output.

1. `npm test` passes.
2. Start the server on a spare port: `PORT=3011 node tools/server.mjs`.
3. **Single plan**: create a project, make a voice, post a reference plan, expect `ok: true`:
   ```bash
   curl -s -XPOST localhost:3011/api/projects/t1/tts -d "{\"script\": $(jq -Rs . < examples/scripts/02-pushups-flat-chest.txt), \"voice\": \"am_michael\", \"speed\": 1.1}"
   # poll GET /api/projects/t1/tts until state = done
   curl -s -XPOST localhost:3011/api/projects/t1/timeline --data-binary @examples/plans/02-pushups-flat-chest.json | jq '{ok, errors, quality}'
   ```
4. **Batch end-to-end**: `POST /api/batches` with `items: [{title, script}]` for all six examples →
   `GET …/prompt` (check every script is in it, once) → `POST …/plans` with an answer made of the example plans behind
   `=== VIDEO n ===` lines → `POST …/run` → poll `GET /api/batches/:id` until every video has `video` set → `GET …/zip`.
5. **Look at the result**: storyboard (`POST /api/projects/:n/storyboard`, then open `out/<n>-storyboard.html`; the stills
   are embedded base64 images) and frames of the MP4 (`npx remotion ffmpeg -i out/<n>.mp4 -vf fps=2 frame_%03d.jpg`).
   Check: H big on frame 1 and every frame, hook words on frame 1, nothing over his face,
   text inside the safe zone, captions matching the voice, pose changes on the right words.
6. **Sync check**: compare `words.json` against the audio (e.g. play a phrase window with ffmpeg `-ss/-to`), and for
   speed changes compare `words-original.json` vs `words.json` scaling.
7. UI: drive it with Playwright (Chromium is pre-installed in the cloud sandbox at `/opt/pw-browsers/chromium`) and
   screenshot the Bulk page; there must be no `pageerror`.
8. Clean up test projects, batches, `settings/voices` test entries and `out/` files afterwards.

## 8. Working agreements with the owner

- Commit locally with clear messages; **do not push to GitHub and do not open PRs unless the owner asks**.
- The owner gets updates as a full zip only when the tool itself changed (no zip for plan-only work).
- Never ask for API keys in chat; the tool has its own AI settings page.
- Replies to the owner are in simple Hinglish (Hindi in Latin letters + English).
- Do not invent data (asset ids, timings, results). If an asset or pose is missing, say so.
