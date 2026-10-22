import '@fontsource/inter/600-italic.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/900.css';
import '@fontsource/inter/900-italic.css';
import '@fontsource/noto-sans-devanagari/700.css';
import '@fontsource/noto-sans-devanagari/900.css';
import '@fontsource/libre-caslon-text/400.css';
import '@fontsource/anton/400.css';
import '@fontsource/oswald/700.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/dm-sans/800.css';
import '@fontsource/caveat/700.css';
import '@fontsource/space-mono/700.css';
import '@fontsource/playfair-display/700.css';
import '@fontsource/playfair-display/700-italic.css';
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {measureText} from '@remotion/layout-utils';
import {iconPath} from '../engine/icons.js';
import {STICKER_BY_ID} from '../engine/stickers.js';
import {getLook} from '../engine/looks.js';
import {MotionText} from './motion.jsx';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
const ease = Easing.out(Easing.cubic);
const FONT_FACES = ['700 Inter', 'italic 900 Inter', 'italic 600 Inter', '900 Inter', '900 "Noto Sans Devanagari"', '700 "Noto Sans Devanagari"',
  '400 "Libre Caslon Text"', '400 Anton', '700 Oswald', '700 "DM Sans"', '800 "DM Sans"', '700 Caveat', '700 "Space Mono"',
  '700 "Playfair Display"', 'italic 700 "Playfair Display"'];

// Hold the render until fonts are loaded, so measuring and drawing match.
function useFontsReady() {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('Loading fonts'));
  useEffect(() => {
    Promise.all(FONT_FACES.map((f) => document.fonts.load(`${f.replace(/ (?=[^ ]+$|")/, ' 100px ')}`, f.includes('Devanagari') ? 'क' : 'Aa')))
      .catch(() => {}).finally(() => { setReady(true); continueRender(handle); });
  }, [handle]);
  return ready;
}

const display = (t, look) => { const s = String(t).replace(/[,.;:।]+$/u, ''); return look?.upper ? s.toUpperCase() : s; };
const graphemes = (t) => [...new Intl.Segmenter('hi', {granularity: 'grapheme'}).segment(t)].map((g) => g.segment);
const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
const onColor = (hex) => (lum(hex) > 0.6 ? '#111111' : '#FFFFFF');

function useCard(scene) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const at = (w) => Math.max(0, Math.round((w.start - scene.start) * fps) - 3);
  return {frame, fps, at};
}

// Colours for a sentence/big-word card; "cycle" looks rotate background blocks per card.
function paletteFor(look, scene, index) {
  if (look.cycle) { const c = look.cycle[index % look.cycle.length]; return {bg: c.bg, ink: c.ink, accent: c.accent}; }
  return {bg: look.bg, ink: look.ink, accent: look.accents[scene.accent || 0] || look.accents[0]};
}

// How a word enters, per look.wordAnim.
function enter(kind, f, fps) {
  switch (kind) {
    case 'rise': return {opacity: interpolate(f, [0, 5], [0, 1], clamp), transform: `translateY(${interpolate(f, [0, 9], [0.5, 0], {...clamp, easing: ease})}em)`};
    case 'pop': { const p = spring({frame: f, fps, config: {damping: 10, stiffness: 220, mass: 0.5}}); return {opacity: f >= 0 ? 1 : 0, transform: `scale(${0.55 + 0.45 * p})`}; }
    case 'slam': return {opacity: f >= 0 ? 1 : 0, transform: `scale(${interpolate(f, [0, 5], [1.9, 1], {...clamp, easing: ease})})`};
    case 'fade': return {opacity: interpolate(f, [0, 12], [0, 1], clamp), transform: `translateY(${interpolate(f, [0, 14], [0.15, 0], {...clamp, easing: ease})}em)`};
    case 'type': return {opacity: f >= 0 ? 1 : 0};
    default: return {opacity: interpolate(f, [0, 6], [0, 1], clamp), filter: `blur(${interpolate(f, [0, 7], [12, 0], clamp)}px)`,
      transform: `translateY(${interpolate(f, [0, 8], [0.3, 0], {...clamp, easing: ease})}em)`};
  }
}

