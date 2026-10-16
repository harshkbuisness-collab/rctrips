# Adds size, bbox, silhouette area and body points to every image in a
# library.json. Safe to re-run; only images missing data are processed
# unless --all is given.
# usage: python3 tools/measure_library.py public/library/hero/library.json [--all]
import json, os, sys
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from body_points import body_points


def measure(path, want_points):
    im = Image.open(path)
    out = {}
    if im.mode != 'RGBA':
        return out
    alpha = np.asarray(im.getchannel('A')) > 128
    h, w = alpha.shape
    ys, xs = np.nonzero(alpha)
    out['size'] = [w, h]
    out['bbox'] = [round(xs.min() / w, 4), round(ys.min() / h, 4), round((xs.max() + 1) / w, 4), round((ys.max() + 1) / h, 4)]
    out['area'] = round(float(alpha.mean()), 5)
    if want_points:
        pts = body_points(im)
        if pts:
            out['points'] = pts
    return out


if __name__ == '__main__':
    lib_file = sys.argv[1]
    redo = '--all' in sys.argv
    lib = json.load(open(lib_file, encoding='utf-8'))
    base = os.path.dirname(lib_file)
    done = 0
    for a in lib['assets']:
        is_char = a['id'].startswith('hero_') and a.get('kind', 'image') == 'image'
        if not redo and 'area' in a and (not is_char or 'points' in a or a.get('noPoints')):
            continue
        m = measure(os.path.join(base, a['file']), is_char)
        a.update(m)
        if is_char and 'points' not in m:
            a['noPoints'] = True
        done += 1
    json.dump(lib, open(lib_file, 'w', encoding='utf-8'), indent=2)
    with_pts = sum(1 for a in lib['assets'] if 'points' in a)
    print(f'measured {done}; {with_pts} images have body points')
