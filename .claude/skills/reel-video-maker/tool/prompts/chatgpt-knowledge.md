> **Outdated (old effortless style).** The approved look and the current rules are in `prompts/generate-timeline.md` and the Claude skill `skills/reel-json-writer/`. Do not copy the style of this file.

# Reel editor guide (knowledge file)

This file teaches you to write the JSON video plan for the Reel Engine tool the way an experienced editor does.
The request message from the tool always contains the current rules, image library and script. If anything
here disagrees with the request, the request wins.

## 1. How the tool reads your JSON

- **Times.** The tool knows the exact moment every script word is spoken. A time like `"lift your legs"` is looked up
  in the script. It fails if the words are not there in exactly that order, or if they appear more than once
  without `#2`/`#3`. `"phrase|end"` = when the phrase finishes. `"phrase+0.3"` / `"phrase-0.1"` = offset in seconds.
- **Body parts.** `"anchor": "hips"` puts a ring/arrow/zoom on H's hips in whichever pose is showing, even while it moves or
  zooms. Parts: head, face, neck, shoulders, shoulder_blades, upper_back, chest, back, abs, hips, glutes, arms, elbows, forearms, hands, thighs, legs,
  knees, calves, feet, body. Plural parts get one ring per side. `left_`/`right_` = one side of the screen.
- **Overlays attach upward.** A highlight/arrow/measure/zoomBubble attaches to the nearest image or poses layer ABOVE
  it in the same scene. So write layers in this order: text title → character (image/poses) → overlays → props.
- **Scene length.** A scene lasts until the next scene starts. Layers without `at`/`until` cover the whole scene.
- **Pose alignment.** In a `poses` layer the tool scales every frame to the same body size and keeps the feet in place,
  so alternating frames looks like real movement.

## 2. Errors the tool reports and how to fix them

| Tool error | Cause | Fix |
|---|---|---|
| `"X" is not in the script` | The phrase is not in the script exactly (a word changed, skipped or added, digits vs words) | Copy the words again from the script, character by character |
| `"X" is spoken 3 times` | The phrase is not unique | Add a neighbouring word ("up" → "push back up") or use `"X#2"` |
| `until must be after at` | The `until` phrase comes before the `at` phrase, or one of them failed to resolve | Fix the phrase errors first, then check the order of the two phrases in the script |
| `end (0) must be after start (0)` | Follows from a broken scene `start` phrase | Fixing the phrase errors fixes this |
| `unknown asset` | The id is not in the library | Use only ids listed in the request |
| `unknown body part` | The anchor is not in the list above | Use a listed body part |
| `unknown sound "sfx_x"` | The sound id is not in the Sound effects list | Use only sound ids listed in the request |

When the user pastes errors, fix ALL of them and return the complete JSON.

## 3. Editorial recipe (what makes these reels good)

1. **Hook, 3–6 s.** Change the reaction pose on each key phrase (stop palm / shrug / what / count / idea bulb / thumbs up),
   `"enter": "punch"`, one shake on the strongest word, a faint `pattern` of a related prop behind.
2. **Exercise scenes.** Title "#N NAME". Start with a quick rep the moment the exercise is named. During the explanation,
   alternate the movement frames on the words that describe the movement. Ring the body part the voice names. Add a
   movement arrow (`pointing`) when it says up/down/back/toward.
3. **Details.** "Squeeze" / "tight" / "feel it" → red ring + zoomBubble or a camera punch to that part.
   "Straight line" / "head to heels" → measure. Time → stopwatch prop.
4. **Ending.** Flash transition, a 2x2 split of the moves popping on the words ("do all three…"), then a call-to-action pose
   ("save" → salute, "follow" → wave). A before/after joke works well: hero_beginner → hero_double_biceps.
5. **Rhythm.** Something changes every 1.5–3 s.
6. **Sound design (how the channel's videos sound).** A soft background track plays under the whole video (the tool adds
   it: never set `audio`). On top of it:
   - a whoosh on every scene change (vary the whoosh ids);
   - a pop or click every time a title, arrow, ring, prop or recap cell appears (titles "#1/#2/#3" can use `sfx_desk_bell`);
   - a sound that matches the meaning on key words: secret → `sfx_sparkle`/`sfx_shush`, right way → `sfx_ding`/`sfx_chime`,
     wrong/stop → `sfx_hammer`/`sfx_bruh`, pain → `sfx_bone_crack`/`sfx_ouch`, stretch → `sfx_stretch`,
     squeeze/burn → `sfx_electric`/`sfx_crush`, numbers/reps → `sfx_counter`, time skip → `sfx_few_moments_later`,
     big result → `sfx_magic`/`sfx_wow`;
   - ONE joke sound on the funniest line (e.g. "your arms look like twigs" → `sfx_crying_laugh` or `sfx_bruh`);
   - a reward sound on the call to action (`sfx_gold_bell`, `sfx_coin`, `sfx_level_start`).
   Meme voice clips speak over the voiceover: max 2 per video, on a pause (`"phrase|end"`). About one sound every
   1.5–2.5 s (12–20 in 30 s), never two within 0.5 s, never the same sound twice in a row. No `volume` field.

## 4. Worked example 1: "Bigger shoulders" (32 s)

Script:

Want bigger shoulders without lifting a single weight? Try these three moves at home.
Number one, pike push ups. Hips up high, like an upside down V. Lower your head toward the floor, then push back up.
Number two, dips. Grab two sturdy chairs, keep your chest up, and lower until your elbows bend to ninety degrees.
Number three, the handstand hold. Kick up against a wall and hold for twenty seconds. This builds strength and balance.
Do three rounds, three times a week. Save this video, and follow for more.

JSON:

```json
{
 "title": "Bigger shoulders, no weights",
 "captions": {
  "mode": "word",
  "keywords": [
   "shoulders",
   "weight",
   "three",
   "home",
   "save",
   "follow"
  ],
  "bottom": [
   [
    "Number one",
    "Do three rounds"
   ]
  ]
 },
 "scenes": [
  {
   "id": "hook",
   "start": "start",
   "shakes": [
    {
     "at": "single weight"
    }
   ],
   "layers": [
    {
     "type": "pattern",
     "asset": "prop_dumbbell",
     "opacity": 0.1
    },
    {
     "type": "image",
     "asset": "hero_point_viewer",
     "until": "without lifting",
     "enter": "punch"
    },
    {
     "type": "highlight",
     "anchor": "shoulders",
     "at": "bigger shoulders",
     "until": "without lifting",
     "color": "#FF4D3D"
    },
    {
     "type": "image",
     "asset": "hero_what",
     "at": "without lifting",
     "until": "three moves",
     "enter": "punch"
    },
    {
     "type": "image",
     "asset": "hero_count_3",
     "at": "three moves",
     "until": "at home",
     "enter": "punch"
    },
    {
     "type": "image",
     "asset": "hero_thumbs_up",
     "at": "at home",
     "enter": "pop",
     "motion": {
      "type": "zoomIn"
     }
    }
   ]
  },
  {
   "id": "pike",
   "start": "Number one-0.1",
   "transition": "slideLeft",
   "layers": [
    {
     "type": "text",
     "text": "#1 PIKE PUSH UPS"
    },
    {
     "type": "poses",
     "crossfade": 0.5,
     "shadow": true,
     "frames": [
      {
       "asset": "hero_pike_top",
       "at": "Number one"
      },
      {
       "asset": "hero_pike_bottom",
       "at": "push ups"
      },
      {
       "asset": "hero_pike_top",
       "at": "Hips up high"
      },
      {
       "asset": "hero_pike_bottom",
       "at": "Lower your head"
      },
      {
       "asset": "hero_pike_top",
       "at": "push back up"
      }
     ]
    },
    {
     "type": "highlight",
     "anchor": "hips",
     "at": "Hips up high",
     "until": "Lower your head"
    },
    {
     "type": "arrow",
     "anchor": "hips",
     "pointing": "up",
     "at": "Hips up high",
     "until": "Lower your head",
     "color": "#3DDC84"
    },
    {
     "type": "arrow",
     "anchor": "head",
     "pointing": "down",
     "at": "Lower your head",
     "until": "push back up",
     "color": "#3DDC84"
    },
    {
     "type": "highlight",
     "anchor": "shoulders",
     "at": "push back up",
     "color": "#FF4D3D"
    },
    {
     "type": "arrow",
     "anchor": "shoulders",
     "pointing": "up",
     "at": "push back up",
     "color": "#3DDC84"
    }
   ]
  },
  {
   "id": "dips",
   "start": "Number two-0.1",
   "transition": "slideLeft",
   "layers": [
    {
     "type": "text",
     "text": "#2 DIPS"
    },
    {
     "type": "poses",
     "crossfade": 0.5,
     "shadow": true,
     "frames": [
      {
       "asset": "hero_dip_top",
       "at": "Number two"
      },
      {
       "asset": "hero_dip_bottom",
       "at": "dips"
      },
      {
       "asset": "hero_dip_top",
       "at": "Grab two"
      },
      {
       "asset": "hero_dip_bottom",
       "at": "lower until"
      },
      {
       "asset": "hero_dip_top",
       "at": "degrees|end"
      }
     ]
    },
    {
     "type": "highlight",
     "anchor": "chest",
     "at": "keep your chest up",
     "until": "lower until"
    },
    {
     "type": "arrow",
     "anchor": "shoulders",
     "pointing": "down",
     "at": "lower until",
     "until": "elbows bend",
     "color": "#3DDC84"
    },
    {
     "type": "highlight",
     "anchor": "elbows",
     "at": "elbows bend",
     "color": "#FF4D3D"
    },
    {
     "type": "measure",
     "from": "elbows",
     "to": "hands",
     "label": "90°",
     "at": "degrees"
    }
   ]
  },
  {
   "id": "handstand",
   "start": "Number three-0.1",
   "transition": "slideLeft",
   "layers": [
    {
     "type": "text",
     "text": "#3 HANDSTAND HOLD"
    },
    {
     "type": "poses",
     "crossfade": 0.4,
     "shadow": true,
     "frames": [
      {
       "asset": "hero_handstand_v2",
       "at": "Number three"
      },
      {
       "asset": "hero_handstand",
       "at": "Kick up"
      }
     ]
    },
    {
     "type": "arrow",
     "anchor": "feet",
     "pointing": "up",
     "at": "Kick up",
     "until": "seconds",
     "color": "#3DDC84"
    },
    {
     "type": "highlight",
     "anchor": "shoulders",
     "at": "builds strength",
     "until": "balance",
     "color": "#FF4D3D"
    },
    {
     "type": "highlight",
     "anchor": "hands",
     "at": "balance"
    },
    {
     "type": "image",
     "asset": "prop_stopwatch",
     "x": 0.78,
     "y": 0.36,
     "width": 0.26,
     "at": "seconds-0.4",
     "until": "builds strength",
     "enter": "pop",
     "motion": {
      "type": "pulse"
     }
    }
   ]
  },
  {
   "id": "outro",
   "start": "Do three rounds-0.1",
   "transition": "flash",
   "layers": [
    {
     "type": "split",
     "layout": "2x2",
     "until": "Save this video",
     "cells": [
      {
       "asset": "hero_pike_bottom",
       "at": "Do three"
      },
      {
       "asset": "hero_dip_bottom",
       "at": "rounds"
      },
      {
       "asset": "hero_handstand",
       "at": "three times"
      },
      {
       "asset": "hero_victory",
       "at": "a week"
      }
     ]
    },
    {
     "type": "image",
     "asset": "hero_salute",
     "at": "Save this video",
     "until": "follow for more",
     "enter": "punch"
    },
    {
     "type": "image",
     "asset": "hero_wave_hello",
     "at": "follow for more",
     "enter": "pop",
     "motion": {
      "type": "zoomIn"
     }
    }
   ]
  }
 ],
 "sfx": [
  {
   "at": "start",
   "src": "sfx_whoosh_big"
  },
  {
   "at": "bigger shoulders",
   "src": "sfx_pop_2"
  },
  {
   "at": "without lifting",
   "src": "sfx_hammer"
  },
  {
   "at": "three moves",
   "src": "sfx_pop"
  },
  {
   "at": "at home",
   "src": "sfx_ding"
  },
  {
   "at": "Number one-0.1",
   "src": "sfx_whoosh_fast"
  },
  {
   "at": "pike push ups",
   "src": "sfx_desk_bell"
  },
  {
   "at": "Hips up high",
   "src": "sfx_pop"
  },
  {
   "at": "upside down V",
   "src": "sfx_click"
  },
  {
   "at": "Lower your head",
   "src": "sfx_swish"
  },
  {
   "at": "push back up",
   "src": "sfx_pop_2"
  },
  {
   "at": "Number two-0.1",
   "src": "sfx_whoosh_swipe"
  },
  {
   "at": "dips",
   "src": "sfx_desk_bell"
  },
  {
   "at": "keep your chest up",
   "src": "sfx_pop"
  },
  {
   "at": "lower until",
   "src": "sfx_swish"
  },
  {
   "at": "ninety degrees",
   "src": "sfx_ding"
  },
  {
   "at": "Number three-0.1",
   "src": "sfx_whoosh_fast"
  },
  {
   "at": "handstand hold",
   "src": "sfx_desk_bell"
  },
  {
   "at": "Kick up",
   "src": "sfx_swish"
  },
  {
   "at": "twenty seconds",
   "src": "sfx_counter"
  },
  {
   "at": "builds strength",
   "src": "sfx_electric"
  },
  {
   "at": "Do three rounds-0.1",
   "src": "sfx_whoosh_big"
  },
  {
   "at": "three times a week",
   "src": "sfx_pop"
  },
  {
   "at": "Save this video",
   "src": "sfx_coin"
  },
  {
   "at": "follow for more",
   "src": "sfx_gold_bell"
  }
 ]
}
```

