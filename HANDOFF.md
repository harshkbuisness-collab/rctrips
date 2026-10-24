# Project handoff: doodle finance explainer channel "Dollar Diaries"

## START HERE (latest state, 24 Oct 2026)
Branch: `claude/doodle-finance-scripts-y51bqy`. Rules: CLAUDE.md (read it first; owner writes Hindi/Hinglish, reply short).

### Status of the 30-day list (upload order in research/12-outlier-topics.md section 7)
- #1 day01 1929 crash: uploaded. #2 day02 who America owes: uploaded (do NOT work on it).
- #11 day04 inflation: re-built 24 Oct (exact-quote evidence, new beats, tease cut), mp4 sent, UPLOAD.md ready.
- #3 day34 stock market hasn't crashed: NEW script (no characters), Claude-made voice, mp4 sent, UPLOAD.md ready.
- day34 re-rendered 24 Oct (evening): opens on evidence, no title card; tools/pace_beats.py adds keyword notes so
  something new enters about every 2 s (only 2 gaps over 3 s). Recipe step 4: run `make_video.py <vdir> --voice-only`,
  then `python3 tools/pace_beats.py <vdir>`, then --check.
- NEXT: #4 day08 "Nobody can buy a house". Its script has a made-up character (Jasmine) -> rewrite it like day34,
  make the voice, then the video. Script rewritten + screens done (FRED s02-s05 have no highlight box:
  re-run get_screens for them, the visible-match fix is in). Voice not made yet (`mkdir -p voices` first). Then continue in upload order (day31, day33, day17, day39, day32...).

### New owner rules (24 Oct 2026, also in CLAUDE.md)
- Only the LONG video. No Shorts, no Short title/cover unless asked.
- No made-up story characters. Casual Finance structure: research/07-script-style-guide.md (last section).
- Every highlight = the exact sentence/number that proves the spoken line, never a heading.
- Title = exact title of the outlier original (find it with vidIQ `vidiq_outliers`, 5 credits); thumbnail = PROMPTS only:
  the original's idea redrawn in our brand style (CLAUDE.md "Thumbnails"); one long-video prompt.
- No next-video tease; end on a thanks frame. First frame should be evidence (day34 still opens on a 1.2 s title card: fix in
  script_to_beats for next videos).

### Per-video recipe (what worked for day34)
1. Rewrite `scripts/dayNN_*.md` (keep the verified SCREEN quotes from the old script; ~1,900-2,100 words; numbers in words;
   `> VISUAL:` lines like `A15; G11; "TEXT"`). `python3 tools/check_script.py <script>`.
2. Voice: `python3 tools/make_voice.py <script>` (Kokoro af_heart 1.03, ~20 min CPU) -> voices/dayNN.mp3, then copy to
   `videos/<slug>/03_voice/owner_voice.mp3`.
3. Screens: delete old `02_assets/screens/sNN*.png` + screens.json, run `tools/get_screens.py <script> <vdir>`; any
   "quote not found" or a box outside 0..1 = fix the quote (use page text: a playwright text dump of the page).
4. Beats: `tools/script_to_beats.py`, then `sed -i 's/@-0\.00,/@0.00,/g'` on beats.txt (bug: negative zero breaks parsing),
   then `make_video.py <vdir> --check` and hand-fix every warned beat until 0 warnings (also replace silly auto words).
5. Render in the background with `setsid nohup python3 tools/make_video.py <vdir> > <vdir>/05_export/render.log 2>&1 &`
   (~25 min). Write UPLOAD.md (title, description with chapters from timings.json, tags, thumbnail prompt). Send the mp4.

### Tool changes this session
- make_video.py: background music bed (own track: `library/music/*.mp3` or `<vdir>/02_assets/music.mp3`, else a
  generated piano bed) with ducking, camera push-in on each highlight + slow drift, soft whooshes, no sound in first 2 s.
- get_screens.py: tight box around the exact quote, scrolls long blocks, closes survey pop-ups, no look-alike paragraph
  fallback for quoted cues, Wikipedia name pages off (PHOTO_PAGES=1 to turn on).
- script_to_beats.py: same page with another quote is not dropped as a duplicate.
- tools/make_voice.py: new (Kokoro voice from a script).

### Open items
- ~17 scripts still have made-up characters (day31,33,39,32,41,38,40,42,36,44,35,37,51,52,47,12 + voiced 08,10,06,07).
- Old scripts day01-13 have weak heading highlights; fix when their turn comes.
- day51: verify the 29.1% negative-equity figure (CBT News).

## Earlier START HERE (18 Oct 2026)
**Owner decision:** the owner will write the remaining scripts with ChatGPT. Do NOT write scripts or spawn writers.
Prompts and steps: `research/08-chatgpt-prompts.md`. Day 11 is now finished (2,009 words); Days 20 and 29 are already over 2,000.
When the owner adds scripts to `scripts/`, check the format with `tools/sheet/parse_script.py` and rebuild the sheet.

Branch: `claude/doodle-finance-scripts-y51bqy` (was `claude/sharp-gauss-1j9ov4`) (harshkbuisness-collab/rctrips). The owner writes in Hindi/Hinglish: reply in **simple English**,
save credits, commit and push every change.

### Owner rules (all still apply)
1. **The owner provides the voice** (Voice Studio, or any TTS/recording). We don't generate the final voice any more.
2. **No new drawings.** Use only `library/assets` (235 images, list in `library/ASSET_LIST.txt`) plus real screenshots/photos.
   Never give Google Flow prompts.
