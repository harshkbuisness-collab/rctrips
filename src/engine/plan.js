// Turns word-timing JSON into a reel plan of typed cards:
//   line — one short sentence, keyword coloured
//   hero — small kicker, one huge keyword, small sub line
//   step — black card, "Step N" + boxed label
//   cta  — black card, huge "Comment" + “keyword” + sub line
import {pickHero, heroScore, isFiller, norm} from './words.js';
import {matchIcon} from './icons.js';
import {matchObject, matchReaction} from './library.js';
import {matchSticker} from './stickers.js';
import {getLook} from './looks.js';

export const THEMES = [
  {id: 'classic', label: 'Classic · Red / Blue', bg: '#FAFAFA', ink: '#111111', dark: '#050505', accents: ['#E5262A', '#1F6BFF'], cta: '#FFE600'},
  {id: 'red', label: 'Red', bg: '#FAFAFA', ink: '#111111', dark: '#050505', accents: ['#E5262A', '#E5262A'], cta: '#E5262A'},
  {id: 'blue', label: 'Blue', bg: '#FAFAFA', ink: '#111111', dark: '#050505', accents: ['#1F6BFF', '#1F6BFF'], cta: '#FFE600'},
  {id: 'orange', label: 'Orange', bg: '#FAFAFA', ink: '#111111', dark: '#050505', accents: ['#FF5A1F', '#111111'], cta: '#FF5A1F'},
  {id: 'purple', label: 'Purple', bg: '#FAFAFA', ink: '#111111', dark: '#050505', accents: ['#6A2BF0', '#E5262A'], cta: '#FFE600'},
];
export const getTheme = (id) => THEMES.find((t) => t.id === id) || THEMES[0];

// Output size, plus the "stage" rectangle the cards are drawn in.
export const FORMATS = {
  '9:16': {label: '9:16 Reel', width: 1080, height: 1920, stage: {x: 0, y: 0, w: 1080, h: 1920}},
  '16:9': {label: '16:9 Landscape', width: 1920, height: 1080, stage: {x: 0, y: 0, w: 1920, h: 1080}},
  '16:9-in-9:16': {label: '16:9 inside 9:16', width: 1080, height: 1920, stage: {x: 0, y: 656, w: 1080, h: 608}},
};

export const DEFAULT_SETTINGS = {themeId: 'classic', format: '16:9-in-9:16', icons: 'normal', stickers: 'light', stickerStyle: 'cats', lookId: 'editorial', seed: 0};

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

const ENDS = /[.!?।]$/;

// Group words into short phrases: break on sentence ends, pauses and length.
function groupWords(words) {
  const groups = []; let cur = [];
  const flush = () => { if (cur.length) groups.push(cur); cur = []; };
  for (const w of words) {
    const last = cur[cur.length - 1] || groups[groups.length - 1]?.at(-1);
    const gap = last ? w.start - last.end : 0;
    const span = cur.length ? w.end - cur[0].start : 0;
    if (!cur.length && ENDS.test(w.text) && groups.length && groups[groups.length - 1].length < 9 && gap < 0.6) {
      groups[groups.length - 1].push(w); continue; // lone sentence-ending word joins the previous card
    }
    if (cur.length && (gap > 0.45 || (cur.length >= 7 && !ENDS.test(w.text)) || span > 3.2)) flush();
    cur.push(w);
    if (ENDS.test(w.text) && cur.length >= 2) flush();
  }
  flush();
  const out = [];
  for (const g of groups) {
    const prev = out[out.length - 1];
    if ((g.length === 1 || g.every((w) => isFiller(w.text))) && prev && prev.length < 7) prev.push(...g); else out.push(g);
  }
  return out;
}

const STEP = new Set(['step', 'स्टेप', 'tip', 'टिप']);
const NUM = {one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, ek: 1, do: 2, teen: 3, char: 4, chaar: 4, paanch: 5, 'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5};
const stepNumber = (w) => { const n = norm(w?.text || ''); return /^\d+$/.test(n) ? Number(n) : NUM[n] || 0; };
const COMMENT = new Set(['comment', 'comments', 'कमेंट']);

const FREQ = {off: 0, light: 3, normal: 2};
const libRef = (id) => (id ? `lib:${id}` : '');

export function buildScenes(words, settings = {}) {
  const s = {...DEFAULT_SETTINGS, ...settings};
  const groups = groupWords(words);
  const cards = [];
  const plain = (ws) => ws.length && cards.push({type: 'line', words: ws});

  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const k = g.findIndex((w, j) => STEP.has(norm(w.text)) && stepNumber(g[j + 1]));
    if (k >= 0) {
      plain(g.slice(0, k));
      let label = g.slice(k + 2);
      if (label.length < 2 && groups[i + 1]) label = label.concat(groups[++i]);
      cards.push({type: 'step', num: stepNumber(g[k + 1]), words: [g[k], g[k + 1], ...label]});
      continue;
    }
    const c = g.findIndex((w) => COMMENT.has(norm(w.text)));
    if (c >= 0 && g[c + 1]) {
      plain(g.slice(0, c));
      // The call to action takes the rest of the script.
      cards.push({type: 'cta', keyword: g[c + 1].text.replace(/[^\p{L}\p{M}\p{N}]/gu, ''), words: g.slice(c).concat(...groups.slice(i + 1))});
      break;
    }
    cards.push({type: 'line', words: g});
  }

  let lastHero = -9, lastIcon = -9, lastSticker = -9, color = 0;
  return cards.map((card, i) => {
    const ws = card.words.map((w) => ({text: w.text, start: w.start, end: w.end}));
    const scene = {id: `s${i + 1}`, ...card, words: ws, icon: '', sticker: ''};
    if (card.type === 'line') {
      const h = pickHero(ws);
      if (h >= 0) {
        ws[h].hero = true;
        // Strong keywords (numbers, power words) get their own big hero card.
        if (heroScore(ws[h].text) >= 6 && i - lastHero >= 2 - (/\d/.test(ws[h].text) ? 1 : 0)) { scene.type = 'hero'; lastHero = i; }
        scene.accent = color++ % 2;
      }
      if (FREQ[s.icons] && i - lastIcon >= FREQ[s.icons]) { scene.icon = libRef(matchObject(ws, h, s.seed)) || matchIcon(ws, h); if (scene.icon) lastIcon = i; }
      if (FREQ[s.stickers] && !scene.icon && i - lastSticker >= FREQ[s.stickers] + 1) {
        scene.sticker = s.stickerStyle === 'mascot' ? libRef(matchReaction(ws, s.seed)) : matchSticker(ws, s.seed, 'cat'); if (scene.sticker) lastSticker = i;
      }
    }
    scene.start = i === 0 ? 0 : Math.max(0, ws[0].start - 0.05);
    return scene;
  }).map((scene, i, all) => ({...scene, end: all[i + 1]?.start ?? scene.words[scene.words.length - 1].end + 0.8}));
}

export function buildProject({words, duration = 0, settings = {}, media = {}}) {
  const s = {...DEFAULT_SETTINGS, ...settings};
  const scenes = buildScenes(words, s);
  const end = Math.max(duration, scenes.length ? scenes[scenes.length - 1].end : 1);
  const {width, height, stage} = FORMATS[s.format] || FORMATS['9:16'];
  return {
    version: 2, fps: 30, width, height, stage, durationSec: Number(end.toFixed(3)),
    settings: s, theme: getTheme(s.themeId), look: getLook(s.lookId), scenes,
    audioSrc: '', audioVolume: 1, musicSrc: '', musicVolume: 0.05, ...media,
  };
}
