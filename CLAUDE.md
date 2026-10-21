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
- **Channel voice (owner, 21 Oct 2026):** Kokoro "Heart" (af_heart) in Voice Studio, free and offline. Speed about 1.0-1.05.
- **Claude:** takes the screenshots, checks the script format, builds the sheet (`python3 tools/sheet/build_sheet.py`), and makes the video.
- If a step can be done without Claude, tell the owner in one line instead of doing it.

## Video flow (cheapest order, all automatic)
1. The owner adds scripts to `scripts/dayNN_*.md` and voices to `voices/dayNN.mp3`.
2. Setup once per session: `pip install -q playwright faster-whisper soundfile`
3. `python3 tools/batch.py 2 3 4 5 6` does screenshots (`get_screens.py`), beats (`script_to_beats.py`), the check
   and the render for each day, and writes a summary to `videos/batch_log.txt`. Run it in the background, read only the log,
   and send the mp4 files to the owner (they are too big for git). Test one day before a group of 5.
4. The owner sends all changes in one message, and Claude makes one fix round.
5. One batch (up to 5 videos) per session.

## Video analysis (reference or our own videos)
- Never look at many video frames: images cost a lot of tokens. Run `python3 tools/video_analyzer/analyze_video.py <video>` (or the owner
  runs it on their computer and pastes `REPORT.md`). Read only REPORT.md; look at `sheet.jpg` at most once, and only if
  the look matters. Read `transcript.txt` only if the words matter.
