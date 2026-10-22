// Meme / reaction stickers picked from the emotion of a scene's words.
import STICKERS from '../stickerData.js';

export {STICKERS};
export const STICKER_BY_ID = Object.fromEntries(STICKERS.map((s) => [s.id, s]));

// [trigger words (English, Hinglish, Hindi), wanted sticker tags]
const MOODS = [
  ['why kya kaise kyun really seriously confused samajh what क्या क्यों कैसे', ['question', 'confused', 'curious', 'shrug']],
  ['wrong galat mistake fail weak problem nahi nhi ignore avoid never stop गलत गलती नहीं कभी', ['facepalm', 'judging', 'frustrated', 'negative']],
  ['success best great finally win better perfect sahi done approved सही बेस्ट', ['thumbsup', 'approval', 'success']],
  ['money paise paisa price budget earn income revenue rich cash पैसा पैसे कमाई', ['money', 'finance']],
  ['broke poor expensive costly mehenga महंगा', ['poor', 'budget']],
  ['comment follow save share dm send link कमेंट फॉलो सेव शेयर', ['cta', 'pointing']],
  ['thanks thank please shukriya plz धन्यवाद', ['thanks', 'please', 'prayer']],
  ['shock shocking crazy wow unbelievable secret insane omg सीक्रेट', ['shocked', 'surprised', 'screaming']],
  ['sad cry crying hurt dukh दुख', ['sad', 'crying']],
  ['tired boring bore sleep lazy thak', ['tired', 'bored', 'yawn']],
  ['angry hate gussa annoying irritating गुस्सा', ['angry', 'annoyed', 'rude']],
  ['wait time seconds minute ruko ruk later रुको', ['wait', 'loading']],
  ['cool smart pro easy simple', ['cool', 'confident']],
  ['funny lol joke haha mazaak', ['funny', 'laughing', 'silly']],
  ['love cute pyaar प्यार', ['love', 'cute', 'shy']],
  ['coffee chai morning relax', ['coffee', 'calm']],
];

const key = (w) => String(w).toLowerCase().replace(/[^\p{L}\p{M}\p{N}]/gu, '');
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

// family: 'cat' for cat stickers only, or '' for any sticker.
export function matchSticker(words, seed = 0, family = '') {
  const keys = new Set(words.map((w) => key(w.text)));
  for (const [triggers, tags] of MOODS) {
    if (!triggers.split(' ').some((t) => keys.has(t))) continue;
    const pool = STICKERS.filter((s) => s.autoEligible !== false && (!family || s.family === family) && s.tags?.some((t) => tags.includes(t)));
    if (pool.length) return pool[hash(`${seed}|${[...keys].join(' ')}`) % pool.length].id;
  }
  return '';
}
