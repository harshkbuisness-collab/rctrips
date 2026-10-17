# Lessons from real videos (oldest first)

Each line is a real problem the owner saw, and the rule that prevents it.

## Owner decisions
- Stars / bursts covered H → never `burst`.
- Plain purple backgrounds looked weird → light backgrounds, mostly white (glow / rays).
- Strong dotted, lined-paper and striped backgrounds looked unprofessional → only `spotlight`, `rays`, faint grey `grid`.
- A video opened with only text → H on the first frame, always.
- A water drop / bottle landed on H's face → nothing on the face or head.
- H was made small at the start (under kinetic text / cards) → no kinetic, no big cards; H stays big.
- Red text with a thick black outline and black outlined stickers looked unattractive → colourful `box` labels only.
- No visible transitions → `circle` (duration 0.6) between scenes.
- Hook too slow → 4+ changes before 3 s.
- 12 Oct: the push-ups demo with chips, glows, paths, edge pulses, speed lines and word-pop labels was approved as
  "the best: keep it for all our videos" → `examples/04-pushups-motion-graphics.json` is the default look.

## Validator errors (the plan did not load)
| Mistake | Rule |
|---|---|
| `"And here"` when the script says "And here's the real answer" | Copy words exactly; apostrophes belong to the word |
| `"every day"` spoken twice without `#n` | `every day#1` / `every day#2`, or a longer unique phrase |
| `look skinny#3` when it is spoken twice | An occurrence that does not exist is an error |
| `"from the side#2|end"` | Order: phrase, `|end`, `#n`, offset → `"from the side|end#2+0.3"` |
| Ids not in the library (`hero_side_plank`, `sfx_airhorn`) | Only `references/library.md`; see the stand-ins below |
| "The JSON is cut off: only N characters arrived" | The owner's copy was incomplete: send a compact one-line JSON or a file; tell them "Open JSON file" |

