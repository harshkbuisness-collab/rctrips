'use client';
import React, {useRef, useState} from 'react';
import {Player} from '@remotion/player';
import {Reel} from './remotion/Reel.jsx';
import {FORMATS, DEFAULT_SETTINGS, parseTiming, buildProject} from './engine/plan.js';
import {LOOKS, getLook} from './engine/looks.js';
import {ICON_NAMES} from './engine/icons.js';
import {STICKERS} from './engine/stickers.js';
import {LIBRARY} from './engine/library.js';

const OBJECTS = LIBRARY.filter((x) => x.kind === 'object');
const REACTIONS = LIBRARY.filter((x) => x.kind === 'reaction');
import {getAudioDuration, uploadMedia, renderVideo} from './cloud.js';

// Numbers match the voice sample file.
const VOICES = [
  ['en-US-BrianMultilingualNeural', '4 · Brian — US, male'],
  ['en-US-ChristopherNeural', '6 · Christopher — US, male'],
  ['en-US-AvaMultilingualNeural', '7 · Ava — US, female'],
  ['en-US-EmmaMultilingualNeural', '8 · Emma — US, female'],
  ['en-GB-RyanNeural', '9 · Ryan — British, male'],
  ['en-AU-WilliamMultilingualNeural', '10 · William — Australian, male'],
];

const F = ({label, children}) => <label className="field"><span>{label}</span>{children}</label>;
const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
// Shrink a picture to a JPEG data URL (max 1280px) so it travels inside the project to the renderer.
const imageToDataUrl = (file) => new Promise((resolve, reject) => {
  const img = new Image(), u = URL.createObjectURL(file);
  img.onload = () => {
    const k = Math.min(1, 1280 / Math.max(img.width, img.height));
    const cv = document.createElement('canvas'); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(u);
    resolve(cv.toDataURL('image/jpeg', 0.82));
  };
  img.onerror = () => { URL.revokeObjectURL(u); reject(new Error('Could not read image')); };
  img.src = u;
});
// Bulk image markers: "[2] Pick a voice" puts picture 2 on the scene that says "Pick a voice".
const norm = (t) => String(t).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
function takeMarkers(text) {
  const marks = [];
  const clean = text.replace(/\[(\d{1,2})\]\s*/g, (m, n, at) => {
    marks.push({n: Number(n), next: text.slice(at + m.length).replace(/\[\d{1,2}\]/g, '').split(/\s+/).map(norm).filter(Boolean).slice(0, 3)});
    return '';
  });
  return {clean, marks};
}
function placeImages(p, words, marks, images) {
  for (const {n, next} of marks) {
    const image = images[n - 1]?.url;
    if (!image || !next.length) continue;
    const i = words.findIndex((_, k) => next.every((x, j) => norm(words[k + j]?.text || '') === x));
    const t = words[i]?.start;
    const scene = i < 0 ? null : p.scenes.find((sc) => sc.words.some((w) => w.start === t));
    if (scene) scene.image = image;
  }
  return p;
}
const isLocal = () => ['localhost', '127.0.0.1'].includes(window.location.hostname);

