import '@fontsource/anton/400.css';
import '@fontsource/luckiest-guy/400.css';
import '@fontsource/bangers/400.css';
import '@fontsource/jost/600.css';
import '@fontsource/jost/600-italic.css';
import '@fontsource/jost/700-italic.css';
import '@fontsource/jost/800.css';
import '@fontsource/jost/800-italic.css';
import '@fontsource/bebas-neue/400.css';
import '@fontsource/archivo-black/400.css';
import '@fontsource/archivo/800.css';
import '@fontsource/unbounded/800.css';
import '@fontsource/dela-gothic-one/400.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/lilita-one/400.css';
import '@fontsource/rubik/800.css';
import '@fontsource/rubik/800-italic.css';
import './ui.css';
import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Player} from '@remotion/player';
import {ReelVideo} from '../Video.jsx';
import {api, busyRender, copy, Msg, post, renderLabel, SpeedPicker, VoicePicker} from './common.jsx';
import {BulkVideos} from './bulk.jsx';

function Step({n, title, done, children}) {
  return <section className={`step ${done ? 'done' : ''}`}>
    <h2><span className="num">{done ? '✓' : n}</span>{title}</h2>
    {children}
  </section>;
}

function MakeVideo() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');
  const [proj, setProj] = useState(null);
  const [voice, setVoice] = useState(null);
  const [script, setScript] = useState('');
  const [timing, setTiming] = useState(null);
  const [json, setJson] = useState('');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState({});
  const [check, setCheck] = useState(null);
  const [render, setRender] = useState(null);
  const [board, setBoard] = useState(null);
  // AI voiceover
  const [ttsVoices, setTtsVoices] = useState([]);
  const [ttsVoice, setTtsVoice] = useState('am_michael');
  const [ttsSpeed, setTtsSpeed] = useState(1);
  const [speedBusy, setSpeedBusy] = useState(false);
  const [tts, setTts] = useState(null);
  useEffect(() => { api('/api/tts/voices').then((r) => setTtsVoices(r.voices)).catch(() => {}); }, []);
  const [promptText, setPromptText] = useState('');
  const [music, setMusic] = useState(null);
  const [musicPick, setMusicPick] = useState('default');
  const [ai, setAi] = useState(null);
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    api('/api/projects').then((r) => setProjects(r.projects)).catch(() => {});
    api('/api/music').then(setMusic).catch(() => {});
    api('/api/ai').then(setAi).catch(() => {});
  }, []);

  // Gemini writes the plan; the tool checks it and sends errors back until it passes
  const autoPlan = async () => {
    setPlan({state: 'working', step: 'Starting…'});
    try {
      let r = await post(`/api/projects/${name}/autoplan?music=${encodeURIComponent(musicPick)}&format=${proj.format || 'vertical'}`, {});
      while (r.state === 'working') {
        setPlan(r);
        await new Promise((ok) => setTimeout(ok, 1500));
        r = await api(`/api/projects/${name}/autoplan`);
      }
      setPlan(r);
      if (r.json) setJson(JSON.stringify(JSON.parse(r.json), null, 2));
      if (r.check) setCheck(r.check);
    } catch (e) {
      setPlan({state: 'error', error: e.message});
    }
  };

  const open = async (n) => {
    if (!n.trim()) return;
    const p = await api(`/api/projects/${encodeURIComponent(n)}`);
    setName(p.name); setProj(p); setScript(p.script || ''); setJson(p.timeline || '');
    setCheck(null); setMsg({}); setPromptText(''); setVoice(null); setTiming(null);
    setRender(p.video ? {state: 'done', url: p.video} : null);
    setMusicPick(p.music || 'default');
  };

  const step = async (key, label, fn) => {
    setBusy(key); setMsg((m) => ({...m, [key]: null}));
    try {
      const text = await fn();
      setMsg((m) => ({...m, [key]: {ok: true, text}}));
    } catch (e) {
      setMsg((m) => ({...m, [key]: {ok: false, text: e.message}}));
    } finally {
      setBusy('');
    }
  };

  const sync = () => step('sync', 'sync', async () => {
    if (voice) await post(`/api/projects/${name}/voice?filename=${encodeURIComponent(voice.name)}`, voice, true);
    const timingText = timing ? await timing.text() : '';
    const r = await post(`/api/projects/${name}/sync`, {script, timing: timingText, timingName: timing?.name});
    setProj(await api(`/api/projects/${name}`));
    return `Synced: ${r.words} words, ${r.seconds.toFixed(1)} s of voiceover.${r.note ? ` ${r.note}` : ''}`;
  });

  // speed of the current voiceover: AI voices are spoken again, uploaded ones are time-stretched
  const changeSpeed = async (speed) => {
    setSpeedBusy(true); setMsg((m) => ({...m, speed: null}));
    try {
      const r = await post(`/api/projects/${name}/speed`, {speed});
      if (r.tts) {
        setTts(r.tts);
        await new Promise((resolve) => {
          const poll = setInterval(async () => {
            const t = await api(`/api/projects/${name}/tts`);
            setTts(t);
            if (t.state !== 'working' && t.state !== 'queued') { clearInterval(poll); resolve(); }
          }, 1500);
        });
      }
      setProj(await api(`/api/projects/${name}`));
      setCheck(null);
      setMsg((m) => ({...m, speed: {ok: true, text: `Voice speed ${speed}x. Press "Check & preview" again to see the video at the new speed.`}}));
    } catch (e) {
      setMsg((m) => ({...m, speed: {ok: false, text: e.message}}));
    } finally {
      setSpeedBusy(false);
    }
  };

  // script -> AI voice -> synced words
  const makeVoice = async () => {
    try {
      setTts(await post(`/api/projects/${name}/tts`, {script, voice: ttsVoice, speed: ttsSpeed}));
      const poll = setInterval(async () => {
        const r = await api(`/api/projects/${name}/tts`);
        setTts(r);
        if (r.state !== 'working' && r.state !== 'queued') {
          clearInterval(poll);
          setProj(await api(`/api/projects/${name}`));
        }
      }, 1500);
    } catch (e) {
      setTts({state: 'error', error: e.message});
    }
  };

  const getPrompt = () => step('prompt', 'prompt', async () => {
    const r = await api(`/api/projects/${name}/prompt`);
    setPromptText(r.prompt);
    return (await copy(r.prompt)) ? 'Copied! Paste it into Claude, then paste Claude\'s JSON answer below.' : 'Select the text below and copy it.';
  });

  // uploaded / dropped plan files: several parts are joined in name order (part1, part2, …), then checked
  const uploadJson = async (fileList) => {
    const files = [...(fileList || [])].sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
    if (!files.length) return;
    const text = (await Promise.all(files.map((f) => f.text()))).join('\n');
    setJson(text);
    await checkJson(text);
  };
  // text: the plan to check (an uploaded file), else what is in the box
  const checkJson = (text) => step('check', 'check', async () => {
    const body = typeof text === 'string' ? text : json;
    const r = await post(`/api/projects/${name}/timeline?music=${encodeURIComponent(musicPick)}&format=${proj.format || 'vertical'}`, body, true);
    setCheck(r);
    if (!r.ok) throw new Error(`${r.errors.length} problem(s) found`);
    return r.warnings.length ? `Looks good (${r.warnings.length} note(s)). Preview below.` : 'Looks good! Preview below.';
  });

  // voice / music sliders: update the preview at once, save for the render shortly after
  const saveTimer = React.useRef({});
  const setVolume = (key, value) => {
    const v = Number(value);
    setCheck((c) => ({...c, props: {...c.props, timeline: {...c.props.timeline, audio: {...c.props.timeline.audio, [key]: v}}}}));
    clearTimeout(saveTimer.current[key]);
    saveTimer.current[key] = setTimeout(() => post(`/api/projects/${name}/audio`, {[key]: v}).catch(() => {}), 300);
  };

  const [coverStamp, setCoverStamp] = useState(0);
  const uploadCover = async (file) => {
    if (!file) return;
    try {
      const r = await post(`/api/projects/${name}/cover?filename=${encodeURIComponent(file.name)}`, file, true);
      setProj({...proj, cover: r.cover}); setCoverStamp(Date.now());
      if (json.trim()) await checkJson();
    } catch (e) { alert(e.message); }
  };
  const removeCover = async () => {
    await post(`/api/projects/${name}/cover/remove`, {});
    setProj({...proj, cover: null});
    if (json.trim()) await checkJson();
  };

  // storyboard first: stills of every beat with words, graphics and sounds, to approve before the video
  const startBoard = async () => {
    try {
      setBoard(await post(`/api/projects/${name}/storyboard`, {}));
      const poll = setInterval(async () => {
        const r = await api(`/api/projects/${name}/storyboard`);
        setBoard(r);
        if (r.state !== 'rendering') clearInterval(poll);
      }, 1000);
    } catch (e) {
      setBoard({state: 'error', error: e.message});
    }
  };

  const startRender = async () => {
    try {
      const {voiceVolume, musicVolume, sfxVolume} = check.props.timeline.audio;
      await post(`/api/projects/${name}/audio`, {voiceVolume, sfxVolume, ...(check.props.timeline.audio.music && {musicVolume})});
      setRender(await post(`/api/projects/${name}/render`, {}));
      const poll = setInterval(async () => {
        const r = await api(`/api/projects/${name}/render`);
        setRender(r);
        if (!busyRender(r)) clearInterval(poll);
      }, 1000);
    } catch (e) {
      setRender({state: 'error', error: e.message});
    }
  };

  const qualityText = check?.ok && check.quality?.length ? `The tool's quality check found these weak spots in your JSON (empty moments, rhythm, sounds, layout). Improve them and send the full corrected JSON again:\n\n${check.quality.map((e) => `- ${e}`).join('\n')}` : '';
  const fixText = check && !check.ok ? `The tool found these problems in your JSON. Fix them and send the full corrected JSON again:\n\n${check.errors.map((e) => `- ${e}`).join('\n')}` : '';

  return <div className="make">
    <Step n="0" title="Project" done={Boolean(proj)}>
      <div className="row">
        <input placeholder="video name, e.g. core-at-home" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && open(name)}/>
        <button onClick={() => open(name)}>Open / create</button>
      </div>
      {projects.length ? <div className="chips">{projects.map((p) => <button key={p} className="chip" onClick={() => open(p)}>{p}</button>)}</div> : null}
      {proj ? <div className="row formats">
        <span className="hint">Video format:</span>
        {[['vertical', '9:16 vertical (Reels / Shorts)'], ['landscape', '16:9 landscape (YouTube)']].map(([f, label]) =>
          <button key={f} className={`chip ${(proj.format || 'vertical') === f ? 'on' : ''}`} onClick={async () => {
            await post(`/api/projects/${name}/format`, {format: f});
            setProj({...proj, format: f}); setCheck(null); setPromptText('');
          }}>{label}</button>)}
      </div> : null}
    </Step>

    {proj && <>
      <Step n="1" title="Voiceover + script" done={proj.synced && !voice && !timing}>
        <label>Voiceover (mp3 / wav) {proj.voice ? <em>uploaded: {proj.voice}</em> : null}</label>
        <input type="file" accept="audio/*" onChange={(e) => setVoice(e.target.files[0])}/>
        <label>Script: exactly what the voiceover says</label>
        <textarea rows={6} value={script} onChange={(e) => setScript(e.target.value)} placeholder="Paste the voiceover script here"/>
        <label>Timing file (optional: SRT or word JSON). Not needed for English: the tool listens to the audio. Needed for Hindi / Hinglish.</label>
        <input type="file" accept=".srt,.json,.txt" onChange={(e) => setTiming(e.target.files[0])}/>
        <div className="row"><button className="primary" disabled={busy === 'sync' || !script.trim() || (!voice && !proj.voice)} onClick={sync}>{busy === 'sync' ? 'Syncing…' : 'Upload & sync'}</button></div>
        <Msg m={msg.sync}/>
        <div className="ai-box">
          <p className="hint"><b>No voiceover? Make an AI voice from the script.</b> Free, runs on this PC, fine for monetised videos.
            The first time it downloads the voice model (~350 MB, a few minutes).</p>
          <div className="row">
            <VoicePicker voices={ttsVoices} value={ttsVoice} onPick={setTtsVoice} speed={ttsSpeed}/>
          </div>
          <div className="row">
            <SpeedPicker value={ttsSpeed} onPick={setTtsSpeed}/>
            <button className="primary" disabled={!script.trim() || tts?.state === 'working' || tts?.state === 'queued'} onClick={makeVoice}>{tts?.state === 'working' || tts?.state === 'queued' ? (tts.step || 'Working…') : 'Make AI voice & sync'}</button>
          </div>
          {tts?.state === 'done' ? <Msg m={{ok: true, text: tts.step}}/> : null}
          {tts?.state === 'error' ? <Msg m={{ok: false, text: tts.error}}/> : null}
          {proj.voice ? <><span className="hint">Your voice{proj.aiVoice ? ` (AI: ${proj.aiVoice}, ${proj.voiceSpeed ?? 1}x)` : ''}:</span>
            <audio controls src={`/projects/${name}/${proj.voice}?t=${proj.seconds ?? ''}-${proj.voiceSpeed ?? 1}`} style={{width: '100%'}}/></> : null}
        </div>
        {proj.voice && proj.synced ? <div className="row">
          <span className="hint"><b>Voice speed</b> (now {proj.voiceSpeed ?? 1}x): captions and every time in the plan follow the voice.</span>
          <SpeedPicker value={proj.voiceSpeed ?? 1} disabled={speedBusy || tts?.state === 'working'} onPick={changeSpeed}/>
          {speedBusy ? <span className="hint">Changing the speed…</span> : null}
        </div> : null}
        <Msg m={msg.speed}/>
        {proj.synced ? <div className="row">
          <span className="hint">Accurate SRT from this voiceover:</span>
          <a className="button" href={`/api/projects/${name}/srt?mode=words`} download>Download SRT (word by word)</a>
          <a className="button" href={`/api/projects/${name}/srt?mode=lines`} download>Download SRT (caption lines)</a>
        </div> : null}
      </Step>

      <Step n="2" title="Ask Claude for the video plan" done={Boolean(promptText)}>
        <p className="hint">Copies instructions + your image library + the script{proj.format === 'landscape' ? ', with the 16:9 rules' : ''}. Paste it into Claude / ChatGPT.
          {proj.format === 'landscape' ? ' Long scripts come back in parts: say "next" for each part and paste all parts one after another below.' : ''}</p>
        <button className="primary" disabled={!proj.synced || busy === 'prompt'} onClick={getPrompt}>Copy prompt for Claude</button>
        <Msg m={msg.prompt}/>
        {promptText ? <details><summary>Show prompt</summary><textarea readOnly rows={8} value={promptText}/></details> : null}
        <div className="ai-box">
          <p className="hint"><b>Or let the tool do it:</b> the AI writes the plan, the tool checks it and has the AI fix any problems, then the preview opens.</p>
          {ai?.configured
            ? <button className="primary" disabled={!proj.synced || plan?.state === 'working'} onClick={autoPlan}>{plan?.state === 'working' ? 'Working…' : `Make the plan with ${ai.name}${ai.model ? ` (${ai.model})` : ''}`}</button>
            : <p className="hint">Add a Gemini or OpenAI API key in <b>Library → AI settings</b> to use this.</p>}
          {plan?.state === 'working' ? <p className="hint">{plan.step}</p> : null}
          {plan?.state === 'done' ? <Msg m={{ok: true, text: `${plan.step} Preview below.`}}/> : null}
          {plan?.state === 'error' ? <Msg m={{ok: false, text: plan.error}}/> : null}
        </div>
      </Step>

      <Step n="3" title="Upload or paste the JSON" done={check?.ok}>
        <div className="upload-row">
          <label className="upload-btn">⬆ Upload JSON file
            <input type="file" accept=".json,.txt" multiple hidden onChange={(e) => { uploadJson(e.target.files); e.target.value = ''; }}/>
          </label>
          <span className="hint">Pick the .json file (or all part files at once). It is checked right away. Or drop the file on the box, or paste below.</span>
        </div>
        <textarea rows={10} className="mono" value={json} onChange={(e) => setJson(e.target.value)} placeholder="{ ... }  (paste here, or drop a .json file)"
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); uploadJson(e.dataTransfer.files); }}/>
        <div className="cover-box">
          <label>Thumbnail</label>
          {(proj.format || 'vertical') === 'vertical'
            ? <>
              <p className="hint">Upload the thumbnail you made. It is shown for the first 0.1 s of the Short, so you can pick it as the cover after uploading.</p>
              <div className="row">
                {proj.cover ? <img className="cover-thumb" src={`/projects/${name}/${proj.cover}?t=${coverStamp}`} alt="thumbnail"/> : null}
                <label className="button">{proj.cover ? 'Replace thumbnail' : 'Upload thumbnail'}<input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => uploadCover(e.target.files[0])}/></label>
                {proj.cover ? <button onClick={removeCover}>Remove</button> : null}
              </div>
            </>
            : <p className="hint">Long videos: the thumbnail is not put into the video. Upload it on YouTube.</p>}
        </div>
        <div className="row">
          <label className="inline">Background music
            <select value={musicPick} onChange={(e) => setMusicPick(e.target.value)}>
              <option value="default">Default{music ? ` (${music.current === 'none' ? 'no music' : trackName(music.current)})` : ''}</option>
              <option value="none">No music</option>
              {(music?.tracks || []).map((t) => <option key={t} value={t}>{trackName(t)}</option>)}
            </select>
          </label>
        </div>
        <div className="row"><button className="primary" disabled={!json.trim() || busy === 'check'} onClick={checkJson}>{busy === 'check' ? 'Checking…' : 'Check & preview'}</button></div>
        <Msg m={msg.check}/>
        {check && !check.ok ? <div className="errors">
          <ul>{check.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
          <button onClick={() => copy(fixText)}>Copy these errors for Claude</button>
        </div> : null}
        {check?.warnings?.length ? <ul className="warnings">{check.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul> : null}
        {qualityText ? <div className="quality">
          <p><b>Quality check: {check.quality.length} point(s) to make the video better.</b> The video works; for a stronger one, copy these for the AI and paste its new JSON.</p>
          <ul>{check.quality.map((w, i) => <li key={i}>{w}</li>)}</ul>
          <button onClick={() => copy(qualityText)}>Copy these notes for the AI</button>
        </div> : null}
      </Step>

      {check?.ok ? <Step n="4" title="Preview & render" done={render?.state === 'done'}>
        <div className="mixer">
          <label>Voice <b>{Math.round(check.props.timeline.audio.voiceVolume * 100)}%</b>
            <input type="range" min="0" max="2" step="0.05" value={check.props.timeline.audio.voiceVolume} onChange={(e) => setVolume('voiceVolume', e.target.value)}/>
          </label>
          {check.props.timeline.audio.music ? <label>Background music <b>{Math.round(check.props.timeline.audio.musicVolume * 100)}%</b>
            <input type="range" min="0" max="0.4" step="0.01" value={check.props.timeline.audio.musicVolume} onChange={(e) => setVolume('musicVolume', e.target.value)}/>
          </label> : <span className="hint">No background music for this video (choose one in step 3).</span>}
          <label>Sound effects <b>{Math.round(check.props.timeline.audio.sfxVolume * 100)}%</b>
            <input type="range" min="0" max="2" step="0.05" value={check.props.timeline.audio.sfxVolume} onChange={(e) => setVolume('sfxVolume', e.target.value)}/>
          </label>
          <button onClick={() => { setVolume('voiceVolume', 1); setVolume('sfxVolume', 1); if (check.props.timeline.audio.music) setVolume('musicVolume', music?.volume ?? 0.08); }}>Reset</button>
        </div>
        <p className="hint">Move the sliders while the preview plays. The MP4 uses the same levels.</p>
        <div className="preview">
          <Player component={ReelVideo} inputProps={check.props} durationInFrames={check.durationInFrames}
            fps={check.props.timeline.canvas.fps} compositionWidth={check.props.timeline.canvas.width} compositionHeight={check.props.timeline.canvas.height}
            controls style={check.props.timeline.canvas.width > check.props.timeline.canvas.height ? {width: 640, height: 360} : {width: 340, height: 604}} numberOfSharedAudioTags={Math.max(8, (check.props.timeline.sfx?.length || 0) + 30)} acknowledgeRemotionLicense/>
        </div>
        <p className="hint">First make the storyboard and check every beat. Render the MP4 only when the storyboard is approved.</p>
        <div className="row">
          <button className="primary" disabled={board?.state === 'rendering'} onClick={startBoard}>{board?.state === 'rendering' ? `Storyboard… ${Math.round((board.progress || 0) * 100)}%` : 'Make storyboard'}</button>
          {board?.state === 'done' ? <a className="button" href={board.url} target="_blank" rel="noreferrer">Open storyboard</a> : null}
        </div>
        {board?.state === 'error' ? <Msg m={{ok: false, text: board.error}}/> : null}
        <div className="row">
          <button className={board?.state === 'done' ? 'primary' : ''} disabled={busyRender(render)} onClick={startRender}>{renderLabel(render) ?? 'Render MP4'}</button>
          {render?.state === 'done' ? <a className="button" href={render.url} download={`${name}.mp4`}>Download MP4</a> : null}
        </div>
        {busyRender(render) ? <progress value={render.progress || 0} max={1}/> : null}
        {render?.state === 'error' ? <Msg m={{ok: false, text: render.error}}/> : null}
      </Step> : null}
    </>}
  </div>;
}


