# Rules for every session (owner, 18 Oct 2026)

## Save tokens (top rule)
The weekly limit must last the full week, so use as few tokens as possible in every step.
- Reply in short, simple English (the owner writes Hindi/Hinglish). No long reports or option lists.
- Read only what the task needs: the "START HERE" part of HANDOFF.md, and only the files the step touches. Use `grep`, `head` or `sed -n` instead of reading whole files.
- No subagents and no big parallel jobs unless the owner says yes for that job. Before any big job, say roughly how big it is and ask.
- No repeat research: reuse what is already in `research/` and `videos/*/SOURCES.md`.
- Use scripts and tools in one command instead of many small steps. Do not re-render whole videos for small fixes (use `--clip`).
- Don't re-check or re-read work that already succeeded.
- Commit and push after each step, with short messages.

## Who does what
- **Owner:** writes scripts with ChatGPT (`research/08-chatgpt-prompts.md`), makes the voice, and sends all feedback in one list.
- **Channel voice (owner, 25 Oct 2026):** Kokoro male "am_michael" (calm, dry, like Casual Finance), speed 1.0, via `tools/make_voice.py`.
- **Claude:** takes the screenshots, checks the script format, builds the sheet (`python3 tools/sheet/build_sheet.py`), and makes the video.
- **Own pictures per video (owner, 21 Oct 2026):** `python3 tools/asset_prompts.py scripts/dayNN_x.md` writes
  `assets_needed/dayNN_prompts.md`; the owner saves pictures as `library/custom/dayNN/<ID>.png` and the video tools use
  them automatically. Claude gets all evidence: script screenshots, Wikimedia photos (`get_photos.py`) and Wikipedia pages.
- If a step can be done without Claude, tell the owner in one line instead of doing it.

## Video flow (cheapest order, all automatic)
1. The owner adds scripts to `scripts/dayNN_*.md` and voices to `voices/dayNN.mp3`.
2. Setup once per session: `pip install -q playwright faster-whisper soundfile`
3. `python3 tools/batch.py 2 3 4 5 6` does screenshots (`get_screens.py`), beats (`script_to_beats.py`), the check
   and the render for each day, and writes a summary to `videos/batch_log.txt`. Run it in the background, read only the log,
   and send the mp4 files to the owner (they are too big for git). Test one day before a group of 5.
4. The owner sends all changes in one message, and Claude makes one fix round.
5. One batch (up to 5 videos) per session.

## Owner style rules (22 Oct 2026)
- NO made-up story characters (owner, 24 Oct 2026): no "Meet Linda/Ava/Maya", no imagined families or neighbors.
  Tell what really happened, step by step, to the point, with the real evidence on screen for each claim.
  Only real people, companies and events from the sources.
- Every SCREEN highlight must be the exact sentence or number that proves the spoken line (never a page title or heading).
- No opening card with only a year (like "1929"): the first frame is real evidence.
- No next-video box or next-video tease, ever. The video ends with a short thanks frame.
- Evidence first (charts, real photos, cards); the character is a small guide at the edge.
- No empty scene: every scene has at least 3 things; render only when `make_video.py <dir> --check` shows 0 warnings.
- Charts build themselves on screen (bars grow, lines draw): `tools/make_charts.py` makes the frames.

## Video analysis (reference or our own videos)
- Never look at many video frames: images cost a lot of tokens. Run `python3 tools/video_analyzer/analyze_video.py <video>` (or the owner
  runs it on their computer and pastes `REPORT.md`). Read only REPORT.md; look at `sheet.jpg` at most once, and only if
  the look matters. Read `transcript.txt` only if the words matter.

## Thumbnails (owner, 22 Oct 2026)
- Claude gives PROMPTS only (one Flow prompt that asks for 10 images); the owner generates. Claude does not make thumbnail images.
- The thumbnail text is 2 words that say what the video is about (it works like the title, e.g. "1929 CRASH").
  No curiosity-only text like "WIPED OUT" or "-89%". Simple, clear, explains the topic.
- Always name the country (US / AMERICA) in the thumbnail text and picture (flag, Wall Street, Capitol): our viewers are American.
- OUR BRAND STYLE (do not copy other channels): deep money-green background (#0F3D2A) with soft diary-paper texture and dark
  edges; one landmark/object in muted cream-sepia; our narrator (brown spiky hair, round glasses) in full color, the orange
  scarf is the brightest color; 2 big bold white words, the key word as white text on a red label (#D62728); a small red
  bookmark ribbon in the top-right corner on every thumbnail (from the logo).

## Channel growth plan (owner, 23 Oct 2026; from Algrow + DecodingYT answers)
- Claude makes ONLY the long video (owner, 24 Oct 2026): no Short video, no Short title/cover, unless the owner asks. Quality first: a video is uploaded only after `--check` shows 0 warnings; on a day with no
  ready long video, post only the Short. Mix topics (no 3 days of the same theme).
- Upload with Schedule at 3:00 PM US Eastern (1:30 AM India); the Short about 2 hours after the long video.
- Settings: video + title language "English (United States)", English captions (.srt), Education category, not for kids.
  Channel country stays India (tax/payments only; it does not decide who sees videos). No VPN.
- Never share links in India (WhatsApp, Instagram, friends): wrong early viewers kill CTR and retention.
- First 48 h: pinned question comment, add to a playlist, post the linked Short.
- After 48-72 h: if CTR < 4-5%, swap the thumbnail (Test & Compare); if still low after 48 h more, swap the title.
- Targets: CTR 6-10%, 30-second retention 50%+, average view duration 40%+ of the video.
- 1 view on day 1 is normal: a new channel needs 10-30 videos before the first one takes off. Keep posting.
