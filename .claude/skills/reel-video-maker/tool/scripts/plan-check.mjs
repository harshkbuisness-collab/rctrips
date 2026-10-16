// Checks a JSON plan against its script without the server and without a voice, the way the tool will:
// phrase times, schema, asset / sound ids, body parts, then the editor's quality notes (tools/reel_check.py).
//
//   node scripts/plan-check.mjs <script.txt> <plan.json> [--words words.json] [--speed 1.1] [--json]
//   node scripts/plan-check.mjs --library      lists every image, prop and sound id a plan may use
//
// Without --words the word times are ESTIMATED from the script (fitted on real Kokoro am_michael 1.1x voices:
// about 0.07 s per letter, +0.5 s after a sentence, +0.3 s after a comma). Phrase errors, ids and schema are exact;
// timing notes (hook length, empty moments, sound spacing) are close but final only with the real words.json.
// Exit code: 0 = valid (quality notes may remain), 1 = errors.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {loadProject, PUBLIC, ROOT, loadLibrary} from './project.mjs';
import {buildPrompt, libraryText} from '../tools/prompt.mjs';

const args = process.argv.slice(2);
// the ids a plan may use: every library (public/library/library.json + hero/, sfx/, music/ …), exactly as the prompt lists them
if (args[0] === '--library') {
  console.log(libraryText(loadLibrary(null)));
  process.exit(0);
}
const flag = (name) => {
  const k = args.indexOf(name);
  if (k < 0) return null;
  const v = args[k + 1];
  args.splice(k, 2);
  return v;
};
const asJson = args.includes('--json');
if (asJson) args.splice(args.indexOf('--json'), 1);
const wordsFile = flag('--words');
const speed = Number(flag('--speed') || 1.1);
const [scriptFile, planFile] = args;
if (!scriptFile || !planFile) {
  console.log('usage: node scripts/plan-check.mjs <script.txt> <plan.json> [--words words.json] [--speed 1.1] [--json]');
  process.exit(2);
}

// estimated word times for a script (seconds), at the given voice speed
function estimateWords(script, voiceSpeed = 1.1) {
  const k = 1.1 / voiceSpeed;
  let t = 0;
  return script.split(/\s+/).filter(Boolean).map((text) => {
    const letters = text.replace(/[^\p{L}\p{N}]/gu, '').length;
    const say = Math.max(0.12, 0.0675 * letters - 0.03) * k;
    const w = {text, start: Math.round(t * 1000) / 1000, end: Math.round((t + say * 0.9) * 1000) / 1000};
    t += say + (/[.!?…]$/.test(text) ? 0.5 : /[,;:]$/.test(text) ? 0.3 : 0) * k;
    return w;
  });
}

const script = fs.readFileSync(scriptFile, 'utf8');
const planText = fs.readFileSync(planFile, 'utf8');
let words;
try {
  words = wordsFile ? JSON.parse(fs.readFileSync(wordsFile, 'utf8')).words : estimateWords(script, speed);
} catch (e) {
  console.error(`Cannot read the words file: ${e.message}`);
  process.exit(2);
}

const out = {ok: false, estimatedTimes: !wordsFile, errors: [], warnings: [], quality: []};
let raw;
try {
  raw = JSON.parse(planText.replace(/```(?:json)?/gi, '').trim());
} catch (e) {
  out.errors.push(`The JSON is not valid: ${e.message}`);
}

if (raw) {
  // a throw-away project under public/ (the loader only reads projects there), removed afterwards
  const dir = fs.mkdtempSync(path.join(PUBLIC, 'projects', '.plancheck-'));
  try {
    const plan = {...raw, canvas: {width: 1080, height: 1920, fps: 30, background: '#FFFFFF'}, wordsFile: 'words.json', duration: raw.duration ?? 'end'};
    delete plan.audio;
    fs.writeFileSync(path.join(dir, 'timeline.json'), JSON.stringify(plan));
    fs.writeFileSync(path.join(dir, 'words.json'), JSON.stringify({words}));
    fs.writeFileSync(path.join(dir, 'script.txt'), script);
    const r = loadProject(dir);
    out.ok = r.ok;
    out.errors.push(...r.errors);
    out.warnings.push(...r.warnings);
    // the editor's quality notes, with the same request text the tool uses
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'plancheck-'));
    try {
      fs.writeFileSync(path.join(tmp, 'request.txt'), buildPrompt(loadLibrary(dir), script, 'vertical'));
      fs.writeFileSync(path.join(tmp, 'plan.json'), planText);
      const py = process.platform === 'win32' ? 'python' : 'python3';
      const q = spawnSync(py, ['tools/reel_check.py', path.join(tmp, 'request.txt'), path.join(tmp, 'plan.json'), '--words', path.join(dir, 'words.json'), '--json'],
        {cwd: ROOT, encoding: 'utf8', env: {...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1'}});
      if (q.status === 0) out.quality = JSON.parse(q.stdout).quality || [];
      else out.warnings.push(`quality check did not run: ${(q.stderr || q.stdout || '').trim().split('\n').pop()}`);
    } finally {
      fs.rmSync(tmp, {recursive: true, force: true});
    }
  } finally {
    fs.rmSync(dir, {recursive: true, force: true});
  }
}

if (asJson) {
  console.log(JSON.stringify(out, null, 1));
} else {
  if (out.estimatedTimes) console.log('(word times estimated from the script: phrases, ids and schema are exact; timing notes are approximate)');
  for (const e of out.errors) console.log(`  ERROR:   ${e}`);
  for (const w of out.warnings) console.log(`  warning: ${w}`);
  for (const q of out.quality) console.log(`  quality: ${q}`);
  console.log(out.ok ? `✔ valid${out.quality.length ? `, ${out.quality.length} quality note(s)` : ', no quality notes'}` : `✘ ${out.errors.length} error(s)`);
}
process.exit(out.ok ? 0 : 1);
