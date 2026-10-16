// Where the motion graphics sit and when their parts appear. Shared by the renderer (graphics.jsx),
// the auto layout (H moves down under a card, stickers move off it) and the automatic sounds,
// so all of them agree. Plain JS, no React.

// Cards and charts that need a big part of the screen: H goes small at the bottom while one is on.
export const BIG_GRAPHICS = new Set(['checklist', 'bars', 'ring', 'chat', 'versus', 'stat', 'comment', 'timeline', 'slider', 'kinetic']);
export const MOTION_GRAPHICS = new Set([...BIG_GRAPHICS, 'banner', 'callout', 'accent', 'icon', 'counter', 'progress', 'chip', 'glow', 'path']);

// Box (centre cx, cy, size w x h px) moved inside the 9:16 safe zone, so app buttons never cover it.
export function inSafe(safe, W, H, cx, cy, w, h) {
  if (!safe) return [cx, cy];
  const s = safe;
  const y = Math.min(Math.max(cy, s.y0 * H + h / 2), s.y1 * H - h / 2);
  // beside the like / comment buttons the zone is narrower; a wide card stays centred and only keeps off the edges
  const narrow = y + h / 2 > s.notchY * H && w <= (s.notchX1 - s.x0) * W * 0.9;
  const right = (narrow ? s.notchX1 : s.x1) * W;
  const x = Math.min(Math.max(cx, s.x0 * W + w / 2), right - w / 2);
  return [x, y];
}

const safeWidth = (safe, W) => (safe ? (safe.x1 - safe.x0) * W : W * 0.92);
const commentLines = (l, w) => Math.max(1, Math.ceil((l.text.length * l.size * 0.5) / Math.max(200, w - l.size * 3)));
const kineticSize = (line, l, W) => {
  const size = line.size ?? l.size;
  const fit = (W * 0.8) / Math.max(1, line.text.length * 0.5 * (l._wk ?? 1));
  return Math.min(size, fit);
};

// Size of a graphic in px, before it is moved into the safe zone. null = not a card.
export function graphicSize(l, W, H, safe) {
  switch (l.type) {
    case 'checklist': return {w: l.width * W, h: l.items.length * l.size * 1.55 + (l.title ? l.size * 1.5 : 0) + 64};
    case 'bars': return {w: l.width * W, h: l.height * H + 40};
    case 'ring': return {w: l.size * W, h: l.size * W * (l.label ? 1.3 : 1)};
    case 'chat': return {w: l.width * W, h: (l.name ? l.size * 1.1 : 0) + l.messages.length * l.size * 2.05};
    case 'versus': return {w: safeWidth(safe, W), h: l.height * H};
    case 'stat': return {w: l.width * W, h: l.size * 1.75 + 60};
    case 'comment': {
      const w = l.width * W;
      return {w, h: l.size * (2.6 + commentLines(l, w) * 1.25) + 40};
    }
    case 'timeline': return {w: l.width * W, h: l.size * 3};
    case 'slider': return {w: l.width * W, h: l.height * H};
    case 'kinetic': return {w: W * 0.84, h: l.lines.reduce((a, line) => a + kineticSize(line, l, W) * 1.12, 0)};
    default: return null;
  }
}
export {kineticSize};

// Final box of a card on screen: {cx, cy, w, h, x0, y0, x1, y1} in px
export function graphicBox(l, W, H, safe) {
  const sz = graphicSize(l, W, H, safe);
  if (!sz) return null;
  const cx0 = l.type === 'versus' || l.type === 'kinetic' ? W / 2 : (l.x ?? 0.5) * W;
  const [cx, cy] = inSafe(safe, W, H, cx0, (l.y ?? 0.45) * H, sz.w, sz.h);
  return {cx, cy, w: sz.w, h: sz.h, x0: cx - sz.w / 2, x1: cx + sz.w / 2, y0: cy - sz.h / 2, y1: cy + sz.h / 2};
}

// When each part of a graphic appears (seconds). `at` = the layer's resolved start.
export const checklistTimes = (l, at) => l.items.map((it, i) => it.at ?? at + 0.15 + i * l.stagger);
export const barTimes = (l, at) => l.items.map((it, i) => it.at ?? at + 0.2 + i * 0.35);
export const chatTimes = (l, at) => l.messages.map((m, i) => m.at ?? at + 0.2 + i * 0.9);
export const versusTimes = (l, at) => [l.left.at ?? at, l.right.at ?? at + 0.6];
export const timelineTimes = (l, at) => l.steps.map((s, i) => s.at ?? at + 0.2 + i * 0.45);
export const kineticTimes = (l, at) => l.lines.map((x, i) => x.at ?? at + i * 0.35);
export const sliderTime = (l, at) => l.revealAt ?? at + 0.6;

