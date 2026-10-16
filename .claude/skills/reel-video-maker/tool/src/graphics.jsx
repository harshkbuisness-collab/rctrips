// Motion-graphics layers: callout labels, checklists, bar charts, rings, banners, wrong-vs-right panels,
// chat bubbles, icons, stat cards, comment cards, day timelines, before/after sliders, kinetic text and
// small accent marks. Everything is placed and timed from the plan JSON; colours come from the theme.
import React from 'react';
import {Img} from 'remotion';
import {clamp01, fxStyle, lifeFx} from './motion.js';
import {canvasAnchor, centroid} from './anchors.js';
import {FONT_DISPLAY, FONT_POP, lookStyle, W_DISPLAY, W_POP} from './layers.jsx';
import {onColor} from './theme.js';
import {avoidFaces, barTimes, chatTimes, checklistTimes, graphicBox, inSafe, kineticSize, kineticTimes, sliderTime, timelineTimes, versusTimes} from './mgLayout.js';
import {ICONS} from './icons.jsx';

const ease = (p) => 1 - Math.pow(1 - clamp01(p), 3);
const back = (p) => {
  const q = clamp01(p) - 1;
  return 1 + 2.4 * q * q * q + 1.4 * q * q;
};
const th = (ctx) => ctx.theme;
const ink = (ctx) => ctx.theme.dark;

// Element that pops in at `at` (seconds): {opacity, transform}
const popIn = (t, at, dur = 0.28, from = 0.6) => {
  const p = clamp01((t - at) / dur);
  return {opacity: clamp01(p * 3), transform: `scale(${from + (1 - from) * back(p)})`};
};
const slideIn = (t, at, dx = 60, dur = 0.3) => {
  const p = clamp01((t - at) / dur);
  return {opacity: clamp01(p * 2.5), transform: `translateX(${dx * (1 - ease(p))}px)`};
};

const Card = ({ctx, children, style, pad = 28}) => <div style={{background: '#FFFFFF', border: `7px solid ${ink(ctx)}`, borderRadius: 34,
  boxShadow: `0 12px 0 ${ink(ctx)}`, padding: pad, boxSizing: 'border-box', ...style}}>{children}</div>;

// The card's box on screen, wrapped at its centre
const At = ({ctx, layer, index, children, z = 55}) => {
  const b = graphicBox(layer, ctx.W, ctx.H, ctx.safe);
  return <div style={{position: 'absolute', left: b.cx, top: b.cy, width: b.w, height: b.h, zIndex: z + index, translate: '-50% -50%'}}>{children(b)}</div>;
};