Why it works: each exercise starts at its "Number …" phrase; the hook changes pose on "bigger shoulders", "without lifting",
"three moves", "at home"; pike push-ups show a quick rep on "push ups", then reps on "Hips up high" / "Lower your head" /
"push back up"; "keep your chest up" rings the chest; "ninety degrees" is a measure with "90°"; "twenty seconds" pops a
stopwatch; the recap cells pop on "Do three", "rounds", "three times", "a week". Sounds: a whoosh on every scene start,
a desk bell on each exercise name, pops/clicks when rings and arrows appear, `sfx_ding` on "ninety degrees", `sfx_counter`
on "twenty seconds", `sfx_electric` on "builds strength", and a coin + gold bell on "Save this video" / "follow for more".

## 5. Worked example 2: "Full body at home" (60 s)

Script:

You don't need a gym to train your whole body. All you need is ten minutes and this simple routine. First, squats. Stand tall, push your hips back, and lower until your thighs are parallel to the floor. Drive through your heels to stand up. Next, push ups. Keep your body straight from head to heels, and lower your chest until it almost touches the ground. Then, mountain climbers. Start in a high plank and drive your knees toward your chest, one after the other, as fast as you can. After that, glute bridges. Lie on your back, plant your feet, and lift your hips until your body forms a straight line. Squeeze at the top. Finally, the plank. Hold it for thirty seconds and keep your core tight the whole time. Repeat this circuit three times. Do it every morning, and in one month you will feel the difference. Follow for more.

JSON:

```json
{
 "title": "Full body at home",
 "captions": {
  "mode": "word",
  "keywords": [
   "gym",
   "body",
   "ten",
   "minutes",
   "morning",
   "difference",
   "follow"
  ],
  "bottom": [
   [
    "First",
    "Repeat this circuit"
   ]
  ]
 },
 "scenes": [
  {
   "id": "hook",
   "start": "start",
   "shakes": [
    {
     "at": "gym"
    }
   ],
   "layers": [
    {
     "type": "pattern",
     "asset": "prop_dumbbell",
     "opacity": 0.1
    },
    {
     "type": "image",
     "asset": "hero_stop_palm",
     "until": "train your whole body",
     "enter": "punch"
    },
    {
     "type": "image",
     "asset": "hero_double_biceps",
     "at": "train your whole body",
     "until": "All you need",
     "enter": "punch"
    },
    {
     "type": "image",
     "asset": "hero_check_watch",
     "at": "All you need",
     "until": "simple routine",
     "enter": "punch"
    },
    {
     "type": "image",
     "asset": "hero_thumbs_up",
     "at": "simple routine",
     "enter": "pop",
     "motion": {
      "type": "zoomIn"
     }
    }
   ]
  },
  {
   "id": "squats",
   "start": "First-0.1",
   "transition": "slideLeft",
   "layers": [
    {
     "type": "text",
     "text": "#1 SQUATS"
    },
    {
     "type": "poses",
     "crossfade": 0.4,
     "shadow": true,
     "frames": [
      {
       "asset": "hero_squat_top",
       "at": "First"
      },
      {
       "asset": "hero_squat_mid",
       "at": "squats"
      },
      {
       "asset": "hero_squat_top",
       "at": "Stand tall"
      },
      {
       "asset": "hero_squat_mid",
       "at": "push your hips back"
      },
      {
       "asset": "hero_squat_top",
       "at": "Drive through your heels"
      }
     ]
    },
    {
     "type": "highlight",
     "anchor": "hips",
     "at": "push your hips back",
     "until": "until your thighs"
    },
    {
     "type": "arrow",
     "anchor": "hips",
     "pointing": "left",
     "at": "push your hips back",
     "until": "until your thighs",
     "color": "#3DDC84"
    },
    {
     "type": "highlight",
     "anchor": "thighs",
     "at": "until your thighs",
     "until": "Drive through your heels",
     "color": "#FF4D3D"
    },
    {
     "type": "highlight",
     "anchor": "feet",
     "at": "Drive through your heels",
     "color": "#FFD23F"
    },
    {
     "type": "arrow",
     "anchor": "hips",
     "pointing": "up",
     "at": "heels to stand",
     "color": "#3DDC84"
    }
   ]
  },
  {
   "id": "pushups",
   "start": "Next-0.1",
   "transition": "slideLeft",
   "layers": [
    {
     "type": "text",
     "text": "#2 PUSH UPS"
    },
    {
     "type": "poses",
     "crossfade": 0.4,
     "shadow": true,
     "frames": [
      {
       "asset": "hero_pushup_top",
       "at": "Next"
      },
      {
       "asset": "hero_pushup_mid",
       "at": "push ups|end"
      },
      {
       "asset": "hero_pushup_top",
       "at": "Keep your body straight"
      },
      {
       "asset": "hero_pushup_mid",
       "at": "lower your chest"
      },
      {
       "asset": "hero_pushup_top",
       "at": "almost touches|end"
      }
     ]
    },
    {
     "type": "measure",
     "from": "feet",
     "to": "head",
     "at": "head to heels",
     "until": "lower your chest"
    },
    {
     "type": "highlight",
     "anchor": "chest",
     "at": "lower your chest",
     "color": "#FF4D3D"
    },
    {
     "type": "arrow",
     "anchor": "chest",
     "pointing": "down",
     "at": "lower your chest",
     "until": "almost touches|end",
     "color": "#3DDC84"
    }
   ]
  },
  {
   "id": "climbers",
   "start": "Then-0.1",
   "transition": "slideLeft",
   "shakes": [
    {
     "at": "as fast as",
     "intensity": 10
    }
   ],
   "layers": [
    {
     "type": "text",
     "text": "#3 MOUNTAIN CLIMBERS"
    },
    {
     "type": "poses",
     "crossfade": 0.2,
     "shadow": true,
     "frames": [
      {
       "asset": "hero_pushup_top",
       "at": "Then"
      },
      {
       "asset": "hero_mountain_a",
       "at": "mountain climbers"
      },
      {
       "asset": "hero_pushup_top",
       "at": "Start in a high plank"
      },
      {
       "asset": "hero_mountain_a",
       "at": "drive your knees"
      },
      {
       "asset": "hero_mountain_b",
       "at": "toward your chest"
      },
      {
       "asset": "hero_mountain_a",
       "at": "one after"
      },
      {
       "asset": "hero_mountain_b",
       "at": "the other"
      },
      {
       "asset": "hero_mountain_a",
       "at": "as fast as"
      },
      {
       "asset": "hero_mountain_b",
       "at": "you can|end-0.2"
      }
     ]
    },
    {
     "type": "highlight",
     "anchor": "knees",
     "at": "drive your knees",
     "until": "one after",
     "color": "#3DDC84"
    },
    {
     "type": "arrow",
     "anchor": "knees",
     "pointing": "right",
     "at": "drive your knees",
     "until": "one after",
     "color": "#3DDC84"
    }
   ]
  },
  {
   "id": "bridges",
   "start": "After that-0.1",
   "transition": "slideLeft",
   "layers": [
    {
     "type": "text",
     "text": "#4 GLUTE BRIDGES"
    },
    {
     "type": "poses",
     "crossfade": 0.4,
     "shadow": true,
     "frames": [
      {
       "asset": "hero_glute_bridge_down",
       "at": "After that"
      },
      {
       "asset": "hero_glute_bridge_up",
       "at": "glute bridges"
      },
      {
       "asset": "hero_glute_bridge_down",
       "at": "Lie on your back"
      },
      {
       "asset": "hero_glute_bridge_up",
       "at": "lift your hips"
      }
     ]
    },
    {
     "type": "arrow",
     "anchor": "hips",
     "pointing": "up",
     "at": "lift your hips",
     "until": "straight line",
     "color": "#3DDC84"
    },
    {
     "type": "measure",
     "from": "knees",
     "to": "shoulders",
     "at": "straight line",
     "until": "Squeeze at the top"
    },
    {
     "type": "highlight",
     "anchor": "glutes",
     "at": "Squeeze at the top",
     "color": "#FF4D3D"
    },
    {
     "type": "zoomBubble",
     "anchor": "glutes",
     "at": "Squeeze at the top"
    }
   ]
  },
  {
   "id": "plank",
   "start": "Finally-0.1",
   "transition": "slideLeft",
   "camera": [
    {
     "at": "keep your core",
     "zoom": 1,
     "focus": "body"
    },
    {
     "at": "core tight",
     "zoom": 1.5,
     "focus": "abs"
    }
   ],
   "layers": [
    {
     "type": "text",
     "text": "#5 PLANK"
    },
    {
     "type": "image",
     "asset": "hero_plank",
     "width": 0.92,
     "shadow": true,
     "motion": {
      "type": "zoomIn",
      "amount": 0.4
     }
    },
    {
     "type": "measure",
     "from": "feet",
     "to": "head",
     "at": "Hold it",
     "until": "keep your core"
    },
    {
     "type": "highlight",
     "anchor": "abs",
     "at": "core tight",
     "color": "#FF4D3D"
    },
    {
     "type": "image",
     "asset": "prop_stopwatch",
     "x": 0.78,
     "y": 0.36,
     "width": 0.26,
     "at": "thirty seconds",
     "until": "keep your core",
     "enter": "pop",
     "motion": {
      "type": "pulse"
     }
    }
   ]
  },
  {
   "id": "outro",
   "start": "Repeat this circuit-0.1",
   "transition": "flash",
   "layers": [
    {
     "type": "split",
     "layout": "2x2",
     "until": "Do it every morning",
     "cells": [
      {
       "asset": "hero_squat_mid",
       "at": "Repeat this"
      },
      {
       "asset": "hero_pushup_mid",
       "at": "circuit"
      },
      {
       "asset": "hero_mountain_a",
       "at": "three times"
      },
      {
       "asset": "hero_glute_bridge_up",
       "at": "times"
      }
     ]
    },
    {
     "type": "image",
     "asset": "hero_yawning",
     "at": "Do it every morning",
     "until": "one month",
     "enter": "punch"
    },
    {
     "type": "image",
     "asset": "hero_beginner",
     "at": "one month",
     "until": "feel the difference",
     "enter": "pop"
    },
    {
     "type": "image",
     "asset": "hero_double_biceps",
     "at": "feel the difference",
     "until": "Follow for more",
     "enter": "punch"
    },
    {
     "type": "image",
     "asset": "hero_wave_hello",
     "at": "Follow for more",
     "enter": "pop",
     "motion": {
      "type": "zoomIn"
     }
    }
   ]
  }
 ],
 "sfx": [
  {
   "at": "start",
   "src": "sfx_whoosh_big"
  },
  {
   "at": "need a gym",
   "src": "sfx_hammer"
  },
  {
   "at": "train your whole body",
   "src": "sfx_pop"
  },
  {
   "at": "ten minutes",
   "src": "sfx_counter"
  },
  {
   "at": "simple routine",
   "src": "sfx_ding"
  },
  {
   "at": "First-0.1",
   "src": "sfx_whoosh_fast"
  },
  {
   "at": "squats",
   "src": "sfx_desk_bell"
  },
  {
   "at": "push your hips back",
   "src": "sfx_pop"
  },
  {
   "at": "until your thighs",
   "src": "sfx_click"
  },
  {
   "at": "Drive through your heels",
   "src": "sfx_pop_2"
  },
  {
   "at": "Next-0.1",
   "src": "sfx_whoosh_swipe"
  },
  {
   "at": "push ups",
   "src": "sfx_desk_bell"
  },
  {
   "at": "head to heels",
   "src": "sfx_ding"
  },
  {
   "at": "lower your chest",
   "src": "sfx_swish"
  },
  {
   "at": "Then-0.1",
   "src": "sfx_whoosh_fast"
  },
  {
   "at": "mountain climbers",
   "src": "sfx_desk_bell"
  },
  {
   "at": "drive your knees",
   "src": "sfx_running"
  },
  {
   "at": "as fast as you can",
   "src": "sfx_heavy_breathing"
  },
  {
   "at": "After that-0.1",
   "src": "sfx_whoosh_swipe"
  },
  {
   "at": "glute bridges",
   "src": "sfx_desk_bell"
  },
  {
   "at": "lift your hips",
   "src": "sfx_swish"
  },
  {
   "at": "straight line",
   "src": "sfx_ding"
  },
  {
   "at": "Squeeze at the top",
   "src": "sfx_electric"
  },
  {
   "at": "Finally-0.1",
   "src": "sfx_whoosh_fast"
  },
  {
   "at": "the plank",
   "src": "sfx_desk_bell"
  },
  {
   "at": "thirty seconds",
   "src": "sfx_counter"
  },
  {
   "at": "core tight",
   "src": "sfx_pop"
  },
  {
   "at": "Repeat this circuit-0.1",
   "src": "sfx_whoosh_big"
  },
  {
   "at": "Do it every morning",
   "src": "sfx_pop"
  },
  {
   "at": "one month",
   "src": "sfx_sparkle"
  },
  {
   "at": "feel the difference",
   "src": "sfx_magic"
  },
  {
   "at": "Follow for more",
   "src": "sfx_gold_bell"
  }
 ]
}
```