const trackName = (f) => f.replace(/\.[a-z0-9]+$/i, '').replace(/_/g, ' ');

function MusicPanel() {
  const [m, setM] = useState(null);
  const [note, setNote] = useState(null);
  useEffect(() => { api('/api/music').then(setM).catch(() => {}); }, []);
  const act = async (fn, ok) => {
    setNote(null);
    try { setM(await fn()); if (ok) setNote({ok: true, text: ok}); } catch (e) { setNote({ok: false, text: e.message}); }
  };
  if (!m) return null;
  return <section className="music">
    <h2>Background music</h2>
    <p className="hint">Plays softly under every new video. You can still pick another track (or none) for one video in step 3.</p>
    <div className="row">
      <label className="inline">Default track
        <select value={m.current} onChange={(e) => act(() => post('/api/music/settings', {current: e.target.value}), 'Saved. New videos use this track.')}>
          <option value="none">No music</option>
          {m.tracks.map((t) => <option key={t} value={t}>{trackName(t)}</option>)}
        </select>
      </label>
      <label className="inline">Volume {Math.round(m.volume * 100)}%
        <input type="range" min="0" max="0.3" step="0.01" value={m.volume}
          onChange={(e) => setM({...m, volume: Number(e.target.value)})}
          onMouseUp={(e) => act(() => post('/api/music/settings', {volume: Number(e.target.value)}), 'Volume saved.')}
          onTouchEnd={(e) => act(() => post('/api/music/settings', {volume: Number(e.target.value)}), 'Volume saved.')}/>
      </label>
    </div>
    {m.current !== 'none' ? <audio controls src={`/library/music/${encodeURIComponent(m.current)}`}/> : null}
    <div className="row">
      <label className="button">Add a new track<input type="file" accept="audio/*" hidden onChange={(e) => {
        const f = e.target.files[0];
        if (f) act(() => post(`/api/music/upload?name=${encodeURIComponent(f.name)}&use=1`, f, true), `${f.name} added and set as the default.`);
      }}/></label>
      {m.current !== 'none' ? <button onClick={() => confirm(`Delete ${trackName(m.current)}?`) && act(() => post('/api/music/delete', {file: m.current}), 'Deleted.')}>Delete this track</button> : null}
    </div>
    <p className="hint">Changes apply when you press "Check & preview" again. Videos already rendered keep their music.</p>
    <Msg m={note}/>
  </section>;
}

