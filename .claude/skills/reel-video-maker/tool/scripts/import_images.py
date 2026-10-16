# Imports a batch of generated images into the H library:
# removes the white background, mirrors where needed, writes transparent PNGs
# to public/library/hero/ and (re)builds public/library/hero/library.json.
# usage (from reel-engine/): PYTHONPATH=scripts python3 scripts/import_images.py <folder with images> <map module, e.g. hero_batch1_map>
import importlib, json, os, re, sys
from PIL import ImageOps

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'tools'))
from cutout import cutout
from make_prompt_list import items as SET1, props as PROPS1
from make_prompt_list_2 import exercises, creative, faces
from make_prompt_list_3 import items as SET3

OUT = 'public/library/hero'
# white areas inside these images are part of the drawing, not background
KEEP_INNER_WHITE = ('hero_blank_sign', 'hero_clipboard', 'hero_writing_notes', 'prop_eggs', 'prop_calendar',
                    'prop_stopwatch', 'prop_alarm_clock', 'prop_weighing_scale', 'prop_phone')

EXTRA_DESC = {
  'hero_stand': 'standing straight, front view, arms down, fists clenched, serious',
  'hero_slumped': 'standing with feet wide, shoulders slumped, arms hanging, tired',
  'hero_squat_mid': 'half squat, side view, arms stretched forward',
  'hero_squat_front': 'half squat, front view, fists together at the chest, straining',
  'hero_curl_alternate': 'standing, one dumbbell curled up and the other down',
  'hero_deadlift_mid': 'barbell deadlift halfway: knees bent, bar at knee height, side view',
  'hero_lying_topdown': 'lying flat on his back seen from above, arms by his sides',
  'hero_lying_topdown_hands_head': 'lying on his back seen from above, hands behind his head',
  'hero_reverse_crunch': 'lying on his back pulling both knees toward his chest',
  'hero_lean_confident': 'dynamic confident pose leaning to one side, one hand on hip',
  'hero_hands_on_hips': 'standing with both hands on hips, front view, serious',
  'hero_drink_bottle': 'drinking from a water bottle',
  'hero_this_big': 'arms spread slightly with open palms, showing size',
  'hero_what': 'arms down and out, palms open, mouth open: "what?!" reaction',
  'hero_run_start': 'leaning forward into a run, side view, about to sprint',
  'hero_three_quarter': 'standing relaxed, three-quarter view',
  'hero_sleepy_standing': 'comedy: asleep while standing, head resting on his folded hands, knees bent',
  'hero_front_lever': 'hanging from a bar with straight arms, body horizontal (lever)',
  'hero_pushup_leg_raise': 'high plank on hands with one straight leg raised high behind him',
  'hero_dumbbell_hold': 'standing relaxed holding one dumbbell at his side',
}


def descriptions():
    d = {}
    for i, view, pose in SET1 + exercises + creative + SET3:
        d[i] = pose.replace('*edit:* ', '')
    for i, obj in PROPS1:
        d[i] = obj
    for i, expr in faces:
        d[f'hero_{i}'] = 'face close-up: ' + expr
    d.update(EXTRA_DESC)
    return d


def main(folder, map_name):
    MAP = importlib.import_module(map_name).MAP
    files = sorted(os.path.relpath(os.path.join(r, f), folder) for r, _, fs in os.walk(folder) for f in fs)
    assert len(files) == len(MAP), f'{map_name} describes {len(MAP)} files, folder has {len(files)}'
    os.makedirs(OUT, exist_ok=True)
    desc = descriptions()
    lib_file = f'{OUT}/library.json'
    lib = json.load(open(lib_file, encoding='utf-8')) if os.path.exists(lib_file) else {'assets': []}
    assets = {a['id']: a for a in lib['assets']}
    for idx, target in MAP.items():
        if not target:
            continue
        aid, _, flag = target.partition('!')
        if aid.startswith('+'):  # another drawing of an existing pose -> next free _vN
            base_id, n = aid[1:], 2
            while f'{base_id}_v{n}' in assets or (n == 1 and base_id in assets):
                n += 1
            aid = base_id if base_id not in assets else f'{base_id}_v{n}'
        im = cutout(os.path.join(folder, files[idx]), aid.startswith(KEEP_INNER_WHITE))
        if flag == 'flip':
            im = ImageOps.mirror(im)
        if aid.startswith('prop_'):
            im = im.crop(im.getbbox())  # props: trim to the object
        # characters keep their full canvas so pose pairs stay aligned
        im.save(f'{OUT}/{aid}.webp', 'WEBP', quality=88, method=4)
        base = re.sub(r'_v\d+$', '', aid)
        text = desc.get(base, '')
        if base != aid:
            text += ' (alternative drawing)'
        kind = 'image'
        tags = ['hero'] if aid.startswith('hero_') else ['prop']
        assets[aid] = {'id': aid, 'file': f'{aid}.webp', 'kind': kind,
                       'description': ('H: ' if aid.startswith('hero_') else '') + text, 'tags': tags}
        if not text:
            print('no description for', aid)
    lib['assets'] = sorted(assets.values(), key=lambda a: a['id'])
    json.dump(lib, open(lib_file, 'w', encoding='utf-8'), indent=2)
    print(len(lib['assets']), 'assets in', lib_file)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
