# Adds one image to a library: removes the white background, saves WebP,
# measures it and finds body points (characters only).
# usage: python3 tools/import_one.py <image> <library dir> <id> <character|prop> [description]
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from cutout import cutout
from measure_library import measure

src, lib_dir, aid, kind = sys.argv[1:5]
desc = sys.argv[5] if len(sys.argv) > 5 else aid.replace('_', ' ')
keep_white = any(k in aid for k in ('sign', 'clipboard', 'notes', 'paper', 'egg', 'calendar', 'clock', 'stopwatch', 'scale', 'phone'))
im = cutout(src, keep_white)
if kind == 'prop':
    im = im.crop(im.getbbox())
os.makedirs(lib_dir, exist_ok=True)
fname = f'{aid}.webp'
im.save(os.path.join(lib_dir, fname), 'WEBP', quality=88, method=4)
lib_file = os.path.join(lib_dir, 'library.json')
lib = json.load(open(lib_file, encoding='utf-8')) if os.path.exists(lib_file) else {'assets': []}
entry = {'id': aid, 'file': fname, 'kind': 'image', 'description': desc, 'tags': [kind]}
entry.update(measure(os.path.join(lib_dir, fname), kind == 'character'))
if kind == 'character' and 'points' not in entry:
    entry['noPoints'] = True
lib['assets'] = [a for a in lib['assets'] if a['id'] != aid] + [entry]
lib['assets'].sort(key=lambda a: a['id'])
json.dump(lib, open(lib_file, 'w', encoding='utf-8'), indent=2)
print(json.dumps({'id': aid, 'points': 'points' in entry}))