// Tick / cross / number badge, drawn on at time `at`.
function Mark({ctx, kind, n, at, t, size, color}) {
  const p = clamp01((t - at) / 0.3);
  const bg = kind === 'cross' ? th(ctx).bad : kind === 'tick' ? (color ?? th(ctx).good) : kind === 'number' ? (color ?? th(ctx).main) : '#FFFFFF';
  const dash = 40;
  return <div style={{width: size, height: size, flex: 'none', borderRadius: kind === 'box' ? size * 0.2 : '50%', background: p > 0 ? bg : '#FFFFFF',
    border: `${Math.max(4, size * 0.09)}px solid ${ink(ctx)}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transform: `scale(${p > 0 ? 0.7 + 0.3 * back(p) : 1})`}}>
    {kind === 'number' ? <span style={{fontFamily: FONT_POP, fontWeight: W_POP, color: onColor(bg, ink(ctx)), fontSize: size * 0.58, lineHeight: 1}}>{n}</span> : null}
    {kind === 'tick' || kind === 'cross' ? <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" style={{overflow: 'visible'}}>
      {kind === 'tick'
        ? <path d="M4 13 L10 19 L21 5" fill="none" stroke="#FFFFFF" strokeWidth={4.2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} strokeDashoffset={dash * (1 - ease(p))}/>
        : <g stroke="#FFFFFF" strokeWidth={4.2} strokeLinecap="round">
          <line x1={5} y1={5} x2={5 + 14 * ease(p * 2)} y2={5 + 14 * ease(p * 2)}/>
          {p > 0.5 ? <line x1={19} y1={5} x2={19 - 14 * ease(p * 2 - 1)} y2={5 + 14 * ease(p * 2 - 1)}/> : null}
        </g>}
    </svg> : null}
  </div>;
}

// Checklist / numbered steps: each item slides in and gets its tick (or cross / number) when it is spoken.
function ChecklistLayer({ctx, layer, index}) {
  const {t} = ctx;
  const fx = lifeFx(t, layer._at, layer._until, layer.enter ?? 'up', layer.exit ?? 'fade');
  const size = layer.size, rowH = size * 1.55;
  const times = checklistTimes(layer, layer._at);
  const color = layer.color ?? th(ctx).main;
  return <At ctx={ctx} layer={layer} index={index}>{() => <div style={fxStyle(fx)}>
    <Card ctx={ctx} pad={32} style={layer.card ? {} : {background: 'transparent', border: 'none', boxShadow: 'none'}}>
      {layer.title ? <div style={{fontFamily: FONT_POP, fontWeight: W_POP, fontSize: size * 1.05, color: onColor(color, ink(ctx)), background: color, display: 'inline-block',
        padding: `${size * 0.08}px ${size * 0.35}px`, borderRadius: size * 0.18, marginBottom: size * 0.35, transform: 'rotate(-2deg)'}}>{layer.title.toUpperCase()}</div> : null}
      {layer.items.map((it, i) => {
        const at = times[i];
        if (t < at) return <div key={i} style={{height: rowH}}/>;
        const kind = it.mark ?? layer.mark;
        return <div key={i} style={{display: 'flex', alignItems: 'center', gap: size * 0.4, height: rowH, ...slideIn(t, at, 70)}}>
          <Mark ctx={ctx} kind={kind} n={i + 1} at={at + 0.12} t={t} size={size * 1.1} color={kind === 'number' ? color : undefined}/>
          <div style={{fontFamily: FONT_DISPLAY, fontWeight: W_DISPLAY, fontSize: size, lineHeight: 1.05, color: ink(ctx), textTransform: 'uppercase', position: 'relative'}}>
            {it.text}
            {kind === 'cross' ? <div style={{position: 'absolute', left: '-3%', top: '50%', height: Math.max(5, size * 0.1), background: th(ctx).bad, borderRadius: 4,
              width: `${106 * ease((t - at - 0.35) / 0.3)}%`, transform: 'rotate(-2deg)'}}/> : null}
          </div>
        </div>;
      })}
    </Card>
  </div>}</At>;
}

// Bar chart: columns grow from the floor and their numbers count up.
function BarsLayer({ctx, layer, index}) {
  const {t, H} = ctx;
  const fx = lifeFx(t, layer._at, layer._until, layer.enter ?? 'up', layer.exit ?? 'fade');
  const times = barTimes(layer, layer._at);
  return <At ctx={ctx} layer={layer} index={index}>{(b) => {
    const w = b.w, h = layer.height * H;
    const max = layer.max ?? Math.max(...layer.items.map((it) => it.value)) * 1.08;
    const n = layer.items.length, gap = w * 0.06, bw = (w - gap * (n + 1)) / n;
    const fs = Math.min(layer.size, bw * 0.42);
    const colors = [th(ctx).good, th(ctx).bad, th(ctx).main, th(ctx).second];
    return <div style={{...fxStyle(fx), position: 'relative', width: w, height: h}}>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: fs * 1.5, height: 8, background: ink(ctx), borderRadius: 4}}/>
      {layer.items.map((it, i) => {
        const at = times[i];
        const p = ease((t - at) / layer.duration);
        const full = (h - fs * 3.4) * Math.min(1, it.value / max);
        const shown = it.display ?? `${layer.prefix ?? ''}${(it.value * p).toFixed(layer.decimals)}${layer.suffix ?? ''}`;
        return <div key={i} style={{position: 'absolute', left: gap + i * (bw + gap), width: bw, bottom: 0, height: h, opacity: t < at ? 0 : 1}}>
          <div style={{position: 'absolute', bottom: fs * 1.5 + 4, left: 0, width: bw, height: full * p, background: it.color ?? colors[i % colors.length],
            border: `6px solid ${ink(ctx)}`, borderBottom: 'none', borderRadius: '16px 16px 0 0', boxSizing: 'border-box',
            backgroundImage: 'repeating-linear-gradient(-45deg, rgba(255,255,255,.18) 0 14px, transparent 14px 28px)'}}/>
          <div style={{position: 'absolute', bottom: fs * 1.5 + full * p + 14, width: bw, textAlign: 'center', fontSize: fs * 1.1, lineHeight: 1,
            ...lookStyle('pop', fs * 1.1, '#FFFFFF')}}>{p > 0.05 && (!it.display || p > 0.6) ? shown : ''}</div>
          <div style={{position: 'absolute', bottom: 0, width: bw, textAlign: 'center', fontFamily: FONT_DISPLAY, fontWeight: W_DISPLAY, fontSize: fs * 0.82,
            color: ink(ctx), textTransform: 'uppercase', lineHeight: 1.1, whiteSpace: 'nowrap'}}>{it.label}</div>
        </div>;
      })}
    </div>;
  }}</At>;
}

// Circular ring that fills (rep counter, timer, percentage) with a number or word in the middle.
function RingLayer({ctx, layer, index}) {
  const {t, W} = ctx;
  const fx = lifeFx(t, layer._at, layer._until, layer.enter ?? {type: 'pop', duration: 0.2}, layer.exit ?? 'pop');
  const d = layer.size * W;
  const p = ease((t - layer._at) / layer.duration);
  const v = layer.from + (layer.to - layer.from) * p;
  const r = 42, c = 2 * Math.PI * r;
  const cnt = layer.count;
  const color = layer.color ?? th(ctx).good;
  const mid = cnt ? `${cnt.prefix ?? ''}${(cnt.from + (cnt.to - cnt.from) * p).toFixed(cnt.decimals ?? 0)}${cnt.suffix ?? ''}` : layer.text ?? `${Math.round(v * 100)}%`;
  const fs = d * (mid.length > 4 ? 0.2 : 0.28);
  return <At ctx={ctx} layer={layer} index={index}>{() => <div style={{...fxStyle(fx), textAlign: 'center'}}>
    <div style={{position: 'relative', width: d, height: d, margin: '0 auto'}}>
      <svg width={d} height={d} viewBox="0 0 100 100" style={{position: 'absolute', inset: 0, transform: 'rotate(-90deg)', filter: `drop-shadow(0 6px 0 ${ink(ctx)})`}}>
        <circle cx={50} cy={50} r={r + 6} fill="#FFFFFF" stroke={ink(ctx)} strokeWidth={3}/>
        <circle cx={50} cy={50} r={r} fill="none" stroke="#E7E7EE" strokeWidth={9}/>
        <circle cx={50} cy={50} r={r} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v)}/>
      </svg>
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_POP, fontWeight: W_POP, fontSize: fs, color: ink(ctx), lineHeight: 1}}>{mid}</div>
    </div>
    {layer.label ? <div style={{marginTop: d * 0.08, display: 'inline-block', fontFamily: FONT_POP, fontWeight: W_POP, fontSize: d * 0.15, color: onColor(color, ink(ctx)), background: color,
      border: `5px solid ${ink(ctx)}`, borderRadius: d * 0.05, padding: `0 ${d * 0.06}px`, transform: 'rotate(-2deg)', whiteSpace: 'nowrap'}}>{layer.label.toUpperCase()}</div> : null}
  </div>}</At>;
}

// Ribbon across the screen for a hook word: the band wipes in, the words pop on it.
function BannerLayer({ctx, layer, index}) {
  const {t, W, H} = ctx;
  const out = lifeFx(t, layer._at, layer._until, 'cut', layer.exit ?? 'fade');
  const p = ease((t - layer._at) / 0.28);
  const h = layer.size * 1.5;
  const [, cy] = inSafe(ctx.safe, W, H, W / 2, (layer._y ?? layer.y) * H, 10, h * 1.4);
  const s = ctx.safe;
  const textX = s ? ((s.x0 + (cy > s.notchY * H ? s.notchX1 : s.x1)) / 2) * W : W / 2;
  // the words fit between the safe-zone edges, whatever the font's width
  const room = s ? ((cy > s.notchY * H ? s.notchX1 : s.x1) - s.x0) * W : W * 0.9;
  const size = layer.scroll ? layer.size : Math.min(layer.size, (room * 0.94) / Math.max(1, layer.text.length * 0.43 * (layer._wk ?? 1)));
  const fromRight = layer.side === 'right';
  const scroll = layer.scroll ? -((t - layer._at) * 60) : 0;
  const color = layer.color ?? th(ctx).main;
  return <div style={{position: 'absolute', left: 0, top: cy, width: W, zIndex: 56 + index, transform: `translateY(-50%) rotate(${layer.tilt}deg)`, opacity: out.opacity}}>
    {layer.shadowBand ? <div style={{position: 'absolute', left: -60, width: W + 120, top: h * 0.18, height: h, background: layer.shadowBand,
      transform: `rotate(${-layer.tilt * 0.8}deg) scaleX(${ease((t - layer._at - 0.06) / 0.3)})`, transformOrigin: fromRight ? '100% 50%' : '0% 50%'}}/> : null}
    <div style={{position: 'relative', marginLeft: -60, width: W + 120, height: h, background: color, borderTop: `7px solid ${ink(ctx)}`, borderBottom: `7px solid ${ink(ctx)}`,
      transform: `scaleX(${p})`, transformOrigin: fromRight ? '100% 50%' : '0% 50%', boxShadow: `0 10px 0 ${ink(ctx)}`, overflow: 'hidden'}}/>
    <div style={{position: 'absolute', top: 0, height: h, left: textX + scroll, translate: '-50% 0', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap',
      fontFamily: FONT_POP, fontWeight: W_POP, fontSize: size, color: layer.textColor ?? onColor(color, ink(ctx)), letterSpacing: size * 0.02, ...popIn(t, layer._at + 0.16, 0.25, 0.7)}}>
      {layer.text.toUpperCase()}
    </div>
  </div>;
}

// Wrong vs right: two panels side by side, a red cross on one and a green tick on the other.
function VersusLayer({ctx, layer, index}) {
  const {t} = ctx;
  const fx = lifeFx(t, layer._at, layer._until, layer.enter ?? 'up', layer.exit ?? 'fade');
  const times = versusTimes(layer, layer._at);
  return <At ctx={ctx} layer={layer} index={index}>{(b) => {
    const gap = ctx.W * 0.03, pw = (b.w - gap) / 2, ph = b.h;
    const panel = (side, i) => {
      const at = times[i];
      if (t < at) return <div key={i} style={{width: pw}}/>;
      const good = side.good ?? i === 1;
      const col = side.color ?? (good ? th(ctx).good : th(ctx).bad);
      return <div key={i} style={{width: pw, height: ph, ...popIn(t, at, 0.3, 0.8)}}>
        <Card ctx={ctx} pad={0} style={{width: pw, height: ph, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
          <div style={{background: col, color: '#FFFFFF', fontFamily: FONT_POP, fontWeight: W_POP, fontSize: layer.size, textAlign: 'center', padding: '10px 6px', borderBottom: `6px solid ${ink(ctx)}`,
            whiteSpace: 'nowrap', overflow: 'hidden'}}>{side.label.toUpperCase()}</div>
          <div style={{flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: good ? '#EFFFF4' : '#FFF0EE'}}>
            {side.asset ? <Img src={ctx.src(side.asset)} style={{maxWidth: '92%', maxHeight: '92%', objectFit: 'contain', transform: side.flipX ? 'scaleX(-1)' : undefined}}/> : null}
            {side.text ? <div style={{fontFamily: FONT_DISPLAY, fontWeight: W_DISPLAY, fontSize: layer.size * 0.85, color: ink(ctx), textAlign: 'center', padding: 16, textTransform: 'uppercase'}}>{side.text}</div> : null}
            <div style={{position: 'absolute', right: 14, bottom: 14}}><Mark ctx={ctx} kind={good ? 'tick' : 'cross'} at={at + 0.25} t={t} size={layer.size * 1.5}/></div>
          </div>
        </Card>
      </div>;
    };
    return <div style={{...fxStyle(fx), display: 'flex', justifyContent: 'space-between', position: 'relative'}}>
      {panel(layer.left, 0)}
      {panel(layer.right, 1)}
      {t >= times[1] ? <div style={{position: 'absolute', left: '50%', top: '50%', width: layer.size * 1.9, height: layer.size * 1.9, borderRadius: '50%', background: th(ctx).second,
        border: `6px solid ${ink(ctx)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_POP, fontWeight: W_POP, fontSize: layer.size * 0.8, color: '#FFFFFF',
        WebkitTextStroke: `4px ${ink(ctx)}`, paintOrder: 'stroke fill', translate: '-50% -50%', ...popIn(t, times[1] + 0.1, 0.3, 0.3)}}>VS</div> : null}
    </div>;
  }}</At>;
}

