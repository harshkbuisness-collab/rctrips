import '@fontsource/inter/600.css';
import '@fontsource/inter/600-italic.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/inter/900.css';
import '@fontsource/inter/900-italic.css';
import '@fontsource/noto-sans-devanagari/700.css';
import '@fontsource/noto-sans-devanagari/900.css';
import '@fontsource/libre-caslon-text/400.css';
import '@fontsource/anton/400.css';
import '@fontsource/oswald/700.css';
import '@fontsource/caveat/700.css';
import '@fontsource/dancing-script/700.css';
import '@fontsource/yellowtail/400.css';
import '@fontsource/playfair-display/700.css';
import '@fontsource/playfair-display/900.css';
import '@fontsource/playfair-display/700-italic.css';
import '@fontsource/playfair-display/900-italic.css';
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {measureText} from '@remotion/layout-utils';
import {iconPath} from '../engine/icons.js';
import {STICKER_BY_ID} from '../engine/stickers.js';
import {getLook} from '../engine/looks.js';
import {MotionText} from './motion.jsx';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
const ease = Easing.out(Easing.cubic);
const FONT_FACES = [['600', 'Inter'], ['italic 600', 'Inter'], ['700', 'Inter'], ['800', 'Inter'], ['900', 'Inter'], ['italic 900', 'Inter'],
  ['700', '"Noto Sans Devanagari"', 'क'], ['900', '"Noto Sans Devanagari"', 'क'], ['400', '"Libre Caslon Text"'], ['400', 'Anton'], ['700', 'Oswald'],
  ['700', 'Caveat'], ['700', '"Dancing Script"'], ['400', 'Yellowtail'], ['700', '"Playfair Display"'], ['900', '"Playfair Display"'], ['italic 700', '"Playfair Display"'], ['italic 900', '"Playfair Display"']];

// Hold the render until fonts are loaded, so measuring and drawing match.
function useFontsReady() {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('Loading fonts'));
  useEffect(() => {
    Promise.all(FONT_FACES.map(([style, family, sample]) => document.fonts.load(`${style} 100px ${family}`, sample || 'Aa')))
      .catch(() => {}).finally(() => { setReady(true); continueRender(handle); });
  }, [handle]);
  return ready;
}

const display = (t, upper) => { const s = String(t).replace(/[,.;:।]+$/u, ''); return upper ? s.toUpperCase() : s; };
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const FILLER = /^(a|an|the|to|of|in|on|and|or|is|it|you|your|i|my|that|this|for|but|ka|ki|ke|ko|se|hai|aur|to)$/i;

function useCard(scene) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const at = (w) => Math.max(0, Math.round((w.start - scene.start) * fps) - 3);
  const dur = (w) => Math.round((w.end - w.start) * fps);
  return {frame, fps, at, dur};
}

// Colours for a sentence / big-word card; "cycle" templates change background per card.
function paletteFor(look, scene, index) {
  const c = scene.type === 'hero' && look.heroCycle ? look.heroCycle[index % look.heroCycle.length] : look.cycle ? look.cycle[index % look.cycle.length] : {bg: look.bg, ink: look.ink, accent: look.accents[scene.accent || 0] || look.accents[0]};
  return {...c, accentStyle: c.accent === 'gradient'
    ? {backgroundImage: look.gradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}
    : {color: c.accent}};
}

const NOISE = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

// Card background plus optional paper / grain texture.
function Backdrop({bg, look, children, style}) {
  return (
    <AbsoluteFill style={{background: bg, ...style}}>
      {look.texture ? <AbsoluteFill style={{backgroundImage: NOISE, opacity: {paper: 0.1, grain: 0.16, soft: 0.05}[look.texture], mixBlendMode: 'multiply'}} /> : null}
      {look.texture === 'soft' ? <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(255,255,255,0) 55%, rgba(0,0,0,.06) 100%)'}} /> : null}
      {look.texture === 'paper' ? <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(255,255,255,.55) 0%, rgba(0,0,0,.10) 100%)'}} /> : null}
      {look.texture === 'grain' ? <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,.35) 100%)'}} /> : null}
      {children}
    </AbsoluteFill>
  );
}

// Huge faded keyword behind the card.
function Ghost({text, look, ink, stage, frame}) {
  if (!text) return null;
  const t = display(text, true);
  const w = measureText({text: t, fontFamily: look.heroFont, fontSize: 100, fontWeight: '900'}).width;
  const size = Math.min(stage.h * 0.75, (stage.w * 1.05 / w) * 100);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
      <div style={{fontFamily: look.heroFont, fontWeight: 900, fontSize: size, lineHeight: 1, color: ink, opacity: 0.06, whiteSpace: 'nowrap',
        transform: `scale(${interpolate(frame, [0, 90], [1.12, 1], {...clamp, easing: ease})})`}}>{t}</div>
    </AbsoluteFill>
  );
}

function Word({w, look, ink, pal, isHero, extra, c, kind}) {
  const style = isHero ? {...pal.accentStyle, ...extra} : extra;
  return <MotionText text={display(w.text, look.upper)} f={c.frame - c.at(w)} dur={c.dur(w)} kind={kind || look.motion} fps={c.fps} frame={c.frame}
    color={isHero ? (pal.accentStyle.color || ink) : ink} style={style} />;
}

function Sentence({words, look, ink, pal, heroExtra, c, kind}) {
  return words.map((w, i) => (
    <React.Fragment key={i}>{i > 0 ? ' ' : null}<Word w={w} look={look} ink={ink} pal={pal} isHero={w.hero} extra={w.hero ? heroExtra : undefined} c={c} kind={kind} /></React.Fragment>
  ));
}

// Visual entrance: pop (default), slide (in from the bottom-right corner, rotating) or draw (grows up from the bottom).
function Art({src, size, frame, style, enter}) {
  const {fps} = useVideoConfig();
  const p = spring({frame: frame - 4, fps, config: {damping: 12, stiffness: 160, mass: 0.7}});
  const float = `translateY(${Math.sin(frame / 16) * size * 0.03}px)`;
  const motion = enter === 'slide' ? `translate(${(1 - p) * 70}%, ${(1 - p) * 60}%) rotate(${(1 - p) * 35}deg)`
    : enter === 'draw' ? `scaleY(${interpolate(frame, [2, 14], [0, 1], {...clamp, easing: ease})})`
      : `scale(${0.5 + 0.5 * p}) rotate(${(1 - p) * -12}deg)`;
  return <Img src={src} style={{width: size, height: size, objectFit: 'contain', opacity: enter === 'draw' ? 1 : Math.min(1, p * 2),
    transformOrigin: enter === 'draw' ? 'bottom center' : 'center', transform: `${float} ${motion}`, ...style}} />;
}

// iOS-style switch that turns on, for lines about settings.
const TOGGLE_WORDS = /^(on|off|setting|settings|enable|turn|switch|chalu|band|activate)$/i;
function Toggle({u, frame}) {
  const on = interpolate(frame, [10, 18], [0, 1], {...clamp, easing: ease});
  const pop = spring({frame: frame - 4, fps: 30, config: {damping: 12, stiffness: 200}});
  return (
    <div style={{width: u * 8, height: u * 4.2, borderRadius: u * 2.1, background: on > 0.5 ? '#34C759' : '#D9D9D9', position: 'relative',
      transform: `scale(${pop})`, boxShadow: 'inset 0 2px 6px rgba(0,0,0,.15)', transition: 'none'}}>
      <div style={{position: 'absolute', top: u * 0.35, left: u * 0.35 + on * u * 3.8, width: u * 3.5, height: u * 3.5, borderRadius: '50%', background: '#FFF',
        boxShadow: '0 3px 8px rgba(0,0,0,.25)'}} />
    </div>
  );
}
const wantsToggle = (look, scene) => look.toggle && scene.words.some((w) => TOGGLE_WORDS.test(display(w.text)));

