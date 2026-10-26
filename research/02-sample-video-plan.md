# Sample Video #1: Step-by-Step Production Plan (Proof of Concept)

**Goal:** make one **45–60 second** test video, start to finish. We want to learn four things:
1. Can Google Flow keep our doodle characters consistent?
2. Does the voice sound good?
3. Does the visual timing feel like the reference channel?
4. How many hours and how much money does one minute of video cost us?

> Everything below uses **placeholders** (channel name, narrator look, mascot). Change any of them before you start generating. Once the library is made, changing it means regenerating.

---

## The full flow at a glance

| Step | Who | What happens | Output |
|---|---|---|---|
| 1 | **You** | Approve the topic, script, narrator look and mascot below (or ask for changes) | ✅ approval |
| 2 | **You** | Generate the **style sheet** in Google Flow (Prompt 0) and send it to me | `style_sheet.png` |
| 3 | **Me** | Check consistency, adjust the prompts if needed | ✅ / revised prompts |
| 4 | **You** | Generate the 12 character and prop images (Prompts 1–12) | 12 PNGs |
| 5 | **You** | Record or generate the voiceover from the script | `voiceover.wav` |
| 6 | **Me** | Quality-check the assets, get word-by-word timings from the voice, build the chart and text cards | timing file + extra visuals |
| 7 | **Me** | Assemble the video: images appear on the right words, music sting, loudness, export | `sample01_v1.mp4` |
| 8 | **Both** | Watch, list fixes, I make version 2 | `sample01_v2.mp4` |
| 9 | **Both** | Review time and cost, then decide: AI library or illustrator, which voice tool, next steps | decision |

**Why the script comes before the images:** the images must match the jokes and the numbers in the script. If we generate images first, many get wasted.

---

## Step 1 — Approve these placeholders

| Item | Placeholder proposal | Why |
|---|---|---|
| Topic | *"Your Savings Are Shrinking (Even If the Number Isn't)"*, about inflation | Evergreen, simple, and the numbers are pure maths, so no heavy research is needed for a test |
| Narrator | A stick figure with a **round head, short messy brown hair, round glasses and an orange scarf** | Clearly different from Casual Finance's spiky-black-hair narrator |
| Mascot | **"Penny" the piggy bank**: a pink piggy bank with big cartoon eyes | Our version of their "green USA map" mascot, but our own |
| Accent colour | **Orange** (`#FF7A00`) | Their accent is red, so this gives us our own signature |
| Background | Plain white | Same principle; it is cheap and readable |

---

## Step 2 — Script (about 150 words, roughly 55 seconds)

*Brackets are visual notes only; do **not** read them aloud.*

```
Here's something nobody tells you: you can lose money without spending a single dollar.
[narrator smug]

Say you put one hundred dollars in a piggy bank.
[Penny happy, $100 bill drops in]

Ten years later, you open it. Still one hundred dollars. Nice.
[Penny happy, "10 YEARS LATER" card]

Except... it doesn't buy one hundred dollars of stuff anymore.
[dollar bill character melting]

That's inflation. Prices creep up a little every year, so every dollar you hold quietly buys less.
[shopping cart, price tags going up]

At just three percent inflation, your hundred dollars buys about seventy-four dollars' worth of stuff after ten years.
[chart: $100 → $74]

After twenty-four years? Roughly half.
[chart continues to ~$49, narrator shocked]

And three percent is a *normal* year. In 2022, US inflation hit about nine percent.
[narrator shocked, "9.1% (June 2022)" callout]

So the piggy bank isn't safe. It's just... slow.
[Penny worried, sweating]

The money didn't disappear. Its power did.
[narrator pointing at melting dollar]

So where should your savings actually go? That's the next video. Subscribe so you don't miss it.
[narrator smug + "SUBSCRIBE" card]
```

**Fact check**
- 100 ÷ 1.03^10 = **74.4**
- 100 ÷ 1.03^24 = **49.2**
- US CPI inflation peaked at **9.1% year-on-year in June 2022** (US Bureau of Labor Statistics)

An on-screen "Not financial advice" note will appear at the end.

---

## Step 3 — Beat sheet (which image appears on which words)