// Automatic sound for each moment a graphic changes: [{at, src}]
export function graphicSounds(l, at) {
  const out = [];
  const add = (t, src) => out.push({at: t, src});
  switch (l.type) {
    case 'banner': add(at, 'sfx_whoosh_swipe'); break;
    case 'callout': add(at + 0.05, 'sfx_pop'); break;
    case 'checklist': checklistTimes(l, at).forEach((t, i) => add(t + 0.12, (l.items[i].mark ?? l.mark) === 'cross' ? 'sfx_pop_2' : 'sfx_click')); break;
    case 'bars': barTimes(l, at).forEach((t) => add(t, 'sfx_pop')); break;
    case 'ring': add(at, 'sfx_counter'); break;
    case 'chat': chatTimes(l, at).forEach((t, i) => add(t, i % 2 ? 'sfx_click_soft' : 'sfx_pop_2')); break;
    case 'versus': versusTimes(l, at).forEach((t, i) => add(t, i ? 'sfx_ding' : 'sfx_whoosh_short')); break;
    case 'accent': add(at, l.kind === 'ripple' ? 'sfx_chime' : 'sfx_pop_2'); break;
    case 'icon': add(at, 'sfx_pop'); break;
    case 'stat': add(at, 'sfx_counter'); break;
    case 'comment': add(at, 'sfx_notification'); break;
    case 'timeline': timelineTimes(l, at).forEach((t) => add(t + 0.1, 'sfx_click')); break;
    case 'slider': add(sliderTime(l, at), 'sfx_whoosh_soft'); break;
    case 'kinetic': kineticTimes(l, at).forEach((t, i) => add(t, i % 2 ? 'sfx_whoosh_short' : 'sfx_whoosh_fast')); break;
    case 'text': if (l.marker !== undefined) add(l.marker, 'sfx_swish'); break;
    case 'chip': add(at + 0.05, 'sfx_pop_2'); break;
    case 'glow': add(at, 'sfx_sparkle'); break;
    case 'path': add(at, 'sfx_whoosh_soft'); break;
    case 'speed': add(at, 'sfx_whoosh_short'); break;
    default: break;
  }
  return out;
}

// Icon names (drawn in icons.jsx)
export const ICON_NAMES = ['dumbbell', 'clock', 'timer', 'fire', 'water', 'calendar', 'heart', 'bolt', 'trophy', 'check', 'cross', 'apple', 'moon',
  'scale', 'phone', 'warning', 'arrowUp', 'arrowDown', 'thumbsUp', 'muscle', 'steps', 'brain', 'bed'];

// Moves a box {cx, cy, w, h} (px) off every face rectangle {x0, y0, x1, y1}: to the side with room, else below the chin.
// Stays inside the safe zone / canvas. Returns [cx, cy].
export function avoidFaces(box, faces, safe, W, H) {
  let {cx, cy} = box;
  const {w, h} = box;
  const lo = safe ? safe.x0 * W : 0, hi = safe ? safe.x1 * W : W;
  const top = safe ? safe.y0 * H : 0, bottom = safe ? safe.y1 * H : H;
  const hits = (x, y, f) => x - w / 2 < f.x1 && x + w / 2 > f.x0 && y - h / 2 < f.y1 && y + h / 2 > f.y0;
  for (const f of faces || []) {
    if (!hits(cx, cy, f)) continue;
    const gap = 18;
    const options = [
      [f.x1 + w / 2 + gap, cy], [f.x0 - w / 2 - gap, cy], // beside the face
      [cx, f.y1 + h / 2 + gap], [cx, f.y0 - h / 2 - gap], // below the chin / above the head
    ].filter(([x, y]) => x - w / 2 >= lo - 1 && x + w / 2 <= hi + 1 && y - h / 2 >= top - 1 && y + h / 2 <= bottom + 1 && !faces.some((g) => hits(x, y, g)));
    if (!options.length) continue;
    options.sort((a, b) => Math.hypot(a[0] - cx, a[1] - cy) - Math.hypot(b[0] - cx, b[1] - cy));
    [cx, cy] = options[0];
  }
  return [cx, cy];
}
