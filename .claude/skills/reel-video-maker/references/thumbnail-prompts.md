---
name: "effortless-exercise-thumbnail-prompts"
description: "Write image-generation prompts for Effortless Exercise YouTube thumbnails (Shorts 9:16 or long-form 16:9) from a video title, topic or script, using the H-forehead character."
---

# Effortless Exercise thumbnail prompts

Use this whenever the user sends a video title, topic or script (one or many) for the Effortless Exercise fitness / calisthenics channel and wants thumbnail prompts. The user feeds the prompts plus the character reference image to an AI image tool (Google Flow or an agent). Your job is to write prompts that produce consistent, on-brand, instantly clear thumbnails.

Always reply in English, even if the user writes in Hindi or Hinglish.

## Format decision

- Short script or the user says Shorts or 9:16: 1080x1920, 9:16 vertical.
- Long-form or the user says 16:9: 1280x720, 16:9 horizontal.
- If unclear, Shorts (9:16) is the default.

## Output format

- Always give the FULL detailed prompt. Never give a short version.
- Before each prompt, give two short lines only:
  - **Thumbnail text:** the two lines, and why they name the topic.
  - **Concept:** one or two sentences describing the visual idea.
- Then the prompt in one code block.
- Batches: ALL prompts of a batch go in ONE code block (owner's choice, 16 Oct; `scripts/thumb_prompts.py` builds it). If some images fail, the owner sends back the ones that worked: match them to the videos and give ONE new box with only the missing prompts.
- First line of the box: "CREATE ALL IMAGES FOR THESE N THUMBNAILS. Make each one as a SEPARATE image (N images total). Treat every prompt below as a completely separate, independent image request. Attach the same character reference image to every single one. Follow each prompt exactly as written." Then each prompt under a header "THUMBNAIL X OF N: name" so the owner can name the files for the covers ("<number>-<name>.jpg").
- CRITICAL: every prompt must be fully STANDALONE. Repeat the size, character block, crop-safe block, background, text block with the font line, style and avoid list inside EVERY prompt. Never put shared rules once at the top and refer to them. Agents run each prompt separately, and shared rules get lost, which causes thin or changed fonts and character drift.

## The character (never changes)

Every prompt opens with:

"Use the attached character image as the main character and build this thumbnail from it. Keep his face, head shape, skin tone, body proportions and outfit 100% identical to the reference. Do not redesign or restyle him. Same art style as the reference."

Then state how many times he appears ("Only ONE character appears" / "The same character appears twice").

Character details line: "bald muscular man, warm tan skin, white letter \"H\" on his forehead, olive military utility belt with pouches and a silver buckle, black shorts with olive harness straps, black wrist wraps, olive combat sneakers."

Only change the outfit or body when the concept needs it, and say so explicitly (e.g. "OUTFIT FOR THIS IMAGE: plain black fitted t-shirt", "NO wrist wraps so forearms are visible", "IMPORTANT BODY CHANGE: skinny-fat body"). Keep the face and the H unchanged.

## Brand style (never changes)

- Background: plain pure white. No colored backgrounds, gradients or scenery. Only a thin faint grey floor line and soft grey shadows where needed.
- Art style: clean semi-realistic comic illustration, bold black outlines, smooth shading, highly detailed and anatomically accurate muscles, strong soft top lighting, crisp shadows, high contrast so it reads instantly on a small phone screen.
- Color meaning: bold RED glow/overlay = problem or wrong way. Bright glowing GREEN with clear muscle fiber lines and a soft green glow = target muscle or right way. A red X over an object = don't do this.

## Text (the thumbnail is a second title)

- The text must state the video topic plainly so any viewer understands it in one second. Never hide the topic behind a vague or clever hook. If the user looks at it and can't tell the topic, it has failed.
- Use simple words. Avoid technical or uncommon terms: say "side abs" not obliques, "muscle pain" not soreness, "upper back" not traps, "side rib muscle" not serratus, "hidden muscle" or the exercise name, not brachialis.
- Two lines in a white rectangular label box with a thick black border, centered at the top of the safe area. Line 1 in solid black (usually the problem, e.g. "SKINNY WRISTS?"), Line 2 in bold red (usually the fix or answer, e.g. "WATER BOTTLE FIX").
- Write the label lines as: "The label shows exactly two lines of text and nothing else. Top line: WORDS (written in solid black letters). Bottom line: WORDS (written in bold red letters). Write only these words; never write color names or quote marks in the label." (16 Oct: 'Line 1 in solid black: "X"' made the image tool print BLACK "X" RED "Y" in the label.)
- Include this font line in every prompt: "FONT: Anton (or Impact), extra-heavy condensed bold sans-serif, ALL CAPS, very thick strokes, the same font and weight for both lines. Large and readable, filling most of the safe width. Never thin, never regular weight, never a different font."
- Small panel tags (WRONG/RIGHT, EASY/HARD) use the same font: red tag with white text for bad, green tag with white text for good.
- No other text anywhere.

Examples that worked: "SKINNY WRISTS? / WATER BOTTLE FIX", "TRAIN YOUR / SIDE ABS", "THICK ARMS? / TRAIN TRICEPS", "BOX BODY? / GET A V-TAPER", "HOW MANY PUSH-UPS? / NOT 100", "CRUNCHES / WON'T BURN FAT", "DON'T STRETCH / BEFORE WORKOUT".
Examples that failed (too vague): "NOT SORE?", "SAME BELLY?", "SKINNY ARMS?", "SWEAT = FAT LOSS?".

## Crop-safe spacing

For 9:16 Shorts, include this block in every prompt (the top and bottom get cropped):

"CROP-SAFE SPACING (very important, follow strictly):
- Leave a large completely empty white margin at the TOP (about 18% of the image height) and at the BOTTOM (about 20% of the image height). Only plain white background there, nothing else.
- [List what must sit inside] must all sit inside the central 62% of the image height. Do NOT let anything run down to the bottom edge.
- Keep about 8% empty margin on the left and right.
- No element, text or body part touches or is cut off by any edge."

When the character is cropped (at belt, knees, chest), say where and that the crop line must sit above the bottom 20%. Characters running to the bottom edge is a common failure.

For 16:9: keep about 5% empty margin on all edges.

## Concept rules

- One idea per thumbnail, very few elements. The image alone should show the topic.
- Fresh concept every time. Do not copy past thumbnails or reuse the same layout across a batch. Rotate between: wrong vs right stacked panels, big character + tiny chibi version for contrast, single close-up of the target muscle glowing, top-down view with shapes drawn over the body, a simple prop that tells the story (water bottle, chair, crossed-out dumbbell, battery icon, stopwatch).
- Show the exact exercise from the script, accurately. Visuals must match the words (a table is a table, a chair is a chair).
- Prefer pure side view for floor exercises (push-ups, planks, dips, bridges); AI tools get poses right more reliably than 3/4 angles. Spell out the pose: both palms flat on the floor, arms straight, exactly two legs, both feet on toes.
- In stacked comparisons, keep the same camera angle and the same size in both panels so only the key thing changes.
- Never invent numbers or claims that are not in the script.

## Prompt structure (use this order every time)

1. IMAGE SIZE line
2. Character instruction + appearance count
3. Character details line (+ any outfit/body change)
4. CROP-SAFE SPACING block
5. CORE IDEA (one or two sentences: what the text says and what the image proves)
6. BACKGROUND
7. LAYOUT, numbered: 1. TEXT (with the two lines and the FONT line), then the scene, panels, props, each with pose, highlighted muscle, color overlay and expression
8. STYLE
9. AVOID: always include "thin or light font, a different font", content in the top/bottom margins, anything touching the edges, colored or dark background, gradients, scenery, extra text, numbers, arrows, circles, badges, icons, fire, sparks, extra characters, changing the character's face or design, realistic photo style, 3D render, spelling errors, extra limbs, extra fingers, watermarks, plus pose-specific mistakes (hands off the floor, more than two legs, wrong angle).

## Reviewing a generated image

When the user sends back a generated thumbnail, check honestly: is the topic clear in one second, is the pose correct (count limbs and feet), is the font heavy and consistent, are the top and bottom margins empty, is the character unchanged, does the visual match the script. Say plainly whether it is usable. If not, list the problems and give a complete corrected prompt.

If the character drifts across a batch, advise generating 2 to 3 at a time and always attaching the original character image, never an earlier generated thumbnail.