// Chat bubbles (a text conversation): each message pops in when it is spoken.
function ChatLayer({ctx, layer, index}) {
  const {t} = ctx;
  const fx = lifeFx(t, layer._at, layer._until, layer.enter ?? 'fade', layer.exit ?? 'fade');
  const size = layer.size;
  const times = chatTimes(layer, layer._at);
  return <At ctx={ctx} layer={layer} index={index}>{() => <div style={{...fxStyle(fx), display: 'flex', flexDirection: 'column', gap: size * 0.45}}>
    {layer.name ? <div style={{alignSelf: 'center', fontFamily: FONT_DISPLAY, fontWeight: W_DISPLAY, fontSize: size * 0.7, color: '#6B6B78', textTransform: 'uppercase'}}>{layer.name}</div> : null}
    {layer.messages.map((m, i) => {
      if (t < times[i]) return null;
      const me = m.side === 'right';
      return <div key={i} style={{alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: '86%', ...popIn(t, times[i], 0.25, 0.5),
        transformOrigin: me ? '100% 100%' : '0% 100%'}}>
        <div style={{background: me ? (layer.color ?? th(ctx).main) : '#FFFFFF', color: me ? onColor(layer.color ?? th(ctx).main, ink(ctx)) : ink(ctx), border: `6px solid ${ink(ctx)}`,
          borderRadius: size * 0.8, [me ? 'borderBottomRightRadius' : 'borderBottomLeftRadius']: size * 0.15, padding: `${size * 0.32}px ${size * 0.6}px`,
          fontFamily: FONT_DISPLAY, fontWeight: W_DISPLAY, fontSize: size, lineHeight: 1.15, boxShadow: `0 8px 0 ${ink(ctx)}`}}>{m.text}</div>
      </div>;
    })}
  </div>}</At>;
}

