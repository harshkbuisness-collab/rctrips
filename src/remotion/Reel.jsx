import '@fontsource/inter/900.css';
import '@fontsource/noto-sans-devanagari/900.css';
import React, {useEffect, useMemo, useState} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {measureText} from '@remotion/layout-utils';
import {iconPath} from '../engine/icons.js';
import {STICKER_BY_ID} from '../engine/stickers.js';

const FONT = "Inter, 'Noto Sans Devanagari', sans-serif";
const WEIGHT = 900;
const SPACING = -0.035; // em
const LINE = 1.02;
const BOX_PAD = 0.13; // em, left/right padding of the highlight box

// Hold the render until both fonts are loaded, so measuring and drawing match.
function useFontsReady() {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('Loading fonts'));
  useEffect(() => {
    Promise.all([
      document.fonts.load(`${WEIGHT} 100px Inter`, 'Aa'),
      document.fonts.load(`${WEIGHT} 100px "Noto Sans Devanagari"`, 'कअ'),
    ]).catch(() => {}).finally(() => { setReady(true); continueRender(handle); });
  }, [handle]);
  return ready;
}

const display = (t) => String(t).replace(/[,.;:।]+$/u, '');
const widthAt = (text, size) => measureText({text, fontFamily: FONT, fontSize: size, fontWeight: String(WEIGHT), letterSpacing: `${SPACING}em`}).width;

// Pick the biggest font size where the words fit the width in at most 4 lines.
function layoutScene(words, maxWidth, maxSize) {
  const base = 100;
  const space = widthAt('a a', base) - widthAt('aa', base);
  const widths = words.map((w) => widthAt(display(w.text), base) + (w.hero ? BOX_PAD * 2 * base : 0));
  for (let size = maxSize; size >= 70; size -= 6) {
    const k = size / base, lines = []; let cur = [], curW = 0, ok = true;
    words.forEach((w, i) => {
      const ww = widths[i] * k, add = cur.length ? space * k + ww : ww;
      if (cur.length && (curW + add > maxWidth || w.br)) { lines.push(cur); cur = [i]; curW = ww; }
      else { cur.push(i); curW += add; }
      if (ww > maxWidth) ok = false;
    });
    if (cur.length) lines.push(cur);
    if (ok && lines.length <= 4) return {size, lines};
  }
  return {size: 70, lines: words.map((_, i) => [i])};
}

function Word({word, appearAt, size, colors, frame, fps}) {
  const f = frame - appearAt;
  const p = spring({frame: f, fps, config: {damping: 15, stiffness: 210, mass: 0.6}});
  const opacity = interpolate(f, [0, 3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const y = (1 - p) * size * 0.28;
  if (!word.hero) {
    return <span style={{display: 'inline-block', opacity, transform: `translateY(${y}px)`, color: colors.fg}}>{display(word.text)}</span>;
  }
  const box = spring({frame: f, fps, config: {damping: 20, stiffness: 260, mass: 0.5}});
  return (
    <span style={{position: 'relative', display: 'inline-block', padding: `0 ${BOX_PAD}em`, opacity}}>
      <span style={{position: 'absolute', inset: '0.04em 0 -0.02em 0', background: colors.boxBg, transformOrigin: 'left center', transform: `scaleX(${box})`}} />
      <span style={{position: 'relative', display: 'inline-block', color: colors.boxFg, transform: `translateY(${y}px) scale(${0.86 + 0.14 * p})`}}>{display(word.text)}</span>
    </span>
  );
}

function Card({scene, project}) {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = project.theme;
  const hasArt = Boolean(scene.icon || scene.sticker);
  const margin = Math.round(width * 0.078);
  const maxWidth = width - margin * 2;
  const maxSize = Math.round(width * (hasArt ? 0.17 : 0.2));
  const {size, lines} = useMemo(() => layoutScene(scene.words, maxWidth, maxSize), [scene.words, maxWidth, maxSize]);
  const colors = scene.flash
    ? {bg: t.accent, fg: t.accentFg, boxBg: '#0B0B0B', boxFg: t.accentFg === '#FFFFFF' ? '#FFFFFF' : t.accent}
    : {bg: t.bg, fg: t.fg, boxBg: t.accent, boxFg: t.accentFg};
  const push = interpolate(frame, [0, 10], [1.035, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const centerY = hasArt ? height * 0.36 : height * 0.47;
  const appear = (w) => Math.max(0, Math.round((w.start - scene.start) * fps) - 2);
  const align = project.align === 'center' ? 'center' : 'left';
  return (
    <AbsoluteFill style={{background: colors.bg}}>
      <div style={{position: 'absolute', left: margin, width: maxWidth, top: centerY, transform: `translateY(-50%) scale(${push})`, transformOrigin: align === 'center' ? 'center' : 'left center',
        fontFamily: FONT, fontWeight: WEIGHT, fontSize: size, letterSpacing: `${SPACING}em`, lineHeight: LINE, textAlign: align}}>
        {lines.map((line, li) => (
          <div key={li} style={{whiteSpace: 'nowrap'}}>
            {line.map((wi, j) => (
              <React.Fragment key={wi}>
                {j > 0 ? ' ' : null}
                <Word word={scene.words[wi]} appearAt={appear(scene.words[wi])} size={size} colors={colors} frame={frame} fps={fps} />
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
      {scene.icon ? <Art src={staticFile(iconPath(scene.icon))} width={width} height={height} frame={frame} fps={fps} shadow /> : null}
      {!scene.icon && scene.sticker && STICKER_BY_ID[scene.sticker]
        ? <Art src={staticFile(STICKER_BY_ID[scene.sticker].src.replace(/^\//, ''))} width={width} height={height} frame={frame} fps={fps} /> : null}
    </AbsoluteFill>
  );
}

function Art({src, width, height, frame, fps, shadow}) {
  const p = spring({frame: frame - 4, fps, config: {damping: 12, stiffness: 160, mass: 0.7}});
  const size = Math.round(Math.min(width, height) * 0.4);
  const float = Math.sin(frame / 16) * size * 0.02;
  return (
    <Img src={src} style={{position: 'absolute', width: size, height: size, objectFit: 'contain', right: width * 0.07, bottom: height * 0.11,
      opacity: Math.min(1, p * 2), transform: `translateY(${float}px) scale(${0.5 + 0.5 * p}) rotate(${(1 - p) * -14}deg)`,
      filter: shadow ? 'drop-shadow(0 24px 36px rgba(0,0,0,.35))' : undefined}} />
  );
}

export function Reel({project}) {
  const ready = useFontsReady();
  const {fps} = useVideoConfig();
  if (!project?.scenes) return null;
  return (
    <AbsoluteFill style={{background: project.theme.bg}}>
      {ready ? project.scenes.map((scene) => {
        const from = Math.round(scene.start * fps);
        const dur = Math.max(1, Math.round(scene.end * fps) - from);
        return <Sequence key={scene.id} from={from} durationInFrames={dur}><Card scene={scene} project={project} /></Sequence>;
      }) : null}
      {project.audioSrc ? <Audio src={project.audioSrc} volume={project.audioVolume ?? 1} /> : null}
      {project.musicSrc ? <Audio src={project.musicSrc} volume={project.musicVolume ?? 0.15} loop /> : null}
    </AbsoluteFill>
  );
}
