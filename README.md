# AI Reel Generator v1.9.1 — Reference Motion Engine

A local + Vercel AI Reel Generator tuned to the supplied reference videos: clean flat backgrounds, bold editorial typography, fast controlled motion and semantic visual resets.

## Fast start
- Local: double-click `START_LOCAL.bat`
- Vercel: double-click `DEPLOY_TO_VERCEL.bat`
- Manual production deploy: `vercel --prod --force`

## Recommended defaults
- Brand Theme: 01 · Reference Red
- Typography Variety: Reference Motion
- Visual Rhythm: Reference Rhythm
- Background Behaviour: Reference Flat Rhythm
- Background Motion: Subtle Editorial
- Sticker Intelligence: Off

## Rules enforced by the default engine
1. No gradient canvas backgrounds.
2. No scattered/random typography positions.
3. Fixed brand font system rather than random fonts every scene.
4. Bright flat-color scenes are used as short attention resets, not continuously.
5. Hero words receive aggressive size hierarchy and curated motion.
6. Visuals explain the spoken idea instead of duplicating the full subtitle line.
7. CTA scenes receive their own poster-style layout.

See `REFERENCE_STYLE_UPGRADE.md` for the detailed design-system changes.


## v1.9.2 output fixes
- Full glyphs only: no mask-clipped half letters.
- Hero word is always uppercase.
- No automatic colored text shadow, underline, outline or highlight box.
- No decorative corner marks, bars or edge lines.
- Cloud MP4 download uses a same-origin authenticated download endpoint and starts directly in the browser.


## v1.9.4 Vercel Sandbox render fix

- Fixes production render failure: `cannot create directory ... remotion-bundle/public: No such file or directory`.
- Pre-creates the top-level `remotion-bundle` directory in Vercel Sandbox before `addBundleToSandbox()`.
- Keeps the full bundled `public/` tree, so sticker/static assets remain available to Remotion renders.
- Download behavior from v1.9.2 remains unchanged: finished cloud renders use the authenticated same-origin `/api/download` route.

## v1.9.5 Private Blob URL fix

- Fixes malformed `<store>.undefined.blob.vercel-storage.com` signed media URLs.
- Signed GET URLs now explicitly use `access: private`, exact-path token scope, and host validation.
- `@vercel/blob` pinned to 2.6.1.
