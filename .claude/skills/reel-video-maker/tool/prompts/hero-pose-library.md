# H: image library and generation prompts

These are all the images to make for the main character **H**, so that any fitness reel can be built
from the same library. Every image gets an id (the file name). The tool and the timeline prompt
refer to images only by id, so keep the names exactly as listed.

Start with **Phase 1** (25 images). That is enough for real videos. Add the other phases later.

---

## 1. Rules that make the images work in the tool

1. **Always attach the original H image as the reference** and paste the master prompt below.
   Generate every image this way. Never generate from text alone, or H will look different every time.
2. **Plain pure white background, nothing else.** No floor, no shadow, no text, no logo, no frame.
   The tool removes the white and adds its own shadow.
3. **Whole body in frame**, with a small margin all around. Nothing cut off at the edges.
4. **Exercises are always side view, facing RIGHT** (head on the right side of the image). The camera stays
   at the same height and distance for every exercise.
5. **Movement pairs (`_top` / `_bottom`, `_start` / `_end`): make the second image by editing the first one**
   ("same image, same position on the canvas, only change …"). Hands and feet that stay on the floor must
   stay in exactly the same place, otherwise the crossfade between the two images jumps.
6. Size: at least 1024 px on the long side. Save as PNG (JPG or WebP also work).
7. Name each file exactly as its id, e.g. `hero_pushup_top.png`.

## 2. Master prompt (paste every time, then the pose line)

```
Use the attached character as the exact reference. Keep EVERYTHING identical:
same bald, very muscular man, same face and stern expression, white letter "H" on the
forehead, same tan skin and muscle detail, same black shorts with olive military belt,
pouches and silver buckle, black wristbands, black-and-olive training shoes.
Same comic / cel-shaded illustration style with bold dark outlines and the same lighting.
Plain pure white background. No floor, no ground shadow, no text, no other objects
unless listed below. Whole body visible with a small margin around it.

POSE: <paste the pose line here>
VIEW: <front view | side view facing right | back view | three-quarter view>
```

For a **pair**, make the first image, then edit it with:

```
Edit this image. Keep the character, style, size and position on the canvas exactly the
same. Hands and feet that touch the floor stay in exactly the same place.
Only change: <the change from the pose line>
```

For a **prop**, don't attach H. Use this prompt instead:

```
A single <object>, comic / cel-shaded illustration style with bold dark outlines, matching
a muscular fitness cartoon character. Plain pure white background, no shadow, no text,
object centered with a small margin.
```

---

## 3. Phase 1: the 25 images to make first

### Talking and reaction poses (front view)

These are used for the hook, explanations and the ending.

| id | POSE |
|---|---|
| `hero_stand` | (already done) standing straight, arms down, fists clenched |
| `hero_point_viewer` | pointing his index finger straight at the viewer, confident look |
| `hero_arms_crossed` | arms crossed over the chest, serious, slightly smug |
| `hero_thumbs_up` | big thumbs up with the right hand, small confident smile |
| `hero_thinking` | one hand on his chin, looking up and to the side, thinking |
| `hero_explain` | one hand open, palm up, as if explaining something; the other hand relaxed |
| `hero_shocked` | eyes wide, mouth open, both hands raised near his face, shocked |
| `hero_facepalm` | one palm covering his face, disappointed |
| `hero_double_biceps` | classic double-biceps flex, arms raised, proud |
| `hero_tired_sweating` | bent forward, hands on knees, breathing hard, big sweat drops |

### Exercise pairs (side view, facing right)

The two images of a pair crossfade into each other, so make the second by editing the first.

| id | POSE |
|---|---|
| `hero_pushup_top` | push-up top position: arms straight, body in one straight line from head to heels |
| `hero_pushup_bottom` | *edit:* elbows bent, chest just above the floor, body still straight |
| `hero_pike_top` | pike push-up top: hands and feet on the floor, hips pushed high, body an upside-down V, arms straight |
| `hero_pike_bottom` | *edit:* elbows bent, head lowered toward the floor just in front of the hands, hips stay high |
| `hero_squat_top` | bodyweight squat start: standing tall, arms stretched forward at shoulder height |
| `hero_squat_bottom` | *edit:* deep squat, thighs parallel to the floor, back straight, arms forward |
| `hero_plank` | forearm plank: forearms and toes on the floor, body perfectly straight |
| `hero_pullup_hang` | dead hang from a pull-up bar, arms straight (draw the bar too, horizontal, above his hands) |
| `hero_pullup_top` | *edit:* chin above the bar, elbows bent and pulled down to his sides |
| `hero_crunch_start` | lying on his back, knees bent, feet flat, hands behind his head |
| `hero_crunch_end` | *edit:* shoulders lifted off the floor in a crunch, abs tight |
| `hero_lunge` | forward lunge: front knee bent at 90°, back knee just above the floor, torso upright |