// Label with a leader line to a body part (anchor) or a point: "FOREARM", "TIGHT CORE".
function CalloutLayer({ctx, layer, index}) {
  const {t, W, H} = ctx;
  let px, py;
  const a = layer.anchor && layer._target ? canvasAnchor(ctx, layer._target, layer.anchor, t) : null;
  if (a) {
    [px, py] = centroid(a.points);
    // a pair (both arms, both hands …): point at the one on the label's side, never at the middle of the body (neck, belt)
    if (a.points.length > 1) {
      const want = layer.x !== undefined ? layer.x * W : px;
      [px, py] = a.points.reduce((best, p) => (Math.abs(p[0] - want) < Math.abs(best[0] - want) ? p : best));
    }
  } else [px, py] = [(layer.to?.[0] ?? 0.5) * W, (layer.to?.[1] ?? 0.5) * H];
  const size = layer.size;
  const tw = Math.min(W * 0.7, [...layer.text].length * size * 0.56 + size * 0.9), tht = size * 1.45;
  const lx = layer.x !== undefined ? layer.x * W : px > W / 2 ? px - W * 0.3 : px + W * 0.3;
  const ly = layer.y !== undefined ? layer.y * H : py - H * 0.08;
  const [sx, sy] = inSafe(ctx.safe, W, H, lx, ly, tw, tht);
  const [cx, cy] = avoidFaces({cx: sx, cy: sy, w: tw, h: tht}, layer._faces, ctx.safe, W, H);
  const out = lifeFx(t, layer._at, layer._until, 'cut', layer.exit ?? 'fade').opacity;
  const dot = ease((t - layer._at) / 0.2);
  const line = ease((t - layer._at - 0.1) / 0.3);
  // the line leaves the label at its nearest edge
  const ex = px < cx - tw / 2 ? cx - tw / 2 : px > cx + tw / 2 ? cx + tw / 2 : cx;
  const ey = Math.abs(px - cx) < tw / 2 ? (py < cy ? cy - tht / 2 : cy + tht / 2) : cy;
  const color = layer.color ?? th(ctx).main;
  const pulse = 1 + 0.25 * Math.sin((t - layer._at) * 7);
  return <div style={{position: 'absolute', inset: 0, zIndex: 58 + index, opacity: out}}>
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <circle cx={px} cy={py} r={size * 0.55 * pulse * dot} fill="none" stroke={color} strokeWidth={8} opacity={0.6}/>
      <line x1={px} y1={py} x2={px + (ex - px) * line} y2={py + (ey - py) * line} stroke={ink(ctx)} strokeWidth={14} strokeLinecap="round"/>
      <line x1={px} y1={py} x2={px + (ex - px) * line} y2={py + (ey - py) * line} stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round"/>
      <circle cx={px} cy={py} r={size * 0.28 * dot} fill={color} stroke={ink(ctx)} strokeWidth={6}/>
    </svg>
    {t > layer._at + 0.3 ? <div style={{position: 'absolute', left: cx, top: cy, translate: '-50% -50%', ...popIn(t, layer._at + 0.3, 0.25, 0.6)}}>
      <div style={{fontFamily: FONT_POP, fontWeight: W_POP, fontSize: size, color: onColor(color, ink(ctx)), background: color, border: `7px solid ${ink(ctx)}`, borderRadius: size * 0.3,
        padding: `${size * 0.04}px ${size * 0.38}px`, whiteSpace: 'nowrap', boxShadow: `0 9px 0 ${ink(ctx)}`,
        WebkitTextStroke: `${Math.round(size * 0.08)}px ${ink(ctx)}`, paintOrder: 'stroke fill'}}>{layer.text.toUpperCase()}</div>
    </div> : null}
  </div>;
}

