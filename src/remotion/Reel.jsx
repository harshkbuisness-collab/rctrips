import '@fontsource/inter/600-italic.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/900.css';
import '@fontsource/inter/900-italic.css';
import '@fontsource/noto-sans-devanagari/700.css';
import '@fontsource/noto-sans-devanagari/900.css';
import '@fontsource/libre-caslon-text/400.css';
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {measureText} from '@remotion/layout-utils';
import {iconPath} from '../engine/icons.js';
import {STICKER_BY_ID} from '../engine/stickers.js';

const SANS = "Inter, 'Noto Sans Devanagari', sans-serif";
const SERIF = "'Libre Caslon Text', 'Noto Sans Devanagari', serif";
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
const ease = Easing.out(Easing.cubic);

// Hold the render until fonts are loaded, so measuring and drawing match.
function useFontsReady() {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('Loading fonts'));
  useEffect(() => {
    Promise.all([
      document.fonts.load('700 100px Inter', 'Aa'), document.fonts.load('italic 900 100px Inter', 'Aa'),
      document.fonts.load('italic 600 100px Inter', 'Aa'), document.fonts.load('900 100px Inter', 'Aa'),
      document.fonts.load('900 100px "Noto Sans Devanagari"', 'क'), document.fonts.load('700 100px "Noto Sans Devanagari"', 'क'),
      document.fonts.load('400 100px "Libre Caslon Text"', 'Aa'),
    ]).catch(() => {}).finally(() => { setReady(true); continueRender(handle); });
  }, [handle]);
  return ready;
}

const display = (t) => String(t).replace(/[,.;:।]+$/u, '');
const graphemes = (t) => [...new Intl.Segmenter('hi', {granularity: 'grapheme'}).segment(t)].map((g) => g.segment);

// Context passed to every card: stage size, timing and theme.
function useCard(scene) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const at = (w) => Math.max(0, Math.round((w.start - scene.start) * fps) - 3);
  return {frame, fps, at};
}

// Words fading in from a blur as they are spoken; the keyword gets the accent colour.
function Sentence({words, frame, at, color, accent, heroStyle}) {
  return words.map((w, i) => {
    const f = frame - at(w);
    return (
      <React.Fragment key={i}>
        {i > 0 ? ' ' : null}
        <span style={{display: 'inline-block', color: w.hero ? accent : color, opacity: interpolate(f, [0, 6], [0, 1], clamp),
          filter: `blur(${interpolate(f, [0, 7], [12, 0], clamp)}px)`, transform: `translateY(${interpolate(f, [0, 8], [0.3, 0], {...clamp, easing: ease})}em)`,
          ...(w.hero ? heroStyle : null)}}>{display(w.text)}</span>
      </React.Fragment>
    );
  });
}

// Big keyword revealed letter by letter, each letter un-blurring.
function HeroWord({text, frame, appear, color, size}) {
  const letters = graphemes(display(text));
  const f = frame - appear;
  return (
    <span style={{display: 'inline-block', whiteSpace: 'nowrap', fontSize: size, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.045em', lineHeight: 1,
      color, transform: `scale(${interpolate(f, [0, 12], [1.08, 1], {...clamp, easing: ease})})`, transformOrigin: 'left center', paddingRight: '0.08em'}}>
      {letters.map((l, i) => {
        const lf = f - i * 1.3;
        return <span key={i} style={{display: 'inline-block', opacity: interpolate(lf, [0, 6], [0, 1], clamp), filter: `blur(${interpolate(lf, [0, 8], [16, 0], clamp)}px)`,
          transform: `translateY(${interpolate(lf, [0, 9], [0.18, 0], {...clamp, easing: ease})}em)`}}>{l === ' ' ? ' ' : l}</span>;
      })}
    </span>
  );
}