Why it works: phrases that repeat in the script ("stand", "lower", "push", "keep", "one", "three", "after") are always
lengthened ("Stand tall", "lower your chest", "push your hips back", "one after", "After that"); mountain climbers
alternate two frames on every short phrase to look fast; the plank scene ends with a camera punch on the abs.


## 6. Lessons from real renders (mistakes that made a video look bad)

A first version of the pull-up video below looked random. These were the causes; never repeat them:

| What the viewer saw | Cause in the JSON | Do this instead |
|---|---|---|
| H jumping between a front view and a side view with a different bar | Alternated `hero_pullup_hang` (front) with `hero_pullup_top` (side) as "reps" | Only alternate frames of one movement set. No matching pair → hold one pose, animate with rings/arrows/camera |
| "Shoulder blades" ringed on the deltoids | Used `shoulders` | Use `shoulder_blades` (or `upper_back`) |
| A scene called "WRONG ORDER" where nothing looked wrong | Title only, pictures neutral | Show the mistake: hero_lifting_giant straining → hero_tired_sweating, red rings, stopwatch |
| Red X sitting on H's raised hand | Prop at x 0.76 next to a raised palm | Put props on the free side (x 0.2 or 0.8, y 0.3–0.45) |
| Rings floating in empty space | One ring kept across a pose change | End rings when the picture changes; add a new ring after |
| Shorts: captions and titles hidden behind the YouTube title and buttons | Text at `y` 0.85–0.95 or far right in the lower half | Keep texts between `y` 0.15 and 0.75, away from the right edge below the middle (safe zone) |
| Big stars covered H; plain white screen | `burst` stars behind words, faint backdrops | No `burst` (it is not drawn any more): `banner`, `callout`, `checklist`, `bars`, `ring`, `versus`, `chat`, `accent`; a visible, varied `backdrop` in every scene |
| 16:9 felt slow and empty | Dark title cards, one small word on a big empty side, the same pose for 5–6 s | White background with a `backdrop`, the right side always busy (stickers, banners, callouts, counters, progress bars, zoom circles), something new every 1–2 s, no dark cards |
| Yellow / red words disappeared into the background | Plain coloured text without outline | Always give 16:9 text a `look` (`hook`, `box`, `pop`, `comic`): every look has a black outline or a box |

The tool now also protects you automatically: text is never drawn over H's face (H eases smaller instead), titles never overlap,
captions drop to the bottom while a title is shown, props move beside H, and very thin poses are not blown up. Still plan as
if it didn't: a clean plan gives a clean video.

## 7. Worked example 3: "Active hangs first" (20 s, short-tip format)

Script:

Before you try another pull up, do this first. Researchers found the shoulder blades have to lock down before the lats and biceps can contribute. Start at step two and your arms burn out in seconds. So, don't add reps. 10 active hangs every session before anything else.

Note: the script says "10 active hangs". Numbers match either way, so "10 active hangs" or "ten active hangs" both work; this JSON simply uses "active hangs".

JSON:

```json
{
 "title": "Active hangs first",
 "captions": {
  "mode": "word",
  "keywords": [
   "pull",
   "first",
   "shoulder",
   "lock",
   "lats",
   "burn",
   "reps",
   "hangs"
  ]
 },
 "scenes": [
  {
   "id": "hook",
   "start": "start",
   "shakes": [
    {
     "at": "first"
    }
   ],
   "layers": [
    {
     "type": "image",
     "asset": "hero_stop_palm",
     "until": "another pull up",
     "enter": "punch"
    },
    {
     "type": "image",
     "asset": "hero_look_up_bar",
     "at": "another pull up",
     "until": "do this first",
     "enter": "pop"
    },
    {
     "type": "image",
     "asset": "hero_count_1",
     "at": "do this first",
     "enter": "punch",
     "motion": {
      "type": "zoomIn"
     }
    }
   ]
  },
  {
   "id": "science",
   "start": "Researchers found-0.1",
   "transition": "slideLeft",
   "camera": [
    {
     "at": "shoulder blades",
     "zoom": 1,
     "focus": "body"
    },
    {
     "at": "lock down",
     "zoom": 1.3,
     "focus": "shoulder_blades"
    },
    {
     "at": "lats and biceps",
     "zoom": 1,
     "focus": "body"
    }
   ],
   "layers": [
    {
     "type": "text",
     "text": "THE SCIENCE"
    },
    {
     "type": "image",
     "asset": "hero_detective",
     "until": "shoulder blades",
     "enter": "pop"
    },
    {
     "type": "image",
     "asset": "hero_back_view",
     "at": "shoulder blades",
     "until": "lats and biceps",
     "enter": "pop"
    },
    {
     "type": "highlight",
     "anchor": "shoulder_blades",
     "at": "shoulder blades",
     "color": "#FFD23F"
    },
    {
     "type": "arrow",
     "anchor": "shoulder_blades",
     "pointing": "down",
     "at": "lock down",
     "color": "#3DDC84"
    },
    {
     "type": "image",
     "asset": "hero_back_double_biceps",
     "at": "lats and biceps",
     "enter": "punch"
    },
    {
     "type": "highlight",
     "anchor": "back",
     "at": "lats and biceps",
     "until": "biceps can contribute"
    },
    {
     "type": "highlight",
     "anchor": "arms",
     "at": "biceps can contribute",
     "color": "#3DDC84"
    }
   ]
  },
  {
   "id": "mistake",
   "start": "Start at step two-0.1",
   "transition": "slideLeft",
   "shakes": [
    {
     "at": "burn out"
    }
   ],
   "layers": [
    {
     "type": "text",
     "text": "SKIP STEP ONE?",
     "color": "#FF4D3D"
    },
    {
     "type": "image",
     "asset": "hero_lifting_giant",
     "until": "burn out",
     "enter": "punch"
    },
    {
     "type": "highlight",
     "anchor": "arms",
     "at": "your arms",
     "until": "burn out",
     "color": "#FF4D3D"
    },
    {
     "type": "image",
     "asset": "hero_tired_sweating",
     "at": "burn out",
     "enter": "pop"
    },
    {
     "type": "highlight",
     "anchor": "arms",
     "at": "burn out",
     "color": "#FF4D3D"
    },
    {
     "type": "image",
     "asset": "prop_stopwatch",
     "at": "in seconds",
     "x": 0.8,
     "y": 0.3,
     "width": 0.24,
     "enter": "pop",
     "motion": {
      "type": "pulse"
     }
    }
   ]
  },
  {
   "id": "fix",
   "start": "So-0.1",
   "transition": "slideLeft",
   "layers": [
    {
     "type": "text",
     "text": "#1 ACTIVE HANGS",
     "at": "active hangs-0.4"
    },
    {
     "type": "image",
     "asset": "hero_stop_palm",
     "until": "active hangs",
     "enter": "punch"
    },
    {
     "type": "image",
     "asset": "prop_red_x",
     "at": "add reps",
     "until": "active hangs",
     "x": 0.75,
     "y": 0.4,
     "width": 0.25,
     "enter": "pop"
    },
    {
     "type": "image",
     "asset": "hero_pullup_hang",
     "at": "active hangs",
     "until": "before anything else",
     "y": 0.62,
     "width": 0.72,
     "enter": "pop"
    },
    {
     "type": "highlight",
     "anchor": "shoulders",
     "at": "active hangs",
     "until": "before anything else",
     "color": "#3DDC84"
    },
    {
     "type": "arrow",
     "anchor": "shoulders",
     "pointing": "down",
     "at": "every session",
     "until": "before anything else",
     "color": "#3DDC84"
    },
    {
     "type": "image",
     "asset": "hero_salute",
     "at": "before anything else",
     "enter": "punch"
    }
   ]
  }
 ],
 "sfx": [
  {
   "at": "start",
   "src": "sfx_whoosh_big"
  },
  {
   "at": "another pull up",
   "src": "sfx_pop"
  },
  {
   "at": "do this first",
   "src": "sfx_desk_bell"
  },
  {
   "at": "Researchers found-0.1",
   "src": "sfx_whoosh_fast"
  },
  {
   "at": "shoulder blades",
   "src": "sfx_sparkle"
  },
  {
   "at": "lock down",
   "src": "sfx_click"
  },
  {
   "at": "lats and biceps",
   "src": "sfx_pop_2"
  },
  {
   "at": "Start at step two-0.1",
   "src": "sfx_whoosh_swipe"
  },
  {
   "at": "burn out",
   "src": "sfx_electric"
  },
  {
   "at": "in seconds",
   "src": "sfx_counter"
  },
  {
   "at": "So-0.1",
   "src": "sfx_whoosh_fast"
  },
  {
   "at": "add reps",
   "src": "sfx_hammer"
  },
  {
   "at": "active hangs",
   "src": "sfx_ding"
  },
  {
   "at": "every session",
   "src": "sfx_pop"
  },
  {
   "at": "before anything else",
   "src": "sfx_gold_bell"
  }
 ]
}
```

Why it works: every picture shows the words (stop palm on "Before you try", the bar on "another pull up", one finger on
"first", the detective on "Researchers", the back view with rings ON the shoulder blades and a down arrow on "lock down",
the back flex on "lats and biceps"); the mistake looks like a mistake (straining with a giant dumbbell, then exhausted,
stopwatch on "in seconds"); the fix shows the hang with green rings and a down arrow; the salute ends it. Each scene opens
with a whoosh and every appearance has a sound that matches its meaning.


## 8. Landscape 16:9 (YouTube) format

The tool also makes 16:9 videos (1920×1080). The request then contains this extra section; it is repeated here so you know it before you see it:

### FORMAT: LANDSCAPE 16:9 (1920×1080, YouTube video) — these rules replace the vertical ones above where they differ

The canvas is wide and WHITE, so H stands out. The video must feel packed and fast, like a top YouTube explainer: the viewer
should never see a calm, empty screen. H is on one side, the other side is always busy with stickers, big words, banners, callouts,
counters, zoom circles or props, and something new appears every 1–2 seconds.