export default function ReelEditor() {
  const [timing, setTiming] = useState(null); // {words, duration}
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [media, setMedia] = useState({audioVolume: 1, musicVolume: 0.05});
  const [project, setProject] = useState(null);
  const [script, setScript] = useState('');
  const [voice, setVoice] = useState(VOICES[0][0]);
  const [speed, setSpeed] = useState(12);
  const [status, setStatus] = useState('Paste your script and click Generate voice — or upload your own audio + timing JSON.');
  const [busy, setBusy] = useState(false);
  const player = useRef(null);

  const rebuild = (t = timing, s = settings, m = media) => t && setProject(buildProject({words: t.words, duration: Math.max(t.duration, m.audioDurationSec || 0), settings: s, media: m}));
  // Theme and format only restyle, so the user's scene edits are kept; the rest re-plan the scenes.
  const RESTYLE = {lookId: (v) => ({look: getLook(v)}), format: (v) => FORMATS[v]};
  const setSetting = (key, value) => {
    const s = {...settings, [key]: value}; setSettings(s);
    if (project && RESTYLE[key]) setProject((p) => ({...p, settings: s, ...RESTYLE[key](value)}));
    else rebuild(timing, s);
  };
  const setMediaField = (patch) => { const m = {...media, ...patch}; setMedia(m); setProject((p) => (p ? {...p, ...patch} : p)); };
  const updateScene = (id, fn) => setProject((p) => ({...p, scenes: p.scenes.map((s) => (s.id === id ? fn(s) : s))}));
  const updateWord = (id, wi, patch) => updateScene(id, (s) => ({...s, words: s.words.map((w, i) => (i === wi ? {...w, ...patch} : w))}));
  const toggleHero = (id, wi) => updateScene(id, (s) => ({...s, words: s.words.map((w, i) => ({...w, hero: i === wi ? !w.hero : s.type === 'hero' ? false : w.hero}))}));

  // Attach a voice file: local preview URL + a server copy for the MP4 renderer.
  async function attachVoice(file, t) {
    const duration = await getAudioDuration(file);
    const {pathname} = await uploadMedia(file, 'voice', setStatus);
    const m = {...media, audioSrc: URL.createObjectURL(file), audioBlobPath: pathname, audioFileName: file.name, audioDurationSec: duration};
    setMedia(m);
    if (t) rebuild(t, settings, m); else setProject((p) => (p ? {...p, ...m} : p));
  }

  // Script → MP3 file + word timings (Edge voices via /api/tts, or /api/tts-local on localhost).
  async function scriptToVoice(text) {
    const res = await fetch(isLocal() ? '/api/tts-local' : '/api/tts', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({text, voice, speed})});
    const d = await res.json().catch(() => ({}));
    if (!res.ok || d.error) throw new Error(d.error || `Voice service error (${res.status})`);
    const bytes = Uint8Array.from(atob(d.audio), (c) => c.charCodeAt(0));
    return {file: new File([bytes], 'voice.mp3', {type: 'audio/mpeg'}), timing: parseTiming({words: d.words})};
  }

  async function generateVoice() {
    if (!script.trim()) return setStatus('Paste a script first');
    setBusy(true);
    try {
      setStatus('Generating voice...');
      const {file, timing: t} = await scriptToVoice(script);
      setTiming(t);
      await attachVoice(file, t);
      setStatus(`✓ Voice ready • ${t.words.length} words • video planned`);
    } catch (e) { setStatus(`Error: ${e.message}`); }
    setBusy(false);
  }

  async function onTiming(file) {
    if (!file) return;
    try {
      const t = parseTiming(await file.text());
      setTiming(t); rebuild(t);
      setStatus(`✓ ${t.words.length} words • ${t.duration.toFixed(1)}s`);
    } catch (e) { setStatus(`Error: ${e.message}`); }
  }

  async function onAudio(file, kind) {
    if (!file) return;
    setBusy(true);
    try {
      if (kind === 'voice') await attachVoice(file, timing);
      else {
        const {pathname} = await uploadMedia(file, 'music', setStatus);
        setMediaField({musicSrc: URL.createObjectURL(file), musicBlobPath: pathname, musicFileName: file.name});
      }
      setStatus(`✓ ${kind === 'voice' ? 'Voice' : 'Music'} ready`);
    } catch (e) { setStatus(`Error: ${e.message}`); }
    setBusy(false);
  }

  async function onImage(id, file) {
    if (!file) return;
    try {
      const image = await imageToDataUrl(file);
      updateScene(id, (x) => ({...x, image}));
      setStatus('✓ Image added to scene');
    } catch (e) { setStatus(`Error: ${e.message}`); }
  }

  async function onRender() {
    if (!project?.audioBlobPath) return setStatus('Generate or upload the voice first');
    if (JSON.stringify(project).length > 4e6) return setStatus('Too many images — the limit is about 15 per video. Remove a few and try again.');
    setBusy(true);
    try { await renderVideo(project, setStatus); } catch (e) { setStatus(`Error: ${e.message}`); }
    setBusy(false);
  }

  // Bulk: one script per block (separated by a line with ---), each turned into voice + MP4 in turn.
  const [bulkText, setBulkText] = useState('');
  const [bulkMode, setBulkMode] = useState('same');
  const [rows, setRows] = useState([]);
  const [bulkImages, setBulkImages] = useState([]);
  const stopBulk = useRef(false);
  async function onBulkImages(files) {
    try {
      const add = await Promise.all([...files].map(async (f) => ({name: f.name, url: await imageToDataUrl(f)})));
      setBulkImages((x) => [...x, ...add].slice(0, 30));
    } catch (e) { setStatus(`Error: ${e.message}`); }
  }
  const splitScripts = (text) => text.split(/^\s*-{3,}\s*$/m).map((x) => x.trim()).filter(Boolean).slice(0, 30);
  const setRow = (i, patch) => setRows((r) => r.map((x, j) => (j === i ? {...x, ...patch} : x)));
  async function runBulk(onlyFailed) {
    const list = onlyFailed ? rows : splitScripts(bulkText).map((text, i) => ({text, status: 'Waiting', lookId: bulkMode === 'same' ? settings.lookId
      : bulkMode === 'rotate' ? LOOKS[i % LOOKS.length].id : LOOKS[Math.floor(Math.random() * LOOKS.length)].id}));
    if (!list.length) return setStatus('Paste scripts first (separate them with a line containing ---)');
    if (!onlyFailed) setRows(list);
    stopBulk.current = false;
    setBusy(true);
    for (let i = 0; i < list.length; i++) {
      if (stopBulk.current) break;
      if (onlyFailed && !list[i].status.startsWith('Error')) continue;
      const say = (s) => setRow(i, {status: s});
      try {
        say('Voice…');
        const {clean, marks} = takeMarkers(list[i].text);
        const {file, timing: t} = await scriptToVoice(clean);
        const {pathname} = await uploadMedia(file, 'voice', () => {});
        const duration = await getAudioDuration(file);
        const p = buildProject({words: t.words, duration: Math.max(t.duration, duration), settings: {...settings, lookId: list[i].lookId},
          media: {...media, audioSrc: '', audioBlobPath: pathname, audioDurationSec: duration}});
        placeImages(p, t.words, marks, bulkImages);
        p.title = `reel-${String(i + 1).padStart(2, '0')}-${list[i].text.split(/\s+/).slice(0, 4).join('-').replace(/[^a-zA-Z0-9-]+/g, '')}`;
        // Show it in the preview player so you can see the template while it renders.
        const view = {...p, audioSrc: URL.createObjectURL(file)};
        setRow(i, {view}); setProject(view);
        await renderVideo(p, (s) => say(s.replace(/^Render complete.*/, 'Rendering…')));
        say('Done ✓');
      } catch (e) { say(`Error: ${e.message}`); }
    }
    setBusy(false);
    setStatus(stopBulk.current ? 'Bulk stopped' : 'Bulk finished');
  }

  const seek = (sec) => { player.current?.seekTo(Math.round(sec * 30)); player.current?.pause(); };
  const opt = (list) => list.map(([value, label]) => <option key={value} value={value}>{label}</option>);

  return (
    <div className="app">
      <aside className="panel">
        <h1>Reel Generator</h1>
        <F label="Script"><textarea rows={7} value={script} placeholder="Paste your reel script here..." onChange={(e) => setScript(e.target.value)} /></F>
        <F label="Voice"><select value={voice} onChange={(e) => setVoice(e.target.value)}>{opt(VOICES)}</select></F>
        <F label={`Voice speed ${speed > 0 ? '+' : ''}${speed}%`}><input type="range" min="-20" max="40" step="2" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} /></F>
        <button className="primary" disabled={busy} onClick={generateVoice}>🎙 Generate voice + video</button>
        <details>
          <summary>Or upload your own voice</summary>
          <F label="Word timing JSON"><input type="file" accept=".json" onChange={(e) => onTiming(e.target.files?.[0])} /></F>
          <F label="Voice audio"><input type="file" accept="audio/*" disabled={busy} onChange={(e) => onAudio(e.target.files?.[0], 'voice')} /></F>
        </details>
        <hr />
        <F label={`Voice volume ${Math.round(media.audioVolume * 100)}%`}><input type="range" min="0" max="2" step="0.05" value={media.audioVolume} onChange={(e) => setMediaField({audioVolume: Number(e.target.value)})} /></F>
        <F label="Background music (optional)"><input type="file" accept="audio/*" disabled={busy} onChange={(e) => onAudio(e.target.files?.[0], 'music')} /></F>
        <F label={`Music volume ${Math.round(media.musicVolume * 100)}%`}><input type="range" min="0" max="0.3" step="0.01" value={media.musicVolume} onChange={(e) => setMediaField({musicVolume: Number(e.target.value)})} /></F>
        <F label="Format"><select value={settings.format} onChange={(e) => setSetting('format', e.target.value)}>{opt(Object.entries(FORMATS).map(([k, f]) => [k, f.label]))}</select></F>
        <F label="Template"><select value={settings.lookId} onChange={(e) => setSetting('lookId', e.target.value)}>{opt(LOOKS.map((l) => [l.id, l.label]))}</select></F>
        <F label="3D icons"><select value={settings.icons} onChange={(e) => setSetting('icons', e.target.value)}>{opt([['off', 'Off'], ['light', 'Light'], ['normal', 'Normal']])}</select></F>
        <F label="Stickers"><select value={settings.stickers} onChange={(e) => setSetting('stickers', e.target.value)}>{opt([['off', 'Off'], ['light', 'Light'], ['normal', 'Normal']])}</select></F>
        <F label="Sticker style"><select value={settings.stickerStyle} onChange={(e) => setSetting('stickerStyle', e.target.value)}>{opt([['cats', 'Cats'], ['mascot', 'Mascot']])}</select></F>
        <button className="ghost" disabled={!timing} onClick={() => setSetting('seed', settings.seed + 1)}>↻ Re-plan (resets edits)</button>
        <hr />
        <button className="primary" disabled={busy || !project} onClick={onRender}>Render MP4</button>
        <p className="status">{status}</p>
        <hr />
        <details>
          <summary>Bulk: up to 30 scripts → voice + MP4 each</summary>
          <F label="Scripts (separate each one with a line: ---)"><textarea rows={8} value={bulkText} onChange={(e) => setBulkText(e.target.value)}
            placeholder={'First script...\n---\nSecond script...\n---\nThird script...'} /></F>
          <F label="Template for each video"><select value={bulkMode} onChange={(e) => setBulkMode(e.target.value)}>{opt([['same', 'Same as selected template'], ['rotate', 'Rotate through all templates'], ['random', 'Random template']])}</select></F>
          <F label="Images (optional)"><input type="file" accept="image/*" multiple onChange={(e) => { onBulkImages(e.target.files || []); e.target.value = ''; }} /></F>
          {bulkImages.length ? <div className="bulkImgs">
            {bulkImages.map((im, i) => <figure key={i}><img src={im.url} alt="" /><figcaption>[{i + 1}]</figcaption></figure>)}
            <button className="ghost mini" onClick={() => setBulkImages([])}>Clear images</button>
          </div> : null}
          <p className="hint">To put a picture on a line, write its number before the line, e.g. <b>[2] Pick a voice you like.</b> The number is not spoken.</p>
          <p className="hint">Uses the voice, speed, format, music and sticker settings above. Keep this tab open; each MP4 downloads when ready.</p>
          <div className="row">
            <button className="primary" disabled={busy} onClick={() => runBulk(false)}>Generate {splitScripts(bulkText).length || ''} videos</button>
            <button className="ghost" disabled={!busy} onClick={() => { stopBulk.current = true; }}>Stop</button>
          </div>
          {rows.some((r) => r.status.startsWith('Error')) && !busy ? <button className="ghost" onClick={() => runBulk(true)}>Retry failed</button> : null}
          <ol className="bulk">
            {rows.map((r, i) => <li key={i}><span>{r.text.slice(0, 40)}…</span><em>🎨 {LOOKS.find((l) => l.id === r.lookId)?.label}</em><b>{r.status}</b>
              {r.view ? <button className="ghost mini" onClick={() => { setProject(r.view); player.current?.seekTo(0); player.current?.play(); }}>▶ View</button> : null}</li>)}
          </ol>
        </details>
      </aside>

      <main className="preview">
        {project ? (
          <Player ref={player} component={Reel} inputProps={{project}} durationInFrames={Math.max(1, Math.round(project.durationSec * 30))}
            fps={30} compositionWidth={project.width} compositionHeight={project.height} controls
            style={{width: '100%', maxWidth: project.width > project.height ? 720 : 400, aspectRatio: `${project.width}/${project.height}`}} />
        ) : <div className="empty">Your video preview appears here</div>}
      </main>

      <section className="scenes">
        <h2>Scenes {project ? `(${project.scenes.length})` : ''}</h2>
        <p className="hint">Click a word = keyword on/off • Double-click = edit text • 📷 = put your own screenshot on a scene</p>
        {project?.scenes.map((s) => (
          <div key={s.id} className="scene">
            <div className="sceneHead">
              <button className="time" onClick={() => seek(s.start + 0.4)}>{fmt(s.start)}</button>
              {s.type === 'line' || s.type === 'hero' ? (
                <select value={s.type} onChange={(e) => updateScene(s.id, (x) => ({...x, type: e.target.value}))}>
                  <option value="line">Sentence</option><option value="hero">Big word</option>
                </select>
              ) : <span className="tag">{s.type === 'step' ? `Step ${s.num}` : 'Comment CTA'}</span>}
              <label className="ghost mini imgBtn">{s.image ? '📷 Change' : '📷 Add image'}
                <input type="file" accept="image/*" hidden onChange={(e) => { onImage(s.id, e.target.files?.[0]); e.target.value = ''; }} /></label>
              {s.image ? <button className="ghost mini" onClick={() => updateScene(s.id, (x) => ({...x, image: ''}))}>✕</button> : null}
            </div>
            {s.image ? <img className="thumb" src={s.image} alt="" /> : null}
            <div className="words">
              {s.words.map((w, i) => (
                <span key={i} className={`chip${w.hero ? ' hero' : ''}`} onClick={() => toggleHero(s.id, i)}
                  onDoubleClick={() => { const t = window.prompt('Edit word', w.text); if (t != null && t.trim()) updateWord(s.id, i, {text: t.trim()}); }}>{w.text}</span>
              ))}
            </div>
            {s.type === 'line' || s.type === 'hero' ? (
              <div className="sceneOpts">
                <select value={s.icon} onChange={(e) => updateScene(s.id, (x) => ({...x, icon: e.target.value, sticker: e.target.value ? '' : x.sticker}))}>
                  <option value="">No visual</option>
                  <optgroup label="Library">{OBJECTS.map((x) => <option key={x.id} value={`lib:${x.id}`}>{x.id}</option>)}</optgroup>
                  <optgroup label="Basic icons">{ICON_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}</optgroup>
                </select>
                <select value={s.sticker} onChange={(e) => updateScene(s.id, (x) => ({...x, sticker: e.target.value, icon: e.target.value ? '' : x.icon}))}>
                  <option value="">No reaction</option>
                  <optgroup label="Mascot">{REACTIONS.map((x) => <option key={x.id} value={`lib:${x.id}`}>{x.id}</option>)}</optgroup>
                  <optgroup label="Cats & memes">{STICKERS.map((st) => <option key={st.id} value={st.id}>{st.label}</option>)}</optgroup>
                </select>
              </div>
            ) : null}
          </div>
        ))}
      </section>
    </div>
  );
}