function Art({src, size, frame, style, shadow}) {
  const {fps} = useVideoConfig();
  const p = spring({frame: frame - 4, fps, config: {damping: 12, stiffness: 160, mass: 0.7}});
  return <Img src={src} style={{width: size, height: size, objectFit: 'contain', opacity: Math.min(1, p * 2),
    transform: `translateY(${Math.sin(frame / 16) * size * 0.03}px) scale(${0.5 + 0.5 * p}) rotate(${(1 - p) * -12}deg)`,
    filter: shadow ? 'drop-shadow(0 18px 28px rgba(0,0,0,.22))' : undefined, ...style}} />;
}
const artSrc = (scene) => {
  if (scene.icon) return staticFile(iconPath(scene.icon));
  if (scene.sticker?.startsWith('lib:')) return staticFile(iconPath(scene.sticker));
  return scene.sticker && STICKER_BY_ID[scene.sticker] ? staticFile(STICKER_BY_ID[scene.sticker].src.replace(/^\//, '')) : '';
};

function LineCard({scene, theme, u, stage}) {
  const {frame, at} = useCard(scene);
  const accent = theme.accents[scene.accent || 0];
  const src = artSrc(scene);
  return (
    <AbsoluteFill style={{background: theme.bg, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: u * 2}}>
      {src ? <Art src={src} size={u * 15} frame={frame} shadow={false} /> : null}
      <div style={{maxWidth: stage.w * 0.82, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: u * 3.6, lineHeight: 1.25, letterSpacing: '-0.02em'}}>
        <Sentence words={scene.words} frame={frame} at={at} color={theme.ink} accent={accent} heroStyle={{fontWeight: 900}} />
      </div>
    </AbsoluteFill>
  );
}

function HeroCard({scene, theme, u, stage}) {
  const {frame, at} = useCard(scene);
  const h = scene.words.findIndex((w) => w.hero);
  const kicker = scene.words.slice(0, h), sub = scene.words.slice(h + 1), hero = scene.words[h];
  const accent = theme.accents[scene.accent || 0];
  const src = artSrc(scene);
  const artSize = u * 16;
  // With a visual, text and visual sit side by side, so the text gets less width.
  const maxW = stage.w * 0.84 - (src ? artSize + u * 2 : 0);
  const base = measureText({text: display(hero.text), fontFamily: SANS, fontSize: 100, fontWeight: '900', letterSpacing: '-0.045em'}).width * 1.08;
  const size = Math.min(u * 13, (maxW / base) * 100);
  return (
    <AbsoluteFill style={{background: theme.bg, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: u * 2}}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: maxW, fontFamily: SANS}}>
        {kicker.length ? <div style={{fontWeight: 700, fontSize: u * 3.2, lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: u * 0.2, maxWidth: maxW}}>
          <Sentence words={kicker} frame={frame} at={at} color={theme.ink} /></div> : null}
        <HeroWord text={hero.text} frame={frame} appear={at(hero)} color={accent} size={size} />
        {sub.length ? <div style={{fontWeight: 600, fontStyle: 'italic', fontSize: u * 2.4, lineHeight: 1.25, marginTop: u * 0.6, maxWidth: maxW}}>
          <Sentence words={sub} frame={frame} at={at} color={theme.ink} /></div> : null}
      </div>
      {src ? <Art src={src} size={artSize} frame={frame - at(hero)} shadow={false} /> : null}
    </AbsoluteFill>
  );
}