## Rendered-video problems
| Problem | Rule |
|---|---|
| Captions printed over a light bulb above H's head / over his face | `captions.bottom` from scene 2 to the CTA |
| A callout line pointed at the neck / belt (anchor `arms` / `hands` = the middle of a pair) | One side only: `left_arm`, `left_hand` |
| H vanished for a moment at a pose change (`squash` starts from nothing) | `"enter": "punch"`; images chained with no gap |
| Two bodies blended during a movement (`crossfade`) | `poses` with `"crossfade": 0` |
| Dumbbell curl pose too big, head under the caption, dumbbells out of the frame | Dumbbell / standing exercise poses `"width": 0.66, "y": 0.6` |
| A progress bar with the label "ARM SIZE" was drawn huge and covered the sticker | `progress` only with a 3-character label ("1/3") and no box label at the same time |
| A card covered the top of H's head; H tiny under ring / timeline / slider | No big cards |
| The same pose held 8–12 s | New picture every 2–3 s |
| Push-up / plank pose at width 0.92 (+ a camera zoom): feet cut off at the left edge | Lying poses `"width": 0.82`, no camera zoom |
| Labels at y 0.58 sat on the lying H's shoulders | While a lying pose is on screen, labels at `y` 0.36 (above him) |
| A stopwatch prop and a down arrow beside a lying H landed by his head / feet | No props or arrows around lying poses |
| An icon landed on the dumbbell H was holding | Props / icons beside the legs or away from the hands of that pose |
| A white `pulse` flash at `start` washed out the first frame | No flash at `start`; `speed` lines + an edge pulse later |
| Chips at the old small size were hard to read | Leave `size` out (68) |
| A chest glow on a lying H covered his face | The tool now keeps glows off faces; still anchor muscles, not the head |
| A `path` on push-ups was invisible (the chest barely moves) | `path` only on curls / raises / presses (standing poses) |
| The tool's checker said "add at least one big card" | Removed: big cards shrink H. Use chips, glows, paths instead |
| Crop images (`hero_arm`, `hero_abs`) filled the screen like a cut-out square | Use full-body poses (`hero_adjust_wristband`, `hero_measuring_waist`); zoom with `camera` instead |
| Pike push-up label at y 0.36 sat on his hips; at 0.7 it covered his head (head down by the hands) | Pike poses: labels at `y` 0.22 (above the hips) |
| Row / reverse-crunch labels at 0.36 sat on the bar / his feet | Rows: labels at `y` 0.72; reverse crunch (legs up): `y` 0.2 |
| An arrow on `left_hand` of `hero_arm_circles` was drawn on his chest | No arrows on arm-circle poses; use a `glow` on the shoulders |
| Measure label "SAME" on the shoulders landed on his face | Shoulder `measure` without a label; the label only on the waist line |
| Chips in the hook / CTA landed on the big top captions (the face guard pushes a chip above a standing H's head) | Hook / CTA chips at `y` 0.3 on the free side of the pose (e.g. `x` 0.22 when he faces right), or no chip: the box label already says it |
| `hero_lying_topdown` drawn as a standing image: labels at 0.58 sat on his body | Top-down lying images are lying poses: `width` 0.82, `y` 0.56, labels at `y` 0.36 |
| `hero_flying` (a flying superhero with a cape) used for "lie face down" | Face-down floor exercises: `hero_cobra_stretch` / `_v2` with the label saying the move |
| A chip said "DAILY" when the script never said it | Chip and label text only say what the voice says |

## Missing poses (use these stand-ins and tell the owner)
| Script says | Use |
|---|---|
| hammer curl | `hero_curl_down` ↔ `hero_curl_up` + label "PALM FACING IN" |
| side plank | `hero_plank` + label "SIDE PLANK" |
| bicycle crunch | `hero_reverse_crunch` |
| lateral raise | `hero_arm_circles` + arrow up on `left_hand` |
| table row | `hero_row_start` ↔ `hero_row_end` (drawn with a bar) |
| chair dip | `hero_dip_top` ↔ `hero_dip_bottom` (parallel bars) |
| heavy side bend (wrong) | `hero_dumbbell_hold` |

## v5 (16 Oct): animation style
| Problem | Rule |
|---|---|
| Rays / lines / triangles behind an animation clip looked busy | Clip scenes are plain white (`backdrop: none`) |
| Small box stickers ("1. TUCK YOUR PELVIS", "FEEL IT WHERE?"), chips ("FIX TODAY") and a thin green outline looked cheap | No small text at all: only giant / echo / marquee / tape / crossed-out / outline-behind words |
| Black text on a red tape was unreadable | Tape text is white on red, black on yellow (the tool does it) |
| A two-line giant word ("2 / FIXES") was hidden behind H's head | Big words on one line at `y` 0.19, H lower (`width` 0.8, `y` 0.66) |
| A red marquee behind a clip tinted H red (clips are multiplied) | Keep big words above the clip's figure (`y` 0.26–0.3), not across his body |
| Split solid / outline word, neon glow, marker highlight, sticker box, word pop | Rejected by the owner: do not use |
| A caption ("Every single day.") was printed on top of a caution tape | Fixed in the tool (v19): every caption moves just above any tape on screen. Keep tapes at `y` 0.72–0.74 |
| Words at `y` 0.28 sat on the bar of `clip_inverted_row` (the bar is high in that clip) | Inverted-row clip at `"y": 0.64`; its words at `y` 0.17 |
| `hero_eating` holds a chicken drumstick: it reads wrong for "chewing gum" | No gum pose: use reaction poses (point_viewer, smirk) for gum / candy topics |
| `hero_row_end` / `hero_row_start` are drawn upright under a high bar, not lying: the bar hides a word at `y` 0.3 | Use them only with the word at `y` 0.17, or pick another pose |

## Batches of 15–60 (16–17 Oct)
| Problem | Rule |
|---|---|
| A plan was refused: "speed: until must be after at" when the hook was shorter than 1.7 s | `plan_lib.auto(hook=True)` puts its extra speed/edge pulses at start, start+0.6, start+1.0 (fits every hook) |
| A render job was killed at the 2-hour shell limit mid-video | Render 12–15 reels per `batch.py render` call; it skips finished videos, so just run it again |
| A watchdog with `pgrep -f` matched its own command line and never restarted the runner | Don't use watchdogs; re-run `batch.py render` |
| `pkill -f` killed the shell that ran it (exit 144) | Anchor the pattern (`'^node tools/server[.]mjs'`) or kill by PID |
| 544 MB and 403.8 MB zips were refused (limit 400 MB) | `batch.py pack` (crf 24 → ~6–8 MB per reel, 60 reels ≈ 365 MB) |
| The owner asked for all 105 videos in one zip with no quality loss (1.1 GB) | Impossible under 400 MB: give `batch.py pack --full` parts (≈ 380 MB each) and say why |
| A thumbnail label printed the words "black" / "red" | Describe the colors in words around the text, never inside quotes with it (`thumb_prompts.py` does it) |
