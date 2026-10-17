"""Builds the upload text (title, description, hashtags) and ALL thumbnail prompts in ONE box.

    import sys; sys.path.insert(0, "<skill>/scripts")
    from thumb_prompts import build, stand, full, panels, ALL, KNEES, GREEN
    V = [ (name, title, description, [3 tick lines], "friend who ...", "#tag1 #tag2",
           ("LABEL LINE 1", "LABEL LINE 2"), why_the_label_works, concept, what_must_fit_inside,
           layout_lines ("2. CHARACTER: ..." / "3. PROP: ..."), extra_avoid), ... ]
    build(V, "work/UPLOAD-TEXT.md", "# Upload text and thumbnail prompts", thumbs_path="work/THUMBNAIL-PROMPTS.md")

Rules it already follows (references/thumbnail-prompts.md): attached-character wording, crop-safe margins,
white background, Anton label with the line colors described in words only (never color names inside the label),
one numbered standalone prompt per video, all prompts in ONE code block.
For thumbnails that failed, call build() again with only the missing entries.
"""
CHAR = ('Use the attached character image as the main character and build this thumbnail from it. Keep his face, head shape, skin tone, body proportions and outfit 100% identical to the reference. Do not redesign or restyle him. Same art style as the reference.')
DET = 'Character details: bald muscular man, warm tan skin, white letter "H" on his forehead, olive military utility belt with pouches and a silver buckle, black shorts with olive harness straps, black wrist wraps, olive combat sneakers.'
FONT = 'FONT: Anton (or Impact), extra-heavy condensed bold sans-serif, ALL CAPS, very thick strokes, the same font and weight for both lines. Large and readable, filling most of the safe width. Never thin, never regular weight, never a different font.'
STYLE = 'STYLE: clean semi-realistic comic illustration, bold black outlines, smooth shading, highly detailed and anatomically accurate muscles, strong soft top lighting, crisp shadows, high contrast so it reads instantly on a small phone screen.'
AVOID = 'AVOID: thin or light font, a different font, content in the top or bottom margins, anything touching the edges, colored or dark background, gradients, scenery, extra text, numbers outside the label, arrows, circles, badges, icons, fire, sparks, extra characters, changing the character\'s face or design, realistic photo style, 3D render, spelling errors, extra limbs, extra fingers, watermarks'
def build(V, path, heading, thumbs_path=None):
  out = [heading]
  prompts = []
  N = len(V)
  for i, (name, title, desc, ticks, friend, tags, (l1, l2), why, concept, inside, layout, avoid) in enumerate(V, 1):
      out.append(f"## {i}. {name}.mp4\n\n```\nTITLE: {title} #shorts\nDESCRIPTION:\n{desc}\n" + "".join(f"✅ {t}\n" for t in ticks) +
                 f"Send this to the friend {friend} 👇\n{tags} #homeworkout #calisthenics #fitness #effortlessexercise\n```\n\n"
                 f"**Thumbnail text:** \"{l1} / {l2}\": {why}.  \n**Concept:** {concept}.\n")
      count = "The same character appears twice." if "appears twice" in layout else "Only ONE character appears."
      layout = layout.replace("\nThe same character appears twice.", "").replace(" The same character appears twice.", "")
      if layout.startswith("1 BED"): layout = "2. " + layout[2:]
      prompts.append(f"""THUMBNAIL {i} OF {N}: {name}

  IMAGE SIZE: 1080x1920, 9:16 vertical (YouTube Shorts thumbnail).

  {CHAR} {count}

  {DET}

  CROP-SAFE SPACING (very important, follow strictly):
  - Leave a large completely empty white margin at the TOP (about 18% of the image height) and at the BOTTOM (about 20% of the image height). Only plain white background there, nothing else.
  - {inside[0].upper() + inside[1:]} must all sit inside the central 62% of the image height. Do NOT let anything run down to the bottom edge.
  - Keep about 8% empty margin on the left and right.
  - No element, text or body part touches or is cut off by any edge.

  CORE IDEA: The text says "{l1} / {l2}". The image proves it: {concept}.

  BACKGROUND: plain pure white. No colors, gradients or scenery. Only a thin faint grey floor line and soft grey shadows where needed.

  LAYOUT:
  1. TEXT: a white rectangular label box with a thick black border, centered at the top of the safe area (just below the empty top margin). The label shows exactly two lines of text and nothing else. Top line: {l1} (written in solid black letters). Bottom line: {l2} (written in bold red letters). Write only these words; never write color names or quote marks in the label. {FONT}
  {layout}

  {STYLE}

  {AVOID}, {avoid}.""")
  out.append(f"\n## Thumbnail prompts (all {N} in one box)\n\n```\nCREATE ALL IMAGES FOR THESE {N} THUMBNAILS. Make each one as a SEPARATE image ({N} images total). Treat every prompt below as a completely separate, independent image request. Attach the same character reference image to every single one. Follow each prompt exactly as written.\n\n" + "\n\n----------\n\n".join(prompts) + "\n```\n")
  open(path, "w").write("\n".join(out))
  if thumbs_path:
    open(thumbs_path, "w").write(out[-1])
  print("ok", N)


# ---- layout helpers
ALL = "the text label and the character"
KNEES = "the text label and the character down to his knees"
SIDE = "pure side view, head on the left"
TWO = "exactly two legs, both feet on their toes"
GREEN = "glow bright green with clear muscle fiber lines and a soft green glow"


def stand(desc, glow=None):
    g = f" {glow}" if glow else ""
    return f"2. CHARACTER: front view, standing, cropped at the knees (the crop line above the bottom 20% margin), {desc}.{g}"


def full(desc):
    return f"2. CHARACTER: {desc}."


def panels(top, bottom):
    return (f"2. TOP PANEL: the character, {top}, a small red tag with white text \"WRONG\" (same Anton font) in the panel's top-left corner.\n"
            f"3. BOTTOM PANEL: the same character, same size and same camera angle, {bottom}, a small green tag with white text \"RIGHT\" in the top-left corner.\n"
            "The same character appears twice.")
