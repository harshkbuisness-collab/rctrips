// Meme / reaction stickers picked from the emotion of a scene's words.
import STICKERS from '../stickerData.js';

export {STICKERS};
export const STICKER_BY_ID = Object.fromEntries(STICKERS.map((s) => [s.id, s]));

// [trigger words (English, Hinglish, Hindi), wanted sticker tags]
const MOODS = [
  ['why kya kaise kyun really seriously confused samajh क्या क्यों कैसे', ['question', 'confused', 'thinking', 'suspicious']],
  ['wrong galat mistake fail weak problem nahi nhi ignore avoid never गलत गलती नहीं कभी', ['judging', 'frustrated', 'negative', 'sideeye']],
  ['success best great finally win better perfect sahi सही बेस्ट', ['approval', 'positive', 'success', 'happy', 'thumbsup']],
  ['money paise paisa price budget earn income revenue पैसा पैसे कमाई', ['money', 'finance']],
  ['comment follow save share dm send कमेंट फॉलो सेव शेयर', ['cta', 'approval', 'pointing']],
  ['thanks thank please shukriya धन्यवाद', ['thanks', 'please', 'prayer', 'love']],
  ['shock shocking crazy wow unbelievable secret सीक्रेट', ['shocked', 'surprised']],
  ['sad tired boring bore down drop', ['sad', 'tired', 'crying']],
];

const key = (w) => String(w).toLowerCase().replace(/[^\p{L}\p{M}\p{N}]/gu, '');
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

export function matchSticker(words, seed = 0) {
  const keys = new Set(words.map((w) => key(w.text)));
  for (const [triggers, tags] of MOODS) {
    if (!triggers.split(' ').some((t) => keys.has(t))) continue;
    const pool = STICKERS.filter((s) => s.autoEligible !== false && s.tags?.some((t) => tags.includes(t)));
    if (pool.length) return pool[hash(`${seed}|${[...keys].join(' ')}`) % pool.length].id;
  }
  return '';
}
