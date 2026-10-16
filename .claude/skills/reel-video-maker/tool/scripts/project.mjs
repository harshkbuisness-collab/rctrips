// Shared loader: reads a project folder, merges asset libraries, inlines word
// timings and validates everything before Remotion sees it.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {checkTimeline, LibrarySchema} from '../src/schema.js';
import {resolveTimeline} from '../src/timeRefs.js';

// fileURLToPath, not URL.pathname: on Windows the latter gives "/C:/..." and breaks every path
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PUBLIC = path.join(ROOT, 'public');

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    throw new Error(`Cannot read ${path.relative(ROOT, file)}: ${e.message}`);
  }
};

// Reusable libraries (public/library/library.json and one per set, e.g.
// public/library/hero/library.json) + optional project-only library. Later ids win.
// Asset files become paths relative to public/.
export function loadLibrary(projectDir) {
  const libRoot = path.join(PUBLIC, 'library');
  const setLibs = fs.existsSync(libRoot)
    ? fs.readdirSync(libRoot, {withFileTypes: true}).filter((d) => d.isDirectory()).map((d) => path.join(libRoot, d.name, 'library.json')).sort()
    : [];
  const assets = new Map();
  for (const file of [path.join(libRoot, 'library.json'), ...setLibs, ...(projectDir ? [path.join(projectDir, 'library.json')] : [])]) {
    if (!fs.existsSync(file)) continue;
    const lib = LibrarySchema.parse(readJson(file));
    const base = path.dirname(file);
    for (const a of lib.assets) {
      const filePath = path.relative(PUBLIC, path.join(base, a.file)).split(path.sep).join('/');
      assets.set(a.id, {...a, file: filePath});
    }
  }
  return {assets: [...assets.values()]};
}

// Accepts a project folder (public/projects/demo) or a timeline.json path.
export function loadProject(target) {
  const abs = path.resolve(target);
  const timelineFile = fs.statSync(abs).isDirectory() ? path.join(abs, 'timeline.json') : abs;
  const dir = path.dirname(timelineFile);
  if (!dir.startsWith(PUBLIC)) throw new Error('Projects must live under public/ (e.g. public/projects/<name>/) so the renderer can read their files.');
  const rel = (p) => path.relative(PUBLIC, path.join(dir, p)).split(path.sep).join('/');

  const library = loadLibrary(dir);
  const assets = new Map(library.assets.map((x) => [x.id, x]));

  const raw = readJson(timelineFile);
  if (raw.wordsFile && !raw.words?.length) {
    const w = readJson(path.join(dir, raw.wordsFile));
    raw.words = Array.isArray(w) ? w : w.words;
  }
  // Times written as script words ("lift your legs") become seconds.
  const timeErrors = resolveTimeline(raw, raw.words || []);
  // Paths inside the timeline (voice, sfx, direct asset paths) are relative to the project folder;
  // "library/..." paths (shared background music) are relative to public/.
  const fix = (p) => (!p || assets.has(p) || /^(https?:|data:|library\/)/.test(p) ? p : rel(p));
  if (raw.audio) {
    raw.audio.voice = fix(raw.audio.voice);
    raw.audio.music = fix(raw.audio.music);
  }
  const badSounds = (raw.sfx || []).filter((s) => /^sfx_/.test(s.src) && !assets.has(s.src)).map((s) => s.src);
  (raw.sfx || []).forEach((s) => (s.src = fix(s.src)));
  if (raw.cover?.src) raw.cover.src = fix(raw.cover.src);

  const result = checkTimeline(raw, library);
  if (badSounds.length) {
    result.errors.push(...[...new Set(badSounds)].map((id) => `unknown sound "${id}": use only ids from the Sound effects list`));
    result.ok = false;
  }
  if (timeErrors.length) {
    result.errors.unshift(...timeErrors);
    result.ok = false;
  }
  // check that referenced files exist on disk
  if (result.ok) {
    const missing = [];
    const need = (p) => p && !/^(https?:|data:)/.test(p) && !fs.existsSync(path.join(PUBLIC, assets.get(p)?.file ?? p)) && missing.push(p);
    need(result.timeline.audio.voice);
    need(result.timeline.audio.music);
    result.timeline.sfx.forEach((s) => !/^sfx_/.test(s.src) && need(s.src));
    need(result.timeline.cover?.src);
    library.assets.forEach((a) => need(a.id));
    missing.forEach((m) => result.errors.push(`file not found: ${m}`));
    result.ok = result.errors.length === 0;
  }
  return {...result, library, dir, timelineFile};
}

export function report(result) {
  for (const w of result.warnings) console.log(`  warning: ${w}`);
  for (const e of result.errors) console.log(`  ERROR:   ${e}`);
  console.log(result.ok ? '✔ timeline is valid' : `✘ ${result.errors.length} error(s) — fix them (or paste them back to the AI) and retry`);
}

export function browserExecutable() {
  if (process.env.REMOTION_BROWSER_EXECUTABLE) return process.env.REMOTION_BROWSER_EXECUTABLE;
  const shell = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
  return fs.existsSync(shell) ? shell : null; // null → Remotion downloads its own
}