// Keyword treatment, per look.highlight.
function highlight(kind, look, accent, f) {
  const grow = interpolate(f, [2, 10], [0, 100], {...clamp, easing: ease});
  switch (kind) {
    case 'box': return {background: accent, color: onColor(accent), padding: '0 0.14em', borderRadius: '0.06em'};
    case 'marker': return {color: look.ink, backgroundImage: `linear-gradient(${look.marker}, ${look.marker})`, backgroundRepeat: 'no-repeat',
      backgroundPosition: '0 85%', backgroundSize: `${grow}% 45%`, padding: '0 0.06em'};
    case 'glow': return {color: accent, textShadow: `0 0 0.18em ${accent}, 0 0 0.5em ${accent}`};
    case 'underline': return {color: accent, backgroundImage: `linear-gradient(${accent}, ${accent})`, backgroundRepeat: 'no-repeat',
      backgroundPosition: '0 96%', backgroundSize: `${grow}% 0.09em`};
    default: return {color: accent};
  }
}

function Word({w, frame, fps, at, look, ink, accent, isHero, extra}) {
  const f = frame - at(w);
  const hl = isHero ? highlight(look.highlight, look, accent, f) : null;
  const motion = look.motion || look.wordAnim;
  // Older looks animate with enter(); motion looks use the shared text animations.
  if (!look.motion) {
    let text = display(w.text, look);
    if (look.wordAnim === 'type') {
      const n = Math.max(0, Math.min(text.length, Math.floor(f * 1.6) + 1));
      text = <>{text.slice(0, n)}<span style={{opacity: 0}}>{text.slice(n)}</span></>;
    }
    return <span style={{display: 'inline-block', color: ink, ...enter(look.wordAnim, f, fps), ...hl, ...extra}}>{text}</span>;
  }
  return <MotionText text={display(w.text, look)} f={f} dur={Math.round((w.end - w.start) * fps)} kind={motion} fps={fps} frame={frame}
    color={hl?.color || ink} style={{...hl, ...extra}} />;
}

function Sentence({words, look, ink, accent, heroExtra, frame, fps, at}) {
  return words.map((w, i) => (
    <React.Fragment key={i}>{i > 0 ? ' ' : null}
      <Word w={w} frame={frame} fps={fps} at={at} look={look} ink={ink} accent={accent} isHero={w.hero} extra={w.hero ? heroExtra : undefined} />
    </React.Fragment>
  ));
}

// Big keyword: editorial look reveals letter by letter through a blur; others use the look's word animation.
function HeroWord({w, frame, fps, at, look, ink, accent, size}) {
  const base = {fontFamily: look.heroFont, fontWeight: look.heroWeight, fontStyle: look.heroItalic ? 'italic' : 'normal', fontSize: size, lineHeight: 1.05,
    letterSpacing: look.tracking || '-0.045em', whiteSpace: 'nowrap', paddingRight: look.heroItalic ? '0.08em' : 0};
  if ((look.motion || look.wordAnim) !== 'blur') return <Word w={w} frame={frame} fps={fps} at={at} look={look} ink={ink} accent={accent} isHero extra={base} />;
  const f = frame - at(w);
  return (
    <span style={{...base, display: 'inline-block', color: accent, transform: `scale(${interpolate(f, [0, 12], [1.08, 1], {...clamp, easing: ease})})`, transformOrigin: 'left center'}}>
      {graphemes(display(w.text, look)).map((l, i) => {
        const lf = f - i * 1.3;
        return <span key={i} style={{display: 'inline-block', opacity: interpolate(lf, [0, 6], [0, 1], clamp), filter: `blur(${interpolate(lf, [0, 8], [16, 0], clamp)}px)`,
          transform: `translateY(${interpolate(lf, [0, 9], [0.18, 0], {...clamp, easing: ease})}em)`}}>{l === ' ' ? ' ' : l}</span>;
      })}
    </span>
  );
}

