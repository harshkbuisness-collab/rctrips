// Reel Engine web tool: npm start → http://localhost:3000
// Make a video: upload voiceover + script → copy prompt to Claude → paste its
// JSON → preview → render MP4. Library: add / remove images.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {spawn, spawnSync} from 'node:child_process';
import * as esbuild from 'esbuild';
import {loadLibrary, loadProject, PUBLIC, ROOT} from '../scripts/project.mjs';
import {renderProject, storyboardProject} from '../scripts/render-lib.mjs';
import {srtToWords} from '../scripts/srt-to-words.mjs';
import {mergeScriptWithTimings} from '../src/mergeWords.js';
import {buildBatchPrompt, buildPrompt} from './prompt.mjs';
import {aiSettings, listModels, planWithAi, PROVIDERS, saveAiSettings, usableModel} from './ai.mjs';
import {FORMATS} from '../src/schema.js';
import {makeZip} from './zip.mjs';

const PORT = Number(process.env.PORT || 3000);
const PROJECTS = path.join(PUBLIC, 'projects');
const OUT = path.join(ROOT, 'out');
const UI_DIST = path.join(ROOT, '.cache', 'ui');
const HERO_LIB = path.join(PUBLIC, 'library', 'hero');
const MUSIC_DIR = path.join(PUBLIC, 'library', 'music');
const SFX_DIR = path.join(PUBLIC, 'library', 'sfx');
const SFX_JSON = path.join(SFX_DIR, 'library.json');
const SFX_CATEGORIES = ['transition', 'ui', 'impact', 'meme', 'body', 'ambience'];
const MUSIC_JSON = path.join(MUSIC_DIR, 'music.json');
const AUDIO_EXT = /\.(mp3|wav|m4a|aac|ogg)$/i;

const PYTHON = ['python3', 'python', 'py'].find((p) => spawnSync(p, ['--version']).status === 0);

