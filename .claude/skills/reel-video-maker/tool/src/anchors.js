// Body-part anchors: lets a timeline say "hips" or "left_hand" instead of
// canvas coordinates. Body points come from tools/body_points.py (stored in
// library.json as 0..1 of the image); this file turns them into canvas pixels
// for the layer that shows the character, including its motion.
import {idleFx, lifeFx, withIdle} from './motion.js';

const lerp = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const mid = (a, b) => lerp(a, b, 0.5);
export const aspectOf = (m) => (m?.size ? m.size[1] / m.size[0] : 1);

// name -> (points) => [image points], size (ring diameter in torso lengths)
const DEFS = {
  head: [(p) => [lerp(mid(p.shoulder_l, p.shoulder_r), p.nose, 1.25)], 0.9],
  face: [(p) => [p.nose], 0.6],
  neck: [(p) => [lerp(mid(p.shoulder_l, p.shoulder_r), p.nose, 0.45)], 0.5],
  shoulders: [(p) => [p.shoulder_l, p.shoulder_r], 0.55],
  chest: [(p) => [lerp(mid(p.shoulder_l, p.shoulder_r), mid(p.hip_l, p.hip_r), 0.22)], 0.95],
  back: [(p) => [lerp(mid(p.shoulder_l, p.shoulder_r), mid(p.hip_l, p.hip_r), 0.3)], 1.0],
  upper_back: [(p) => [lerp(mid(p.shoulder_l, p.shoulder_r), mid(p.hip_l, p.hip_r), 0.15)], 0.75],
  // one ring per shoulder blade: between each shoulder and the spine, a little lower
  shoulder_blades: [(p) => {
    const top = mid(p.shoulder_l, p.shoulder_r), low = mid(p.hip_l, p.hip_r);
    return [lerp(lerp(p.shoulder_l, top, 0.4), lerp(p.hip_l, low, 0.4), 0.17), lerp(lerp(p.shoulder_r, top, 0.4), lerp(p.hip_r, low, 0.4), 0.17)];
  }, 0.42],
  abs: [(p) => [lerp(mid(p.shoulder_l, p.shoulder_r), mid(p.hip_l, p.hip_r), 0.62)], 0.85],
  hips: [(p) => [mid(p.hip_l, p.hip_r)], 0.85],
  arms: [(p) => [mid(p.shoulder_l, p.elbow_l), mid(p.shoulder_r, p.elbow_r)], 0.55],
  elbows: [(p) => [p.elbow_l, p.elbow_r], 0.4],
  forearms: [(p) => [mid(p.elbow_l, p.wrist_l), mid(p.elbow_r, p.wrist_r)], 0.45],
  hands: [(p) => [p.wrist_l, p.wrist_r], 0.45],
  thighs: [(p) => [mid(p.hip_l, p.knee_l), mid(p.hip_r, p.knee_r)], 0.65],
  knees: [(p) => [p.knee_l, p.knee_r], 0.45],
  calves: [(p) => [mid(p.knee_l, p.ankle_l), mid(p.knee_r, p.ankle_r)], 0.5],
  feet: [(p) => [p.ankle_l, p.ankle_r], 0.5],
};
const ALIASES = {
  core: 'abs', stomach: 'abs', belly: 'abs', glutes: 'hips', butt: 'hips', hip: 'hips', waist: 'hips',
  arm: 'arms', biceps: 'arms', bicep: 'arms', triceps: 'arms', elbow: 'elbows', forearm: 'forearms',
  hand: 'hands', wrist: 'hands', wrists: 'hands', fist: 'hands', fists: 'hands',
  legs: 'thighs', leg: 'thighs', thigh: 'thighs', quads: 'thighs', hamstrings: 'thighs',
  knee: 'knees', calf: 'calves', shins: 'calves', shin: 'calves',
  foot: 'feet', heels: 'feet', heel: 'feet', ankles: 'feet', ankle: 'feet', toes: 'feet',
  shoulder: 'shoulders', traps: 'shoulders', pecs: 'chest', lats: 'back', spine: 'back',
  shoulder_blade: 'shoulder_blades', blades: 'shoulder_blades', scapula: 'shoulder_blades', scapulae: 'shoulder_blades', upperback: 'upper_back',
};
// rough positions (0..1 of the drawn bbox height) when an image has no body points
const FALLBACK_Y = {head: 0.07, face: 0.08, neck: 0.15, shoulders: 0.2, chest: 0.27, back: 0.3, upper_back: 0.22, shoulder_blades: 0.24, abs: 0.4, hips: 0.5,
  arms: 0.3, elbows: 0.36, forearms: 0.42, hands: 0.5, thighs: 0.63, knees: 0.73, calves: 0.83, feet: 0.96};

const TWO_SIDED = new Set(['shoulder_blades', 'shoulders', 'arms', 'elbows', 'forearms', 'hands', 'thighs', 'knees', 'calves', 'feet']);

export const ANCHOR_NAMES = [...Object.keys(DEFS), ...Object.keys(ALIASES), 'body'];

