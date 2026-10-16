// Enter/exit/idle motion presets. Enter presets are ported from the
// ai-reel-generator `exactEnter()` and return plain numbers so they can be
// stacked with layer placement, idle motion and camera.
import {Easing, interpolate, random} from 'remotion';
import {animOf} from './schema.js';

export const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);

export const IDENTITY = {x: 0, y: 0, scale: 1, scaleX: 1, rot: 0, opacity: 1, blur: 0};

// p: 0 → hidden, 1 → fully in. Offsets are in canvas px.
export function enterFx(kind, p) {
  const q = 1 - p;
  const wave = Math.sin(clamp01(p) * Math.PI);
  switch (kind) {
    case 'cut': return {};
    case 'fade': return {opacity: p};
    case 'up': return {opacity: p, y: 70 * q};
    case 'down': return {opacity: p, y: -70 * q};
    case 'left': return {opacity: p, x: -120 * q};
    case 'right': return {opacity: p, x: 120 * q};
    case 'pop': return {opacity: Math.min(1, p * 2), scale: 0.6 + 0.4 * p + 0.12 * wave};
    // a quick hit, not a grow-from-small: starts at 85% and kicks slightly past full size
    case 'punch': return {opacity: Math.min(1, p * 4), scale: 0.85 + 0.15 * p + 0.07 * wave};
    case 'slam': return {opacity: Math.min(1, p * 2), y: -140 * q, scale: 1.3 - 0.3 * p};
    case 'zoom': return {opacity: p, scale: 1.6 - 0.6 * p, blur: 6 * q};
    case 'blur': return {opacity: p, scale: 0.92 + 0.08 * p, blur: 14 * q};
    case 'elastic': return {opacity: Math.min(1, p * 2), scale: 0.5 + 0.5 * p + 0.18 * wave, rot: -3 * q};
    case 'smear': return {opacity: p, x: -140 * q, scaleX: 1 + 0.6 * q, blur: 10 * q};
    // fast slide-in stretched along the move, then a squash on landing and a spring back (ghost copies: Placed)
    case 'whip': {
      const go = clamp01(p / 0.45), land = Math.sin(clamp01((p - 0.45) / 0.55) * Math.PI);
      const r = 1 - easeOut(go);
      return {opacity: Math.min(1, p * 6), x: -320 * r, scaleX: 1 + 0.35 * r + 0.1 * land, scale: 1 - 0.07 * land, blur: 6 * r};
    }
    // drops in from above and squashes on landing, then springs back
    case 'squash': {
      const land = Math.sin(clamp01((p - 0.45) / 0.55) * Math.PI);
      return {opacity: Math.min(1, p * 4), y: -260 * Math.pow(clamp01(1 - p / 0.45), 2), scaleX: 1 + 0.16 * land, scale: 1 - 0.1 * land};
    }
    case 'flyLeft': return {x: -1400 * q};
    case 'flyRight': return {x: 1400 * q};
    case 'flyUp': return {y: 2200 * q};
    case 'flyDown': return {y: -2200 * q};
    default: return {opacity: p};
  }
}

const merge = (a, b) => ({
  x: a.x + (b.x ?? 0),
  y: a.y + (b.y ?? 0),
  scale: a.scale * (b.scale ?? 1),
  scaleX: a.scaleX * (b.scaleX ?? 1),
  rot: a.rot + (b.rot ?? 0),
  opacity: a.opacity * (b.opacity ?? 1),
  blur: a.blur + (b.blur ?? 0),
});

// Combined enter + exit state of a layer living in [at, until] at time t (seconds).
export function lifeFx(t, at, until, enter, exit) {
  const e = animOf(enter, 0.3);
  const x = animOf(exit, 0.2);
  let fx = {...IDENTITY};
  if (e.duration > 0 && t < at + e.duration) {
    fx = merge(fx, enterFx(e.type, easeOut(clamp01((t - at) / e.duration))));
  }
  if (x.duration > 0 && t > until - x.duration) {
    fx = merge(fx, enterFx(x.type, easeOut(clamp01((until - t) / x.duration))));
  }
  return fx;
}

// Idle motion across the layer's whole life (Ken Burns style).
export function idleFx(motion, t, at, until, seed = 0) {
  if (!motion || motion.type === 'none') return {};
  const amount = motion.amount ?? 1;
  const p = clamp01((t - at) / Math.max(0.001, until - at));
  const local = t - at;
  switch (motion.type) {
    case 'zoomIn': return {scale: 1 + 0.12 * amount * easeInOut(p)};
    case 'zoomOut': return {scale: 1 + 0.12 * amount * (1 - easeInOut(p))};
    case 'float': return {y: Math.sin(local * 2.2 + seed) * 12 * amount};
    case 'pulse': return {scale: 1 + Math.sin(local * 6) * 0.03 * amount};
    case 'driftLeft': return {x: -80 * amount * p};
    case 'driftRight': return {x: 80 * amount * p};
    case 'shake': return shakeOffset(local, 10 * amount, seed);
    default: return {};
  }
}

