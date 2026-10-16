# FreeStack AI: product and production plan

## Product (decided, build later)
**Creator Skills Pack**: Claude skills sold to people who already pay for Claude.
- Reel Machine (voiceover to finished Reel), Cover Generator, Viral Script Writer, Carousel Maker, Content Planner.
- Price: ₹1,499 in India (Razorpay or Instamojo, automatic zip delivery); $19–29 on mcpmarket.
- Must work in both Claude Code and Claude.ai.

### What we learned about Claude.ai (official docs, checked 16 Oct 2026)
- Upload: Customize > Skills > Upload ZIP. Inside the zip is one folder, named the same as `name` in SKILL.md.
- Files are limited to 30 MB each. The total zip size limit is not documented, so keep the zip small.
- The sandbox's packages are not documented for Claude.ai. Don't depend on ffmpeg, Node, Chromium or opencv. Check for them at runtime and fall back to pure Python (numpy, pillow).
- Default network access is "package managers only" (PyPI, npm, GitHub). Hugging Face is not on that list, so no Whisper model downloads.
- `${CLAUDE_SKILL_DIR}` only works in Claude Code. In Claude.ai, use paths relative to SKILL.md.
- Plan for the Reel Machine: a pure-Python renderer, plus `imageio-ffmpeg` from PyPI for encoding, plus word timings from the script text (no Whisper).

## Production funnel (every video)
1. The Reel gives pure value. The CTA is "Comment KEYWORD".
2. The ManyChat DM sends the promised link first.
3. A bridge in the same DM: "Ye Reel Claude ne banayi. Dekhna hai kaise?" leads to a demo, and we collect WhatsApp or email.
4. Follow-up over 3–5 days: value, behind the scenes, the offer.
5. About 1 in 5 Reels is product-world content, such as Claude demos and behind the scenes.