3. **Real evidence everywhere:** screenshots from trusted sources (.gov, central banks, SEC/DOJ/court, company filings,
   major papers, Wikimedia Commons). Show one in the first 15 seconds, then one every 30–40 seconds. Never turn screenshots
   into drawings and never cut them off; highlights and red marks are fine. (Slow scrolling of long pages, as the reference
   does, has been **asked about but not yet approved**.)
4. **Fast, animated pace like the reference:** things slide or pop in one by one, and something changes every 0.5–1 seconds.
5. **Scripts are calm, simple storytelling:** one thread from start to end, no shock tricks or random jokes, and every
   chapter bridges to the next. About 2,000–2,200 words (about 14 minutes). Rules and file format:
   `research/07-script-style-guide.md`.
6. US / tier-1 audience. Render only the requested video.
7. **Save credits, always (owner rule, 18 Oct 2026).** Work in a small, organised way:
   - Ask before any big or costly job (many subagents, lots of web research, long renders). Say first roughly how big it is.
   - Never run many subagents in parallel unless the owner agrees to it for that job.
   - Do one step at a time. Commit and push after each step. Keep replies short.
   - The owner writes scripts with ChatGPT (`research/08-chatgpt-prompts.md`). Claude checks the format, builds the sheet and makes the videos.

### Current task: 30 full scripts, then one review sheet
- The plan for 30 days is in `tools/sheet/plan_rows.py` (title, hook, outline, facts, evidence) and
  `research/05-viral-topics-and-30-day-plan.md`.
- Finished scripts live in `scripts/dayNN_<slug>.md`, in the style-guide format.
- **Status:**
  - **Day 1:** video made; its script is in the older format at `videos/2026-11_day01_1929_crash/01_script/script.md`.
  - **Days 14, 20, 29:** saved and complete. Days 20 and 29 are short (about 1,700 words): consider extending them.
  - **Day 11:** saved but **unfinished** (about 1,400 words). Finish it.
  - **Days 2–10, 12, 13, 15–19, 21–28, 30:** still to write.
  - Before writing a day, check `scripts/`: writers from the previous session may have pushed more files.
- **How to write each script:**
  - Fact-check every number, date and quote with WebSearch/WebFetch against trusted sources.
  - Mark anything unconfirmed as "(VERIFY)" in SOURCES.
  - SCREEN URLs must be real pages.
  - Never copy competitor wording.
  - Several days can be written in parallel with subagents; give each the style guide, the plan row and the Day 1 script
    as an example.
- **Build the sheet:** `python3 tools/sheet/build_sheet.py` → `research/06-topics-and-scripts.xlsx`. It contains:
  - "How to use"
  - "30 Topics" overview, with an Approve/Change/Reject column
  - "Voice text": each whole script in one cell, inside quotes with [emotion] tags, ready for Voice Studio
  - one tab per day: line, emotion, spoken text, what moves, screenshot (source | URL | highlight), then sources
- Send the sheet to the owner (they import it into Google Sheets with File > Import). The Google Sheets connector is not
  connected.

### Video builder v4 (`tools/make_video.py`, docstring has the full syntax)
- **Motion:** append `~l ~r ~t ~b ~pop ~drop ~walk ~none ~float ~shake ~spin` to any element (before `+delay`).
  - Defaults: people slide in from the nearest side; props pop in; screenshots slide up from the bottom; text, bubbles and
    labels pop in; arrows, circles and the X are drawn on; close-ups (height ≥ 0.9) cut in.
  - New items in a beat are **staggered automatically** (up to 0.6 s apart).
  - The narrator (A.., H01–H08) breathes while talking.
  - `rain:E01*20[:h]` shows money falling across the screen.
- **Owner voice:** put `videos/<slug>/03_voice/owner_voice.wav` (or .mp3/.m4a). faster-whisper (`base.en`, CPU) finds each
  word's time, and the beats are matched to it (wordless hold beats insert silence).
  - Install: `pip install faster-whisper`. Decode with ffmpeg to numpy, because the av version breaks file input; this is
    already handled in the code.
  - The soft EQ is used only for our own TTS.
- **Quick preview:** `--clip A-B` renders only seconds A–B to `05_export/<slug>_clip.mp4`.
- **Layout check:** `--check` makes contact sheets and warnings.
- **Next step for video:** turn an approved script into `beats.txt`.
  - Use about one beat per sentence, with 3–6 elements arriving one by one.
  - Fetch the SCREEN pages with Playwright (`/opt/pw-browsers` chromium through `$HTTPS_PROXY`) into `02_assets/screens/`.
  - Get the owner's voice, run `--check`, then a `--clip 0-60` preview, then the full render.

### Reference measurements (18 Oct 2026; owner uploaded the reference videos as a split zip, recovered 2 of 3)
| | Reference | Our Day 1 (old builder) | Day 1 with v4 motion (40 s test) |
|---|---|---|---|
| Visual changes | ~9 per 10 s (one every 0.8 s; 12 per 10 s in the first minute) | 3.9 per 10 s | ~20 per 10 s |
| Time with something moving | 17–19% | 2% | 30% |
| Animated moves | ~10 per minute, median 0.5 s | almost none | — |

Things seen in the reference:
- People and maps slide in from the side; bags and papers pop in one by one.
- Red circles and highlights are drawn on live.
- Money rain; turning cycle arrows.
- The narrator's arm keeps moving.
- Long documents and collages scroll vertically.
- A shatter effect.

Measuring script (re-create it if needed): frames scaled to 160×90 grey; a frame counts as changed if more than 0.05% of
pixels change by more than 25. Runs of 3 or more changed frames count as animation.

### Facts still to double-check before Day 1 is uploaded
- $8.5B brokers' loans
- Model T $850 → $260
- 1,028 economists
- About 9,000 bank failures
- About 20,000 Bonus Army veterans
- 25% unemployment

---

## Earlier notes
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
