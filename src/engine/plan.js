// Turns word-timing JSON into a reel plan: scenes, hero words, icons, stickers, colour flashes.
import {pickHero, isFiller} from './words.js';
import {matchIcon} from './icons.js';
import {matchSticker} from './stickers.js';

export const THEMES = [
  {id: 'dark-red', label: 'Dark · Red', bg: '#0B0B0B', fg: '#FFFFFF', accent: '#E8202A', accentFg: '#FFFFFF'},
  {id: 'dark-yellow', label: 'Dark · Yellow', bg: '#0B0B0B', fg: '#FFFFFF', accent: '#FFD60A', accentFg: '#0B0B0B'},
  {id: 'dark-pink', label: 'Dark · Pink', bg: '#0B0B0B', fg: '#FFFFFF', accent: '#F45DB8', accentFg: '#FFFFFF'},
  {id: 'dark-purple', label: 'Dark · Purple', bg: '#0B0B0B', fg: '#FFFFFF', accent: '#7B3FF2', accentFg: '#FFFFFF'},
  {id: 'dark-blue', label: 'Dark · Blue', bg: '#0B0B0B', fg: '#FFFFFF', accent: '#1F6BFF', accentFg: '#FFFFFF'},
  {id: 'light-orange', label: 'Light · Orange', bg: '#F6F5F2', fg: '#0B0B0B', accent: '#FF5A1F', accentFg: '#FFFFFF'},
  {id: 'light-red', label: 'Light · Red', bg: '#F6F5F2', fg: '#0B0B0B', accent: '#E8202A', accentFg: '#FFFFFF'},
  {id: 'light-yellow', label: 'Light · Yellow', bg: '#F6F5F2', fg: '#0B0B0B', accent: '#FFD60A', accentFg: '#0B0B0B'},
  {id: 'light-green', label: 'Light · Green', bg: '#F6F5F2', fg: '#0B0B0B', accent: '#12A150', accentFg: '#FFFFFF'},
  {id: 'light-purple', label: 'Light · Purple', bg: '#F6F5F2', fg: '#0B0B0B', accent: '#6A2BF0', accentFg: '#FFFFFF'},
];
export const getTheme = (id) => THEMES.find((t) => t.id === id) || THEMES[0];

export const FORMATS = {
  '9:16': {width: 1080, height: 1920},
  '4:5': {width: 1080, height: 1350},
  '1:1': {width: 1080, height: 1080},
};

export const DEFAULT_SETTINGS = {
  themeId: 'dark-red', format: '9:16', align: 'left', icons: 'normal', stickers: 'off', flashes: true, seed: 0,
};

// Accepts {words:[{word|text|display,start,end}]} (seconds). Returns clean words + duration.
export function parseTiming(raw) {
  const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const list = Array.isArray(obj) ? obj : obj?.words;
  if (!Array.isArray(list) || !list.length) throw new Error('JSON must contain a non-empty words[] array');
  const words = list.map((w) => ({
    text: String(w.display ?? w.word ?? w.text ?? '').trim(),
    start: Number(w.start), end: Number(w.end),
  })).filter((w) => w.text && Number.isFinite(w.start) && Number.isFinite(w.end))
    .sort((a, b) => a.start - b.start);
  if (!words.length) throw new Error('No valid words with start/end found');
  return {words, duration: Math.max(...words.map((w) => w.end))};
}

// Group words into short phrases (one card each): break on sentence ends,
// pauses and length, and never leave a card that is only filler words.
function groupWords(words) {
  const groups = []; let cur = [];
  const flush = () => { if (cur.length) groups.push(cur); cur = []; };
  for (const w of words) {
    const last = cur[cur.length - 1] || groups[groups.length - 1]?.at(-1);
    const gap = last ? w.start - last.end : 0;
    const span = cur.length ? w.end - cur[0].start : 0;
    // A lone sentence-ending word joins the previous card instead of starting a new one.
    if (!cur.length && /[.!?।]$/.test(w.text) && groups.length && groups[groups.length - 1].length < 6 && gap < 0.45) {
      groups[groups.length - 1].push(w); continue;
    }
    if (cur.length && (gap > 0.45 || cur.length >= 5 || span > 2.4)) flush();
    cur.push(w);
    if (/[.!?।]$/.test(w.text) && cur.length >= 2) flush();
  }
  flush();
  const out = [];
  for (const g of groups) {
    const prev = out[out.length - 1];
    const weak = g.length === 1 || g.every((w) => isFiller(w.text));
    if (weak && prev && prev.length < 6) prev.push(...g); else out.push(g);
  }
  return out;
}

const FREQ = {off: 0, light: 3, normal: 2};

export function buildScenes(words, settings = {}) {
  const s = {...DEFAULT_SETTINGS, ...settings};
  const groups = groupWords(words);
  let lastIcon = -9, lastSticker = -9, lastFlash = -9;
  return groups.map((g, i) => {
    const sceneWords = g.map((w) => ({text: w.text, start: w.start, end: w.end}));
    const hero = pickHero(sceneWords);
    if (hero >= 0) sceneWords[hero].hero = true;
    // Cards run back to back: each ends when the next one starts (hard cuts, no overlap).
    const start = i === 0 ? 0 : Math.max(0, g[0].start - 0.05);
    const scene = {id: `s${i + 1}`, start, words: sceneWords, icon: '', sticker: '', flash: false};
    if (FREQ[s.icons] && i - lastIcon >= FREQ[s.icons]) {
      scene.icon = matchIcon(sceneWords, hero);
      if (scene.icon) lastIcon = i;
    }
    if (FREQ[s.stickers] && !scene.icon && i - lastSticker >= FREQ[s.stickers] + 1) {
      scene.sticker = matchSticker(sceneWords, s.seed);
      if (scene.sticker) lastSticker = i;
    }
    // A full accent-colour card for short, punchy lines — at most every 5th card.
    if (s.flashes && hero >= 0 && g.length <= 3 && i - lastFlash >= 5 && i > 0 && !scene.icon) {
      scene.flash = true; lastFlash = i;
    }
    return scene;
  }).map((scene, i, all) => ({...scene, end: all[i + 1]?.start ?? scene.words[scene.words.length - 1].end + 0.6}));
}

export function buildProject({words, duration = 0, settings = {}, media = {}}) {
  const s = {...DEFAULT_SETTINGS, ...settings};
  const scenes = buildScenes(words, s);
  const end = Math.max(duration, scenes.length ? scenes[scenes.length - 1].end : 1);
  return {
    version: 2, fps: 30, ...FORMATS[s.format], durationSec: Number(end.toFixed(3)),
    settings: s, theme: getTheme(s.themeId), align: s.align, scenes,
    audioSrc: '', audioVolume: 1, musicSrc: '', musicVolume: 0.15, ...media,
  };
}
