import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, random, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Captions} from './Captions.jsx';
import {LAYERS as BASE_LAYERS} from './layers.jsx';
import {GRAPHICS} from './graphics.jsx';
import {FX_LAYERS} from './fx.jsx';
import {cameraPoint, cameraState, cameraTransform, clamp01, shakeOffset, transitionFx} from './motion.js';
import {BIG_GRAPHICS, graphicBox, graphicSounds} from './mgLayout.js';
import {AUTO_BACKDROPS, fontVars, themeOf} from './theme.js';
import {animOf, safeZoneOf} from './schema.js';
import {captionY} from './Captions.jsx';
import {canvasAnchor, centroid, targetView} from './anchors.js';
import {faceSafeScale, stackTexts} from './textSafety.js';

// Titles and zoom bubbles stay fixed on screen; everything else moves with camera + shake.
const LAYERS = {...BASE_LAYERS, ...GRAPHICS, ...FX_LAYERS};
const SCREEN_SPACE = new Set(['text', 'zoomBubble', 'counter', 'progress', 'checklist', 'bars', 'ring', 'banner', 'versus', 'chat', 'accent',
  'icon', 'stat', 'comment', 'timeline', 'slider', 'kinetic', 'chip', 'pulse']);
const CHARACTER = new Set(['image', 'poses', 'video']);
const OVERLAY = new Set(['highlight', 'arrow', 'measure', 'zoomBubble', 'callout', 'glow', 'path']);

