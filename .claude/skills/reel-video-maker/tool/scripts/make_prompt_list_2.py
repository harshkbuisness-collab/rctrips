# Second prompt set for H: every other common exercise + creative / expression poses.
# usage (from reel-engine/): PYTHONPATH=scripts python3 scripts/make_prompt_list_2.py
# Writes prompts/hero-image-prompts-2.txt (prompts separated by ### lines) and
# prompts/hero-image-ids-2.txt. Numbering continues after the first set.
from make_prompt_list import IDENTITY, FRONT, SIDE, char_prompt, items as SET1, props as PROPS1

THREEQ = "Three-quarter view, body turned slightly to the right."
BACK = "Back view, seen from behind."
FACE_END = ("Head-and-shoulders close-up portrait, centered, plain pure white background, no text, "
            "and no objects other than those mentioned.")

exercises = [
  # chest / push
  ("hero_wide_pushup_top", SIDE, "Wide push-up top: hands placed much wider than shoulders, arms straight, body straight from head to heels."),
  ("hero_wide_pushup_bottom", SIDE, "Wide push-up bottom: hands much wider than shoulders, elbows bent out, chest just above the floor, body straight."),
  ("hero_diamond_pushup_top", SIDE, "Diamond push-up top: hands together under his chest forming a diamond with thumbs and index fingers, arms straight, body straight."),
  ("hero_diamond_pushup_bottom", SIDE, "Diamond push-up bottom: hands together under his chest in a diamond, elbows bent close to the body, chest just above his hands."),
  ("hero_knee_pushup_top", SIDE, "Knee push-up top (beginner): knees on the floor, arms straight, straight line from head to knees."),
  ("hero_knee_pushup_bottom", SIDE, "Knee push-up bottom (beginner): knees on the floor, elbows bent, chest just above the floor."),
  ("hero_incline_pushup", SIDE, "Incline push-up: hands on a low flat bench, feet on the floor, arms straight, body straight. Draw the bench."),
  ("hero_decline_pushup", SIDE, "Decline push-up: feet up on a low box, hands on the floor, arms straight, body straight and angled down. Draw the box."),
  ("hero_archer_pushup", FRONT, "Archer push-up: hands very wide on the floor, bending one arm while the other arm stays straight out to the side, body low."),
  ("hero_clap_pushup", SIDE, "Explosive clap push-up: body in the air above the floor, hands clapping under his chest, toes on the floor."),
  ("hero_one_arm_pushup", SIDE, "One-arm push-up: one hand on the floor, the other arm behind his back, feet wide, body straight."),
  ("hero_bench_press_down", SIDE, "Barbell bench press bottom: lying on a flat bench, barbell lowered to his chest, elbows bent. Draw the bench and the loaded barbell."),
  ("hero_bench_press_up", SIDE, "Barbell bench press top: lying on a flat bench, arms straight, pressing the loaded barbell above his chest. Draw the bench and barbell."),
  ("hero_dumbbell_fly_open", FRONT, "Dumbbell fly: lying on a flat bench, arms opened wide to the sides with slightly bent elbows, a dumbbell in each hand. Draw the bench."),
  ("hero_dumbbell_fly_closed", FRONT, "Dumbbell fly top: lying on a flat bench, both dumbbells brought together above his chest, arms slightly bent. Draw the bench."),
  # back
  ("hero_archer_pullup", FRONT, "Archer pull-up: hands very wide on a horizontal bar, pulling up toward one hand while the other arm stays straight. Draw the bar."),
  ("hero_barbell_row_start", SIDE, "Bent-over barbell row start: hips back, torso leaning forward at 45 degrees, flat back, arms straight holding a loaded barbell below the knees."),
  ("hero_barbell_row_end", SIDE, "Bent-over barbell row top: hips back, torso leaning forward at 45 degrees, flat back, barbell pulled up to his belly, elbows behind him."),
  ("hero_one_arm_row", SIDE, "One-arm dumbbell row: one knee and one hand on a flat bench, back flat, other hand pulling a dumbbell up to his hip. Draw the bench."),
  ("hero_lat_pulldown_up", FRONT, "Lat pulldown start: sitting at a lat pulldown machine, arms straight up holding the wide bar. Draw the machine simply."),
  ("hero_lat_pulldown_down", FRONT, "Lat pulldown end: sitting at a lat pulldown machine, wide bar pulled down to his upper chest, elbows down. Draw the machine simply."),
  ("hero_superman", SIDE, "Superman hold: lying face down, arms stretched forward and legs straight back, both lifted off the floor."),
  ("hero_back_extension", SIDE, "Back extension on a hyperextension bench: hips on the pad, torso straight in line with his legs, hands crossed on chest. Draw the bench."),
  # shoulders
  ("hero_overhead_press_down", FRONT, "Standing overhead press start: holding a barbell at his upper chest, elbows forward. Draw the loaded barbell."),
  ("hero_overhead_press_up", FRONT, "Standing overhead press top: barbell pressed straight overhead, arms locked. Draw the loaded barbell."),
  ("hero_lateral_raise_up", FRONT, "Lateral raise top: standing, both arms raised straight out to the sides at shoulder height, dumbbells in hands."),
  ("hero_front_raise", SIDE, "Front raise: standing, both arms raised straight forward to shoulder height holding dumbbells."),
  ("hero_dumbbell_shrug", FRONT, "Dumbbell shrug: standing, dumbbells in hands, shoulders pulled up toward his ears."),
  ("hero_pike_wall_hspu", SIDE, "Wall handstand push-up bottom: upside down, feet against an invisible wall, elbows bent, head just above the floor."),
  # arms
  ("hero_bench_dip_up", SIDE, "Bench dip top: hands on the edge of a bench behind him, arms straight, legs straight forward, heels on the floor. Draw the bench."),
  ("hero_bench_dip_down", SIDE, "Bench dip bottom: hands on the edge of a bench behind him, elbows bent 90 degrees, hips lowered, heels on the floor. Draw the bench."),
  ("hero_tricep_ext_down", SIDE, "Overhead tricep extension bottom: standing, holding one dumbbell with both hands behind his head, elbows pointing up."),
  ("hero_tricep_ext_up", SIDE, "Overhead tricep extension top: standing, one dumbbell held with both hands straight overhead, arms locked."),
  ("hero_tricep_kickback", SIDE, "Tricep kickback: torso bent forward, upper arm against his side, forearm extended straight back holding a dumbbell."),
  # legs
  ("hero_barbell_squat_top", SIDE, "Barbell back squat start: standing tall, loaded barbell resting on his upper back, hands gripping it."),
  ("hero_barbell_squat_bottom", SIDE, "Barbell back squat bottom: deep squat, thighs parallel to the floor, chest up, loaded barbell on his upper back."),
  ("hero_goblet_squat", SIDE, "Goblet squat bottom: deep squat holding one dumbbell vertically at his chest with both hands, chest up."),
  ("hero_sumo_squat", FRONT, "Sumo squat bottom: feet very wide, toes out, deep squat, hands clasped in front of his chest."),
  ("hero_jump_squat", FRONT, "Jump squat: exploding up into the air from a squat, feet off the ground, arms swinging down."),
  ("hero_bulgarian_split", SIDE, "Bulgarian split squat bottom: back foot resting on a bench behind him, front knee bent 90 degrees, torso upright. Draw the bench."),
  ("hero_pistol_squat", SIDE, "Pistol squat: deep one-leg squat on his left leg, right leg held straight forward off the floor, arms forward."),
  ("hero_side_lunge", FRONT, "Side lunge: one leg bent deeply out to the side, the other leg straight, hands clasped at his chest."),
  ("hero_jump_lunge", SIDE, "Jump lunge: in the air switching legs, one leg forward and one back, arms pumping."),
  ("hero_step_up", SIDE, "Step-up: one foot on a box, stepping up, other leg lifting with the knee bent. Draw the box."),
  ("hero_box_jump", SIDE, "Box jump: landing softly in a half squat on top of a box, arms forward. Draw the box."),
  ("hero_wall_sit", SIDE, "Wall sit: back flat against an invisible wall, knees bent 90 degrees as if sitting on a chair, arms crossed."),
  ("hero_calf_raise_up", SIDE, "Calf raise top: standing tall up on his toes, heels high, hands on hips."),
  ("hero_romanian_deadlift", SIDE, "Romanian deadlift bottom: legs almost straight, hips pushed far back, flat back, holding a loaded barbell at mid-shin."),
  ("hero_hip_thrust_up", SIDE, "Barbell hip thrust top: upper back on a bench, feet flat, hips raised level, loaded barbell across his hips. Draw the bench and barbell."),
  # core
  ("hero_bicycle_crunch_a", SIDE, "Bicycle crunch: lying on his back, hands behind his head, right elbow twisting toward the raised left knee, right leg extended."),
  ("hero_bicycle_crunch_b", SIDE, "Bicycle crunch: lying on his back, hands behind his head, left elbow twisting toward the raised right knee, left leg extended."),
  ("hero_russian_twist_a", FRONT, "Russian twist: sitting leaning back, feet off the floor, hands together twisted to his left side."),
  ("hero_russian_twist_b", FRONT, "Russian twist: sitting leaning back, feet off the floor, hands together twisted to his right side."),
  ("hero_v_up", SIDE, "V-up: balancing on his hips, straight legs and straight arms raised to meet in a V shape."),
  ("hero_hollow_hold", SIDE, "Hollow body hold: lying on his back, lower back pressed down, shoulders and straight legs lifted just off the floor, arms overhead."),
  ("hero_dead_bug", SIDE, "Dead bug: lying on his back, one arm reaching overhead and the opposite leg extended low, other arm and leg pointing up."),
  ("hero_bird_dog", SIDE, "Bird dog: on hands and knees, right arm extended forward and left leg extended back, back flat."),
  ("hero_plank_shoulder_tap", FRONT, "Plank shoulder tap: high plank, one hand lifted touching the opposite shoulder, hips level."),
  ("hero_hanging_leg_raise_down", SIDE, "Hanging leg raise start: hanging from a horizontal bar, arms straight, legs straight down. Draw the bar."),
  ("hero_hanging_leg_raise_up", SIDE, "Hanging leg raise top: hanging from a horizontal bar, straight legs raised to horizontal. Draw the bar."),
  ("hero_ab_wheel_out", SIDE, "Ab wheel rollout extended: knees on the floor, arms stretched far forward holding an ab wheel, body long and low. Draw the ab wheel."),
  ("hero_flutter_kicks", SIDE, "Flutter kicks: lying on his back, hands under hips, straight legs slightly off the floor, one leg higher than the other."),
  ("hero_l_sit", SIDE, "L-sit: hands on the floor beside his hips, arms straight, body lifted, straight legs held horizontal in front."),
  ("hero_dragon_flag", SIDE, "Dragon flag: lying on a bench gripping it behind his head, whole body straight and raised at an angle, only shoulders on the bench. Draw the bench."),
  # cardio / full body
  ("hero_jumping_jack_open", FRONT, "Jumping jack open: in the air, legs spread wide, arms raised overhead in a V."),
  ("hero_high_knees", SIDE, "High knees: running in place, right knee raised to hip height, arms pumping."),
  ("hero_burpee_squat", SIDE, "Burpee squat phase: crouched in a deep squat with both hands on the floor in front of his feet."),
  ("hero_skipping_rope", FRONT, "Skipping rope: small jump, feet off the ground, rope passing under his feet, wrists turning. Draw the rope."),
  ("hero_bear_crawl", SIDE, "Bear crawl: on hands and feet, knees hovering just above the floor, back flat, one hand moving forward."),
  ("hero_inchworm", SIDE, "Inchworm: legs straight, bent forward at the hips, hands walking forward on the floor."),
  ("hero_kettlebell_swing_down", SIDE, "Kettlebell swing bottom: hips hinged back, kettlebell swung back between his legs, flat back. Draw the kettlebell."),
  ("hero_kettlebell_swing_up", SIDE, "Kettlebell swing top: standing tall, hips locked, arms straight holding the kettlebell at chest height. Draw the kettlebell."),
  ("hero_battle_ropes", SIDE, "Battle ropes: half squat, holding two thick ropes and whipping them in waves. Draw the ropes."),
  ("hero_farmer_carry", SIDE, "Farmer's carry: walking tall holding a heavy dumbbell in each hand at his sides."),
  ("hero_sprint_start", SIDE, "Sprint start position: crouched with fingertips on the floor, one knee down, ready to explode forward."),
  ("hero_boxing_guard", THREEQ, "Boxing guard stance: fists up protecting his face, knees slightly bent, focused."),
  ("hero_boxing_punch", SIDE, "Throwing a straight punch with his right fist, left fist guarding his face."),
  # calisthenics skills
  ("hero_muscle_up", SIDE, "Muscle-up transition: on a horizontal bar, chest rising over the bar, elbows bending into the dip position. Draw the bar."),
  ("hero_front_lever", SIDE, "Front lever: hanging from a bar with straight arms, whole body held straight and horizontal, face up. Draw the bar."),
  ("hero_back_lever", SIDE, "Back lever: hanging from a bar with straight arms behind him, body held straight and horizontal, face down. Draw the bar."),
  ("hero_tuck_planche", SIDE, "Tuck planche: balancing on straight arms with hands on the floor, knees tucked to his chest, feet off the floor."),
  ("hero_human_flag", FRONT, "Human flag: gripping a vertical pole with both hands, body held straight and horizontal out to the side. Draw the pole."),
  ("hero_crow_pose", SIDE, "Crow pose: squatting forward balancing on his hands, knees resting on the backs of his upper arms, feet off the floor."),
  # mobility / stretching
  ("hero_quad_stretch", SIDE, "Standing quad stretch: holding his right foot behind him against his glute, standing on the left leg."),
  ("hero_shoulder_stretch", FRONT, "Cross-body shoulder stretch: right arm pulled straight across his chest by the left arm."),
  ("hero_cobra_stretch", SIDE, "Cobra stretch: lying face down, hips on the floor, arms straight pushing his chest up, looking up."),
  ("hero_childs_pose", SIDE, "Child's pose: kneeling, sitting back on his heels, torso folded forward, arms stretched forward on the floor."),
  ("hero_hip_flexor_stretch", SIDE, "Kneeling hip flexor stretch: one knee on the floor, other foot forward, hips pushed forward, torso upright."),
  ("hero_butterfly_stretch", FRONT, "Butterfly stretch: sitting on the floor, soles of the feet together, knees out to the sides, hands holding his feet."),
  ("hero_deep_squat_hold", FRONT, "Deep squat hold: relaxed deep squat, heels down, elbows pushing knees out, palms together."),
  ("hero_arm_circles", FRONT, "Warm-up arm circles: standing, both arms straight out to the sides, small motion lines around his hands."),
  ("hero_foam_rolling", SIDE, "Foam rolling: lying with the back of his thighs on a foam roller, hands on the floor behind him. Draw the foam roller."),
  ("hero_meditating", FRONT, "Meditating: sitting cross-legged, hands resting on his knees, eyes closed, calm."),
]

