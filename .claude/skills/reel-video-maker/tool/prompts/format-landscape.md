## FORMAT: LANDSCAPE 16:9 (1920×1080, YouTube video) — these rules replace the vertical ones above where they differ

The canvas is wide and WHITE, so H stands out. The video must feel packed and fast, like a top YouTube explainer: the viewer
should never see a calm, empty screen. H is on one side, the other side is always busy with stickers, big words, banners, callouts,
counters, zoom circles or props, and something new appears every 1–2 seconds.

### Layout (x / y are 0..1 of the screen)
- **H on the left third** (`"x": 0.27`, standing poses keep the default size) and the idea on the right (`x` 0.72–0.78).
  Lying / plank poses: `"x": 0.26, "y": 0.62, "width": 0.5`. Centre H (`"x": 0.5`, plank `"width": 0.62`) only for form
  breakdowns, then put one sticker at the top (`"x": 0.5, "y": 0.14`).
- **The right side is never empty.** Every 1–2 s one of these appears or changes there:
  a sticker or big word (text `look`), a `banner` or `callout`, a `counter`, a `zoomBubble`, a prop, a second pose of H.
- Keep right-side words short (1–3 words, about 14 letters max) so they never reach H's head.

### Text looks (always set `look`; plain coloured letters disappear on white)
- `"look": "hook"` — fat cartoon letters with a 3D shadow, for the punch words ("30 DAYS", "NO!", "PROBLEM!", "LEVEL UP").
  Size 110–200. For the strongest moments use a `banner` (white letters on a red / green ribbon).
- `"look": "box"` — sticker: white letters on a coloured box (`"boxColor"`: `#3DDC84` good, `#FF4D3D` bad/pain,
  `#FFD23F` attention, `#111111` neutral, `#3DA5FF` info). For checklists ("ABS TIGHT", "STRICT FORM"), stacked keywords,
  and labels. Size 80–110. A box pops in whole.
- `"look": "pop"` — tall bold letters with a black outline (`"color"` = fill: `#FFD23F`, `#3DDC84`, `#FF4D3D`, `#FFFFFF`).
- `"look": "comic"` — comic-book letters, good for numbers ("60 SEC").
- Text template: `{"type": "text", "text": "PROPER FORM", "look": "hook", "x": 0.72, "y": 0.5, "size": 120, "align": "center", "animation": "words", "color": "#FFFFFF"}`
- Several stickers can stack on the right (`y` 0.28 / 0.5 / 0.72), each `at` its word ("STRONGER" / "LESS SHAKING" / "MORE ENDURANCE").
- Crossed-out myths: add `"strike": "<phrase>"` and a red line crosses the text out when that phrase is spoken.

### Energy layers
- `{"type": "banner", "text": "A PROBLEM", "color": "#FF4D3D", "shadowBand": "#111111", "y": 0.45, "at": "a problem"}` — ribbon across the screen for a hook word (stars / bursts are no longer drawn).
- `{"type": "counter", "from": 0, "to": 60, "suffix": " SEC", "look": "comic", "color": "#FFD23F", "x": 0.75, "y": 0.4, "size": 150, "duration": 1.2, "at": "60 seconds"}`
  — numbers count up on screen (seconds, reps, kilos, "DAY 1" → "DAY 30" with `"prefix": "DAY "`).
- `{"type": "progress", "label": "DAY 7 / 30", "from": 0.04, "to": 0.23, "x": 0.72, "y": 0.16, "width": 0.42}` — progress bar
  that fills up: challenges, weeks, "halfway there".
- `zoomBubble` (`"size": 0.27`, `"x": 0.76`) on the body part the voice names, or `{"type": "zoomBubble", "asset": "hero_abs", "focus": [0.5, 0.62], "zoom": 1.6, ...}` for a six-pack close-up.
- Props are big on the right: width 0.12–0.17 (stopwatch for seconds, calendar for days, fire for burn, red X / green check).

### Scene look
- Every scene gets a `"backdrop"` (never plain white; vary it): `dots`, `grid`, `stripes`, `halftone`, `blobs`, `notebook`, `plus`, `checker`, `waves`, `"rays"` (spinning sunburst: only a finale),
  `"dots"` (calm explaining), `"grid"` (form / technique), `"spotlight"` (drama, pain, a problem), with `"backdropColor"`
  (`#FFD23F`, `#3DDC84`, `#FF4D3D`, `#3DA5FF`). Change backdrop and colour from scene to scene.
- Transitions: mix `"flash"`, `"zoom"`, `"slideLeft"`, `"cut"`. No dark title cards: introduce a new chapter with a
  `progress` bar or a hook word on the normal white scene instead (at most 1.5 s, never an empty screen).
- Camera: punch in on the part being explained (`"zoom": 1.25–1.35`, `focus` = that part) and back to 1 on the next idea.
  Don't zoom while a right-side word is on screen next to H's head.

### Rhythm (most important)
- Something new every 1–2 s: a pose change, a sticker, a banner, a callout, a checklist tick, a counter, a ring, a camera punch. Never 3 s without a change.
- Scenes are 4–12 s (one per idea), each with many layers that replace each other (`at` / `until`).
- Every sentence gets at least one visual: its key word as a sticker or hook word, plus a matching pose.
- Sound: something every 1–2 s (whooshes on scene changes, pops on every sticker, a counter sound on counters, a ding on good news).

### Captions
- No running captions: `"captions": {"mode": "none"}`. The stickers and hook words carry the important words.

### Long scripts: answer in parts
If the script is longer than about 2 minutes, do NOT write everything at once. Reply with **part 1** (the first ~90 s of the
script) as a complete JSON object. When the user says "next", reply with the next part as another JSON object that contains only
`"scenes"` and `"sfx"` for the following ~90 s, continuing exactly where the last part stopped. The user pastes all parts one after
another into the tool, which joins them. The first part has `"title"` and `"captions"`.