### Layout (x / y are 0..1 of the screen)
- **H on the left third** (`"x": 0.27`, standing poses keep the default size) and the idea on the right (`x` 0.72–0.78).
  Lying / plank poses: `"x": 0.26, "y": 0.62, "width": 0.5`. Centre H (`"x": 0.5`, plank `"width": 0.62`) only for form
  breakdowns, then put one sticker at the top (`"x": 0.5, "y": 0.14`).
- **The right side is never empty.** Every 1–2 s one of these appears or changes there:
  a sticker or big word (text `look`), a `banner` or `callout`, a `counter`, a `zoomBubble`, a prop, a second pose of H.
- Keep right-side words short (1–3 words, about 14 letters max) so they never reach H's head.

### Text looks (always set `look`; plain coloured letters disappear on white)
- `"look": "hook"` — fat cartoon letters with a 3D shadow, for the punch words ("30 DAYS", "NO!", "PROBLEM!", "LEVEL UP").
  Size 110–200. For the strongest moments use a `banner` (white letters on a red / green ribbon).
- `"look": "box"` — sticker: white letters on a coloured box (`"boxColor"`: `#3DDC84` good, `#FF4D3D` bad/pain,
  `#FFD23F` attention, `#111111` neutral, `#3DA5FF` info). For checklists ("ABS TIGHT", "STRICT FORM"), stacked keywords,
  and labels. Size 80–110. A box pops in whole.
- `"look": "pop"` — tall bold letters with a black outline (`"color"` = fill: `#FFD23F`, `#3DDC84`, `#FF4D3D`, `#FFFFFF`).
- `"look": "comic"` — comic-book letters, good for numbers ("60 SEC").
- Text template: `{"type": "text", "text": "PROPER FORM", "look": "hook", "x": 0.72, "y": 0.5, "size": 120, "align": "center", "animation": "words", "color": "#FFFFFF"}`
- Several stickers can stack on the right (`y` 0.28 / 0.5 / 0.72), each `at` its word ("STRONGER" / "LESS SHAKING" / "MORE ENDURANCE").
- Crossed-out myths: add `"strike": "<phrase>"` and a red line crosses the text out when that phrase is spoken.

### Energy layers
- `{"type": "banner", "text": "A PROBLEM", "color": "#FF4D3D", "shadowBand": "#111111", "y": 0.45, "at": "a problem"}` — ribbon across the screen for a hook word (stars / bursts are no longer drawn).
- `{"type": "counter", "from": 0, "to": 60, "suffix": " SEC", "look": "comic", "color": "#FFD23F", "x": 0.75, "y": 0.4, "size": 150, "duration": 1.2, "at": "60 seconds"}`
  — numbers count up on screen (seconds, reps, kilos, "DAY 1" → "DAY 30" with `"prefix": "DAY "`).
- `{"type": "progress", "label": "DAY 7 / 30", "from": 0.04, "to": 0.23, "x": 0.72, "y": 0.16, "width": 0.42}` — progress bar
  that fills up: challenges, weeks, "halfway there".
- `zoomBubble` (`"size": 0.27`, `"x": 0.76`) on the body part the voice names, or `{"type": "zoomBubble", "asset": "hero_abs", "focus": [0.5, 0.62], "zoom": 1.6, ...}` for a six-pack close-up.
- Props are big on the right: width 0.12–0.17 (stopwatch for seconds, calendar for days, fire for burn, red X / green check).

### Scene look
- Every scene gets a `"backdrop"` (never plain white; vary it): `dots`, `grid`, `stripes`, `halftone`, `blobs`, `notebook`, `plus`, `checker`, `waves`, `"rays"` (spinning sunburst: only a finale),
  `"dots"` (calm explaining), `"grid"` (form / technique), `"spotlight"` (drama, pain, a problem), with `"backdropColor"`
  (`#FFD23F`, `#3DDC84`, `#FF4D3D`, `#3DA5FF`). Change backdrop and colour from scene to scene.
- Transitions: mix `"flash"`, `"zoom"`, `"slideLeft"`, `"cut"`. No dark title cards: introduce a new chapter with a
  `progress` bar or a hook word on the normal white scene instead (at most 1.5 s, never an empty screen).
- Camera: punch in on the part being explained (`"zoom": 1.25–1.35`, `focus` = that part) and back to 1 on the next idea.
  Don't zoom while a right-side word is on screen next to H's head.

### Rhythm (most important)
- Something new every 1–2 s: a pose change, a sticker, a banner, a callout, a checklist tick, a counter, a ring, a camera punch. Never 3 s without a change.
- Scenes are 4–12 s (one per idea), each with many layers that replace each other (`at` / `until`).
- Every sentence gets at least one visual: its key word as a sticker or hook word, plus a matching pose.
- Sound: something every 1–2 s (whooshes on scene changes, pops on every sticker, a counter sound on counters, a ding on good news).

### Captions
- No running captions: `"captions": {"mode": "none"}`. The stickers and hook words carry the important words.

### Long scripts: answer in parts
If the script is longer than about 2 minutes, do NOT write everything at once. Reply with **part 1** (the first ~90 s of the
script) as a complete JSON object. When the user says "next", reply with the next part as another JSON object that contains only
`"scenes"` and `"sfx"` for the following ~90 s, continuing exactly where the last part stopped. The user pastes all parts one after
another into the tool, which joins them. The first part has `"title"` and `"captions"`.

## 9. Worked example 4: "Planks every day for 30 days" in 16:9 (113 s)

A real 16:9 video in the new style. Note: white background with a different backdrop per scene, H on the left third, the right
side never empty (hook words on banners, box stickers, counters, a progress bar for DAY 1 / WEEK 1 / DAY 7 / ... / DAY 30, zoom circles),
form breakdowns with H centred and one sticker at the top that changes on every cue, something new every 1–2 s, no dark cards,
no captions. (Written as one JSON here; a script this long may also be answered in parts.)