const cleanWord = (w) => String(w || '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const isUrl = (s) => /^(https?:|data:|blob:)/i.test(s);

// baseUrl (set by the web tool's renderer) loads files live from the tool's server,
// so projects and images added after start-up are found; otherwise they come from
// the Remotion bundle's public/ copy (CLI render, Studio, preview player).
export function makeResolver(library, baseUrl) {
  const byId = new Map((library?.assets || []).map((a) => [a.id, a.file]));
  return (idOrPath) => {
    if (!idOrPath) return '';
    const file = byId.get(idOrPath) ?? idOrPath;
    if (isUrl(file)) return file;
    const rel = file.replace(/^\/?public\//, '').replace(/^\//, '');
    return baseUrl ? `${baseUrl.replace(/\/$/, '')}/${rel.split('/').map(encodeURIComponent).join('/')}` : staticFile(rel);
  };
}

// Decoration behind a scene so the background is never plain white: a light wash of the colour + a moving pattern.
function Backdrop({kind, color, strength = 1, t, W, H}) {
  const c = color ?? '#FFD23F';
  const k = Math.max(0, strength);
  const a = (v) => Math.min(1, v * k);
  const wash = <AbsoluteFill style={{background: `linear-gradient(170deg, ${c}${alphaHex(0.10 * k)} 0%, ${c}${alphaHex(0.04 * k)} 55%, ${c}${alphaHex(0.14 * k)} 100%)`}}/>;
  const fill = (style) => <>{wash}<AbsoluteFill style={style}/></>;
  const drift = t * 18;
  if (kind === 'rays') {
    const n = 18;
    return <>{wash}<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, opacity: a(0.2)}}>
      <g transform={`translate(${W / 2},${H / 2}) rotate(${t * 6})`}>
        {Array.from({length: n}, (_, i) => {
          const a0 = (i * 2 / (n * 2)) * Math.PI * 2, a1 = ((i * 2 + 1) / (n * 2)) * Math.PI * 2, r = Math.hypot(W, H);
          return <polygon key={i} points={`0,0 ${r * Math.cos(a0)},${r * Math.sin(a0)} ${r * Math.cos(a1)},${r * Math.sin(a1)}`} fill={c}/>;
        })}
      </g>
    </svg></>;
  }
  if (kind === 'dots') return fill({opacity: a(0.38), backgroundImage: `radial-gradient(${c} 20%, transparent 22%)`, backgroundSize: '44px 44px', backgroundPosition: `${drift}px ${drift}px`});
  if (kind === 'grid') return fill({opacity: a(0.3), backgroundImage: `linear-gradient(${c} 3px, transparent 3px), linear-gradient(90deg, ${c} 3px, transparent 3px)`,
    backgroundSize: '72px 72px', backgroundPosition: `0px ${drift}px`});
  if (kind === 'stripes') return fill({opacity: a(0.22), backgroundImage: `repeating-linear-gradient(-45deg, ${c} 0 28px, transparent 28px 64px)`,
    backgroundPosition: `${drift * 1.5}px 0px`});
  if (kind === 'halftone') return fill({opacity: a(0.45), backgroundImage: `radial-gradient(${c} 30%, transparent 32%)`, backgroundSize: '36px 36px',
    WebkitMaskImage: 'linear-gradient(to bottom, transparent 15%, #000 100%)', maskImage: 'linear-gradient(to bottom, transparent 15%, #000 100%)'});
  if (kind === 'notebook') return <>{wash}<AbsoluteFill style={{opacity: a(0.35), backgroundImage: `linear-gradient(transparent 62px, ${c} 62px, ${c} 66px)`, backgroundSize: '100% 66px', backgroundPosition: `0px ${drift}px`}}/>
    <div style={{position: 'absolute', top: 0, bottom: 0, left: W * 0.09, width: 5, background: '#FF4D3D', opacity: a(0.45)}}/></>;
  if (kind === 'plus') {
    const sz = 70;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${sz}' height='${sz}'><path d='M${sz / 2} ${sz / 2 - 11}v22M${sz / 2 - 11} ${sz / 2}h22' stroke='${c}' stroke-width='6' stroke-linecap='round'/></svg>`;
    return fill({opacity: a(0.45), backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`, backgroundSize: `${sz}px ${sz}px`, backgroundPosition: `${drift}px ${-drift}px`});
  }
  if (kind === 'checker') return fill({opacity: a(0.12), backgroundImage: `conic-gradient(${c} 25%, transparent 0 50%, ${c} 0 75%, transparent 0)`, backgroundSize: '140px 140px',
    backgroundPosition: `${drift}px ${drift}px`});
  if (kind === 'waves') {
    const rows = 12, step = H / rows;
    return <>{wash}<svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: a(0.3)}}>
      {Array.from({length: rows + 1}, (_, i) => {
        const y0 = i * step, ph = t * 1.4 + i * 0.6;
        const d = Array.from({length: 25}, (_, j) => `${j ? 'L' : 'M'} ${(j / 24) * W} ${y0 + Math.sin(ph + j * 0.55) * 16}`).join(' ');
        return <path key={i} d={d} fill="none" stroke={c} strokeWidth={5} strokeLinecap="round"/>;
      })}
    </svg></>;
  }
  if (kind === 'blobs') {
    const blob = (bx, by, r, sp, o) => <div style={{position: 'absolute', left: (bx + 0.06 * Math.sin(t * sp + o)) * W, top: (by + 0.04 * Math.cos(t * sp * 0.8 + o)) * H,
      width: r * W, height: r * W, translate: '-50% -50%', borderRadius: '50%', background: c, opacity: a(0.28), filter: 'blur(70px)'}}/>;
    return <>{wash}{blob(0.15, 0.18, 0.8, 0.5, 0)}{blob(0.9, 0.55, 0.7, 0.4, 2)}{blob(0.3, 0.92, 0.75, 0.6, 4)}</>;
  }
  if (kind === 'spotlight') return <AbsoluteFill style={{background: `radial-gradient(ellipse 60% 55% at 50% 52%, ${c}${alphaHex(0.45 * k)} 0%, ${c}${alphaHex(0.16 * k)} 55%, ${c}${alphaHex(0.08 * k)} 100%)`}}/>;
  return null;
}
const alphaHex = (v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0');

// Layers of a scene at time t, ready to draw: times filled in, texts stacked off each other and off the cards,
// characters moved down / smaller while a big card is on screen, overlays tied to their character.
function prepareScene(scene, ctx, visibleUntil) {
  const {t, W, H} = ctx;
  // default end = while the scene is on screen, incl. under the next scene's transition
  // titles are erased before the next scene slides in, so two titles never overlap
  const layers = scene.layers.map((l, i) => ({...l, _index: i, _safe: l.type === 'text' && !l.behind && !['marquee', 'tape'].includes(l.look) ? ctx.safe : undefined, _at: l.at ?? scene.start,
    _until: l.until ?? (l.type === 'text' ? Math.min(visibleUntil, Math.max(scene.end, scene.start + 0.5)) : visibleUntil)}));
  // letter width of the theme's fonts, so texts are sized to fit with any font set
  const wk = ctx.theme.fonts.wk;
  layers.forEach((l) => { l._wk = l.type === 'text' ? wk[l.look ?? 'display'] ?? 1 : wk.pop; });
  const isChar = (l) => CHARACTER.has(l.type);
  const isPerson = (l) => isChar(l) && !/^prop_/.test(l.asset || '') && l.frame !== 'circle';
  // big cards: where they sit, so stickers and H keep off them
  const cards = layers.filter((l) => BIG_GRAPHICS.has(l.type));
  cards.forEach((g) => { g._rect = graphicBox(g, W, H, ctx.safe); });
  stackTexts(layers, W, H, cards.filter((g) => g._rect));
  // auto layout (9:16): while a card sits in the upper part, H eases down below it (smaller only if he must be)
  if (H > W) {
    // stretches of time with a card in the upper part (cards that follow closely count as one), with the lowest card edge
    const spans = (() => {
      const list = cards.filter((g) => g._rect && g._rect.cy < H * 0.6).map((g) => [g._at, g._until, g._rect.y1]).sort((p, q) => p[0] - q[0]);
      const out = [];
      list.forEach(([a, b, y1]) => {
        const last = out[out.length - 1];
        if (last && a <= last[1] + 0.4) { last[1] = Math.max(last[1], b); last[2] = Math.max(last[2], y1); } else out.push([a, b, y1]);
      });
      return out;
    })();
    // H moves just below the card and only gets as small as he must to fit between the card and the floor
    const fitBelow = (c, cardBottom) => {
      const m = ctx.meta(c.type === 'poses' ? c.frames[0].asset : c.asset);
      const asp = m?.size ? m.size[1] / m.size[0] : 1.79;
      const [, by0, , by1] = m?.bbox ?? [0, 0.05, 1, 0.98];
      const top = cardBottom + H * 0.035, bottom = H * 0.985;
      let w = c.width * W;
      const drawn = (by1 - by0) * w * asp;
      if (drawn > bottom - top) w *= (bottom - top) / drawn;
      const h = w * asp;
      let y = Math.max(c.y * H, top - (by0 - 0.5) * h);
      y = Math.min(y, bottom - (by1 - 0.5) * h);
      return {y: y / H, width: w / W};
    };
    layers.filter((l) => isPerson(l) && l.autoPlace !== false).forEach((c) => {
      let v = 0, span = null;
      spans.forEach((sp) => {
        const [a, b] = sp;
        // H starts moving a moment before the card comes, so the card never lands on his head
        if (b <= c._at || a >= c._until || t < a - 0.35 || t >= b) return;
        const inn = a <= c._at + 0.01 ? 1 : clamp01((t - a + 0.35) / 0.35);
        const out = b >= c._until - 0.01 ? 1 : clamp01((b - t) / 0.35);
        if (Math.min(inn, out) > v) { v = Math.min(inn, out); span = sp; }
      });
      if (v > 0) {
        const e = v * v * (3 - 2 * v);
        const to = fitBelow(c, span[2]);
        c.y = c.y + (to.y - c.y) * e;
        c.width = c.width + (to.width - c.width) * e;
      }
    });
  }
  // overlays attach to a character layer: `target` id, else the closest one above them in the list
  layers.forEach((l, i) => {
    if (!OVERLAY.has(l.type)) return;
    l._target = (l.target && layers.find((o) => o.id === l.target)) || [...layers.slice(0, i)].reverse().find(isChar) || layers.find(isChar);
  });
  // props (prop_* images) keep clear of the character on screen when they appear
  layers.forEach((l) => {
    if (l.type !== 'image' || !/^prop_/.test(l.asset || '') || l.x === undefined) return;
    l._avoid = layers.find((o) => o !== l && isChar(o) && !/^prop_/.test(o.asset || '') && o._at <= l._at && l._at < o._until);
  });
  // camera focus may name a body part of the character on screen at that moment
  // hook: the first scene opens with a punch-in that snaps back, so frame 1 already moves
  const cameraKeys = scene.camera ?? (ctx.hookPunch && scene === ctx.firstScene
    ? [{at: scene.start, zoom: 1.14, focus: [0.5, 0.42]}, {at: scene.start + 0.45, zoom: 1, focus: [0.5, 0.42]}] : undefined);
  const camKeys = cameraKeys?.map((k) => {
    if (typeof k.focus !== 'string') return k;
    const target = layers.find((l) => isChar(l) && l._at <= k.at && k.at < l._until) || layers.find(isChar);
    const a = target && canvasAnchor(ctx, target, k.focus, k.at);
    return {...k, focus: a ? [centroid(a.points)[0] / W, centroid(a.points)[1] / H] : [0.5, 0.5]};
  });
  // H's face now (canvas px, and on screen after the camera): icons, props, accents and labels never sit on it
  const facesCanvas = layers.filter((c) => isPerson(c) && t >= c._at && t < c._until).map((c) => faceRect(ctx, c, t)).filter(Boolean);
  const cam = cameraState(camKeys, t);
  const facesScreen = facesCanvas.map((f) => {
    const [x0, y0] = cameraPoint(cam, [f.x0, f.y0], W, H), [x1, y1] = cameraPoint(cam, [f.x1, f.y1], W, H);
    return {x0, y0, x1, y1};
  });
  layers.forEach((l) => {
    if (l.type === 'glow') l._faces = facesCanvas;
    if (['icon', 'accent', 'callout', 'chip'].includes(l.type)) l._faces = l.type === 'callout' ? facesCanvas : facesScreen;
    if (l.type === 'image' && /^prop_/.test(l.asset || '')) l._faces = facesCanvas;
  });
  layers._camKeys = camKeys;
  return layers;
}

// Rectangle around H's head (canvas px), from the drawing's head point, else the top of its outline.
function faceRect(ctx, c, t) {
  const a = canvasAnchor(ctx, c, 'head', t);
  if (a) {
    const [x, y] = centroid(a.points);
    const r = Math.max(a.size * 0.62, ctx.W * 0.085);
    return {x0: x - r, x1: x + r, y0: y - r * 1.15, y1: y + r * 1.05};
  }
  const view = targetView(ctx, c, t);
  const [x0, y0, x1, y1] = view.meta?.bbox ?? [0.2, 0.03, 0.8, 0.98];
  const [px0, py0] = view.toCanvas([x0 + (x1 - x0) * 0.3, y0]);
  const [px1, py1] = view.toCanvas([x1 - (x1 - x0) * 0.3, y0 + (y1 - y0) * 0.17]);
  return {x0: Math.min(px0, px1), x1: Math.max(px0, px1), y0: py0, y1: py1};
}

// Scene transitions drawn on the incoming scene: {style for the scene, overlay drawn above it}
function sceneTransition(tr, p, ctx, seed) {
  const {W, H} = ctx;
  const e = Easing.out(Easing.cubic)(clamp01(p));
  if (tr === 'circle') return {style: {clipPath: `circle(${76 * e}% at 50% 50%)`}};
  if (tr === 'wipe') {
    const tints = ctx.theme.tints;
    return {style: {clipPath: `inset(0 ${(1 - e) * 100}% 0 0)`}, overlay: p < 1 ? <AbsoluteFill style={{zIndex: 900, pointerEvents: 'none'}}>
      {[0, 1, 2].map((i) => {
        const x = (e * 1.25 - i * 0.09) * W;
        return <div key={i} style={{position: 'absolute', top: 0, height: H, left: x - W * 0.09, width: W * 0.09, background: tints[i % tints.length],
          borderLeft: `6px solid ${ctx.theme.dark}`, borderRight: `6px solid ${ctx.theme.dark}`}}/>;
      })}
    </AbsoluteFill> : null};
  }
  if (tr === 'zoomThrough') return {style: {transform: `scale(${1.9 - 0.9 * e})`, filter: e < 0.99 ? `blur(${(1 - e) * 12}px)` : undefined, opacity: clamp01(p * 3)}};
  if (tr === 'glitch') {
    const k = 1 - clamp01(p);
    const step = Math.floor(p * 12);
    const jx = (random(`gx-${seed}-${step}`) - 0.5) * 90 * k;
    const slices = [0, 1, 2].map((i) => ({y: random(`gy-${seed}-${step}-${i}`) * H, h: 12 + random(`gh-${seed}-${step}-${i}`) * 60, dx: (random(`gd-${seed}-${step}-${i}`) - 0.5) * 140 * k}));
    return {style: {transform: `translateX(${jx}px)`, filter: k > 0.02 ? `drop-shadow(${10 * k}px 0 0 rgba(255,0,80,.75)) drop-shadow(${-10 * k}px 0 0 rgba(0,220,255,.75))` : undefined},
      overlay: k > 0.02 ? <AbsoluteFill style={{zIndex: 900, pointerEvents: 'none'}}>
        {slices.map((sl, i) => <div key={i} style={{position: 'absolute', left: sl.dx, top: sl.y, width: W, height: sl.h, background: i % 2 ? 'rgba(255,0,80,.35)' : 'rgba(0,220,255,.35)', mixBlendMode: 'multiply'}}/>)}
      </AbsoluteFill> : null};
  }
  return {style: transitionFx(tr, p, W, H)};
}

function Scene({scene, index, layers, ctx, captionRect}) {
  const {t, W, H} = ctx;
  const tr = animOf(scene.transition, 0.35);
  const trFx = tr.duration > 0 && t - scene.start < tr.duration ? sceneTransition(tr.type, (t - scene.start) / tr.duration, ctx, index) : {};

  let shake = {x: 0, y: 0, rot: 0};
  (scene.shakes || []).forEach((s, i) => {
    if (t >= s.at && t < s.at + s.duration) {
      const o = shakeOffset(t - s.at, s.intensity * (1 - (t - s.at) / s.duration), i);
      shake = {x: shake.x + o.x, y: shake.y + o.y, rot: shake.rot + o.rot};
    }
  });
  const isChar = (l) => CHARACTER.has(l.type);
  const camKeys = layers._camKeys;
  const cam = cameraTransform(camKeys, t, W, H);
  // text never on a face: if a title or caption would cover a character's head, the drawing eases smaller toward the floor
  const people = layers.filter((l) => isChar(l) && !/^prop_/.test(l.asset || ''));
  const texts = layers.filter((l) => l.type === 'text' && !l.behind && !['marquee', 'tape'].includes(l.look));
  const safe = people.length ? faceSafeScale(ctx, people, texts, camKeys, captionRect) : 1;
  const draw = (screen) => layers.map((l, i) => {
    if ((SCREEN_SPACE.has(l.type) && !(l.type === 'text' && l.behind)) !== screen || t < l._at || t >= l._until) return null;
    const C = LAYERS[l.type];
    return C ? <C key={l.id ?? i} ctx={ctx} layer={l} index={i}/> : null;
  });
  // every scene has a pattern behind it: the plan's, else one picked for it from the theme
  // an animation clip always plays on a plain background (patterns behind a moving H look busy)
  const hasClip = scene.layers.some((l) => l.type === 'video');
  const kind = hasClip ? 'none' : scene.backdrop ?? AUTO_BACKDROPS[index % AUTO_BACKDROPS.length];
  const tint = scene.backdropColor ?? ctx.theme.tints[index % ctx.theme.tints.length];

  return <>
    {/* each scene is its own layer: the incoming scene always covers everything of the outgoing one */}
    <AbsoluteFill style={{background: scene.background ?? ctx.background, overflow: 'hidden', zIndex: index + 1, ...(trFx.style ?? {})}}>
      {kind !== 'none' ? <Backdrop kind={kind} color={tint} strength={scene.backdropOpacity} t={t - scene.start} W={W} H={H}/> : null}
      <AbsoluteFill style={{transform: safe < 0.999 ? `scale(${safe})` : undefined, transformOrigin: '50% 97%'}}>
        <AbsoluteFill style={{transform: `${cam ?? ''} translate(${shake.x}px,${shake.y}px) rotate(${shake.rot}deg)`, transformOrigin: '50% 50%'}}>
          {/* an animation clip on a white background is multiplied onto the scene: it needs the backdrop inside its own group
              (the camera box is a separate group), so a slightly larger copy of the backdrop is drawn here behind the layers */}
          {scene.layers.some((l) => l.type === 'video' && l.blend !== 'normal') ? <div style={{position: 'absolute', inset: '-8%', zIndex: -1000, background: scene.background ?? ctx.background}}>
            {kind !== 'none' ? <Backdrop kind={kind} color={tint} strength={scene.backdropOpacity} t={t - scene.start} W={W * 1.16} H={H * 1.16}/> : null}
          </div> : null}
          {draw(false)}
        </AbsoluteFill>
      </AbsoluteFill>
      {draw(true)}
      {tr.type === 'flash' && t - scene.start < 0.2 ? <AbsoluteFill style={{background: '#FFFFFF', opacity: 1 - (t - scene.start) / 0.2}}/> : null}
    </AbsoluteFill>
    {trFx.overlay ? <AbsoluteFill style={{zIndex: index + 1}}>{trFx.overlay}</AbsoluteFill> : null}
  </>;
}

export const ReelVideo = ({timeline, library, baseUrl}) => {
  const frame = useCurrentFrame();
  const {fps, width, height, durationInFrames} = useVideoConfig();
  const t = frame / fps;
  const src = makeResolver(library, baseUrl);
  const metaById = new Map((library?.assets || []).map((a) => [a.id, a]));
  const theme = themeOf(timeline.theme, timeline.font);
  // key words of the captions: H gives a little bounce on each one
  const kw = new Set((timeline.captions.keywords || []).map(cleanWord));
  const beats = timeline.words.filter((w) => kw.has(cleanWord(w.text))).map((w) => w.start);
  const ctx = {
    t, fps, W: width, H: height, src, meta: (id) => metaById.get(id), safe: safeZoneOf(width, height),
    background: timeline.canvas.background, theme, beats, hookPunch: timeline.hookPunch, firstScene: timeline.scenes[0],
    style: {...timeline.style, accent: timeline.style.accent ?? (timeline.theme ? theme.main : '#22E6FF'),
      danger: timeline.style.danger ?? theme.bad, accentText: timeline.style.accentText ?? '#111111'},
  };
  const scenes = timeline.scenes;
  const transitionOf = (s) => (s ? animOf(s.transition, 0.35).duration : 0);
  // a step title (text near the top) is on screen at time tt
  const titleOn = (tt) => scenes.some((s, i) => {
    const next = scenes[i + 1];
    const end = Math.max(s.end, s.start + 0.5);
    return tt >= s.start && tt < (next ? Math.max(s.end, next.start) + transitionOf(next) : s.end) && s.layers.some((l) => l.type === 'text' && (l.y ?? 0.17) < 0.3
      && tt >= (l.at ?? s.start) && tt < (l.until ?? end));
  });
  // automatic sounds for the motion graphics, unless the plan already has a sound within 0.3 s
  const autoSfx = React.useMemo(() => {
    if (!timeline.audio.autoSfx) return [];
    const planned = timeline.sfx.map((x) => x.at);
    const out = [];
    scenes.forEach((s) => s.layers.forEach((l) => graphicSounds(l, l.at ?? s.start).forEach((x) => {
      if (planned.some((p) => Math.abs(p - x.at) < 0.3) || out.some((o) => Math.abs(o.at - x.at) < 0.3)) return;
      if (metaById.has(x.src)) out.push({...x, auto: true});
    })));
    return out;
  }, [timeline, library]);
  const allSfx = [...timeline.sfx, ...autoSfx];
  // a big motion graphic (checklist, chart, ring, chat, wrong-vs-right) is on screen: it says the words itself, so no captions
  const graphicOn = (tt) => scenes.some((s, i) => {
    const next = scenes[i + 1];
    const end = next ? Math.max(s.end, next.start) : s.end;
    return tt >= s.start && tt < end && s.layers.some((l) => BIG_GRAPHICS.has(l.type) && tt >= (l.at ?? s.start) && tt < (l.until ?? end));
  });
  // where the big top caption is at time tt (null when hidden or at the bottom)
  const cap = timeline.captions, words = timeline.words;
  const captionRect = (tt) => {
    if (cap.mode === 'none' || !words.length || cap.hide.some(([a, b]) => tt >= a && tt < b) || graphicOn(tt)) return null;
    if (titleOn(tt) || cap.bottom.some(([a, b]) => tt >= a && tt < b)) return null;
    let i = -1;
    for (let k = 0; k < words.length; k++) if (words[k].start <= tt) i = k;
    if (i < 0 || tt > Math.max(words[i].end + 0.6, words[i + 1]?.start ?? 0)) return null;
    const n = cap.mode === 'word' ? words[i].text.length : Math.min(40, words.slice(i, i + cap.maxWords).map((w) => w.text).join(' ').length);
    const size = cap.size * 1.25 * 1.15;
    const sz = safeZoneOf(width, height);
    const cx = sz ? ((sz.x0 + sz.x1) / 2) * width : width / 2, cy = captionY(cap.y, false, width, height);
    const w = Math.min(sz ? (sz.x1 - sz.x0) * width : width - 120, n * size * 0.62), h = size * 1.15;
    return {x0: cx - w / 2 - 20, x1: cx + w / 2 + 20, y0: cy * height - h / 2 - 10, y1: cy * height + h / 2 + 10};
  };

  // scenes on screen now (the outgoing one stays under the incoming one while it transitions in)
  const active = scenes.map((s, i) => {
    const next = scenes[i + 1];
    const visibleUntil = next ? Math.max(s.end, next.start) + transitionOf(next) : s.end;
    return t >= s.start && t < visibleUntil ? {s, i, layers: prepareScene(s, ctx, visibleUntil)} : null;
  }).filter(Boolean);
  // stickers on screen now (not the step titles): the small bottom captions move above them
  const stickers = active.flatMap(({layers}) => layers.filter((l) => l.type === 'text' && (l.y ?? 0.17) >= 0.3 && t >= l._at && t < l._until).map((l) => l._rect));

  return <AbsoluteFill style={{background: timeline.canvas.background, ...fontVars(theme.fonts)}}>
    {timeline.audio.voice ? <Audio src={src(timeline.audio.voice)} volume={timeline.audio.voiceVolume}/> : null}
    {timeline.audio.music ? <Audio src={src(timeline.audio.music)} loop volume={(f) => {
      // soft fade in at the start and out over the last seconds of the video
      const fade = Math.max(1, timeline.audio.musicFade * fps), total = durationInFrames;
      return timeline.audio.musicVolume * Math.min(1, (f + 1) / Math.min(fade, 0.3 * fps), (total - f) / fade);
    }}/> : null}
    {allSfx.map((s, i) => {
      // each sound plays for its own length (+ a little), so long memes aren't cut off
      const m = ctx.meta(s.src);
      const len = Math.min(15, (m?.duration ?? 2) + 0.2);
      return <Sequence key={i} from={Math.round(s.at * fps)} durationInFrames={Math.round(len * fps)} layout="none">
        <Audio src={src(s.src)} volume={(s.volume ?? m?.volume ?? 0.6) * timeline.audio.sfxVolume * (s.auto ? 0.85 : 1)}/>
      </Sequence>;
    })}

    {active.map(({s, i, layers}) => <Scene key={s.id ?? i} scene={s} index={i} layers={layers} ctx={ctx} captionRect={captionRect}/>)}

    {graphicOn(t) ? null : <Captions ctx={ctx} captions={timeline.captions} words={timeline.words} titleOn={titleOn(t)} avoid={stickers}/>}

    {/* retention bar: a thin red line along the top fills up over the whole video */}
    {timeline.progressBar ? <div style={{position: 'absolute', left: 0, top: 0, height: 14, zIndex: 990, width: `${(100 * frame) / Math.max(1, durationInFrames - 1)}%`,
      background: '#E3262E', boxShadow: '0 2px 0 #111111'}}/> : null}

    {/* the uploaded thumbnail over the first frames (Shorts): pick it as the cover after upload */}
    {timeline.cover && t < timeline.cover.duration ? <AbsoluteFill style={{zIndex: 1000, background: '#000'}}>
      <Img src={src(timeline.cover.src)} style={{width: '100%', height: '100%', objectFit: 'cover'}}/>
    </AbsoluteFill> : null}
  </AbsoluteFill>;
};