| # | Narration words (cue) | Visual | Asset type |
|---|---|---|---|
| 1 | "Here's something nobody tells you" | Narrator, neutral | Library: A1 |
| 2 | "lose money" | Narrator, smug | Library: A5 |
| 3 | "without spending a single dollar" | Dollar bill character pops in beside him, happy | Library: B3 |
| 4 | "one hundred dollars in a piggy bank" | Penny, happy | Library: B1 |
| 5 | "Ten years later" | Text card "10 YEARS LATER" | Made in edit |
| 6 | "Still one hundred dollars. Nice." | Penny happy, "$100" label | Library + label |
| 7 | "Except..." | Narrator, suspicious | Library: A2 |
| 8 | "doesn't buy one hundred dollars of stuff" | Dollar bill melting | Library: B4 |
| 9 | "That's inflation." | Title text "INFLATION" (orange) | Made in edit |
| 10 | "Prices creep up" | Shopping cart, price tags going up | Library: C1 |
| 11 | "every dollar you hold quietly buys less" | Cart is half empty | Library: C2 |
| 12 | "three percent inflation" | Chart starts, "3%/yr" label | Made by me |
| 13 | "seventy-four dollars' worth" | Chart reaches $74 at year 10, orange circle | Made by me |
| 14 | "After twenty-four years?" | Chart continues | Made by me |
| 15 | "Roughly half." | Chart at ~$49 plus narrator shocked in the corner | Made by me + A3 |
| 16 | "a normal year" | Narrator shrug | Library: A4 |
| 17 | "2022 … about nine percent" | "9.1%" callout card plus narrator shocked | Made in edit + A3 |
| 18 | "piggy bank isn't safe" | Penny, worried and sweating | Library: B2 |
| 19 | "It's just... slow." | Penny worried, plus a tiny snail prop | Library: B2 + C3 |
| 20 | "didn't disappear. Its power did." | Narrator points at melting dollar | Library: A6 + B4 |
| 21 | "where should your savings go?" | Narrator, thinking | Library: A2 |
| 22 | "Subscribe" | Narrator smug plus "SUBSCRIBE" card | A5 + edit |

That is **22 visual changes in about 55 seconds**, one roughly every 2.5 s, which is close to the reference pace.

---

## Step 4 — Google Flow prompts

