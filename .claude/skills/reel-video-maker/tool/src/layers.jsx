import React from 'react';
import {Img, Loop, OffthreadVideo, Sequence} from 'remotion';
import {clamp01, enterFx, fxStyle, IDENTITY, lifeFx, withIdle} from './motion.js';
import {aspectOf, canvasAnchor, centroid, layerFx, posePlacement, sortedFrames, targetView} from './anchors.js';
import {fitText} from './textSafety.js';
import {avoidFaces} from './mgLayout.js';

// fonts come from the theme's font set (CSS variables set on the video), classic fonts when none is set
export const FONT_DISPLAY = 'var(--f-display, "Jost", "Futura", "Century Gothic", sans-serif)';
export const FONT_POP = 'var(--f-pop, "Anton", "Impact", sans-serif)';
const FONT_HOOK = 'var(--f-hook, "Luckiest Guy", "Anton", sans-serif)';
const FONT_COMIC = 'var(--f-comic, "Bangers", "Anton", sans-serif)';
export const W_POP = 'var(--w-pop, 400)';
export const W_DISPLAY = 'var(--w-display, 800)';

const isLight = (hex) => {
  const h = hex.replace('#', '');
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const n = parseInt(f, 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.62;
};

// Letter styling of a "look" (text and counter layers). Every look has a dark outline or a box,
// so the words stay readable on any background colour.
export function lookStyle(look, size, color, boxColor, t) {
  if (look === 'pop') return {
    fontFamily: FONT_POP, fontWeight: W_POP, letterSpacing: size * 0.01, color: color ?? '#FFFFFF',
    WebkitTextStroke: `${Math.round(size * 0.11)}px #111111`, paintOrder: 'stroke fill',
    textShadow: `0 ${Math.round(size * 0.07)}px 0 #111111`,
  };
  if (look === 'box') {
    const bg = boxColor ?? color ?? '#111111';
    return {
      fontFamily: FONT_POP, fontWeight: W_POP, letterSpacing: size * 0.01, color: isLight(bg) ? '#111111' : '#FFFFFF',
      WebkitTextStroke: '0px transparent', textShadow: 'none',
      background: bg, padding: `${size * 0.06}px ${size * 0.28}px ${size * 0.02}px`, borderRadius: size * 0.16,
      boxShadow: `0 ${size * 0.08}px 0 rgba(0,0,0,.85)`, border: `${Math.max(4, size * 0.04)}px solid #111111`,
    };
  }
  // thumbnail label: white box, thick black border, black letters (a *word* in the theme's red)
  if (look === 'thumb') return {
    fontFamily: FONT_POP, fontWeight: W_POP, letterSpacing: size * 0.01, color: color ?? '#111111', WebkitTextStroke: '0px transparent', textShadow: 'none',
    background: boxColor ?? '#FFFFFF', padding: `${size * 0.05}px ${size * 0.22}px ${size * 0.01}px`, borderRadius: size * 0.04,
    border: `${Math.max(5, size * 0.065)}px solid #111111`, boxShadow: `0 ${size * 0.07}px 0 #111111`,
  };
  if (look === 'hook') {
    const d = Math.max(3, Math.round(size * 0.07));
    const layers = Array.from({length: d}, (_, i) => `${i + 1}px ${i + 1}px 0 #111111`).join(',');
    return {
      fontFamily: FONT_HOOK, fontWeight: 'var(--w-hook, 400)', letterSpacing: size * 0.02, color: color ?? '#FFD23F',
      WebkitTextStroke: `${Math.round(size * 0.09)}px #111111`, paintOrder: 'stroke fill', textShadow: layers,
      transform: `rotate(${Math.sin((t ?? 0) * 2.6) * 1.6}deg)`,
    };
  }
  // huge solid letters, tight lines: a word behind H
  if (look === 'giant') return {
    fontFamily: FONT_POP, fontWeight: W_POP, letterSpacing: -size * 0.015, color: color ?? '#111111', WebkitTextStroke: '0px transparent', textShadow: 'none', lineHeight: 0.9,
  };
  // hollow letters: only the border is drawn
  if (look === 'outline') return {
    fontFamily: FONT_POP, fontWeight: W_POP, letterSpacing: size * 0.01, color: 'transparent', textShadow: 'none',
    WebkitTextStroke: `${Math.max(4, Math.round(size * 0.05))}px ${color ?? '#111111'}`,
  };
  if (look === 'echo') return {
    fontFamily: FONT_POP, fontWeight: W_POP, letterSpacing: -size * 0.01, color: color ?? '#111111', WebkitTextStroke: '0px transparent', textShadow: 'none', lineHeight: 0.9,
  };
  // white letters glowing in a colour (boxColor, default neon green)
  if (look === 'neon') {
    const c = boxColor ?? '#2FD94E';
    return {
      fontFamily: FONT_POP, fontWeight: W_POP, letterSpacing: size * 0.01, color: color ?? '#FFFFFF', WebkitTextStroke: `${Math.max(2, Math.round(size * 0.02))}px ${c}`,
      textShadow: `0 0 ${size * 0.06}px ${c}, 0 0 ${size * 0.18}px ${c}, 0 0 ${size * 0.4}px ${c}`,
    };
  }
  if (look === 'comic') return {
    fontFamily: FONT_COMIC, fontWeight: 400, letterSpacing: size * 0.03, color: color ?? '#FF4D3D',
    WebkitTextStroke: `${Math.round(size * 0.08)}px #111111`, paintOrder: 'stroke fill',
    textShadow: `${Math.round(size * 0.05)}px ${Math.round(size * 0.05)}px 0 #111111`,
  };
  return null;
}

const hexA = (hex, alpha) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

// Wrapper that puts the layer's center at (x, y) and applies motion.
// ghost copies behind a character that whips in: 3 fading afterimages along the path (anime smear)
const whipGhost = (ctx, layer) => {
  const type = typeof layer.enter === 'object' ? layer.enter?.type : layer.enter;
  if (type !== 'whip' || layer._at == null) return 0;
  const k = (ctx.t - layer._at) / 0.26;
  return k >= 0 && k < 1 ? 1 - k : 0;
};

function Placed({ctx, layer, fx, children, z, blend}) {
  const {W, H} = ctx;
  const g = whipGhost(ctx, layer);
  // blend is set on the outermost box: inside it the transforms make their own group and there is nothing to blend with
  return <div style={{position: 'absolute', left: (layer.x ?? 0.5) * W, top: (layer.y ?? 0.5) * H, zIndex: z, transform: 'translate(-50%,-50%)', opacity: layer._fade ?? 1, mixBlendMode: blend}}>
    {g > 0 ? [3, 2, 1].map((i) => <div key={i} style={{position: 'absolute', inset: 0, transform: `translateX(${-90 * i * g}px)`, opacity: 0.16 * (4 - i) * g, filter: `blur(${3 * i}px)`}}>
      <div style={{transform: `rotate(${layer.rotation || 0}deg) scaleX(${layer.flipX ? -1 : 1})`}}>{children}</div></div>) : null}
    <div style={{...fxStyle(fx), transformOrigin: '50% 50%'}}>
      <div style={{transform: `rotate(${layer.rotation || 0}deg) scaleX(${layer.flipX ? -1 : 1})`}}>{children}</div>
    </div>
  </div>;
}

// soft shadow under the drawn figure (library bbox), not under the empty canvas
const GroundShadow = ({width, meta}) => {
  const [x0, , x1, y1] = meta?.bbox ?? [0.08, 0, 0.92, 1];
  const h = width * (meta?.size ? meta.size[1] / meta.size[0] : 1);
  const bw = (x1 - x0) * width;
  return <div style={{
    position: 'absolute', left: x0 * width + bw * 0.05, width: bw * 0.9, top: y1 * h - width * 0.035, height: width * 0.07,
    background: 'radial-gradient(ellipse at center, rgba(40,20,70,.45) 0%, rgba(40,20,70,0) 70%)', zIndex: -1,
  }}/>;
};

// Overlay -> canvas points of its body-part anchor on the character layer it belongs to.
// evaluated at the current time, so a ring follows the pose when a poses layer switches frames
const anchorOf = (ctx, layer, name = layer.anchor) => (name && layer._target ? canvasAnchor(ctx, layer._target, name, ctx.t) : null);
const toPx = (ctx, v) => [v[0] * ctx.W, v[1] * ctx.H];

// A prop placed on top of H is moved beside him, into the larger free space.
function avoidCharacter(ctx, layer) {
  const m = ctx.meta(layer._avoid.type === 'poses' ? sortedFrames(layer._avoid)[0].asset : layer._avoid.asset);
  const view = targetView(ctx, layer._avoid, layer._at);
  const [x0, y0, x1, y1] = view.meta?.bbox ?? m?.bbox ?? [0.15, 0.05, 0.85, 0.98];
  const [bx0, by0] = view.toCanvas([x0 + (x1 - x0) * 0.08, y0]);
  const [bx1, by1] = view.toCanvas([x1 - (x1 - x0) * 0.08, y1]);
  const w = layer.width * ctx.W, h = w * aspectOf(ctx.meta(layer.asset));
  const cx = (layer.x ?? 0.5) * ctx.W, cy = (layer.y ?? 0.5) * ctx.H;
  const hits = cx + w / 2 > bx0 && cx - w / 2 < bx1 && cy + h / 2 > by0 && cy - h / 2 < by1;
  if (!hits) return layer;
  const left = bx0, right = ctx.W - bx1, gap = 24;
  const room = Math.max(left, right);
  const scale = Math.min(1, Math.max(0.6, (room - gap * 2) / w));
  const ww = w * scale;
  const x = right >= left ? Math.min(ctx.W - ww / 2 - gap, bx1 + gap + ww / 2) : Math.max(ww / 2 + gap, bx0 - gap - ww / 2);
  return {...layer, x: x / ctx.W, width: layer.width * scale};
}

// H is alive: he breathes slowly and gives a small bounce on each key word of the voiceover.
// Only the drawing moves (from the feet), so rings and arrows stay on their body part.
function Life({ctx, layer, asset, children}) {
  const on = layer.life ?? /^hero_/.test(asset || '');
  if (!on) return children;
  const lt = ctx.t - layer._at;
  const breath = Math.sin((lt / 2.8) * Math.PI * 2);
  let hop = 0;
  for (const b of ctx.beats || []) {
    const d = ctx.t - b;
    if (d >= 0 && d < 0.32 && b >= layer._at) hop = Math.max(hop, Math.sin((d / 0.32) * Math.PI) * (1 - d / 0.32));
  }
  return <div style={{transformOrigin: '50% 100%',
    transform: `translateY(${-hop * 14}px) scale(${1 - 0.004 * breath + 0.012 * hop}, ${1 + 0.011 * breath + 0.02 * hop})`}}>{children}</div>;
}

// A prop never sits on H's face: it moves beside the face or below the chin.
function avoidFace(ctx, layer) {
  if (!layer._faces?.length) return layer;
  const w = layer.width * ctx.W, h = w * aspectOf(ctx.meta(layer.asset));
  const cx = (layer.x ?? 0.5) * ctx.W, cy = (layer.y ?? 0.5) * ctx.H;
  // the drawn part of a prop is smaller than its picture: test with 80% of it
  const [x, y] = avoidFaces({cx, cy, w: w * 0.8, h: h * 0.8}, layer._faces, ctx.safe, ctx.W, ctx.H);
  return x === cx && y === cy ? layer : {...layer, x: x / ctx.W, y: y / ctx.H};
}

function ImageLayer({ctx, layer: raw, index}) {
  const layer = avoidFace(ctx, raw._avoid ? avoidCharacter(ctx, raw) : raw);
  const w = layer.width * ctx.W;
  if (layer.frame === 'circle') {
    // round inset (a place, a detail, a "zoom" on something): the image fills a circle with a dark ring
    const bw = Math.max(6, Math.round(w * 0.035));
    return <Placed ctx={ctx} layer={layer} fx={layerFx(ctx, layer, index)} z={index}>
      <div style={{width: w, height: w, borderRadius: '50%', overflow: 'hidden', border: `${bw}px solid ${layer.border ?? '#1d1a24'}`,
        background: '#FFFFFF', boxSizing: 'border-box', opacity: layer.opacity ?? 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Img src={ctx.src(layer.asset)} style={{width: '92%', height: '92%', objectFit: 'contain'}}/>
      </div>
    </Placed>;
  }
  return <Placed ctx={ctx} layer={layer} fx={layerFx(ctx, layer, index)} z={index}>
    <div style={{position: 'relative', width: w, opacity: layer.opacity ?? 1}}>
      {layer.shadow ? <GroundShadow width={w} meta={ctx.meta(layer.asset)}/> : null}
      <Life ctx={ctx} layer={layer} asset={layer.asset}><Img src={ctx.src(layer.asset)} style={{width: w, display: 'block'}}/></Life>
    </div>
  </Placed>;
}

// Pose-to-pose "animation": crossfade between still drawings of the same character.
function PoseLayer({ctx, layer, index}) {
  const w = layer.width * ctx.W;
  const frames = sortedFrames(layer);
  // crossfade only between drawings of one movement (squat_top -> squat_mid); a different pose
  // (front view -> back view) would show a ghost of both, so it cuts with a small pop instead
  const base = (id) => id.replace(/_v\d+$/, '').replace(/_(start|top|mid|bottom|end|down|up|open|closed|a|b)$/, '');
  const cfAt = (i) => (i > 0 && base(frames[i - 1].asset) === base(frames[i].asset) ? Math.max(0.001, layer.crossfade) : 0.001);
  const opacityOf = (i) => {
    const t = ctx.t;
    const start = frames[i].at;
    const next = frames[i + 1]?.at;
    const fadeIn = i === 0 ? 1 : clamp01((t - start) / cfAt(i));
    const fadeOut = next === undefined ? 1 : 1 - clamp01((t - next) / cfAt(i + 1));
    return t < start && i !== 0 ? 0 : Math.min(fadeIn, fadeOut);
  };
  const popOf = (i) => {
    if (i === 0 || cfAt(i) > 0.001) return 1;
    const p = clamp01((ctx.t - frames[i].at) / 0.16);
    return 0.94 + 0.06 * (1 - (1 - p) ** 3);
  };
  const place = (f, i) => posePlacement(ctx, layer, frames, i);
  return <Placed ctx={ctx} layer={layer} fx={layerFx(ctx, layer, index)} z={index}>
    <div style={{position: 'relative', width: w}}>
      {layer.shadow ? <GroundShadow width={w} meta={ctx.meta(frames[0].asset)}/> : null}
      <Life ctx={ctx} layer={layer} asset={frames[0].asset}><div style={{position: 'relative'}}>
      {frames.map((f, i) => {
        const p = place(f, i);
        return <Img key={i} src={ctx.src(f.asset)} style={{
          width: p.width, maxWidth: 'none', display: 'block', opacity: opacityOf(i),
          position: i === 0 ? 'relative' : 'absolute', left: p.left, top: p.top,
          transform: `scale(${popOf(i)})`, transformOrigin: '50% 100%',
        }}/>;
      })}
      </div></Life>
    </div>
  </Placed>;
}

function VideoLayer({ctx, layer, index}) {
  const w = layer.width * ctx.W;
  const len = (ctx.meta(layer.asset)?.duration ?? 8) - layer.from;
  const loopFrames = Math.max(2, Math.floor((len / layer.rate) * ctx.fps) - 1);
  const video = <OffthreadVideo src={ctx.src(layer.asset)} muted={layer.muted} playbackRate={layer.rate} startFrom={Math.round(layer.from * ctx.fps)}
    style={{width: w, display: 'block', filter: layer.blend === 'multiply' ? 'brightness(1.05) contrast(1.06)' : undefined}}/>;
  return <Placed ctx={ctx} layer={layer} fx={layerFx(ctx, layer, index)} z={index} blend={layer.blend === 'multiply' ? 'multiply' : undefined}>
    <Sequence from={Math.round(layer._at * ctx.fps)} durationInFrames={Math.max(1, Math.round((layer._until - layer._at) * ctx.fps))} layout="none">
      {layer.loop ? <Loop durationInFrames={loopFrames} layout="none">{video}</Loop> : video}
    </Sequence>
  </Placed>;
}

function TextLayer({ctx, layer, index}) {
  const {t, W, H} = ctx;
  // *word* = that word in the accent colour (the theme's main colour), the stars are not shown
  const raw = layer.uppercase ? layer.text.toUpperCase() : layer.text;
  const hot = [];
  let on = false;
  const chars = [...raw].filter((c) => (c === '*' ? ((on = !on), false) : (hot.push(on), true)));
  const text = chars.join('');
  const hotColor = layer.accentColor ?? ctx.theme.main;
  let visible = chars.length;
  const sticker = layer.look === 'box' || layer.look === 'thumb'; // a sticker pops in and out whole, never typed letter by letter
  if (layer.animation === 'typewriter' && !sticker) visible = Math.floor((t - layer._at) * layer.cps);
  if (layer.untype && !sticker) visible = Math.min(visible, Math.floor((layer._until - t) * layer.cps * 1.6));
  const enter = layer.animation === 'none' || sticker ? (layer.enter ?? 'pop') : (layer.enter ?? 'cut');
  const fx = lifeFx(t, layer._at, layer._until, enter, layer.untype && !sticker ? undefined : (layer.exit ?? (sticker ? 'pop' : undefined)));
  const color = layer.color ?? ctx.style.textColor;
  const words = text.split(/(\s+)/);
  const wordFx = (wi) => {
    const p = clamp01((t - layer._at - wi * (sticker ? 0.08 : 0.13)) / 0.22);
    return fxStyle(withIdle({...IDENTITY}, enterFx('pop', p)));
  };
  let body;
  const boxHot = layer.look === 'box' && !layer.accentColor ? (isLight(layer.boxColor ?? '#111111') ? '#FFFFFF' : '#FFD23F') : hotColor;
  // outline / echo: a *word* is filled solid (split look: "PUSH *UPS*"); other looks: the word in the accent colour
  const hotStyle = (i) => (hot[i] ? {color: sticker ? boxHot : ['outline', 'echo'].includes(layer.look) ? (layer.accentColor ?? layer.color ?? '#111111') : hotColor} : null);
  if (layer.look === 'marquee' || layer.look === 'tape') return <Ticker ctx={ctx} layer={layer} text={text} index={index}/>;
  if (layer.animation === 'letters') {
    // each letter slams in after the one before it
    body = chars.map((c, i) => {
      if (c === '\n') return <br key={i}/>;
      const p = clamp01((t - layer._at - i * 0.06) / 0.2);
      return <span key={i} style={{display: 'inline-block', whiteSpace: 'pre', ...fxStyle(withIdle({...IDENTITY}, enterFx('slam', p))), ...hotStyle(i)}}>{c}</span>;
    });
  } else if (layer.animation === 'words') {
    let wi = -1, ci = 0;
    body = words.map((wd, i) => {
      const from = ci;
      ci += [...wd].length;
      if (/^\s+$/.test(wd)) return wd;
      return <span key={i} style={{display: 'inline-block', ...wordFx(++wi)}}>{[...wd].map((c, k) => <span key={k} style={hotStyle(from + k)}>{c}</span>)}</span>;
    });
  } else {
    // keep hidden letters in the layout so the line never re-wraps while typing
    body = chars.map((c, i) => <span key={i} style={{opacity: i < visible ? 1 : 0, ...hotStyle(i)}}>{c}</span>);
  }
  const anchor = layer.align === 'left' ? '0%' : layer.align === 'right' ? '-100%' : '-50%';
  const fit = fitText(layer, W);
  const look = lookStyle(layer.look, fit.size, layer.color, layer.boxColor, t - layer._at);
  const lean = look && layer.italic ? ' skewX(-7deg)' : '';
  const tilt = layer.tilt ?? (layer.look === 'box' ? -2 : layer.look === 'thumb' ? -1 : 0);
  return <div style={{position: 'absolute', left: layer.x * W, top: (layer._y ?? layer.y) * H, zIndex: layer.behind ? -100 + index : 50 + index, transform: `translate(${anchor},-50%) rotate(${tilt}deg)${lean}`, width: fit.boxW, textAlign: layer.align}}>
    <div style={{
      ...fxStyle(fx), position: 'relative', display: 'inline-block', fontFamily: FONT_DISPLAY, fontSize: fit.size, lineHeight: look?.lineHeight ?? (look ? 1.12 : 1.08),
      fontWeight: layer.font === 'display' ? W_DISPLAY : 600, fontStyle: layer.italic && !look ? 'italic' : 'normal',
      color, textAlign: layer.align, letterSpacing: layer.font === 'display' ? -0.5 : 0, whiteSpace: 'pre-wrap',
      WebkitTextStroke: layer.stroke ? `${layer.stroke.width}px ${layer.stroke.color}` : undefined,
      paintOrder: 'stroke fill',
      ...(look ?? {}),
      ...(look?.transform ? {transform: `${fxStyle(fx).transform ?? ''} ${look.transform}`} : {}),
    }}>{layer.look === 'echo' ? <EchoCopies layer={layer} size={fit.size} text={text} t={t}/> : null}{layer.marker !== undefined && t >= layer.marker ? <div style={{position: 'absolute', left: '-3%', bottom: '4%', height: '52%', zIndex: -1, borderRadius: fit.size * 0.12,
      width: `${106 * clamp01((t - layer.marker) / 0.35)}%`, background: layer.markerColor ?? '#FFE14D', transform: 'rotate(-1.5deg)', opacity: 0.9}}/> : null}{body}{layer.strike !== undefined && t >= layer.strike ? <div style={{position: 'absolute', left: '-2%', top: '52%', height: Math.max(6, fit.size * 0.09),
      width: `${104 * clamp01((t - layer.strike) / 0.3)}%`, background: ctx.style.danger, borderRadius: 4, transform: 'rotate(-2deg)'}}/> : null}</div>
  </div>;
}

// echo: hollow copies of the word above and below the solid one, sliding out from it
function EchoCopies({layer, size, text, t}) {
  const k = clamp01((t - layer._at) / 0.45);
  const e = 1 - Math.pow(1 - k, 3);
  const c = layer.color ?? '#111111';
  return <>{[-2, -1, 1, 2].map((d) => <div key={d} style={{position: 'absolute', left: 0, right: 0, top: 0, transform: `translateY(${d * size * 0.86 * e}px)`, opacity: (Math.abs(d) === 1 ? 0.75 : 0.4) * e,
    color: 'transparent', WebkitTextStroke: `${Math.max(4, Math.round(size * 0.045))}px ${c}`, pointerEvents: 'none', whiteSpace: 'pre'}}>{text}</div>)}</>;
}

// marquee: a giant word running across the screen non-stop (alternating solid and hollow);
// tape: a tilted caution tape with the word repeated on it, sliding along
function Ticker({ctx, layer, text, index}) {
  const {t, W, H} = ctx;
  const tape = layer.look === 'tape';
  const size = layer.size;
  const unit = `${text}${tape ? '  •  ' : '   '}`;
  const unitW = [...unit].length * size * 0.56;
  const shift = ((t - layer._at) * layer.speed) % unitW;
  const fx = lifeFx(t, layer._at, layer._until, layer.enter ?? (tape ? 'left' : 'fade'), layer.exit ?? 'fade');
  const c = layer.color ?? '#111111';
  const n = Math.ceil((W * 1.6) / unitW) + 2;
  const items = Array.from({length: n}, (_, i) => <span key={i} style={tape ? null : (i % 2 ? {color: 'transparent', WebkitTextStroke: `${Math.max(4, Math.round(size * 0.045))}px ${c}`} : null)}>{unit}</span>);
  return <div style={{position: 'absolute', left: -W * 0.3, width: W * 1.6, top: layer.y * H, zIndex: layer.behind ? -100 + index : 50 + index,
    transform: `translateY(-50%) rotate(${layer.tilt ?? (tape ? -8 : 0)}deg)`, ...fxStyle(fx)}}>
    <div style={{overflow: 'hidden', background: tape ? (layer.boxColor ?? '#FFD23F') : 'none', borderTop: tape ? `${Math.max(6, size * 0.08)}px solid #111111` : 'none',
      borderBottom: tape ? `${Math.max(6, size * 0.08)}px solid #111111` : 'none', padding: tape ? `${size * 0.1}px 0 ${size * 0.04}px` : 0}}>
      <div style={{whiteSpace: 'nowrap', transform: `translateX(${-shift}px)`, fontFamily: FONT_POP, fontWeight: W_POP, fontSize: size, lineHeight: tape ? 1.05 : 0.95,
        color: tape ? (isLight(layer.boxColor ?? '#FFD23F') ? '#111111' : '#FFFFFF') : c, letterSpacing: size * 0.01}}>{items}</div>
    </div>
  </div>;
}

function ArrowLayer({ctx, layer, index}) {
  const {t, W, H} = ctx;
  const color = layer.color ?? ctx.style.accent;
  let x1, y1, x2, y2;
  const a = anchorOf(ctx, layer);
  if (a) {
    // tip just outside the body part, tail coming from `side`
    let [px, py] = centroid(a.points);
    const room = px > W / 2 ? 'left' : 'right';
    // a pair (both hands, both arms): the arrow goes beside the outer one on the free side, not between them
    if (a.points.length > 1) [px, py] = a.points.reduce((b, p) => ((room === 'left' ? p[0] < b[0] : p[0] > b[0]) ? p : b));
    if (layer.pointing) {
      // movement cue: arrow beside the body part, pointing the way it moves
      const d = {up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0]}[layer.pointing];
      const off = d[0] === 0 ? {left: [-1, 0], right: [1, 0]}[layer.side ?? room] ?? [-1, 0] : {above: [0, -1], below: [0, 1]}[layer.side ?? 'above'] ?? [0, -1];
      const c = [px + off[0] * (a.size * 0.7 + 30), py + off[1] * (a.size * 0.7 + 30)];
      const half = Math.min(W, H) * 0.09;
      [x1, y1] = [c[0] - d[0] * half, c[1] - d[1] * half];
      [x2, y2] = [c[0] + d[0] * half, c[1] + d[1] * half];
    } else {
    const side = layer.side ?? room;
    const dir = {left: [-1, 0], right: [1, 0], above: [0, -1], below: [0, 1], 'above-left': [-0.7, -0.7], 'above-right': [0.7, -0.7], 'below-left': [-0.7, 0.7], 'below-right': [0.7, 0.7]}[side] ?? [-1, 0];
    const gap = a.size * 0.6 + 10;
    [x2, y2] = [px + dir[0] * gap, py + dir[1] * gap];
    [x1, y1] = [x2 + dir[0] * Math.min(W, H) * 0.17, y2 + dir[1] * Math.min(W, H) * 0.17];
    }
  } else {
    [x1, y1] = toPx(ctx, layer.from);
    [x2, y2] = toPx(ctx, layer.to);
  }
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const draw = clamp01((t - layer._at) / 0.35);
  const fade = lifeFx(t, layer._at, layer._until, 'cut', layer.exit ?? 'fade').opacity;
  const bob = layer.bob ? Math.sin((t - layer._at) * 7) * 10 : 0;
  const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
  const hx = x1 + (x2 - x1) * draw, hy = y1 + (y2 - y1) * draw;
  const head = layer.thickness * 2.6;
  const ang = Math.atan2(uy, ux);
  const pts = [[hx, hy], [hx - head * Math.cos(ang - 0.5), hy - head * Math.sin(ang - 0.5)], [hx - head * Math.cos(ang + 0.5), hy - head * Math.sin(ang + 0.5)]];
  return <svg width={W} height={H} style={{position: 'absolute', inset: 0, zIndex: 40 + index, opacity: fade, transform: `translate(${ux * bob}px,${uy * bob}px)`,
    filter: layer.glow ? `drop-shadow(0 0 12px ${color}) drop-shadow(0 0 28px ${hexA(color, 0.7)})` : undefined}}>
    <line x1={x1} y1={y1} x2={hx - ux * head * 0.6} y2={hy - uy * head * 0.6} stroke={color} strokeWidth={layer.thickness} strokeLinecap="round"/>
    {draw > 0.15 ? <polygon points={pts.map((p) => p.join(',')).join(' ')} fill={color} strokeLinejoin="round" stroke={color} strokeWidth={layer.thickness * 0.4}/> : null}
  </svg>;
}

function HighlightLayer({ctx, layer, index}) {
  const {t, W, H} = ctx;
  const color = layer.color ?? ctx.style.accent;
  const fx = lifeFx(t, layer._at, layer._until, layer.enter ?? 'fade', layer.exit ?? 'fade');
  const pulse = layer.pulse ? 0.75 + 0.25 * Math.sin((t - layer._at) * 8) : 1;
  const glow = `drop-shadow(0 0 ${14 * pulse}px ${color}) drop-shadow(0 0 ${36 * pulse}px ${hexA(color, 0.8)})`;
  const a = layer.shape !== 'mask' ? anchorOf(ctx, layer) : null;
  if (a) {
    // one ring per point ("hands" -> both hands)
    const d = layer.w ? layer.w * W : Math.max(60, a.size);
    return <>{a.points.map(([px, py], k) => <div key={k} style={{position: 'absolute', left: px, top: py, width: d, height: d, zIndex: 30 + index,
      transform: 'translate(-50%,-50%)', filter: glow, opacity: fx.opacity * (0.7 + 0.3 * pulse), borderRadius: '50%',
      background: hexA(color, 0.12), border: `${Math.max(6, Math.round(d * 0.045))}px solid ${color}`}}/>)}</>;
  }
  const w = (layer.w ?? 0.12) * W;
  const h = layer.shape === 'circle' ? w : (layer.h ?? 0.3) * H;
  const common = {position: 'absolute', left: (layer.x ?? 0.5) * W, top: (layer.y ?? 0.5) * H, width: w, height: h, zIndex: 30 + index,
    transform: `translate(-50%,-50%) rotate(${layer.rotation}deg)`, filter: glow};
  if (layer.shape === 'mask') {
    const url = `url("${ctx.src(layer.asset)}")`;
    // translucent tint so the drawing underneath stays readable
    return <div style={{...common, opacity: fx.opacity * (0.35 + 0.25 * pulse), background: color, WebkitMaskImage: url, maskImage: url, WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center'}}/>;
  }
  // glowing ring: outline + faint fill, never hides what it points at
  return <div style={{...common, opacity: fx.opacity * (0.7 + 0.3 * pulse), borderRadius: layer.shape === 'circle' ? '50%' : Math.min(w, h) / 2,
    background: hexA(color, 0.12), border: `${Math.max(6, Math.round(w * 0.035))}px solid ${color}`}}/>;
}

function MeasureLayer({ctx, layer, index}) {
  const {t, W, H} = ctx;
  const color = layer.color ?? ctx.style.accent;
  const end = (v) => {
    if (Array.isArray(v)) return toPx(ctx, v);
    const a = anchorOf(ctx, layer, v);
    return a ? centroid(a.points) : [W / 2, H / 2];
  };
  const [x1, y1] = end(layer.from);
  const [x2, y2] = end(layer.to);
  const draw = clamp01((t - layer._at) / 0.4);
  const fade = lifeFx(t, layer._at, layer._until, 'cut', layer.exit ?? 'fade').opacity;
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const nx = -(y2 - y1) / len * 22, ny = (x2 - x1) / len * 22;
  const ex = x1 + (x2 - x1) * draw, ey = y1 + (y2 - y1) * draw;
  return <svg width={W} height={H} style={{position: 'absolute', inset: 0, zIndex: 40 + index, opacity: fade, filter: `drop-shadow(0 0 8px ${hexA(color, 0.8)})`}}>
    <line x1={x1 - nx} y1={y1 - ny} x2={x1 + nx} y2={y1 + ny} stroke={color} strokeWidth={8} strokeLinecap="round"/>
    <line x1={x1} y1={y1} x2={ex} y2={ey} stroke={color} strokeWidth={8} strokeLinecap="round"/>
    {draw >= 1 ? <line x1={x2 - nx} y1={y2 - ny} x2={x2 + nx} y2={y2 + ny} stroke={color} strokeWidth={8} strokeLinecap="round"/> : null}
    {layer.label && draw >= 1 ? (Math.abs(x2 - x1) > Math.abs(y2 - y1)
      ? <text x={(x1 + x2) / 2} y={Math.min(y1, y2) - 34} fill={color} style={{fontFamily: FONT_DISPLAY}} fontSize={78} fontWeight={700} fontStyle="italic" textAnchor="middle">{layer.label}</text>
      : <text x={Math.max(x1, x2) + 40} y={(y1 + y2) / 2 + 26} fill={color} style={{fontFamily: FONT_DISPLAY}} fontSize={78} fontWeight={700} fontStyle="italic" textAnchor="start">{layer.label}</text>) : null}
  </svg>;
}

function ZoomBubbleLayer({ctx, layer, index}) {
  const {t, W, H} = ctx;
  const d = layer.size * W;
  const fx = lifeFx(t, layer._at, layer._until, layer.enter ?? 'pop', layer.exit ?? 'pop');
  let asset = layer.asset, focus = layer.focus ?? [0.5, 0.5], zoom = layer.zoom ?? 2.5, x = layer.x, y = layer.y;
  const a = anchorOf(ctx, layer);
  if (a) {
    // magnify the body part on the image the character layer is showing
    asset = layer.asset ?? a.view.asset;
    focus = centroid(a.imagePoints);
    const imgW = a.view.meta?.size?.[0] ?? 1000;
    zoom = layer.zoom ?? Math.max(1.2, Math.min(6, (0.75 * d * imgW) / (a.size / a.view.pxPerImagePx) / d));
    const [px, py] = centroid(a.points);
    x = x ?? (px > W / 2 ? 0.27 : 0.73);
    y = y ?? Math.max(0.3, Math.min(0.72, py / H - 0.1));
  }
  x = x ?? 0.5; y = y ?? 0.3;
  return <div style={{position: 'absolute', left: x * W, top: y * H, zIndex: 60 + index, transform: 'translate(-50%,-50%)'}}>
    <div style={{...fxStyle(fx), width: d, height: d, borderRadius: '50%', border: `${Math.round(d * 0.035)}px solid ${layer.borderColor}`,
      background: layer.background ?? '#F5F7FA', boxShadow: '0 10px 30px rgba(0,0,0,.18)', overflow: 'hidden', position: 'relative'}}>
      {/* the focus point of the image sits in the middle of the circle */}
      <Img src={ctx.src(asset)} style={{position: 'absolute', left: '50%', top: '50%', width: d * zoom, maxWidth: 'none',
        transform: `translate(${-focus[0] * 100}%, ${-focus[1] * 100}%)`}}/>
    </div>
  </div>;
}

function SplitLayer({ctx, layer, index}) {
  const {t, W, H} = ctx;
  const [cols, rows] = layer.layout === '2x2' ? [2, 2] : layer.layout === '1x2' ? [1, 2] : [2, 1];
  const colors = layer.colors ?? ['#E3EEFF', '#FFF3D1'];
  const cw = W / cols, ch = H / rows;
  const fade = lifeFx(t, layer._at, layer._until, layer.enter ?? 'cut', layer.exit).opacity;
  return <div style={{position: 'absolute', inset: 0, zIndex: 20 + index, opacity: fade}}>
    {Array.from({length: cols * rows}).map((_, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const cell = layer.cells[i];
      const bg = colors[(c + r) % colors.length];
      const p = cell ? easeP(t - (cell.at ?? layer._at), 0.3) : 0;
      return <div key={i} style={{position: 'absolute', left: c * cw, top: r * ch, width: cw, height: ch, background: bg, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {cell?.asset && p > 0 ? <CroppedImg ctx={ctx} asset={cell.asset} maxW={cw * cell.width} maxH={ch * 0.85} style={fxStyle(withIdle({...IDENTITY}, enterFx('pop', p)))}/> : null}
      </div>;
    })}
  </div>;
}
const easeP = (dt, dur) => clamp01(dt / dur);

// Shows only the drawn part of an image (library bbox), fitted inside maxW x maxH.
function CroppedImg({ctx, asset, maxW, maxH, style}) {
  const m = ctx.meta(asset);
  const [x0, y0, x1, y1] = m?.bbox ?? [0, 0, 1, 1];
  const [iw, ih] = m?.size ?? [1, 1];
  const cropW = (x1 - x0) * iw, cropH = (y1 - y0) * ih;
  const k = Math.min(maxW / cropW, maxH / cropH);
  const imgW = iw * k;
  return <div style={{width: cropW * k, height: cropH * k, overflow: 'hidden', position: 'relative', ...style}}>
    <Img src={ctx.src(asset)} style={{position: 'absolute', width: imgW, maxWidth: 'none', left: -x0 * imgW, top: -y0 * ih * k}}/>
  </div>;
}

function PatternLayer({ctx, layer, index}) {
  const {t, W, H} = ctx;
  const cw = W / layer.cols, ch = H / layer.rows;
  const shift = ((t - layer._at) * layer.drift) % ch;
  const fade = lifeFx(t, layer._at, layer._until, layer.enter ?? 'fade', layer.exit ?? 'fade').opacity;
  const cells = [];
  for (let r = -1; r <= layer.rows; r++) for (let c = -1; c <= layer.cols; c++) {
    cells.push(<Img key={`${r}-${c}`} src={ctx.src(layer.asset)} style={{position: 'absolute', left: c * cw + (r % 2 ? cw / 2 : 0) + shift, top: r * ch + shift, width: cw * 0.85}}/>);
  }
  return <div style={{position: 'absolute', inset: 0, zIndex: index, opacity: (layer.opacity ?? 0.25) * fade, overflow: 'hidden'}}>{cells}</div>;
}

// Number that counts up (or down) on screen: "0 -> 60 SEC", "DAY 1 -> DAY 30".
function CounterLayer({ctx, layer, index}) {
  const {t, W, H} = ctx;
  const fx = lifeFx(t, layer._at, layer._until, layer.enter ?? 'pop', layer.exit ?? 'pop');
  const p = clamp01((t - layer._at) / layer.duration);
  const e = 1 - Math.pow(1 - p, 3);
  const v = layer.from + (layer.to - layer.from) * e;
  const text = `${layer.prefix}${v.toFixed(layer.decimals)}${layer.suffix}`;
  const tick = p < 1 ? 1 + 0.06 * Math.abs(Math.sin((t - layer._at) * 40)) : 1;
  return <div style={{position: 'absolute', left: layer.x * W, top: layer.y * H, zIndex: 55 + index, transform: `translate(-50%,-50%) rotate(${layer.tilt ?? 0}deg)`}}>
    <div style={{...fxStyle(fx), display: 'inline-block', whiteSpace: 'nowrap', fontSize: layer.size, lineHeight: 1.1,
      ...(lookStyle(layer.look, layer.size, layer.color, layer.boxColor, t - layer._at) ?? {fontFamily: FONT_DISPLAY, fontWeight: W_DISPLAY, color: layer.color ?? ctx.style.textColor})}}>
      <span style={{display: 'inline-block', transform: `scale(${tick})`}}>{text}</span>
    </div>
  </div>;
}

// Progress bar that fills up, e.g. "DAY 7 / 30".
function ProgressLayer({ctx, layer, index}) {
  const {t, W, H} = ctx;
  const fx = lifeFx(t, layer._at, layer._until, layer.enter ?? 'up', layer.exit ?? 'fade');
  const p = clamp01((t - layer._at - 0.15) / layer.duration);
  const v = layer.from + (layer.to - layer.from) * (1 - Math.pow(1 - p, 3));
  const w = layer.width * W, h = Math.max(30, H * 0.05);
  return <div style={{position: 'absolute', left: layer.x * W, top: layer.y * H, zIndex: 55 + index, transform: 'translate(-50%,-50%)', width: w}}>
    <div style={fxStyle(fx)}>
      {layer.label ? <div style={{...lookStyle('pop', h * 2.1, '#FFFFFF'), fontSize: h * 2.1, lineHeight: 1.1, textAlign: 'center', marginBottom: h * 0.3}}>{layer.label}</div> : null}
      <div style={{height: h, borderRadius: h / 2, background: '#FFFFFF', border: `${Math.round(h * 0.16)}px solid #111111`, overflow: 'hidden', boxShadow: `0 ${h * 0.18}px 0 #111111`}}>
        <div style={{width: `${v * 100}%`, height: '100%', background: layer.color,
          backgroundImage: 'repeating-linear-gradient(-45deg, rgba(255,255,255,.25) 0 12px, transparent 12px 24px)'}}/>
      </div>
    </div>
  </div>;
}

export const LAYERS = {
  image: ImageLayer, poses: PoseLayer, video: VideoLayer, text: TextLayer, arrow: ArrowLayer,
  highlight: HighlightLayer, measure: MeasureLayer, zoomBubble: ZoomBubbleLayer, split: SplitLayer, pattern: PatternLayer,
  counter: CounterLayer, progress: ProgressLayer,
};
