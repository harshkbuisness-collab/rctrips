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
import '@fontsource/playfair-display/700.css';
import '@fontsource/playfair-display/900.css';
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
  ['700', 'Caveat'], ['700', '"Dancing Script"'], ['700', '"Playfair Display"'], ['900', '"Playfair Display"']];

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
  const c = look.cycle ? look.cycle[index % look.cycle.length] : {bg: look.bg, ink: look.ink, accent: look.accents[scene.accent || 0] || look.accents[0]};
  return {...c, accentStyle: c.accent === 'gradient'
    ? {backgroundImage: look.gradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}
    : {color: c.accent}};
}

const NOISE = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

// Card background plus optional paper / grain texture.
function Backdrop({bg, look, children, style}) {
  return (
    <AbsoluteFill style={{background: bg, ...style}}>
      {look.texture ? <AbsoluteFill style={{backgroundImage: NOISE, opacity: look.texture === 'paper' ? 0.1 : 0.16, mixBlendMode: 'multiply'}} /> : null}
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

function Sentence({words, look, ink, pal, heroExtra, c}) {
  return words.map((w, i) => (
    <React.Fragment key={i}>{i > 0 ? ' ' : null}<Word w={w} look={look} ink={ink} pal={pal} isHero={w.hero} extra={w.hero ? heroExtra : undefined} c={c} /></React.Fragment>
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
  // A "big word" card needs a keyword; without one it falls back to a sentence.
  return scene.type === 'hero' && heroOf(scene) ? HeroCard : LineCard;
}

export function Reel({project}) {
  const ready = useFontsReady();
  const {fps, width, height} = useVideoConfig();
  if (!project?.scenes) return null;
  const look = project.look?.motion ? project.look : getLook(project.settings?.lookId);
  const stage = project.stage || {x: 0, y: 0, w: width, h: height};
  // Size unit: landscape stages scale with width, portrait stages a little larger.
  const u = stage.w >= stage.h ? stage.w / 100 : stage.w / 62;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <div style={{position: 'absolute', left: stage.x, top: stage.y, width: stage.w, height: stage.h, overflow: 'hidden', background: look.bg}}>
        {ready ? project.scenes.map((scene, index) => {
          const Card = cardFor(scene, look);
          const from = Math.round(scene.start * fps);
          const overlap = look.transition && index < project.scenes.length - 1 ? TRANSITION : 0;
          return (
            <Sequence key={scene.id} from={from} durationInFrames={Math.max(1, Math.round(scene.end * fps) - from + overlap)}>
              <TransitionIn kind={index > 0 ? look.transition : null} stage={stage}>
                <Card scene={scene} look={look} u={u} stage={stage} index={index} scenes={project.scenes} />
              </TransitionIn>
            </Sequence>
          );
        }) : null}
        {ready && look.mascot ? <MascotOverlay scenes={project.scenes} stage={stage} /> : null}
        {ready && look.walker ? <Walker id={look.walker} stage={stage} /> : null}
      </div>
      {project.audioSrc ? <Audio src={project.audioSrc} volume={project.audioVolume ?? 1} /> : null}
      {project.musicSrc ? <Audio src={project.musicSrc} volume={project.musicVolume ?? 0.15} loop /> : null}
    </AbsoluteFill>
  );
}
