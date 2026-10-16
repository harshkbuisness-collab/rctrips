# Builds prompts/hero-image-prompts.txt (one complete image prompt per line) and
# prompts/hero-image-ids.txt (the file name for each line, same order).
# The reference image is only for WHO he is. Earlier prompts copied its stiff,
# straight, front-facing stance into every image, so the pose comes first and
# the identity block explicitly forbids reusing the reference pose.
IDENTITY = ("The character must be the man from the reference image. Copy ONLY his identity from it: same face and "
     "stern features, bald head with a white letter H on the forehead, very muscular build, tan skin, black shorts "
     "with an olive military belt with pouches and a silver buckle, black wristbands, black-and-olive training shoes, "
     "and the same comic cel-shaded illustration style with bold dark outlines. Do NOT copy the pose, stance or camera "
     "angle of the reference image: he must not stand straight and stiff. His whole body takes the new pose: spine, "
     "hips, shoulders, head, arms and legs all move, with natural weight shift and asymmetry, like a real person "
     "caught mid-action.")
H = IDENTITY  # kept for older callers
END = ("Full body visible with a small margin around it. Plain pure white background, no floor, no ground shadow, "
       "no text, and no objects other than those mentioned in the pose.")
FRONT = ("Camera in front of him at chest height. Unless the pose says otherwise, he stands relaxed with his weight "
         "on one leg, hips and shoulders tilted, a slight lean and a head tilt, never symmetrical or rigid.")
SIDE = ("Side view, facing right (his head on the right side of the image), camera at hip height, same distance as "
        "a standard full-body shot.")


def char_prompt(pose, view):
    return f"Full-body illustration. POSE: {pose} {view} {IDENTITY} {END}"


PROP = ("Do not draw the character. Draw only {obj}, in the same comic cel-shaded illustration style with bold dark "
        "outlines as the reference image. Object centered with a small margin, plain pure white background, no shadow, no text.")

