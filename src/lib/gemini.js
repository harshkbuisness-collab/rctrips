// Server-side Gemini helpers: creator-style TTS, word timings for that audio, and JSON answers.
// Needs GEMINI_API_KEY (Vercel Environment Variables, or .env.local for local mode).

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
export const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
export const TEXT_MODEL = 'gemini-2.5-flash';
const RATE = 24000; // Gemini TTS returns 16-bit mono PCM at 24 kHz

// Voice personas, the same prompts as the Gemini voiceover app.
const CREATOR = [
  'Perform in a natural, modern content-creator style, exactly like top creators speak in engaging YouTube and Reels videos',
  'Delivery: Deeply natural, conversational, expressive, human, and authentic—NEVER robotic, monotone, or like a typical stiff AI voiceover',
  "Opening Hook: Deliver the first sentence with high interest, punchy energy, and curiosity to immediately grab the viewer's attention and stop their scroll",
  'Storytelling & Pacing: Keep the viewer locked in throughout with dynamic energy, natural pitch inflection, micro-pauses for anticipation, and punchy emphasis on key words',
  'Warmth & Charisma: Speak directly to the listener like an inspiring, relatable friend with confident magnetism',
  'Language Flow: Effortless, natural pronunciation with seamless blend of English and Hinglish expressions without stiffness',
];
export const GEMINI_VOICES = {
  ContentCreator: {voice: 'Puck', style: CREATOR},
  CreatorFemale: {voice: 'Aoede', style: CREATOR},
  IndianCreatorFemale: {voice: 'Aoede', style: [
    'Speaker Persona: Charismatic, modern Indian female content creator in her early 20s (popular Instagram Reels, YouTube Shorts, and viral video creator style)',
    'Accent & Cadence: Natural contemporary Indian English accent with authentic Indian rhythm, pitch inflection, and vibrant cadence—completely genuine, relatable, and human, NEVER stereotypical, NEVER robotic or monotone',
    "Opening Hook: Deliver the opening sentence with high curiosity, magnetic enthusiasm, and punchiness to immediately grab the viewer's attention and stop their scroll",
    'Pacing & Storytelling: Dynamic pacing with punchy emphasis on key words, micro-pauses for anticipation, and warm, expressive conversational flow',
    "Language & Pronunciation: Flawless, natural delivery of English and Hinglish expressions (e.g., 'Reels', 'Views', 'Followers', 'Content', 'Problem', 'Agar', 'Aapki', 'Bhai', 'Dosto')",
    'Relatability: Speak directly to the listener like an inspiring, savvy digital friend sharing valuable insights with effortless confidence',
  ]},
  TheThinker: {voice: 'Zephyr', style: [
    'Perform as a calm, natural, young male voice in his early 20s',
    'Style: Very human, not robotic, conversational, diary-like, late-night thoughts',
    'Emotion: Honest, reflective, and slightly vulnerable',
    'Natural mix of English and Hinglish where applicable',
  ]},
  Fenrir: {voice: 'Fenrir', style: ['Powerful, strong and heroic superhero voice', 'Natural mix of English and Hinglish where applicable']},
  Charon: {voice: 'Charon', style: ['Deep, calm and authoritative voice', 'Natural mix of English and Hinglish where applicable']},
};

function key() {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new Error('GEMINI_API_KEY is not set. Add it in Vercel → Settings → Environment Variables (or .env.local), then redeploy.');
  return k;
}

