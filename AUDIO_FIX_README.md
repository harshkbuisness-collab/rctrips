# v1.3.2 Secure Audio Fix

This build fixes the Vercel audio-preview problem shown as `0:00 / 0:00` after a successful upload.

## What changed

- Voice and music previews now use the browser's local `blob:` object URL immediately after file selection. This means preview playback does not depend on a Private Blob signed GET URL.
- The same selected files are still uploaded to the attached **Private Vercel Blob** store for secure cloud rendering.
- The render route replaces local preview URLs with fresh signed Private Blob URLs before Remotion renders the MP4.
- Final MP4 rendering explicitly uses **AAC** and `enforceAudioTrack: true`.
- Private Blob readiness no longer assumes that `BLOB_READ_WRITE_TOKEN` must exist. Vercel Private Blob can now use project-scoped **OIDC** authentication.
- Rendering supports both modes:
  - legacy/static `BLOB_READ_WRITE_TOKEN`: detached render + progress polling;
  - OIDC-only Private Blob: synchronous Sandbox render, then secure Private Blob upload via OIDC.
- Background music gets its own local playback control for testing before rendering.
- `DEPLOY_TO_VERCEL.bat` now links to the existing main project and deploys directly to Production after confirmation.

## Deploy

1. Extract this ZIP.
2. Double-click `DEPLOY_TO_VERCEL.bat`.
3. Press `Y` when asked.
4. Wait for `DEPLOYMENT COMPLETE`.
5. Open `https://ai-reel-generator-v13.vercel.app` and hard-refresh with `Ctrl+Shift+R`.

## Vercel requirements

- `TOOL_USERNAME` and `TOOL_PASSWORD` configured for Production.
- A **Private Blob** store attached to `ai-reel-generator-v1.3`.
- Vercel Authentication / Deployment Protection may remain enabled.

## Test after deploy

1. Upload timing JSON.
2. Upload voice MP3.
3. The mini voice player should show the real duration, not `0:00 / 0:00`.
4. Press Play and confirm sound.
5. Upload music and test its mini player.
6. Render MP4 and confirm the downloaded video contains voice audio.
