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
- **Claude:** takes the screenshots, checks the script format, builds the sheet (`python3 tools/sheet/build_sheet.py`), and makes the video.
- If a step can be done without Claude, tell the owner in one line instead of doing it.

## Video flow (cheapest order)
1. The owner adds the script `scripts/dayNN_*.md` and the voice file.
2. Claude takes all screenshots in one run (Playwright, `/opt/pw-browsers`, through `$HTTPS_PROXY`).
3. Script → `beats.txt`, then `--check`, then one `--clip 0-60` preview, then one full render.
4. The owner sends all changes in one message, and Claude makes one fix round.
5. One video per session.