async function generate(model, body) {
  const res = await fetch(`${BASE}/${model}:generateContent`, {
    method: 'POST', headers: {'Content-Type': 'application/json', 'x-goog-api-key': key()}, body: JSON.stringify(body),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Gemini error (${res.status}): ${d.error?.message || 'request failed'}`);
  return d;
}

// Script → 16-bit PCM (Buffer, 24 kHz mono).
export async function geminiSpeech(text, persona = 'ContentCreator', speed = 0) {
  const p = GEMINI_VOICES[persona] || GEMINI_VOICES.ContentCreator;
  const style = [...p.style];
  if (speed) style.push(`speak about ${Math.abs(speed)}% ${speed > 0 ? 'faster' : 'slower'} than normal`);
  const d = await generate(TTS_MODEL, {
    contents: [{parts: [{text: `[Instructions: ${style.join(', ')}.] ${text}`}]}],
    generationConfig: {responseModalities: ['AUDIO'], speechConfig: {voiceConfig: {prebuiltVoiceConfig: {voiceName: p.voice}}}},
  });
  const data = d.candidates?.[0]?.content?.parts?.find((x) => x.inlineData)?.inlineData?.data;
  if (!data) throw new Error('Gemini returned no audio. Try again or shorten the script.');
  return Buffer.from(data, 'base64');
}

// Halve the size of long voices (24 kHz → 16 kHz) so the response stays under Vercel's 4.5 MB limit.
export function shrinkPcm(pcm, from = RATE, to = 16000) {
  const src = new Int16Array(pcm.buffer, pcm.byteOffset, pcm.length >> 1);
  const n = Math.floor(src.length * to / from), out = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const x = i * from / to, j = Math.floor(x), f = x - j;
    out[i] = Math.round(src[j] * (1 - f) + (src[j + 1] ?? src[j]) * f);
  }
  return Buffer.from(out.buffer);
}

export function wav(pcm, rate = RATE) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

// Stretches of speech (seconds) found from loudness in 20 ms frames.
export function speechIntervals(pcm, rate = RATE) {
  const s = new Int16Array(pcm.buffer, pcm.byteOffset, pcm.length >> 1);
  const frame = Math.round(rate * 0.02), rms = [];
  for (let i = 0; i + frame <= s.length; i += frame) {
    let sum = 0; for (let j = i; j < i + frame; j++) sum += s[j] * s[j];
    rms.push(Math.sqrt(sum / frame));
  }
  const loud = [...rms].sort((a, b) => a - b)[Math.floor(rms.length * 0.9)] || 1;
  const on = rms.map((v) => v > loud * 0.08);
  const out = []; let start = -1, quiet = 0;
  on.forEach((v, i) => {
    if (v) { if (start < 0) start = i; quiet = 0; }
    else if (start >= 0 && ++quiet >= 6) { out.push({start: start * 0.02, end: (i - quiet + 1) * 0.02}); start = -1; quiet = 0; }
  });
  if (start >= 0) out.push({start: start * 0.02, end: on.length * 0.02});
  return out.filter((x) => x.end - x.start > 0.06);
}

// Fallback timing: spread the script's words over the speech stretches by letter count.
export function spreadWords(words, intervals, duration) {
  const spans = intervals.length ? intervals : [{start: 0, end: duration}];
  const total = spans.reduce((a, x) => a + x.end - x.start, 0);
  const weight = words.map((w) => w.replace(/[^\p{L}\p{N}]/gu, '').length + 1);
  const all = weight.reduce((a, b) => a + b, 0);
  let k = 0, used = 0; const out = [];
  for (let i = 0; i < words.length; i++) {
    let len = total * weight[i] / all;
    const parts = [];
    while (len > 1e-6) {
      const room = spans[k].end - (spans[k].start + used);
      if (len <= room || k === spans.length - 1) { parts.push([spans[k].start + used, spans[k].start + used + len]); used += len; len = 0; }
      else { parts.push([spans[k].start + used, spans[k].end]); len -= room; k++; used = 0; }
    }
    out.push({text: words[i], start: +parts[0][0].toFixed(3), end: +parts[parts.length - 1][1].toFixed(3)});
  }
  return out;
}

const clean = (w) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

// Word timings for spoken audio: Gemini listens with the script as reference; the script's own
// spelling is kept. If Gemini's answer does not line up with the script, fall back to spreadWords.
export async function wordTimings(pcm, script, rate = RATE) {
  const words = script.split(/\s+/).filter(Boolean);
  const duration = pcm.length / 2 / rate;
  const intervals = speechIntervals(pcm, rate);
  try {
    const d = await generate(TEXT_MODEL, {
      contents: [{parts: [
        {inlineData: {mimeType: 'audio/wav', data: wav(pcm, rate).toString('base64')}},
        {text: `Give the start and end time in seconds of every spoken word in this ${duration.toFixed(2)} s audio.
The speech follows this script exactly, word by word (${words.length} words):
${words.join(' ')}
Return JSON {"words":[{"text":"...","start":0.0,"end":0.0}]} with exactly ${words.length} items, in script order, using the script's spelling.`},
      ]}],
      generationConfig: {responseMimeType: 'application/json', temperature: 0},
    });
    const got = JSON.parse(d.candidates?.[0]?.content?.parts?.[0]?.text || '{}').words || [];
    const ok = got.length === words.length && got.every((w, i) => Number.isFinite(+w.start) && Number.isFinite(+w.end)
      && +w.start <= duration + 0.5 && (i === 0 || +w.start >= +got[i - 1].start - 0.05) && clean(String(w.text)) === clean(words[i]));
    if (ok) return {words: got.map((w, i) => ({text: words[i], start: +(+w.start).toFixed(3), end: +Math.max(+w.end, +w.start + 0.05).toFixed(3)})), source: 'gemini'};
  } catch (e) { console.warn('Gemini word timing failed, using audio-based spread:', e.message); }
  return {words: spreadWords(words, intervals, duration), source: 'acoustic'};
}

// JSON answer for a prompt.
export async function geminiJson(prompt) {
  const d = await generate(TEXT_MODEL, {contents: [{parts: [{text: prompt}]}], generationConfig: {responseMimeType: 'application/json', temperature: 0.4}});
  return JSON.parse(d.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
}