### Props (no character)

| id | object |
|---|---|
| `prop_dumbbell` | one black dumbbell, side view |
| `prop_protein_food` | a plate with grilled chicken, eggs and rice |
| `prop_water_bottle` | a large gym water bottle |

---

## 4. Phase 2: more exercises (side view, facing right)

| id | POSE |
|---|---|
| `hero_pushup_wrong_hips` | push-up with hips sagging toward the floor (a WRONG-form example) |
| `hero_pike_wrong` | pike push-up with hips too low, more like a push-up (WRONG form) |
| `hero_squat_wrong` | squat with knees caving inward and back rounded (WRONG form; front view) |
| `hero_dip_top` | on parallel bars, arms straight, body upright (draw the bars) |
| `hero_dip_bottom` | *edit:* elbows bent 90°, shoulders lowered |
| `hero_row_start` | inverted row under a low bar, arms straight, body straight (draw the bar) |
| `hero_row_end` | *edit:* chest pulled up to the bar |
| `hero_side_plank` | side plank on one forearm, body straight, top hand on hip (front-facing side plank) |
| `hero_leg_raise_down` | lying on his back, legs straight just above the floor, hands under his hips |
| `hero_leg_raise_up` | *edit:* straight legs raised to vertical |
| `hero_mountain_a` | high plank, right knee pulled toward the chest |
| `hero_mountain_b` | *edit:* left knee pulled toward the chest, right leg back |
| `hero_glute_bridge_down` | lying on his back, knees bent, hips on the floor |
| `hero_glute_bridge_up` | *edit:* hips raised so knees, hips and shoulders are in one line |
| `hero_handstand` | wall-free handstand, body straight and vertical |
| `hero_burpee_jump` | jumping straight up with arms overhead (front view) |
| `hero_curl_down` | standing, dumbbell in each hand, arms straight (front view) |
| `hero_curl_up` | *edit:* both dumbbells curled up to the shoulders |
| `hero_deadlift_start` | barbell deadlift start: hips back, flat back, gripping the bar on the floor |
| `hero_deadlift_end` | *edit:* standing tall holding the barbell at the hips |
| `hero_stretch_hamstring` | standing, bending forward touching his toes, legs straight |

## 5. Phase 3: lifestyle and story poses (front or three-quarter view)

| id | POSE |
|---|---|
| `hero_eating` | eating a chicken leg, happy |
| `hero_drinking_shake` | drinking from a protein shaker bottle |
| `hero_sleeping` | lying asleep on his side, peaceful (no bed; the tool can add one) |
| `hero_phone_scroll` | looking down at a phone in his hands, bored |
| `hero_running` | running fast, side view facing right, mid-stride |
| `hero_walking` | walking calmly, side view facing right |
| `hero_lazy_couch` | slumped sitting, lazy, holding a burger (no couch) |
| `hero_angry_shout` | shouting angrily with fists clenched, like a drill instructor |
| `hero_laughing` | laughing hard, head tilted back |
| `hero_sad_crying` | exaggerated cartoon crying, tears streaming |
| `hero_count_1` | showing 1 finger toward the viewer |
| `hero_count_2` | showing 2 fingers |
| `hero_count_3` | showing 3 fingers |
| `hero_count_4` | showing 4 fingers |
| `hero_count_5` | showing an open hand, 5 fingers |
| `hero_back_view` | standing, seen from behind, back muscles visible |
| `hero_side_view` | standing relaxed, side view facing right |
| `hero_side_chest` | bodybuilding side-chest pose |
| `hero_beginner` | **same face and outfit, but a skinny untrained body**, standing shyly (for before/after stories) |

## 6. Phase 3: extra props

`prop_barbell`, `prop_pullup_bar`, `prop_kettlebell`, `prop_resistance_band`, `prop_yoga_mat`,
`prop_burger`, `prop_pizza`, `prop_eggs`, `prop_shaker`, `prop_alarm_clock`, `prop_bed`,
`prop_phone`, `prop_weighing_scale`, `prop_calendar`, `prop_stopwatch`, `prop_fire`,
`prop_sweat_drops`, `prop_red_x`, `prop_green_check`.

Arrows, glows, circles, measure lines, captions and titles are made by the tool. Don't generate those.

---

## 7. When the images are ready

Put them in one folder, named by id, and send them over. Then I will:

1. cut out the background of every image automatically, and check that pairs line up
2. make the close-up crops and glow masks (arms, legs, abs, chest) for the main poses
3. add every image to `public/library/hero/library.json` with a description, so Claude can pick the right one
4. render a sample video that uses the new poses