function Art({src, size, frame, style}) {
  const {fps} = useVideoConfig();
  const p = spring({frame: frame - 4, fps, config: {damping: 12, stiffness: 160, mass: 0.7}});
  return <Img src={src} style={{width: size, height: size, objectFit: 'contain', opacity: Math.min(1, p * 2),
    transform: `translateY(${Math.sin(frame / 16) * size * 0.03}px) scale(${0.5 + 0.5 * p}) rotate(${(1 - p) * -12}deg)`, ...style}} />;
}
const artSrc = (scene) => {
  if (scene.icon) return staticFile(iconPath(scene.icon));
  if (scene.sticker?.startsWith('lib:')) return staticFile(iconPath(scene.sticker));
  return scene.sticker && STICKER_BY_ID[scene.sticker] ? staticFile(STICKER_BY_ID[scene.sticker].src.replace(/^\//, '')) : '';
};
// Comic look: thick outline + offset shadow on all text.
const outlineStyle = (look) => (look.outline ? {WebkitTextStroke: `0.045em ${look.outline}`, paintOrder: 'stroke fill', textShadow: `0.06em 0.07em 0 ${look.outline}`} : null);

function LineCard({scene, look, u, stage, index}) {
  const {frame, fps, at} = useCard(scene);
  const pal = paletteFor(look, scene, index);
  const src = artSrc(scene);
  const align = look.align || 'center';
  return (
    <AbsoluteFill style={{background: pal.bg, alignItems: align === 'left' ? 'flex-start' : 'center', justifyContent: 'center', flexDirection: 'column', gap: u * 2, padding: `0 ${stage.w * 0.09}px`}}>
      {src ? <Art src={src} size={u * 15} frame={frame} /> : null}
      <div style={{maxWidth: stage.w * 0.82, textAlign: align, fontFamily: look.font, fontWeight: look.weight, fontSize: u * 3.6 * (look.textScale || 1),
        lineHeight: 1.25, letterSpacing: look.tracking || '-0.02em', ...outlineStyle(look)}}>
        <Sentence words={scene.words} look={look} ink={pal.ink} accent={pal.accent} heroExtra={{fontWeight: look.heroWeight}} frame={frame} fps={fps} at={at} />
      </div>
    </AbsoluteFill>
  );
}

function HeroCard({scene, look, u, stage, index}) {
  const {frame, fps, at} = useCard(scene);
  const pal = paletteFor(look, scene, index);
  const h = scene.words.findIndex((w) => w.hero);
  const kicker = scene.words.slice(0, h), sub = scene.words.slice(h + 1), hero = scene.words[h];
  const src = artSrc(scene);
  const artSize = u * 16;
  // With a visual, text and visual sit side by side, so the text gets less width.
  const maxW = stage.w * 0.84 - (src ? artSize + u * 2 : 0);
  const pad = ['box'].includes(look.highlight) ? 1.35 : 1.1;
  const base = measureText({text: display(hero.text, look), fontFamily: look.heroFont, fontSize: 100, fontWeight: String(look.heroWeight),
    fontStyle: look.heroItalic ? 'italic' : 'normal', letterSpacing: look.tracking || '-0.045em'}).width * pad;
  const size = Math.min(u * 13 * (look.heroScale || 1), (maxW / base) * 100);
  const small = {fontFamily: look.font, fontWeight: look.weight, letterSpacing: look.tracking || '-0.02em', maxWidth: maxW};
  return (
    <AbsoluteFill style={{background: pal.bg, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: u * 2, ...outlineStyle(look)}}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: look.align === 'center' ? 'center' : 'flex-start', maxWidth: maxW}}>
        {kicker.length ? <div style={{...small, fontSize: u * 3.2 * (look.textScale || 1), lineHeight: 1.2, marginBottom: u * 0.3}}>
          <Sentence words={kicker} look={look} ink={pal.ink} accent={pal.accent} frame={frame} fps={fps} at={at} /></div> : null}
        <HeroWord w={hero} frame={frame} fps={fps} at={at} look={look} ink={pal.ink} accent={pal.accent} size={size} />
        {sub.length ? <div style={{...small, fontStyle: look.layout === 'cards' && !look.upper ? 'italic' : 'normal', fontSize: u * 2.4 * (look.textScale || 1), lineHeight: 1.25, marginTop: u * 0.6}}>
          <Sentence words={sub} look={look} ink={pal.ink} accent={pal.accent} frame={frame} fps={fps} at={at} /></div> : null}
      </div>
      {src ? <Art src={src} size={artSize} frame={frame - at(hero)} /> : null}
    </AbsoluteFill>
  );
}

