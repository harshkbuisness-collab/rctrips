# Visual Library — Prompt File

One reusable visual library for **every** typography reel the tool makes (any topic, any language: English, Hinglish, Hindi).
The tool reads the script's words and picks visuals automatically. Users can still change any visual by hand.

**Rules for every part**
- One visual per card at most. Keep roughly 1 in 3 cards text-only so videos stay clean.
- Priority when several match: motion template → brand logo → flag → 3D icon → sticker.
- Every asset has keywords in English, Hinglish (Roman) and Hindi (Devanagari).
- All assets are stored inside the project (`public/`), never loaded from a CDN at render time.
- Only free, license-safe sources (MIT / CC0 / own work). Record the license in `public/LICENSES.md`.
- Keep the current style: white/black flat backgrounds, Inter font, blur-in words, hard cuts.

---

## Part A — Build prompts (give these to Claude, one at a time)

Each prompt is self-contained. Run them in order. After each one, render a test video and check it before the next.

### A1. Full 3D icon library (auto-tagged)

```
In the reel tool repo, replace the 37 hand-picked icons in src/engine/icons.js with the full
Microsoft Fluent Emoji 3D set (MIT, github.com/microsoft/fluentui-emoji).

1. Write scripts/import-fluent-icons.mjs that downloads every asset's 3D PNG and its
   metadata.json, skips skin-tone variants (keep "Default"), and saves:
   - images to public/icons/<slug>.png (resize to 256px, keep transparency)
   - an index to src/engine/iconIndex.json: [{slug, name, keywords[]}] using the official
     keywords from metadata.json.
2. Add Hindi + Hinglish keywords for the 300 most common concepts in
   src/engine/iconKeywordsHi.json (e.g. paisa, पैसा → money bag).
3. Rewrite matchIcon(words, heroIndex) to search the index: exact keyword match first,
   then simple stem match (plural/-ing), hero word checked first. Return '' when unsure.
4. Keep the editor's icon dropdown working, with a search box instead of a long list.
5. Add server/icon-self-test.js with 20 sample sentences (English, Hinglish, Hindi) and the
   expected icon for each. Add a public/LICENSES.md entry.
Render one test video and show me 6 frames with icons.
```

### A2. Motion templates (pure code, any topic)

```
In the reel tool repo, add animated "template" visuals in src/remotion/templates/, each a
React component that takes the card's words + timing, with matching rules in
src/engine/templates.js. Add a new card type "template" in src/engine/plan.js and Reel.jsx.

Templates and their triggers (English, Hinglish, Hindi):
- counter:     a number with unit ("10k", "50%", "₹5000", "10 lakh", "2 crore") → number
               counts up when spoken.
- fromTo:      "from X to Y" / "X se Y" → X, dashed arrow, Y counting up.
- compare:     "vs", "but", "instead", "galat vs sahi", "नहीं… बल्कि" → split card ❌ left / ✅ right.
- checklist:   3+ list items or "first/second/third", "pehla/doosra" → items tick one by one.
- timeline:    years, "30 days", "every morning", "रोज़" → calendar / clock / timeline.
- question:    "why/how/what", "kya/kaise/kyun", "क्या/कैसे/क्यों" → big question card with "?".
- trend:       "increase/grow/badh" or "drop/down/ghat" → line chart going up or down.
- quote:       "as X said", "X ne kaha" → quote card with name.
- percentRing: "N%" when no other number template fits.
Rules: max one template per card, at least 2 cards between two templates, all motion
synced to word times, colours from the theme. Add an editor dropdown to change or remove
the template per card. Add server/template-self-test.js with sample sentences per template.
Render one test video that triggers at least 6 templates.
```

### A3. Brand logos and flags

```
In the reel tool repo, add brand logos and country flags.

1. scripts/import-logos.mjs: download Simple Icons (CC0, simpleicons.org) as SVGs into
   public/logos/, index to src/engine/logoIndex.json [{slug, title, aliases[], hex}].
   Add common Indian-script names (e.g. "यूट्यूब", "insta", "gpt").
2. scripts/import-flags.mjs: country flags (circle-flags, MIT) into public/flags/ with
   country names in English + Hindi.
3. Logos render on a white rounded tile with soft shadow (like an app icon), in the
   brand colour. Match multi-word names ("google ai studio") before single words.
4. Logos beat 3D icons when both match. Add to the editor's visual picker.
5. Note in public/LICENSES.md that logos are trademarks of their owners.
Render a test video with at least 4 logos.
```

