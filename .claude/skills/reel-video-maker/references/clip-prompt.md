# Prompt for a new animation clip (owner's video tool, 12 credits per clip)

Attach the H reference image and paste:

```
Animate the attached 2D cartoon character. Use ONLY the attached character: same face, white "H" on the forehead, same muscular body, same outfit (black wristbands, olive tactical belt with pouches, black shorts with olive harness straps, olive combat boots), same 2D cartoon style. Do not create a new character.

RULES: vertical 9:16, 8 seconds, smooth fluid 2D cartoon animation, plain pure white background, no shadows on the wall, no room, camera completely still (no zoom, no pan), whole body always fully inside the frame and big, perfect loop (last frame = first frame), correct exercise form, steady reps, no text, no extra people.

CLIP: <exercise, view (side / front), equipment, what moves>
```
After the owner sends the clip: crop it to the figure and add it to `public/library/clips/library.json` (id `clip_<name>`,
kind `video`, duration, description) in the tool.
