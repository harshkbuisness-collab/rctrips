// Converts an SRT (word-level or sentence-level) or an existing word JSON
// into words.json: {"words":[{"text","start","end"}]}.
// Sentence-level cues are split into words, timed by character length.
// usage: npm run srt -- voice.srt public/projects/<name>/words.json
import fs from 'node:fs';

const toSec = (ts) => {
  const m = ts.trim().match(/(\d+):(\d+):(\d+)[,.](\d+)/);
  if (!m) throw new Error(`bad timestamp: ${ts}`);
  return +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 10 ** m[4].length;
};
const r2 = (n) => Math.round(n * 1000) / 1000;

export function srtToWords(srt) {
  const words = [];
  for (const block of srt.replace(/\r/g, '').split(/\n\s*\n/)) {
    const lines = block.trim().split('\n');
    const timeLine = lines.findIndex((l) => l.includes('-->'));
    if (timeLine < 0) continue;
    const [a, b] = lines[timeLine].split('-->');
    const start = toSec(a), end = toSec(b);
    const text = lines.slice(timeLine + 1).join(' ').replace(/<[^>]+>/g, '').trim();
    const parts = text.split(/\s+/).filter(Boolean);
    if (!parts.length) continue;
    const weights = parts.map((p) => p.length + 2);
    const total = weights.reduce((x, y) => x + y, 0);
    let cursor = start;
    parts.forEach((p, i) => {
      const dur = ((end - start) * weights[i]) / total;
      words.push({text: p, start: r2(cursor), end: r2(cursor + dur)});
      cursor += dur;
    });
  }
  return words;
}

if (process.argv[1]?.endsWith('srt-to-words.mjs')) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) {
    console.log('usage: npm run srt -- input.srt|input.json output/words.json');
    process.exit(1);
  }
  const raw = fs.readFileSync(input, 'utf8');
  let words;
  if (input.endsWith('.json')) {
    const j = JSON.parse(raw);
    words = (Array.isArray(j) ? j : j.words).map((w) => ({text: w.display ?? w.text ?? w.word, start: +w.start, end: +w.end}));
  } else words = srtToWords(raw);
  fs.writeFileSync(output, JSON.stringify({words}, null, 1));
  console.log(`${words.length} words → ${output}`);
}
