# One-off prep for the main character: removes the white background and makes
# detail crops + highlight masks from the single full-body drawing.
# usage: python3 scripts/cutout_hero.py <source image> public/library/hero
import sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

src, out = sys.argv[1], sys.argv[2]
rgb = np.asarray(Image.open(src).convert('RGB')).astype(np.int16)
h, w, _ = rgb.shape

# near-white pixels that connect to the border (or form big pockets, e.g. between arm and body) = background
white = (rgb.min(axis=2) > 228) & (np.ptp(rgb, axis=2) < 18)
labels, n = ndimage.label(white)
sizes = ndimage.sum(white, labels, range(1, n + 1))
border = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))) - {0}
bg = np.isin(labels, [i + 1 for i in range(n) if (i + 1) in border or sizes[i] > 1500])
alpha = Image.fromarray(np.where(bg, 0, 255).astype(np.uint8))
alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))  # trim white fringe, soften edge
img = Image.open(src).convert('RGBA')
img.putalpha(alpha)
box = img.getbbox()
img = img.crop(box)
img.save(f'{out}/hero_stand.png')
a = np.asarray(img)[:, :, 3]
H, W = a.shape
print('cutout', W, H, 'bbox', box)

def save_crop(name, l, t, r, b):
    img.crop((l, t, r, b)).save(f'{out}/{name}.png')

def save_mask(name, keep):
    m = np.zeros((H, W, 4), np.uint8)
    m[..., :3] = 255
    m[..., 3] = np.where(keep, a, 0)
    Image.fromarray(m).save(f'{out}/{name}.png')

yy, xx = np.mgrid[0:H, 0:W]
fx, fy = W / 682, H / 1024  # mask regions are measured on the 682x1024 source
X = lambda v: (v - box[0])
Y = lambda v: (v - box[1])
save_mask('hero_mask_legs', yy > Y(585))
save_mask('hero_mask_arms', ((xx < X(212)) | (xx > X(470))) & (yy > Y(215)) & (yy < Y(560)))
save_crop('hero_face', X(270), Y(40), X(415), Y(200))
save_crop('hero_abs', X(220), Y(220), X(465), Y(430))
save_crop('hero_arm', X(110), Y(190), X(240), Y(560))
save_crop('hero_legs', X(140), Y(560), X(545), Y(1000))
