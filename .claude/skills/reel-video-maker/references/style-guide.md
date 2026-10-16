# The approved look: v5 "animation" style (16 Oct)

Source of truth: `examples/05-glute-bridge-v5.json` (owner: "ye sahi hai"). It replaces the older box-label look of
examples 01–04: those plans still load, but **never copy their small stickers, chips or pastel colours**.

The video must feel like an animation: H really moves (animation clips), big bold words sit behind him, hard hits
(impact frames), fast whips between scenes. Nothing small and fiddly on screen.

## 1. Brand palette (only these colours)

| Name | Hex | Use |
|---|---|---|
| Ink black | `#111111` | big words, outlines |
| Pure white | `#FFFFFF` | background (always behind clips) |
| Power red | `#E3262E` | problem / wrong / pain words, red tape, red echo |
| Neon green | `#2FD94E` | the fix / right / working muscle, green echo, glows |
| Volt yellow | `#FFD23F` | warning tape, CTA rays (small doses) |
| Grey | `#B0B6BE` | the plan's grid only |

Never blue, pastel peach, pink or any other colour.

## 2. Top level

```json
{"title": "...", "progressBar": true,
 "captions": {"mode": "word", "keywords": [10-12 words], "bottom": [["<first words of scene 2>", "<first words of the CTA>"]]},
 "scenes": [...], "sfx": [...]}
```
No `theme`, no `font`. `progressBar: true` (thin red retention bar on top) in every video.

## 3. H moves: animation clips first

Whenever the voice talks about doing an exercise that has a clip (list in `references/library.md`, ids `clip_*`),
show the **clip**, not still poses:
```json
{"type": "video", "asset": "clip_pushup", "at": "...", "until": "...", "width": 1.0, "y": 0.58, "rate": 1.25, "enter": "whip"}
```
- `rate`: speed to fit the words: 1.2–1.4 for energy / "fast" / reps, 0.7–0.8 for "slowly" / form explanations.
- Width: lying / floor clips (push-ups, plank, bridge, leg raise, mountain climbers, rows, decline) `1.0`, `y` 0.58;
  standing clips (squat, curls, lateral raise, split squat, dip, dead hang) `0.62–0.7`, `y` 0.6.
- A scene with a clip is **always plain white**: write `"backdrop": "none"` (the tool forces it anyway). No rays,
  lines or triangles behind a moving H.
- No glow / arrow / highlight on a clip (they need a drawn pose); keep those for still images.
- No clip for that exercise → still poses (`poses`, crossfade 0, `enter` whip) and a clip request for the owner
  (12 credits each, see `references/library.md` "Missing clips").

Still images (reactions, counting, CTA): `"enter": "whip"` (fast slide in with ghost trail and a squash on landing),
first image of the video `"enter": "cut"`. New picture every 2–3 s, images chained without gaps.

## 4. Text: only BIG words (the owner rejected everything small)

**Never**: `look: box` stickers, `chip`, small labels, thin green outlines, step titles, `thumb` / `pop` / `hook` /
`comic` looks, big cards, kinetic, banners. The captions carry the sentence; the big word carries the idea.

One big word or short phrase per beat (1–2 words, max ~12 letters), **behind H** (`"behind": true`), single line,
high on the screen so his head never hides it:

