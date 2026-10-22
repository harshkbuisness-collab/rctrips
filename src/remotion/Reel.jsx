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

function Word({w, look, ink, pal, isHero, extra, c}) {
  const style = isHero ? {...pal.accentStyle, ...extra} : extra;
  return <MotionText text={display(w.text, look.upper)} f={c.frame - c.at(w)} dur={c.dur(w)} kind={look.motion} fps={c.fps} frame={c.frame}
    color={isHero ? (pal.accentStyle.color || ink) : ink} style={style} />;
}

function Sentence({words, look, ink, pal, heroExtra, c}) {
  return words.map((w, i) => (
    <React.Fragment key={i}>{i > 0 ? ' ' : null}<Word w={w} look={look} ink={ink} pal={pal} isHero={w.hero} extra={w.hero ? heroExtra : undefined} c={c} /></React.Fragment>
  ));
}

function Art({src, size, frame, style}) {
  const {fps} = useVideoConfig();
  const p = spring({frame: frame - 4, fps, config: {damping: 12, stiffness: 160, mass: 0.7}});
  return <Img src={src} style={{width: size, height: size, objectFit: 'contain', opacity: Math.min(1, p * 2),
    transform: `translateY(${Math.sin(frame / 16) * size * 0.03}px) scale(${0.5 + 0.5 * p}) rotate(${(1 - p) * -12}deg)`, ...style}} />;
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
        {src ? <Art src={src} size={u * 15} frame={c.frame} /> : null}
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
          <Word w={{...hero, text}} look={look} ink={pal.ink} pal={pal} isHero c={c}
            extra={{fontFamily: font, fontWeight: look.heroWeight, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: 1.08,
              letterSpacing: tracking, whiteSpace: 'nowrap', paddingRight: italic || script ? '0.1em' : 0}} />
          {sub.length ? <div style={{...small, fontFamily: subFont, fontStyle: look.subFont || look.font !== look.heroFont || look.upperHero ? 'normal' : 'italic',
            fontSize: u * 2.4 * (look.subScale || 1), lineHeight: 1.25, marginTop: u * 0.6}}>
            <Sentence words={sub} look={look} ink={look.subInk || pal.ink} pal={pal} c={c} /></div> : null}
        </div>
        {src ? <Art src={src} size={artSize} frame={c.frame - c.at(hero)} /> : null}
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
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'space-evenly', flexDirection: 'column', padding: `${stage.h * 0.06}px 0`}}>
        <div style={{fontFamily: look.heroFont, fontWeight: look.heroWeight, fontSize: u * 5.4, lineHeight: 1, color: look.tagInk, background: look.tagBg,
          padding: `${u * 0.4}px ${u * 1.4}px`, borderRadius: u * 0.8, boxShadow: '0 6px 0 rgba(0,0,0,.18)', letterSpacing: '0.02em',
          opacity: Math.min(1, tagIn * 2), transform: `scale(${0.7 + 0.3 * tagIn})`}}>{display(key.text, true)}</div>
        {src ? <Art src={src} size={stage.h * 0.36} frame={c.frame} /> : null}
        <div style={{maxWidth: stage.w * 0.8, textAlign: 'center', fontFamily: look.font, fontWeight: look.weight, fontSize: u * (src ? 2.4 : 3.4), lineHeight: 1.3}}>
          <Sentence words={scene.words} look={look} ink={pal.ink} pal={pal} heroExtra={{fontWeight: 800}} c={c} />
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

function cardFor(scene, look) {
  if (scene.type === 'step') return StepCard;
  if (scene.type === 'cta') return CtaCard;
  if (look.layout === 'collage') return CollageCard;
  if (look.layout === 'tag') return TagCard;
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
          return (
            <Sequence key={scene.id} from={from} durationInFrames={Math.max(1, Math.round(scene.end * fps) - from)}>
              <Card scene={scene} look={look} u={u} stage={stage} index={index} />
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