// "?" marks popping around a question card.
const QUESTION = /\?$|^(why|how|what|kya|kaise|kyun|stuck)$/i;
function Questions({stage, frame, color}) {
  const spots = [[0.2, 0.3], [0.78, 0.26], [0.16, 0.72], [0.84, 0.68], [0.5, 0.15]];
  return spots.map(([x, y], i) => {
    const p = spring({frame: frame - 6 - i * 3, fps: 30, config: {damping: 9, stiffness: 220}});
    return <div key={i} style={{position: 'absolute', left: stage.w * x, top: stage.h * y, fontFamily: 'Oswald', fontWeight: 700, fontSize: stage.h * 0.08, color,
      transform: `scale(${p}) rotate(${(i % 2 ? 1 : -1) * 14}deg)`, opacity: 0.85}}>?</div>;
  });
}
// The mascot template shows its own character, so it skips per-card stickers.
const artSrc = (scene, look) => {
  if (scene.icon) return staticFile(iconPath(scene.icon));
  if (look.mascot) return '';
  if (scene.sticker?.startsWith('lib:')) return staticFile(iconPath(scene.sticker));
  return scene.sticker && STICKER_BY_ID[scene.sticker] ? staticFile(STICKER_BY_ID[scene.sticker].src.replace(/^\//, '')) : '';
};
const heroOf = (scene) => scene.words.find((w) => w.hero);
// Width the text may use; the mascot template keeps the right side free for the character.
const areaOf = (look, stage) => stage.w * (look.mascot ? 0.64 : 0.84);
const shiftOf = (look, stage) => (look.mascot ? {paddingRight: stage.w * 0.22} : null);

function LineCard({scene, look, u, stage, index}) {
  const c = useCard(scene);
  const pal = paletteFor(look, scene, index);
  const src = artSrc(scene, look);
  const align = look.align === 'left' ? 'left' : 'center';
  return (
    <Backdrop bg={pal.bg} look={look}>
      {look.ghost ? <Ghost text={heroOf(scene)?.text} look={look} ink={pal.ink} stage={stage} frame={c.frame} /> : null}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: u * 2, ...shiftOf(look, stage)}}>
        {src ? <Art src={src} size={u * 15} frame={c.frame} enter={look.artEnter} /> : null}
        {wantsToggle(look, scene) ? <Toggle u={u} frame={c.frame} /> : null}
        <div style={{maxWidth: areaOf(look, stage), textAlign: align, fontFamily: look.font, fontWeight: look.weight, fontSize: u * 3.6 * (look.textScale || 1),
          lineHeight: 1.25, letterSpacing: look.tracking || '-0.02em'}}>
          <Sentence words={scene.words} look={look} ink={pal.ink} pal={pal} heroExtra={{fontWeight: 900}} c={c} />
        </div>
      </AbsoluteFill>
    </Backdrop>
  );
}

function HeroCard({scene, look, u, stage, index}) {
  const c = useCard(scene);
  const pal = paletteFor(look, scene, index);
  const h = scene.words.findIndex((w) => w.hero);
  const kicker = scene.words.slice(0, h), sub = scene.words.slice(h + 1), hero = scene.words[h];
  const src = artSrc(scene, look);
  const artSize = u * (look.bigArt ? 21 : 16);
  const script = look.scriptFont && index % 2 === 1;
  const font = script ? look.scriptFont : look.heroFont;
  const italic = !script && look.heroItalic;
  const tracking = script ? '0em' : look.heroTracking || '-0.045em';
  const text = display(hero.text, look.upperHero || look.upper);
  // With a visual, text and visual sit side by side, so the text gets less width.
  const maxW = areaOf(look, stage) - (src ? artSize + u * 2 : 0);
  const base = measureText({text, fontFamily: font, fontSize: 100, fontWeight: String(look.heroWeight), fontStyle: italic ? 'italic' : 'normal', letterSpacing: tracking}).width * 1.12;
  const size = Math.min(u * 13 * (look.heroScale || 1) * (script ? 1.15 : 1), (maxW / base) * 100);
  const centered = look.align === 'center';
  const small = {fontFamily: look.font, fontWeight: look.weight, letterSpacing: look.tracking || '-0.02em', maxWidth: maxW, textAlign: centered ? 'center' : 'left'};
  const subFont = look.subFont || look.font;
  return (
    <Backdrop bg={pal.bg} look={look}>
      {look.ghost ? <Ghost text={hero.text} look={look} ink={pal.ink} stage={stage} frame={c.frame} /> : null}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: u * 2, ...shiftOf(look, stage)}}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: centered ? 'center' : 'flex-start', maxWidth: maxW}}>
          {kicker.length ? <div style={{...small, fontSize: u * 3.2 * (look.textScale || 1), lineHeight: 1.2, marginBottom: u * 0.3}}>
            <Sentence words={kicker} look={look} ink={pal.ink} pal={pal} c={c} /></div> : null}
          <Word w={{...hero, text}} look={look} ink={pal.ink} pal={pal} isHero c={c} kind={look.heroMotion}
            extra={{fontFamily: font, fontWeight: look.heroWeight, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: 1.08,
              letterSpacing: tracking, whiteSpace: 'nowrap', paddingRight: italic || script ? '0.1em' : 0}} />
          {sub.length ? <div style={{...small, fontFamily: subFont, fontStyle: look.subFont || look.font !== look.heroFont || look.upperHero ? 'normal' : 'italic',
            fontSize: u * 2.4 * (look.subScale || 1), lineHeight: 1.25, marginTop: u * 0.6}}>
            <Sentence words={sub} look={look} ink={look.subInk || pal.ink} pal={pal} c={c} /></div> : null}
          {wantsToggle(look, scene) ? <div style={{marginTop: u * 1.2}}><Toggle u={u} frame={c.frame - c.at(hero)} /></div> : null}
        </div>
        {src ? <Art src={src} size={artSize} frame={c.frame - c.at(hero)} enter={look.artEnter} /> : null}
      </AbsoluteFill>
    </Backdrop>
  );
}

// Words scattered at mixed sizes and heights; the keyword is the biggest.
function CollageCard({scene, look, u, stage, index}) {
  const c = useCard(scene);
  const pal = paletteFor(look, scene, index);
  const src = artSrc(scene, look);
  const maxW = areaOf(look, stage) - (src ? u * 18 : 0);
  return (
    <Backdrop bg={pal.bg} look={look}>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: u * 2}}>
        {src ? <Art src={src} size={u * 16} frame={c.frame} /> : null}
        <div style={{maxWidth: maxW, display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'center', columnGap: u * 1.1, rowGap: 0,
          fontFamily: look.font, lineHeight: 1.05}}>
          {scene.words.map((w, i) => {
            const k = hash(`${w.text}${i}`);
            const scale = w.hero ? 2.3 : FILLER.test(display(w.text)) ? 0.75 : 1 + (k % 3) * 0.28;
            const lift = w.hero ? 0 : ((k >> 3) % 3 - 1) * 0.22;
            const weight = w.hero ? 900 : k % 2 ? 700 : 500;
            return <Word key={i} w={w} look={look} ink={pal.ink} pal={pal} isHero={w.hero} c={c}
              extra={{fontSize: u * 3.3 * scale, fontWeight: weight, letterSpacing: '-0.03em', transform: `translateY(${lift}em)`}} />;
          })}
        </div>
      </AbsoluteFill>
    </Backdrop>
  );
}

// Keyword in a title tag at the top, visual in the middle, sentence below.
function TagCard({scene, look, u, stage, index}) {
  const c = useCard(scene);
  const pal = paletteFor(look, scene, index);
  const src = artSrc(scene, look);
  const key = heroOf(scene) || scene.words.find((w) => !FILLER.test(display(w.text))) || scene.words[0];
  const tagIn = spring({frame: c.frame - c.at(key), fps: c.fps, config: {damping: 14, stiffness: 200}});
  return (
    <Backdrop bg={pal.bg} look={look}>
      {look.ghost ? <Ghost text={key.text} look={look} ink={pal.ink} stage={stage} frame={c.frame} /> : null}
      {look.questions && scene.words.some((w) => QUESTION.test(w.text)) ? <Questions stage={stage} frame={c.frame} color={look.accents[1]} /> : null}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'space-evenly', flexDirection: 'column', padding: `${stage.h * 0.06}px 0`}}>
        <div style={{fontFamily: look.heroFont, fontWeight: look.heroWeight, fontSize: u * 5.4, lineHeight: 1, color: look.tagInk, background: look.tagBg,
          padding: `${u * 0.4}px ${u * 1.4}px`, borderRadius: u * 0.8, boxShadow: '0 6px 0 rgba(0,0,0,.18)', letterSpacing: '0.02em',
          clipPath: `inset(0 ${(1 - Math.min(1, tagIn)) * 100}% 0 0)`}}>{display(key.text, true)}</div>
        {src ? <Art src={src} size={stage.h * 0.36} frame={c.frame} enter={look.artEnter} /> : null}
        <div style={{maxWidth: stage.w * 0.8, textAlign: 'center', fontFamily: look.font, fontWeight: look.weight, fontSize: u * (src ? 2.4 : 3.4), lineHeight: 1.3}}>
          <Sentence words={scene.words} look={look} ink={pal.ink} pal={pal} heroExtra={{fontWeight: 800}} c={c} />
        </div>
      </AbsoluteFill>
    </Backdrop>
  );
}

