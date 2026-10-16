# Set 4 = only the images still missing after batch 1 (see hero_batch1_map.py),
# most important first. Poses that came out wrong in batch 1 get stricter wording.
# usage (from reel-engine/): PYTHONPATH=scripts python3 scripts/make_prompt_list_4.py
import json
from make_prompt_list import IDENTITY, SIDE, FRONT, char_prompt, items as S1
from make_prompt_list_2 import exercises, creative, faces, FACE_END
from make_prompt_list_3 import items as S3

NOT_STANDING = "IMPORTANT: draw exactly this position. He is NOT standing upright and NOT floating in the air unless the pose says so."
OVERRIDES = {
  "hero_pushup_bottom": "Push-up BOTTOM position: body horizontal and parallel to the floor, chest only a few centimeters above the floor, elbows sharply bent about 90 degrees and pointing back, hands flat on the floor beside his chest, toes on the floor, body straight from head to heels.",
  "hero_pike_bottom": "Pike push-up BOTTOM: hands and feet on the floor, hips stay the highest point of the body (upside-down V), elbows bent, the top of his head almost touching the floor just in front of his hands.",
  "hero_squat_bottom": "Deep bodyweight squat BOTTOM: hips below knee level, thighs parallel to the floor, heels flat, back straight, chest up, both arms stretched straight forward at shoulder height.",
  "hero_pullup_top": "Top of a pull-up: hands gripping a horizontal bar above him, chin above the bar, elbows fully bent, both feet hanging in the air far above the floor, legs straight down, NO contact with the floor. Draw the bar.",
  "hero_pullup_mid": "Pull-up halfway up: hands gripping a horizontal bar, elbows bent 90 degrees, chin below the bar, both feet hanging in the air far above the floor, no contact with the floor. Draw the bar.",
  "hero_crunch_end": "Crunch: lying on his back ON THE FLOOR, hips and both feet flat on the floor, knees bent, only his shoulders and upper back curled up off the floor, hands behind his head, abs tight.",
  "hero_side_plank": "Side plank: body lying sideways close to the floor, supported only by his right forearm and the outer edge of his right foot, body one straight diagonal line from feet to head, hips lifted off the floor, left hand on his hip, chest facing the viewer.",
  "hero_mountain_a": "Mountain climber: body horizontal in a high push-up plank with hands on the floor and arms straight, right knee pulled toward his chest, left leg straight back with toes on the floor.",
  "hero_mountain_b": "Mountain climber: body horizontal in a high push-up plank with hands on the floor and arms straight, left knee pulled toward his chest, right leg straight back with toes on the floor.",
  "hero_pushup_wrong_hips": "Push-up done WRONG: high push-up position with hands on the floor and arms straight, but his hips sag down toward the floor so the body forms a U-shaped banana curve.",
  "hero_foam_rolling": "Foam rolling: sitting on the floor with a foam roller under the back of his thighs, legs straight, hands on the floor behind him holding his weight. Draw the foam roller.",
  "hero_back_lever": "Back lever: hanging below a horizontal bar with straight arms reaching behind him, body completely straight and horizontal, face down, like a plank floating under the bar. Draw the bar.",
  "hero_superman": "Superman: lying face down on the floor, belly on the floor, arms stretched forward and legs straight back, both arms and legs lifted a little off the floor.",
}

have = {a["id"] for a in json.load(open("public/library/hero/library.json"))["assets"]}
have |= {"hero_crunch_start"}  # hero_glute_bridge_down is the same position

ex_ids = {i for i, *_ in exercises}
groups = [
  ("redo", [x for x in S1 if x[0] not in have]),
  ("body language", list(S3)),
  ("faces", [(f"hero_{i}", None, e) for i, e in faces]),
  ("exercises", list(exercises)),
  ("creative", list(creative)),
]
seen, ids, lines = set(), [], []
for name, items in groups:
    for i, view, pose in items:
        if i in have or i in seen:
            continue
        seen.add(i)
        pose = OVERRIDES.get(i, pose)
        if view is None:  # face close-up
            text = f"Head-and-shoulders close-up. EXPRESSION: {pose} Head turned and tilted naturally, not a straight passport photo. {IDENTITY} {FACE_END}"
        else:
            extra = f" {NOT_STANDING}" if (i in ex_ids or name == "redo") else ""
            text = char_prompt(pose + extra, view)
        ids.append((name, i)); lines.append(text)

if __name__ == "__main__":
    open("prompts/hero-image-prompts-4.txt", "w").write("\n###\n".join(lines) + "\n")
    open("prompts/hero-image-ids-4.txt", "w").write("\n".join(f"{n + 1:03d} {i}  ({g})" for n, (g, i) in enumerate(ids)) + "\n")
    from collections import Counter
    print(len(lines), "prompts", dict(Counter(g for g, _ in ids)))
