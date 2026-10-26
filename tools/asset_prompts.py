"""Image prompts for one video's own pictures (the owner generates them, Claude puts them in the video).

Usage: python3 tools/asset_prompts.py scripts/dayNN_x.md [how_many=40]
Writes  assets_needed/dayNN_prompts.md   (copy-paste prompts, one per picture, with the file name to save)
        assets_needed/dayNN_assets.json  (id -> the sentence it belongs to; used by script_to_beats.py)
The owner saves each picture as library/custom/dayNN/<ID>.png (PNG or JPG, white background).

Which sentences get a picture: the ones the shared library can't show well (no concrete drawing matches), spread
evenly through the video, skipping sentences that already show a real screenshot or photo. The story's main
character (THREAD line) also gets a pose sheet, so the same person looks the same in every scene.
"""
import json, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "sheet"))
import parse_script, sentence_visuals as sv, script_to_beats as sb

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STYLE = ("Simple hand-drawn doodle cartoon, thick black marker outlines with slightly wobbly lines, flat colours, "
         "minimal detail, no shading, no gradients, pure white background, centred, lots of empty space around the "
         "subject, no text, no letters, no numbers")
POSES = [("CH1", "standing, neutral face, arms down"), ("CH2", "happy, smiling, one hand raised"),
         ("CH3", "worried, hand on cheek"), ("CH4", "shocked, both hands on head"),
         ("CH5", "talking and explaining, one hand out"), ("CH6", "walking to the right"),
         ("CH7", "sitting at a kitchen table looking at papers"), ("CH8", "sad, looking down, shoulders low")]


def character(raw):
    m = re.search(r"^THREAD:\s*(.*)$", raw, re.M)
    if not m:
        return "", ""
    t = m.group(1)
    name = re.match(r"\s*([A-Z][a-z]+(?: [A-Z][a-z]+)?)", t)
    return (name.group(1) if name else ""), t


def main(script, how_many=40):
    raw = open(script, encoding="utf-8").read()
    d = parse_script.parse(script)
    day = f"day{int(d['day']):02d}"
    sents = []
    for ln in d["lines"]:
        for s in sb.sentences(ln["text"]):
            weak = not [c for c in sv.sentence_props(s) if c not in sv.GENERIC]
            sents.append((s, weak, bool(ln["screen"].strip())))
    pool = [i for i, (s, weak, scr) in enumerate(sents) if weak and not scr and len(s.split()) >= 6]
    step = max(1, len(pool) / max(how_many, 1))
    chosen = [pool[int(k * step)] for k in range(min(how_many, len(pool)))]
    name, thread = character(raw)

    assets, rows = {}, []
    if name:
        for pid, pose in POSES:
            assets[pid] = {"type": "pose", "character": name}
            rows.append((pid, "(pose sheet)", f"{name}: {thread}. Full body, {pose}. Same person in every pose. {STYLE}"))
    for k, i in enumerate(chosen, 1):
        s = sents[i][0]
        aid = f"S{k:02d}"
        who = f" If a person is needed, use {name} ({thread.split(',')[0]})." if name and re.search(
            r"\b(she|he|her|his|him)\b|" + re.escape(name.split()[0]), s, re.I) else ""
        assets[aid] = {"type": "scene", "sentence": s}
        rows.append((aid, s, f"One simple doodle picture that shows this idea: \"{s}\"{who} Show it as one clear "
                               f"object or small scene, no words. {STYLE}"))

    os.makedirs(os.path.join(ROOT, "assets_needed"), exist_ok=True)
    json.dump(assets, open(os.path.join(ROOT, "assets_needed", f"{day}_assets.json"), "w"), indent=1)
    out = [f"# {day}: pictures to make ({len(rows)})", "",
           f"Save each picture as **library/custom/{day}/<ID>.png** (for example `library/custom/{day}/S01.png`).",
           "Square (1:1) is best. White background. No text in the picture: the video adds text itself.",
           "Attach `library/style_reference/style_sheet.jpg` as the style reference for every prompt.", ""]
    for aid, s, prompt in rows:
        out += [f"## {aid}", f"Where: {s}" if s != "(pose sheet)" else "Where: main character pose sheet",
                "```", prompt, "```", ""]
    path = os.path.join(ROOT, "assets_needed", f"{day}_prompts.md")
    open(path, "w", encoding="utf-8").write("\n".join(out))
    print(f"{len(rows)} prompts -> {path}")
    return path


if __name__ == "__main__":
    main(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 40)