// Lines type in at the bottom and push the older lines up, like a chat feed.
function FeedCard({scene, look, u, stage, index, scenes}) {
  const c = useCard(scene);
  const pal = paletteFor(look, scene, index);
  const prev = [];
  for (let i = index - 1; i >= 0 && prev.length < 2; i--) { if (['line', 'hero'].includes(scenes[i].type)) prev.unshift(scenes[i]); else break; }
  const lineH = u * 6.2;
  const push = spring({frame: c.frame, fps: c.fps, config: {damping: 16, stiffness: 160}});
  const src = artSrc(scene, look);
  const kind = index % 2 ? 'tracking' : look.motion;
  return (
    <Backdrop bg={pal.bg} look={look}>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', flexDirection: 'column', paddingBottom: stage.h * 0.36}}>
        <div style={{transform: `translateY(${(1 - push) * lineH}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          {prev.map((s, i) => (
            <div key={s.id} style={{fontFamily: look.font, fontWeight: look.weight, fontSize: u * 2.6, lineHeight: `${lineH}px`, color: pal.ink,
              opacity: 0.35 + 0.25 * i, whiteSpace: 'nowrap'}}>{s.words.map((w) => display(w.text)).join(' ')}</div>
          ))}
          <div style={{fontFamily: look.font, fontWeight: look.weight, fontSize: u * 3.8, lineHeight: `${lineH}px`, maxWidth: stage.w * 0.88, textAlign: 'center'}}>
            {scene.words.map((w, i) => <React.Fragment key={i}>{i > 0 ? ' ' : null}
              <Word w={w} look={look} ink={pal.ink} pal={pal} isHero={w.hero} c={c} kind={kind} extra={w.hero ? {fontWeight: 900} : undefined} /></React.Fragment>)}
          </div>
        </div>
      </AbsoluteFill>
      {src ? <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: stage.h * 0.1}}><Art src={src} size={stage.h * 0.22} frame={c.frame} /></AbsoluteFill> : null}
    </Backdrop>
  );
}

// Whole line shown dim; a highlight box runs from word to word as each is spoken.
function RunCard({scene, look, u, stage, index}) {
  const c = useCard(scene);
  const pal = paletteFor(look, scene, index);
  const size = u * 4.2;
  const maxW = areaOf(look, stage);
  const gap = size * 0.28, lineH = size * 1.35;
  const font = {fontFamily: look.font, fontSize: size, fontWeight: String(look.weight)};
  const boxes = []; let x = 0, line = 0;
  scene.words.forEach((w) => {
    const t = display(w.text);
    const width = measureText({...font, text: t}).width + size * 0.3;
    if (x > 0 && x + width > maxW) { x = 0; line++; }
    boxes.push({t, x, y: line * lineH, w: width});
    x += width + gap;
  });
  const lines = line + 1;
  const lineW = (l) => Math.max(...boxes.filter((b) => b.y === l * lineH).map((b) => b.x + b.w));
  boxes.forEach((b) => { b.x += (maxW - lineW(b.y / lineH)) / 2; });
  let cur = -1;
  scene.words.forEach((w, i) => { if (c.frame >= c.at(w)) cur = i; });
  const from = boxes[Math.max(0, cur - 1)], to = boxes[Math.max(0, cur)];
  const k = cur < 0 ? 0 : interpolate(c.frame - c.at(scene.words[cur]), [0, 4], [cur === 0 ? 1 : 0, 1], {...clamp, easing: ease});
  const mix = (a, b) => a + (b - a) * k;
  const box = {x: mix(from.x, to.x), y: mix(from.y, to.y), w: mix(from.w, to.w)};
  const src = artSrc(scene, look);
  return (
    <Backdrop bg={pal.bg} look={look}>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: u * 2, ...shiftOf(look, stage)}}>
        {src ? <Art src={src} size={u * 13} frame={c.frame} /> : null}
        <div style={{position: 'relative', width: maxW, height: lines * lineH, opacity: interpolate(c.frame, [0, 5], [0, 1], clamp)}}>
          {cur >= 0 ? <div style={{position: 'absolute', left: box.x - size * 0.05, top: box.y + size * 0.06, width: box.w + size * 0.1, height: lineH - size * 0.12,
            background: pal.accent, borderRadius: size * 0.18}} /> : null}
          {boxes.map((b, i) => (
            <div key={i} style={{position: 'absolute', left: b.x, top: b.y, width: b.w, textAlign: 'center', lineHeight: `${lineH}px`, ...font, fontWeight: look.weight,
              color: i === cur ? '#FFFFFF' : i < cur ? pal.ink : `${pal.ink}55`}}>{b.t}</div>
          ))}
        </div>
      </AbsoluteFill>
    </Backdrop>
  );
}

// Poster-style lockup: small lead-in words above, a huge keyword, small follow-on words below.
// Adds a slow camera push, a zoom punch + shake when the keyword lands, a shine sweep, sparkles
// or a hand-drawn doodle, number count-ups, a character on the left and the previous card's
// last word sliding away.
// Lockup compositions, used in turn so no two cards in a row look alike.
// hero / words: text animation for the keyword / the other words; flair: decoration around the keyword.
const LOCKUP_VARIANTS = [
  {name: 'classic', hero: 'type', words: 'type', flair: 'sparkles'},
  {name: 'side', hero: 'slide', words: 'blur', flair: 'underline'},
  {name: 'outline', hero: 'scatter', words: 'tracking', flair: 'sparkles'},
  {name: 'kinetic', hero: 'zoom', words: 'pop', flair: null},
  {name: 'stack', hero: 'mask', words: 'mask', flair: 'circle'},
  {name: 'marker', hero: 'pop', words: 'flip', flair: null},
];
const STAR = 'M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z';
const NUMBER = /^(\d+(?:\.\d+)?)(k|K|%|\+|x)?$/;
const CHARACTER_POSES = ['chubby-character-thinking-hoodie-1', 'mascot-character-pointing-right-1', 'mascot-pointing-up-1',
  'chubby-character-giving-thumbs-up-1', 'mascot-holding-phone-surprise-1', 'chubby-character-shrugging-1'];
const noise2 = (a, b) => { const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return x - Math.floor(x); };
const lineText = (s) => ['line', 'hero'].includes(s?.type) ? s.words : null;

function LockupCard({scene, look, u, stage, index, scenes}) {
  const c = useCard(scene);
  const pal = paletteFor(look, scene, index);
  const words = scene.words;
  let h = words.findIndex((w) => w.hero);
  if (h < 0) h = words.reduce((best, w, i) => (!FILLER.test(display(w.text)) && display(w.text).length > display(words[best].text).length ? i : best), 0);
  const pre = words.slice(0, h), hero = words[h], post = words.slice(h + 1);
  const heroText = display(hero.text);
  const num = heroText.match(NUMBER);
  // Each card gets a different composition and animation, rotating through VARIANTS.
  const variant = LOCKUP_VARIANTS[index % LOCKUP_VARIANTS.length];
  const charW = look.character ? stage.w * 0.27 : 0;
  const areaW = (stage.w - charW) * (variant.name === 'side' ? 0.5 : variant.name === 'marker' ? 0.3 : 0.8);
  const base = measureText({text: heroText, fontFamily: look.heroFont, fontSize: 100, fontWeight: '900', letterSpacing: '-0.04em'}).width * 1.06;
  const size = Math.min(u * 12, (areaW / base) * 100);
  const heroW = (base / 100) * size, heroH = size * 1.05;
  const land = c.at(hero) + (num ? 12 : Math.max(4, Math.min(c.dur(hero), heroText.length * 2.5)));
  const cardFrames = Math.round((scene.end - scene.start) * c.fps);
  // Camera: slow push over the card, punch + shake when the keyword lands.
  const k = interpolate(c.frame, [land, land + 9], [1, 0], clamp) * (c.frame >= land ? 1 : 0);
  const cam = `translate(${(noise2(c.frame, 1) - 0.5) * u * 0.9 * k}px, ${(noise2(c.frame, 2) - 0.5) * u * 0.9 * k}px) scale(${(1 + 0.05 * c.frame / Math.max(1, cardFrames)) * (1 + 0.04 * k)})`;
  // Keyword fill with a shine band sweeping across once it has landed.
  const shine = interpolate(c.frame, [land + 2, land + 16], [-30, 130], clamp);
  const fill = pal.accent === 'gradient' ? look.gradient : `linear-gradient(${pal.accent}, ${pal.accent})`;
  const heroFill = {backgroundImage: `linear-gradient(110deg, rgba(255,255,255,0) ${shine - 10}%, rgba(255,255,255,.95) ${shine}%, rgba(255,255,255,0) ${shine + 10}%), ${fill}`,
    WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 10px 18px rgba(0,0,0,.10))'};
  const heroStyle = {fontFamily: look.heroFont, fontWeight: 900, fontSize: size, lineHeight: 1.05, letterSpacing: '-0.04em', whiteSpace: 'nowrap', ...heroFill};
  const strokeColor = pal.accent === 'gradient' ? '#1F4BFF' : pal.accent;
  if (variant.name === 'outline') {
    // Outlined keyword that fills in from the left once it has landed.
    const fillP = interpolate(c.frame, [land, land + 14], [0, 100], {...clamp, easing: ease});
    Object.assign(heroStyle, {WebkitTextStroke: `${Math.max(2, size * 0.025)}px ${strokeColor}`, backgroundImage: fill,
      backgroundSize: `${fillP}% 100%`, backgroundRepeat: 'no-repeat'});
  }
  let heroEl;
  if (num) {
    const t = interpolate(c.frame - c.at(hero), [0, 12], [0, 1], {...clamp, easing: ease});
    const v = Number(num[1]) * t;
    heroEl = <span style={{...heroStyle, display: 'inline-block', opacity: c.frame >= c.at(hero) ? 1 : 0}}>{`${Number.isInteger(Number(num[1])) ? Math.round(v) : v.toFixed(1)}${num[2] || ''}`}</span>;
  } else {
    heroEl = <MotionText text={heroText} f={c.frame - c.at(hero)} dur={c.dur(hero)} kind={variant.hero} fps={c.fps} frame={c.frame}
      color={strokeColor} style={heroStyle} />;
  }
  const small = (ws, align, scale, alignSelf) => (
    <div style={{fontFamily: look.font, fontWeight: 700, fontSize: u * 2.7 * scale, lineHeight: 1.2, letterSpacing: '-0.02em', maxWidth: Math.max(heroW * 1.15, stage.w * 0.3),
      textAlign: align, alignSelf: alignSelf || (align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'),
      margin: align === 'left' ? `0 0 ${-size * 0.05}px ${size * 0.04}px` : align === 'right' ? `${-size * 0.02}px ${size * 0.02}px 0 0` : `${size * 0.04}px 0`}}>
      <Sentence words={ws} look={look} ink={pal.ink} pal={pal} c={c} kind={variant.words} />
    </div>
  );
  // Flair around the keyword: sparkles, or a hand-drawn underline / circle.
  let flair = null;
  if (variant.flair === 'sparkles') {
    flair = [[-0.06, -0.25, 1], [1.03, -0.12, 0.8], [0.97, 1.05, 0.7], [-0.03, 0.95, 0.6]].map(([x, y, sc], i) => {
      const p = spring({frame: c.frame - land - i * 3, fps: c.fps, config: {damping: 8, stiffness: 200}});
      const sz = u * 2.6 * sc;
      return <svg key={i} viewBox="0 0 24 24" width={sz} height={sz} style={{position: 'absolute', left: heroW * x - sz / 2, top: heroH * y - sz / 2,
        transform: `scale(${p}) rotate(${c.frame * 3 + i * 40}deg)`}}><path d={STAR} fill={i % 2 ? '#FFC400' : strokeColor} /></svg>;
    });
  } else if (variant.flair) {
    const p = interpolate(c.frame, [land, land + 14], [0, 1], {...clamp, easing: ease});
    const d = variant.flair === 'circle'
      ? `M ${heroW * 0.08} ${heroH * 0.2} C ${heroW * 0.5} ${-heroH * 0.25}, ${heroW * 1.12} ${heroH * 0.05}, ${heroW * 1.05} ${heroH * 0.55} C ${heroW} ${heroH * 1.15}, ${-heroW * 0.05} ${heroH * 1.2}, ${-heroW * 0.04} ${heroH * 0.5} C ${-heroW * 0.03} ${heroH * 0.2}, ${heroW * 0.25} ${heroH * 0.02}, ${heroW * 0.4} ${heroH * 0.06}`
      : `M ${heroW * 0.02} ${heroH * 1.02} C ${heroW * 0.3} ${heroH * 0.94}, ${heroW * 0.7} ${heroH * 0.96}, ${heroW * 0.98} ${heroH * 0.9}`;
    flair = <svg width={heroW} height={heroH} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <path d={d} fill="none" stroke={pal.ink === '#FFFFFF' ? '#FF3B30' : '#E5262A'} strokeWidth={u * 0.55} strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - p} /></svg>;
  }
  const icon = scene.icon ? staticFile(iconPath(scene.icon)) : '';
  const iconP = spring({frame: c.frame - land - 2, fps: c.fps, config: {damping: 10, stiffness: 180}});
  const heroBox = (
    <div style={{position: 'relative', width: heroW, height: heroH}}>
      {heroEl}
      {flair}
      {icon ? <Img src={icon} style={{position: 'absolute', right: -u * 7, top: -u * 6, width: u * 8, height: u * 8, objectFit: 'contain',
        transform: `scale(${iconP}) rotate(${(1 - iconP) * 30}deg)`}} /> : null}
    </div>
  );
  let body;
  if (variant.name === 'side') {
    // Keyword on the left, the rest of the line stacked small on the right.
    body = (
      <div style={{display: 'flex', alignItems: 'center', gap: u * 2}}>
        {heroBox}
        <div style={{display: 'flex', flexDirection: 'column', gap: u * 0.6, borderLeft: `${u * 0.4}px solid ${strokeColor}`, paddingLeft: u * 1.4}}>
          {pre.length ? small(pre, 'left', 0.95, 'flex-start') : null}
          {post.length ? small(post, 'left', 0.95, 'flex-start') : null}
        </div>
      </div>
    );
  } else if (variant.name === 'kinetic' && pre.length && c.frame < c.at(hero)) {
    // Lead-in words flash one at a time, then the keyword punches in.
    let cur = 0;
    pre.forEach((w, i) => { if (c.frame >= c.at(w)) cur = i; });
    const w = pre[cur];
    const pp = spring({frame: c.frame - c.at(w), fps: c.fps, config: {damping: 10, stiffness: 260, mass: 0.5}});
    body = <div style={{fontFamily: look.heroFont, fontWeight: 900, fontSize: u * 6.5, color: pal.ink, letterSpacing: '-0.03em', opacity: c.frame >= c.at(w) ? 1 : 0,
      transform: `scale(${0.6 + 0.4 * pp})`}}>{display(w.text)}</div>;
  } else if (variant.name === 'marker') {
    // One centred line; the keyword sits on a marker swipe.
    const sweep = interpolate(c.frame, [c.at(hero), c.at(hero) + 8], [0, 100], {...clamp, easing: ease});
    body = (
      <div style={{maxWidth: (stage.w - charW) * 0.84, textAlign: 'center', fontFamily: look.font, fontWeight: 800, fontSize: u * 4.4, lineHeight: 1.35, letterSpacing: '-0.02em'}}>
        <Sentence words={scene.words} look={look} ink={pal.ink} pal={pal} c={c} kind={variant.words}
          heroExtra={{color: pal.ink, backgroundImage: 'linear-gradient(#FFD43B, #FFD43B)', WebkitBackgroundClip: 'border-box', backgroundClip: 'border-box',
            backgroundRepeat: 'no-repeat', backgroundPosition: '0 80%', backgroundSize: `${sweep}% 55%`, padding: '0 0.12em', fontSize: '1.3em', fontWeight: 900}} />
      </div>
    );
  } else {
    const centered = variant.name !== 'classic';
    body = (
      <div style={{display: 'inline-flex', flexDirection: 'column', alignItems: centered ? 'center' : 'stretch'}}>
        {pre.length ? small(pre, centered ? 'center' : 'left', 1) : null}
        {heroBox}
        {post.length ? small(post, centered ? 'center' : 'right', 0.95) : null}
      </div>
    );
  }
  // Character on the left: a pose per card (reaction if one was matched).
  const pose = scene.sticker?.startsWith('lib:') ? scene.sticker : `lib:${CHARACTER_POSES[index % CHARACTER_POSES.length]}`;
  const charP = spring({frame: c.frame, fps: c.fps, config: {damping: 12, stiffness: 180}});
  // Carry-over: the previous card's last word slides up and away.
  const prev = lineText(scenes[index - 1]);
  const carry = prev ? display(prev[prev.length - 1].text) : '';
  const cp = interpolate(c.frame, [0, 10], [0, 1], {...clamp, easing: ease});
  return (
    <Backdrop bg={pal.bg} look={look}>
      <AbsoluteFill style={{transform: cam}}>
        {carry && cp < 1 ? <div style={{position: 'absolute', left: stage.w * (0.55 - 0.3 * cp), top: stage.h * (0.55 - 0.4 * cp), fontFamily: look.font, fontWeight: 800,
          fontSize: u * 3 * (1 - 0.4 * cp), color: pal.ink, opacity: 1 - cp}}>{carry}</div> : null}
        {look.character ? <Img src={staticFile(iconPath(pose))} style={{position: 'absolute', left: stage.w * 0.01, bottom: 0, height: stage.h * 0.66, width: charW, objectFit: 'contain',
          objectPosition: 'bottom', transform: `translateY(${(1 - charP) * stage.h * 0.15}px)`}} /> : null}
        <AbsoluteFill style={{left: charW, width: stage.w - charW, alignItems: 'center', justifyContent: 'center'}}>
          {body}
        </AbsoluteFill>
      </AbsoluteFill>
    </Backdrop>
  );
}

// Serif lockups (reference 2): red + dark serif with italic, script and small-caps mixes,
// a different arrangement per card, over a huge faded sepia visual.
const SERIF_VARIANTS = ['twoLine', 'scoreLine', 'bigItalic', 'scriptWord', 'scriptLine', 'smallCaps'];
const keyIndex = (words) => {
  const h = words.findIndex((w) => w.hero);
  return h >= 0 ? h : words.reduce((best, w, i) => (!FILLER.test(display(w.text)) && display(w.text).length > display(words[best].text).length ? i : best), 0);
};

function BgArt({scene, scenes, index, stage, frame}) {
  // The latest visual so far stays behind the text, like a section image.
  let icon = '';
  for (let i = index; i >= 0 && !icon; i--) icon = scenes[i].icon || '';
  if (!icon) return null;
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <Img src={staticFile(iconPath(icon))} style={{height: stage.h * 0.95, width: stage.h * 0.95, objectFit: 'contain', opacity: 0.2,
        filter: 'grayscale(1) sepia(0.55) contrast(0.9)', transform: `scale(${interpolate(frame, [0, 120], [1.06, 1], clamp)})`}} />
    </AbsoluteFill>
  );
}

function SerifCard({scene, look, u, stage, index, scenes}) {
  const c = useCard(scene);
  const words = scene.words;
  const h = keyIndex(words);
  const pre = words.slice(0, h), hero = words[h], post = words.slice(h + 1);
  const v = SERIF_VARIANTS[index % SERIF_VARIANTS.length];
  const red = look.accents[0], dark = look.ink;
  const serif = (italic, weight) => ({fontFamily: look.heroFont, fontStyle: italic ? 'italic' : 'normal', fontWeight: weight});
  const fit = (text, font, cap) => {
    const w = measureText({text, fontFamily: font.fontFamily, fontSize: 100, fontWeight: String(font.fontWeight), fontStyle: font.fontStyle}).width * 1.08;
    return Math.min(cap, (stage.w * 0.72 / w) * 100);
  };
  const line = (ws, color, font, size, extra) => ws.length ? (
    <div style={{fontSize: size, lineHeight: 1.12, color, ...font, letterSpacing: '-0.01em', textAlign: 'center', maxWidth: stage.w * 0.86, ...extra}}>
      {ws.map((w, i) => <React.Fragment key={i}>{i > 0 ? ' ' : null}
        <MotionText text={display(w.text)} f={c.frame - c.at(w)} dur={c.dur(w)} kind={look.motion} fps={c.fps} frame={c.frame} color={color} /></React.Fragment>)}
    </div>
  ) : null;
  const heroText = display(hero.text);
  let body;
  if (v === 'twoLine') {
    // "hashtag" (big red) / "ka use karoge" (dark).
    body = <>{line(pre, dark, serif(false, 700), u * 3.6)}{line([hero], red, serif(false, 900), fit(heroText, serif(false, 900), u * 11))}{line(post, dark, serif(false, 700), u * 4.6)}</>;
  } else if (v === 'scoreLine') {
    // "To views" (small red italic) / "50" (big dark italic) + "hi milenge" (red italic).
    body = (
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
        {line(pre, red, serif(true, 700), u * 4, {textAlign: 'left'})}
        <div style={{display: 'flex', alignItems: 'baseline', gap: u * 1.2}}>
          {line([hero], dark, serif(true, 900), fit(heroText, serif(true, 900), u * 10) * 0.85)}
          {line(post, red, serif(true, 700), u * 4.4, {textAlign: 'left', maxWidth: stage.w * 0.4})}
        </div>
      </div>
    );
  } else if (v === 'bigItalic') {
    // "video" (big dark italic) / "viral karna hai" (red).
    body = <>{line(pre, dark, serif(false, 700), u * 3.6)}{line([hero], dark, serif(true, 900), fit(heroText, serif(true, 900), u * 10))}{line(post, red, serif(false, 900), u * 4.6)}</>;
  } else if (v === 'scriptWord') {
    // One dark serif line with the keyword in red script.
    body = (
      <div style={{fontSize: u * 4.6, lineHeight: 1.3, color: dark, ...serif(false, 700), textAlign: 'center', maxWidth: stage.w * 0.86}}>
        {words.map((w, i) => <React.Fragment key={i}>{i > 0 ? ' ' : null}
          <MotionText text={display(w.text)} f={c.frame - c.at(w)} dur={c.dur(w)} kind={look.motion} fps={c.fps} frame={c.frame} color={i === h ? red : dark}
            style={i === h ? {fontFamily: look.scriptFont, fontWeight: 700, fontStyle: 'normal', fontSize: '1.55em', transform: 'rotate(-5deg)'} : undefined} /></React.Fragment>)}
      </div>
    );
  } else if (v === 'scriptLine') {
    // The whole line in red script, like "taiyaar ho jaao".
    body = line(words, red, {fontFamily: look.scriptFont, fontWeight: 700}, u * 6.4);
  } else {
    // Dark serif with a red handwritten small-caps tail: "haqikat me PANE KE LIYE".
    body = (
      <div style={{display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', justifyContent: 'center', gap: u * 1.2, maxWidth: stage.w * 0.86}}>
        {line([...pre, hero], dark, serif(false, 900), u * 5.4)}
        {line(post.map((w) => ({...w, text: display(w.text).toUpperCase()})), red, {fontFamily: 'Caveat', fontWeight: 700}, u * 4.4)}
      </div>
    );
  }
  return (
    <Backdrop bg={look.bg} look={look}>
      {look.bgArt ? <BgArt scene={scene} scenes={scenes} index={index} stage={stage} frame={c.frame} /> : null}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>{body}</AbsoluteFill>
    </Backdrop>
  );
}

// Reference 3: rotating card types — white with a huge keyword and its ghost behind, black with a
// yellow script keyword writing on, a small sentence with a visual, red with a white script keyword,
// and a yellow flash card.
const BONUS_VARIANTS = ['white', 'script', 'sentence', 'white', 'red', 'script', 'flash'];

// Script text that writes on from left to right.
function WriteOn({text, font, size, color, f, extra}) {
  const p = interpolate(f, [0, 14], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return <span style={{display: 'inline-block', fontFamily: font, fontSize: size, color, lineHeight: 1.2, padding: '0 0.15em', whiteSpace: 'nowrap',
    clipPath: `inset(-20% ${(1 - p) * 100}% -20% 0)`, ...extra}}>{text}</span>;
}

function BonusCard({scene, look, u, stage, index}) {
  const c = useCard(scene);
  const words = scene.words;
  const h = keyIndex(words);
  const pre = words.slice(0, h), hero = words[h], post = words.slice(h + 1);
  const v = BONUS_VARIANTS[index % BONUS_VARIANTS.length];
  const heroText = display(hero.text);
  const f = c.frame - c.at(hero);
  const pop = {opacity: interpolate(f, [0, 5], [0, 1], clamp), filter: `blur(${interpolate(f, [0, 7], [14, 0], clamp)}px)`,
    transform: `scale(${interpolate(f, [0, 9], [1.18, 1], {...clamp, easing: ease})})`};
  const small = (ws, color, size, extra) => ws.length ? (
    <div style={{fontFamily: look.font, fontWeight: 700, fontSize: size, color, lineHeight: 1.25, textAlign: 'center', maxWidth: stage.w * 0.8, ...extra}}>
      {ws.map((w, i) => <React.Fragment key={i}>{i > 0 ? ' ' : null}
        <MotionText text={display(w.text)} f={c.frame - c.at(w)} dur={c.dur(w)} kind="blur" fps={c.fps} frame={c.frame} color={color} /></React.Fragment>)}
    </div>
  ) : null;
  const fitSize = (text, font, weight, cap, share = 0.82) => {
    const w = measureText({text, fontFamily: font, fontSize: 100, fontWeight: String(weight)}).width * 1.08;
    return Math.min(cap, (stage.w * share / w) * 100);
  };
  const src = scene.icon ? staticFile(iconPath(scene.icon)) : '';
  let bg = look.bg, body, ghost = null;
  if (v === 'white') {
    const accent = look.accents[Math.floor(index / 3) % 2];
    ghost = <Ghost text={heroText} look={look} ink="#000000" stage={stage} frame={c.frame} />;
    body = <>
      {small(pre, look.ink, u * 3.2)}
      <div style={{fontFamily: look.heroFont, fontWeight: 900, fontSize: fitSize(heroText, look.heroFont, 900, u * 13), color: accent, letterSpacing: '-0.04em', lineHeight: 1.02, ...pop}}>{heroText}</div>
      {small(post, look.ink, u * 2.4)}
    </>;
  } else if (v === 'script' || v === 'red') {
    const red = v === 'red';
    bg = red ? '#E5262A' : '#050505';
    if (red) ghost = <Ghost text={heroText} look={look} ink="#FFFFFF" stage={stage} frame={c.frame} />;
    body = <>
      {small(pre, '#FFFFFF', u * 2.8, {opacity: 0.9})}
      <WriteOn text={heroText} font={look.scriptFont} size={fitSize(heroText, 'Yellowtail', 400, u * 14, 0.7)} color={red ? '#FFFFFF' : '#FFD60A'} f={f}
        extra={{transform: 'rotate(-4deg)', textShadow: '0 6px 18px rgba(0,0,0,.25)'}} />
      {small(post, red ? '#FFE3A3' : '#FFFFFF', u * 2.6)}
    </>;
  } else if (v === 'flash') {
    bg = '#FFE600';
    body = small(words.map((w) => ({...w, hero: false})), '#111111', u * 4.6, {fontWeight: 900});
  } else {
    // A visual on top, then the sentence with the keyword coloured.
    body = <>
      {src ? <Art src={src} size={stage.h * 0.3} frame={c.frame} /> : null}
      <div style={{fontFamily: look.font, fontWeight: 700, fontSize: u * 3.6, lineHeight: 1.3, color: '#5A5A5A', textAlign: 'center', maxWidth: stage.w * 0.8, marginTop: u}}>
        {words.map((w, i) => <React.Fragment key={i}>{i > 0 ? ' ' : null}
          <MotionText text={display(w.text)} f={c.frame - c.at(w)} dur={c.dur(w)} kind="blur" fps={c.fps} frame={c.frame} color={i === h ? look.accents[1] : '#3A3A3A'}
            style={i === h ? {fontWeight: 900} : undefined} /></React.Fragment>)}
      </div>
    </>;
  }
  return (
    <Backdrop bg={bg} look={look}>
      {ghost}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>{body}</AbsoluteFill>
    </Backdrop>
  );
}

// Reference 4: black, serif; the keyword is red with a white outline and types in. Cards rotate
// between a staircase (lines stepping to the right, character on the left), a sentence with one
// outlined red word, and a big red word with white lines beside it (numbers count up with an arrow).
const STAIR_VARIANTS = ['stair', 'inline', 'stair', 'bigRed'];

function StairCard({scene, look, u, stage, index}) {
  const c = useCard(scene);
  const words = scene.words;
  const h = keyIndex(words);
  const pre = words.slice(0, h), hero = words[h], post = words.slice(h + 1);
  const heroText = display(hero.text);
  const num = heroText.match(NUMBER);
  const v = num ? 'bigRed' : STAIR_VARIANTS[index % STAIR_VARIANTS.length];
  const red = look.accents[0];
  const outlined = {color: red, WebkitTextStroke: `${Math.max(1.5, u * 0.18)}px #FFFFFF`, paintOrder: 'stroke fill'};
  const serif = {fontFamily: look.heroFont, fontWeight: 900, letterSpacing: '-0.01em'};
  const words_ = (ws, color, size, kind, extra) => ws.map((w, i) => <React.Fragment key={i}>{i > 0 ? ' ' : null}
    <MotionText text={display(w.text)} f={c.frame - c.at(w)} dur={c.dur(w)} kind={kind} fps={c.fps} frame={c.frame} color={color} style={{fontSize: size, ...extra}} /></React.Fragment>);
  const heroEl = (size) => num
    ? <span style={{...serif, ...outlined, fontSize: size, display: 'inline-block', opacity: c.frame >= c.at(hero) ? 1 : 0}}>
      {Math.round(Number(num[1]) * interpolate(c.frame - c.at(hero), [0, 12], [0, 1], {...clamp, easing: ease}))}{num[2] || ''}</span>
    : <MotionText text={heroText} f={c.frame - c.at(hero)} dur={c.dur(hero)} kind="type" fps={c.fps} frame={c.frame} color={red} style={{...serif, ...outlined, fontSize: size}} />;
  const fit = (cap, share) => {
    const w = measureText({text: heroText, fontFamily: look.heroFont, fontSize: 100, fontWeight: '900'}).width * 1.08;
    return Math.min(cap, (stage.w * share / w) * 100);
  };
  const charW = stage.w * 0.24;
  const showChar = v === 'stair' && look.character;
  const pose = `lib:${CHARACTER_POSES[(index >> 1) % CHARACTER_POSES.length]}`;
  const charP = spring({frame: c.frame - 2, fps: c.fps, config: {damping: 10, stiffness: 200, mass: 0.6}});
  let body;
  if (v === 'stair') {
    const size = fit(u * 9, 0.5);
    body = (
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', ...serif}}>
        {pre.length ? <div style={{fontSize: u * 3.9, color: look.ink, lineHeight: 1.1}}>{words_(pre, look.ink, u * 3.9, look.motion)}</div> : null}
        <div style={{marginLeft: u * 4, lineHeight: 1.05}}>{heroEl(size)}</div>
        {post.length ? <div style={{marginLeft: u * 9, fontSize: u * 3.4, color: look.ink, lineHeight: 1.15}}>{words_(post, look.ink, u * 3.4, look.motion)}</div> : null}
      </div>
    );
  } else if (v === 'inline') {
    body = (
      <div style={{...serif, fontWeight: 700, fontSize: u * 4.4, lineHeight: 1.4, textAlign: 'center', maxWidth: stage.w * 0.82, color: look.ink}}>
        {words.map((w, i) => <React.Fragment key={i}>{i > 0 ? ' ' : null}{i === h
          ? <span style={{fontSize: '1.35em'}}>{heroEl(u * 4.4 * 1.35)}</span>
          : <MotionText text={display(w.text)} f={c.frame - c.at(w)} dur={c.dur(w)} kind={look.motion} fps={c.fps} frame={c.frame} color={look.ink} />}</React.Fragment>)}
      </div>
    );
  } else {
    // Big red word (or number) with the rest stacked white beside it; numbers get a curved red arrow.
    const arrowP = interpolate(c.frame - c.at(hero), [6, 20], [0, 1], {...clamp, easing: ease});
    body = (
      <div style={{display: 'flex', alignItems: 'center', gap: u * 1.6, ...serif}}>
        <div style={{position: 'relative', lineHeight: 1}}>
          {heroEl(fit(u * 14, 0.45))}
          {num ? <svg width={u * 9} height={u * 5} style={{position: 'absolute', right: -u * 9.5, top: -u * 1, overflow: 'visible'}}>
            <path d={`M ${u * 0.5} ${u * 4.2} Q ${u * 4} ${u * 4.6} ${u * 8} ${u * 0.8}`} fill="none" stroke={red} strokeWidth={u * 0.5} strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - arrowP} />
            <path d={`M ${u * 6.4} ${u * 0.6} L ${u * 8} ${u * 0.8} L ${u * 7.7} ${u * 2.4}`} fill="none" stroke={red} strokeWidth={u * 0.5} strokeLinecap="round" opacity={arrowP > 0.9 ? 1 : 0} /></svg> : null}
        </div>
        <div style={{display: 'flex', flexDirection: 'column', maxWidth: stage.w * 0.4, marginLeft: num ? u * 9 : 0}}>
          {pre.length ? <div style={{fontSize: u * 3.2, lineHeight: 1.15}}>{words_(pre, look.ink, u * 3.2, look.motion)}</div> : null}
          {post.length ? <div style={{fontSize: u * 3.2, lineHeight: 1.15}}>{words_(post, look.ink, u * 3.2, look.motion)}</div> : null}
        </div>
      </div>
    );
  }
  return (
    <Backdrop bg={look.bg} look={look}>
      {showChar ? <Img src={staticFile(iconPath(pose))} style={{position: 'absolute', left: stage.w * 0.06, top: stage.h * 0.18, width: charW, height: stage.h * 0.6, objectFit: 'contain',
        transform: `scale(${charP})`, filter: 'drop-shadow(0 0 0.35rem rgba(255,255,255,.9))'}} /> : null}
      <AbsoluteFill style={{left: showChar ? charW + stage.w * 0.06 : 0, width: showChar ? stage.w - charW - stage.w * 0.06 : stage.w, alignItems: 'center', justifyContent: 'center'}}>{body}</AbsoluteFill>
    </Backdrop>
  );
}

// Reference 5: a mix of card types — dark with a white icon and words around it, white with a huge red
// CAPS headline and a cat rising in front, a dark line with a big red word, grey with a red serif word
// and a cat, and peach with a red headline over a big visual.
const MEME_VARIANTS = ['icon', 'headline', 'numberLine', 'serifMeme', 'peach'];
const MEME_CATS = ['s019', 's005', 's039', 's035', 's014', 's010'];

function MemeCard({scene, look, u, stage, index}) {
  const c = useCard(scene);
  const words = scene.words;
  const h = keyIndex(words);
  const pre = words.slice(0, h), hero = words[h], post = words.slice(h + 1);
  const heroText = display(hero.text);
  const num = heroText.match(NUMBER);
  const v = num ? 'numberLine' : MEME_VARIANTS[index % MEME_VARIANTS.length];
  const red = look.accents[0];
  const inter = (weight) => ({fontFamily: look.font, fontWeight: weight});
  const say = (ws, color, size, extra) => ws.length ? (
    <div style={{...inter(600), fontSize: size, color, lineHeight: 1.25, ...extra}}>
      {ws.map((w, i) => <React.Fragment key={i}>{i > 0 ? ' ' : null}
        <MotionText text={display(w.text)} f={c.frame - c.at(w)} dur={c.dur(w)} kind="fade" fps={c.fps} frame={c.frame} color={color} /></React.Fragment>)}
    </div>
  ) : null;
  const fit = (text, font, weight, share, cap) => {
    const w = measureText({text, fontFamily: font, fontSize: 100, fontWeight: String(weight)}).width * 1.04;
    return Math.min(cap, (stage.w * share / w) * 100);
  };
  const cat = scene.sticker && STICKER_BY_ID[scene.sticker]?.family === 'cat' ? scene.sticker : MEME_CATS[index % MEME_CATS.length];
  const catSrc = staticFile(STICKER_BY_ID[cat].src.replace(/^\//, ''));
  const rise = spring({frame: c.frame - 3, fps: c.fps, config: {damping: 14, stiffness: 120}});
  const icon = scene.icon ? staticFile(iconPath(scene.icon)) : '';
  const fillHero = (size, font, weight, upper) => <MotionText text={upper ? heroText.toUpperCase() : heroText} f={c.frame - c.at(hero)} dur={Math.max(8, c.dur(hero))} kind="fill"
    fps={c.fps} frame={c.frame} color={red} style={{fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 0.95, whiteSpace: 'nowrap'}} />;
  let bg = look.bg, content;
  if (v === 'icon') {
    // White silhouette icon in the middle; words appear to its left and right, keyword under it.
    const ip = spring({frame: c.frame - 2, fps: c.fps, config: {damping: 12, stiffness: 180}});
    content = (
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: u * 2.5}}>
        <div style={{flex: 1, textAlign: 'right'}}>{say(pre, '#FFFFFF', u * 2.6)}</div>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: u * 0.8}}>
          {icon ? <Img src={icon} style={{width: u * 11, height: u * 11, objectFit: 'contain', filter: 'brightness(0) invert(1)', transform: `scale(${ip})`}} /> : null}
          <MotionText text={heroText} f={c.frame - c.at(hero)} dur={c.dur(hero)} kind="fade" fps={c.fps} frame={c.frame} color="#FFFFFF" style={{...inter(700), fontSize: u * 4}} />
        </div>
        <div style={{flex: 1, textAlign: 'left'}}>{say(post, '#FFFFFF', u * 2.6)}</div>
      </AbsoluteFill>
    );
  } else if (v === 'headline' || v === 'peach') {
    // Huge red CAPS headline at the top edge; a cat (or the visual) rises in front of it.
    bg = v === 'peach' ? '#F6D3B8' : '#FFFFFF';
    const art = v === 'peach' && icon ? icon : catSrc;
    content = <>
      <div style={{position: 'absolute', top: -stage.h * 0.02, left: 0, right: 0, textAlign: 'center'}}>
        {fillHero(fit(heroText.toUpperCase(), look.font, 700, 0.94, stage.h * 0.36), look.font, 700, true)}
      </div>
      <Img src={art} style={{position: 'absolute', left: '50%', bottom: 0, height: stage.h * 0.7, width: stage.w * 0.4, objectFit: 'contain', objectPosition: 'bottom',
        transform: `translateX(-50%) translateY(${(1 - rise) * stage.h * 0.6}px)`}} />
      <div style={{position: 'absolute', left: stage.w * 0.06, top: stage.h * 0.48, width: stage.w * 0.26}}>{say(pre, '#111111', u * 2.6)}</div>
      <div style={{position: 'absolute', right: stage.w * 0.06, top: stage.h * 0.48, width: stage.w * 0.26, textAlign: 'right'}}>{say(post, '#111111', u * 2.6)}</div>
    </>;
  } else if (v === 'numberLine') {
    // One dark line; the keyword (often a number) big and red in the middle.
    content = (
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{...inter(600), display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', justifyContent: 'center', gap: u * 1, maxWidth: stage.w * 0.86}}>
          {say(pre, '#FFFFFF', u * 3)}
          <span style={{...inter(800), fontSize: u * 8, color: red, lineHeight: 1}}>{num
            ? Math.round(Number(num[1]) * interpolate(c.frame - c.at(hero), [0, 12], [0, 1], {...clamp, easing: ease})) + (num[2] || '')
            : <MotionText text={heroText} f={c.frame - c.at(hero)} dur={c.dur(hero)} kind="pop" fps={c.fps} frame={c.frame} color={red} />}</span>
          {say(post, '#9A9A9A', u * 3)}
        </div>
      </AbsoluteFill>
    );
  } else {
    // Light grey; huge red lowercase serif word, a cat on the right, small text under the word.
    bg = '#E3E3E3';
    content = <>
      <div style={{position: 'absolute', left: stage.w * 0.08, top: stage.h * 0.16, display: 'flex', flexDirection: 'column'}}>
        {say(pre, '#111111', u * 2.6)}
        {fillHero(fit(heroText, look.heroFont === SERIF_FAMILY ? SERIF_FAMILY : "'Playfair Display'", 900, 0.55, stage.h * 0.34), "'Playfair Display', 'Noto Sans Devanagari', serif", 900, false)}
        {say(post, '#111111', u * 2.6, {marginTop: u * 0.6})}
      </div>
      <Img src={catSrc} style={{position: 'absolute', right: stage.w * 0.06, bottom: 0, height: stage.h * 0.62, width: stage.w * 0.34, objectFit: 'contain',
        objectPosition: 'bottom', transform: `translateY(${(1 - rise) * stage.h * 0.6}px)`}} />
    </>;
  }
  return <Backdrop bg={bg} look={look}>{content}</Backdrop>;
}
const SERIF_FAMILY = "'Playfair Display'";

function StepCard({scene, look, u, stage}) {
  const c = useCard(scene);
  const label = scene.words.slice(2);
  const boxAt = label.length ? c.at(label[0]) : 0;
  const box = spring({frame: c.frame - boxAt, fps: c.fps, config: {damping: 20, stiffness: 220}});
  const head = [{...scene.words[0], text: look.stepPrefix || display(scene.words[0].text)}, {...scene.words[1], text: String(scene.num)}];
  const pal = {accentStyle: {color: look.darkInk}};
  return (
    <Backdrop bg={look.dark} look={look}>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: u * 1.2, ...shiftOf(look, stage)}}>
        <div style={{fontFamily: look.font === look.heroFont ? look.font : look.heroFont, fontWeight: look.heroWeight, fontSize: u * 4.6, letterSpacing: '-0.01em'}}>
          <Sentence words={head} look={look} ink={look.darkInk} pal={pal} c={c} />
        </div>
        {label.length ? (
          <div style={{position: 'relative', padding: `${u * 0.35}px ${u * 1}px`, fontFamily: look.labelFont, fontSize: u * 2.6, color: look.boxInk || '#111', maxWidth: '80%', textAlign: 'center'}}>
            <div style={{position: 'absolute', inset: 0, background: look.boxBg || '#FFFFFF', transform: `scaleX(${box})`, transformOrigin: 'left center'}} />
            <div style={{position: 'relative'}}>
              {label.map((w, i) => <React.Fragment key={i}>{i > 0 ? ' ' : ''}
                <MotionText text={display(w.text)} f={c.frame - c.at(w)} dur={c.dur(w)} kind={look.motion} fps={c.fps} frame={c.frame} color={look.boxInk || '#111'} /></React.Fragment>)}
            </div>
          </div>
        ) : null}
      </AbsoluteFill>
    </Backdrop>
  );
}

