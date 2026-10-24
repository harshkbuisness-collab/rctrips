# Handoff: AI Reel Generator, up to the "v3" sample video

This handoff covers the work up to and including the **Hinglish sell video v3** ("example reels now clearly shown as separate videos").

Everything planned or built after that was deliberately dropped and its code was reverted: the Gemini voices, AI director, AI settings, OpenCode, Puter and the OpenAI-compatible providers. The reverts are commits `f231edc`, `89e6c11`, `47e0e8b` and `128ab6b`. The code is now identical to commit `ce9bac1`.

## Project

- **Repo:** https://github.com/harshkbuisness-collab/rctrips
- **Branch:** `claude/youthful-heisenberg-56hlbz`. No PR has been opened.
- **Tool:** a copy of the Vercel "AI reel generator" (project `ai-reel-generator-v1.3`). The user plans to sell it, monthly and as a lifetime deal. It makes typography reels with Remotion: you paste a script, it adds a voice, and it renders an MP4.
- **Live site:** https://ai-reel-generator-v13.vercel.app. It is behind Basic Auth (`TOOL_USERNAME` / `TOOL_PASSWORD`).
  - The live site may still show Gemini options from a later deploy. Redeploy from this branch to match the code.
- **User:** writes Hinglish and Hindi and wants short, simple replies. Ask before any big job. If they can do something themselves, say so in one line.

## Stack and how to run

- Next.js 16 (webpack) with Remotion 4.0.526. The editor uses the Player. Local renders use `renderMedia` when `LOCAL_TOOL_MODE=1`, which is set in `.env.local` (git-ignored). Cloud renders run in a Vercel Sandbox and are stored in Private Blob.
- Main files:
  - `src/ReelEditor.jsx`: the UI
  - `src/remotion/Reel.jsx`: card layouts and sound effects
  - `src/engine/{plan,looks,library,icons,stickers}.js`
  - API routes: `src/app/api/*`
- **Voice:** Edge TTS through `api/tts.py` on Vercel, or `/api/tts-local` locally. You can also upload your own voice plus a word-timing JSON.
- **Local test:**
  1. Run `npx next build && npx next start -p 3123`.
  2. Drive it with Playwright (Chromium at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, `httpCredentials local/local`).
  3. Renders are saved to `public/local-renders/`.
  4. Self-tests: `node server/*-self-test.js`.
- **Deploy (production only, because the env vars are production-only):**
  1. `git archive HEAD` into a temp folder.
  2. Delete `promo-shots*`, `*.mp4`, `*.zip`, `sell-videos`, `value-videos` and `handoff` from the copy.
  3. Run `VERCEL_ORG_ID=team_pI9mEPi3vEqkzclvK84rN24u VERCEL_PROJECT_ID=prj_m3rX6VZ7rZbGhLxyFD7CLs47xsMP npx -y vercel@latest deploy --prod --yes --token "$VERCEL_TOKEN"`.

## Tool features (all committed)

1. **15 templates**, Ref 1–15, with Ref 1 as the default.
2. **Bulk mode:**
   - Up to 30 scripts, separated by `---`. Each one gets its own voice and MP4.
   - Template mode can be same, rotate or random.
   - Live preview while each video renders, a template label and ▶ View button on each row, Stop, and Retry failed.
3. **Your own images:**
   - Single mode: a 📷 Add image button on each scene.
   - Bulk mode: upload pictures, then write `[n]` before a line to put picture n on it. The markers are not spoken.
   - `ImageCard` puts the image beside the text on wide stages.
4. **Edge voice retry:** the voice is tried once more if Edge returns "No audio".
5. **Sound effects setting:** template default, on or off.
   - Ref 13 uses the **light** style: no per-word "beep" clicks. It plays a whoosh at most every 2.6 s, a pop on big-word cards, an impact on the hook and the CTA, and a riser before the CTA.
   - The impact and riser sounds were synthesised and are copyright-free.
6. **Ref 13 redesign:**
   - Text is about 1.9× bigger.
   - Word, keyword and transition motions rotate from card to card.
   - Text placement cycles through centre, left and right.
7. **CTA keyword:** filler words are skipped, so "Comment karo TOOL" shows **TOOL**.

## The v3 sample video (the user's chosen direction)

- **Format:** Ref 13, "16:9 inside 9:16" (the stage band is at y=656..1264, 1080×608), sound effects on.
- **Script:** `handoff/v3-kit/hinglish-script.txt`. It follows a story flow: hook → pain → solution → demo → bulk → CTA "Comment karo TOOL".
- **Voice:** the user's own "superhero" voiceover, `hinglish-superhero-voiceover.wav`.
  - It was transcribed with faster-whisper and aligned to the script by characters, so the script's spelling is shown and numbers appear as digits.
  - The timing was then checked against the user's SRT, which only covers the first 46 s (`user-srt-first-46s.json`).
  - Result: `hinglish-word-timing.json`. It is uploaded in single mode with "Or upload your own voice".
- **Images on lines:** in `images/`.
  - 1–3 are free Unsplash stock photos: a man at a laptop, an editing timeline and an editing monitor.
  - 4–9 are tool screenshots: the full tool, script box, voice, a template collage, the bulk box and bulk done.
- **"Video inside video" overlays** were added with ffmpeg by `make-v3-overlays.sh`:
  1. "Ye video dekho": a phone frame with a Hinglish example reel and the label "▶ Made with 1 click".
  2. "30 aur videos": a 3×3 grid of reels.
  3. "Ek minute mein ready": a framed tool demo labelled "▶ Live demo".
- **Files:**
  - `v3-final-no-music.mp4`: the full v3 video **without music**.
  - `v3-base-render-no-overlays.mp4`: the base render, before the overlays.
- **Music:** the user's v3 used Eminem's "Without Me", mixed quietly under the voice with ducking (`mix-music.sh`). That track is copyrighted, so it is **not** in the repo. Instagram may mute or block it. Ask the user which music to use.

## Other content in the repo

- `promo-shots/`: 22 tool screenshots.
- `tool-demo.mp4`: a 1-minute screen recording.
- `promo-reel*.mp4`: early promo reels.
- `sell-videos/` (10) and `value-videos/` (20): made in the **old** Ref 13 style.
- **30-day calendar:** 10 sell videos and 20 value videos, with a sell video every third day. The topics were given in the chat.
- `handoff/v3-kit/english-sell-script-with-markers.txt`: the English version of the sell script, with `[n]` image markers.

## Next step the user wanted

Make **all 30 videos in the v3 style**:
- Longer, value-first scripts with real storytelling.
- Big typography, varied animations, relevant visuals and light sound effects.
- Delivered as **one zip**.

Confirm the music choice first.
