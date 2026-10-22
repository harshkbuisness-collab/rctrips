# v1.8.2 Vercel Build Fix

The v1.8.1 deployment was failing after the Remotion bundle had already been created. Next.js 16 was then using Turbopack for the app build, and Turbopack crawled Remotion's Node-only/native dependency tree (esbuild binaries, platform compositor packages, optional video-matting/Whisper packages).

## Fixes in v1.8.2
- Production build now uses `next build --webpack`.
- Local Next dev also uses `next dev --webpack` for consistency with Remotion.
- Remotion server packages are listed in `serverExternalPackages` so Next does not statically crawl their native/optional internals.
- `DEPLOY_TO_VERCEL.bat` still deploys with exactly `vercel --prod --force` after linking the extracted folder to an existing project if needed.
- `START_LOCAL.bat` remains available for local use.
- Next.js updated to 16.3.3.

## Deploy
Extract the ZIP, open CMD in the folder and run:

`vercel --prod --force`

If the folder is not linked yet, double-click `DEPLOY_TO_VERCEL.bat`; it will first ask you to select your existing Vercel project, then run the same production command.