const SOUND_GROUPS = {transition: 'Transitions & whooshes', ui: 'Pops, clicks & dings', impact: 'Impacts', meme: 'Reactions & memes', body: 'Body (breathing, running…)', ambience: 'Background ambience'};

function SoundsPanel() {
  const [sounds, setSounds] = useState([]);
  const [cat, setCat] = useState('meme');
  const [note, setNote] = useState(null);
  const [playing, setPlaying] = useState(null);
  const player = React.useRef(null);
  const load = () => api('/api/library').then((r) => setSounds(r.assets.filter((a) => a.kind === 'audio')));
  useEffect(() => { load(); }, []);
  const play = (a) => {
    player.current?.pause();
    if (playing === a.id) return setPlaying(null);
    const el = new window.Audio(`/${a.file}`);
    el.volume = Math.min(1, a.volume ?? 0.6);
    el.onended = () => setPlaying(null);
    el.play();
    player.current = el;
    setPlaying(a.id);
  };
  const upload = async (files) => {
    for (const f of files) {
      setNote({ok: true, text: `Adding ${f.name}…`});
      try {
        const r = await post(`/api/sounds/upload?name=${encodeURIComponent(f.name)}&category=${cat}`, f, true);
        setNote({ok: true, text: `✓ ${f.name} → ${r.id} (${r.duration} s)`});
      } catch (e) {
        setNote({ok: false, text: `✗ ${f.name}: ${e.message}`});
      }
    }
    load();
  };
  const edit = async (a) => {
    const d = prompt(`What does ${a.id} sound like, and when should it be used?\n(Claude/ChatGPT read this)`, a.description);
    if (d === null) return;
    await post('/api/sounds/update', {id: a.id, description: d});
    load();
  };
  const remove = async (a) => {
    if (!confirm(`Delete ${a.id}?`)) return;
    await post('/api/sounds/delete', {id: a.id});
    load();
  };
  const groups = Object.keys(SOUND_GROUPS).map((k) => [k, sounds.filter((a) => (a.category || 'ui') === k)]).filter(([, l]) => l.length);
  return <section className="music sounds">
    <h2>Sound effects ({sounds.length})</h2>
    <p className="hint">Press ▶ to listen. Claude/ChatGPT pick sounds by their description, so keep it clear: "what it sounds like → when to use it".</p>
    <div className="row">
      <select value={cat} onChange={(e) => setCat(e.target.value)}>
        {Object.entries(SOUND_GROUPS).map(([k, v]) => <option key={k} value={k}>Add to: {v}</option>)}
      </select>
      <label className="button">Add sounds<input type="file" multiple accept="audio/*" hidden onChange={(e) => upload([...e.target.files])}/></label>
    </div>
    <Msg m={note}/>
    {groups.map(([k, list]) => <details key={k} open={k === 'transition' || k === 'ui'}>
      <summary>{SOUND_GROUPS[k]} ({list.length})</summary>
      <ul className="soundlist">{list.map((a) => <li key={a.id}>
        <button className={`playbtn ${playing === a.id ? 'on' : ''}`} onClick={() => play(a)}>{playing === a.id ? '■' : '▶'}</button>
        <code>{a.id}</code>
        <span className="desc">{a.description}{a.duration ? ` · ${a.duration} s` : ''}</span>
        <button className="mini" onClick={() => edit(a)}>Edit</button>
        <button className="mini" onClick={() => remove(a)}>✕</button>
      </li>)}</ul>
    </details>)}
  </section>;
}