```json
{
 "title": "Planks every day for 30 days (16:9)",
 "captions": {"mode": "none"},
 "scenes": [
  {"id": "hook", "start": "start", "transition": "cut", "backdrop": "rays", "backdropColor": "#FFD23F", "camera": [{"at": "start", "zoom": 1, "focus": "body"}, {"at": "Here's What Happened", "zoom": 1.1, "focus": "body"}], "shakes": [{"at": "What Happened"}], "layers": [
   {"type": "image", "asset": "hero_plank", "x": 0.26, "y": 0.62, "width": 0.5, "shadow": true, "at": "I Did Planks", "until": "Here's What Happened", "enter": "punch", "motion": {"type": "zoomIn"}},
   {"type": "text", "text": "30 DAYS", "look": "hook", "x": 0.72, "y": 0.4, "size": 170, "align": "center", "animation": "words", "at": "for 30 Days#1", "until": "Here's What Happened"},
   {"type": "text", "text": "EVERY DAY", "look": "box", "x": 0.72, "y": 0.75, "size": 90, "align": "center", "animation": "words", "boxColor": "#111111", "at": "Every Day for", "until": "Here's What Happened"},
   {"type": "image", "asset": "hero_point_viewer", "x": 0.27, "shadow": true, "at": "Here's What Happened", "enter": "punch"},
   {"type": "text", "text": "WHAT HAPPENED?", "look": "hook", "x": 0.7, "y": 0.45, "size": 120, "align": "center", "animation": "words", "color": "#FFFFFF", "at": "What Happened"}
  ]},
  {"id": "day1", "start": "On day one-0.1", "transition": "zoom", "backdrop": "dots", "backdropColor": "#3DA5FF", "layers": [
   {"type": "progress", "label": "DAY 1 / 30", "from": 0, "to": 0.04, "x": 0.72, "y": 0.16, "width": 0.42, "color": "#3DDC84"},
   {"type": "image", "asset": "hero_smirk", "x": 0.27, "shadow": true, "until": "It's just a plank"},
   {"type": "text", "text": "EASY!", "look": "hook", "x": 0.72, "y": 0.52, "size": 170, "align": "center", "animation": "words", "color": "#3DDC84", "at": "would be easy", "until": "It's just a plank"},
   {"type": "image", "asset": "hero_shrug", "x": 0.27, "shadow": true, "at": "It's just a plank", "enter": "punch"},
   {"type": "text", "text": "JUST A PLANK?", "look": "box", "x": 0.72, "y": 0.52, "size": 100, "align": "center", "animation": "words", "boxColor": "#FFD23F", "at": "just a plank"}
  ]},
  {"id": "struggle", "start": "But after about 30 seconds-0.1", "transition": "flash", "backdrop": "spotlight", "backdropColor": "#FF4D3D", "camera": [{"at": "But after about 30 seconds", "zoom": 1, "focus": "body"}, {"at": "my abs were shaking", "zoom": 1.15, "focus": "abs"}, {"at": "my shoulders were burning", "zoom": 1.15, "focus": "shoulders"}, {"at": "and suddenly", "zoom": 1, "focus": "body"}], "shakes": [{"at": "my abs were shaking"}, {"at": "felt like five"}], "layers": [
   {"type": "image", "asset": "hero_plank", "x": 0.26, "y": 0.62, "width": 0.5, "shadow": true, "until": "my abs were shaking"},
   {"type": "image", "asset": "hero_plank", "x": 0.26, "y": 0.62, "width": 0.5, "shadow": true, "at": "my abs were shaking", "until": "Still, I decided", "motion": {"type": "shake", "amount": 0.5}},
   {"type": "counter", "from": 0, "to": 30, "suffix": " SEC", "look": "comic", "color": "#FFD23F", "x": 0.75, "y": 0.42, "size": 150, "duration": 1.1, "at": "about 30 seconds", "until": "my abs were shaking"},
   {"type": "highlight", "anchor": "abs", "color": "#FF4D3D", "at": "my abs were shaking", "until": "and suddenly"},
   {"type": "zoomBubble", "asset": "hero_abs", "focus": [0.5, 0.62], "zoom": 1.6, "x": 0.76, "y": 0.42, "size": 0.27, "at": "my abs were shaking", "until": "my shoulders were burning"},
   {"type": "highlight", "anchor": "shoulders", "color": "#FF4D3D", "at": "my shoulders were burning", "until": "and suddenly"},
   {"type": "zoomBubble", "anchor": "shoulders", "at": "my shoulders were burning", "until": "and suddenly", "x": 0.76, "y": 0.42, "size": 0.27},
   {"type": "image", "asset": "prop_fire", "x": 0.9, "y": 0.22, "width": 0.09, "at": "burning", "until": "and suddenly", "motion": {"type": "pulse"}},
   {"type": "text", "text": "1 MIN", "look": "box", "x": 0.74, "y": 0.32, "size": 120, "align": "center", "animation": "words", "boxColor": "#111111", "at": "suddenly one minute", "until": "Still, I decided"},
   {"type": "text", "text": "FEELS LIKE 5", "look": "hook", "x": 0.76, "y": 0.62, "size": 100, "align": "center", "animation": "words", "color": "#FF4D3D", "at": "felt like five", "until": "Still, I decided"}
  ]},
  {"id": "decide", "start": "Still, I decided-0.1", "transition": "slideLeft", "backdrop": "rays", "backdropColor": "#3DDC84", "layers": [
   {"type": "image", "asset": "hero_crack_knuckles", "x": 0.27, "shadow": true, "enter": "punch"},
   {"type": "image", "asset": "prop_calendar", "x": 0.72, "y": 0.36, "width": 0.15, "at": "every single day", "motion": {"type": "pulse"}},
   {"type": "counter", "from": 1, "to": 30, "prefix": "DAY ", "look": "hook", "color": "#FFFFFF", "x": 0.72, "y": 0.74, "size": 130, "duration": 1, "at": "for 30 days#2"}
  ]},
  {"id": "week1", "start": "For the first week-0.1", "transition": "zoom", "backdrop": "dots", "backdropColor": "#FFD23F", "layers": [
   {"type": "progress", "label": "WEEK 1", "from": 0.04, "to": 0.23, "x": 0.72, "y": 0.16, "width": 0.42, "color": "#3DDC84"},
   {"type": "image", "asset": "hero_teacher_pointer", "x": 0.27, "shadow": true},
   {"type": "text", "text": "ONE THING", "look": "box", "x": 0.72, "y": 0.45, "size": 110, "align": "center", "animation": "words", "boxColor": "#111111", "at": "one thing", "until": "proper form"},
   {"type": "text", "text": "PROPER FORM", "look": "hook", "x": 0.72, "y": 0.5, "size": 120, "align": "center", "animation": "words", "color": "#FFFFFF", "at": "proper form"}
  ]},
  {"id": "form", "start": "Elbows under my shoulders-0.1", "transition": "flash", "backdrop": "grid", "backdropColor": "#3DA5FF", "camera": [{"at": "Elbows under my shoulders", "zoom": 1.25, "focus": "elbows"}, {"at": "body in a straight line", "zoom": 1, "focus": "body"}, {"at": "abs tight", "zoom": 1.3, "focus": "abs"}, {"at": "glutes squeezed", "zoom": 1.3, "focus": "glutes"}, {"at": "and no letting", "zoom": 1.15, "focus": "hips"}, {"at": "my hips drop|end", "zoom": 1, "focus": "body"}], "layers": [
   {"type": "image", "asset": "hero_plank", "x": 0.5, "y": 0.62, "width": 0.62, "shadow": true, "until": "And honestly"},
   {"type": "text", "text": "ELBOWS UNDER", "look": "box", "x": 0.5, "y": 0.14, "size": 90, "align": "center", "animation": "words", "boxColor": "#3DDC84", "at": "Elbows under", "until": "body in a straight line"},
   {"type": "highlight", "anchor": "elbows", "color": "#3DDC84", "at": "Elbows under", "until": "body in a straight line"},
   {"type": "text", "text": "STRAIGHT LINE", "look": "box", "x": 0.5, "y": 0.14, "size": 90, "align": "center", "animation": "words", "boxColor": "#FFD23F", "at": "body in a straight line", "until": "abs tight"},
   {"type": "measure", "from": "feet", "to": "head", "color": "#FFD23F", "at": "straight line", "until": "abs tight"},
   {"type": "text", "text": "ABS TIGHT", "look": "box", "x": 0.5, "y": 0.14, "size": 90, "align": "center", "animation": "words", "boxColor": "#FF4D3D", "at": "abs tight", "until": "glutes squeezed"},
   {"type": "highlight", "anchor": "abs", "color": "#FF4D3D", "at": "abs tight", "until": "glutes squeezed"},
   {"type": "text", "text": "GLUTES SQUEEZED", "look": "box", "x": 0.5, "y": 0.14, "size": 90, "align": "center", "animation": "words", "boxColor": "#FF4D3D", "at": "glutes squeezed", "until": "and no letting"},
   {"type": "highlight", "anchor": "glutes", "color": "#FF4D3D", "at": "glutes squeezed", "until": "and no letting"},
   {"type": "text", "text": "NO HIP DROP!", "look": "box", "x": 0.5, "y": 0.14, "size": 90, "align": "center", "animation": "words", "boxColor": "#111111", "at": "and no letting", "until": "And honestly"},
   {"type": "arrow", "anchor": "hips", "pointing": "down", "color": "#FF4D3D", "at": "my hips drop", "until": "And honestly"},
   {"type": "image", "asset": "prop_red_x", "x": 0.62, "y": 0.36, "width": 0.07, "at": "my hips drop", "until": "And honestly"}
  ]},
  {"id": "harder1", "start": "And honestly-0.1", "transition": "cut", "backdrop": "spotlight", "backdropColor": "#FF4D3D", "shakes": [{"at": "much harder"}], "layers": [
   {"type": "image", "asset": "hero_tired_sweating", "x": 0.27, "shadow": true, "enter": "punch"},
   {"type": "image", "asset": "prop_sweat_drops", "x": 0.42, "y": 0.18, "width": 0.08, "at": "that made"},
   {"type": "text", "text": "MUCH HARDER!", "look": "hook", "x": 0.72, "y": 0.45, "size": 110, "align": "center", "animation": "words", "color": "#FFFFFF", "at": "much harder"}
  ]},
  {"id": "day7", "start": "By day seven-0.1", "transition": "zoom", "backdrop": "rays", "backdropColor": "#3DA5FF", "layers": [
   {"type": "progress", "label": "DAY 7 / 30", "from": 0.04, "to": 0.23, "x": 0.72, "y": 0.16, "width": 0.42, "color": "#3DDC84", "until": "I wasn't magically"},
   {"type": "image", "asset": "hero_idea_bulb", "x": 0.27, "shadow": true, "until": "I wasn't magically", "enter": "punch"},
   {"type": "text", "text": "SOMETHING CHANGED", "look": "hook", "x": 0.72, "y": 0.52, "size": 100, "align": "center", "animation": "words", "color": "#FFD23F", "at": "started to change", "until": "I wasn't magically"},
   {"type": "image", "asset": "hero_shrug", "x": 0.27, "shadow": true, "at": "I wasn't magically", "until": "but my core felt"},
   {"type": "text", "text": "SIX-PACK", "look": "box", "x": 0.72, "y": 0.45, "size": 140, "align": "center", "animation": "words", "boxColor": "#111111", "at": "getting six-pack abs", "until": "but my core felt", "strike": "abs, but my"},
   {"type": "image", "asset": "hero_plank", "x": 0.26, "y": 0.62, "width": 0.5, "shadow": true, "at": "but my core felt", "until": "Push-ups felt"},
   {"type": "highlight", "anchor": "abs", "color": "#3DDC84", "at": "but my core felt", "until": "Push-ups felt"},
   {"type": "zoomBubble", "asset": "hero_abs", "focus": [0.5, 0.62], "zoom": 1.6, "x": 0.76, "y": 0.38, "size": 0.25, "at": "core felt much more", "until": "Push-ups felt"},
   {"type": "text", "text": "STABLE CORE", "look": "pop", "x": 0.76, "y": 0.8, "size": 110, "align": "center", "animation": "words", "color": "#3DDC84", "at": "much more stable", "until": "Push-ups felt"},
   {"type": "poses", "x": 0.3, "y": 0.62, "width": 0.5, "shadow": true, "at": "Push-ups felt", "frames": [{"asset": "hero_pushup_top", "at": "Push-ups felt"}, {"asset": "hero_pushup_mid", "at": "more controlled"}, {"asset": "hero_pushup_top", "at": "and I could hold"}, {"asset": "hero_pushup_mid", "at": "body straighter"}, {"asset": "hero_pushup_top", "at": "without thinking"}, {"asset": "hero_pushup_mid", "at": "about it"}]},
   {"type": "text", "text": "CONTROL", "look": "box", "x": 0.74, "y": 0.36, "size": 130, "align": "center", "animation": "words", "boxColor": "#3DDC84", "at": "more controlled"},
   {"type": "measure", "from": "feet", "to": "head", "color": "#FFD23F", "at": "body straighter", "until": "without thinking"},
   {"type": "text", "text": "ON AUTOPILOT", "look": "pop", "x": 0.74, "y": 0.66, "size": 100, "align": "center", "animation": "words", "color": "#FFD23F", "at": "without thinking"}
  ]},
  {"id": "week2", "start": "During the second week-0.1", "transition": "slideLeft", "backdrop": "dots", "backdropColor": "#3DDC84", "camera": [{"at": "During the second week", "zoom": 1, "focus": "body"}, {"at": "I could stay in position", "zoom": 1.12, "focus": "body"}], "layers": [
   {"type": "progress", "label": "WEEK 2", "from": 0.23, "to": 0.47, "x": 0.72, "y": 0.16, "width": 0.42, "color": "#3DDC84", "until": "Instead of struggling"},
   {"type": "image", "asset": "hero_plank", "x": 0.26, "y": 0.62, "width": 0.5, "shadow": true, "until": "But then I noticed"},
   {"type": "image", "asset": "prop_stopwatch", "x": 0.74, "y": 0.48, "width": 0.13, "at": "plank time", "until": "Instead of struggling", "motion": {"type": "pulse"}},
   {"type": "text", "text": "IMPROVING", "look": "pop", "x": 0.74, "y": 0.76, "size": 110, "align": "center", "animation": "words", "color": "#3DDC84", "at": "started improving", "until": "Instead of struggling"},
   {"type": "counter", "from": 0, "to": 60, "suffix": " SEC", "look": "comic", "color": "#FF4D3D", "x": 0.75, "y": 0.36, "size": 150, "duration": 1.6, "at": "Instead of struggling", "until": "I could stay"},
   {"type": "text", "text": "LONGER!", "look": "hook", "x": 0.75, "y": 0.36, "size": 150, "align": "center", "animation": "words", "color": "#3DDC84", "at": "I could stay", "until": "But then I noticed"},
   {"type": "text", "text": "BETTER CONTROL", "look": "box", "x": 0.74, "y": 0.66, "size": 90, "align": "center", "animation": "words", "boxColor": "#111111", "at": "with much better control", "until": "But then I noticed"}
  ]},
  {"id": "problem", "start": "But then I noticed-0.1", "transition": "flash", "backdrop": "spotlight", "backdropColor": "#FF4D3D", "camera": [{"at": "But then I noticed", "zoom": 1, "focus": "body"}, {"at": "a problem", "zoom": 1.35, "focus": "head"}, {"at": "If I just kept", "zoom": 1, "focus": "body"}, {"at": "every day the challenge", "zoom": 1.25, "focus": "head"}, {"at": "stop being challenging", "zoom": 1, "focus": "body"}], "shakes": [{"at": "a problem"}], "layers": [
   {"type": "image", "asset": "hero_thinking", "x": 0.27, "shadow": true, "until": "If I just kept", "enter": "punch"},
   {"type": "text", "text": "PROBLEM!", "look": "hook", "x": 0.72, "y": 0.45, "size": 130, "align": "center", "animation": "words", "color": "#FFFFFF", "at": "a problem", "until": "If I just kept"},
   {"type": "image", "asset": "hero_sleepy_standing", "x": 0.27, "shadow": true, "at": "If I just kept", "enter": "punch"},
   {"type": "text", "text": "SAME EASY PLANK", "look": "box", "x": 0.72, "y": 0.36, "size": 90, "align": "center", "animation": "words", "boxColor": "#9AA9C9", "at": "the same easy plank"},
   {"type": "text", "text": "= NO CHALLENGE", "look": "pop", "x": 0.72, "y": 0.62, "size": 100, "align": "center", "animation": "words", "color": "#FF4D3D", "at": "stop being challenging"}
  ]},
  {"id": "levelup", "start": "So I started making it harder-0.1", "transition": "zoom", "backdrop": "rays", "backdropColor": "#FF4D3D", "layers": [
   {"type": "image", "asset": "hero_crack_knuckles", "x": 0.27, "shadow": true, "enter": "punch"},
   {"type": "text", "text": "LEVEL UP", "look": "hook", "x": 0.72, "y": 0.45, "size": 150, "align": "center", "animation": "words", "color": "#FF4D3D", "at": "making it harder#1"}
  ]},
  {"id": "tension", "start": "I squeezed my core harder-0.1", "transition": "flash", "backdrop": "grid", "backdropColor": "#FF4D3D", "camera": [{"at": "I squeezed my core harder", "zoom": 1.3, "focus": "abs"}, {"at": "pushed my elbows", "zoom": 1.3, "focus": "elbows"}, {"at": "tightened my legs", "zoom": 1.2, "focus": "thighs"}, {"at": "full-body tension", "zoom": 1, "focus": "body"}], "shakes": [{"at": "full-body tension"}], "layers": [
   {"type": "image", "asset": "hero_plank", "x": 0.5, "y": 0.62, "width": 0.62, "shadow": true},
   {"type": "text", "text": "SQUEEZE CORE", "look": "box", "x": 0.5, "y": 0.14, "size": 90, "align": "center", "animation": "words", "boxColor": "#FF4D3D", "at": "I squeezed my core harder", "until": "pushed my elbows"},
   {"type": "highlight", "anchor": "abs", "color": "#FF4D3D", "at": "I squeezed my core harder", "until": "pushed my elbows"},
   {"type": "text", "text": "PUSH ELBOWS DOWN", "look": "box", "x": 0.5, "y": 0.14, "size": 90, "align": "center", "animation": "words", "boxColor": "#3DDC84", "at": "pushed my elbows", "until": "tightened my legs"},
   {"type": "arrow", "anchor": "elbows", "pointing": "down", "color": "#3DDC84", "at": "pushed my elbows", "until": "tightened my legs"},
   {"type": "text", "text": "TIGHT LEGS", "look": "box", "x": 0.5, "y": 0.14, "size": 90, "align": "center", "animation": "words", "boxColor": "#FFD23F", "at": "tightened my legs", "until": "full-body tension"},
   {"type": "highlight", "anchor": "thighs", "color": "#FFD23F", "at": "tightened my legs", "until": "full-body tension"},
   {"type": "text", "text": "FULL-BODY TENSION", "look": "hook", "x": 0.5, "y": 0.16, "size": 100, "align": "center", "animation": "words", "color": "#FFFFFF", "at": "full-body tension"}
  ]},
  {"id": "day20", "start": "By day 20-0.1", "transition": "zoom", "backdrop": "rays", "backdropColor": "#3DDC84", "camera": [{"at": "My plank felt stronger", "zoom": 1, "focus": "body"}, {"at": "compared to day one", "zoom": 1.2, "focus": "head"}], "layers": [
   {"type": "progress", "label": "DAY 20 / 30", "from": 0.47, "to": 0.67, "x": 0.72, "y": 0.16, "width": 0.42, "color": "#3DDC84", "until": "My plank felt stronger"},
   {"type": "image", "asset": "hero_hands_on_hips", "x": 0.27, "shadow": true, "until": "My plank felt stronger"},
   {"type": "text", "text": "OBVIOUS!", "look": "hook", "x": 0.72, "y": 0.52, "size": 140, "align": "center", "animation": "words", "color": "#3DDC84", "at": "was obvious", "until": "My plank felt stronger"},
   {"type": "image", "asset": "hero_double_biceps", "x": 0.27, "shadow": true, "at": "My plank felt stronger", "enter": "punch"},
   {"type": "text", "text": "STRONGER", "look": "box", "x": 0.72, "y": 0.28, "size": 100, "align": "center", "animation": "words", "boxColor": "#3DDC84", "at": "My plank felt stronger"},
   {"type": "text", "text": "LESS SHAKING", "look": "box", "x": 0.72, "y": 0.5, "size": 100, "align": "center", "animation": "words", "boxColor": "#111111", "at": "my body shook less"},
   {"type": "text", "text": "MORE ENDURANCE", "look": "box", "x": 0.72, "y": 0.72, "size": 100, "align": "center", "animation": "words", "boxColor": "#3DA5FF", "at": "core endurance", "until": "compared to day one"},
   {"type": "text", "text": "VS DAY 1", "look": "hook", "x": 0.72, "y": 0.72, "size": 130, "align": "center", "animation": "words", "color": "#3DDC84", "at": "compared to day one"}
  ]},
  {"id": "day30", "start": "Then came day 30-0.1", "transition": "flash", "backdrop": "rays", "backdropColor": "#FFD23F", "shakes": [{"at": "came day 30"}], "layers": [
   {"type": "image", "asset": "hero_celebrate_jump", "x": 0.27, "shadow": true, "enter": "punch"},
   {"type": "text", "text": "DAY 30", "look": "hook", "x": 0.72, "y": 0.36, "size": 190, "align": "center", "animation": "words", "color": "#FFD23F"},
   {"type": "progress", "label": "", "from": 0.67, "to": 1, "x": 0.72, "y": 0.66, "width": 0.42, "color": "#FFD23F"}
  ]},
  {"id": "truth", "start": "Did I suddenly get-0.1", "transition": "slideLeft", "backdrop": "spotlight", "backdropColor": "#FFD23F", "shakes": [{"at": "No#2"}], "layers": [
   {"type": "image", "asset": "hero_side_chest", "x": 0.27, "shadow": true, "until": "No#2"},
   {"type": "text", "text": "SHREDDED ABS?", "look": "hook", "x": 0.72, "y": 0.45, "size": 110, "align": "center", "animation": "words", "color": "#FFFFFF", "at": "shredded abs", "until": "No#2"},
   {"type": "image", "asset": "hero_stop_palm", "x": 0.27, "shadow": true, "at": "No#2", "until": "Planks alone", "enter": "punch"},
   {"type": "text", "text": "NO!", "look": "hook", "x": 0.72, "y": 0.45, "size": 220, "align": "center", "animation": "words", "color": "#FFFFFF", "at": "No#2", "until": "Planks alone"},
   {"type": "image", "asset": "hero_measuring_waist", "x": 0.27, "shadow": true, "at": "Planks alone", "until": "But after 30 days"},
   {"type": "text", "text": "BURN BELLY FAT", "look": "box", "x": 0.72, "y": 0.36, "size": 100, "align": "center", "animation": "words", "boxColor": "#FFD23F", "at": "burn belly fat", "until": "But after 30 days", "strike": "or reveal"},
   {"type": "text", "text": "SIX-PACK", "look": "box", "x": 0.72, "y": 0.62, "size": 100, "align": "center", "animation": "words", "boxColor": "#111111", "at": "reveal a six-pack", "until": "But after 30 days", "strike": "reveal a six-pack|end"},
   {"type": "image", "asset": "hero_victory", "x": 0.27, "shadow": true, "at": "But after 30 days", "enter": "punch", "motion": {"type": "zoomIn"}},
   {"type": "text", "text": "STRONGER CORE", "look": "box", "x": 0.72, "y": 0.28, "size": 95, "align": "center", "animation": "words", "boxColor": "#3DDC84", "at": "my core felt stronger"},
   {"type": "text", "text": "STABILITY", "look": "box", "x": 0.72, "y": 0.5, "size": 95, "align": "center", "animation": "words", "boxColor": "#3DA5FF", "at": "my stability improved"},
   {"type": "text", "text": "CONTROL", "look": "box", "x": 0.72, "y": 0.72, "size": 95, "align": "center", "animation": "words", "boxColor": "#111111", "at": "control during other exercises"}
  ]},
  {"id": "lesson", "start": "And that's probably-0.1", "transition": "zoom", "backdrop": "dots", "backdropColor": "#FFD23F", "layers": [
   {"type": "image", "asset": "hero_teacher_pointer", "x": 0.27, "shadow": true, "until": "A plank looks simple"},
   {"type": "text", "text": "BIGGEST LESSON", "look": "hook", "x": 0.72, "y": 0.45, "size": 105, "align": "center", "animation": "words", "color": "#FFFFFF", "at": "the biggest lesson", "until": "A plank looks simple"},
   {"type": "image", "asset": "hero_plank", "x": 0.26, "y": 0.62, "width": 0.5, "shadow": true, "at": "A plank looks simple"},
   {"type": "text", "text": "LOOKS SIMPLE", "look": "pop", "x": 0.78, "y": 0.3, "size": 95, "align": "center", "animation": "words", "color": "#FFD23F", "at": "looks simple", "until": "it trains"},
   {"type": "text", "text": "DO IT RIGHT", "look": "box", "x": 0.78, "y": 0.55, "size": 90, "align": "center", "animation": "words", "boxColor": "#3DDC84", "at": "do it correctly", "until": "it trains"},
   {"type": "highlight", "anchor": "shoulders", "color": "#3DDC84", "at": "it trains"},
   {"type": "highlight", "anchor": "glutes", "color": "#3DDC84", "at": "much more than"},
   {"type": "highlight", "anchor": "thighs", "color": "#3DDC84", "at": "much more than+0.3"},
   {"type": "highlight", "anchor": "abs", "color": "#FFD23F", "at": "just your abs"},
   {"type": "text", "text": "FULL BODY!", "look": "hook", "x": 0.78, "y": 0.42, "size": 130, "align": "center", "animation": "words", "color": "#3DDC84", "at": "it trains"}
  ]},
  {"id": "howto", "start": "So if you want-0.1", "transition": "slideLeft", "backdrop": "grid", "backdropColor": "#3DA5FF", "layers": [
   {"type": "image", "asset": "hero_point_viewer", "x": 0.27, "shadow": true, "until": "start with 30", "enter": "punch"},
   {"type": "text", "text": "TRY IT!", "look": "hook", "x": 0.72, "y": 0.45, "size": 160, "align": "center", "animation": "words", "color": "#FFD23F", "at": "try it yourself", "until": "start with 30"},
   {"type": "image", "asset": "hero_plank", "x": 0.26, "y": 0.62, "width": 0.48, "shadow": true, "at": "start with 30", "until": "gradually make it"},
   {"type": "counter", "from": 30, "to": 60, "suffix": " SEC", "look": "hook", "color": "#FFD23F", "x": 0.74, "y": 0.26, "size": 120, "duration": 1.2, "at": "start with 30"},
   {"type": "text", "text": "STRICT FORM", "look": "box", "x": 0.74, "y": 0.5, "size": 95, "align": "center", "animation": "words", "boxColor": "#3DDC84", "at": "keep your form strict"},
   {"type": "image", "asset": "hero_crack_knuckles", "x": 0.27, "shadow": true, "at": "gradually make it", "enter": "punch"},
   {"type": "text", "text": "MAKE IT HARDER", "look": "box", "x": 0.74, "y": 0.74, "size": 95, "align": "center", "animation": "words", "boxColor": "#FF4D3D", "at": "gradually make it harder"}
  ]},
  {"id": "ending", "start": "Because 30 days-0.1", "transition": "flash", "backdrop": "spotlight", "backdropColor": "#3DDC84", "layers": [
   {"type": "image", "asset": "hero_sore_back", "x": 0.27, "width": 0.25, "shadow": true, "until": "That's a completely"},
   {"type": "text", "text": "BAD PLANKS", "look": "box", "x": 0.27, "y": 0.1, "size": 80, "align": "center", "animation": "words", "boxColor": "#FF4D3D", "at": "bad planks", "until": "That's a completely"},
   {"type": "image", "asset": "prop_red_x", "x": 0.42, "y": 0.4, "width": 0.08, "at": "bad planks", "until": "That's a completely"},
   {"type": "text", "text": "WON'T DO MUCH", "look": "pop", "x": 0.72, "y": 0.5, "size": 100, "align": "center", "animation": "words", "color": "#FF4D3D", "at": "won't do much", "until": "But 30 days of proper"},
   {"type": "image", "asset": "hero_double_biceps", "x": 0.73, "width": 0.25, "shadow": true, "at": "proper planks", "until": "That's a completely", "enter": "pop"},
   {"type": "text", "text": "PROPER PLANKS", "look": "box", "x": 0.73, "y": 0.1, "size": 80, "align": "center", "animation": "words", "boxColor": "#3DDC84", "at": "proper planks", "until": "That's a completely"},
   {"type": "image", "asset": "prop_green_check", "x": 0.58, "y": 0.4, "width": 0.08, "at": "proper planks", "until": "That's a completely"},
   {"type": "image", "asset": "hero_thumbs_up", "x": 0.5, "shadow": true, "at": "That's a completely", "enter": "punch"},
   {"type": "text", "text": "DIFFERENT STORY!", "look": "hook", "x": 0.5, "y": 0.1, "size": 110, "align": "center", "animation": "words", "color": "#3DDC84", "at": "different story"}
  ]}
 ],
 "sfx": [
  {"at": "start", "src": "sfx_whoosh_big"},
  {"at": "Planks Every", "src": "sfx_pop"},
  {"at": "Every Day for", "src": "sfx_pop_2"},
  {"at": "for 30 Days#1", "src": "sfx_hammer"},
  {"at": "Here's What Happened", "src": "sfx_whoosh_short"},
  {"at": "What Happened", "src": "sfx_sparkle"},
  {"at": "On day one-0.1", "src": "sfx_whoosh_swipe"},
  {"at": "would be easy", "src": "sfx_ding"},
  {"at": "just a plank", "src": "sfx_pop"},
  {"at": "But after about 30 seconds-0.1", "src": "sfx_whoosh_fast"},
  {"at": "about 30 seconds", "src": "sfx_counter"},
  {"at": "my abs were shaking", "src": "sfx_electric"},
  {"at": "my shoulders were burning", "src": "sfx_whoosh_fire"},
  {"at": "suddenly one minute", "src": "sfx_pop_2"},
  {"at": "felt like five", "src": "sfx_bruh"},
  {"at": "Still, I decided-0.1", "src": "sfx_whoosh_swipe"},
  {"at": "every single day", "src": "sfx_click"},
  {"at": "for 30 days#2", "src": "sfx_counter"},
  {"at": "For the first week-0.1", "src": "sfx_whoosh_soft"},
  {"at": "one thing", "src": "sfx_pop"},
  {"at": "proper form", "src": "sfx_desk_bell"},
  {"at": "Elbows under my shoulders-0.1", "src": "sfx_whoosh_fast"},
  {"at": "body in a straight line", "src": "sfx_click"},
  {"at": "abs tight", "src": "sfx_crush"},
  {"at": "glutes squeezed", "src": "sfx_pop_2"},
  {"at": "my hips drop", "src": "sfx_hammer"},
  {"at": "And honestly-0.1", "src": "sfx_whoosh_short"},
  {"at": "much harder", "src": "sfx_heavy_breathing"},
  {"at": "By day seven-0.1", "src": "sfx_whoosh_swipe"},
  {"at": "started to change", "src": "sfx_magic"},
  {"at": "I wasn't magically", "src": "sfx_swish"},
  {"at": "getting six-pack abs", "src": "sfx_pop"},
  {"at": "abs, but my", "src": "sfx_concrete_break"},
  {"at": "much more stable", "src": "sfx_ding"},
  {"at": "Push-ups felt", "src": "sfx_whoosh_short"},
  {"at": "more controlled", "src": "sfx_pop_2"},
  {"at": "body straighter", "src": "sfx_click"},
  {"at": "without thinking", "src": "sfx_ez"},
  {"at": "During the second week-0.1", "src": "sfx_whoosh_swipe"},
  {"at": "plank time", "src": "sfx_click_soft"},
  {"at": "started improving", "src": "sfx_coin"},
  {"at": "around one minute", "src": "sfx_counter"},
  {"at": "position longer", "src": "sfx_chime"},
  {"at": "with much better control", "src": "sfx_pop"},
  {"at": "But then I noticed-0.1", "src": "sfx_whoosh_fast"},
  {"at": "a problem", "src": "sfx_shocked_2"},
  {"at": "If I just kept", "src": "sfx_swish"},
  {"at": "the same easy plank", "src": "sfx_pop_2"},
  {"at": "stop being challenging", "src": "sfx_snore"},
  {"at": "So I started making it harder-0.1", "src": "sfx_whoosh_fire"},
  {"at": "making it harder#1", "src": "sfx_level_start"},
  {"at": "I squeezed my core harder", "src": "sfx_electric"},
  {"at": "pushed my elbows", "src": "sfx_pop"},
  {"at": "tightened my legs", "src": "sfx_stretch"},
  {"at": "full-body tension", "src": "sfx_thunder"},
  {"at": "By day 20-0.1", "src": "sfx_whoosh_swipe"},
  {"at": "was obvious", "src": "sfx_ding"},
  {"at": "My plank felt stronger", "src": "sfx_rizz"},
  {"at": "my body shook less", "src": "sfx_pop"},
  {"at": "core endurance", "src": "sfx_pop_2"},
  {"at": "compared to day one", "src": "sfx_oh_yeah"},
  {"at": "Then came day 30-0.1", "src": "sfx_whoosh_big"},
  {"at": "Did I suddenly get-0.1", "src": "sfx_whoosh_soft"},
  {"at": "shredded abs", "src": "sfx_pop"},
  {"at": "No#2", "src": "sfx_hammer"},
  {"at": "Planks alone", "src": "sfx_whoosh_short"},
  {"at": "burn belly fat", "src": "sfx_pop_2"},
  {"at": "or reveal", "src": "sfx_concrete_break"},
  {"at": "But after 30 days", "src": "sfx_magic"},
  {"at": "my core felt stronger", "src": "sfx_pop"},
  {"at": "my stability improved", "src": "sfx_pop_2"},
  {"at": "control during other exercises", "src": "sfx_ding"},
  {"at": "And that's probably-0.1", "src": "sfx_whoosh_fast"},
  {"at": "the biggest lesson", "src": "sfx_sparkle"},
  {"at": "A plank looks simple", "src": "sfx_whoosh_short"},
  {"at": "do it correctly", "src": "sfx_chime"},
  {"at": "it trains", "src": "sfx_pop"},
  {"at": "just your abs", "src": "sfx_wow"},
  {"at": "So if you want-0.1", "src": "sfx_whoosh_swipe"},
  {"at": "try it yourself", "src": "sfx_pop_2"},
  {"at": "start with 30", "src": "sfx_counter"},
  {"at": "keep your form strict", "src": "sfx_ding"},
  {"at": "gradually make it harder", "src": "sfx_pop"},
  {"at": "Because 30 days-0.1", "src": "sfx_whoosh_fast"},
  {"at": "bad planks", "src": "sfx_bone_crack"},
  {"at": "won't do much", "src": "sfx_bruh"},
  {"at": "proper planks", "src": "sfx_chime"},
  {"at": "That's a completely", "src": "sfx_gold_bell"}
 ]
}
```