function CtaCard({scene, look, u, stage}) {
  const c = useCard(scene);
  const [comment, keyword, ...rest] = scene.words;
  const pop = spring({frame: c.frame - c.at(comment), fps: c.fps, config: {damping: 11, stiffness: 180, mass: 0.6}});
  const kf = c.frame - c.at(keyword);
  const bg = look.ctaBg || look.dark;
  const ink = look.ctaBg ? '#FFFFFF' : look.darkInk;
  return (
    <Backdrop bg={bg} look={look}>
      {look.ghost ? <Ghost text={scene.keyword} look={look} ink={ink} stage={stage} frame={c.frame} /> : null}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', ...shiftOf(look, stage)}}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div style={{alignSelf: 'flex-end', fontFamily: look.font, fontWeight: 700, fontSize: u * 3.4, color: ink, marginBottom: -u * 0.4, marginRight: u * 0.5,
            opacity: interpolate(kf, [0, 6], [0, 1], clamp)}}>“{display(scene.keyword)}”</div>
          <div style={{fontFamily: look.heroFont, fontWeight: look.heroWeight, fontStyle: look.heroItalic ? 'italic' : 'normal', fontSize: Math.min(u * 13, stage.w * 0.16),
            letterSpacing: look.heroTracking || '-0.045em', lineHeight: 1.05, color: look.cta, paddingRight: '0.08em', opacity: Math.min(1, pop * 2), transform: `scale(${1.25 - 0.25 * pop})`,
            textShadow: look.ctaBg ? '0 6px 20px rgba(0,0,0,.18)' : 'none'}}>
            {display(comment.text, look.upperHero).replace(/^./, (x) => x.toUpperCase())}</div>
          <div style={{fontFamily: look.font, fontWeight: 600, fontSize: u * 1.8, color: ink, opacity: 0.85, marginTop: u * 0.4, maxWidth: stage.w * 0.8, textAlign: 'center'}}>
            {rest.map((w, i) => <span key={i} style={{opacity: c.frame >= c.at(w) ? 1 : 0}}>{i > 0 ? ' ' : ''}{display(w.text)}</span>)}
          </div>
        </div>
      </AbsoluteFill>
      {look.ctaHands ? ['right', 'left'].map((side, i) => {
        const p = spring({frame: c.frame - 6 - i * 3, fps: c.fps, config: {damping: 13, stiffness: 150}});
        const size = stage.h * 0.42;
        return <Img key={side} src={staticFile(`icons/backhand_index_pointing_${side}.png`)} style={{position: 'absolute', width: size, height: size, objectFit: 'contain',
          [side === 'right' ? 'left' : 'right']: -size * 0.15 + (1 - p) * -size, [i ? 'top' : 'bottom']: stage.h * 0.02,
          transform: `rotate(${(i ? 1 : -1) * (12 + Math.sin(c.frame / 10) * 3)}deg)`}} />;
      }) : null}
    </Backdrop>
  );
}

