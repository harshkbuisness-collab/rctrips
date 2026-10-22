'use client';
import React, {useRef, useState} from 'react';
import {Player} from '@remotion/player';
import {Reel} from './remotion/Reel.jsx';
import {THEMES, FORMATS, DEFAULT_SETTINGS, getTheme, parseTiming, buildProject} from './engine/plan.js';
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
  const RESTYLE = {themeId: (v) => ({theme: getTheme(v)}), format: (v) => FORMATS[v]};
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

  async function generateVoice() {
    if (!script.trim()) return setStatus('Paste a script first');
    setBusy(true);
    try {
      setStatus('Generating voice...');
      const res = await fetch(isLocal() ? '/api/tts-local' : '/api/tts', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({text: script, voice, speed})});
      const d = await res.json().catch(() => ({}));
      if (!res.ok || d.error) throw new Error(d.error || `Voice service error (${res.status})`);
      const bytes = Uint8Array.from(atob(d.audio), (c) => c.charCodeAt(0));
      const file = new File([bytes], 'voice.mp3', {type: 'audio/mpeg'});
      const t = parseTiming({words: d.words});
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

  async function onRender() {
    if (!project?.audioBlobPath) return setStatus('Generate or upload the voice first');
    setBusy(true);
    try { await renderVideo(project, setStatus); } catch (e) { setStatus(`Error: ${e.message}`); }
    setBusy(false);
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
        <F label="Theme"><select value={settings.themeId} onChange={(e) => setSetting('themeId', e.target.value)}>{opt(THEMES.map((t) => [t.id, t.label]))}</select></F>
        <F label="3D icons"><select value={settings.icons} onChange={(e) => setSetting('icons', e.target.value)}>{opt([['off', 'Off'], ['light', 'Light'], ['normal', 'Normal']])}</select></F>
        <F label="Stickers"><select value={settings.stickers} onChange={(e) => setSetting('stickers', e.target.value)}>{opt([['off', 'Off'], ['light', 'Light'], ['normal', 'Normal']])}</select></F>
        <F label="Sticker style"><select value={settings.stickerStyle} onChange={(e) => setSetting('stickerStyle', e.target.value)}>{opt([['cats', 'Cats'], ['mascot', 'Mascot']])}</select></F>
        <button className="ghost" disabled={!timing} onClick={() => setSetting('seed', settings.seed + 1)}>↻ Re-plan (resets edits)</button>
        <hr />
        <button className="primary" disabled={busy || !project} onClick={onRender}>Render MP4</button>
        <p className="status">{status}</p>
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
        <p className="hint">Click a word = keyword on/off • Double-click = edit text</p>
        {project?.scenes.map((s) => (
          <div key={s.id} className="scene">
            <div className="sceneHead">
              <button className="time" onClick={() => seek(s.start + 0.4)}>{fmt(s.start)}</button>
              {s.type === 'line' || s.type === 'hero' ? (
                <select value={s.type} onChange={(e) => updateScene(s.id, (x) => ({...x, type: e.target.value}))}>
                  <option value="line">Sentence</option><option value="hero">Big word</option>
                </select>
              ) : <span className="tag">{s.type === 'step' ? `Step ${s.num}` : 'Comment CTA'}</span>}
            </div>
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
