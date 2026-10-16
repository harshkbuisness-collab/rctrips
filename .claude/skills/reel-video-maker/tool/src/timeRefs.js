// Lets a timeline give times as words from the script instead of seconds:
//   "lift your legs"        start of that phrase
//   "lift your legs|end"    end of its last word
//   "lift your legs+0.3"    with an offset in seconds (also -0.2)
//   "number#2"              2nd time the phrase is spoken
//   "start" / "end"         0 / end of the voiceover
// The project loader replaces these with seconds before validation.
import {numberWords} from './mergeWords.js';

const norm = (w) => String(w).toLowerCase().replace(/[^\p{L}\p{N}']+/gu, '').replace(/'/g, '');
// a word as the sounds it stands for: "10" -> ["ten"], "24" -> ["twenty", "four"], "Push" -> ["push"],
// so a phrase matches whether the script/SRT wrote a number in digits or in words
const spokenOf = (w) => {
  const n = norm(w);
  return /^\d{1,3}$/.test(n) ? numberWords(Number(n)) : n ? [n] : [];
};

export function makeTimeResolver(words) {
  // expanded word list + which original word each piece belongs to
  const tokens = [], owner = [];
  words.forEach((w, i) => spokenOf(w.text).forEach((t) => { tokens.push(t); owner.push(i); }));
  const audioEnd = words.length ? words[words.length - 1].end + 0.4 : 0;
  return (value, where, errors) => {
    if (typeof value === 'number' || value === undefined || value === null) return value;
    const raw = String(value).trim();
    if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
    const m = raw.match(/^(.*?)(\|end)?(#\d+)?\s*([+-]\s*\d+(?:\.\d+)?)?$/i);
    let [, phrase, endFlag, nth, offset] = m;
    offset = offset ? Number(offset.replace(/\s+/g, '')) : 0;
    phrase = phrase.trim();
    if (/^start$/i.test(phrase)) return Math.max(0, offset);
    if (/^end$/i.test(phrase)) return audioEnd + offset;
    const want = phrase.split(/\s+/).flatMap(spokenOf);
    if (!want.length) {
      errors.push(`${where}: empty time "${raw}"`);
      return 0;
    }
    const hits = [];
    for (let i = 0; i + want.length <= tokens.length; i++) {
      if (want.every((w, k) => tokens[i + k] === w)) hits.push(i);
    }
    if (!hits.length) {
      errors.push(`${where}: "${phrase}" is not in the script. Use words exactly as they appear in the script.`);
      return 0;
    }
    const n = nth ? Number(nth.slice(1)) : 1;
    if (!nth && hits.length > 1) {
      errors.push(`${where}: "${phrase}" is spoken ${hits.length} times. Use a longer phrase, or "${phrase}#2" for the 2nd time.`);
    }
    if (n < 1 || n > hits.length) {
      errors.push(`${where}: "${phrase}" is spoken ${hits.length} times; occurrence #${n} does not exist.`);
      return 0;
    }
    const i = hits[n - 1];
    const t = endFlag ? words[owner[i + want.length - 1]].end : words[owner[i]].start;
    return Math.max(0, Math.round((t + offset) * 1000) / 1000);
  };
}

// Replaces every time field in a raw timeline. Returns error messages.
export function resolveTimeline(raw, words) {
  const errors = [];
  const r = makeTimeResolver(words);
  if (raw.duration !== undefined) raw.duration = r(raw.duration, 'duration', errors);
  (raw.scenes || []).forEach((s, i) => {
    const w = `scenes[${i}]`;
    s.start = r(s.start, `${w}.start`, errors);
    if (s.end !== undefined) s.end = r(s.end, `${w}.end`, errors);
    (s.camera || []).forEach((k, j) => (k.at = r(k.at, `${w}.camera[${j}].at`, errors)));
    (s.shakes || []).forEach((k, j) => (k.at = r(k.at, `${w}.shakes[${j}].at`, errors)));
    (s.layers || []).forEach((l, j) => {
      const lw = `${w}.layers[${j}]`;
      if (l.at !== undefined) l.at = r(l.at, `${lw}.at`, errors);
      if (l.until !== undefined) l.until = r(l.until, `${lw}.until`, errors);
      if (l.strike !== undefined) l.strike = r(l.strike, `${lw}.strike`, errors);
      if (l.marker !== undefined) l.marker = r(l.marker, `${lw}.marker`, errors);
      // list items of motion graphics (checklist / bars / chat) and the two sides of a versus
      if (l.revealAt !== undefined) l.revealAt = r(l.revealAt, `${lw}.revealAt`, errors);
      if (l.fromAt !== undefined) l.fromAt = r(l.fromAt, `${lw}.fromAt`, errors);
      if (l.toAt !== undefined) l.toAt = r(l.toAt, `${lw}.toAt`, errors);
      for (const key of ['items', 'messages', 'steps', 'lines']) (l[key] || []).forEach((it, k) => { if (it.at !== undefined) it.at = r(it.at, `${lw}.${key}[${k}].at`, errors); });
      for (const key of ['left', 'right']) if (l[key] && typeof l[key] === 'object' && l[key].at !== undefined) l[key].at = r(l[key].at, `${lw}.${key}.at`, errors);
      (l.frames || []).forEach((f, k) => (f.at = r(f.at, `${lw}.frames[${k}].at`, errors)));
      (l.cells || []).forEach((c, k) => { if (c.at !== undefined) c.at = r(c.at, `${lw}.cells[${k}].at`, errors); });
    });
  });
  (raw.sfx || []).forEach((s, i) => (s.at = r(s.at, `sfx[${i}].at`, errors)));
  if (raw.captions?.bottom) raw.captions.bottom = raw.captions.bottom.map(([a, b], i) => [r(a, `captions.bottom[${i}]`, errors), r(b, `captions.bottom[${i}]`, errors)]);
  if (raw.captions?.hide) raw.captions.hide = raw.captions.hide.map(([a, b], i) => [r(a, `captions.hide[${i}]`, errors), r(b, `captions.hide[${i}]`, errors)]);
  return errors;
}
