# JSON plan writer: how to write plans that pass and look right

For a coding agent (Codex, Claude Code) whose job is to write the JSON plan for each voiceover script.
The full plan format is `prompts/generate-timeline.md` (that file is the spec; this file is the craft and the
workflow).

**Allowed ids**: the tool merges every library file: `public/library/library.json` (a few demo / shared entries),
`public/library/hero/library.json` (all H poses and the props) and `public/library/sfx/library.json` (sounds), plus
any other `public/library/<set>/library.json`. All of their ids are allowed, except ids starting with `demo_`.
Print the exact list (with descriptions and the movement sets) with:
```bash
node scripts/plan-check.mjs --library
```
**Never invent an id.** `plan-check` reports any id that is not in these libraries.

## 1. Workflow for every script

1. Read the script. Mark: the hook (first sentence), the problem, the "truth" / reason, each exercise or tip, the
   plan (sets / reps / days), the call to action ("Send this to …"), and the closing line (usually repeats the hook).
2. Find every phrase you will use as a time **in the script text**. A phrase spoken twice needs `#1` / `#2`, or a
   longer phrase that occurs once. Apostrophes are part of words: write `And here's the real`, not `And here`.
3. Write the plan following the scene template (section 2) and the rules (section 3).
4. Check it, fix, repeat until there are **0 errors**:
   ```bash
   node scripts/plan-check.mjs script.txt plan.json            # estimated word times
   node scripts/plan-check.mjs script.txt plan.json --words public/projects/<n>/words.json   # real times, after the voice exists
   ```
   Errors must be 0. Quality notes must be 0, except notes about the **script itself** (e.g. "the first sentence takes
   3.6 s"), which the plan cannot fix: report those to the owner instead.
5. When a server is running and the voice exists: post the plan (`POST /api/projects/:n/timeline`), make a storyboard
   (`POST /api/projects/:n/storyboard`) and look at the stills (section 5) before calling it done.

## 2. The approved look (the default for every video)

The owner approved one look: the reference video "bicep curls won't give you big arms" plus the motion graphics of
`examples/plans/08-pushups-motion-graphics.json` (script `examples/scripts/08-…txt`). Plans `07` and `08` are the gold
examples; `01`–`06` are older plans in a rejected style (effortless theme, outlined stickers, big cards, pattern
backgrounds): keep them only as format / regression fixtures, never copy their look.
`prompts/generate-timeline.md` has every rule; in short:

| Scene | Starts at | Backdrop / transition | Content |
|---|---|---|---|
| `hook` | `start` | `spotlight` `#FF8A80`, no transition | H on frame 1 (`enter: cut`), box label with the hook words at `start` (y 0.7, `animation: words`), `speed` at `start`, a `chip` with the number, a `glow` on the muscle, a new pose + label on each key word (`enter: punch`), `pulse` + `shakes` + `speed` on the strongest word |
| `truth` | its first words `-0.1` | `spotlight` `#7FB2FF`, circle 0.6 | short title, `hero_idea_bulb`, chip, poses on the key words, glow, labels at y 0.58 (0.36 over lying poses) |
| one per exercise | its first word `-0.1` | `rays` `#3DDC84`, circle 0.6 | the movement as `poses` (`crossfade: 0`), a `path` for arm / leg movements, labels, arrows |
| `plan` | "Three sets-0.1" | `grid` `#B0B6BE` opacity 0.6, zoomBlur 0.45 | `hero_clipboard`, counting poses with number labels, a `calendar` chip |
| `cta` | "Send this to-0.1" | `rays` `#FFD23F`, circle 0.6 | `hero_point_viewer` + `prop_phone`, "*SEND* THIS", the problem pose again, a red closing label, `sfx_gold_bell` |

Top level: no `theme`, no `font`; `"captions": {"mode": "word", "keywords": [10–12 words], "bottom": [["<scene 2 words>", "<CTA words>"]]}`.

## 3. Rules that the owner checks (and the mistakes that broke earlier plans)

- **H big on every frame**, the first one too; a new picture every 2–3 s, chained without gaps. A `poses` layer
  **without `at`** is visible from the start of its scene: give it `"at"` when it must appear later.
- Sizes: standing / dumbbell `poses` `"width": 0.66, "y": 0.6`; lying poses `"width": 0.82, "y": 0.56` and no camera
  zoom; hanging / dips `"width": 0.72, "y": 0.62`. `"crossfade": 0` (the default now). Never `"enter": "squash"`.
- **Nothing on H's face**: chips / icons / props at `x` ≤ 0.24 or ≥ 0.78, `y` 0.32–0.45; nothing near a lying H's head.
  A `glow` near the face shrinks or disappears by itself, but anchor it on the muscle, not the head.
- Labels: `"look": "box"` with `boxColor` (black topic, red problem, green fix, blue detail / number), the key word
  between stars, `y` 0.7 in hook / CTA, 0.58 in the middle, 0.36 over lying poses, always with `until`.
- `path` only for movements that travel far (curls, raises, presses), with a one-side anchor (`left_hand`) and
  `fromAt` / `toAt` on the words where the pose is down / up. Not on push-ups or planks (the chest barely moves).
- No white `flash` pulse on the first frame (it washes out the opening); use `pulse` `kind: "edge"`.
- Never: `burst`, `kinetic`, `banner`, `thumb` / `hook` / `pop` / `comic` looks, big cards, pattern backdrops,
  `glitch` / `wipe` / `flash` transitions.
- Only alternate frames of the **same movement set** (`hero_pushup_top` ↔ `hero_pushup_mid`, `hero_curl_down` ↔
  `hero_curl_up`, …). Ring the exact part named (lats → `back`, biceps / triceps → `arms`, obliques → `abs`).
- Sounds: from the Sound effects list only, ≥ 0.5 s apart, never the same sound twice in a row; chips, glows, paths and
  speed lines play their own sound. At most 2 meme voice clips. End with `sfx_gold_bell`.
- Leave out `canvas`, `audio`, `wordsFile` (the tool fills them).

## 4. Missing poses: use these, and tell the owner

The library has no drawing for these; the stand-ins below are what the reference plans use:

| Script says | Use | Note |
|---|---|---|
| side plank | `hero_plank` (+ title "SIDE PLANK", callout "ONE FOREARM") | front plank drawing |
| bicycle crunch | `hero_reverse_crunch` | knees-to-chest drawing |
| lateral raise | `hero_arm_circles` (arms out to the sides) + arrow up on `hands` | |
| table row | `hero_row_start` ↔ `hero_row_end` | drawn with a bar, not a table |
| chair dip | `hero_dip_top` ↔ `hero_dip_bottom` | drawn with parallel bars |
| heavy side bend (wrong) | `hero_dumbbell_hold` | |

Never write an id that is not in the library to "fix" this.

## 5. Looking at the result (the plan is not done until this is checked)

From the storyboard stills (or MP4 frames every 0.5 s):
H big on frame 1 and every frame (feet inside the frame on lying poses); hook words readable on frame 1; nothing on
his face; labels not on a lying H's body; the picture matches the words (the wrong form looks wrong); labels and
chips inside the safe zone (not under the Shorts buttons at the bottom / right); captions at the bottom from scene 2.

## 6. Batch mode

The batch master prompt (`GET /api/batches/:id/prompt`) lists every script once as `### VIDEO n: title`. Write one
plan per video and save them as `01-<slug>.json`, `02-<slug>.json` … (or one text with `=== VIDEO n ===` before
each plan). Check each file with `plan-check` against its own script, then import them all at once
(`POST /api/batches/:id/plans`, or "Open .json files" in the Bulk page). Each video number only once: a repeated
`VIDEO n` is rejected.

## 7. Done means

- `plan-check` with the real `words.json`: 0 errors, 0 quality notes except script-only notes (reported).
- Storyboard looked at, section 5 all true.
- The plan uses the script's words for every time, the library's ids for every asset and sound.
