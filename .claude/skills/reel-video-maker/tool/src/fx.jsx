// Motion graphics that keep H big: they sit beside him or on him, never shrink him or cover his face.
//   chip  = small side pill with an icon and 1-2 words that slides in ("+2X GROWTH")
//   glow  = the named muscle glows and pulses, with a few glints
//   path  = the path a body part travels (curl arc, push-up line), drawn on, with a dot running along it
//   pulse = the screen edges flash a colour on a strong word (edge), or a quick white flash (flash)
//   speed = anime speed lines rushing in from the screen edges for a punchy moment
import React from 'react';
import {clamp01, lifeFx} from './motion.js';
import {canvasAnchor} from './anchors.js';
import {FONT_POP, W_POP} from './layers.jsx';
import {onColor} from './theme.js';
import {avoidFaces, inSafe} from './mgLayout.js';
import {ICONS} from './icons.jsx';

const ease = (p) => 1 - Math.pow(1 - clamp01(p), 3);
const back = (p) => {
  const c = 1.7, x = clamp01(p) - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
};
const hexA = (hex, a) => {
  const h = hex.replace('#', '');
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  return `#${f}${Math.round(clamp01(a) * 255).toString(16).padStart(2, '0')}`;
};

function ChipLayer({ctx, layer, index}) {
  const {t, W, H} = ctx;
  const size = layer.size;
  const color = layer.color ?? ctx.theme.main;
  const Icon = layer.icon ? ICONS[layer.icon] : null;
  const text = layer.text.toUpperCase();
  const w = Math.min(W * 0.5, [...text].length * size * 0.5 + size * (Icon ? 2.1 : 1.1)), h = size * 1.55;
  const [sx, sy] = inSafe(ctx.safe, W, H, layer.x * W, layer.y * H, w, h);
  const [cx, cy] = avoidFaces({cx: sx, cy: sy, w, h}, layer._faces, ctx.safe, W, H);
  const fromLeft = cx < W / 2;
  const p = back((t - layer._at) / 0.4);
  const out = lifeFx(t, layer._at, layer._until, 'cut', layer.exit ?? 'fade').opacity;
  const dx = (1 - p) * (fromLeft ? -1 : 1) * (w * 0.5 + W * 0.25);
  const bob = Math.sin((t - layer._at) * 3) * size * 0.06;
  return <div style={{position: 'absolute', left: cx + dx, top: cy + bob, zIndex: 56 + index, translate: '-50% -50%', opacity: out * clamp01(p * 3)}}>
    <div style={{display: 'flex', alignItems: 'center', gap: size * 0.3, height: h, padding: `0 ${size * 0.45}px 0 ${Icon ? size * 0.2 : size * 0.45}px`, boxSizing: 'border-box',
      background: '#FFFFFF', border: `${Math.max(5, size * 0.1)}px solid ${ctx.theme.dark}`, borderRadius: h, boxShadow: `0 ${size * 0.12}px 0 ${ctx.theme.dark}`, rotate: `${fromLeft ? -2 : 2}deg`}}>
      {Icon ? <div style={{width: size * 1.12, height: size * 1.12, flex: 'none', borderRadius: '50%', background: color, border: `${Math.max(4, size * 0.08)}px solid ${ctx.theme.dark}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box'}}><Icon size={size * 0.68} color={onColor(color, ctx.theme.dark)} ink={ctx.theme.dark}/></div> : null}
      <div style={{fontFamily: FONT_POP, fontWeight: W_POP, fontSize: size, lineHeight: 1, color: ctx.theme.dark, whiteSpace: 'nowrap', paddingTop: size * 0.06}}>
        {[...text].map((c, i) => <span key={i} style={layer.hot && c !== ' ' && text.slice(0, i + 1).split(' ').length - 1 === layer.hot - 1 ? {color} : null}>{c}</span>)}
      </div>
    </div>
  </div>;
}

function GlowLayer({ctx, layer, index}) {
  const {t} = ctx;
  const a = layer.anchor && layer._target ? canvasAnchor(ctx, layer._target, layer.anchor, t) : null;
  if (!a) return null;
  const color = layer.color ?? '#3DDC84';
  const fx = lifeFx(t, layer._at, layer._until, layer.enter ?? 'fade', layer.exit ?? 'fade');
  const k = t - layer._at;
  const pulse = 0.78 + 0.22 * Math.sin(k * 6);
  const d0 = Math.max(90, a.size * layer.size);
  // never on the face: the glow shrinks to stay clear of it (or is left out when the part is at the face)
  const room = (px, py) => Math.min(Infinity, ...(layer._faces || []).map((f) => Math.hypot(Math.max(f.x0 - px, 0, px - f.x1), Math.max(f.y0 - py, 0, py - f.y1))));
  return <>{a.points.map(([px, py], n) => ({px, py, d: Math.min(d0, room(px, py) * 1.6)})).filter((g) => g.d >= 70).map(({px, py, d}, n) => <div key={n} style={{position: 'absolute', left: px, top: py, zIndex: 31 + index, pointerEvents: 'none', opacity: fx.opacity}}>
    <div style={{position: 'absolute', width: d * pulse, height: d * pulse, translate: '-50% -50%', borderRadius: '50%',
      background: `radial-gradient(circle, ${hexA(color, 0.62)} 0%, ${hexA(color, 0.38)} 38%, ${hexA(color, 0)} 70%)`, mixBlendMode: 'multiply'}}/>
    <div style={{position: 'absolute', width: d * 0.9 * pulse, height: d * 0.9 * pulse, translate: '-50% -50%', borderRadius: '50%',
      background: `radial-gradient(circle, rgba(255,255,255,${0.34 * pulse}) 0%, rgba(255,255,255,0) 60%)`}}/>
    {[0, 1, 2].map((g) => {
      const ang = k * 1.6 + g * 2.1 + n;
      const r = d * 0.42;
      const s = d * 0.09 * (0.6 + 0.4 * Math.sin(k * 7 + g * 2));
      return <div key={g} style={{position: 'absolute', left: Math.cos(ang) * r, top: Math.sin(ang) * r, width: s, height: s, translate: '-50% -50%', rotate: '45deg',
        background: '#FFFFFF', boxShadow: `0 0 ${s}px ${color}`, borderRadius: s * 0.15}}/>;
    })}
  </div>)}</>;
}

// a point of a body part on the character at time tt (a pair: the one nearest `near`, else the left one)
function partPoint(ctx, layer, name, tt, near) {
  if (Array.isArray(name)) return [name[0] * ctx.W, name[1] * ctx.H];
  const a = layer._target ? canvasAnchor(ctx, layer._target, name, tt) : null;
  if (!a) return null;
  if (a.points.length === 1) return a.points[0];
  if (near) return a.points.reduce((b, p) => (Math.hypot(p[0] - near[0], p[1] - near[1]) < Math.hypot(b[0] - near[0], b[1] - near[1]) ? p : b));
  return [...a.points].sort((p, q) => p[0] - q[0])[0];
}

function PathLayer({ctx, layer, index}) {
  const {t, W, H} = ctx;
  const p0 = partPoint(ctx, layer, layer.from, layer.fromAt ?? layer._at);
  if (!p0) return null;
  const p1 = partPoint(ctx, layer, layer.to, layer.toAt ?? layer._at + 0.01, p0) ?? p0;
  // the end point is taken at `toAt` (the moment the body part arrives there), so the path matches the movement
  const color = layer.color ?? '#3DDC84';
  const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1;
  // bend away from the middle of the body (outside of the arc)
  const mid = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
  const nx = -(p1[1] - p0[1]) / len, ny = (p1[0] - p0[0]) / len;
  const outward = (mid[0] - W / 2) * nx + (mid[1] - H * 0.55) * ny >= 0 ? 1 : -1;
  const c = [mid[0] + nx * outward * len * layer.bend, mid[1] + ny * outward * len * layer.bend];
  const d = `M ${p0[0]} ${p0[1]} Q ${c[0]} ${c[1]} ${p1[0]} ${p1[1]}`;
  const total = len * (1 + layer.bend);
  const draw = ease((t - layer._at) / 0.6);
  const fade = lifeFx(t, layer._at, layer._until, 'cut', layer.exit ?? 'fade').opacity;
  const at = (u) => [(1 - u) * (1 - u) * p0[0] + 2 * (1 - u) * u * c[0] + u * u * p1[0], (1 - u) * (1 - u) * p0[1] + 2 * (1 - u) * u * c[1] + u * u * p1[1]];
  const end = at(Math.max(0.001, draw)), before = at(Math.max(0, draw - 0.04));
  const ang = Math.atan2(end[1] - before[1], end[0] - before[0]);
  const head = layer.thickness * 2.4;
  const tri = [[end[0], end[1]], [end[0] - head * Math.cos(ang - 0.55), end[1] - head * Math.sin(ang - 0.55)], [end[0] - head * Math.cos(ang + 0.55), end[1] - head * Math.sin(ang + 0.55)]];
  const runner = layer.loop && draw >= 1 ? at(((t - layer._at - 0.6) / 1.1) % 1) : null;
  return <svg width={W} height={H} style={{position: 'absolute', inset: 0, zIndex: 41 + index, opacity: fade, overflow: 'visible', pointerEvents: 'none',
    filter: `drop-shadow(0 0 10px ${hexA(color, 0.9)})`}}>
    <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={layer.thickness + 8} strokeLinecap="round" strokeDasharray={`${total * draw} ${total}`} opacity={0.9}/>
    <path d={d} fill="none" stroke={color} strokeWidth={layer.thickness} strokeLinecap="round" strokeDasharray={`${total * draw} ${total}`}/>
    {draw > 0.1 ? <polygon points={tri.map((q) => q.join(',')).join(' ')} fill={color} stroke="#FFFFFF" strokeWidth={4} strokeLinejoin="round"/> : null}
    {runner ? <circle cx={runner[0]} cy={runner[1]} r={layer.thickness * 0.9} fill="#FFFFFF" stroke={color} strokeWidth={5}/> : null}
  </svg>;
}

function PulseLayer({ctx, layer, index}) {
  const {t, W} = ctx;
  const k = (t - layer._at) / layer.duration;
  if (k < 0 || k >= 1) return null;
  if (layer.kind === 'impact') {
    // anime impact frames: alternating every 2 frames between a negative (black sky, white H) and a red silhouette
    const step = Math.floor((t - layer._at) * ctx.fps / 2) % 2;
    const color = layer.color ?? '#E3262E';
    return <>
      <div style={{position: 'absolute', inset: 0, zIndex: 880 + index, pointerEvents: 'none',
        backdropFilter: step === 0 ? 'grayscale(1) contrast(12) invert(1)' : 'grayscale(1) contrast(14) brightness(0.9)'}}/>
      {step === 1 ? <div style={{position: 'absolute', inset: 0, zIndex: 881 + index, pointerEvents: 'none', background: color, mixBlendMode: 'multiply'}}/> : null}
    </>;
  }
  if (layer.kind === 'flash') {
    return <div style={{position: 'absolute', inset: 0, zIndex: 880 + index, pointerEvents: 'none', background: layer.color ?? '#FFFFFF', opacity: 0.9 * (1 - ease(k))}}/>;
  }
  const color = layer.color ?? '#FF4D3D';
  const a = Math.sin(Math.PI * Math.min(1, k * 2.2)) * (1 - k * 0.6);
  return <div style={{position: 'absolute', inset: 0, zIndex: 880 + index, pointerEvents: 'none',
    boxShadow: `inset 0 0 ${W * 0.14}px ${W * 0.05}px ${hexA(color, 0.85 * a)}`}}/>;
}

function SpeedLayer({ctx, layer, index}) {
  const {t, W, H} = ctx;
  const k = (t - layer._at) / layer.duration;
  if (k < 0 || k >= 1) return null;
  const color = layer.color ?? ctx.theme.dark;
  const cx = W / 2, cy = H * 0.5;
  const R = Math.hypot(W, H) * 0.55;
  const lines = Array.from({length: 34}, (_, i) => {
    const ang = (i / 34) * Math.PI * 2 + ((i * 37) % 11) * 0.02;
    const len = R * (0.18 + ((i * 53) % 7) * 0.025);
    const r0 = R * (1.05 - 0.28 * ease(k)) , r1 = r0 - len;
    return {x0: cx + Math.cos(ang) * r0, y0: cy + Math.sin(ang) * r0, x1: cx + Math.cos(ang) * r1, y1: cy + Math.sin(ang) * r1, w: 5 + ((i * 29) % 5) * 2};
  });
  return <svg width={W} height={H} style={{position: 'absolute', inset: 0, zIndex: 2 + index, pointerEvents: 'none', opacity: 0.35 * (1 - k)}}>
    {lines.map((l, i) => <line key={i} x1={l.x0} y1={l.y0} x2={l.x1} y2={l.y1} stroke={color} strokeWidth={l.w} strokeLinecap="round"/>)}
  </svg>;
}

export const FX_LAYERS = {chip: ChipLayer, glow: GlowLayer, path: PathLayer, pulse: PulseLayer, speed: SpeedLayer};