// One huge word at a time (sentence and big-word cards in the "oneword" layout).
function OneWordCard({scene, look, u, stage, index}) {
  const {frame, fps, at} = useCard(scene);
  const pal = paletteFor(look, scene, index);
  let cur = -1;
  scene.words.forEach((w, i) => { if (frame >= at(w)) cur = i; });
  const src = artSrc(scene);
  if (cur < 0) return <AbsoluteFill style={{background: pal.bg}} />;
  const w = scene.words[cur];
  const text = display(w.text, look);
  const width = measureText({text, fontFamily: look.font, fontSize: 100, fontWeight: String(look.weight), letterSpacing: '0em'}).width * 1.05;
  const size = Math.min(u * (w.hero ? 17 : 12), (stage.w * 0.84 / width) * 100, stage.h * 0.42);
  const p = spring({frame: frame - at(w), fps, config: {damping: 11, stiffness: 240, mass: 0.5}});
  return (
    <AbsoluteFill style={{background: pal.bg, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: u}}>
      {src ? <Art src={src} size={u * 11} frame={frame} /> : null}
      <div style={{fontFamily: look.font, fontWeight: look.weight, fontSize: size, lineHeight: 1, color: w.hero ? pal.accent : pal.ink,
        transform: `scale(${0.7 + 0.3 * p})`, whiteSpace: 'nowrap'}}>{text}</div>
    </AbsoluteFill>
  );
}

// Whole line as captions; the word being spoken sits in a coloured box.
function KaraokeCard({scene, look, u, stage, index}) {
  const {frame, fps, at} = useCard(scene);
  const pal = paletteFor(look, scene, index);
  let cur = -1;
  scene.words.forEach((w, i) => { if (frame >= at(w)) cur = i; });
  const src = artSrc(scene);
  return (
    <AbsoluteFill style={{background: pal.bg, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: u * 2}}>
      {src ? <Art src={src} size={u * 14} frame={frame} /> : null}
      <div style={{maxWidth: stage.w * 0.84, textAlign: 'center', fontFamily: look.font, fontWeight: look.weight, fontSize: u * 4.6, lineHeight: 1.3,
        opacity: interpolate(frame, [0, 4], [0, 1], clamp)}}>
        {scene.words.map((w, i) => {
          const active = i === cur;
          const p = active ? spring({frame: frame - at(w), fps, config: {damping: 12, stiffness: 260, mass: 0.4}}) : 1;
          const box = w.hero ? look.accents[1] : look.boxBg;
          return <React.Fragment key={i}>{i > 0 ? ' ' : null}<span style={{display: 'inline-block', padding: '0 0.12em', borderRadius: '0.12em',
            color: i <= cur ? pal.ink : `${pal.ink}66`, background: active ? box : 'transparent', transform: `scale(${active ? 0.9 + 0.1 * p : 1})`}}>{display(w.text, look)}</span></React.Fragment>;
        })}
      </div>
    </AbsoluteFill>
  );
}