| Style | JSON | When |
|---|---|---|
| **Giant + letter slam** | `{"type":"text","text":"WRONG MUSCLE","look":"giant","behind":true,"animation":"letters","x":0.5,"y":0.19,"size":150-220,"color":"#111111","align":"center","maxWidth":1,"untype":false,"tilt":0,"at":"...","until":"..."}` | the main word of a beat: "2 FIXES", "DO THIS", "HEELS", "SEND THIS" (red for a problem) |
| **Echo stack** | `look: "echo"`, `size` 220–260, `y` 0.27, `color` red (problem) or green (fix) | a one-word punch: "BACK?", "OFF", "TUCK", "LIFT", the closing echo "BRIDGES..." |
| **Marquee** | `look: "marquee"`, `size` 230–300, `y` 0.26–0.3, `speed` 380–420, black / red / green | the exercise name running behind a clip: "GLUTE BRIDGES", "SQUEEZE • SQUEEZE", "100 PUSH-UPS" |
| **Caution tape** | `{"type":"text","text":"WRONG","look":"tape","boxColor":"#FFD23F","y":0.74,"size":84,"tilt":-8,"speed":240,"at":"...","until":"..."}` | wrong form / myth. Yellow tape = black text; red tape = white text (automatic) |
| **Crossed out** | `{"type":"text","text":"YOUR GLUTES","font":"display","x":0.5,"y":0.62,"size":130,"align":"center","color":"#111111","animation":"none","untype":false,"strike":"<phrase>+0.25"}` | the thing that is NOT true / not working |
| **Outline behind a clip** | `look: "outline"`, `behind: true`, `size` 300, black or red (never thin green) | a giant hollow word behind a moving H |

Positions: lying clip/pose → word at `y` 0.26–0.3 (above him); standing H → `y` 0.19 single line, H at
`"width": 0.8, "y": 0.66` when the word is long. Two lines only for a giant number ("12-15") — never a two-line word
that his head covers.

## 5. Hits and movement

- **Impact frames** on the 2–3 strongest words of the video (pain, the mistake, the squeeze):
  `{"type": "pulse", "kind": "impact", "at": "<word>", "duration": 0.2}`.
- `speed` lines at `start` and on hard cuts; edge `pulse` (red / green) on strong words; `shakes` on the hook word.
- Transitions: `{"type": "whip", "duration": 0.32}` between scenes, `{"type": "zoomBlur", "duration": 0.45}` into the plan.

## 6. Backgrounds

Clip scenes: `"backdrop": "none"` (white). Other scenes: `spotlight` `#E3262E` (problem / the mistake),
`rays` `#FFD23F` (CTA), `grid` `#B0B6BE` opacity 0.6 (the plan). Never two scenes in a row with the same backdrop and
colour (clip scenes are exempt).

## 7. Scene template

| Scene | Content |
|---|---|
| `hook` (start, plain) | clip at `start` (`enter: cut`, rate 1.3) + marquee with the exercise name + `speed`; on the pain word: impact + reaction image + echo word + caution tape; crossed-out word; then giant "2 FIXES" / "1 MUSCLE" with a counting pose |
| `truth` / `mistake` (whip) | giant "THE MISTAKE" letter slam, poses of the wrong form + red glow + red tape + impact, echo word on the result |
| exercise scenes (whip, plain) | giant "DO THIS" → clip (slow for setup, fast for reps), one big word per step ("FEET CLOSE", "TUCK", "FLAT BACK", "HEELS", "LIFT"), marquee on the squeeze / reps, impact on the hardest moment |
| `plan` (zoomBlur, grid) | giant number "12-15" (letter slam), echo "3 SETS", clipboard / counting poses |
| `cta` (whip, rays yellow) | giant "SEND THIS" + `hero_point_viewer` + `prop_phone` (x 0.8, y 0.4, width 0.18); the problem pose + red tape; closing echo of the hook word + `sfx_gold_bell` |

## 8. Hook (first 3 s)

H moving on frame 1 (clip at `start`), marquee + `speed` at `start`, then 4+ changes before 3 s (speed lines, edge
pulse, reaction image, echo word, impact). Sound at `start` (`sfx_whoosh_big`) and on the strongest word.

## 9. Self-check

1. Phrases copied from the script, repeated ones with `#n`; ids only from `references/library.md`.
2. `progressBar: true`, no theme / font, captions.bottom set.
3. Exercise moments use `clip_*` videos when one exists, with a `rate` that fits the words; clip scenes `backdrop: none`.
4. **No** box labels, chips, small text, thin outlines; only giant / echo / marquee / tape / crossed-out / outline-behind.
5. Big words behind H, single line, high enough that his head never hides them.
6. Only palette colours. Impact on 2–3 words, whip transitions, zoomBlur for the plan.