// Mascot in the bottom-right for the whole video; changes pose on every card.
const MASCOT_POSES = ['mascot-character-pointing-right-1', 'chubby-character-thinking-hoodie-1', 'chubby-character-giving-thumbs-up-1',
  'mascot-pointing-up-1', 'mascot-holding-phone-surprise-1', 'mascot-waving-hello-1'];
function MascotOverlay({scenes, stage}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  let i = scenes.findIndex((s) => frame < Math.round(s.end * fps));
  if (i < 0) i = scenes.length - 1;
  const s = scenes[i];
  const pose = s.sticker?.startsWith('lib:') ? s.sticker : `lib:${MASCOT_POSES[i % MASCOT_POSES.length]}`;
  const p = spring({frame: frame - Math.round(s.start * fps), fps, config: {damping: 10, stiffness: 200, mass: 0.6}});
  const size = stage.h * 0.46;
  return <Img src={staticFile(iconPath(pose))} style={{position: 'absolute', right: stage.w * 0.02, bottom: -size * 0.04, width: size, height: size, objectFit: 'contain',
    transform: `translateY(${(1 - p) * size * 0.25}px) scale(${0.85 + 0.15 * p}) rotate(${Math.sin(frame / 12) * 2}deg)`, transformOrigin: 'bottom center'}} />;
}

