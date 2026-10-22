# v1.9.2 Reference Output Fixes

This build addresses the five output issues reported from v1.9 reference motion renders:

1. **No half/cropped letters** — automatic mask clipping is removed; reveal-style families now move/fade whole glyphs.
2. **No blue/colored shadow behind black text** — hero words use flat color only, with no automatic shadow, outline, underline, glow or highlight box.
3. **Hook/hero word always uppercase** — the semantic keyword is forced to uppercase at render time.
4. **No decorative bars/arrows/corner marks** — scene background decorations and line ornaments are disabled completely.
5. **Reliable one-click MP4 download** — cloud MP4s stream through an authenticated same-origin `/api/download` route with `Content-Disposition: attachment`; local renders download directly.

Both launchers remain included:
- `START_LOCAL.bat`
- `DEPLOY_TO_VERCEL.bat` (runs `vercel --prod --force` after linking if needed)
