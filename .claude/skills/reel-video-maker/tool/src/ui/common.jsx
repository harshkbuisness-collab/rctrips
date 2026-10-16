// Helpers shared by the single-video page and the bulk page.
import React, {useState} from 'react';

export const api = async (url, opts = {}) => {
  let res;
  try {
    res = await fetch(url, opts);
  } catch {
    throw new Error('The tool is not answering. Is the black START.bat window still open? If not, run START.bat again and reload this page.');
  }
  const data = await res.json().catch(() => ({error: `The tool answered ${res.status} without details. Look at the black START.bat window for the error.`}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
};
export const post = (url, body, raw = false) => api(url, {method: 'POST', body: raw ? body : JSON.stringify(body)});
export const copy = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export function Msg({m}) {
  if (!m) return null;
  return <p className={m.ok ? 'ok' : 'err'}>{m.text}</p>;
}

// voice speed presets; captions and every phrase time in the plan follow the voice automatically
export const SPEEDS = [0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4];
export function SpeedPicker({value, onPick, disabled}) {
  return <div className="speeds">
    {SPEEDS.map((s) => <button key={s} className={`chip ${Math.abs((value ?? 1) - s) < 0.01 ? 'on' : ''}`} disabled={disabled} onClick={() => onPick(s)}>{s}x</button>)}
  </div>;
}

export const busyRender = (r) => r && (r.state === 'rendering' || r.state === 'queued');
export const renderLabel = (r) => (r?.state === 'queued' ? 'Waiting in the render queue…' : r?.state === 'rendering' ? `Rendering… ${Math.round((r.progress || 0) * 100)}%` : null);

// one player for every "listen" button, so two samples never talk at once
let playing = null;
export const playAudio = (url) => {
  if (playing) playing.pause();
  playing = new Audio(url);
  playing.play().catch(() => {});
  return playing;
};
export const stopAudio = () => { if (playing) playing.pause(); playing = null; };

const DEFAULT_VOICES = [{id: 'am_michael', label: 'Michael (US man, deep, clear) - default'}];
// Choose an AI voice: the list, a "Listen" button for the chosen one, and "All voices" to hear each one before choosing.
// Samples are spoken at the chosen speed (made once, then cached).
export function VoicePicker({voices, value, onPick, speed = 1}) {
  const list = voices?.length ? voices : DEFAULT_VOICES;
  const [busy, setBusy] = useState(null);
  const [now, setNow] = useState(null);
  const [all, setAll] = useState(false);
  const [err, setErr] = useState(null);
  const listen = async (id) => {
    if (now === id) { stopAudio(); setNow(null); return; }
    setBusy(id); setErr(null);
    try {
      const r = await post('/api/tts/sample', {voice: id, speed});
      const a = playAudio(r.url);
      setNow(id);
      a.onended = () => setNow((x) => (x === id ? null : x));
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(null);
    }
  };
  const label = (id) => (busy === id ? '…' : now === id ? '■' : '▶');
  return <div className="voicepick">
    <div className="row">
      <select value={value} onChange={(e) => onPick(e.target.value)}>
        {list.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
      </select>
      <button disabled={Boolean(busy)} onClick={() => listen(value)} title="Listen to this voice">{busy === value ? 'Making sample…' : now === value ? '■ Stop' : '▶ Listen'}</button>
      <button onClick={() => setAll(!all)}>{all ? 'Hide voices' : 'All voices ▾'}</button>
    </div>
    {all ? <><p className="hint">Press ▶ to hear a voice at {speed}x (the first sample of each voice takes a few seconds), then "Use".</p>
      <ul className="voicelist">
        {list.map((v) => <li key={v.id} className={v.id === value ? 'on' : ''}>
          <button className="mini" disabled={Boolean(busy) && busy !== v.id} onClick={() => listen(v.id)}>{label(v.id)}</button>
          <span>{v.label}</span>
          {v.id === value ? <b>✓ chosen</b> : <button className="mini" onClick={() => onPick(v.id)}>Use</button>}
        </li>)}
      </ul></> : null}
    <Msg m={err ? {ok: false, text: err} : null}/>
  </div>;
}