export function shakeOffset(local, intensity, seed = 0) {
  const step = Math.floor(local * 30);
  return {
    x: (random(`sx-${seed}-${step}`) - 0.5) * 2 * intensity,
    y: (random(`sy-${seed}-${step}`) - 0.5) * 2 * intensity,
    rot: (random(`sr-${seed}-${step}`) - 0.5) * intensity * 0.12,
  };
}

export const withIdle = (fx, idle) => merge(fx, idle);

export function fxStyle(fx) {
  return {
    opacity: fx.opacity,
    transform: `translate3d(${fx.x}px,${fx.y}px,0) rotate(${fx.rot}deg) scale(${fx.scale}) scaleX(${fx.scaleX})`,
    filter: fx.blur > 0.05 ? `blur(${fx.blur}px)` : undefined,
  };
}

// Camera keyframes: [{at, zoom, focus:[fx,fy]}] → CSS transform for the scene layer stack.
// zoom + focus point (0..1) of the camera at time t
export function cameraState(keys, t) {
  if (!keys || !keys.length) return {zoom: 1, fx: 0.5, fy: 0.5};
  const sorted = [...keys].sort((a, b) => a.at - b.at);
  const times = sorted.map((k) => k.at);
  for (let i = 1; i < times.length; i++) if (times[i] <= times[i - 1]) times[i] = times[i - 1] + 0.001;
  const pick = (getter) => (sorted.length === 1 ? getter(sorted[0])
    : interpolate(t, times, sorted.map(getter), {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut}));
  return {zoom: pick((k) => k.zoom ?? 1), fx: pick((k) => (k.focus ?? [0.5, 0.5])[0]), fy: pick((k) => (k.focus ?? [0.5, 0.5])[1])};
}

export function cameraTransform(keys, t, width, height) {
  if (!keys || !keys.length) return undefined;
  const sorted = [...keys].sort((a, b) => a.at - b.at);
  const times = sorted.map((k) => k.at);
  const pick = (getter) => {
    if (sorted.length === 1) return getter(sorted[0]);
    return interpolate(t, times, sorted.map(getter), {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut});
  };
  // interpolate needs strictly increasing input; nudge duplicates
  for (let i = 1; i < times.length; i++) if (times[i] <= times[i - 1]) times[i] = times[i - 1] + 0.001;
  const zoom = pick((k) => k.zoom ?? 1);
  const fx = pick((k) => (k.focus ?? [0.5, 0.5])[0]);
  const fy = pick((k) => (k.focus ?? [0.5, 0.5])[1]);
  const {tx, ty} = cameraShift({zoom, fx, fy}, width, height);
  return `translate(${tx}px, ${ty}px) scale(${zoom})`;
}

// The camera zooms INTO the focus point and only drifts it part of the way to the centre as it zooms
// (zoom 1 = no move at all), so a character placed on one side of a wide frame stays on that side.
const pull = (zoom) => Math.max(0, (zoom - 1) / zoom) * 0.8;
export function cameraShift({zoom, fx, fy}, width, height) {
  const k = zoom + pull(zoom) - 1;
  return {tx: (0.5 - fx) * width * k, ty: (0.5 - fy) * height * k};
}
// canvas point -> where the camera shows it (transform origin = centre of the frame)
export function cameraPoint(cam, [x, y], width, height) {
  const {tx, ty} = cameraShift(cam, width, height);
  return [width / 2 + tx + cam.zoom * (x - width / 2), height / 2 + ty + cam.zoom * (y - height / 2)];
}

export function transitionFx(type, p, width, height) {
  const q = 1 - easeOut(clamp01(p));
  switch (type) {
    case 'fade': return {opacity: 1 - q};
    case 'slideLeft': return {transform: `translateX(${width * q}px)`};
    case 'slideRight': return {transform: `translateX(${-width * q}px)`};
    case 'slideUp': return {transform: `translateY(${height * q}px)`};
    case 'zoom': return {opacity: 1 - q, transform: `scale(${1 + 0.25 * q})`};
    // a quick punch-in with motion blur, and a slide with motion blur
    case 'zoomBlur': return {opacity: 1 - q * 0.6, transform: `scale(${1 + 0.32 * q})`, filter: q > 0.01 ? `blur(${q * 16}px)` : undefined};
    case 'slideBlur': return {transform: `translateX(${width * q}px)`, filter: q > 0.01 ? `blur(${q * 12}px)` : undefined};
    // a camera whip-pan: the new scene rushes in sideways, tilted and smeared
    case 'whip': return {transform: `translateX(${width * 1.1 * q}px) rotate(${-6 * q}deg) skewX(${-12 * q}deg)`, filter: q > 0.01 ? `blur(${q * 34}px)` : undefined};
    default: return {};
  }
}
