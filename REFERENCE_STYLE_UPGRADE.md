# AI Reel Generator v1.9.1 — Reference Motion Engine

This build converts the v1.8.2 engine toward the supplied reference-Reel language.

## Default visual grammar
- Flat backgrounds only. No gradient canvas backgrounds.
- Neutral off-white/black base with strategic solid red, cobalt, pink, sky-blue or yellow reset scenes.
- Straight grid-aligned typography; no random scattered word placement.
- Locked brand font system using Inter (body), Anton/Oswald (display) and rare Caveat accent moments.
- Curated motion grammar: blur→snap, motion-smear→snap, fast slide+blur, scale pop, mask reveal, sequential word build, clean fade, snap, editorial reveal and punch.
- Visual reset roughly every 2–3 text beats in Reference Rhythm mode.
- Visuals use short conceptual labels/diagrams instead of repeating the full spoken sentence.
- CTA scenes use a separate poster-style hierarchy.
- Meme/reaction stickers default OFF.
- Occasional circle-expansion transition on impact-color scenes.

## Brand systems
Ten fixed themes are included so one can be selected per brand and reused consistently.

## Run locally
Double-click `START_LOCAL.bat`.

## Deploy to existing Vercel project
Double-click `DEPLOY_TO_VERCEL.bat`, or open CMD in this folder and run:

`vercel --prod --force`

If the extracted folder has not been linked yet, the deploy launcher asks you to select the existing project once.
