# Project handoff: doodle finance explainer channel

## Read first
- `research/01-casual-finance-analysis.md`: reference channel analysis (@CasuallyFinance)
- `research/03-sample-v2-vs-reference.md`: **measured differences to fix next (version 3)**

## What exists
- `library/assets/`: ~227 approved images, named `CODE_name.jpg` (A narrator, B Penny, C cast, D object characters, E props, F backgrounds, G finance extras, H reference-match extras). `library/assets/alt/` holds alternates.
- `library/PROMPT_PACK_v1.md`: every prompt. `tools/build_flow_prompts.py <codes.txt> <tag>` builds Google Flow prompts for the missing codes.
- `library/style_reference/style_sheet.jpg`: the character reference used in Flow.
- `tools/make_video.py`: beat sheet → Kokoro voice (bm_lewis, speed 1.1) → 1080p MP4 at −14 LUFS. The element syntax is in its docstring.
  - Run: `KOKORO_DIR=<dir with kokoro-v1.0.onnx + voices-v1.0.bin> python3 tools/make_video.py videos/<slug>`
  - Setup: `pip install kokoro-onnx soundfile`; model files are at github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
- Samples: `videos/2026-10_sample01_inflation` (v1) and `videos/2026-10_sample02_inflation_v2` (v2).

## Next: version 3 (the owner wants it to match the reference exactly)
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

**Still missing images:** G06, G13, G15, G18, H01, H12, H14, H15. The prompt is `library/FLOW_PROMPT_1_round5_portrait_9x16.txt`.