creative = [
  # ideas and thinking
  ("hero_idea_bulb", FRONT, "Sudden idea: index finger raised, eyes wide and excited, a glowing cartoon light bulb above his head."),
  ("hero_confused_scratch", FRONT, "Confused: scratching the back of his head, one eyebrow raised, three cartoon question marks above his head."),
  ("hero_mind_blown", FRONT, "Mind blown: both hands on his temples, eyes huge, cartoon explosion puff above his head."),
  ("hero_counting_fingers", FRONT, "Counting on his fingers while thinking, looking up."),
  ("hero_detective", THREEQ, "Detective: leaning forward, looking closely through a magnifying glass, one eye big through the lens."),
  ("hero_shrug", FRONT, "Shrug: both palms up, shoulders raised, eyebrows up, 'I don't know' expression."),
  ("hero_side_eye", FRONT, "Suspicious side-eye: arms crossed, eyes looking sideways, one eyebrow raised."),
  ("hero_smirk", FRONT, "Smug smirk: one corner of the mouth up, chin raised, hands on hips."),
  # presenting / teaching (great places for the tool to put text)
  ("hero_present_left", FRONT, "Presenting: both open palms gesturing to his left side as if showing something there, smiling."),
  ("hero_present_right", FRONT, "Presenting: both open palms gesturing to his right side as if showing something there, smiling."),
  ("hero_point_left", FRONT, "Pointing to his left with his right arm extended, looking that way."),
  ("hero_point_right", FRONT, "Pointing to his right with his left arm extended, looking that way."),
  ("hero_point_down", FRONT, "Pointing down at the ground in front of him with his right index finger, looking at the viewer."),
  ("hero_blank_sign", FRONT, "Holding a big blank white rectangular sign board in front of his chest with both hands, the board completely empty."),
  ("hero_clipboard", FRONT, "Holding a clipboard and a pen like a coach, looking at the clipboard (blank paper)."),
  ("hero_teacher_pointer", THREEQ, "Teacher: holding a long pointer stick, pointing it to his right, explaining."),
  ("hero_whisper", THREEQ, "Whispering a secret: leaning toward the viewer, hand cupped next to his mouth, eyes sideways."),
  ("hero_shush", FRONT, "Shushing: index finger on his lips, eyes narrowed playfully."),
  ("hero_this_big", FRONT, "Showing 'this big': both arms spread wide apart, palms facing each other, amazed face."),
  ("hero_this_small", FRONT, "Showing 'this small': thumb and index finger almost touching held up near his face, squinting."),
  ("hero_stop_palm", FRONT, "Stop gesture: right palm pushed toward the viewer, stern face."),
  ("hero_come_on", FRONT, "Beckoning the viewer with his right hand, 'come on' gesture, confident grin."),
  ("hero_check_watch", FRONT, "Looking at the watch on his left wrist, impatient."),
  # greetings and celebration
  ("hero_namaste", FRONT, "Namaste greeting: palms pressed together at his chest, slight bow, warm smile."),
  ("hero_wave_hello", FRONT, "Waving hello with his right hand, friendly smile."),
  ("hero_salute", FRONT, "Military salute, standing straight, serious."),
  ("hero_clapping", FRONT, "Clapping his hands, happy, proud of the viewer."),
  ("hero_victory", FRONT, "Victory: both fists raised high above his head, shouting with joy."),
  ("hero_celebrate_jump", FRONT, "Jumping in celebration, one fist punching the air, feet off the ground."),
  ("hero_heart_hands", FRONT, "Making a heart shape with both hands in front of his chest, smiling."),
  ("hero_ok_sign", FRONT, "OK sign with his right hand, winking."),
  ("hero_peace_sign", FRONT, "Peace sign with his right hand near his face, grinning."),
  ("hero_fingers_crossed", FRONT, "Fingers crossed on both hands, hopeful face."),
  ("hero_superhero", FRONT, "Superhero pose: fists on hips, chest out, chin up, a cape blowing in the wind behind him."),
  ("hero_flying", SIDE, "Flying like a superhero: horizontal in the air, right fist forward, body straight, cape flowing."),
  ("hero_trophy", FRONT, "Holding a golden trophy above his head, proud."),
  ("hero_medal", FRONT, "Showing a gold medal hanging around his neck, biting it playfully."),
  ("hero_selfie", THREEQ, "Taking a gym selfie with a phone held up in his right hand, flexing his left biceps."),
  ("hero_self_hug", FRONT, "Hugging himself, eyes closed, proud and content."),
  # struggle, pain, fatigue (comedy)
  ("hero_dead_starfish", "Top-down view, lying flat on the floor.", "Lying flat on his back like a starfish, completely exhausted, tongue out, eyes spiraling."),
  ("hero_leg_day_zombie", FRONT, "Walking stiffly like a zombie after leg day, legs trembling, pained face."),
  ("hero_sitting_exhausted", FRONT, "Sitting on the floor exhausted, legs stretched out, arms hanging, head back, sweating."),
  ("hero_yawning", FRONT, "Big yawn, stretching his arms up, sleepy eyes."),
  ("hero_sore_back", SIDE, "Holding his lower back in pain, hunched, wincing."),
  ("hero_sore_knee", FRONT, "Holding his right knee in pain, standing on one leg, wincing."),
  ("hero_nervous_sweat", FRONT, "Nervous: forced smile, a single big sweat drop on his forehead, hands fidgeting."),
  ("hero_scared_peek", FRONT, "Scared: hiding his face behind his hands, peeking through his fingers."),
  ("hero_despair_kneel", FRONT, "Dramatic despair: kneeling, fists on the floor, head down."),
  ("hero_lifting_giant", FRONT, "Comedy: lifting a giant cartoon dumbbell much bigger than himself overhead, veins popping, red face."),
  ("hero_angry_alarm", FRONT, "Angry and sleepy, holding a ringing red alarm clock at arm's length, shouting at it."),
  # food and lifestyle
  ("hero_disgusted_burger", FRONT, "Disgusted: pushing away a greasy burger held in front of him, tongue out."),
  ("hero_tempted_pizza", FRONT, "Tempted: staring hungrily at a slice of pizza in his hand, drooling."),
  ("hero_cooking", THREEQ, "Cooking a healthy meal: holding a frying pan with vegetables and chicken, chef-like and focused."),
  ("hero_grocery_bag", FRONT, "Holding a paper grocery bag full of vegetables and fruit, smiling."),
  ("hero_measuring_waist", FRONT, "Measuring his waist with a measuring tape, looking down."),
  ("hero_on_scale_shocked", FRONT, "Standing on a bathroom weighing scale looking down at it, shocked."),
  ("hero_laptop", THREEQ, "Sitting and typing on a laptop on his lap, focused (no chair)."),
  ("hero_bad_posture_desk", SIDE, "Bad posture: sitting hunched forward, rounded back, head pushed forward, looking at a phone (no chair)."),
  ("hero_good_posture_desk", SIDE, "Good posture: sitting tall with a straight back and relaxed shoulders (no chair)."),
  ("hero_phone_in_bed", SIDE, "Lying on his side at night, face lit by the phone he is staring at, tired eyes."),
  ("hero_reading", FRONT, "Reading an open book, eyebrows raised, interested."),
  ("hero_writing_notes", FRONT, "Writing in a small notebook with a pen, focused."),
]