### A4. User media (screenshots / screen recordings)

```
In the reel tool repo, let users attach their own image or short video to any card.

1. Editor: per card, "Add media" button (png/jpg/webp/mp4, max 50 MB). Upload through the
   existing uploadMedia() in src/cloud.js (local disk or Private Blob).
2. New card type "media": the image/clip in a rounded frame with soft shadow, centred,
   sliding up with a slight scale-in; the card's sentence shows small below it.
   Videos play muted, trimmed to the card length, object-fit contain.
3. Media must work in preview (object URL) and in the MP4 render (signed blob URL,
   same way the voice audio is handled in src/app/api/render/route.js).
4. Remove media button restores the previous card type.
Render a test video using one screenshot and one short clip.
```

### A5. Safe sticker pack (replace meme images)

```
In the reel tool repo, the 72 meme stickers in public/stickers are copyrighted images.
Replace them with license-safe reaction stickers:
1. Use Fluent Emoji 3D faces/hands (MIT) as stickers: 😂 🤯 😤 🤔 👀 👏 🔥 💯 ✅ ❌ 🙏 💸 etc.
2. Keep the mood rules in src/engine/stickers.js (question, negative, success, money, cta,
   thanks, shock, sad) but map them to the new set.
3. Sticker animation: pop + small wiggle, bottom-right, never on the same card as an icon.
4. Delete the old meme files and stickerData entries; update the editor list.
Render a test video and show me 4 sticker frames.
```

### A6. Picker quality pass (after A1–A5)

```
In the reel tool repo, review how visuals are chosen across 5 different scripts
(finance, fitness, tech, motivation, Instagram tips — write each ~25 seconds, half of them
Hinglish). For each script, list every card with the visual chosen and mark wrong or
weak picks. Fix the matching rules (keywords, priorities, spacing) until at least 90% of
picks make sense. Keep the fixes small and add the 5 scripts to a self-test.
```

---

## Part B — Image prompts (for custom visuals with an AI image tool)

Use these when the free libraries have no good match and you want **your own** branded visuals.
Works in Midjourney, Ideogram, Leonardo, DALL·E or similar. Export PNG with transparent
background (remove background if the tool can't), 1024×1024, then add it to `public/icons/`
with keywords.

### B1. Master style (paste before every prompt)

```
3D glossy icon, soft studio lighting, smooth rounded shapes, subtle gradient, clean
minimal design, centred single object, isolated on pure white background, soft shadow
below, no text, no letters, no watermark, high detail, 1:1
```

### B2. Concept icon prompts (replace the object)

```
[MASTER STYLE] + a stack of gold coins with an upward arrow
[MASTER STYLE] + a smartphone showing a play button
[MASTER STYLE] + a brain with a small light bulb
[MASTER STYLE] + a stopwatch at 3 seconds
[MASTER STYLE] + a megaphone with sound waves
[MASTER STYLE] + an open book with sparkles
[MASTER STYLE] + a dumbbell and a heart
[MASTER STYLE] + a shopping bag with a price tag
[MASTER STYLE] + a shield with a check mark
[MASTER STYLE] + a rocket leaving a trail
[MASTER STYLE] + a magnet pulling small people icons
[MASTER STYLE] + a calendar with a red circle on one day
```

### B3. Reaction sticker prompts

```
cute 3D character sticker, [EMOTION: shocked / laughing / thinking / angry / proud / crying],
big expressive face, simple body, glossy toy style, thick white sticker outline,
isolated on white background, no text, 1:1
```

### B4. Brand-colour variant (to match a theme)

```
[MASTER STYLE] + [OBJECT], main colour [#E5262A red | #1F6BFF blue | #FFE600 yellow],
other parts white and light grey
```

### B5. Background textures (optional, use rarely)

```
minimal abstract background, very soft [white | black] paper texture, subtle grain,
no objects, no text, 16:9
```

**Keyword sheet for each custom image** (add to the index):
`file: coins-up.png | en: money, profit, income, earn | hinglish: paisa, kamai | hindi: पैसा, कमाई`
