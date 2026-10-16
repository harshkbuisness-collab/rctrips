# White-background removal for generated images.
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage


def cutout(src, keep_inner_white=False):
    """Returns an RGBA image with the white background removed.
    Enclosed white areas (e.g. between arm and body) are removed too unless
    keep_inner_white (signs, paper, eggs, clock faces...)."""
    img = Image.open(src).convert('RGB')
    rgb = np.asarray(img).astype(np.int16)
    white = (rgb.min(axis=2) > 228) & (np.ptp(rgb, axis=2) < 18)
    labels, n = ndimage.label(white)
    sizes = ndimage.sum(white, labels, range(1, n + 1))
    border = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))) - {0}
    pocket = 0.0015 * white.size
    bg_ids = [i + 1 for i in range(n) if (i + 1) in border or (not keep_inner_white and sizes[i] > pocket)]
    bg = np.isin(labels, bg_ids)
    alpha = Image.fromarray(np.where(bg, 0, 255).astype(np.uint8))
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    out = img.convert('RGBA')
    out.putalpha(alpha)
    return out