items = [
  # reactions, front view
  ("hero_point_viewer", FRONT, "Pointing his right index finger straight at the viewer, confident look."),
  ("hero_arms_crossed", FRONT, "Arms crossed over his chest, serious, slightly smug expression."),
  ("hero_thumbs_up", FRONT, "Giving a big thumbs up with his right hand, small confident smile."),
  ("hero_thinking", FRONT, "One hand on his chin, looking up and to the side, thinking."),
  ("hero_explain", FRONT, "Explaining something: right hand open with the palm up in front of him, left arm relaxed."),
  ("hero_shocked", FRONT, "Shocked: eyes wide, mouth open, both hands raised near his face."),
  ("hero_facepalm", FRONT, "Facepalm: right palm covering his face, disappointed, left arm relaxed."),
  ("hero_double_biceps", FRONT, "Classic bodybuilding double-biceps flex with both arms raised, proud expression."),
  ("hero_tired_sweating", FRONT, "Exhausted: bent forward with both hands on his knees, breathing hard, big cartoon sweat drops on his head."),
  # exercise pairs, side view
  ("hero_pushup_top", SIDE, "Push-up top position: hands on the floor under his shoulders, arms straight, body in one straight line from head to heels, toes on the floor."),
  ("hero_pushup_bottom", SIDE, "Push-up bottom position: hands on the floor under his shoulders, elbows bent, chest just above the floor, body in one straight line from head to heels, toes on the floor."),
  ("hero_pike_top", SIDE, "Pike push-up top position: hands and feet on the floor, hips pushed high so the body forms an upside-down V, arms and legs straight, head between the arms."),
  ("hero_pike_bottom", SIDE, "Pike push-up bottom position: hands and feet on the floor, hips still high in an upside-down V, elbows bent, head lowered toward the floor just in front of the hands."),
  ("hero_squat_top", SIDE, "Bodyweight squat start: standing tall, feet flat, both arms stretched straight forward at shoulder height."),
  ("hero_squat_bottom", SIDE, "Deep bodyweight squat: thighs parallel to the floor, feet flat, back straight, both arms stretched straight forward at shoulder height."),
  ("hero_plank", SIDE, "Forearm plank: forearms and toes on the floor, body perfectly straight from head to heels."),
  ("hero_pullup_hang", SIDE, "Dead hang from a horizontal pull-up bar above him, both hands gripping the bar, arms fully straight, legs straight down. Draw the pull-up bar."),
  ("hero_pullup_top", SIDE, "Top of a pull-up: hands gripping a horizontal pull-up bar, chin above the bar, elbows bent and pulled down to his sides, legs straight down. Draw the pull-up bar."),
  ("hero_crunch_start", SIDE, "Lying on his back on the floor, knees bent, feet flat, hands behind his head, shoulders on the floor."),
  ("hero_crunch_end", SIDE, "Doing a crunch: lying on his back, knees bent, feet flat, hands behind his head, shoulders lifted off the floor, abs tight."),
  ("hero_lunge", SIDE, "Forward lunge: front knee bent at 90 degrees, back knee just above the floor, torso upright, hands on hips."),
  # phase 2 exercises
  ("hero_pushup_wrong_hips", SIDE, "Push-up done WRONG: hands on the floor, arms straight, hips sagging down toward the floor, lower back arched."),
  ("hero_pike_wrong", SIDE, "Pike push-up done WRONG: hands and feet on the floor but hips too low, body almost flat like a normal push-up."),
  ("hero_squat_wrong", FRONT, "Squat done WRONG: half squat with knees caving inward toward each other and back rounded."),
  ("hero_dip_top", SIDE, "Dip top position on two parallel bars: arms straight supporting his body, body upright, legs slightly bent behind. Draw the parallel bars."),
  ("hero_dip_bottom", SIDE, "Dip bottom position on two parallel bars: elbows bent at 90 degrees, shoulders lowered, body upright, legs slightly bent behind. Draw the parallel bars."),
  ("hero_row_start", SIDE, "Inverted row start: hanging under a low horizontal bar, hands gripping it, arms straight, body straight, heels on the floor. Draw the bar."),
  ("hero_row_end", SIDE, "Inverted row top: under a low horizontal bar, hands gripping it, chest pulled up to the bar, body straight, heels on the floor. Draw the bar."),
  ("hero_side_plank", FRONT, "Side plank on his right forearm, body straight and sideways to the viewer, left hand on his hip."),
  ("hero_leg_raise_down", SIDE, "Lying on his back, hands under his hips, both legs straight and held just above the floor."),
  ("hero_leg_raise_up", SIDE, "Lying on his back, hands under his hips, both legs straight and raised to vertical."),
  ("hero_mountain_a", SIDE, "Mountain climber: high plank with arms straight, right knee pulled toward his chest, left leg straight back."),
  ("hero_mountain_b", SIDE, "Mountain climber: high plank with arms straight, left knee pulled toward his chest, right leg straight back."),
  ("hero_glute_bridge_down", SIDE, "Lying on his back, knees bent, feet flat, arms flat on the floor, hips resting on the floor."),
  ("hero_glute_bridge_up", SIDE, "Glute bridge: lying on his back, feet flat, arms flat on the floor, hips raised so knees, hips and shoulders form one straight line."),
  ("hero_handstand", SIDE, "Freestanding handstand: hands on the floor, body perfectly straight and vertical, legs together pointing up."),
  ("hero_burpee_jump", FRONT, "Jumping straight up in the air with both arms raised overhead, feet off the ground."),
  ("hero_curl_down", FRONT, "Standing, holding a dumbbell in each hand, arms straight down by his sides."),
  ("hero_curl_up", FRONT, "Standing, biceps curl: both dumbbells curled up to his shoulders, elbows at his sides."),
  ("hero_deadlift_start", SIDE, "Barbell deadlift start: hips pushed back, back flat, arms straight, gripping a loaded barbell resting on the floor. Draw the barbell."),
  ("hero_deadlift_end", SIDE, "Barbell deadlift finish: standing tall, arms straight, holding a loaded barbell at hip height. Draw the barbell."),
  ("hero_stretch_hamstring", SIDE, "Standing hamstring stretch: legs straight, bending forward from the hips, hands touching his toes."),
  # phase 3 lifestyle
  ("hero_eating", FRONT, "Happily eating a big grilled chicken leg held in his right hand."),
  ("hero_drinking_shake", FRONT, "Drinking from a protein shaker bottle held in his right hand."),
  ("hero_sleeping", SIDE, "Lying on his side on the floor, peacefully asleep, eyes closed, hands under his head."),
  ("hero_phone_scroll", FRONT, "Looking down at a smartphone held in both hands, bored expression."),
  ("hero_running", SIDE, "Running fast mid-stride, arms pumping, one foot off the ground."),
  ("hero_walking", SIDE, "Walking calmly mid-step, arms swinging naturally."),
  ("hero_lazy_couch", FRONT, "Slumped lazily as if sitting on an invisible couch, holding a burger, lazy expression."),
  ("hero_angry_shout", FRONT, "Shouting angrily like a drill instructor, mouth wide open, fists clenched."),
  ("hero_laughing", FRONT, "Laughing hard with his head tilted back and eyes closed."),
  ("hero_sad_crying", FRONT, "Exaggerated cartoon crying, big tears streaming down his face, shoulders slumped."),
  ("hero_count_1", FRONT, "Holding up his right hand toward the viewer showing one finger (index finger)."),
  ("hero_count_2", FRONT, "Holding up his right hand toward the viewer showing two fingers."),
  ("hero_count_3", FRONT, "Holding up his right hand toward the viewer showing three fingers."),
  ("hero_count_4", FRONT, "Holding up his right hand toward the viewer showing four fingers."),
  ("hero_count_5", FRONT, "Holding up his right hand toward the viewer with an open palm showing five fingers."),
  ("hero_back_view", "Back view, seen from behind.", "Standing straight, arms down, large back muscles visible."),
  ("hero_side_view", SIDE, "Standing straight and relaxed, arms down."),
  ("hero_side_chest", "Three-quarter view.", "Bodybuilding side-chest pose."),
  ("hero_beginner", FRONT, "SAME face, H on the forehead and same outfit, BUT with a skinny untrained beginner body; standing shyly, slightly hunched."),
]
props = [
  ("prop_dumbbell", "one black dumbbell, side view"),
  ("prop_protein_food", "a plate with grilled chicken, boiled eggs and rice"),
  ("prop_water_bottle", "a large gym water bottle"),
  ("prop_barbell", "a loaded barbell with black plates, side view"),
  ("prop_pullup_bar", "a horizontal pull-up bar on two posts"),
  ("prop_kettlebell", "a black kettlebell"),
  ("prop_resistance_band", "a coiled green resistance band"),
  ("prop_yoga_mat", "a rolled-out purple exercise mat seen from the side"),
  ("prop_burger", "a big cheeseburger"),
  ("prop_pizza", "a pizza slice"),
  ("prop_eggs", "three white eggs"),
  ("prop_shaker", "a protein shaker bottle"),
  ("prop_alarm_clock", "a classic red twin-bell alarm clock"),
  ("prop_bed", "a simple single bed with a pillow and blanket, side view"),
  ("prop_phone", "a smartphone, front view, screen glowing"),
  ("prop_weighing_scale", "a bathroom weighing scale, top view"),
  ("prop_calendar", "a wall calendar page"),
  ("prop_stopwatch", "a silver stopwatch"),
  ("prop_fire", "a cartoon flame"),
  ("prop_sweat_drops", "a group of three cartoon sweat drops"),
  ("prop_red_x", "a bold red X mark"),
  ("prop_green_check", "a bold green check mark"),
]
def build():
  ids, lines = [], []
  for i, view, pose in items:
    ids.append(i); lines.append(char_prompt(pose, view))
  for i, obj in props:
    ids.append(i); lines.append(PROP.format(obj=obj))
  open("prompts/hero-image-prompts.txt", "w").write("\n###\n".join(lines) + "\n")
  open("prompts/hero-image-ids.txt", "w").write("\n".join(f"{n+1:03d} {i}" for n, i in enumerate(ids)) + "\n")
  print(len(lines), "prompts")

if __name__ == "__main__":
  build()
