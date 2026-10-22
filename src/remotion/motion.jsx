// Text entrance animations. Each takes frames since the word starts (f), the word's
// spoken length in frames (dur) and renders the text; layout space never changes.
import React from 'react';
import {interpolate, spring, Easing} from 'remotion';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
const ease = Easing.out(Easing.cubic);
const segmenter = new Intl.Segmenter('hi', {granularity: 'grapheme'});
const letters = (t) => [...segmenter.segment(t)].map((g) => g.segment);
const noise = (a, b) => { const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return x - Math.floor(x); };


const perLetter = (text, render) => letters(text).map((l, i) => (
  // Letters inherit a gradient fill (background-clip: text) from the word.
  <span key={i} style={{display: 'inline-block', whiteSpace: 'pre', backgroundImage: 'inherit', WebkitBackgroundClip: 'inherit', backgroundClip: 'inherit', ...render(i)}}>{l}</span>
));

export function MotionText({text, f, dur = 10, kind, color, fps = 30, style, frame = 0}) {
  const base = {display: 'inline-block', color, ...style};
  if (f < 0 && kind !== 'fill') return <span style={{...base, opacity: 0}}>{text}</span>;
  switch (kind) {
    case 'mask': // slides up from behind a line just below the word
      return (
        <span style={{...base, overflow: 'hidden', verticalAlign: 'bottom', paddingRight: '0.1em', paddingBottom: '0.06em'}}>
          <span style={{display: 'inline-block', transform: `translateY(${interpolate(f, [0, 9], [110, 0], {...clamp, easing: Easing.out(Easing.poly(5))})}%)`}}>{text}</span>
        </span>
      );
    case 'drop': // letters fall one after another and bounce
      return <span style={base}>{perLetter(text, (i) => {
        const p = spring({frame: f - i * 1.6, fps, config: {damping: 9, stiffness: 200, mass: 0.5}});
        return {opacity: f - i * 1.6 >= 0 ? 1 : 0, transform: `translateY(${(1 - p) * -0.9}em) rotate(${(1 - p) * -18}deg)`};
      })}</span>;
    case 'decode': { // random letters lock into place left to right
      const ls = letters(text);
      const settled = Math.floor(f / 1.4);
      return <span style={{...base, opacity: interpolate(f, [0, 2], [0.4, 1], clamp)}}>{ls.map((l, i) => {
        const done = i < settled || l === ' ';
        const pick = ls[Math.floor(noise(Math.floor(f / 2), i) * ls.length)];
        return <span key={i} style={{display: 'inline-block', whiteSpace: 'pre', opacity: done ? 1 : 0.55}}>{done ? l : pick}</span>;
      })}</span>;
    }
    case 'type': { // typed within the spoken length, with a blinking cursor while typing
      const ls = letters(text);
      const n = Math.min(ls.length, Math.ceil((f + 1) / Math.max(1, Math.min(2.5, dur / ls.length))));
      const typing = n < ls.length || f < dur + 4;
      return (
        <span style={{...base, position: 'relative'}}>
          {ls.slice(0, n).join('')}<span style={{opacity: 0}}>{ls.slice(n).join('')}</span>
          {typing ? <span style={{position: 'absolute', left: `${(n / ls.length) * 100}%`, top: '0.1em', bottom: '0.05em', width: '0.07em',
            background: color, opacity: Math.floor(frame / 8) % 2 ? 0.2 : 1}} /> : null}
        </span>
      );
    }
    case 'zoom': // flies in from huge with a blur, then lands
      return <span style={{...base, opacity: interpolate(f, [0, 3], [0, 1], clamp), filter: `blur(${interpolate(f, [0, 6], [10, 0], clamp)}px)`,
        transform: `scale(${interpolate(f, [0, 7], [2.8, 1], {...clamp, easing: Easing.out(Easing.exp)})})`}}>{text}</span>;
    case 'tracking': // letters start spread out and pull together
      return <span style={{...base, opacity: interpolate(f, [0, 8], [0, 1], clamp), filter: `blur(${interpolate(f, [0, 10], [6, 0], clamp)}px)`}}>{perLetter(text, (i) => {
        const n = letters(text).length;
        const spread = interpolate(f, [0, 14], [1, 0], {...clamp, easing: Easing.out(Easing.poly(4))});
        return {transform: `translateX(${(i - (n - 1) / 2) * spread * 0.45}em)`};
      })}</span>;
    case 'flip': // flips down from above like a flip-board
      return <span style={{...base, opacity: interpolate(f, [0, 4], [0, 1], clamp), transformOrigin: '50% 100%',
        transform: `perspective(600px) rotateX(${interpolate(f, [0, 10], [-95, 0], {...clamp, easing: Easing.out(Easing.back(1.6))})}deg)`}}>{text}</span>;
    case 'fill': { // faint text fills with colour across the word while it is spoken
      const p = interpolate(f, [0, Math.max(6, dur)], [0, 100], clamp);
      return (
        <span style={{...base, position: 'relative', color: 'transparent'}}>
          <span style={{color, opacity: 0.16}}>{text}</span>
          <span style={{position: 'absolute', left: 0, top: 0, color, clipPath: `inset(-20% ${100 - p}% -20% 0)`, whiteSpace: 'nowrap'}}>{text}</span>
        </span>
      );
    }
    case 'glitch': { // RGB split and jitter, then snaps clean
      const k = interpolate(f, [0, 10], [1, 0], clamp);
      const dx = (noise(f, 1) - 0.5) * 0.12 * k;
      return <span style={{...base, opacity: f % 3 === 1 && k > 0.4 ? 0.5 : 1, transform: `translate(${dx}em, ${(noise(f, 2) - 0.5) * 0.06 * k}em) skewX(${dx * 60}deg)`,
        textShadow: k > 0 ? `${0.05 * k}em 0 #FF2D55, ${-0.05 * k}em 0 #00E5FF` : 'none'}}>{text}</span>;
    }
    case 'pop': { // springs up from small with a little overshoot
      const p = spring({frame: f, fps, config: {damping: 9, stiffness: 230, mass: 0.5}});
      return <span style={{...base, opacity: f >= 0 ? 1 : 0, transform: `scale(${0.4 + 0.6 * p}) translateY(${(1 - p) * 0.25}em)`}}>{text}</span>;
    }
    case 'stamp': { // slams down with a tilt, like a rubber stamp
      const k = interpolate(f, [0, 6], [0, 1], {...clamp, easing: Easing.out(Easing.back(2))});
      return <span style={{...base, opacity: f >= 0 ? 1 : 0, transform: `scale(${1.7 - 0.7 * k}) rotate(${(1 - k) * -8}deg)`}}>{text}</span>;
    }
    default: // blur rise
      return <span style={{...base, opacity: interpolate(f, [0, 6], [0, 1], clamp), filter: `blur(${interpolate(f, [0, 7], [12, 0], clamp)}px)`,
        transform: `translateY(${interpolate(f, [0, 8], [0.3, 0], {...clamp, easing: ease})}em)`}}>{text}</span>;
  }
}