function StepCard({scene, look, u}) {
  const {frame, fps, at} = useCard(scene);
  const label = scene.words.slice(2);
  const boxAt = label.length ? at(label[0]) : 0;
  const box = spring({frame: frame - boxAt, fps, config: {damping: 20, stiffness: 220}});
  const head = [{...scene.words[0], text: display(scene.words[0].text, look)}, {...scene.words[1], text: String(scene.num)}];
  return (
    <AbsoluteFill style={{background: look.dark, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: u * 1.2}}>
      <div style={{fontFamily: look.font, fontWeight: look.heroWeight, fontSize: u * 4.6 * (look.textScale || 1), letterSpacing: look.tracking || '-0.02em'}}>
        <Sentence words={head} look={look} ink={look.darkInk} accent={look.darkInk} frame={frame} fps={fps} at={at} />
      </div>
      {label.length ? (
        <div style={{position: 'relative', padding: `${u * 0.35}px ${u * 1}px`, fontFamily: look.labelFont, fontSize: u * 2.6 * (look.labelScale || 1),
          color: look.boxInk || '#111', maxWidth: '84%', textAlign: 'center', textTransform: look.upper ? 'uppercase' : 'none'}}>
          <div style={{position: 'absolute', inset: 0, background: look.boxBg || '#FFFFFF', transform: `scaleX(${box})`, transformOrigin: 'left center'}} />
          <div style={{position: 'relative'}}>
            {label.map((w, i) => <React.Fragment key={i}>{i > 0 ? ' ' : ''}{look.motion
              ? <MotionText text={display(w.text)} f={frame - at(w)} dur={Math.round((w.end - w.start) * fps)} kind={look.motion} fps={fps} frame={frame} color={look.boxInk || '#111'} />
              : <span style={{opacity: frame >= at(w) ? 1 : 0}}>{display(w.text)}</span>}</React.Fragment>)}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
}

function CtaCard({scene, look, u, stage}) {
  const {frame, fps, at} = useCard(scene);
  const [comment, keyword, ...rest] = scene.words;
  const pop = spring({frame: frame - at(comment), fps, config: {damping: 11, stiffness: 180, mass: 0.6}});
  const kf = frame - at(keyword);
  return (
    <AbsoluteFill style={{background: look.dark, alignItems: 'center', justifyContent: 'center', ...outlineStyle(look)}}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div style={{alignSelf: 'flex-end', fontFamily: look.font, fontWeight: look.weight, fontSize: u * 3.4, color: look.darkInk, marginBottom: -u * 0.4, marginRight: u * 0.5,
          opacity: interpolate(kf, [0, 6], [0, 1], clamp)}}>“{display(scene.keyword, look)}”</div>
        <div style={{fontFamily: look.heroFont, fontWeight: look.heroWeight, fontStyle: look.heroItalic ? 'italic' : 'normal', fontSize: Math.min(u * 13, stage.w * 0.16),
          letterSpacing: look.tracking || '-0.045em', lineHeight: 1.05, color: look.cta, paddingRight: '0.08em', opacity: Math.min(1, pop * 2), transform: `scale(${1.25 - 0.25 * pop})`}}>
          {display(comment.text, look).replace(/^./, (c) => c.toUpperCase())}</div>
        <div style={{fontFamily: look.font, fontWeight: 600, fontSize: u * 1.8, color: look.darkInk, opacity: 0.8, marginTop: u * 0.4, maxWidth: stage.w * 0.8, textAlign: 'center', textShadow: 'none', WebkitTextStroke: 0}}>
          {rest.map((w, i) => <span key={i} style={{opacity: frame >= at(w) ? 1 : 0}}>{i > 0 ? ' ' : ''}{display(w.text)}</span>)}
        </div>
      </div>
    </AbsoluteFill>
  );
}

const LAYOUT_CARDS = {oneword: OneWordCard, karaoke: KaraokeCard};

function cardFor(scene, look) {
  if (scene.type === 'step') return StepCard;
  if (scene.type === 'cta') return CtaCard;
  if (LAYOUT_CARDS[look.layout]) return LAYOUT_CARDS[look.layout];
  // A "big word" card needs a keyword; without one it falls back to a sentence.
  return scene.type === 'hero' && scene.words.some((w) => w.hero) ? HeroCard : LineCard;
}

export function Reel({project}) {
  const ready = useFontsReady();
  const {fps, width, height} = useVideoConfig();
  if (!project?.scenes) return null;
  // Older projects only carry a colour theme; map it onto the editorial look.
  const look = project.look || {...getLook('editorial'), ...(project.theme ? {bg: project.theme.bg, ink: project.theme.ink, dark: project.theme.dark, accents: project.theme.accents, cta: project.theme.cta} : null)};
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
      </div>
      {project.audioSrc ? <Audio src={project.audioSrc} volume={project.audioVolume ?? 1} /> : null}
      {project.musicSrc ? <Audio src={project.musicSrc} volume={project.musicVolume ?? 0.15} loop /> : null}
    </AbsoluteFill>
  );
}
