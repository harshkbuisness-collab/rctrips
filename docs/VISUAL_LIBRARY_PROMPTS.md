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

## Part B — Who makes what

| Visual | Source | Who |
|---|---|---|
| 3D icons for everyday concepts (~1,500) | Microsoft Fluent Emoji (GitHub, MIT) | Claude imports (A1) |
| Brand logos (~3,000) | Simple Icons (GitHub, CC0) | Claude imports (A3) |
| Country flags | circle-flags (GitHub, MIT) | Claude imports (A3) |
| Emoji reaction stickers | Fluent Emoji 3D (GitHub, MIT) | Claude imports (A5) |
| Counters, arrows, charts, checklists, compare, quote cards | Code templates | Claude builds (A2) |
| **Animated 3D hero objects** (spinning coin, rocket launch, phone pop-up) | Google Flow (Veo) | **You** |
| **Premium still visuals** in your own style | Google Flow (Imagen) | **You** |
| **B-roll clips** (people, places, work scenes) | Google Flow (Veo) | **You** |
| **Your own mascot / character reactions** | Google Flow | **You** |

So from Flow we only need what free libraries can't give: **motion, your own style, and real-life scenes.**

---

## Part C — Google Flow prompts

### C0. Rules for everything you make in Flow

1. **Background = exact flat colour of our cards**, so no background removal is needed:
   - Light cards: pure white `#FAFAFA`
   - Dark cards (Step / CTA): pure black `#050505`
   Make important objects in **both** versions.
2. **One object, centred, lots of empty space** around it (the tool places it next to text).
3. **No text, letters, logos or watermarks** inside the visual — the tool adds text.
4. **Camera locked** (no zoom/pan) unless the prompt says otherwise.
5. Aspect ratio: **1:1 for objects**, 16:9 and 9:16 for b-roll.
6. Clips: keep the **best 2–4 seconds**; first and last frame should be the object at rest
   (so the tool can loop or freeze it).
7. Export: images PNG, videos MP4 (H.264). Name files `category_object_bg.ext`,
   e.g. `money_coin-stack_white.mp4`.
8. For each file, fill one line of the keyword sheet (C6) so the tool can find it.

### C1. Master style (paste at the start of every object prompt)

```
Premium 3D render, glossy soft-plastic material, smooth rounded shapes, soft studio
lighting, gentle reflections, single object centred with lots of empty space,
perfectly flat seamless [pure white #FAFAFA | pure black #050505] background, no floor
line, soft contact shadow, no text, no letters, no logos, no watermark
```

### C2. Animated hero objects (Veo, 1:1, ~4 s, camera locked)

Add one motion line after the master style:

```
[MASTER STYLE], a stack of gold coins, coins drop in one by one and bounce slightly, then rest
[MASTER STYLE], a red rocket, it shakes, lifts off upward with a small smoke puff, leaves frame
[MASTER STYLE], a smartphone, it pops in with a bounce and the screen lights up blank white
[MASTER STYLE], a stopwatch, the hand spins fast then stops
[MASTER STYLE], a light bulb, it flickers then glows bright yellow
[MASTER STYLE], a megaphone, it tilts and pulses with sound rings
[MASTER STYLE], a growth chart bar set, bars rise one after another, last one tallest
[MASTER STYLE], a falling chart arrow, the red arrow drops and cracks the floor slightly
[MASTER STYLE], a target board, a dart flies in and hits the centre
[MASTER STYLE], a padlock, it unlocks and the shackle pops open
[MASTER STYLE], a gift box, the lid pops off with confetti
[MASTER STYLE], a trophy, it spins once and shines
[MASTER STYLE], a brain, small sparks travel across it
[MASTER STYLE], an hourglass, it flips and sand starts falling
[MASTER STYLE], a magnet, small coins fly toward it and stick
[MASTER STYLE], a calendar, pages flip quickly then stop
[MASTER STYLE], a red cross mark, it slams in and shakes
[MASTER STYLE], a green check mark, it draws itself and bounces
[MASTER STYLE], a question mark, it wobbles and tilts
[MASTER STYLE], a fire flame, it flickers in place, loopable
```

Topic packs — repeat the same pattern for your niches:
- **Money:** wallet, credit card, piggy bank, rupee note stack, bank building, receipt
- **Health/fitness:** dumbbell, apple, water bottle, heart with pulse, running shoe, sleep moon
- **Tech/AI:** laptop, robot head, chip, cloud, code window (blank), Wi-Fi signal
- **Study/career:** book, graduation cap, pencil, briefcase, certificate (blank), clock
- **Social media:** heart like, comment bubble, bookmark, send arrow, bell, camera, play button

### C3. Still versions (Imagen, 1:1)

Same prompts as C2 **without** the motion part. Use when a clip is not needed:
```
[MASTER STYLE], a stack of gold coins
```

### C4. B-roll clips (Veo, 16:9 and 9:16, 4–8 s)

Real scenes for "media" cards. Natural, modern, clean, Indian context where it fits:
```
Cinematic shot, shallow depth of field, soft natural light, modern clean look, no text:
- a young creator filming himself on a phone in a bright room
- hands scrolling an Instagram-style feed on a phone, screen content blurred
- a person typing fast on a laptop at night, desk lamp glow
- a busy Indian street market, slow motion
- a person checking a phone and smiling at notifications, screen not visible
- close-up of a hand writing a plan in a notebook
- a gym workout, dumbbell lift, slow motion
- a team meeting in a modern office, people laughing
```

### C5. Your mascot (optional, gives the brand a face)

Design once, then reuse the same description every time so it stays consistent:
```
Cute 3D mascot character, [describe: small round robot with red visor / chubby cat with
glasses], glossy toy style, [MASTER STYLE background], full body, [EMOTION/ACTION:
shocked jump / laughing / thinking with hand on chin / pointing right / thumbs up /
facepalm / clapping / crying], ~3 s, camera locked
```
Make the 8 reactions above — they replace meme stickers for good.

### C6. Keyword sheet (one line per file)

```
file | en keywords | hinglish | hindi | bg | type
money_coin-stack_white.mp4 | money, profit, income, earn, savings | paisa, kamai | पैसा, कमाई | white | object
money_coin-stack_black.mp4 | (same) | (same) | (same) | black | object
broll_creator-filming_169.mp4 | creator, filming, shoot, content | shoot, video banana | शूट | – | broll
mascot_shocked_white.mp4 | shock, wow, crazy, unbelievable | kya baat, pagal | हैरान | white | reaction
```

Put the files in a folder `flow-assets/` with this sheet as `flow-assets/keywords.csv`,
then ask Claude: **"Import flow-assets into the visual library"** — it will copy them into
`public/`, add them to the search index, and prefer them over the free libraries when both match.
