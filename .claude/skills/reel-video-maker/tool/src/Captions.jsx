import React from 'react';
import {clamp01, enterFx, fxStyle, IDENTITY, withIdle} from './motion.js';
import {FONT_DISPLAY, W_DISPLAY} from './layers.jsx';
import {phrases} from './words.js';
import {safeZoneOf} from './schema.js';

// Caption height (0..1). 9:16: inside the Shorts safe zone, the bottom ones above the title and channel name.
export function captionY(y, low, W, H) {
  const s = safeZoneOf(W, H);
  if (low) return s ? s.y1 - 0.045 : 0.9;
  return s ? Math.max(y, s.y0 + 0.055) : y;
}

const clean = (w) => String(w || '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

export function Captions({ctx, captions: cfg, words, titleOn = false, avoid = [], tapes = []}) {
  let captions = cfg;
  const {t, W, H} = ctx;
  if (captions.mode === 'none' || !words.length) return null;
  if (captions.hide.some(([a, b]) => t >= a && t < b)) return null;
  // during step titles: smaller phrase captions at the bottom instead of the big top ones
  const low = titleOn || captions.bottom.some(([a, b]) => t >= a && t < b);
  if (low) captions = {...captions, mode: 'phrase', size: Math.round(captions.size * 0.72), maxWords: 4};
  let y = captionY(captions.y, low, W, H);
  // the small bottom captions go above a sticker that sits where they would be
  if (low) {
    const half = captions.size * 0.8;
    const hit = avoid.filter((r) => r && r.y0 < y * H + half && r.y1 > y * H - half).sort((a, b) => a.y0 - b.y0)[0];
    if (hit) y = (hit.y0 - half - 12) / H;
  }
  // never on a caution tape: the caption goes just above it
  {
    const half = captions.size * (low ? 0.8 : 0.85);
    const tape = tapes.filter((r) => r.y0 < y * H + half && r.y1 > y * H - half).sort((a, b) => a.y0 - b.y0)[0];
    if (tape) y = (tape.y0 - half - 12) / H;
  }
  // box between the safe-zone edges (bottom captions stay left of the like / comment buttons)
  const s = safeZoneOf(W, H);
  const left = s ? s.x0 * W : 0, right = s ? (low ? s.notchX1 : s.x1) * W : W;
  const keywords = new Set(captions.keywords.map(clean));

  const Word = ({w, big}) => {
    const kw = keywords.has(clean(w.text));
    const p = clamp01((t - w.start + 0.04) / 0.18);
    const fx = withIdle({...IDENTITY}, enterFx(kw ? 'punch' : 'pop', p));
    return <span style={{display: 'inline-block', margin: '0 0.14em', ...fxStyle(fx),
      color: kw ? ctx.style.accentText : ctx.style.textColor,
      fontSize: captions.size * (kw ? 1.25 : 1) * (big ? 1.15 : 1)}}>{w.text.replace(/[,;:]$/, '')}</span>;
  };

  let content = null;
  if (captions.mode === 'word') {
    // one word at a time, held until the next word starts
    let idx = -1;
    for (let i = 0; i < words.length; i++) if (words[i].start <= t) idx = i;
    if (idx < 0) return null;
    const w = words[idx];
    const next = words[idx + 1];
    if (t > (next ? Math.max(w.end + 0.25, next.start) : w.end + 0.6)) return null;
    content = <Word key={idx} w={w} big/>;
  } else {
    const groups = phrases(words, captions.maxWords);
    const g = groups.find((grp, i) => {
      const nextStart = groups[i + 1]?.[0].start ?? Infinity;
      return t >= grp[0].start && t < Math.min(nextStart, grp[grp.length - 1].end + 0.5);
    });
    if (!g) return null;
    content = g.filter((w) => w.start <= t + 0.04).map((w) => <Word key={`${w.start}-${w.text}`} w={w}/>);
  }

  return <div style={{position: 'absolute', left, width: right - left, top: y * H, transform: 'translateY(-50%)', zIndex: 100,
    textAlign: 'center', fontFamily: FONT_DISPLAY, fontWeight: W_DISPLAY, fontStyle: 'italic', lineHeight: 1.1, padding: s ? '0 10px' : '0 60px', boxSizing: 'border-box',
    WebkitTextStroke: low ? '10px #FFFFFF' : undefined, paintOrder: 'stroke fill'}}>
    {content}
  </div>;
}
