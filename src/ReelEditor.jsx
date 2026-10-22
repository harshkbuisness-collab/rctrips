'use client';
import React, {useRef, useState} from 'react';
import {Player} from '@remotion/player';
import {Reel} from './remotion/Reel.jsx';
import {THEMES, FORMATS, DEFAULT_SETTINGS, getTheme, parseTiming, buildProject} from './engine/plan.js';
import {ICON_NAMES} from './engine/icons.js';
import {STICKERS} from './engine/stickers.js';
import {getAudioDuration, uploadMedia, renderVideo} from './cloud.js';

const F = ({label, children}) => <label className="field"><span>{label}</span>{children}</label>;
const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;

export default function ReelEditor() {
  const [timing, setTiming] = useState(null); // {words, duration, name}
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [media, setMedia] = useState({audioVolume: 1, musicVolume: 0.15});
  const [project, setProject] = useState(null);
  const [status, setStatus] = useState('1) Upload word timing JSON  2) Upload voice  3) Render');
  const [busy, setBusy] = useState(false);
  const player = useRef(null);

  const rebuild = (t = timing, s = settings, m = media) => t && setProject(buildProject({words: t.words, duration: Math.max(t.duration, m.audioDurationSec || 0), settings: s, media: m}));
  // Settings that only restyle keep the user's scene edits; the rest re-plan the scenes.
  const RESTYLE = {themeId: (p, v) => ({theme: getTheme(v)}), align: (p, v) => ({align: v}), format: (p, v) => FORMATS[v]};
  const setSetting = (key, value) => {
    const s = {...settings, [key]: value}; setSettings(s);
    if (project && RESTYLE[key]) setProject((p) => ({...p, settings: s, ...RESTYLE[key](p, value)}));
    else rebuild(timing, s);
  };
  const setMediaField = (patch) => { const m = {...media, ...patch}; setMedia(m); setProject((p) => (p ? {...p, ...patch} : p)); };
  const updateScene = (id, fn) => setProject((p) => ({...p, scenes: p.scenes.map((s) => (s.id === id ? fn(s) : s))}));
  const updateWord = (id, wi, patch) => updateScene(id, (s) => ({...s, words: s.words.map((w, i) => (i === wi ? {...w, ...patch} : w))}));

  async function onTiming(file) {
    if (!file) return;
    try {
      const t = {...parseTiming(await file.text()), name: file.name};
      setTiming(t); rebuild(t);
      setStatus(`✓ ${t.words.length} words • ${t.duration.toFixed(1)}s`);
    } catch (e) { setStatus(`Error: ${e.message}`); }
  }

  async function onAudio(file, kind) {
    if (!file) return;
    setBusy(true);
    try {
      const patch = kind === 'voice'
        ? {audioSrc: URL.createObjectURL(file), audioFileName: file.name, audioDurationSec: await getAudioDuration(file)}
        : {musicSrc: URL.createObjectURL(file), musicFileName: file.name};
      const {pathname} = await uploadMedia(file, kind, setStatus);
      patch[kind === 'voice' ? 'audioBlobPath' : 'musicBlobPath'] = pathname;
      const m = {...media, ...patch}; setMedia(m);
      if (kind === 'voice' && timing) rebuild(timing, settings, m); else setProject((p) => (p ? {...p, ...patch} : p));
      setStatus(`✓ ${kind === 'voice' ? 'Voice' : 'Music'} ready`);
    } catch (e) { setStatus(`Error: ${e.message}`); }
    setBusy(false);
  }

  async function onRender() {
    if (!project?.audioBlobPath) return setStatus('Upload the voice audio first');
    setBusy(true);
    try { await renderVideo(project, setStatus); } catch (e) { setStatus(`Error: ${e.message}`); }
    setBusy(false);
  }

  function saveProject() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({timing, settings, project: {...project, audioSrc: '', musicSrc: ''}})], {type: 'application/json'}));
    a.download = 'reel-project.json'; a.click();
  }
  async function loadProject(file) {
    if (!file) return;
    try {
      const d = JSON.parse(await file.text());
      setTiming(d.timing); setSettings(d.settings); setProject({...d.project, audioSrc: media.audioSrc || '', musicSrc: media.musicSrc || ''});
      setStatus('Project loaded — re-upload voice/music to preview with sound');
    } catch (e) { setStatus(`Error: ${e.message}`); }
  }

  const seek = (sec) => { player.current?.seekTo(Math.round(sec * 30)); player.current?.pause(); };
  const opt = (list) => list.map((o) => <option key={o.value} value={o.value}>{o.label}</option>);

  return (
    <div className="app">
      <aside className="panel">
        <h1>Reel Generator</h1>
        <F label="1. Word timing JSON"><input type="file" accept=".json" onChange={(e) => onTiming(e.target.files?.[0])} /></F>
        <F label="2. Voice audio"><input type="file" accept="audio/*" disabled={busy} onChange={(e) => onAudio(e.target.files?.[0], 'voice')} /></F>
        <F label={`Voice volume ${Math.round(media.audioVolume * 100)}%`}><input type="range" min="0" max="2" step="0.05" value={media.audioVolume} onChange={(e) => setMediaField({audioVolume: Number(e.target.value)})} /></F>
        <F label="3. Background music (optional)"><input type="file" accept="audio/*" disabled={busy} onChange={(e) => onAudio(e.target.files?.[0], 'music')} /></F>
        <F label={`Music volume ${Math.round(media.musicVolume * 100)}%`}><input type="range" min="0" max="1" step="0.01" value={media.musicVolume} onChange={(e) => setMediaField({musicVolume: Number(e.target.value)})} /></F>
        <hr />
        <F label="Theme"><select value={settings.themeId} onChange={(e) => setSetting('themeId', e.target.value)}>{opt(THEMES.map((t) => ({value: t.id, label: t.label})))}</select></F>
        <F label="Format"><select value={settings.format} onChange={(e) => setSetting('format', e.target.value)}>{opt(Object.keys(FORMATS).map((k) => ({value: k, label: k})))}</select></F>
        <F label="Text alignment"><select value={settings.align} onChange={(e) => setSetting('align', e.target.value)}>{opt([{value: 'left', label: 'Left'}, {value: 'center', label: 'Center'}])}</select></F>
        <F label="3D icons"><select value={settings.icons} onChange={(e) => setSetting('icons', e.target.value)}>{opt([{value: 'off', label: 'Off'}, {value: 'light', label: 'Light'}, {value: 'normal', label: 'Normal'}])}</select></F>
        <F label="Meme stickers"><select value={settings.stickers} onChange={(e) => setSetting('stickers', e.target.value)}>{opt([{value: 'off', label: 'Off'}, {value: 'light', label: 'Light'}, {value: 'normal', label: 'Normal'}])}</select></F>
        <label className="check"><input type="checkbox" checked={settings.flashes} onChange={(e) => setSetting('flashes', e.target.checked)} /> Colour flash cards</label>
        <button className="ghost" disabled={!timing} onClick={() => setSetting('seed', settings.seed + 1)}>↻ Re-plan (resets edits)</button>
        <hr />
        <button className="primary" disabled={busy || !project} onClick={onRender}>Render MP4</button>
        <div className="row"><button className="ghost" disabled={!project} onClick={saveProject}>Save project</button>
          <label className="ghost file">Load project<input type="file" accept=".json" hidden onChange={(e) => loadProject(e.target.files?.[0])} /></label></div>
        <p className="status">{status}</p>
      </aside>

      <main className="preview">
        {project ? (
          <Player ref={player} component={Reel} inputProps={{project}} durationInFrames={Math.max(1, Math.round(project.durationSec * 30))}
            fps={30} compositionWidth={project.width} compositionHeight={project.height} controls
            style={{width: '100%', maxWidth: project.width > project.height * 0.7 ? 520 : 400, aspectRatio: `${project.width}/${project.height}`}} />
        ) : <div className="empty">Upload a word timing JSON to start</div>}
      </main>

      <section className="scenes">
        <h2>Scenes {project ? `(${project.scenes.length})` : ''}</h2>
        <p className="hint">Click a word = highlight on/off • Shift+click = new line before it • Double-click = edit text</p>
        {project?.scenes.map((s) => (
          <div key={s.id} className="scene">
            <button className="time" onClick={() => seek(s.start + 0.4)}>{fmt(s.start)}</button>
            <div className="words">
              {s.words.map((w, i) => (
                <span key={i} className={`chip${w.hero ? ' hero' : ''}${w.br ? ' br' : ''}`}
                  onClick={(e) => (e.shiftKey ? updateWord(s.id, i, {br: !w.br}) : updateWord(s.id, i, {hero: !w.hero}))}
                  onDoubleClick={() => { const t = window.prompt('Edit word', w.text); if (t != null && t.trim()) updateWord(s.id, i, {text: t.trim()}); }}>{w.text}</span>
              ))}
            </div>
            <div className="sceneOpts">
              <select value={s.icon} onChange={(e) => updateScene(s.id, (x) => ({...x, icon: e.target.value, sticker: e.target.value ? '' : x.sticker}))}>
                <option value="">No icon</option>{ICON_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <select value={s.sticker} onChange={(e) => updateScene(s.id, (x) => ({...x, sticker: e.target.value, icon: e.target.value ? '' : x.icon}))}>
                <option value="">No sticker</option>{STICKERS.map((st) => <option key={st.id} value={st.id}>{st.label}</option>)}
              </select>
              <label className="check"><input type="checkbox" checked={s.flash} onChange={(e) => updateScene(s.id, (x) => ({...x, flash: e.target.checked}))} /> Flash</label>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
