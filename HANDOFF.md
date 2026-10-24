# Handoff: AI Reel Generator (rctrips)

Last updated: 2026-10-24

## What this is

This is a copy of the Vercel "AI reel generator" (project `ai-reel-generator-v1.3`). The user is going to sell it, monthly and as a lifetime deal. It makes typography reels with Remotion: you give it a script, it adds a voice, and it renders an MP4.

- **Repo:** `harshkbuisness-collab/rctrips`
- **Branch:** `claude/youthful-heisenberg-56hlbz`. All work is here. No PR has been opened.
- **Live site:** https://ai-reel-generator-v13.vercel.app. It is behind Basic Auth (`TOOL_USERNAME` / `TOOL_PASSWORD`, production only). Claude does not have the password, so nothing on the live site has been tested while logged in.
- **User:** writes in Hinglish and Hindi and prefers short, simple replies. Ask before any big job. If they can do something themselves, say so in one line.

## Stack

- Next.js 16 (webpack) with Remotion 4.0.526. The editor uses the Player. Local renders use `renderMedia` when `LOCAL_TOOL_MODE=1`. Cloud renders run in a Vercel Sandbox and are stored in Private Blob.
- Main files:
  - `src/ReelEditor.jsx`: the whole UI
  - `src/remotion/Reel.jsx`: all the card layouts
  - `src/engine/{plan,looks,library,icons,stickers}.js`
  - API routes: `src/app/api/*`
- **Voice:**
  - Edge TTS through `api/tts.py` (Vercel Python), or `/api/tts-local` locally.
  - Gemini TTS through `/api/tts-gemini` (see "AI features").

## Deploy (CLI, production only, because the env vars are production-only)

```bash
S=<scratchpad>; rm -rf $S/deploy && mkdir $S/deploy && git archive HEAD | tar -x -C $S/deploy
rm -rf $S/deploy/promo-shots* $S/deploy/*.mp4 $S/deploy/*.zip $S/deploy/sell-videos $S/deploy/value-videos
cd $S/deploy && VERCEL_ORG_ID=team_pI9mEPi3vEqkzclvK84rN24u VERCEL_PROJECT_ID=prj_m3rX6VZ7rZbGhLxyFD7CLs47xsMP \
  npx -y vercel@latest deploy --prod --yes --token "$VERCEL_TOKEN"
```

## Local testing

1. Build and start: `npx next build && npx next start -p 3123` (`.env.local` has `LOCAL_TOOL_MODE=1`).
2. Drive the UI with Playwright: `/opt/node22/lib/node_modules/playwright`, Chromium at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, and `httpCredentials local/local`.
3. Local renders are saved to `public/local-renders/`.
4. Stop the server with `ps aux | grep next-server | awk '{print $2}' | xargs kill`. Do not use `pkill -f` inside a compound command, because it kills its own shell.
5. Self-tests: `for t in server/*-self-test.js; do node $t; done`. All pass.

## Features built in this chat (all committed and pushed)

1. **15 templates (Ref 1–15)**, with Ref 1 as the default.
2. **Bulk mode:**
   - Up to 30 scripts, separated by `---`. Each one gets its own voice and MP4.
   - Template mode can be same, rotate, random, or "✨ AI picks the best template".
   - Live preview while each video renders, a template label and a ▶ View button on each row, Stop, and Retry failed.
3. **Your own images:**
   - Single mode: a 📷 Add image button on each scene. The image is stored in the project as a JPEG data URL, up to about 15 per video.
   - Bulk mode: upload pictures, then write `[n]` before a line to put picture n on it. The markers are removed before the voice is made, and the search runs forward through the script.
   - `ImageCard` in `Reel.jsx` puts the image beside the text on wide stages.
4. **Edge voice retry:** the voice is tried once more if Edge returns "No audio".
5. **Sound effects setting:** template default, on or off.
   - Ref 13 uses the new "light" style (`sfxStyle: 'light'`). It has no per-word clicks. It plays a whoosh at most every 2.6 s, a pop on big-word cards, an impact on the hook and the CTA, and a riser before the CTA.
   - New sounds: `public/sfx/impact.mp3` and `public/sfx/riser.mp3`. Claude synthesised both.
6. **Ref 13 redesign:**
   - Text is about 1.9× bigger.
   - Word, keyword and transition motions rotate from card to card.
   - Text placement cycles through centre, left and right.
7. **CTA keyword fix:** filler words are skipped, so "Comment karo TOOL" shows TOOL (`CTA_FILLER` in `plan.js`).
8. **Gemini voices:**
   - Six voices, ported from the user's Gemini voiceover app (a zip upload): Content Creator, Priya, Creator Aura, Thinker, Superhero, Sage.
   - Each uses a persona prompt and the `gemini-2.5-flash-preview-tts` model.
   - Word timings come from Gemini listening to the audio with the script. If that fails, the words are spread over the detected speech instead.
