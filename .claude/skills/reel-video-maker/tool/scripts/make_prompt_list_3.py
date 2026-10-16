# Third prompt set for H: natural body language, sitting/leaning/crouching,
# dynamic camera angles and mid-rep frames (smoother pose crossfades).
# usage (from reel-engine/): PYTHONPATH=scripts python3 scripts/make_prompt_list_3.py
from make_prompt_list import FRONT, SIDE, char_prompt, items as SET1, props as PROPS1
from make_prompt_list_2 import ids as SET2_IDS

THREEQ = "Three-quarter view, body turned to the right, camera at chest height."
LOW = "Dramatic low camera angle from near the floor looking up at him, strong perspective."
HIGH = "High camera angle looking down at him from above, he looks up at the camera."
BACKQ = "Seen from behind and slightly to the side."

items = [
  # mid-rep frames: put between the existing top/bottom pair for smoother motion
  ("hero_pushup_mid", SIDE, "Push-up halfway down: hands on the floor under his shoulders, elbows bent 45 degrees, body straight, between the top and bottom positions."),
  ("hero_pike_mid", SIDE, "Pike push-up halfway down: hips high in an upside-down V, elbows half bent, head halfway to the floor."),
  ("hero_squat_mid", SIDE, "Squat halfway down: knees half bent, hips pushed back, arms stretched forward, back straight."),
  ("hero_pullup_mid", SIDE, "Pull-up halfway up: hands on a horizontal bar, elbows bent 90 degrees, chin below the bar. Draw the bar."),
  ("hero_dip_mid", SIDE, "Dip halfway down on parallel bars: elbows half bent, body upright. Draw the bars."),
  # moving through space
  ("hero_walk_toward", "Camera in front of him, he walks toward the camera.", "Walking confidently toward the viewer mid-stride, one foot forward, arms swinging, shoulders rolling."),
  ("hero_walk_away", BACKQ, "Walking away from the viewer mid-stride, arms swinging."),
  ("hero_look_back", BACKQ, "Walking away but turning his head and upper body to look back over his shoulder at the viewer."),
  ("hero_jog_toward", "Camera in front of him, three-quarter angle.", "Jogging toward the viewer, one foot off the ground, arms pumping, leaning forward."),
  ("hero_slide_in", SIDE, "Skidding to a stop after running in from the left, leaning back, one foot braking forward, arms out for balance."),
  ("hero_step_back_shocked", THREEQ, "Recoiling backward in shock, weight on the back foot, upper body leaning away, hands raised."),
  ("hero_stumble_tired", THREEQ, "Stumbling forward exhausted, knees buckling, arms dangling, head drooping."),
  ("hero_peek_side", "Camera in front of him.", "Leaning in from the right edge of the image, only his head, shoulders and one hand visible, peeking curiously. Body cut off by the image edge on the right."),
  # sitting, leaning, crouching (talking poses)
  ("hero_lean_wall", THREEQ, "Leaning his shoulder against an invisible wall on his left, arms crossed, one ankle crossed over the other, relaxed."),
  ("hero_lean_in_talk", THREEQ, "Leaning forward toward the viewer with hands on his knees, as if telling something important."),
  ("hero_crouch_talk", FRONT, "Crouching low on the balls of his feet, forearms resting on his knees, hands loose, talking to the viewer at eye level."),
  ("hero_sit_bench_talk", THREEQ, "Sitting on a flat gym bench, leaning forward, elbows on his knees, one hand gesturing while talking. Draw the bench."),
  ("hero_sit_bench_think", THREEQ, "Sitting on a flat gym bench, elbow on his knee, chin resting on his fist, thinking. Draw the bench."),
  ("hero_sit_floor_explain", FRONT, "Sitting cross-legged on the floor, leaning slightly forward, one hand raised explaining."),
  ("hero_sit_towel", FRONT, "Sitting on a gym bench after training, towel around his neck, leaning back on his hands, satisfied. Draw the bench and towel."),
  ("hero_lie_side_bored", SIDE, "Lying on his side on the floor, head propped up on one hand, bored."),
  ("hero_kneel_shoe", THREEQ, "Kneeling on one knee tying the laces of his shoe, looking up at the viewer."),
  # gym moments
  ("hero_wipe_sweat", THREEQ, "Wiping sweat off his forehead with a small towel, breathing hard, weight on one leg."),
  ("hero_adjust_wristband", THREEQ, "Adjusting the wristband on his left wrist, focused, getting ready."),
  ("hero_crack_knuckles", FRONT, "Cracking his knuckles in front of his chest, smirking, ready to train."),
  ("hero_neck_stretch", FRONT, "Tilting his head to one side, stretching his neck with one hand, shoulders relaxed."),
  ("hero_chalk_hands", FRONT, "Clapping chalk off his hands, a white chalk cloud between his palms."),
  ("hero_look_up_bar", THREEQ, "Standing under a horizontal pull-up bar looking up at it, rolling his shoulders, about to jump. Draw the bar."),
  ("hero_drop_from_bar", SIDE, "Landing on the floor after dropping from a pull-up bar, knees bent to absorb the landing, arms out."),
  ("hero_pick_dumbbell", SIDE, "Squatting down with a straight back to pick up a dumbbell from the floor."),
  ("hero_dumbbell_shoulder", THREEQ, "Relaxed, resting a dumbbell on his shoulder with one hand, weight on one leg, confident."),
  ("hero_gym_bag", THREEQ, "Walking with a gym bag slung over his shoulder, mid-stride, casual."),
  ("hero_back_double_biceps", "Back view, seen from behind.", "Back double-biceps flex, arms raised, back muscles spread wide, head turned to the side."),
  ("hero_hands_hips_look_back", BACKQ, "Standing with hands on hips, turning his head to look over his shoulder at the viewer."),
  # dynamic camera angles (for hooks and punchlines)
  ("hero_low_angle_hero", LOW, "Standing tall with fists clenched, looking down at the camera, powerful and intimidating."),
  ("hero_high_angle_lookup", HIGH, "Looking up at the camera with a confident grin, arms crossed."),
  ("hero_punch_camera", "Camera in front of him, strong perspective foreshortening.", "Throwing a punch straight at the camera, his fist huge in the foreground, body behind it."),
  ("hero_reach_camera", "Camera in front of him, strong perspective foreshortening.", "Reaching his open hand toward the camera as if grabbing the viewer, leaning forward."),
  ("hero_point_camera_close", "Camera close in front of him, strong perspective foreshortening.", "Leaning toward the camera and pointing his finger right at the lens, intense look."),
  # body language
  ("hero_lean_back_laugh", THREEQ, "Leaning back laughing, one hand on his belly, the other slapping his knee."),
  ("hero_dance", FRONT, "Doing a happy little dance, one knee raised, arms swinging, playful."),
  ("hero_frustrated_pace", THREEQ, "Pacing with frustration, mid-step, both hands on top of his head."),
  ("hero_disappointed_turn", THREEQ, "Turning away disappointed, shoulders slumped, shaking his head, one hand waving dismissively."),
  ("hero_proud_chest", THREEQ, "Puffing out his chest proudly, chin up, thumbs pointing at himself."),
]

lines, ids = [], []
for i, view, pose in items:
    ids.append(i); lines.append(char_prompt(pose, view))

existing = {i for i, *_ in SET1} | {i for i, _ in PROPS1} | set(SET2_IDS) | {"hero_stand"}
dupes = [i for i in ids if i in existing] + [i for i in set(ids) if ids.count(i) > 1]
assert not dupes, dupes
start = len(SET1) + len(PROPS1) + len(SET2_IDS) + 1
if __name__ == "__main__":
    open("prompts/hero-image-prompts-3.txt", "w").write("\n###\n".join(lines) + "\n")
    open("prompts/hero-image-ids-3.txt", "w").write("\n".join(f"{start + n:03d} {i}" for n, i in enumerate(ids)) + "\n")
    print(len(lines), "prompts; numbered", start, "to", start + len(lines) - 1)
