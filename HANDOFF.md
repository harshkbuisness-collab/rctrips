# Project handoff: doodle finance explainer channel

## Read first
- `research/01-casual-finance-analysis.md`: reference channel analysis (@CasuallyFinance)
- `research/03-sample-v2-vs-reference.md`: **measured differences to fix next (version 3)**

## What exists
- `library/assets/`: ~227 approved images, named `CODE_name.jpg` (A narrator, B Penny, C cast, D object characters, E props, F backgrounds, G finance extras, H reference-match extras). `library/assets/alt/` holds alternates.
- `library/PROMPT_PACK_v1.md`: every prompt. `tools/build_flow_prompts.py <codes.txt> <tag>` builds Google Flow prompts for the missing codes.
- `library/style_reference/style_sheet.jpg`: the character reference used in Flow.
- `tools/make_video.py`: beat sheet → Kokoro voice (am_michael, speed 1.1; owner chose it on 18 Oct 2026) → 1080p MP4 at −14 LUFS. The element syntax is in its docstring.
  - Run: `KOKORO_DIR=<dir with kokoro-v1.0.onnx + voices-v1.0.bin> python3 tools/make_video.py videos/<slug>`
  - Setup: `pip install kokoro-onnx soundfile`; model files are at github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
- Samples: `videos/2026-10_sample01_inflation` (v1), `videos/2026-10_sample02_inflation_v2` (v2) and `videos/2026-10_sample03_inflation_v3` (v3, current style).
  - Layout check before rendering: `python3 tools/make_video.py videos/<slug> --check` (contact sheets + warnings in 05_export).
  - Real screenshots go in `videos/<slug>/02_assets/screens/`, sources in `SOURCES.md`.

## Version 3 (done, 18 Oct 2026)
Removed: black chapter cards, bounce, pop/whoosh sounds, big orange words, digital silence.
Added (builder elements, see docstring): `title:` red section titles, `note:`/`arrow:`/`circle:`/`xmark` red marks,
`doc:` real screenshots with slow zoom/scroll + `hl=` yellow highlighter + `box=`/`circ=` red marks + source line,
`source:` line for our charts, close-ups (height >= 0.9), `:bottom`/`:left` anchors for peeking,
`group:` icons added one by one, words on blank props (H16-H18), `sting` (self-made 1.5 s chord), room tone at -56 dB,
shorter pauses (0.18/0.3 s), `endscreen` (10 s). Loudness measured -14.8 LUFS.

**Network (18 Oct 2026):** a plain download from apnews/bls/cnbc gets 403. A real headless browser (Playwright +
/opt/pw-browsers chromium, through $HTTPS_PROXY) works for bls.gov, fred.stlouisfed.org, npr.org, cbsnews.com,
theguardian.com, bbc.com. AP News, Axios (Cloudflare) and CNBC still block. BLS API has a shared daily limit.

**Still different from the reference:** AI voice (no personality), no real photos/video clips or company logos
beyond the screenshots, sting is a simple self-made chord (owner may supply a better one), no sponsor progress line
(no sponsor yet), no channel name on the end screen, drawings are more colourful than the reference.

## Original v3 plan (kept for reference)
**Remove from the builder and the beat sheet:**
- Black chapter cards
- Bounce pop-ins
- Pop and whoosh sound effects
- Big orange words
- Digital silence

**Add:**
- Small red/black handwritten section titles at top-left
- Red annotations; yellow highlighter on documents
- Real document screenshots with slow zoom/scroll, with the narrator peeking or pointing over them (H04, A38, A15)
- Logos, real charts with a source line
- Red X gag
- Close-up crops
- Scenes that build up item by item; groups of small icons
- 1–2 s music sting only at section breaks (needs a track from the owner)
- Faint room-tone noise floor; shorter pauses
- About 10 s end screen ("Subscribe for more" + next-video box)
- Thin yellow progress line along the bottom during sponsor reads
- Blank props (H15–H18) get words such as DEBT, FEE or SALE written on them by the builder

**Network:** the owner set environment Network access = Full. Fetching news/data sites and screenshots should work in a new session (in the old session, apnews/bls/cnbc returned 403).

**Library images:** all 235 present (G06, G13, G15, G18, H01, H12, H14, H15 added 18 Oct 2026; extra bricks/TV/apartment versions in `alt/`).


## Owner rule (18 Oct 2026)
- **No new drawings.** The owner will not make more Google Flow images. Build every video from `library/assets` (235 images) plus real screenshots/photos only. Don't ask for new prompts. (`FLOW_PROMPT_1_history_*` was made before this rule; ignore it.)