## 10. Worked example 5: "Push-up levels" (9:16, ~40 s)

Script: "What's your push up level? Be honest. Level 1. Zero clean push ups. Knees on the floor. No shame, everyone starts here. Level 2. Ten push ups, chest to the floor, body like a plank. Not ten head nods. Ten real ones. Level 3. Twenty five in a row with perfect form. You're stronger than most people at the gym. Level 4. Ten archer push ups each side. Now one arm is doing most of the work. Level 5. A clean one arm push up. Feet wide, hips square, no twisting. Very few people ever get here. Drop your level in the comments. And if you're Level 1, come back in 60 days. You'll be on Level 3."

Note: one scene per level with a short title; "Level" is spoken 7 times so every time phrase adds the next word ("Level 1 Zero", "Level 3 Twenty"); counters for every number (0→10, 0→25); the mistake ("head nods") shown with hero_facepalm + red X; no archer / one-arm drawing exists, so the push-up pose plus an "ARCHER" sticker, an arrow and a ring on the working arm say it; a burst behind "ONE ARM!"; props at x 0.8; stickers at y 0.36 above the lying H (inside the safe zone); something new every 1–2 s.

```json
{
 "title": "Push up levels",
 "captions": {"mode": "word", "keywords": ["level", "honest", "zero", "ten", "twenty", "archer", "one", "comments", "60"], "bottom": [["Level 1 Zero", "Drop your level"]]},
 "scenes": [
  {"id": "hook", "start": "start", "backdrop": "rays", "backdropColor": "#FFD23F", "shakes": [{"at": "Be honest"}], "layers": [
   {"type": "image", "asset": "hero_point_viewer", "shadow": true, "until": "Be honest", "enter": "punch"},
   {"type": "image", "asset": "hero_smirk", "shadow": true, "at": "Be honest", "enter": "punch", "motion": {"type": "zoomIn"}}
  ]},
  {"id": "level1", "start": "Level 1 Zero-0.1", "transition": "slideLeft", "layers": [
   {"type": "text", "text": "LEVEL 1"},
   {"type": "image", "asset": "hero_beginner", "shadow": true, "until": "No shame", "motion": {"type": "zoomIn"}},
   {"type": "image", "asset": "prop_red_x", "at": "Zero clean", "until": "Knees on the floor", "x": 0.8, "y": 0.38, "width": 0.2},
   {"type": "image", "asset": "prop_yoga_mat", "at": "Knees on the floor", "until": "No shame", "x": 0.5, "y": 0.9, "width": 0.6},
   {"type": "image", "asset": "hero_clapping", "shadow": true, "at": "No shame", "enter": "punch"}
  ]},
  {"id": "level2", "start": "Level 2-0.1", "transition": "slideLeft", "layers": [
   {"type": "text", "text": "LEVEL 2"},
   {"type": "poses", "width": 0.92, "shadow": true, "frames": [{"asset": "hero_pushup_top", "at": "Ten push ups"}, {"asset": "hero_pushup_mid", "at": "chest to the floor"}, {"asset": "hero_pushup_top", "at": "body like a plank"}], "until": "Not ten head nods"},
   {"type": "highlight", "anchor": "chest", "color": "#FF4D3D", "at": "chest to the floor", "until": "body like a plank"},
   {"type": "measure", "from": "feet", "to": "head", "color": "#FFD23F", "at": "body like a plank", "until": "Not ten head nods"},
   {"type": "image", "asset": "hero_facepalm", "shadow": true, "at": "Not ten head nods", "until": "Ten real ones", "enter": "punch"},
   {"type": "image", "asset": "prop_red_x", "at": "head nods", "until": "Ten real ones", "x": 0.8, "y": 0.38, "width": 0.2},
   {"type": "poses", "width": 0.92, "shadow": true, "frames": [{"asset": "hero_pushup_top", "at": "Ten real ones"}, {"asset": "hero_pushup_mid", "at": "real ones"}, {"asset": "hero_pushup_top", "at": "Level 3 Twenty-0.3"}], "at": "Ten real ones"},
   {"type": "counter", "from": 0, "to": 10, "look": "hook", "color": "#3DDC84", "x": 0.5, "y": 0.36, "size": 190, "duration": 0.8, "at": "Ten real ones"}
  ]},
  {"id": "level3", "start": "Level 3 Twenty-0.1", "transition": "slideLeft", "layers": [
   {"type": "text", "text": "LEVEL 3"},
   {"type": "poses", "width": 0.92, "shadow": true, "frames": [{"asset": "hero_pushup_top", "at": "Twenty five"}, {"asset": "hero_pushup_mid", "at": "in a row"}, {"asset": "hero_pushup_top", "at": "with perfect"}, {"asset": "hero_pushup_mid", "at": "perfect form"}], "until": "You're stronger"},
   {"type": "counter", "from": 0, "to": 25, "look": "hook", "color": "#FFD23F", "x": 0.5, "y": 0.36, "size": 190, "duration": 1.4, "at": "Twenty five", "until": "You're stronger"},
   {"type": "measure", "from": "feet", "to": "head", "color": "#3DDC84", "at": "perfect form", "until": "You're stronger"},
   {"type": "image", "asset": "hero_double_biceps", "shadow": true, "at": "You're stronger", "enter": "punch", "motion": {"type": "zoomIn"}}
  ]},
  {"id": "level4", "start": "Level 4-0.1", "transition": "slideLeft", "camera": [{"at": "Level 4", "zoom": 1, "focus": "body"}, {"at": "Now one arm", "zoom": 1.35, "focus": "arms"}], "layers": [
   {"type": "text", "text": "LEVEL 4"},
   {"type": "poses", "width": 0.92, "shadow": true, "frames": [{"asset": "hero_pushup_top", "at": "Ten archer"}, {"asset": "hero_pushup_mid", "at": "push ups each side"}, {"asset": "hero_pushup_top", "at": "each side"}, {"asset": "hero_pushup_mid", "at": "Now one arm"}]},
   {"type": "text", "text": "ARCHER", "look": "box", "boxColor": "#FF4D3D", "x": 0.5, "y": 0.36, "size": 120, "align": "center", "at": "archer push ups", "until": "Now one arm"},
   {"type": "arrow", "anchor": "left_hand", "pointing": "left", "color": "#FFD23F", "at": "each side", "until": "Now one arm"},
   {"type": "highlight", "anchor": "left_arm", "color": "#FF4D3D", "at": "Now one arm"},
   {"type": "text", "text": "ONE ARM WORKS", "look": "box", "boxColor": "#111111", "x": 0.5, "y": 0.34, "size": 100, "align": "center", "at": "most of the work"}
  ]},
  {"id": "level5", "start": "Level 5-0.1", "transition": "flash", "backdrop": "rays", "backdropColor": "#FF4D3D", "shakes": [{"at": "one arm push up"}], "layers": [
   {"type": "text", "text": "LEVEL 5"},
   {"type": "image", "asset": "hero_pushup_top", "shadow": true, "until": "Very few people", "width": 0.92},
   {"type": "text", "text": "ONE ARM!", "look": "hook", "x": 0.5, "y": 0.36, "size": 160, "align": "center", "animation": "words", "color": "#FFFFFF", "at": "one arm push up", "until": "Feet wide"},
   {"type": "highlight", "anchor": "feet", "color": "#3DDC84", "at": "Feet wide", "until": "hips square"},
   {"type": "highlight", "anchor": "hips", "color": "#3DDC84", "at": "hips square", "until": "no twisting"},
   {"type": "image", "asset": "prop_red_x", "at": "no twisting", "until": "Very few people", "x": 0.8, "y": 0.38, "width": 0.2},
   {"type": "image", "asset": "hero_trophy", "shadow": true, "at": "Very few people", "enter": "punch", "motion": {"type": "zoomIn"}}
  ]},
  {"id": "outro", "start": "Drop your level-0.1", "transition": "zoom", "backdrop": "dots", "backdropColor": "#3DA5FF", "layers": [
   {"type": "image", "asset": "hero_point_down", "shadow": true, "until": "And if you're", "enter": "punch"},
   {"type": "image", "asset": "prop_phone", "at": "in the comments", "until": "And if you're", "x": 0.8, "y": 0.4, "width": 0.2, "motion": {"type": "pulse"}},
   {"type": "image", "asset": "hero_beginner", "shadow": true, "at": "And if you're", "until": "You'll be on"},
   {"type": "image", "asset": "prop_calendar", "at": "60 days", "until": "You'll be on", "x": 0.8, "y": 0.4, "width": 0.2, "motion": {"type": "pulse"}},
   {"type": "image", "asset": "hero_victory", "shadow": true, "at": "You'll be on", "enter": "punch"}
  ]}
 ],
 "sfx": [
  {"at": "start", "src": "sfx_whoosh_big"},
  {"at": "push up level", "src": "sfx_pop"},
  {"at": "Be honest", "src": "sfx_hammer"},
  {"at": "Level 1 Zero-0.1", "src": "sfx_whoosh_swipe"},
  {"at": "Zero clean", "src": "sfx_pop"},
  {"at": "Knees on the floor", "src": "sfx_click"},
  {"at": "No shame", "src": "sfx_chime"},
  {"at": "Level 2-0.1", "src": "sfx_whoosh_fast"},
  {"at": "chest to the floor", "src": "sfx_pop_2"},
  {"at": "body like a plank", "src": "sfx_click"},
  {"at": "Not ten head nods", "src": "sfx_bruh"},
  {"at": "Ten real ones", "src": "sfx_counter"},
  {"at": "Level 3 Twenty-0.1", "src": "sfx_whoosh_swipe"},
  {"at": "Twenty five", "src": "sfx_counter"},
  {"at": "perfect form", "src": "sfx_ding"},
  {"at": "You're stronger", "src": "sfx_rizz"},
  {"at": "Level 4-0.1", "src": "sfx_whoosh_fast"},
  {"at": "archer push ups", "src": "sfx_pop"},
  {"at": "each side", "src": "sfx_whoosh_short"},
  {"at": "Now one arm", "src": "sfx_electric"},
  {"at": "Level 5-0.1", "src": "sfx_riser"},
  {"at": "one arm push up", "src": "sfx_thunder"},
  {"at": "Feet wide", "src": "sfx_pop"},
  {"at": "hips square", "src": "sfx_pop_2"},
  {"at": "no twisting", "src": "sfx_hammer"},
  {"at": "Very few people", "src": "sfx_wow"},
  {"at": "Drop your level-0.1", "src": "sfx_whoosh_swipe"},
  {"at": "in the comments", "src": "sfx_notification"},
  {"at": "And if you're", "src": "sfx_whoosh_short"},
  {"at": "60 days", "src": "sfx_few_moments_later"},
  {"at": "You'll be on", "src": "sfx_gold_bell"}
 ]
}
```

