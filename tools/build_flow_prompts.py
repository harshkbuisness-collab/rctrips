"""Builds the two copy-paste Google Flow prompts from library/PROMPT_PACK_v1.md."""
import re
rows = []
for line in open('PROMPT_PACK_v1.md'):
    m = re.match(r'\| ([A-H]\d\d) \| (\S+) \| (.+) \|$', line.strip())
    if m: rows.append(m.groups())
STYLE = "Simple hand-drawn doodle cartoon, thick black marker outlines with slightly wobbly lines, flat colours, minimal detail, no shading, no gradients, pure white background, centred, full body, lots of empty space around the subject, no text."
BG = "Simple hand-drawn doodle cartoon background, thick black marker outlines, flat muted colours, minimal detail, empty scene with no people, no text, wide landscape view."
NAR = "the same stick-figure man from the reference image (large round peach-coloured head, short messy brown hair, small round black glasses, simple dot eyes, thin black stick body with single-line arms and legs, orange scarf)"
PEN = "the same pink piggy bank character Penny from the reference image (pink, big round cartoon eyes, coin slot on top, small stubby legs)"
HEAD = """You are generating a full image asset library for a cartoon YouTube channel about finance and economics. Use the attached reference image (character style sheet) for character consistency and line style.

RULES (follow for every single image):
1. Generate ONE separate image for EACH numbered item below. Never combine two items into one image.
2. Aspect ratio: {ar} for every image.
3. Work in batches of 24. Generate Batch 1 completely (all 24 images). As soon as Batch 1 is finished, immediately continue with Batch 2, then Batch 3, and so on, without stopping, until every item in the list is done.
4. Keep the exact item order. If you can, use the item code (for example A01) as the image file name. Never draw or write the code inside the picture.
5. The narrator and Penny must look exactly like the reference image in every image: same face, same hair, same glasses, same scarf, same colours, same line thickness.
6. Supporting characters (banker, politician, etc.) are NEW characters: match only the drawing style of the reference, not the narrator's face. ALL people must be simple stick figures exactly like the narrator: big round peach head with dot eyes, thin single-line black stick body, arms and legs. Show clothing only as small simple items (a tie, a hoodie outline, a jacket outline). No realistic bodies, no detailed faces, no wrinkles, no shading. Never make anyone look like a real, famous person.
7. Never add text, letters, words, watermarks or logos unless the item asks for them.
8. Style for every image: {style}

TOTAL: {n} images in {b} batches.
"""
def build(items, ar, style, fname):
    bs = [items[i:i+24] for i in range(0, len(items), 24)]
    out = [HEAD.format(ar=ar, style=style, n=len(items), b=len(bs))]
    for i, b in enumerate(bs, 1):
        out.append(f"\n=== BATCH {i} of {len(bs)} ({len(b)} images) ===")
        out += [f"{c}. {p.replace('NARRATOR', NAR).replace('PENNY', PEN)}" for c, _, p in b]
    out.append("\nEND OF LIST. Make sure every item from the first to the last has its own separate image.")
    open(fname, 'w').write("\n".join(out) + "\n")
    print(fname, len(items), "images,", len(bs), "batches")
import sys, os
if len(sys.argv) > 1:  # only the codes listed in this file (e.g. still-missing images)
    want = open(sys.argv[1]).read().split()
    rows = [r for r in rows if r[0] in want]
    tag = sys.argv[2]
else:
    tag = ""
build([r for r in rows if r[0][0] != 'F'], "9:16 (portrait)", STYLE, f"FLOW_PROMPT_1{tag}_portrait_9x16.txt")
if any(r[0][0] == 'F' for r in rows):
    build([r for r in rows if r[0][0] == 'F'], "16:9 (landscape)", BG, f"FLOW_PROMPT_2{tag}_landscape_16x9.txt")