// A small cat walking along the bottom edge across the whole video.
function Walker({id, stage}) {
  const frame = useCurrentFrame();
  const st = STICKER_BY_ID[id];
  if (!st) return null;
  const size = stage.h * 0.16;
  const x = ((frame * 2.2) % (stage.w + size * 2)) - size;
  return <Img src={staticFile(st.src.replace(/^\//, ''))} style={{position: 'absolute', left: x, bottom: stage.h * 0.01, width: size, height: size, objectFit: 'contain',
    transform: `translateY(${Math.abs(Math.sin(frame / 4)) * -size * 0.08}px) rotate(${Math.sin(frame / 4) * 4}deg)`}} />;
}

// How a card comes in over the previous one (cards overlap by TRANSITION frames).
const TRANSITION = 8;
function TransitionIn({kind, children, stage}) {
  const f = useCurrentFrame();
  if (!kind || f >= TRANSITION) return <AbsoluteFill>{children}</AbsoluteFill>;
  const p = interpolate(f, [0, TRANSITION], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  if (kind === 'wipe') {
    // A black diagonal sweeps across, covering the old card, then uncovers the new one.
    const cover = Math.min(1, p * 2), reveal = Math.max(0, p * 2 - 1);
    const edge = (t) => `${100 - t * 160}%`;
    return (
      <AbsoluteFill>
        {reveal > 0 ? <AbsoluteFill>{children}</AbsoluteFill> : null}
        <AbsoluteFill style={{background: '#000', clipPath: reveal > 0
          ? `polygon(0 0, ${100 - reveal * 160 + 60}% 0, ${100 - reveal * 160}% 100%, 0 100%)`
          : `polygon(${edge(cover)} 100%, calc(${edge(cover)} + 60%) 0, 100% 0, 100% 100%)`}} />
      </AbsoluteFill>
    );
  }
  if (kind === 'circle') return <AbsoluteFill style={{clipPath: `circle(${p * 75}% at 50% 50%)`}}>{children}</AbsoluteFill>;
  if (kind === 'zoom') return <AbsoluteFill style={{opacity: p, transform: `scale(${2.6 - 1.6 * p})`, filter: `blur(${(1 - p) * 14}px)`}}>{children}</AbsoluteFill>;
  if (kind === 'whip') return <AbsoluteFill style={{transform: `translateX(${(1 - p) * stage.w}px)`, filter: `blur(${(1 - p) * 16}px)`}}>{children}</AbsoluteFill>;
  return <AbsoluteFill style={{opacity: p, filter: `blur(${(1 - p) * 18}px)`}}>{children}</AbsoluteFill>;
}

function cardFor(scene, look) {
  if (scene.type === 'step') return StepCard;
  if (scene.type === 'cta') return CtaCard;
  if (look.layout === 'collage') return CollageCard;
  if (look.layout === 'tag') return TagCard;
  if (look.layout === 'feed') return FeedCard;
  if (look.layout === 'run') return RunCard;
  if (look.layout === 'lockup') return LockupCard;
  if (look.layout === 'serif') return SerifCard;
  if (look.layout === 'bonus') return BonusCard;
  if (look.layout === 'stair') return StairCard;
  if (look.layout === 'meme') return MemeCard;
  // A "big word" card needs a keyword; without one it falls back to a sentence.
  return scene.type === 'hero' && heroOf(scene) ? HeroCard : LineCard;
}

// True while the voice is speaking (with a short tail), so music can duck under it.
function speaking(scenes, t) {
  return scenes.some((s) => s.words.some((w) => t >= w.start - 0.05 && t <= w.end + 0.25));
}

// Typing clicks on every word, a pop when a keyword lands, a whoosh on each transition.
function SoundEffects({scenes, look, fps}) {
  const cues = [];
  scenes.forEach((s, i) => {
    if (look.transition && i > 0 && (!look.transitionEvery || i % look.transitionEvery === 0)) cues.push(['whoosh', s.start - 0.05, 0.16]);
    if (!['line', 'hero'].includes(s.type)) return;
    s.words.forEach((w) => cues.push(['click', w.start, 0.07]));
    const hero = s.words.find((w) => w.hero);
    if (hero) cues.push(['pop', hero.start + Math.min(0.5, hero.end - hero.start), 0.2]);
  });
  return cues.map(([name, t, volume], i) => (
    <Sequence key={i} from={Math.max(0, Math.round(t * fps))} durationInFrames={Math.round(fps * 0.6)}>
      <Audio src={staticFile(`sfx/${name}.mp3`)} volume={volume} />
    </Sequence>
  ));
}

export function Reel({project}) {
  const ready = useFontsReady();
  const {fps, width, height} = useVideoConfig();
  if (!project?.scenes) return null;
  const look = project.look?.motion ? project.look : getLook(project.settings?.lookId);
  const outer = project.stage || {x: 0, y: 0, w: width, h: height};
  // Framed templates draw every card inside a rounded panel.
  const stage = look.frame ? {x: outer.x + outer.w * 0.07, y: outer.y + outer.h * 0.1, w: outer.w * 0.86, h: outer.h * 0.8} : outer;
  // Size unit: landscape stages scale with width, portrait stages a little larger.
  const u = stage.w >= stage.h ? stage.w / 100 : stage.w / 62;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {look.frame ? <div style={{position: 'absolute', left: outer.x, top: outer.y, width: outer.w, height: outer.h, background: look.frameBg}} /> : null}
      <div style={{position: 'absolute', left: stage.x, top: stage.y, width: stage.w, height: stage.h, overflow: 'hidden', background: look.bg,
        borderRadius: look.frame ? stage.h * 0.05 : 0, boxShadow: look.frame ? '0 20px 50px rgba(0,0,0,.5)' : 'none'}}>
        {ready ? project.scenes.map((scene, index) => {
          const Card = cardFor(scene, look);
          const from = Math.round(scene.start * fps);
          const moves = (i) => look.transition && i > 0 && (!look.transitionEvery || i % look.transitionEvery === 0);
          const overlap = moves(index + 1) && index < project.scenes.length - 1 ? TRANSITION : 0;
          return (
            <Sequence key={scene.id} from={from} durationInFrames={Math.max(1, Math.round(scene.end * fps) - from + overlap)}>
              <TransitionIn kind={moves(index) ? look.transition : null} stage={stage}>
                <Card scene={scene} look={look} u={u} stage={stage} index={index} scenes={project.scenes} />
              </TransitionIn>
            </Sequence>
          );
        }) : null}
        {ready && look.mascot ? <MascotOverlay scenes={project.scenes} stage={stage} /> : null}
        {ready && look.walker ? <Walker id={look.walker} stage={stage} /> : null}
      </div>
      {ready && look.sfx ? <SoundEffects scenes={project.scenes} look={look} fps={fps} /> : null}
      {project.audioSrc ? <Audio src={project.audioSrc} volume={project.audioVolume ?? 1} /> : null}
      {project.musicSrc ? <Audio src={project.musicSrc} volume={(f) => (project.musicVolume ?? 0.05) * (speaking(project.scenes, f / fps) ? 0.45 : 1)} loop /> : null}
    </AbsoluteFill>
  );
}