function StepCard({scene, theme, u}) {
  const {frame, fps, at} = useCard(scene);
  const label = scene.words.slice(2);
  const boxAt = label.length ? at(label[0]) : 0;
  const box = spring({frame: frame - boxAt, fps, config: {damping: 20, stiffness: 220}});
  return (
    <AbsoluteFill style={{background: theme.dark, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: u * 1.2}}>
      <div style={{fontFamily: SANS, fontWeight: 700, fontSize: u * 4.6, letterSpacing: '-0.02em'}}>
        <Sentence words={[{...scene.words[0], text: display(scene.words[0].text)}, {...scene.words[1], text: String(scene.num)}]} frame={frame} at={at} color="#FFFFFF" />
      </div>
      {label.length ? (
        <div style={{position: 'relative', padding: `${u * 0.35}px ${u * 1}px`, fontFamily: SERIF, fontSize: u * 2.6, color: '#111', maxWidth: '84%', textAlign: 'center'}}>
          <div style={{position: 'absolute', inset: 0, background: '#FFFFFF', transform: `scaleX(${box})`, transformOrigin: 'left center'}} />
          <div style={{position: 'relative'}}>
            {label.map((w, i) => <span key={i} style={{opacity: frame >= at(w) ? 1 : 0}}>{i > 0 ? ' ' : ''}{display(w.text)}</span>)}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
}

function CtaCard({scene, theme, u, stage}) {
  const {frame, fps, at} = useCard(scene);
  const [comment, keyword, ...rest] = scene.words;
  const pop = spring({frame: frame - at(comment), fps, config: {damping: 11, stiffness: 180, mass: 0.6}});
  const kf = frame - at(keyword);
  return (
    <AbsoluteFill style={{background: theme.dark, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: SANS}}>
        <div style={{alignSelf: 'flex-end', fontWeight: 700, fontSize: u * 3.4, color: '#FFFFFF', marginBottom: -u * 0.6, marginRight: u * 0.5,
          opacity: interpolate(kf, [0, 6], [0, 1], clamp), filter: `blur(${interpolate(kf, [0, 7], [10, 0], clamp)}px)`}}>“{scene.keyword}”</div>
        <div style={{fontWeight: 900, fontStyle: 'italic', fontSize: Math.min(u * 13, stage.w * 0.16), letterSpacing: '-0.045em', lineHeight: 1.05, color: theme.cta, paddingRight: '0.08em',
          opacity: Math.min(1, pop * 2), transform: `scale(${1.25 - 0.25 * pop})`}}>{display(comment.text).replace(/^./, (c) => c.toUpperCase())}</div>
        <div style={{fontWeight: 600, fontSize: u * 1.8, color: '#CFCFCF', marginTop: u * 0.4, maxWidth: stage.w * 0.8, textAlign: 'center'}}>
          {rest.map((w, i) => <span key={i} style={{opacity: frame >= at(w) ? 1 : 0}}>{i > 0 ? ' ' : ''}{display(w.text)}</span>)}
        </div>
      </div>
    </AbsoluteFill>
  );
}

const CARDS = {line: LineCard, hero: HeroCard, step: StepCard, cta: CtaCard};

export function Reel({project}) {
  const ready = useFontsReady();
  const {fps, width, height} = useVideoConfig();
  if (!project?.scenes) return null;
  const stage = project.stage || {x: 0, y: 0, w: width, h: height};
  // Size unit: landscape stages scale with width, portrait stages a little larger.
  const u = stage.w >= stage.h ? stage.w / 100 : stage.w / 62;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <div style={{position: 'absolute', left: stage.x, top: stage.y, width: stage.w, height: stage.h, overflow: 'hidden', background: project.theme.bg}}>
        {ready ? project.scenes.map((scene) => {
          // A "big word" card needs a keyword; without one it falls back to a sentence.
          const Card = scene.type === 'hero' && !scene.words.some((w) => w.hero) ? LineCard : CARDS[scene.type] || LineCard;
          const from = Math.round(scene.start * fps);
          return (
            <Sequence key={scene.id} from={from} durationInFrames={Math.max(1, Math.round(scene.end * fps) - from)}>
              <Card scene={scene} theme={project.theme} u={u} stage={stage} />
            </Sequence>
          );
        }) : null}
      </div>
      {project.audioSrc ? <Audio src={project.audioSrc} volume={project.audioVolume ?? 1} /> : null}
      {project.musicSrc ? <Audio src={project.musicSrc} volume={project.musicVolume ?? 0.15} loop /> : null}
    </AbsoluteFill>
  );
}