### Rules for every image
- **Format:** square (1:1) if offered, otherwise 16:9. Download the highest quality available, as PNG if possible.
- **Background:** pure white. (We don't need transparent backgrounds, because our video canvas is white too.)
- **Consistency:** after Prompt 0 works, **attach `style_sheet.png` as a reference image** for Prompts 1–12. Flow calls these "ingredients"; if your version names it differently, use whatever lets you add a reference image. Also keep the shared style line in every prompt.
- **How many to make:** generate 2–4 options per prompt and keep the best one. Don't spend time fixing small flaws; I can clean those.
- **If Flow only gives video:** use its image option, or Gemini's image generation with the same prompts.
- **File names:** name each file exactly as given (e.g. `narrator_neutral.png`).

**Shared style line** (paste at the end of every prompt):

> *Simple hand-drawn doodle cartoon, thick black marker outlines with slightly wobbly lines, flat colours, minimal detail, no shading, no gradients, pure white background, centred, full body, lots of empty space around the subject, no text.*

### Prompt 0 — Style / character sheet (do this first, then send it to me)

> A character reference sheet showing two cartoon characters side by side. LEFT: a stick-figure man with a large round peach-coloured head, short messy brown hair, small round black glasses, simple dot eyes and a small curved smile, thin black stick body, arms and legs drawn as single lines, wearing only an orange scarf. RIGHT: a pink piggy bank character named Penny with big round cartoon eyes, a coin slot on top, small stubby legs, a cheerful expression. + *shared style line*

### Narrator library (A)

| # | File name | Prompt (add *shared style line* at the end) |
|---|---|---|
| 1 | `narrator_neutral.png` | The same stick-figure man from the reference (round peach head, messy brown hair, round glasses, orange scarf), standing straight, arms relaxed, neutral calm face. |
| 2 | `narrator_suspicious.png` | The same stick-figure man, one eyebrow raised, eyes narrowed, hand on chin, suspicious thinking pose. |
| 3 | `narrator_shocked.png` | The same stick-figure man, eyes wide, mouth open in a big O, both hands on cheeks, shocked. |
| 4 | `narrator_shrug.png` | The same stick-figure man shrugging with both palms up, flat unimpressed expression. |
| 5 | `narrator_smug.png` | The same stick-figure man with a smug half-smile, arms crossed, confident. |
| 6 | `narrator_point.png` | The same stick-figure man pointing to the right with one arm fully extended, serious explaining face, body facing right. |

### Mascot and object characters (B)

| # | File name | Prompt |
|---|---|---|
| 7 | `penny_happy.png` | The same pink piggy bank character Penny from the reference, smiling happily, sitting upright. |
| 8 | `penny_worried.png` | The same pink piggy bank character Penny, worried face, nervous sweat drops, eyes looking sideways. |
| 9 | `dollar_happy.png` | A green paper dollar bill cartoon character with simple dot eyes, a smile and thin stick arms and legs, waving. |
| 10 | `dollar_melting.png` | The same green dollar bill character melting like an ice cream into a puddle, sad droopy eyes. |

### Props (C)

| # | File name | Prompt |
|---|---|---|
| 11 | `cart_prices_up.png` | A shopping cart full of groceries with three price tags floating above it, each with a small upward orange arrow. |
| 12 | `cart_half_empty.png` | The same shopping cart, now only a quarter full, one sad lonely apple inside. |
| 13 | `snail.png` | A small cute snail moving slowly, with tiny motion lines behind it. |

That is **13 images in total**, plus the style sheet.

---

## Step 5 — Voiceover (you)

**Options, best first:**
1. A good paid AI voice (e.g. ElevenLabs), using a stock or designed voice, **not a clone of any real creator**.
2. Your own voice on a phone mic in a quiet room.
3. A free local voice (I can set up Kokoro later if needed).

**Style:** conversational and slightly sarcastic, like explaining to a friend. Medium-fast pace. Small pauses at "Except...", "Roughly half." and "slow."

**File:**
- **One** file containing the whole script.
- WAV if possible (MP3 at 192 kbps or higher is fine).
- Name it `voiceover.wav`.
- No music; I add that.

**Tip:** if one line sounds wrong, regenerate just that line and tell me. I can patch it in.

---

## Step 6 — My work after you send everything

1. **Asset check.** Is the narrator consistent across poses? Are the backgrounds white, the sizes right, and nothing missing? I'll send back a list of any images to redo.
2. **Voice timing.** I install one free tool (Whisper) to get the exact time of every word, then map each beat to its cue word.
3. **Made in the edit:**
   - The inflation chart (orange line, $100 → $74 → $49)
   - The "10 YEARS LATER", "INFLATION" and "9.1%" cards
   - The SUBSCRIBE card
   - The "Not financial advice" note
4. **Assembly** (free tools: Python + FFmpeg):
   - Images pop in on cue words; up to two images can sit side by side.
   - A small "pop" sound effect on key appearances.
   - A short music sting at the start and the end.
   - Loudness set to YouTube's standard (−14 LUFS).
   - Export at 1080p, 24 fps.
5. **QC report:**
   - Sync errors
   - Gaps longer than 3 s without a visual change
   - Repeated images
   - Off-model characters

## Step 7 — Review and decide

We'll record:

| Measure | Target |
|---|---|
| Your time generating assets | under 2 hours |
| Regenerations needed for consistency | under 3 per image |
| Sync feel | images land on the right word |
| Overall look vs reference | "feels like the same quality tier" |

**After the test**
- **If it passes:** build the full library (~80–120 images) and template the process for 10–15 minute videos.
- **If character consistency fails:** commission an illustrator for the library only, and keep AI for one-off gags.

---

## Folder for this sample

```
videos/2026-10_sample01_inflation/
  01_script/  script.md  beat_sheet.md
  02_assets/  (your 13 PNGs + style_sheet.png)
  03_voice/   voiceover.wav
  05_export/  sample01_v1.mp4
```

The reusable images (narrator, Penny, dollar) will later move into `library/` so every future video can use them.