## 11. The checker (reel_check.py)

`reel_check.py` (a knowledge file) is the tool's own checker plus a quality check. Run it on every plan before answering:
`python reel_check.py request.txt plan.json` (request.txt = the whole request from the tool). It prints
`ERROR:` lines (the tool would refuse the plan: wrong phrase, repeated phrase, unknown id, until before at…) and `FIX:` lines
(the video would look weak: nothing new for 3 s, sounds too close, text outside the safe zone, 16:9 text without a look, a
ring that outlives its picture, a scene that is too long). Fix all of them and run it again until it prints `ALL CLEAN`.
Times are estimated from the words (about 0.33 s per word); the tool uses the real ones.

## HOOK: the first 3 seconds (every video, no exceptions)

People decide in the first 3 seconds whether they keep watching. The hook must be fast and land before 3 s:
- **Script:** the first sentence IS the hook, 8 words or fewer, spoken in under 3 s: a shocking claim, a number, a question or
  "you're doing X wrong" ("You're doing these five exercises wrong.", "Your wrists look skinny for one reason."). Never a greeting,
  intro, channel name or "in this video".
- **Frame 1:** H AND the hook words are on screen on the very first frame: a `kinetic` line at `"start"` (or a `banner` / `thumb`
  sticker at `"start"`). No empty, slow or fading opening.