// Small hand-drawn emphasis marks: lines = a crown of short strokes shining out above a point,
// ripple = rings spreading out, underline = a marker stroke, circle = a scribbled loop around a word.
function AccentLayer({ctx, layer, index}) {
  const {t, W, H} = ctx;
  const d = layer.size * W;
  const [cx, cy] = avoidFaces({cx: layer.x * W, cy: layer.y * H, w: d * 0.9, h: d * 0.9}, layer._faces, null, W, H);
  const lt = t - layer._at;
  const out = lifeFx(t, layer._at, layer._until, 'cut', layer.exit ?? 'fade').opacity;
  const c = layer.color ?? th(ctx).bad;
  let body = null;
  if (layer.kind === 'lines') {
    const p = back(lt / 0.25), shine = 1 + 0.06 * Math.sin(lt * 10);
    body = [-150, -118, -90, -62, -30].map((ang, j) => {
      const a = ang * Math.PI / 180;
      const r0 = d * 0.36 * shine, r1 = r0 + d * (j % 2 ? 0.13 : 0.19) * p;
      return <line key={j} x1={r0 * Math.cos(a)} y1={r0 * Math.sin(a)} x2={r1 * Math.cos(a)} y2={r1 * Math.sin(a)} stroke={c} strokeWidth={d * 0.05} strokeLinecap="round"/>;
    });
  } else if (layer.kind === 'ripple') {
    body = [0, 0.45, 0.9].map((o, k) => {
      const p = ((lt + 1.35 - o) % 1.35) / 1.35;
      return lt < o ? null : <circle key={k} r={d * 0.5 * p} fill="none" stroke={c} strokeWidth={d * 0.035 * (1 - p) + 2} opacity={1 - p}/>;
    });
  } else if (layer.kind === 'underline') {
    const p = ease(lt / 0.35), len = 400;
    body = <path d={`M ${-d / 2} ${d * 0.02} C ${-d / 4} ${-d * 0.05}, ${d / 4} ${d * 0.07}, ${d / 2} ${-d * 0.02}`} fill="none" stroke={c} strokeWidth={d * 0.05}
      strokeLinecap="round" pathLength={len} strokeDasharray={len} strokeDashoffset={len * (1 - p)}/>;
  } else {
    const p = ease(lt / 0.45), len = 400, rx = d / 2, ry = d * (layer.aspect ?? 0.45) / 2;
    body = <path d={`M ${-rx * 0.2} ${-ry * 1.05} C ${rx * 0.9} ${-ry * 1.15}, ${rx * 1.1} ${ry * 0.9}, ${0} ${ry} C ${-rx * 1.15} ${ry * 1.05}, ${-rx * 1.05} ${-ry * 0.95}, ${rx * 0.25} ${-ry * 1.1}`}
      fill="none" stroke={c} strokeWidth={d * 0.035} strokeLinecap="round" pathLength={len} strokeDasharray={len} strokeDashoffset={len * (1 - p)}/>;
  }
  return <svg width={W} height={H} style={{position: 'absolute', inset: 0, zIndex: 57 + index, opacity: out, overflow: 'visible'}}>
    <g transform={`translate(${cx},${cy}) rotate(${layer.rotation ?? 0})`}>{body}</g>
  </svg>;
}