function AiKeyBox({provider, info, active, onSaved}) {
  const [key, setKey] = useState('');
  const [models, setModels] = useState([]);
  const [model, setModel] = useState(info.model || '');
  const [note, setNote] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (info.configured) api(`/api/ai/models?provider=${provider}`).then((m) => setModels(m.models)).catch(() => {});
  }, [provider, info.configured]);
  const name = {openai: 'OpenAI', gemini: 'Gemini', claude: 'Claude'}[provider];
  const local = provider === 'claude'; // Claude Code app on this computer: no key
  const save = async () => {
    setBusy(true); setNote(null);
    try {
      const r = await post('/api/ai/settings', {provider, key, model: model || (local ? 'default' : '')});
      setModels(r.models); setModel(r.model); setKey('');
      setNote({ok: true, text: r.busy
        ? `Saved (${r.model}). The key works, but ${name}'s servers are busy right now; the plan button will wait and retry.`
        : `Saved. The key works; using ${r.model}.${r.switched ? ` (${r.switched} is not available for this key, so the tool picked ${r.model}.)` : ''} ${name} now makes the plans.`});
      onSaved();
    } catch (e) {
      setNote({ok: false, text: e.message});
    } finally {
      setBusy(false);
    }
  };
  return <div className={`ai-provider ${active ? 'on' : ''}`}>
    <h3>{{openai: 'OpenAI (ChatGPT API)', gemini: 'Gemini', claude: 'Claude (Pro plan, via Claude Code)'}[provider]} {active ? <span className="badge">makes the plans</span> : null}</h3>
    <div className="row">
      {local
        ? <select value={model || 'default'} onChange={(e) => setModel(e.target.value)}>{['default', 'sonnet', 'opus', 'haiku'].map((m) => <option key={m} value={m}>{m === 'default' ? 'default (your plan’s model)' : m}</option>)}</select>
        : <input type="password" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)}
          placeholder={info.configured ? `Key saved (${info.keyHint})${info.fromEnv ? ' from the environment' : ''}. Paste a new one to replace it.` : `Paste your ${name} API key`}/>}
      {!local && models.length ? <select value={model} onChange={(e) => setModel(e.target.value)}>{models.map((m) => <option key={m} value={m}>{m}</option>)}</select> : null}
      <button className="primary" disabled={busy || (!local && !key.trim() && !info.configured)} onClick={save}>{busy ? 'Checking…' : local ? (info.configured ? 'Test again' : 'Test & use Claude') : 'Save'}</button>
      {info.configured && !active ? <button onClick={async () => { await post('/api/ai/use', {provider}); onSaved(); }}>Use {name}</button> : null}
    </div>
    <p className="hint">{{
      openai: 'Your own key from platform.openai.com (separate from a ChatGPT Plus plan; it is billed per use). The newest GPT model gives the best plans; "mini" models are cheaper.',
      gemini: 'Free key from aistudio.google.com. On a free key use a "flash" model (bigger daily limit); "pro" gives richer plans but its free limit is small.',
      claude: 'Uses the Claude Code app on this computer and the Claude Pro/Max account it is logged in with: no key, no extra cost, it counts toward your plan’s usage limit. It runs in the background (no window opens). Not logged in yet? Open a Command Prompt, type claude, and log in once. "default" uses your plan’s model; Opus may need a Max plan.',
    }[provider]}</p>
    <Msg m={note}/>
  </div>;
}