const slug = (s) => String(s).toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60);
const projectDir = (name) => {
  const s = slug(name);
  if (!s) throw new Error('missing project name');
  return path.join(PROJECTS, s);
};
const readBody = (req) => new Promise((resolve, reject) => {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => resolve(Buffer.concat(chunks)));
  req.on('error', reject);
});
const send = (res, code, body, type = 'application/json') => {
  res.writeHead(code, {'Content-Type': type, 'Cache-Control': 'no-store'});
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
};
const meta = (dir) => {
  const f = path.join(dir, 'project.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {};
};
const saveMeta = (dir, patch) => fs.writeFileSync(path.join(dir, 'project.json'), JSON.stringify({...meta(dir), ...patch}, null, 2));
const runPython = (args) => new Promise((resolve) => {
  if (!PYTHON) return resolve({code: 1, out: '', err: 'Python is not installed. Install Python 3.11 and run: pip install -r requirements.txt'});
  // UTF-8 everywhere: Windows' default console code page (cp1252) can't print or read characters like → or curly quotes
  const p = spawn(PYTHON, args, {cwd: ROOT, env: {...process.env, PYTHONPATH: path.join(ROOT, 'scripts'), PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1'}});
  let out = '', err = '';
  p.stdout.on('data', (d) => (out += d));
  p.stderr.on('data', (d) => (err += d));
  p.on('close', (code) => resolve({code, out, err}));
});

const renders = new Map(); // project slug -> {state, progress, url, error}

async function buildUi() {
  await esbuild.build({
    entryPoints: [path.join(ROOT, 'src/ui/main.jsx')], bundle: true, outdir: UI_DIST, format: 'esm',
    loader: {'.woff2': 'file', '.woff': 'file'}, jsx: 'automatic', minify: true, logLevel: 'error',
    define: {'process.env.NODE_ENV': '"production"'},
  });
}

const STATIC_TYPES = {'.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.webp': 'image/webp',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.wav': 'audio/wav', '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4', '.mp4': 'video/mp4', '.webm': 'video/webm', '.html': 'text/html'};

function serveFile(res, file, req) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return send(res, 404, {error: 'not found'});
  const type = STATIC_TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const size = fs.statSync(file).size;
  const range = req.headers.range?.match(/bytes=(\d*)-(\d*)/);
  if (range) { // audio/video seeking in the preview
    const start = Number(range[1] || 0), end = range[2] ? Number(range[2]) : size - 1;
    res.writeHead(206, {'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1});
    return fs.createReadStream(file, {start, end}).pipe(res);
  }
  res.writeHead(200, {'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes'});
  fs.createReadStream(file).pipe(res);
}

const INDEX = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reel Engine</title><link rel="stylesheet" href="/_ui/main.css"></head>
<body><div id="root"></div><script type="module" src="/_ui/main.js"></script></body></html>`;

// ---------- API ----------
const routes = [];
const route = (method, pattern, fn) => routes.push({method, pattern, fn});

route('GET', /^\/api\/status$/, async () => ({python: Boolean(PYTHON)}));

route('GET', /^\/api\/library$/, async () => ({assets: loadLibrary().assets.filter((a) => a.kind !== 'mask' && !a.id.startsWith('demo_'))}));

route('POST', /^\/api\/library\/upload$/, async (req, url) => {
  const name = url.searchParams.get('name') || 'image.jpg';
  const kind = url.searchParams.get('kind') === 'prop' ? 'prop' : 'character';
  let id = url.searchParams.get('id') || `${kind === 'prop' ? 'prop' : 'hero'}_${slug(name).replace(/_?\d{8,}(_\d+)?$/, '').replace(/^(muscular_man_|man_|draw_|drawing_)/, '')}`;
  id = slug(id);
  const ids = new Set(loadLibrary().assets.map((a) => a.id));
  if (ids.has(id)) { let n = 2; while (ids.has(`${id}_v${n}`)) n++; id = `${id}_v${n}`; }
  const tmp = path.join(ROOT, '.cache', `upload-${Date.now()}${path.extname(name) || '.jpg'}`);
  fs.mkdirSync(path.dirname(tmp), {recursive: true});
  fs.writeFileSync(tmp, await readBody(req));
  const desc = url.searchParams.get('description') || (kind === 'character' ? 'H: ' : '') + id.replace(/^(hero|prop)_/, '').replace(/_v\d+$/, '').replace(/_/g, ' ');
  const r = await runPython(['tools/import_one.py', tmp, HERO_LIB, id, kind, desc]);
  fs.rmSync(tmp, {force: true});
  if (r.code !== 0) throw new Error(r.err.split('\n').filter(Boolean).slice(-3).join('\n'));
  return {id, ...JSON.parse(r.out.trim().split('\n').pop())};
});

route('POST', /^\/api\/library\/delete$/, async (req) => {
  const {id} = JSON.parse(await readBody(req));
  const file = path.join(HERO_LIB, 'library.json');
  const lib = JSON.parse(fs.readFileSync(file, 'utf8'));
  const a = lib.assets.find((x) => x.id === id);
  if (!a) throw new Error(`${id} is not in the H library`);
  lib.assets = lib.assets.filter((x) => x.id !== id);
  fs.writeFileSync(file, JSON.stringify(lib, null, 2));
  fs.rmSync(path.join(HERO_LIB, a.file), {force: true});
  return {ok: true};
});

// ---------- background music ----------
// library/music/ holds the tracks; music.json says which one every new video uses and how loud.
const musicSettings = () => {
  const s = fs.existsSync(MUSIC_JSON) ? JSON.parse(fs.readFileSync(MUSIC_JSON, 'utf8')) : {};
  const tracks = fs.existsSync(MUSIC_DIR) ? fs.readdirSync(MUSIC_DIR).filter((f) => AUDIO_EXT.test(f)).sort() : [];
  const current = s.current === 'none' || tracks.includes(s.current) ? s.current : tracks[0] ?? 'none';
  return {tracks, current, volume: s.volume ?? 0.08};
};
const saveMusic = (patch) => {
  const {current, volume} = {...musicSettings(), ...patch};
  fs.mkdirSync(MUSIC_DIR, {recursive: true});
  fs.writeFileSync(MUSIC_JSON, JSON.stringify({current, volume}, null, 2));
};

// ---------- sound effects ----------
const remotionCli = (args) => new Promise((resolve, reject) => {
  // ffmpeg / ffprobe that ship with Remotion, run with this node binary (no shell: safe for spaces on Windows)
  const p = spawn(process.execPath, [path.join(ROOT, 'node_modules', '@remotion', 'cli', 'remotion-cli.js'), ...args], {cwd: ROOT});
  let out = '', err = '';
  p.stdout.on('data', (d) => (out += d));
  p.stderr.on('data', (d) => (err += d));
  p.on('close', (code) => (code === 0 ? resolve(out) : reject(new Error(err.split('\n').filter(Boolean).pop() || 'ffmpeg failed'))));
});
const readSfx = () => (fs.existsSync(SFX_JSON) ? JSON.parse(fs.readFileSync(SFX_JSON, 'utf8')) : {assets: []});

route('POST', /^\/api\/sounds\/upload$/, async (req, url) => {
  const name = url.searchParams.get('name') || 'sound.mp3';
  const category = SFX_CATEGORIES.includes(url.searchParams.get('category')) ? url.searchParams.get('category') : 'meme';
  if (!AUDIO_EXT.test(name)) throw new Error('Upload an mp3, wav, m4a, aac or ogg file');
  let id = `sfx_${slug(name).replace(/^sfx_/, '')}`;
  const ids = new Set(loadLibrary().assets.map((a) => a.id));
  if (ids.has(id)) { let n = 2; while (ids.has(`${id}_${n}`)) n++; id = `${id}_${n}`; }
  fs.mkdirSync(SFX_DIR, {recursive: true});
  const tmp = path.join(ROOT, '.cache', `sfx-${Date.now()}${path.extname(name)}`);
  fs.mkdirSync(path.dirname(tmp), {recursive: true});
  fs.writeFileSync(tmp, await readBody(req));
  const file = `${id.replace(/^sfx_/, '')}.mp3`;
  const raw = `${tmp}.wav`;
  try {
    // decode, find where the sound really starts / ends, and how loud its loudest part is
    // (Remotion's small ffmpeg: wav out, volume filter only)
    await remotionCli(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-ac', '1', '-ar', '44100', '-c:a', 'pcm_s16le', raw]);
    const buf = fs.readFileSync(raw);
    let off = 12;
    while (off < buf.length - 8 && buf.toString('ascii', off, off + 4) !== 'data') off += 8 + buf.readUInt32LE(off + 4);
    const pcm = buf.subarray(off + 8);
    const x = new Float32Array(Math.floor(pcm.length / 2));
    for (let i = 0; i < x.length; i++) x[i] = pcm.readInt16LE(i * 2) / 32768;
    if (!x.length) throw new Error('This file has no sound');
    let peak = 0;
    for (const v of x) peak = Math.max(peak, Math.abs(v));
    const thr = peak * 0.01; // -40 dB below the peak
    let a = 0, b = x.length - 1;
    while (a < b && Math.abs(x[a]) < thr) a++;
    while (b > a && Math.abs(x[b]) < thr) b--;
    const sr = 44100, w = Math.round(0.4 * sr);
    let best = 0, sum = 0;
    for (let i = a; i <= b; i++) {
      sum += x[i] * x[i];
      if (i - a >= w) sum -= x[i - w] * x[i - w];
      best = Math.max(best, sum / Math.min(w, i - a + 1));
    }
    // loudest 400 ms to -14 dBFS, peaks below -1 dBFS: same level as the built-in sounds
    const gain = Math.min(10 ** (-14 / 20) / Math.max(Math.sqrt(best), 1e-6), 10 ** (-1 / 20) / Math.max(peak, 1e-6));
    const start = Math.max(0, a / sr - 0.005), end = Math.min(x.length / sr, b / sr + 0.05);
    await remotionCli(['ffmpeg', '-v', 'error', '-y', '-ss', start.toFixed(3), '-to', end.toFixed(3), '-i', tmp,
      '-af', `volume=${gain.toFixed(4)}`,
      '-ar', '44100', '-ac', '2', '-c:a', 'libmp3lame', '-b:a', '192k', path.join(SFX_DIR, file)]);
  } finally {
    fs.rmSync(tmp, {force: true});
    fs.rmSync(raw, {force: true});
  }
  const probe = await remotionCli(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(SFX_DIR, file)]);
  const duration = Math.round(Number(probe.trim()) * 100) / 100 || 2;
  const description = (url.searchParams.get('description') || id.replace(/^sfx_/, '').replace(/_/g, ' ')).trim();
  const lib = readSfx();
  lib.assets.push({id, file, kind: 'audio', category, volume: 0.6, duration, description});
  fs.writeFileSync(SFX_JSON, JSON.stringify(lib, null, 1));
  return {id, duration};
});

route('POST', /^\/api\/sounds\/update$/, async (req) => {
  const {id, description, category, volume} = JSON.parse(await readBody(req));
  const lib = readSfx();
  const a = lib.assets.find((x) => x.id === id);
  if (!a) throw new Error(`${id} is not in the sound library`);
  if (description !== undefined) a.description = String(description).trim();
  if (SFX_CATEGORIES.includes(category)) a.category = category;
  if (typeof volume === 'number' && volume >= 0 && volume <= 2) a.volume = volume;
  fs.writeFileSync(SFX_JSON, JSON.stringify(lib, null, 1));
  return {ok: true};
});

route('POST', /^\/api\/sounds\/delete$/, async (req) => {
  const {id} = JSON.parse(await readBody(req));
  const lib = readSfx();
  const a = lib.assets.find((x) => x.id === id);
  if (!a) throw new Error(`${id} is not in the sound library`);
  lib.assets = lib.assets.filter((x) => x.id !== id);
  fs.writeFileSync(SFX_JSON, JSON.stringify(lib, null, 1));
  if (!lib.assets.some((x) => x.file === a.file)) fs.rmSync(path.join(SFX_DIR, a.file), {force: true});
  return {ok: true};
});

route('GET', /^\/api\/music$/, async () => musicSettings());

route('POST', /^\/api\/music\/settings$/, async (req) => {
  const {current, volume} = JSON.parse(await readBody(req));
  const {tracks} = musicSettings();
  if (current !== undefined && current !== 'none' && !tracks.includes(current)) throw new Error(`${current} is not in the music folder`);
  if (volume !== undefined && !(volume >= 0 && volume <= 1)) throw new Error('volume must be between 0 and 1');
  saveMusic({...(current !== undefined && {current}), ...(volume !== undefined && {volume: Number(volume)})});
  return musicSettings();
});

route('POST', /^\/api\/music\/upload$/, async (req, url) => {
  const name = url.searchParams.get('name') || 'music.mp3';
  const ext = (path.extname(name) || '.mp3').toLowerCase();
  if (!AUDIO_EXT.test(ext)) throw new Error('Upload an mp3, wav, m4a, aac or ogg file');
  const file = `${slug(name) || 'music'}${ext}`;
  fs.mkdirSync(MUSIC_DIR, {recursive: true});
  fs.writeFileSync(path.join(MUSIC_DIR, file), await readBody(req));
  if (url.searchParams.get('use') === '1') saveMusic({current: file});
  return musicSettings();
});

route('POST', /^\/api\/music\/delete$/, async (req) => {
  const {file} = JSON.parse(await readBody(req));
  if (!musicSettings().tracks.includes(file)) throw new Error(`${file} is not in the music folder`);
  fs.rmSync(path.join(MUSIC_DIR, file), {force: true});
  if (musicSettings().current === file) saveMusic({current: musicSettings().tracks[0] ?? 'none'});
  return musicSettings();
});

route('GET', /^\/api\/projects$/, async () => ({
  projects: fs.existsSync(PROJECTS) ? fs.readdirSync(PROJECTS).filter((d) => fs.existsSync(path.join(PROJECTS, d, 'project.json'))).sort() : [],
}));

route('GET', /^\/api\/projects\/([^/]+)$/, async (req, url, [name]) => {
  const dir = projectDir(name);
  const m = meta(dir);
  const read = (f) => (fs.existsSync(path.join(dir, f)) ? fs.readFileSync(path.join(dir, f), 'utf8') : '');
  return {name: slug(name), ...m, script: read('script.txt'), timeline: read('timeline.json'), render: renders.get(slug(name)) ?? null,
    video: fs.existsSync(path.join(OUT, `${slug(name)}.mp4`)) ? `/_out/${slug(name)}.mp4` : null};
});

// thumbnail made outside the tool (png / jpg / webp)
route('POST', /^\/api\/projects\/([^/]+)\/cover$/, async (req, url, [name]) => {
  const dir = projectDir(name);
  fs.mkdirSync(dir, {recursive: true});
  const ext = (path.extname(url.searchParams.get('filename') || '.png') || '.png').toLowerCase();
  if (!/^\.(png|jpe?g|webp)$/.test(ext)) throw new Error('Upload a PNG, JPG or WEBP image');
  for (const f of fs.readdirSync(dir)) if (/^cover\./.test(f)) fs.rmSync(path.join(dir, f)); // one thumbnail per video
  const file = `cover${ext}`;
  fs.writeFileSync(path.join(dir, file), await readBody(req));
  saveMeta(dir, {cover: file});
  return {cover: file};
});
route('POST', /^\/api\/projects\/([^/]+)\/cover\/remove$/, async (req, url, [name]) => {
  const dir = projectDir(name);
  const m = meta(dir);
  if (m.cover) fs.rmSync(path.join(dir, m.cover), {force: true});
  saveMeta(dir, {cover: null});
  return {ok: true};
});

// word timings straight from the audio (needs the script; English; offline)
async function wordsFromAudio(name, dir, voiceFile, allowEstimate = true) {
  // 16 kHz mono copy for the aligner, made with the ffmpeg that ships with Remotion
  const wav16 = path.join(ROOT, '.cache', `${slug(name)}-16k.wav`);
  fs.mkdirSync(path.dirname(wav16), {recursive: true});
  await remotionCli(['ffmpeg', '-v', 'error', '-y', '-i', path.join(dir, voiceFile), '-ar', '16000', '-ac', '1', wav16])
    .catch(() => { throw new Error('Could not read the voiceover file'); });
  const out = path.join(ROOT, '.cache', `${slug(name)}-words.json`);
  const r = await runPython(['scripts/align_words.py', wav16, path.join(dir, 'script.txt'), out]);
  if (r.code !== 0) {
    const msg = (r.err || r.out).split('\n').filter(Boolean).pop();
    // no aligner on this PC (e.g. Python 3.14): estimate the word times from the pauses in the audio instead
    if (allowEstimate && /No module named 'pocketsphinx'/.test(r.err || r.out)) {
      const est = await runPython(['scripts/estimate_words.py', wav16, path.join(dir, 'script.txt'), out]);
      if (est.code === 0) {
        const words = JSON.parse(fs.readFileSync(out, 'utf8')).words;
        words.estimated = true;
        return words;
      }
    }
    if (/No module named 'pocketsphinx'/.test(r.err || r.out)) {
      throw new Error('The voiceover sync helper (pocketsphinx) is not installed. Close the tool and start START.bat again: it installs it. '
        + 'It needs Python 3.9 - 3.13 (Python 3.14 has no ready package yet). Until then: AI voices still work, uploaded voiceovers need an SRT file.');
    }
    throw new Error(`Could not sync the voiceover with the script (${msg}). For non-English voiceovers upload an SRT file.`);
  }
  return JSON.parse(fs.readFileSync(out, 'utf8')).words;
}

// Word times from the AI voice's sentence times: a sentence is cut into clauses at its commas, each clause matched to
// the silences the voice left there; inside a clause each word gets a share of the time by its length.
// Used when the speech aligner (pocketsphinx) is not installed.
function wordsFromSegments(file) {
  if (!fs.existsSync(file)) return null;
  const {segments} = JSON.parse(fs.readFileSync(file, 'utf8'));
  const words = [];
  const weight = (w) => Math.max(2, w.replace(/[^\p{L}\p{N}]/gu, '').length + 1);
  const spread = (ws, from, to) => {
    const total = ws.reduce((x, w) => x + weight(w), 0);
    let t = from;
    for (const w of ws) {
      const d = ((to - from) * weight(w)) / total;
      words.push({text: w, start: Math.round(t * 1000) / 1000, end: Math.round((t + d) * 1000) / 1000});
      t += d;
    }
  };
  for (const seg of segments) {
    const ws = seg.text.split(/\s+/).filter(Boolean);
    // clauses end with , ; : and the voice pauses there: use the longest pauses as the clause borders
    const clauses = [[]];
    ws.forEach((w, i) => { clauses[clauses.length - 1].push(w); if (/[,;:]$/.test(w) && i < ws.length - 1) clauses.push([]); });
    const cuts = (seg.pauses || []).slice(0, clauses.length - 1).sort((p, q) => p[0] - q[0]);
    if (clauses.length > 1 && cuts.length === clauses.length - 1) {
      let from = seg.start;
      clauses.forEach((c, k) => {
        const to = k < cuts.length ? cuts[k][0] : seg.end;
        spread(c, from, Math.max(from + 0.05, to));
        if (k < cuts.length) from = cuts[k][1];
      });
    } else {
      spread(ws, seg.start, Math.max(seg.start + 0.05, seg.end));
    }
  }
  return words.length ? words : null;
}

// ---------- AI voiceover (Kokoro: free, offline after a one-time ~350 MB download, fine for monetised videos) ----------
export const TTS_VOICES = [
  ['am_michael', 'Michael (US man, deep, clear) - default'], ['am_adam', 'Adam (US man, energetic)'], ['am_onyx', 'Onyx (US man, low)'],
  ['am_eric', 'Eric (US man, confident)'], ['am_liam', 'Liam (US man, young)'], ['am_echo', 'Echo (US man, calm)'], ['am_fenrir', 'Fenrir (US man, strong)'],
  ['am_puck', 'Puck (US man, playful)'], ['bm_george', 'George (UK man)'], ['bm_lewis', 'Lewis (UK man, deep)'], ['bm_daniel', 'Daniel (UK man)'],
  ['af_heart', 'Heart (US woman, warm)'], ['af_bella', 'Bella (US woman, lively)'], ['af_nicole', 'Nicole (US woman, soft)'], ['af_sarah', 'Sarah (US woman)'],
  ['bf_emma', 'Emma (UK woman)'], ['hm_omega', 'Omega (Hindi man)'], ['hm_psi', 'Psi (Hindi man)'], ['hf_alpha', 'Alpha (Hindi woman)'], ['hf_beta', 'Beta (Hindi woman)'],
];
const ttsJobs = new Map();
// The AI voice speaks at most 2x; faster voices (up to 4x) are spoken at 2x and then sped up with the same pitch.
const MAX_SPEED = 4;
const KOKORO_MAX = 2;
const atempo = (f) => {
  const parts = [];
  while (f > 2) { parts.push(2); f /= 2; }
  while (f < 0.5) { parts.push(0.5); f /= 0.5; }
  parts.push(f);
  return parts.map((x) => `atempo=${x.toFixed(4)}`).join(',');
};
// speeds a wav up in place; the sentence times next to it (AI voice) follow
async function speedUpFile(file, factor) {
  if (Math.abs(factor - 1) < 0.001) return;
  const tmp = file.replace(/\.wav$/, '') + '-tmp.wav';
  await remotionCli(['ffmpeg', '-v', 'error', '-y', '-i', file, '-filter:a', atempo(factor), tmp]);
  fs.renameSync(tmp, file);
  const seg = file + '.segments.json';
  if (fs.existsSync(seg)) {
    const r = (t) => Math.round((t / factor) * 1000) / 1000;
    const d = JSON.parse(fs.readFileSync(seg, 'utf8'));
    d.segments = d.segments.map((x) => ({...x, start: r(x.start), end: r(x.end), pauses: (x.pauses || []).map(([a, b]) => [r(a), r(b)])}));
    fs.writeFileSync(seg, JSON.stringify(d));
  }
}
route('GET', /^\/api\/tts\/voices$/, async () => ({voices: TTS_VOICES.map(([id, label]) => ({id, label}))}));
// a short sample of a voice (cached), to listen before choosing
route('POST', /^\/api\/tts\/sample$/, async (req) => {
  const body = JSON.parse(await readBody(req));
  const voice = body.voice ?? 'am_michael';
  const speed = Math.min(MAX_SPEED, Math.max(0.5, Number(body.speed) || 1.1));
  if (!TTS_VOICES.some(([id]) => id === voice)) throw new Error('Unknown voice');
  const file = `tts-sample-${voice}-${speed.toFixed(2)}.wav`;
  const out = path.join(OUT, file);
  fs.mkdirSync(OUT, {recursive: true});
  if (!fs.existsSync(out)) {
    const r = await runPython(['scripts/tts.py', '--sample', out, voice, String(Math.min(KOKORO_MAX, speed))]);
    if (r.code !== 0) throw new Error((r.err || r.out).split('\n').filter(Boolean).pop() || 'Could not make the sample');
    await speedUpFile(out, speed / Math.min(KOKORO_MAX, speed));
  }
  return {url: `/_out/${file}`};
});
// ---------- saved voices: every AI voice is kept, so the same script + voice + speed is never made twice ----------
const VOICES_DIR = path.join(ROOT, 'settings', 'voices');
const VOICE_FILES = ['voice.wav', 'voice.wav.segments.json', 'words.json'];
const normScript = (t) => String(t).replace(/\s+/g, ' ').trim();
const voiceKey = (script, voice, speed) => crypto.createHash('sha1').update(`${voice}|${Number(speed).toFixed(2)}|${normScript(script)}`).digest('hex').slice(0, 16);
function savedVoiceDir(script, voice, speed) {
  const d = path.join(VOICES_DIR, voiceKey(script, voice, speed));
  return fs.existsSync(path.join(d, 'voice.wav')) && fs.existsSync(path.join(d, 'words.json')) ? d : null;
}
function saveVoice(dir, script, voice, speed, title) {
  const key = voiceKey(script, voice, speed);
  const d = path.join(VOICES_DIR, key);
  fs.mkdirSync(d, {recursive: true});
  for (const f of VOICE_FILES) if (fs.existsSync(path.join(dir, f))) fs.copyFileSync(path.join(dir, f), path.join(d, f));
  const words = JSON.parse(fs.readFileSync(path.join(d, 'words.json'), 'utf8')).words;
  fs.writeFileSync(path.join(d, 'info.json'), JSON.stringify({key, voice, speed, title: title || '', script: normScript(script),
    words: words.length, seconds: words[words.length - 1]?.end ?? 0, saved: Date.now()}));
  return key;
}
// voices made before the library existed: an AI voice whose script was not edited after it was made
function importProjectVoices() {
  if (!fs.existsSync(PROJECTS)) return 0;
  let n = 0;
  for (const name of fs.readdirSync(PROJECTS)) {
    try {
      const dir = path.join(PROJECTS, name);
      const m = meta(dir);
      if (!m.aiVoice || !m.synced || m.voice !== 'voice.wav' || !fs.existsSync(path.join(dir, 'voice.wav')) || !fs.existsSync(path.join(dir, 'words.json'))) continue;
      const scriptFile = path.join(dir, 'script.txt');
      const script = m.aiScript ?? (fs.existsSync(scriptFile) && fs.statSync(scriptFile).mtimeMs <= fs.statSync(path.join(dir, 'voice.wav')).mtimeMs + 1000 ? fs.readFileSync(scriptFile, 'utf8') : null);
      const speed = m.aiSpeed ?? m.voiceSpeed ?? 1;
      if (!script?.trim() || savedVoiceDir(script, m.aiVoice, speed)) continue;
      saveVoice(dir, script, m.aiVoice, speed, m.title || name);
      n++;
    } catch { /* a broken project never stops the others */ }
  }
  return n;
}
route('GET', /^\/api\/voices$/, async () => {
  if (!fs.existsSync(VOICES_DIR)) return {voices: []};
  const list = fs.readdirSync(VOICES_DIR).map((k) => {
    try { return {...JSON.parse(fs.readFileSync(path.join(VOICES_DIR, k, 'info.json'), 'utf8')), url: `/_voices/${k}.wav`}; } catch { return null; }
  }).filter(Boolean);
  return {voices: list.sort((a, b) => b.saved - a.saved)};
});
route('POST', /^\/api\/voices\/import$/, async () => ({imported: importProjectVoices()}));
route('POST', /^\/api\/voices\/delete$/, async (req) => {
  const {key} = JSON.parse(await readBody(req));
  if (!/^[0-9a-f]{16}$/.test(key || '')) throw new Error('Unknown voice');
  fs.rmSync(path.join(VOICES_DIR, key), {recursive: true, force: true});
  return {ok: true};
});

// script -> AI voiceover -> synced words, as a job. Voices wait in one queue; everything waiting is made by ONE
// Python run (the voice model loads once), and a saved voice for the same script + voice + speed is reused at once.
const ttsQueue = [];
let ttsBusy = false;
function startTts(name, script, voice = 'am_michael', speed = 1.1) {
  const s = slug(name);
  const cur = ttsJobs.get(s);
  if (cur && (cur.state === 'working' || cur.state === 'queued')) return cur;
  if (!script?.trim()) throw new Error('Paste the script first');
  if (!TTS_VOICES.some(([id]) => id === voice)) throw new Error('Unknown voice');
  speed = Math.round(Math.min(MAX_SPEED, Math.max(0.5, Number(speed) || 1)) * 100) / 100;
  const dir = projectDir(name);
  fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(path.join(dir, 'script.txt'), script.trim() + '\n');
  const job = {state: 'queued', step: 'Waiting for the voices before it…', error: null};
  ttsJobs.set(s, job);
  const saved = savedVoiceDir(script, voice, speed);
  if (saved) {
    for (const f of VOICE_FILES) if (fs.existsSync(path.join(saved, f))) fs.copyFileSync(path.join(saved, f), path.join(dir, f));
    const words = JSON.parse(fs.readFileSync(path.join(dir, 'words.json'), 'utf8')).words;
    voiceReady(name, {voice, speed, script, words, job, step: `Saved voice reused: ${words.length} words, ${words[words.length - 1].end.toFixed(1)} s (not made again)`});
    return job;
  }
  ttsQueue.push({name, script, voice, speed, job});
  queueSteps();
  setTimeout(pumpTts, 300); // voices asked for together (a whole batch) go into the same run
  return job;
}
function voiceReady(name, {voice, speed, script, words, job, step}) {
  const dir = projectDir(name);
  saveMeta(dir, {voice: 'voice.wav', aiVoice: voice, aiSpeed: speed, aiScript: normScript(script), voiceSpeed: speed, voiceOriginal: null,
    synced: true, words: words.length, seconds: words[words.length - 1].end});
  setTimelineVoice(dir, 'voice.wav');
  Object.assign(job, {state: 'done', step, words: words.length, seconds: words[words.length - 1].end});
  afterVoice(name).catch(() => {});
}
// one voice made by the Python run: speed, word times, saved for next time
async function finishVoice({name, script, voice, speed, job}, spoken) {
  const dir = projectDir(name);
  job.step = 'Syncing the words…';
  await speedUpFile(path.join(dir, 'voice.wav'), speed / spoken);
  // exact timing from the speech aligner; without it (or for Hindi) the timing comes from the sentence times of the voice
  let words, approx = false;
  try {
    if (voice.startsWith('h')) throw new Error('Hindi');
    words = await wordsFromAudio(name, dir, 'voice.wav', false);
  } catch (e) {
    words = wordsFromSegments(path.join(dir, 'voice.wav.segments.json'));
    if (!words) throw e;
    approx = true;
  }
  fs.writeFileSync(path.join(dir, 'words.json'), JSON.stringify({words}, null, 1));
  try { saveVoice(dir, script, voice, speed, meta(dir).title || name); } catch { /* saving is a bonus */ }
  voiceReady(name, {voice, speed, script, words, job,
    step: `AI voice ready: ${words.length} words, ${words[words.length - 1].end.toFixed(1)} s${approx ? ' (word times estimated from the sentences: install pocketsphinx for exact timing)' : ''}`});
}
// Python with its output read line by line
// Python with its output read line by line. `quiet` (ms): stop it when it shows no sign of life for that long
// (a stuck download or a hung model), so one stuck run can never block every voice after it.
const runPythonLines = (args, onLine, {onErr, quiet = 0} = {}) => new Promise((resolve) => {
  if (!PYTHON) return resolve({code: 1, err: 'Python is not installed. Install Python 3.11 and run: pip install -r requirements.txt'});
  const p = spawn(PYTHON, args, {cwd: ROOT, env: {...process.env, PYTHONPATH: path.join(ROOT, 'scripts'), PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1'}});
  let buf = '', err = '', timer = null, timedOut = false, finished = false;
  const poke = () => {
    if (!quiet) return;
    clearTimeout(timer);
    timer = setTimeout(() => { timedOut = true; p.kill(); }, quiet);
  };
  const finish = (code) => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    if (buf.trim()) onLine(buf.trim());
    resolve({code, err: timedOut ? `${err}\nThe voice maker stopped answering (no progress for ${Math.round(quiet / 60000)} minutes) and was stopped.` : err});
  };
  poke();
  p.stdout.on('data', (d) => {
    poke();
    buf += d;
    const lines = buf.split('\n');
    buf = lines.pop();
    lines.forEach((l) => onLine(l.trim()));
  });
  p.stderr.on('data', (d) => {
    poke();
    err += d;
    String(d).split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean).forEach((l) => onErr?.(l));
  });
  p.on('error', (e) => { err += `\n${e.message}`; finish(1); });
  p.on('close', (code) => finish(code));
});
// what the voices waiting in the queue show while another run is busy
let ttsRun = null; // {total, done}
function queueSteps() {
  ttsQueue.forEach((x, k) => {
    x.job.step = ttsRun
      ? `Waiting: the voice run before it is busy (${ttsRun.done} of ${ttsRun.total} voices done)${k ? `, then ${k} more before this one` : ''}…`
      : 'Starting…';
  });
}
async function pumpTts() {
  if (ttsBusy || !ttsQueue.length) return;
  ttsBusy = true;
  const list = ttsQueue.splice(0);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tts-'));
  try {
    const spokenOf = (x) => Math.min(KOKORO_MAX, x.speed);
    fs.writeFileSync(path.join(tmp, 'jobs.json'), JSON.stringify(list.map((x) => ({
      script: path.join(projectDir(x.name), 'script.txt'), out: path.join(projectDir(x.name), 'voice.wav'), voice: x.voice, speed: spokenOf(x)}))));
    ttsRun = {total: list.length, done: 0};
    const reported = new Set();
    let post = Promise.resolve();
    const next = (i) => {
      if (i < list.length) Object.assign(list[i].job, {state: 'working', step: `Making the voice… (${i + 1} of ${list.length} in this run)`});
      for (let k = i + 1; k < list.length; k++) list[k].job.step = `In this run: voice ${k + 1} of ${list.length}, ${k - i} before it…`;
    };
    next(0);
    list[0].job.step = list.length > 1 ? `Loading the voice model, then ${list.length} voices one after another…` : 'Loading the voice model, then making the voice…';
    const r = await runPythonLines(['scripts/tts.py', '--many', path.join(tmp, 'jobs.json')], (line) => {
      const m = line.match(/^(DONE|FAIL) (\d+) ?(.*)$/);
      if (!m) return;
      const i = Number(m[2]);
      const x = list[i];
      if (!x) return;
      reported.add(i);
      ttsRun.done = reported.size;
      next(i + 1);
      queueSteps();
      if (m[1] === 'FAIL') { Object.assign(x.job, {state: 'error', error: m[3] || 'Could not make the voice'}); return; }
      x.job.state = 'working';
      post = post.then(() => finishVoice(x, spokenOf(x))).catch((e) => Object.assign(x.job, {state: 'error', error: e.message}));
    }, {
      quiet: 10 * 60 * 1000,
      // the one-time model download reports its progress: show it on the voice that waits for it
      onErr: (l) => {
        const cur = list.find((x, i) => !reported.has(i));
        if (cur && /Downloading/i.test(l)) cur.job.step = l;
      },
    });
    await post;
    const why = (r.err || '').split('\n').filter(Boolean).pop() || 'Could not make the voice';
    list.forEach((x, i) => { if (!reported.has(i)) Object.assign(x.job, {state: 'error', error: why}); });
  } catch (e) {
    list.forEach((x) => { if (x.job.state !== 'done') Object.assign(x.job, {state: 'error', error: e.message}); });
  } finally {
    fs.rmSync(tmp, {recursive: true, force: true});
    ttsRun = null;
    ttsBusy = false;
    queueSteps();
    pumpTts(); // voices asked for while this run was busy
  }
}

// After a voice is ready: a JSON plan that waited for it is checked; "Do it all" videos go on to an AI plan or the render queue.
const LOCAL_URL = new URL('http://localhost/');
async function afterVoice(name) {
  const dir = projectDir(name);
  const tf = path.join(dir, 'timeline.json');
  if (fs.existsSync(tf)) {
    const r = await checkTimelineText(name, fs.readFileSync(tf, 'utf8'), LOCAL_URL);
    saveMeta(dir, {planOk: r.ok});
    if (r.ok) return autoRender(name);
  }
  if (meta(dir).autoPlan) queueAiPlan(name);
}
function autoRender(name) {
  const dir = projectDir(name);
  if (!meta(dir).autoRender) return;
  saveMeta(dir, {autoRender: false});
  enqueueRender(name);
}
// AI plans for many videos, one after another (Gemini / OpenAI / Claude Code from the AI settings)
const aiPlanQueue = [];
let aiPlanBusy = false;
const aiReady = () => { const s = aiSettings(); return Boolean(s[s.provider].key); };
function queueAiPlan(name) {
  const s = slug(name);
  if (plans.get(s)?.state === 'working' || plans.get(s)?.state === 'queued') return;
  plans.set(s, {state: 'queued', step: 'Waiting for the AI plans before it…', json: null, check: null, error: null});
  aiPlanQueue.push(s);
  pumpAiPlans();
}
async function pumpAiPlans() {
  if (aiPlanBusy || !aiPlanQueue.length) return;
  aiPlanBusy = true;
  const s = aiPlanQueue.shift();
  const job = plans.get(s);
  const dir = projectDir(s);
  try {
    job.state = 'working'; job.step = 'Asking the AI for the plan…';
    const guide = path.join(ROOT, 'prompts', 'chatgpt-knowledge.md');
    const r = await planWithAi({
      prompt: promptFor(s),
      examples: fs.existsSync(guide) ? guideFor(fs.readFileSync(guide, 'utf8'), meta(dir).format || 'vertical') : '',
      check: (text) => checkTimelineText(s, text, LOCAL_URL),
      onStep: (step) => (job.step = step),
    });
    Object.assign(job, {state: 'done', step: `AI plan done (${r.provider} ${r.model}).`, json: r.json, check: r.check});
    saveMeta(dir, {planOk: Boolean(r.check?.ok), autoPlan: false});
    if (r.check?.ok) autoRender(s);
  } catch (e) {
    Object.assign(job, {state: 'error', error: e.message});
    saveMeta(dir, {autoPlan: false});
  }
  aiPlanBusy = false;
  pumpAiPlans();
}
route('POST', /^\/api\/projects\/([^/]+)\/tts$/, async (req, url, [name]) => {
  const {script, voice, speed} = JSON.parse(await readBody(req));
  return startTts(name, script, voice, speed);
});
// the saved plan plays the current voice file
function setTimelineVoice(dir, voiceFile) {
  const tf = path.join(dir, 'timeline.json');
  if (!fs.existsSync(tf)) return;
  const raw = JSON.parse(fs.readFileSync(tf, 'utf8'));
  raw.audio = {...raw.audio, voice: voiceFile};
  fs.writeFileSync(tf, JSON.stringify(raw, null, 2));
}

// Voice speed (0.5x - 4x). AI voices are spoken again at that speed; an uploaded voiceover is time-stretched
// (same pitch) and its word timings are scaled with it, so captions and every phrase time in the plan stay in sync.
async function setVoiceSpeed(name, speed) {
  speed = Math.round(Math.min(MAX_SPEED, Math.max(0.5, Number(speed) || 1)) * 100) / 100;
  const dir = projectDir(name);
  const m = meta(dir);
  if (!m.voice) throw new Error('Add a voiceover first');
  if (m.aiVoice) {
    const script = fs.existsSync(path.join(dir, 'script.txt')) ? fs.readFileSync(path.join(dir, 'script.txt'), 'utf8') : '';
    return {tts: startTts(name, script, m.aiVoice, speed)};
  }
  if (!m.synced) throw new Error('Sync the voiceover with the script first');
  // keep the voiceover and its timings as they were uploaded, every speed is made from them
  const original = m.voiceOriginal ?? m.voice;
  if (!m.voiceOriginal) {
    fs.copyFileSync(path.join(dir, 'words.json'), path.join(dir, 'words-original.json'));
    saveMeta(dir, {voiceOriginal: original});
  }
  const words0 = JSON.parse(fs.readFileSync(path.join(dir, 'words-original.json'), 'utf8')).words;
  let voiceFile = original;
  if (speed !== 1) {
    voiceFile = 'voice-speed.wav';
    await remotionCli(['ffmpeg', '-v', 'error', '-y', '-i', path.join(dir, original), '-filter:a', atempo(speed), '-ar', '44100', path.join(dir, voiceFile)]);
  }
  const words = words0.map((w) => ({...w, start: Math.round((w.start / speed) * 1000) / 1000, end: Math.round((w.end / speed) * 1000) / 1000}));
  fs.writeFileSync(path.join(dir, 'words.json'), JSON.stringify({words}, null, 1));
  saveMeta(dir, {voice: voiceFile, voiceSpeed: speed, seconds: words[words.length - 1].end});
  setTimelineVoice(dir, voiceFile);
  return {speed, seconds: words[words.length - 1].end};
}
route('POST', /^\/api\/projects\/([^/]+)\/speed$/, async (req, url, [name]) => setVoiceSpeed(name, JSON.parse(await readBody(req)).speed));
route('GET', /^\/api\/projects\/([^/]+)\/tts$/, async (req, url, [name]) => ttsJobs.get(slug(name)) ?? {state: 'idle'});

// voiceover upload (raw body)
route('POST', /^\/api\/projects\/([^/]+)\/voice$/, async (req, url, [name]) => {
  const dir = projectDir(name);
  fs.mkdirSync(dir, {recursive: true});
  const ext = (path.extname(url.searchParams.get('filename') || '.wav') || '.wav').toLowerCase();
  const file = `voice${ext}`;
  fs.writeFileSync(path.join(dir, file), await readBody(req));
  saveMeta(dir, {voice: file, voiceOriginal: null, voiceSpeed: 1, aiVoice: null});
  return {voice: file};
});

// script + optional SRT / word timings → words.json
route('POST', /^\/api\/projects\/([^/]+)\/sync$/, async (req, url, [name]) => {
  const dir = projectDir(name);
  fs.mkdirSync(dir, {recursive: true});
  const {script, timing, timingName} = JSON.parse(await readBody(req));
  if (!script?.trim()) throw new Error('Paste the script first');
  fs.writeFileSync(path.join(dir, 'script.txt'), script.trim() + '\n');
  const m = meta(dir);
  const fromAudio = () => {
    if (!m.voice) throw new Error('Upload the voiceover first');
    return wordsFromAudio(name, dir, m.voice);
  };
  let words, note = '';
  if (timing?.trim()) {
    if (/\.json$/i.test(timingName || '') || timing.trim().startsWith('{') || timing.trim().startsWith('[')) {
      const j = JSON.parse(timing);
      words = (Array.isArray(j) ? j : j.words).map((w) => ({text: w.display ?? w.text ?? w.word, start: +w.start, end: +w.end}));
    } else {
      words = srtToWords(timing);
    }
    if (!words.length) throw new Error('No words found in the timing file');
    // captions and Claude's phrases use the script; the SRT only gives the timing
    const merged = mergeScriptWithTimings(script, words);
    if (merged.matched < merged.total * 0.6) {
      throw new Error(`The timing file matches only ${merged.matched} of ${merged.total} script words. Check that the script is exactly what the voiceover says.`);
    }
    words = merged.words;
    // check the SRT against the audio itself; many SRT makers only guess the timing
    if (m.voice && PYTHON) {
      const heard = await fromAudio().catch(() => null);
      if (heard && !heard.estimated && heard.length === words.length) {
        const off = heard.reduce((s, w, i) => s + Math.abs(w.start - words[i].start), 0) / heard.length;
        if (off > 0.25) {
          words = heard;
          note = `Your SRT was off by ${off.toFixed(2)} s on average, so the tool used the timing it heard in the audio.`;
        } else {
          note = `SRT checked against the audio: accurate (${off.toFixed(2)} s average difference).`;
        }
      }
    }
  } else {
    words = await fromAudio();
    if (words.estimated) note = 'Word times estimated from the pauses in the voiceover (about 0.1-0.2 s accurate). For exact timing install the sync helper: Python 3.12 + START.bat, or add an SRT file.';
  }
  fs.writeFileSync(path.join(dir, 'words.json'), JSON.stringify({words}, null, 1));
  saveMeta(dir, {synced: true, words: words.length, seconds: words[words.length - 1].end, voiceOriginal: null});
  return {words: words.length, seconds: words[words.length - 1].end, note};
});

// the synced timing as an SRT file: one word per line (for this tool) or short caption lines (CapCut, Premiere…)
const srtTime = (t) => {
  const ms = Math.max(0, Math.round(t * 1000));
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};
route('POST', /^\/api\/projects\/([^/]+)\/format$/, async (req, url, [name]) => {
  const dir = projectDir(name);
  const {format} = JSON.parse(await readBody(req));
  if (!FORMATS[format]) throw new Error('format must be vertical or landscape');
  fs.mkdirSync(dir, {recursive: true});
  saveMeta(dir, {format});
  return {format};
});

route('GET', /^\/api\/projects\/([^/]+)\/srt$/, async (req, url, [name]) => {
  const file = path.join(projectDir(name), 'words.json');
  if (!fs.existsSync(file)) throw new Error('Sync the voiceover first');
  const words = JSON.parse(fs.readFileSync(file, 'utf8')).words;
  let cues = words.map((w) => ({start: w.start, end: w.end, text: w.text}));
  if (url.searchParams.get('mode') === 'lines') {
    // up to 5 words, broken at sentence ends, pauses and 2.5 s
    cues = [];
    let cur = null;
    words.forEach((w, i) => {
      if (!cur) cur = {start: w.start, end: w.end, words: []};
      cur.words.push(w.text);
      cur.end = w.end;
      const next = words[i + 1];
      if (!next || cur.words.length >= 5 || /[.!?,;:]$/.test(w.text) || next.start - w.end > 0.35 || next.end - cur.start > 2.5) {
        cues.push({start: cur.start, end: cur.end, text: cur.words.join(' ')});
        cur = null;
      }
    });
  }
  const body = cues.map((c, i) => `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.text}\n`).join('\n');
  return {raw: body, type: 'application/x-subrip; charset=utf-8', filename: `${slug(name)}${url.searchParams.get('mode') === 'lines' ? '-lines' : '-words'}.srt`};
});

route('GET', /^\/api\/projects\/([^/]+)\/prompt$/, async (req, url, [name]) => {
  const dir = projectDir(name);
  // give Claude the words exactly as the tool synced them (an SRT may differ from
  // the pasted script, e.g. "1" instead of "Number one"), so every phrase it uses can be found
  const wordsFile = path.join(dir, 'words.json');
  const script = fs.existsSync(wordsFile)
    ? JSON.parse(fs.readFileSync(wordsFile, 'utf8')).words.map((w) => w.text).join(' ')
    : fs.readFileSync(path.join(dir, 'script.txt'), 'utf8');
  return {prompt: buildPrompt(loadLibrary(dir), script, meta(dir).format || 'vertical')};
});
const promptFor = (name) => {
  const dir = projectDir(name);
  const wordsFile = path.join(dir, 'words.json');
  if (!fs.existsSync(wordsFile)) throw new Error('Sync the voiceover first (step 1)');
  const script = JSON.parse(fs.readFileSync(wordsFile, 'utf8')).words.map((w) => w.text).join(' ');
  return buildPrompt(loadLibrary(dir), script, meta(dir).format || 'vertical');
};

// ---------- AI (Gemini / OpenAI) ----------
// never send a key back to the page: only whether one is saved and its last 4 characters
route('GET', /^\/api\/ai$/, async () => {
  const s = aiSettings();
  const view = (p) => ({configured: Boolean(s[p].key), model: s[p].model, fromEnv: s[p].fromEnv, keyHint: s[p].key ? `…${s[p].key.slice(-4)}` : ''});
  return {provider: s.provider, names: PROVIDERS, gemini: view('gemini'), openai: view('openai'), claude: view('claude'),
    configured: Boolean(s[s.provider].key), model: s[s.provider].model, name: PROVIDERS[s.provider]};
});
route('POST', /^\/api\/ai\/settings$/, async (req) => {
  const {provider = 'gemini', key, model, use} = JSON.parse(await readBody(req));
  if (!PROVIDERS[provider]) throw new Error('Unknown AI provider');
  // Claude Code needs no key: it uses the Claude account the app on this computer is logged in with
  const k = provider === 'claude' ? 'claude-code' : (key ?? '').trim() || aiSettings()[provider].key;
  if (!k) throw new Error(`Paste your ${PROVIDERS[provider]} API key`);
  const models = await listModels(provider, k); // also proves the key works
  // the chosen model if it really answers for this key, else the best one that does
  const want = model || aiSettings()[provider].model;
  const {model: pick, busy} = await usableModel(provider, k, models.includes(want) ? want : null, models);
  saveAiSettings(provider, {...(key?.trim() && provider !== 'claude' ? {key: key.trim()} : {}), ...(provider === 'claude' ? {enabled: true} : {}), model: pick, use: use !== false});
  return {ok: true, models, model: pick, busy: Boolean(busy), switched: want && want !== pick ? want : null};
});
route('POST', /^\/api\/ai\/use$/, async (req) => {
  const {provider} = JSON.parse(await readBody(req));
  if (!PROVIDERS[provider]) throw new Error('Unknown AI provider');
  if (!aiSettings()[provider].key) throw new Error(`Save a ${PROVIDERS[provider]} key first`);
  saveAiSettings(provider, {use: true});
  return {ok: true};
});
route('GET', /^\/api\/ai\/models$/, async (req, url) => {
  const provider = url.searchParams.get('provider') || aiSettings().provider;
  const {key} = aiSettings()[provider] || {};
  if (!key) throw new Error(`No ${PROVIDERS[provider] || provider} API key yet`);
  return {models: await listModels(provider, key)};
});

// Only the parts of the editor's guide that matter for this format, with compact JSON: a smaller request
// gets through a busy free-tier Gemini more easily.
function guideFor(text, format) {
  const parts = text.split(/\n(?=## \d+\. )/);
  const keep = format === 'landscape' ? [1, 2, 3, 6, 9] : [1, 2, 3, 6, 7, 10];
  return parts.filter((p, i) => i === 0 || keep.includes(Number(p.match(/^## (\d+)\./)?.[1])))
    .join('\n')
    .replace(/```json\n([\s\S]*?)```/g, (m, j) => { try { return '```json\n' + JSON.stringify(JSON.parse(j)) + '\n```'; } catch { return m; } });
}

const plans = new Map(); // project slug -> {state, step, json, check, error}
route('POST', /^\/api\/projects\/([^/]+)\/autoplan$/, async (req, url, [name]) => {
  const s = slug(name);
  if (plans.get(s)?.state === 'working') return plans.get(s);
  const prompt = promptFor(name);
  const guide = path.join(ROOT, 'prompts', 'chatgpt-knowledge.md');
  const job = {state: 'working', step: 'Starting…', json: null, check: null, error: null};
  plans.set(s, job);
  planWithAi({
    prompt,
    examples: fs.existsSync(guide) ? guideFor(fs.readFileSync(guide, 'utf8'), meta(projectDir(name)).format || 'vertical') : '',
    check: (text) => checkTimelineText(name, text, url),
    onStep: (step) => (job.step = step),
  }).then((r) => Object.assign(job, {state: 'done', step: `Done in ${r.attempts} answer(s) from ${r.provider} ${r.model}.`, json: r.json, check: r.check}))
    .catch((e) => Object.assign(job, {state: 'error', error: e.message, json: e.last?.json ?? null, check: e.last ? {ok: false, errors: e.last.errors, warnings: e.last.warnings || []} : null}));
  return job;
});
route('GET', /^\/api\/projects\/([^/]+)\/autoplan$/, async (req, url, [name]) => plans.get(slug(name)) ?? {state: 'idle'});

// timeline JSON from Claude → validate → preview props
// JSON text (one or several parts) -> checked timeline + preview props. Used by "Check & preview" and by the AI planner.
async function checkTimelineText(name, input, url) {
  const dir = projectDir(name);
  const m = meta(dir);
  let text = String(input).trim();
  text = text.replace(/```(?:json)?/gi, '').trim(); // tolerate pasted code fences
  // the first "{" (or the last "}") was left out while copying: put it back
  if (!text.startsWith('{') && /^\s*"(title|captions|scenes|sfx)"\s*:/.test(text)) text = `{${text}`;
  if (text.startsWith('{') && /"scenes"\s*:/.test(text)) {
    let d = 0, s = false, e = false;
    for (const ch of text) { if (s) { if (e) e = false; else if (ch === '\\') e = true; else if (ch === '"') s = false; } else if (ch === '"') s = true; else if (ch === '{') d++; else if (ch === '}') d--; }
    // only the last "}" missing: add it; more missing means the paste was cut off
    if (d === 1 && /\]\s*$/.test(text)) text += '}';
    else if (d > 0) return {ok: false, errors: [`The JSON is cut off: only ${text.length} characters arrived and it stops at "…${text.slice(-40)}". It was not copied completely. Press "Open JSON file" and pick the .json file, or paste it in parts (one after another).`], warnings: []};
  }
  // a long video may come in parts: several JSON objects pasted one after another
  const parts = [];
  let depth = 0, inStr = false, esc = false, from = -1;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true;
    else if (ch === '{') { if (depth++ === 0) from = i; }
    else if (ch === '}' && depth > 0 && --depth === 0) parts.push(text.slice(from, i + 1));
  }
  if (!parts.length) parts.push(text);
  let raw;
  try {
    const objs = parts.map((p, i) => {
      try { return JSON.parse(p); } catch (e) { throw new Error(`${parts.length > 1 ? `part ${i + 1}: ` : ''}${e.message}`); }
    });
    raw = objs[0];
    for (const o of objs.slice(1)) {
      raw.scenes = [...(raw.scenes || []), ...(o.scenes || [])];
      raw.sfx = [...(raw.sfx || []), ...(o.sfx || [])];
      if (o.captions?.keywords) raw.captions = {...raw.captions, keywords: [...new Set([...(raw.captions?.keywords || []), ...o.captions.keywords])]};
    }
  } catch (e) {
    return {ok: false, errors: [`The JSON is not valid: ${e.message}`], warnings: []};
  }
  if (!raw?.scenes?.length) return {ok: false, errors: ['No "scenes" found: copy the whole answer, from the very first { to the very last }, and paste it again.'], warnings: []};
  // the project's format decides the video size
  const fmt = FORMATS[url.searchParams.get('format') || m.format || 'vertical'] ? (url.searchParams.get('format') || m.format || 'vertical') : 'vertical';
  if (fmt !== (m.format || 'vertical')) saveMeta(dir, {format: fmt});
  raw.canvas = {width: FORMATS[fmt].width, height: FORMATS[fmt].height, fps: 30, background: raw.canvas?.background ?? FORMATS[fmt].background};
  if (m.voice) raw.audio = {...raw.audio, voice: m.voice};
  // uploaded thumbnail: first 0.1 s of a Short only (long videos get their thumbnail on YouTube)
  delete raw.cover;
  if (m.cover && fmt === 'vertical' && fs.existsSync(path.join(dir, m.cover))) raw.cover = {src: m.cover, duration: 0.1};
  // background music: this video's choice ("default" = the track chosen in the Library tab)
  const ms = musicSettings();
  const pick = url.searchParams.get('music') || m.music || 'default';
  if (pick !== (m.music || 'default')) saveMeta(dir, {music: pick});
  const track = pick === 'default' ? ms.current : pick;
  delete raw.audio?.music;
  if (track !== 'none' && ms.tracks.includes(track)) raw.audio = {...raw.audio, music: `library/music/${track}`, musicVolume: m.musicVolume ?? ms.volume};
  if (m.voiceVolume !== undefined) raw.audio = {...raw.audio, voiceVolume: m.voiceVolume};
  if (m.sfxVolume !== undefined) raw.audio = {...raw.audio, sfxVolume: m.sfxVolume};
  raw.wordsFile = 'words.json';
  raw.duration = raw.duration ?? 'end';
  fs.writeFileSync(path.join(dir, 'timeline.json'), JSON.stringify(raw, null, 2));
  const p = loadProject(dir);
  if (!p.ok) return {ok: false, errors: p.errors, warnings: p.warnings};
  const fps = p.timeline.canvas.fps;
  const seconds = p.timeline.duration ?? Math.max(...p.timeline.scenes.map((s) => s.end));
  return {ok: true, warnings: p.warnings, quality: await qualityNotes(dir, fmt, text), props: {timeline: p.timeline, library: p.library}, durationInFrames: Math.ceil(seconds * fps)};
}

// The editor's quality check (tools/reel_check.py) with the real word times: empty moments, rhythm,
// sound spacing, safe zone, 16:9 style. Notes only, the plan already works.
async function qualityNotes(dir, fmt, text) {
  const words = path.join(dir, 'words.json'), scriptFile = path.join(dir, 'script.txt');
  if (!PYTHON || !fs.existsSync(words) || !fs.existsSync(scriptFile)) return [];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reelcheck-'));
  try {
    fs.writeFileSync(path.join(tmp, 'request.txt'), buildPrompt(loadLibrary(dir), fs.readFileSync(scriptFile, 'utf8'), fmt));
    fs.writeFileSync(path.join(tmp, 'plan.json'), text);
    const r = await runPython(['tools/reel_check.py', path.join(tmp, 'request.txt'), path.join(tmp, 'plan.json'), '--words', words, '--json']);
    return r.code === 0 ? JSON.parse(r.out).quality : [];
  } catch {
    return [];
  } finally {
    fs.rmSync(tmp, {recursive: true, force: true});
  }
}

route('POST', /^\/api\/projects\/([^/]+)\/timeline$/, async (req, url, [name]) => {
  const r = await checkTimelineText(name, (await readBody(req)).toString('utf8'), url);
  saveMeta(projectDir(name), {planOk: r.ok});
  return r;
});

// voice / music loudness for one video (sliders under the preview); saved for the render
route('POST', /^\/api\/projects\/([^/]+)\/audio$/, async (req, url, [name]) => {
  const dir = projectDir(name);
  const body = JSON.parse(await readBody(req));
  const MAX = {voiceVolume: 2, musicVolume: 1, sfxVolume: 2};
  const patch = {};
  for (const [k, max] of Object.entries(MAX)) {
    if (body[k] === undefined) continue;
    if (typeof body[k] !== 'number' || body[k] < 0 || body[k] > max) throw new Error('volume out of range');
    patch[k] = body[k];
  }
  saveMeta(dir, patch);
  const tf = path.join(dir, 'timeline.json');
  if (fs.existsSync(tf)) {
    const raw = JSON.parse(fs.readFileSync(tf, 'utf8'));
    raw.audio = {...raw.audio, ...patch};
    fs.writeFileSync(tf, JSON.stringify(raw, null, 2));
  }
  return {ok: true};
});

// Renders run one at a time from a queue; a video that fails never stops the others.
const renderQueue = [];
let renderBusy = false;
function enqueueRender(name) {
  const s = slug(name);
  const cur = renders.get(s);
  if (cur && (cur.state === 'rendering' || cur.state === 'queued')) return cur;
  const p = loadProject(projectDir(name));
  if (!p.ok) {
    const job = {state: 'error', progress: 0, url: null, error: p.errors.join('\n')};
    renders.set(s, job);
    return job;
  }
  const job = {state: 'queued', progress: 0, url: null, error: null};
  renders.set(s, job);
  renderQueue.push(s);
  pumpRenders();
  return job;
}
async function pumpRenders() {
  if (renderBusy || !renderQueue.length) return;
  renderBusy = true;
  const s = renderQueue.shift();
  const job = renders.get(s);
  try {
    const p = loadProject(projectDir(s));
    if (!p.ok) throw new Error(p.errors.join('\n'));
    job.state = 'rendering';
    await renderProject(p, path.join(OUT, `${s}.mp4`), (x) => (job.progress = x), {baseUrl: `http://localhost:${PORT}`});
    Object.assign(job, {state: 'done', progress: 1, url: `/_out/${s}.mp4?t=${Date.now()}`});
  } catch (e) {
    Object.assign(job, {state: 'error', error: e.message});
  } finally {
    renderBusy = false;
    pumpRenders();
  }
}
route('POST', /^\/api\/projects\/([^/]+)\/render$/, async (req, url, [name]) => {
  const job = enqueueRender(name);
  if (job.state === 'error') throw new Error(job.error);
  return job;
});

route('GET', /^\/api\/projects\/([^/]+)\/render$/, async (req, url, [name]) => renders.get(slug(name)) ?? {state: 'idle'});

// Storyboard (stills of every beat + words, graphics and sounds) to approve before the video is rendered
const boards = new Map();
route('POST', /^\/api\/projects\/([^/]+)\/storyboard$/, async (req, url, [name]) => {
  const s = slug(name);
  if (boards.get(s)?.state === 'rendering') return boards.get(s);
  const p = loadProject(projectDir(name));
  if (!p.ok) throw new Error(p.errors.join('\n'));
  const job = {state: 'rendering', progress: 0, url: null, error: null};
  boards.set(s, job);
  storyboardProject(p, path.join(OUT, `${s}-storyboard.html`), (x) => (job.progress = x), {baseUrl: `http://localhost:${PORT}`, title: name})
    .then(() => Object.assign(job, {state: 'done', progress: 1, url: `/_out/${s}-storyboard.html?t=${Date.now()}`}))
    .catch((e) => Object.assign(job, {state: 'error', error: e.message}));
  return job;
});
route('GET', /^\/api\/projects\/([^/]+)\/storyboard$/, async (req, url, [name]) => boards.get(slug(name)) ?? {state: 'idle'});

// ---------- Bulk: several independent videos in one workflow ----------
const BATCHES = path.join(ROOT, 'settings', 'batches');
const batchFile = (id) => path.join(BATCHES, `${slug(id)}.json`);
const loadBatch = (id) => {
  if (!fs.existsSync(batchFile(id))) throw new Error('Batch not found');
  return JSON.parse(fs.readFileSync(batchFile(id), 'utf8'));
};
const saveBatch = (b) => {
  fs.mkdirSync(BATCHES, {recursive: true});
  fs.writeFileSync(batchFile(b.id), JSON.stringify({...b, updated: Date.now()}, null, 2));
};
// a project name nobody uses yet
const freeProject = (base) => {
  const b = slug(base) || 'video';
  for (let k = 1; ; k++) {
    const n = k === 1 ? b : `${b.slice(0, 55)}_${k}`;
    if (!fs.existsSync(path.join(PROJECTS, n))) return n;
  }
};
function newItem(batchId, title, script, k) {
  const name = freeProject(title || `${batchId}_${k}`);
  const dir = projectDir(name);
  fs.mkdirSync(dir, {recursive: true});
  if (script?.trim()) fs.writeFileSync(path.join(dir, 'script.txt'), script.trim() + '\n');
  saveMeta(dir, {title: title || `Video ${k}`, batch: batchId, format: 'vertical'});
  return {project: name};
}
// everything the bulk page shows for one video
function itemStatus(project) {
  const s = slug(project);
  const dir = path.join(PROJECTS, s);
  const m = meta(dir);
  const read = (f) => (fs.existsSync(path.join(dir, f)) ? fs.readFileSync(path.join(dir, f), 'utf8') : '');
  return {
    project: s, title: m.title ?? s, script: read('script.txt'), timeline: read('timeline.json'),
    voice: m.voice ?? null, cover: m.cover ?? null,
    coverStamp: m.cover && fs.existsSync(path.join(dir, m.cover)) ? Math.round(fs.statSync(path.join(dir, m.cover)).mtimeMs) : null, aiVoice: m.aiVoice ?? null, voiceSpeed: m.voiceSpeed ?? 1, synced: Boolean(m.synced), seconds: m.seconds ?? null,
    planOk: m.planOk ?? null, plan: plans.get(s) ?? null, autoRender: Boolean(m.autoRender), tts: ttsJobs.get(s) ?? null, render: renders.get(s) ?? null, board: boards.get(s) ?? null,
    video: fs.existsSync(path.join(OUT, `${s}.mp4`)) ? `/_out/${s}.mp4?t=${Math.round(fs.statSync(path.join(OUT, `${s}.mp4`)).mtimeMs)}` : null,
  };
}
route('GET', /^\/api\/batches$/, async () => {
  if (!fs.existsSync(BATCHES)) return {batches: []};
  const list = fs.readdirSync(BATCHES).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(BATCHES, f), 'utf8')));
  return {batches: list.sort((a, b) => (b.updated ?? 0) - (a.updated ?? 0)).map((b) => ({id: b.id, name: b.name, count: b.items.length, updated: b.updated}))};
});
// new batch: {name, count} (empty videos to fill in) or {name, items: [{title, script}]}
route('POST', /^\/api\/batches$/, async (req) => {
  const {name, count, items} = JSON.parse(await readBody(req));
  const list = items?.length ? items : Array.from({length: Math.min(50, Math.max(1, Number(count) || 0))}, () => ({}));
  if (!list.length) throw new Error('Choose how many videos, or paste titles and scripts');
  if (list.length > 50) throw new Error('At most 50 videos in one batch');
  let id = slug(name || `batch_${new Date().toISOString().slice(0, 10)}`) || 'batch';
  for (let k = 2; fs.existsSync(batchFile(id)); k++) id = `${slug(name || 'batch')}_${k}`;
  const batch = {id, name: name || id, created: Date.now(), items: list.map((it, k) => newItem(id, it.title?.trim(), it.script, k + 1))};
  saveBatch(batch);
  return {id};
});
route('GET', /^\/api\/batches\/([^/]+)$/, async (req, url, [id]) => {
  const b = loadBatch(id);
  return {id: b.id, name: b.name, ai: aiReady(), items: b.items.map((it) => itemStatus(it.project))};
});
// more videos in a batch
route('POST', /^\/api\/batches\/([^/]+)\/add$/, async (req, url, [id]) => {
  const b = loadBatch(id);
  const {count = 1} = JSON.parse(await readBody(req));
  const n = b.items.length;
  for (let k = 1; k <= Math.min(20, count); k++) b.items.push(newItem(b.id, '', '', n + k));
  saveBatch(b);
  return {count: b.items.length};
});
// take a video out of the batch (its project stays in the single-video list)
route('POST', /^\/api\/batches\/([^/]+)\/remove$/, async (req, url, [id]) => {
  const b = loadBatch(id);
  const {project} = JSON.parse(await readBody(req));
  b.items = b.items.filter((it) => it.project !== slug(project));
  saveBatch(b);
  return {count: b.items.length};
});
route('POST', /^\/api\/batches\/([^/]+)\/delete$/, async (req, url, [id]) => {
  fs.rmSync(batchFile(id), {force: true});
  return {ok: true};
});
// title / script of one video
route('POST', /^\/api\/projects\/([^/]+)\/details$/, async (req, url, [name]) => {
  const dir = projectDir(name);
  fs.mkdirSync(dir, {recursive: true});
  const {title, script} = JSON.parse(await readBody(req));
  if (title !== undefined) saveMeta(dir, {title: String(title).slice(0, 120)});
  if (script !== undefined) {
    const old = fs.existsSync(path.join(dir, 'script.txt')) ? fs.readFileSync(path.join(dir, 'script.txt'), 'utf8').trim() : '';
    fs.writeFileSync(path.join(dir, 'script.txt'), String(script).trim() + '\n');
    // a new script needs a new voice / sync
    if (old && old !== String(script).trim()) saveMeta(dir, {synced: false});
  }
  return itemStatus(name);
});
// AI voices for the videos of a batch (all, or only those without a voiceover), one after another
route('POST', /^\/api\/batches\/([^/]+)\/tts$/, async (req, url, [id]) => {
  const b = loadBatch(id);
  const {voice = 'am_michael', speed = 1.1, all = false} = JSON.parse(await readBody(req));
  let queued = 0, skipped = 0;
  for (const it of b.items) {
    const st = itemStatus(it.project);
    if (!st.script.trim() || (!all && st.voice && st.synced)) { skipped++; continue; }
    try { startTts(it.project, st.script, voice, speed); queued++; } catch { skipped++; }
  }
  return {queued, skipped};
});
// one master prompt for all the videos of a batch (no voices needed: the times are words of the scripts)
route('GET', /^\/api\/batches\/([^/]+)\/prompt$/, async (req, url, [id]) => {
  const b = loadBatch(id);
  const videos = b.items.map((it, k) => {
    const dir = projectDir(it.project);
    const wordsFile = path.join(dir, 'words.json');
    const script = meta(dir).synced && fs.existsSync(wordsFile)
      ? JSON.parse(fs.readFileSync(wordsFile, 'utf8')).words.map((w) => w.text).join(' ')
      : (fs.existsSync(path.join(dir, 'script.txt')) ? fs.readFileSync(path.join(dir, 'script.txt'), 'utf8') : '');
    return {n: k + 1, title: meta(dir).title || it.project, script};
  }).filter((v) => v.script.trim());
  if (!videos.length) throw new Error('No scripts yet: add the scripts first');
  const first = projectDir(b.items[0].project);
  return {prompt: buildBatchPrompt(loadLibrary(first), videos, meta(first).format || 'vertical'), count: videos.length};
});
// Claude's answer for the whole batch -> one JSON per video, checked and saved to each video.
// Videos are found by "=== VIDEO n ===" / "VIDEO n" lines (or file numbers); without them, the JSON objects in order.
function splitPlans(text) {
  const marks = [...text.matchAll(/^[^\S\n]*[#=*>\-\s]*video\s*#?\s*(\d+)\b[^\n]*$/gim)];
  if (marks.length) {
    return marks.map((m, k) => ({n: Number(m[1]), text: text.slice(m.index + m[0].length, k + 1 < marks.length ? marks[k + 1].index : text.length)}))
      .filter((x) => /"scenes"\s*:/.test(x.text));
  }
  const out = [];
  let depth = 0, inStr = false, esc = false, from = -1;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true;
    else if (ch === '{') { if (depth++ === 0) from = i; }
    else if (ch === '}' && depth > 0 && --depth === 0) out.push(text.slice(from, i + 1));
  }
  return out.filter((t) => /"scenes"\s*:/.test(t)).map((t, k) => ({n: k + 1, text: t}));
}
route('POST', /^\/api\/batches\/([^/]+)\/plans$/, async (req, url, [id]) => {
  const b = loadBatch(id);
  const found = splitPlans((await readBody(req)).toString('utf8'));
  if (!found.length) throw new Error('No JSON plans found in what you pasted. Paste Claude\'s whole answer, or open the .json files.');
  // Reject ambiguous numbering before saving any video. A repeated marker must
  // never silently overwrite the first plan or enqueue a render of stale content.
  const seen = new Set();
  const duplicates = new Set();
  for (const {n} of found) {
    if (seen.has(n)) duplicates.add(n);
    seen.add(n);
  }
  if (duplicates.size) throw new Error(`Duplicate VIDEO number(s): ${[...duplicates].join(', ')}. Keep one plan per video and paste again.`);
  const results = [];
  for (const {n, text} of found) {
    const it = b.items[n - 1];
    if (!it) { results.push({n, ok: false, error: `there is no video ${n} in this batch`}); continue; }
    const dir = projectDir(it.project);
    const synced = Boolean(meta(dir).synced);
    let r;
    try {
      r = await checkTimelineText(it.project, text, LOCAL_URL);
    } catch (e) {
      // no voice yet: the JSON was read and saved, its phrases are checked once the voice exists
      if (synced) throw e;
      r = {ok: false, saved: true};
    }
    if (!synced && !r.saved && !r.ok) { results.push({n, project: it.project, ok: false, error: r.errors?.[0], errors: r.errors?.length ?? 1}); continue; }
    // without a voice the plan is kept and checked as soon as the voice is ready
    saveMeta(dir, {planOk: synced ? r.ok : null});
    if (synced && r.ok) autoRender(it.project);
    results.push({n, project: it.project, ok: r.ok, waiting: !synced, error: r.ok || !synced ? null : r.errors?.[0], errors: r.ok || !synced ? 0 : r.errors?.length ?? 1});
  }
  return {results};
});
// "Do it all": voices for videos without one, AI plans where there is no plan (if an AI is set up), then every video
// with a valid plan goes to the render queue by itself. Each video keeps going on its own; one failure never stops the rest.
route('POST', /^\/api\/batches\/([^/]+)\/run$/, async (req, url, [id]) => {
  const b = loadBatch(id);
  const {voice = 'am_michael', speed = 1.1, ai = true} = JSON.parse((await readBody(req)).toString() || '{}');
  const useAi = ai && aiReady();
  const res = {voices: 0, plans: 0, renders: 0, waiting: [], noScript: []};
  for (const it of b.items) {
    const st = itemStatus(it.project);
    const dir = projectDir(it.project);
    if (!st.script.trim()) { res.noScript.push(it.project); continue; }
    saveMeta(dir, {autoRender: true, autoPlan: useAi && !st.timeline});
    if (!st.synced) {
      try { startTts(it.project, st.script, voice, speed); res.voices++; } catch { res.noScript.push(it.project); }
      if (!st.timeline && !useAi) res.waiting.push(it.project);
      continue;
    }
    if (st.timeline) {
      const r = await checkTimelineText(it.project, st.timeline, LOCAL_URL);
      saveMeta(dir, {planOk: r.ok});
      if (r.ok) { autoRender(it.project); res.renders++; } else res.waiting.push(it.project);
    } else if (useAi) { queueAiPlan(it.project); res.plans++; } else res.waiting.push(it.project);
  }
  return {...res, ai: useAi};
});
// AI plans (from the AI settings) for every video of a batch that has a voice but no valid plan yet
route('POST', /^\/api\/batches\/([^/]+)\/aiplans$/, async (req, url, [id]) => {
  if (!aiReady()) throw new Error('No AI is set up yet: open the Library tab → AI settings (Gemini, OpenAI or Claude Code).');
  const b = loadBatch(id);
  let queued = 0;
  for (const it of b.items) {
    const st = itemStatus(it.project);
    if (st.planOk) continue;
    if (!st.synced) { saveMeta(projectDir(it.project), {autoPlan: true}); continue; } // planned as soon as its voice is ready
    queueAiPlan(it.project); queued++;
  }
  return {queued};
});
// render every video of a batch whose plan is valid; the others are reported, the rest keep going
route('POST', /^\/api\/batches\/([^/]+)\/render$/, async (req, url, [id]) => {
  const b = loadBatch(id);
  const {onlyMissing = false} = JSON.parse((await readBody(req)).toString() || '{}');
  const res = [];
  for (const it of b.items) {
    const st = itemStatus(it.project);
    if (!st.timeline) { res.push({project: it.project, state: 'skipped', error: 'no JSON yet'}); continue; }
    if (onlyMissing && st.video) { res.push({project: it.project, state: 'skipped', error: 'already rendered'}); continue; }
    const job = enqueueRender(it.project);
    res.push({project: it.project, state: job.state, error: job.error});
  }
  return {items: res};
});
// all finished videos of a batch in one ZIP, named in batch order
route('GET', /^\/api\/batches\/([^/]+)\/zip$/, async (req, url, [id]) => {
  const b = loadBatch(id);
  const files = b.items.map((it, k) => {
    const f = path.join(OUT, `${it.project}.mp4`);
    if (!fs.existsSync(f)) return null;
    const title = slug(meta(path.join(PROJECTS, it.project)).title || it.project) || it.project;
    return {name: `${String(k + 1).padStart(2, '0')}_${title}.mp4`, data: fs.readFileSync(f)};
  }).filter(Boolean);
  if (!files.length) throw new Error('No finished videos yet');
  return {raw: makeZip(files), type: 'application/zip', filename: `${b.id}.zip`};
});

// ---------- server ----------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    for (const r of routes) {
      const m = req.method === r.method && url.pathname.match(r.pattern);
      if (m) {
        const out = await r.fn(req, url, m.slice(1).map(decodeURIComponent));
        if (out?.raw !== undefined) { // a file download
          res.writeHead(200, {'Content-Type': out.type, 'Content-Disposition': `attachment; filename="${out.filename}"`, 'Cache-Control': 'no-store'});
          return res.end(out.raw);
        }
        return send(res, 200, out);
      }
    }
    if (url.pathname.startsWith('/api/')) return send(res, 404, {error: 'unknown API'});
    if (url.pathname === '/') return send(res, 200, INDEX, 'text/html');
    if (url.pathname === '/favicon.ico') { res.writeHead(204); return res.end(); }
    if (url.pathname.startsWith('/_ui/')) return serveFile(res, path.join(UI_DIST, path.basename(url.pathname)), req);
    if (url.pathname.startsWith('/_out/')) return serveFile(res, path.join(OUT, path.basename(url.pathname)), req);
    // saved AI voices (kept outside public/, so the renderer never copies them)
    if (url.pathname.startsWith('/_voices/')) return serveFile(res, path.join(VOICES_DIR, path.basename(url.pathname, '.wav'), 'voice.wav'), req);
    // everything else: files under public/ (library images, voiceovers) for the preview player
    const file = path.normalize(path.join(PUBLIC, decodeURIComponent(url.pathname)));
    if (!file.startsWith(PUBLIC)) return send(res, 403, {error: 'forbidden'});
    return serveFile(res, file, req);
  } catch (e) {
    console.error(`  ${req.method} ${url.pathname}: ${e.message}`);
    if (res.headersSent) return res.end();
    return send(res, 400, {error: e.message});
  }
});

// one failing request must never stop the tool
process.on('uncaughtException', (e) => console.error('  Error (the tool keeps running):', e.message));
process.on('unhandledRejection', (e) => console.error('  Error (the tool keeps running):', e?.message || e));

await buildUi();
server.listen(PORT, () => {
  console.log(`\n  Reel Engine is running → http://localhost:${PORT}\n`);
  // AI voices made before the voice library existed are saved once, so they can be reused
  try { const n = importProjectVoices(); if (n) console.log(`  ${n} earlier AI voice(s) saved to the voice library.`); } catch { /* ignore */ }
  if (!PYTHON) console.log('  Note: Python was not found. Voiceover sync and image import need Python (see README).');
});