// Round icon badge (dumbbell, clock, fire, water, …) that pops in and bobs, with an optional label.
function IconLayer({ctx, layer, index}) {
  const {t, W, H} = ctx;
  const fx = lifeFx(t, layer._at, layer._until, layer.enter ?? 'elastic', layer.exit ?? 'pop');
  const d = layer.size * W;
  const bh = d * (layer.label ? 1.35 : 1);
  const [sx, sy] = inSafe(ctx.safe, W, H, layer.x * W, layer.y * H, d, bh);
  const [cx, cy] = avoidFaces({cx: sx, cy: sy, w: d, h: bh}, layer._faces, ctx.safe, W, H);
  const color = layer.color ?? th(ctx).main;
  const bob = Math.sin((t - layer._at) * 3) * d * 0.03;
  const Icon = ICONS[layer.name] ?? ICONS.bolt;
  return <div style={{position: 'absolute', left: cx, top: cy + bob, zIndex: 54 + index, translate: '-50% -50%', textAlign: 'center'}}>
    <div style={fxStyle(fx)}>
      <div style={{width: d, height: d, borderRadius: '50%', background: layer.badge === false ? 'transparent' : color, border: layer.badge === false ? 'none' : `${Math.max(5, d * 0.05)}px solid ${ink(ctx)}`,
        boxShadow: layer.badge === false ? 'none' : `0 ${d * 0.06}px 0 ${ink(ctx)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', margin: '0 auto'}}>
        <Icon size={d * (layer.badge === false ? 1 : 0.6)} color={layer.badge === false ? color : onColor(color, ink(ctx))} ink={ink(ctx)}/>
      </div>
      {layer.label ? <div style={{marginTop: d * 0.08, fontFamily: FONT_POP, fontWeight: W_POP, fontSize: d * 0.22, color: ink(ctx), whiteSpace: 'nowrap', textTransform: 'uppercase'}}>{layer.label}</div> : null}
    </div>
  </div>;
}

// Stat card: an icon, a big number that counts up and a small label ("72% / OF GYM BROS SKIP IT").
function StatLayer({ctx, layer, index}) {
  const {t} = ctx;
  const fx = lifeFx(t, layer._at, layer._until, layer.enter ?? 'pop', layer.exit ?? 'pop');
  const color = layer.color ?? th(ctx).main;
  const p = ease((t - layer._at - 0.1) / layer.duration);
  const c = layer.count;
  const value = c ? `${c.prefix ?? ''}${(c.from + (c.to - c.from) * p).toFixed(c.decimals ?? 0)}${c.suffix ?? ''}` : layer.value ?? '';
  const Icon = layer.icon ? ICONS[layer.icon] : null;
  const size = layer.size;
  return <At ctx={ctx} layer={layer} index={index}>{(b) => <div style={{...fxStyle(fx), transform: `${fxStyle(fx).transform} rotate(${layer.tilt ?? -2}deg)`}}>
    <Card ctx={ctx} pad={26} style={{width: b.w, display: 'flex', alignItems: 'center', gap: 26, borderTop: `${size * 0.12}px solid ${color}`}}>
      {Icon ? <div style={{width: size * 1.15, height: size * 1.15, flex: 'none', borderRadius: '50%', background: color, border: `6px solid ${ink(ctx)}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box'}}><Icon size={size * 0.7} color={onColor(color, ink(ctx))} ink={ink(ctx)}/></div> : null}
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{fontFamily: FONT_POP, fontWeight: W_POP, fontSize: size, lineHeight: 1, color, WebkitTextStroke: `${Math.round(size * 0.05)}px ${ink(ctx)}`, paintOrder: 'stroke fill', whiteSpace: 'nowrap'}}>{value}</div>
        {layer.label ? <div style={{fontFamily: FONT_DISPLAY, fontWeight: W_DISPLAY, fontSize: size * 0.36, color: ink(ctx), textTransform: 'uppercase', marginTop: size * 0.08, lineHeight: 1.1}}>{layer.label}</div> : null}
      </div>
    </Card>
  </div>}</At>;
}