faces = [
  ("face_neutral", "Neutral stern face, looking at the viewer."),
  ("face_smile", "Big friendly smile."),
  ("face_laugh", "Laughing hard, eyes closed."),
  ("face_angry", "Angry, frowning, teeth clenched."),
  ("face_shocked", "Shocked, eyes wide, mouth open."),
  ("face_sad", "Sad, eyebrows down, small tear."),
  ("face_smug", "Smug smirk, one eyebrow raised."),
  ("face_determined", "Determined, intense eyes, jaw tight."),
  ("face_confused", "Confused, one eyebrow raised, mouth twisted."),
  ("face_disgusted", "Disgusted, nose wrinkled, tongue out."),
  ("face_tired", "Exhausted, half-closed eyes, sweating."),
  ("face_wink", "Winking with a grin."),
]

# Left out because set 1 already has an image that looks the same (reuse that one):
#   hero_point_up -> hero_count_1
#   hero_big_gulp_water -> hero_drinking_shake
#   hero_chinup_top -> hero_pullup_top
#   hero_hammer_curl -> hero_curl_up
#   hero_reverse_lunge -> hero_lunge
#   hero_calf_raise_down -> hero_side_view
#   hero_jumping_jack_closed -> hero_stand
#   hero_lateral_raise_down -> hero_curl_down
#   hero_burpee_plank -> hero_pushup_top

lines, ids = [], []
for i, view, pose in exercises + creative:
    ids.append(i); lines.append(char_prompt(pose, view))
for i, expr in faces:
    ids.append(f"hero_{i}"); lines.append(f"Head-and-shoulders close-up. EXPRESSION: {expr} Head turned and tilted naturally, not a straight passport photo. {IDENTITY} {FACE_END}")

start = len(SET1) + len(PROPS1) + 1
existing = {i for i, *_ in SET1} | {i for i, _ in PROPS1} | {"hero_stand"}
dupes = [i for i in ids if i in existing] + [i for i in set(ids) if ids.count(i) > 1]
assert not dupes, dupes
if __name__ == "__main__":
    open("prompts/hero-image-prompts-2.txt", "w").write("\n###\n".join(lines) + "\n")
    open("prompts/hero-image-ids-2.txt", "w").write("\n".join(f"{start + n:03d} {i}" for n, i in enumerate(ids)) + "\n")
    print(len(lines), "prompts:", len(exercises), "exercises,", len(creative), "creative,", len(faces), "faces; numbered", start, "to", start + len(lines) - 1)