9. **AI director** (`/api/ai-director`): picks the keyword, visual and sticker for each scene, plus the template.
   - There is a button in Scenes and a bulk checkbox.
   - The answer is checked against the real library ids.
10. **⚙ AI settings** in the left panel: a Gemini key is saved in the browser's `localStorage` and sent as the `x-gemini-key` header. The server uses it only for that request and never stores it.
    - The newest production deploy appears to include this, but that has not been checked against the deployment's commit.

## Unfinished: OpenAI-compatible provider in ⚙ AI settings

The goal is to let the AI director use any OpenAI-compatible provider, such as the user's "Free LLM API" desktop app, OpenRouter or Groq, using a base URL, key and model.

**Server side: done, committed, mock-tested, not deployed.**
- `src/lib/llm.js` has three parts:
  - `askJson(prompt, ai)`
  - `checkBaseUrl`: allows only public https hosts, and allows localhost only when `LOCAL_TOOL_MODE=1`, as SSRF protection.
  - `aiFromRequest(request)`: reads the headers `x-ai-provider` (`gemini` | `openai`), `x-ai-key`, `x-ai-base` and `x-ai-model`, and falls back to `x-gemini-key`.
- `/api/ai-director` uses `aiFromRequest`.
- `scratchpad/mock3.mjs` tested all three paths: Gemini key, OpenRouter, and localhost (blocked on the live site).

**UI still to do (`ReelEditor.jsx`, ⚙ AI settings):**
1. Add a provider select: Gemini, or OpenAI-compatible.
2. Add base URL, key and model fields, with presets: Free LLM API (`http://localhost:<port>/v1`, model `auto`) and OpenRouter (`https://openrouter.ai/api/v1`).
3. Send the `x-ai-*` headers from `aiHeaders()`, and keep sending `x-gemini-key` for Gemini TTS.
4. Then build, test with Playwright, and deploy.

**Limitation to tell the user:** a localhost endpoint such as the Free LLM API app only works when the tool runs locally. The live Vercel site cannot reach the user's PC. These providers are text-only, so voice still comes from Edge or a Gemini key.

## Provider problems found

- **Gemini:** the user's key (format `AQ.…`, Google's newer "auth key") returns **403 "Your project has been denied access"** for project 1057587847045. This is on Google's side. The advice given was to create a key in a new project or with another Gmail account.
  - The key was visible in one of the user's screenshots, and Claude advised deleting it.
  - The user put it in Vercel as `GEMINI_API_KEY`. It is useless while the project is denied.
- **OpenCode Zen:** returns 403: its free tier only works inside the OpenCode app. The user should delete `OPENCODE_API_KEY` from Vercel if they added it. The current code no longer uses it.
- **vidIQ:** has no credits, so music generation failed.
- **Puter.js:** offered as a no-key option. The user has to log in through a popup, and their own Puter account pays. The user has not decided.

## Content made for the user (marketing)

- `promo-shots/` and `promo-shots.zip`: 22 screenshots of the tool.
- `tool-demo.mp4`: a 1-minute screen recording.
- `promo-reel.mp4` and `promo-reel-ref13.mp4`: early promo reels.
- `sell-videos/` and `sell-videos.zip`: 10 sell reels, made before the Ref 13 redesign.
- `value-videos/` and `value-videos.zip`: 20 value reels, also old style.
- There is a 30-day calendar: 10 sell videos and 20 value videos, with a sell video every third day. The topics are listed in the chat.
- The **sample sell videos in the new style** were sent from the scratchpad only. They were not committed, because they use the user's copyrighted Eminem "Without Me" track and pushing that was blocked:
  - The English sample, about 59 s.
  - The Hinglish version using the user's own "superhero" voiceover (`hinglish-sell-video-v3.mp4`). Its timing was checked against the user's SRT, and the example reels inside it are shown framed in a phone mockup labelled "Made with 1 click".
  - Claude warned that Instagram may mute or block copyrighted music.
- **Next step the user asked about:** make all 30 videos in the new style. They want longer, value-first scripts with a story flow (hook → pain → curiosity → demo → CTA), and the result delivered as one zip. They have not confirmed the music choice: Eminem, or no music.

## Useful scratchpad bits (lost when the session ends)

- `pimg/` and `simg/`: cropped tool screenshots and Unsplash stock images (free licence).
- `mix.sh`: music mix with sidechain ducking.
- `h_timing.json`: word timings for the Hinglish voiceover.
- `*.cjs`: Playwright scripts.