// A YouTube-style comment ("bro my wrists are so thin") popping in as social proof or a hook.
function CommentLayer({ctx, layer, index}) {
  const {t} = ctx;
  const fx = lifeFx(t, layer._at, layer._until, layer.enter ?? 'up', layer.exit ?? 'fade');
  const size = layer.size;
  const user = layer.user ?? '@gymbro_21';
  const avatar = layer.avatarColor ?? th(ctx).main;
  const Like = ICONS.thumbsUp;
  return <At ctx={ctx} layer={layer} index={index}>{(b) => <div style={{...fxStyle(fx), transform: `${fxStyle(fx).transform} rotate(${layer.tilt ?? -1.5}deg)`}}>
    <Card ctx={ctx} pad={size * 0.6} style={{width: b.w, display: 'flex', gap: size * 0.5, borderRadius: 26}}>
      <div style={{width: size * 1.6, height: size * 1.6, flex: 'none', borderRadius: '50%', background: avatar, border: `5px solid ${ink(ctx)}`, boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_POP, fontWeight: W_POP, color: onColor(avatar, ink(ctx)), fontSize: size * 0.8}}>{user.replace(/^@/, '')[0]?.toUpperCase()}</div>
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: size * 0.62, color: '#606070'}}>{user} <span style={{fontWeight: 500}}>· {layer.ago ?? '2 days ago'}</span></div>
        <div style={{fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: size, color: ink(ctx), lineHeight: 1.2, marginTop: size * 0.12}}>{layer.text}</div>
        <div style={{display: 'flex', alignItems: 'center', gap: size * 0.25, marginTop: size * 0.3, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: size * 0.6, color: '#606070'}}>
          <Like size={size * 0.75} color="#606070" ink="#606070"/>{layer.likes ?? '2.4K'}
        </div>
      </div>
    </Card>
  </div>}</At>;
}

// Day 1 → Day 30: a line of steps that tick on one after another, the line fills up to the newest one.
function TimelineLayer({ctx, layer, index}) {
  const {t} = ctx;
  const fx = lifeFx(t, layer._at, layer._until, layer.enter ?? 'up', layer.exit ?? 'fade');
  const times = timelineTimes(layer, layer._at);
  const color = layer.color ?? th(ctx).good;
  const size = layer.size, n = layer.steps.length;
  return <At ctx={ctx} layer={layer} index={index}>{(b) => {
    const pad = size * 0.9, step = n > 1 ? (b.w - pad * 2) / (n - 1) : 0, yLine = size * 0.95;
    let reached = -1;
    times.forEach((tt, i) => { if (t >= tt) reached = i; });
    const fill = reached < 0 ? 0 : reached + ease((t - times[reached]) / 0.3) - 1;
    return <div style={{...fxStyle(fx), position: 'relative', width: b.w, height: b.h}}>
      <div style={{position: 'absolute', left: pad, top: yLine - 9, width: b.w - pad * 2, height: 18, background: '#FFFFFF', border: `6px solid ${ink(ctx)}`, borderRadius: 12, boxSizing: 'border-box'}}/>
      <div style={{position: 'absolute', left: pad, top: yLine - 9, width: Math.max(0, fill) * step, height: 18, background: color, border: `6px solid ${ink(ctx)}`, borderRadius: 12, boxSizing: 'border-box'}}/>
      {layer.steps.map((s, i) => {
        const on = t >= times[i];
        const kind = s.mark ?? 'tick';
        return <div key={i} style={{position: 'absolute', left: pad + i * step, top: 0, translate: '-50% 0', textAlign: 'center', width: size * 2.6}}>
          <div style={{display: 'flex', justifyContent: 'center', ...(on ? popIn(t, times[i], 0.25, 0.5) : {})}}>
            {on ? <Mark ctx={ctx} kind={kind} at={times[i] + 0.05} t={t} size={size * 1.9} color={color}/>
              : <div style={{width: size * 1.9, height: size * 1.9, borderRadius: '50%', background: '#FFFFFF', border: `${Math.max(4, size * 0.17)}px solid ${ink(ctx)}`, boxSizing: 'border-box'}}/>}
          </div>
          <div style={{marginTop: size * 0.3, fontFamily: FONT_POP, fontWeight: W_POP, fontSize: size * 1.0, color: on ? ink(ctx) : '#9A9AA8', whiteSpace: 'nowrap', textTransform: 'uppercase'}}>{s.label}</div>
        </div>;
      })}
    </div>;
  }}</At>;
}

