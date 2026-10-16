// Shared render function for the CLI (scripts/render.mjs) and the web tool (tools/server.mjs).
import path from 'node:path';
import fs from 'node:fs';
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {storyboardBeats} from '../src/storyboard.js';
import {browserExecutable, ROOT} from './project.mjs';

let bundlePromise;
const getBundle = () => (bundlePromise ??= bundle({entryPoint: path.join(ROOT, 'src/index.jsx'), publicDir: path.join(ROOT, 'public')}));

export async function renderProject(project, out, onProgress = () => {}, {baseUrl} = {}) {
  fs.mkdirSync(path.dirname(out), {recursive: true});
  const serveUrl = await getBundle();
  const inputProps = {timeline: project.timeline, library: project.library, ...(baseUrl ? {baseUrl} : {})};
  const exe = browserExecutable();
  const composition = await selectComposition({serveUrl, id: 'Reel', inputProps, browserExecutable: exe});
  await renderMedia({
    composition, serveUrl, inputProps, browserExecutable: exe,
    codec: 'h264', audioCodec: 'aac', crf: 15, x264Preset: 'medium',
    outputLocation: out,
    onProgress: ({progress}) => onProgress(progress),
  });
  return {frames: composition.durationInFrames, fps: composition.fps};
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const mmss = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;

// Storyboard: one still per beat (a moment after it starts, when its animation has landed) with the words,
// what appears on screen and the sounds, in one self-contained HTML page to approve before rendering the video.
export async function storyboardProject(project, out, onProgress = () => {}, {baseUrl, title} = {}) {
  fs.mkdirSync(path.dirname(out), {recursive: true});
  const serveUrl = await getBundle();
  const inputProps = {timeline: project.timeline, library: project.library, ...(baseUrl ? {baseUrl} : {})};
  const exe = browserExecutable();
  const composition = await selectComposition({serveUrl, id: 'Reel', inputProps, browserExecutable: exe});
  const beats = storyboardBeats(project.timeline);
  const tmp = fs.mkdtempSync(path.join(path.dirname(out), '.sb-'));
  const panels = [];
  try {
    for (let i = 0; i < beats.length; i++) {
      const b = beats[i];
      const at = b.still;
      const frame = Math.max(0, Math.min(composition.durationInFrames - 1, Math.round(at * composition.fps)));
      const file = path.join(tmp, `${i}.jpeg`);
      await renderStill({composition, serveUrl, inputProps, browserExecutable: exe, frame, output: file, imageFormat: 'jpeg', jpegQuality: 80, scale: 0.4});
      panels.push({...b, img: `data:image/jpeg;base64,${fs.readFileSync(file).toString('base64')}`});
      onProgress((i + 1) / beats.length);
    }
  } finally {
    fs.rmSync(tmp, {recursive: true, force: true});
  }
  const t = project.timeline;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Storyboard ${esc(title ?? t.title ?? '')}</title><style>
body{margin:0;padding:16px;font-family:system-ui,sans-serif;background:#F4F4F7;color:#16161D}
h1{margin:0 0 4px;font-size:22px}.meta{color:#5A5A6A;margin-bottom:16px;font-size:14px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}
.card{background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.12)}
.card img{width:100%;display:block;background:#ddd}.body{padding:10px 12px 12px;font-size:13px;line-height:1.4}
.top{display:flex;justify-content:space-between;font-weight:700;margin-bottom:6px}.num{background:#16161D;color:#fff;border-radius:6px;padding:0 7px}
.scene{background:#FFE7A3;border-radius:6px;padding:2px 6px;font-size:12px;margin-bottom:6px;display:inline-block}
.voice{font-style:italic;margin-bottom:6px}.lbl{font-weight:700;color:#5A5A6A;font-size:11px;text-transform:uppercase;margin-top:4px}
ul{margin:2px 0 0;padding-left:18px}</style></head><body>
<h1>Storyboard: ${esc(title ?? t.title ?? 'video')}</h1>
<div class="meta">${beats.length} beats · ${mmss(Math.max(...beats.map((b) => b.until)))} · theme ${esc(t.theme ?? 'classic')} · approve this before rendering the video</div>
<div class="grid">${panels.map((p, i) => `<div class="card"><img src="${p.img}" alt="beat ${i + 1}"><div class="body">
<div class="top"><span class="num">${i + 1}</span><span>${mmss(p.t)}–${mmss(p.until)}</span></div>
${p.sceneStart ? `<div class="scene">${esc(p.sceneId)} · ${esc(p.backdrop)}${p.transition && p.transition !== 'cut' ? ` · ${esc(p.transition)}` : ''}</div>` : ''}
${p.voice ? `<div class="voice">“${esc(p.voice)}”</div>` : ''}
${p.onScreen.length ? `<div class="lbl">On screen</div><ul>${p.onScreen.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
${p.sounds.length ? `<div class="lbl">Sound</div><div>${p.sounds.map(esc).join(', ')}</div>` : ''}
</div></div>`).join('')}</div></body></html>`;
  fs.writeFileSync(out, html);
  return {beats: beats.length};
}