- **Speed:** 4 or more visual changes before 3 s: a new pose on the key words (`"enter": "punch"` / `"squash"`), the second hook line,
  a ring or highlight on the body part, a camera punch (zoom 1.3 on the key word) or a `shakes` entry on the strongest word.
- **Sound:** a whoosh or hit at `"start"`, and a hit / meme sound on the strongest hook word.
- The tool also opens the first scene with a quick zoom punch (`"hookPunch": false` turns it off, or give the scene its own `camera`).
- The checker prints `hook:` lines when any of this is missing: fix all of them.

## Motion graphics (no stars)

Stars / bursts are gone: never write a `burst` layer. Pick one main graphic at a time:
- **Hook (first 2 s)** → H on screen from the first frame with a `kinetic` line above him (big words slam in), or a `comment` card ("bro my wrists are so thin"), or a `banner`.
- **Hook word / problem / fix** → `banner` (red problem, green fix, yellow + black text "DO THIS"), or a `box` sticker.
- **Body part named** → `callout` with a 1–2 word label ("BONE", "PALMS DOWN"); a `highlight` ring for pain.
- **Comparison** → `bars`; wrong vs right form → `versus`; before → after (untrained → trained, bad → good posture) → `slider`.
- **List / steps / the plan / myths** → `checklist` (`tick` good, `cross` myth, `number` steps), each item `at` the words that say it.
- **A number** (sets, reps, %, minutes) → `stat` card with an `icon`, or a `ring` with `count`; days / weeks → `timeline` (MON WED FRI, DAY 1 … DAY 30) or `progress`.
- **Objects / ideas** (water, sleep, food, time, phone) → `icon` badge beside H (`x` 0.8, `y` 0.36).
- **Send this to a friend / what people say** → `comment` card or `chat` bubbles.
- **Emphasis on a word or a prop** → `accent` (`lines`, `ripple`, `underline`, `circle`), or `"marker": "<phrase>"` on a text.
- Something designed (card, banner, callout, icon, ring …) at least every ~10 s, and at least one big card per video.

The tool does the layout: while a big card (`checklist`, `bars`, `ring`, `chat`, `versus`, `stat`, `comment`, `timeline`, `slider`)
sits in the top part of the screen, H moves down and gets smaller under it by himself and moves back after; a sticker that would sit on a
card moves below it; captions hide while a card is on. H is ALWAYS on screen: never a scene or a moment with only text. So: H at his normal place, cards at `y` 0.24–0.33.
Keep step titles short (`"until"` 2–3 words later) so captions come back.
Nothing sits on H's face: the tool moves an icon, prop, accent or callout label that would cover his face beside it or below the chin,
but place them away from the head yourself (`x` 0.8 / 0.2, `y` 0.36–0.45 for a standing H; check where his head is in sitting / lying poses).

## Theme, backgrounds, transitions, life

- **Channel brand (Effortless Exercise): always `"theme": "effortless"`** — black, red and neon green on white with Anton letters, like the
  channel's thumbnails. Stickers use `"look": "thumb"` (white box, thick black border, black letters) with the key word in red between stars:
  `"JUST *BONES*?"`, `"*CAN'T* GROW"`. Red = problem / wrong / fat, green `#2FD94E` = right / the fix / the working muscle, black banners for commands.
- `"theme"` (top level) colours every banner, card, ring, callout and background. Brand themes also bring their own fonts:
  `volt` (lime + black, sporty: Bebas Neue / Archivo Black), `blaze` (violet + pink, modern: Unbounded / Dela Gothic One / Space Grotesk),
  `candy` (purple + yellow, playful: Lilita One / Rubik). Colour-only themes: `classic`, `purple`, `coral`, `tomato`, `lime`, `pink`, `gold`,
  `ocean`, `mint`, `royal`, `blackred`. `"font"` (`classic`, `sport`, `modern`, `playful`) changes only the fonts. Pick one per series. Leave `color` out of graphics so the theme decides (give a colour only to say
  wrong / right: red `#E5243B`, green `#1FB47A`).
- Every scene has a pattern behind it (never plain white). Leave `backdrop` out and the tool picks one per scene in the theme colours, or set it:
  `dots`, `grid` (exercise demos), `stripes`, `halftone` (hook, problems), `blobs` (call to action), `notebook` (facts, "the truth"), `plus`,
  `checker`, `waves`, `spotlight`, `rays` (finale only); `backdropColor`, `backdropOpacity` 0.5–2. Never two scenes in a row with the same one.
- Scene `transition`: `slideLeft` for normal steps, and a pattern interrupt about every 8–12 s: `glitch` (a twist, "the truth"), `wipe`
  (new exercise), `circle` (next step), `zoomThrough` (the plan / result), `flash` (call to action).
- H is alive by himself (breathes, small bounce on caption `keywords`). Entrances: `squash` (drops in and squashes; good for a new pose),
  `slam`, `elastic`, `right`, `left`, `up`, `zoom`; vary them.

Layer fields:

| `banner` | ribbon across the screen for a hook word (replaces the old stars): `text`, `y`, `color`, optional `textColor`, `shadowBand` (`"#111111"` = a second band behind), `side` (`left`/`right`, where it wipes in), `tilt`, `size` |
| `callout` | label with a line to a body part: `text` (1–2 words), `anchor`, optional `x`, `y` (where the label sits), `color` |
| `checklist` | card with items that tick on when spoken: `items: [{"text", "at", "mark"}]`, optional `title`, `mark` (`tick` / `cross` = red X + strike / `number` = steps 1 2 3), `y`, `size`, `color` |
| `bars` | bar chart, columns grow and count up: `items: [{"label", "value", "color", "at", "display"}]` (`display` = word instead of the number: "BIG", "TINY"), optional `suffix`, `y`, `height` |
| `ring` | circle that fills (reps, timer, %): `count: {"from": 0, "to": 20}` or `text` in the middle, optional `label` sticker under it ("15-20 REPS"), `duration`, `y`, `size`, `color` |
| `versus` | wrong vs right panels with red X / green tick and a VS badge: `left: {"label": "WRONG", "asset": "...", "at"}`, `right: {"label": "RIGHT", "asset": "...", "at"}`, optional `y`, `height` |
| `chat` | text-message bubbles that pop in: `messages: [{"text", "side": "left"\|"right", "at"}]`, optional `name` (top line, e.g. "BEST FRIEND") |
| `accent` | small hand-drawn emphasis: `kind`: `lines` (3 "!" strokes around a point), `ripple` (rings spreading), `underline`, `circle` (scribbled loop around a word); `x`, `y`, `size`, `color` |
| `icon` | round icon badge: `name` (`dumbbell clock timer fire water calendar heart bolt trophy check cross apple moon scale phone warning arrowUp arrowDown thumbsUp muscle steps brain bed`), optional `label`, `x`, `y`, `size` |
| `stat` | card with a big number: `count: {"from": 0, "to": 3, "suffix": " SETS"}` or `value` ("72%"), `label`, `icon`, `y` |
| `comment` | YouTube-style comment: `text`, optional `user` ("@gymbro_21"), `likes` ("12K"), `ago`, `y` |
| `timeline` | steps that tick on one after another: `steps: [{"label": "DAY 1", "at"}, …]` (2–6), `y` |
| `slider` | before / after with a sliding divider: `before: {"asset", "label"}`, `after: {"asset", "label"}`, `revealAt`, `y`, `height` |
| `kinetic` | big words slamming in, one line at a time: `lines: [{"text": "YOUR WRISTS", "at"}, {"text": "LOOK SKINNY?", "at", "look": "box"}]` (H stays on screen, smaller, below it) |

Sounds: the tool plays a sound for every motion graphic by itself (banner whoosh, tick click, ring counter, comment notification); spend your own sounds on scene changes and meaning.