// "left_hand", "hand_left", "hand_l", "right knee" -> {base: 'hands', side: 'left'|'right'|null}
export function parseAnchor(name) {
  const tokens = String(name).toLowerCase().replace(/[^a-z]+/g, ' ').trim().split(' ');
  let side = null;
  const rest = tokens.filter((t) => {
    if (t === 'left' || t === 'l') return !(side = 'left');
    if (t === 'right' || t === 'r') return !(side = 'right');
    return true;
  });
  const word = rest.join('_');
  const base = word === 'body' ? 'body' : DEFS[word] ? word : ALIASES[word];
  return base ? {base, side} : null;
}

// Anchor -> {points: [[x, y] 0..1 of the image], size: diameter in image px}
export function imageAnchor(meta, name) {
  const a = parseAnchor(name);
  if (!a || !meta) return null;
  const [iw, ih] = meta.size ?? [1, 1];
  const [x0, y0, x1, y1] = meta.bbox ?? [0, 0, 1, 1];
  const p = meta.points;
  if (a.base === 'body') return {points: [[(x0 + x1) / 2, (y0 + y1) / 2]], size: Math.max((x1 - x0) * iw, (y1 - y0) * ih)};
  let points, unit;
  const [fn, k] = DEFS[a.base];
  if (p) {
    points = fn(p);
    const sm = mid(p.shoulder_l, p.shoulder_r), hm = mid(p.hip_l, p.hip_r);
    unit = Math.hypot((sm[0] - hm[0]) * iw, (sm[1] - hm[1]) * ih) || (y1 - y0) * ih * 0.28;
  } else {
    const y = y0 + (y1 - y0) * (FALLBACK_Y[a.base] ?? 0.5);
    const cx = (x0 + x1) / 2, dx = (x1 - x0) * 0.22;
    points = TWO_SIDED.has(a.base) ? [[cx - dx, y], [cx + dx, y]] : [[cx, y]];
    unit = (y1 - y0) * ih * 0.28;
  }
  if (a.side && points.length > 1) {
    // "left" = left side of the screen, whatever way he faces
    const sorted = [...points].sort((u, v) => u[0] - v[0]);
    points = [a.side === 'left' ? sorted[0] : sorted[sorted.length - 1]];
  }
  return {points, size: unit * k};
}

export function layerFx(ctx, layer, index) {
  const fx = lifeFx(ctx.t, layer._at, layer._until, layer.enter ?? 'pop', layer.exit);
  return withIdle(fx, idleFx(layer.motion, ctx.t, layer._at, layer._until, index));
}

export const sortedFrames = (layer) => [...layer.frames].sort((a, b) => a.at - b.at);

// Placement of pose frame i inside the box of frame 0 (px). With autoAlign every
// frame is scaled to frame 0's silhouette size and its bottom center is pinned.
export function posePlacement(ctx, layer, frames, i) {
  const w = layer.width * ctx.W;
  const base = ctx.meta(frames[0].asset);
  const m = ctx.meta(frames[i].asset);
  if (i === 0 || !layer.autoAlign || !base?.area || !m?.area || !base.bbox || !m.bbox) return {width: w, left: 0, top: 0};
  // a thin pose (hanging, side view) has less area than a standing one: limit the size change so it isn't blown up and cut off
  const scale = Math.max(0.8, Math.min(1.2, Math.sqrt((base.area * aspectOf(base)) / (m.area * aspectOf(m)))));
  const wi = w * scale;
  const foot = (mm, ww) => [((mm.bbox[0] + mm.bbox[2]) / 2) * ww, mm.bbox[3] * ww * aspectOf(mm)];
  const [bx, by] = foot(base, w);
  const [fx, fy] = foot(m, wi);
  return {width: wi, left: bx - fx, top: by - fy};
}

// The asset a character layer shows at time t and a function mapping image
// points (0..1) of that asset to canvas px.
export function targetView(ctx, target, t = ctx.t) {
  const w = target.width * ctx.W;
  let asset = target.asset, place = {width: w, left: 0, top: 0}, boxH;
  if (target.type === 'poses') {
    const frames = sortedFrames(target);
    let i = 0;
    frames.forEach((f, k) => { if (f.at <= t + 1e-6) i = k; });
    asset = frames[i].asset;
    place = posePlacement(ctx, target, frames, i);
    boxH = w * aspectOf(ctx.meta(frames[0].asset));
  }
  const meta = ctx.meta(asset);
  boxH = boxH ?? w * aspectOf(meta);
  const fx = layerFx(ctx, target, target._index ?? 0);
  const cx = (target.x ?? 0.5) * ctx.W, cy = (target.y ?? 0.5) * ctx.H;
  const s = fx.scale * fx.scaleX;
  const toCanvas = ([px, py]) => {
    const ix = target.flipX ? 1 - px : px;
    const lx = place.left + ix * place.width;
    const ly = place.top + py * place.width * aspectOf(meta);
    return [cx + (lx - w / 2) * s + fx.x, cy + (ly - boxH / 2) * fx.scale + fx.y];
  };
  return {asset, meta, toCanvas, pxPerImagePx: (place.width / (meta?.size?.[0] ?? 1)) * fx.scale};
}

// Anchor on a character layer -> {points: [[X, Y] canvas px], size: px}
export function canvasAnchor(ctx, target, name, t) {
  if (!target) return null;
  const view = targetView(ctx, target, t);
  const a = imageAnchor(view.meta, name);
  if (!a) return null;
  return {points: a.points.map(view.toCanvas), size: a.size * view.pxPerImagePx, view, imagePoints: a.points};
}

export const centroid = (pts) => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