function AiPanel() {
  const [s, setS] = useState(null);
  const load = () => api('/api/ai').then(setS).catch(() => {});
  useEffect(() => { load(); }, []);
  if (!s) return null;
  return <section className="music">
    <h2>AI settings</h2>
    <p className="hint">Set up one of these and step 2 gets a button that writes the video plan for you. Keys are saved only on this computer (settings/ai.json) and are sent only to that AI company. Never paste a key into a chat.</p>
    {['claude', 'gemini', 'openai'].map((p) => <AiKeyBox key={p} provider={p} info={s[p]} active={s.provider === p && s[p].configured} onSaved={load}/>)}
  </section>;
}

function Library() {
  const [assets, setAssets] = useState([]);
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('character');
  const [log, setLog] = useState([]);
  const load = () => api('/api/library').then((r) => setAssets(r.assets));
  useEffect(() => { load(); }, []);

  const upload = async (files) => {
    for (const f of files) {
      setLog((l) => [`Adding ${f.name}…`, ...l]);
      try {
        const r = await post(`/api/library/upload?name=${encodeURIComponent(f.name)}&kind=${kind}`, f, true);
        setLog((l) => [`✓ ${f.name} → ${r.id}${kind === 'character' && !r.points ? ' (body parts not found)' : ''}`, ...l]);
      } catch (e) {
        setLog((l) => [`✗ ${f.name}: ${e.message}`, ...l]);
      }
    }
    load();
  };
  const remove = async (id) => {
    if (!confirm(`Delete ${id} from the library?`)) return;
    await post('/api/library/delete', {id});
    load();
  };
  const shown = assets.filter((a) => a.kind !== 'audio' && (`${a.id} ${a.description}`).toLowerCase().includes(q.toLowerCase()));

  return <div className="library">
    <AiPanel/>
    <MusicPanel/>
    <SoundsPanel/>
    <div className="row">
      <input placeholder={`Search ${assets.length} images…`} value={q} onChange={(e) => setQ(e.target.value)}/>
      <select value={kind} onChange={(e) => setKind(e.target.value)}>
        <option value="character">Add character poses</option>
        <option value="prop">Add props</option>
      </select>
      <label className="button">Add images<input type="file" multiple accept="image/*" hidden onChange={(e) => upload([...e.target.files])}/></label>
    </div>
    <p className="hint">Images on a plain white background. The file name becomes the id (rename the file to choose it, e.g. <code>hero_pushup_bottom.png</code>).</p>
    {log.length ? <pre className="log">{log.slice(0, 8).join('\n')}</pre> : null}
    <div className="grid">{shown.map((a) => <figure key={a.id} title={a.description}>
      <img src={`/${a.file}`} loading="lazy" alt={a.id}/>
      <figcaption>{a.id}{a.id.startsWith('hero_') && !a.points ? ' ⚠' : ''}</figcaption>
      {a.file.startsWith('library/hero/') ? <button className="del" onClick={() => remove(a.id)}>✕</button> : null}
    </figure>)}</div>
  </div>;
}

function App() {
  const [tab, setTab] = useState('make');
  const [status, setStatus] = useState(null);
  useEffect(() => { api('/api/status').then(setStatus).catch(() => {}); }, []);
  return <main>
    <header>
      <h1>Reel Engine</h1>
      <nav>
        <button className={tab === 'make' ? 'on' : ''} onClick={() => setTab('make')}>Make a video</button>
        <button className={tab === 'bulk' ? 'on' : ''} onClick={() => setTab('bulk')}>Bulk videos</button>
        <button className={tab === 'lib' ? 'on' : ''} onClick={() => setTab('lib')}>Library</button>
      </nav>
    </header>
    {status && !status.python ? <p className="err">Python was not found: voiceover sync and adding images will not work. See README.</p> : null}
    {tab === 'make' ? <MakeVideo/> : tab === 'bulk' ? <BulkVideos/> : <Library/>}
  </main>;
}

createRoot(document.getElementById('root')).render(<App/>);