// Before / after: two pictures in one frame, a divider slides across to show the change.
function SliderLayer({ctx, layer, index}) {
  const {t} = ctx;
  const fx = lifeFx(t, layer._at, layer._until, layer.enter ?? 'pop', layer.exit ?? 'fade');
  const reveal = sliderTime(layer, layer._at);
  const split = 1 - (1 - layer.split) * ease((t - reveal) / 0.6);
  const lab = (text, col, side) => <div style={{position: 'absolute', top: 16, [side]: 16, fontFamily: FONT_POP, fontWeight: W_POP, fontSize: layer.size, color: '#FFFFFF', background: col,
    border: `5px solid ${ink(ctx)}`, borderRadius: 14, padding: '0 14px', zIndex: 3}}>{text.toUpperCase()}</div>;
  return <At ctx={ctx} layer={layer} index={index}>{(b) => <div style={fxStyle(fx)}>
    <Card ctx={ctx} pad={0} style={{width: b.w, height: b.h, overflow: 'hidden', position: 'relative'}}>
      <div style={{position: 'absolute', inset: 0, background: '#EFFFF4', display: 'flex', alignItems: 'flex-end', justifyContent: 'center'}}>
        {layer.after.asset ? <Img src={ctx.src(layer.after.asset)} style={{height: '94%', objectFit: 'contain'}}/> : null}
      </div>
      {lab(layer.after.label ?? 'AFTER', th(ctx).good, 'right')}
      <div style={{position: 'absolute', inset: 0, background: '#FFF0EE', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', clipPath: `inset(0 ${(1 - split) * 100}% 0 0)`, zIndex: 2}}>
        {layer.before.asset ? <Img src={ctx.src(layer.before.asset)} style={{height: '94%', objectFit: 'contain'}}/> : null}
        <div style={{position: 'absolute', top: 16, left: 16, fontFamily: FONT_POP, fontWeight: W_POP, fontSize: layer.size, color: '#FFFFFF', background: th(ctx).bad,
          border: `5px solid ${ink(ctx)}`, borderRadius: 14, padding: '0 14px'}}>{(layer.before.label ?? 'BEFORE').toUpperCase()}</div>
      </div>
      {split < 0.999 ? <div style={{position: 'absolute', top: 0, bottom: 0, left: `${split * 100}%`, width: 10, translate: '-50% 0', background: '#FFFFFF', borderLeft: `4px solid ${ink(ctx)}`, borderRight: `4px solid ${ink(ctx)}`, zIndex: 4}}>
        <div style={{position: 'absolute', top: '50%', left: '50%', translate: '-50% -50%', width: layer.size * 1.4, height: layer.size * 1.4, borderRadius: '50%', background: '#FFFFFF',
          border: `6px solid ${ink(ctx)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_POP, fontWeight: W_POP, fontSize: layer.size * 0.7, color: ink(ctx)}}>{'<>'}</div>
      </div> : null}
    </Card>
  </div>}</At>;
}

// Kinetic typography: big words slam onto the screen one line at a time, the newest one in colour.
function KineticLayer({ctx, layer, index}) {
  const {t, W} = ctx;
  const out = lifeFx(t, layer._at, layer._until, 'cut', layer.exit ?? 'fade').opacity;
  const times = kineticTimes(layer, layer._at);
  const colors = [ink(ctx), th(ctx).main, th(ctx).bad, th(ctx).good];
  return <At ctx={ctx} layer={layer} index={index} z={62}>{() => <div style={{opacity: out, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
    {layer.lines.map((line, i) => {
      const at = times[i];
      const size = kineticSize(line, layer, W);
      if (t < at) return <div key={i} style={{height: size * 1.12}}/>;
      // the first line of a video is already readable on frame 1
      const p = clamp01((t - at) / 0.22 + (at < 0.05 ? 0.45 : 0));
      const color = line.color ?? (i === layer.lines.length - 1 ? th(ctx).main : colors[i % 2 ? 1 : 0]);
      const look = line.look ?? layer.look;
      const style = look === 'box'
        ? {background: color, color: onColor(color, ink(ctx)), padding: `0 ${size * 0.2}px`, borderRadius: size * 0.12, border: `6px solid ${ink(ctx)}`, boxShadow: `0 8px 0 ${ink(ctx)}`}
        : {color, WebkitTextStroke: color === ink(ctx) ? undefined : `${Math.round(size * 0.06)}px ${ink(ctx)}`, paintOrder: 'stroke fill'};
      return <div key={i} style={{fontFamily: FONT_POP, fontWeight: W_POP, fontSize: size, lineHeight: 1.12, whiteSpace: 'nowrap', textTransform: 'uppercase',
        opacity: clamp01(p * 3), transform: `scale(${1.9 - 0.9 * ease(p) + 0.06 * Math.sin(clamp01(p) * Math.PI)}) rotate(${(line.tilt ?? (i % 2 ? 2 : -2)) * ease(p)}deg)`,
        filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined, ...style}}>{line.text}</div>;
    })}
  </div>}</At>;
}

// The big stars and sunbursts are no longer drawn; old plans that still have a "burst" layer render without it.
const Nothing = () => null;

export const GRAPHICS = {
  checklist: ChecklistLayer, bars: BarsLayer, ring: RingLayer, banner: BannerLayer, versus: VersusLayer,
  chat: ChatLayer, callout: CalloutLayer, accent: AccentLayer, icon: IconLayer, stat: StatLayer, comment: CommentLayer,
  timeline: TimelineLayer, slider: SliderLayer, kinetic: KineticLayer, burst: Nothing,
};
