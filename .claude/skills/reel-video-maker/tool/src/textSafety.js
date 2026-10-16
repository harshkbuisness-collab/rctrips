// Keeps text readable: text never covers H's face, and two texts never overlap.
// Works on screen rectangles {x0, y0, x1, y1} in canvas px.
import {canvasAnchor} from './anchors.js';
import {cameraPoint, cameraState} from './motion.js';

const overlaps = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

// Text never runs off the screen: the box is limited to the room between its position and the edges,
// and a line that doesn't fit is made smaller (down to 65%) before it wraps.
// Left / right limit for a text at height y (0..1): the whole canvas, or the 9:16 safe zone.
export function textBounds(l, y = l._y ?? l.y) {
  const s = l._safe;
  if (!s) return [0, 1];
  return [s.x0, y > s.notchY ? s.notchX1 : s.x1];
}

export function fitText(l, W) {
  const text = (l.uppercase ? l.text.toUpperCase() : l.text).replace(/\*/g, '');
  const em = (l._wk ?? 1) * (l.look === 'hook' ? 0.52 : ['pop', 'box', 'thumb', 'comic', 'giant', 'outline', 'neon', 'echo'].includes(l.look) ? (['box', 'thumb', 'giant', 'outline', 'neon', 'echo'].includes(l.look) ? 0.56 : 0.47) : l.font === 'display' ? (l.uppercase ? 0.64 : 0.56) : 0.52);
  const [lo, hi] = textBounds(l);
  const room = Math.max(0.2, l.align === 'center' ? 2 * Math.min(l.x - lo, hi - l.x) : l.align === 'right' ? l.x - lo : hi - l.x);
  const boxW = Math.max(W * 0.2, Math.min(l.maxWidth, room * 0.94) * W);
  // a text written on several lines ("\n") is as wide as its longest line
  const full = Math.max(...text.split('\n').map((line) => [...line].length)) * l.size * em;
  const size = full > boxW ? l.size * Math.max(0.65, boxW / full) : l.size;
  return {size, boxW, em, text};
}

// Box of a text layer (estimated from its length: bold display letters are ~0.62 em wide).
export function textRect(l, W, H, y = l.y) {
  const {size, boxW, em, text} = fitText(l, W);
  const rows = text.split('\n');
  const full = Math.max(...rows.map((line) => [...line].length)) * size * em;
  const lines = rows.reduce((n, line) => n + Math.max(1, Math.ceil(([...line].length * size * em) / boxW)), 0);
  const w = Math.min(boxW, full), h = lines * size * 1.08 + (l.stroke?.width ?? 0) * 2;
  const x0 = l.align === 'left' ? l.x * W : l.align === 'right' ? l.x * W - w : l.x * W - w / 2;
  const pad = 14;
  return {x0: x0 - pad, x1: x0 + w + pad, y0: y * H - h / 2 - pad, y1: y * H + h / 2 + pad, h: h + pad * 2};
}

// 9:16: a text is moved inside the safe zone, so the Shorts title, channel name and buttons never cover it.
export function keepInSafeZone(l, W, H) {
  const s = l._safe;
  if (!s) return;
  const clampY = () => {
    const r = textRect(l, W, H, l._y ?? l.y);
    const half = r.h / 2 / H;
    const y = Math.min(Math.max(l._y ?? l.y, s.y0 + half), s.y1 - half);
    l._y = y;
  };
  clampY();
  const [lo, hi] = textBounds(l);
  const {size, em, text} = fitText({...l, x: (lo + hi) / 2}, W);
  const w = Math.min([...text].length * size * em, (hi - lo) * W * 0.94) / W;
  if (l.align === 'center') l.x = Math.min(Math.max(l.x, lo + w / 2), hi - w / 2);
  else if (l.align === 'right') l.x = Math.min(Math.max(l.x, lo + w), hi);
  else l.x = Math.max(Math.min(l.x, hi - w), lo);
  clampY();
}

// Texts of one scene that are on screen at the same time are stacked, never on top of each other.
// `cards` (big motion graphics with a _rect) count as already placed: a sticker on top of a card moves below it.
export function stackTexts(layers, W, H, cards = []) {
  const texts = layers.filter((l) => l.type === 'text' && !l.behind && !['marquee', 'tape'].includes(l.look));
  const placed = [...cards];
  for (const l of texts) {
    if (l._safe) keepInSafeZone(l, W, H);
    let y = l._y ?? l.y;
    for (let tries = 0; tries < texts.length; tries++) {
      const r = textRect(l, W, H, y);
      const hit = placed.find((p) => p._at < l._until && l._at < p._until && overlaps(r, p._rect) && !(l.y < 0.3 && cards.includes(p)));
      if (!hit) break;
      y = (hit._rect.y1 + r.h / 2 + 8) / H;
    }
    l._y = y;
    if (l._safe) keepInSafeZone(l, W, H);
    l._rect = textRect(l, W, H, l._y);
    placed.push(l);
  }
}

// How much the drawing (characters, rings, arrows…) must shrink toward the floor at time t so no
// visible text sits on a character's head. 1 = no change.
function neededScale(ctx, chars, texts, camKeys, captionRect, t) {
  const {W, H} = ctx;
  const rects = texts.filter((l) => t >= l._at && t < l._until).map((l) => l._rect);
  const cap = captionRect(t);
  if (cap) rects.push(cap);
  if (!rects.length) return 1;
  const cam = cameraState(camKeys, t);
  const toScreen = (p) => cameraPoint(cam, p, W, H);
  const px = W / 2, py = H * 0.97; // shrink toward the floor, feet stay put
  const c2 = {...ctx, t};
  let s = 1;
  for (const l of chars) {
    if (t < l._at || t >= l._until) continue;
    const a = canvasAnchor(c2, l, 'head', t);
    if (!a) continue;
    const r = (a.size / 2) * cam.zoom;
    const [hx, hy] = toScreen(a.points[0]);
    const head = {x0: hx - r, x1: hx + r, y0: hy - r * 1.1, y1: hy + r};
    for (const R of rects) {
      // only text at or above the face matters (bottom captions sit on the legs, not the face)
      if (!overlaps(head, R) || hy < R.y0 || head.y0 >= py) continue;
      s = Math.min(s, (py - (R.y1 + 12)) / (py - head.y0));
    }
  }
  return Math.max(0.55, Math.min(1, s));
}

// Smoothed over ±0.4 s so the drawing eases out of the way instead of jumping.
export function faceSafeScale(ctx, chars, texts, camKeys, captionRect) {
  const t = ctx.t;
  let worst = 0;
  for (let d = -0.4; d <= 0.4001; d += 0.05) {
    const w = 1 - Math.abs(d) / 0.45;
    worst = Math.max(worst, (1 - neededScale(ctx, chars, texts, camKeys, captionRect, t + d)) * w);
  }
  return 1 - worst;
}
