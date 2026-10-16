// Bulk videos: several independent videos in one workflow. Each video is its own project (title, script,
// voice + speed, JSON, preview, storyboard, render, download); the batch adds AI voices, rendering and a ZIP for all.
import React, {useEffect, useRef, useState} from 'react';
import {Player} from '@remotion/player';
import {ReelVideo} from '../Video.jsx';
import {api, busyRender, copy, Msg, playAudio, post, renderLabel, SpeedPicker, VoicePicker} from './common.jsx';

export {splitBulk} from './splitBulk.js';
import {splitBulk} from './splitBulk.js';

const working = (it) => busyRender(it.render) || ['working', 'queued'].includes(it.tts?.state) || ['working', 'queued'].includes(it.plan?.state) || it.board?.state === 'rendering';
const download = (text, name) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], {type: 'text/plain'}));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};

// every AI voice made so far: reused by itself when the same script + voice + speed comes again
function SavedVoices() {
  const [list, setList] = useState(null);
  const [msg, setMsg] = useState(null);
  const load = () => api('/api/voices').then((r) => setList(r.voices)).catch((e) => setMsg({ok: false, text: e.message}));
  const importOld = async () => { const r = await post('/api/voices/import', {}); setMsg({ok: true, text: `${r.imported} earlier voice${r.imported === 1 ? '' : 's'} added.`}); load(); };
  const remove = async (v) => { if (!window.confirm(`Delete the saved voice "${v.title || v.key}"? Videos that use it keep their voice.`)) return; await post('/api/voices/delete', {key: v.key}); load(); };
  return <details onToggle={(e) => e.target.open && load()}>
    <summary>Saved voices{list ? ` (${list.length})` : ''}</summary>
    <p className="hint">Every AI voice is saved here. When a video has the same script, voice and speed again, the saved voice is used at once instead of being made again.</p>
    <div className="row"><button onClick={importOld}>Add voices from older videos</button></div>
    <Msg m={msg}/>
    {list?.length ? <ul className="voicelist">{list.map((v) => <li key={v.key}>
      <button className="mini" onClick={() => playAudio(v.url)}>▶</button>
      <span title={v.script}><b>{v.title || 'untitled'}</b> · {v.voice} · {v.speed}x · {Math.round(v.seconds)} s</span>
      <button className="mini" onClick={() => remove(v)}>✕</button>
    </li>)}</ul> : list ? <p className="hint">No saved voices yet.</p> : null}
  </details>;
}


function NewBatch({onCreated}) {
  const [mode, setMode] = useState('count');
  const [name, setName] = useState('');
  const [count, setCount] = useState(5);
  const [titles, setTitles] = useState('');
  const [scripts, setScripts] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const parsed = splitBulk(titles, scripts);
  const matched = parsed.titles.length > 0 && parsed.titles.length === parsed.scripts.length;

  const create = async () => {
    setBusy(true); setMsg(null);
    try {
      const body = mode === 'count' ? {name, count}
        : {name, items: parsed.titles.map((title, k) => ({title, script: parsed.scripts[k]}))};
      const r = await post('/api/batches', body);
      setTitles(''); setScripts('');
      onCreated(r.id);
    } catch (e) {
      setMsg({ok: false, text: e.message});
    } finally {
      setBusy(false);
    }
  };

  return <section className="step">
    <h2><span className="num">+</span>New batch</h2>
    <div className="chips">
      <button className={`chip ${mode === 'count' ? 'on' : ''}`} onClick={() => setMode('count')}>A · Choose how many videos</button>
      <button className={`chip ${mode === 'paste' ? 'on' : ''}`} onClick={() => setMode('paste')}>B · Paste all titles + scripts</button>
    </div>
    <label>Batch name</label>
    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. week-12 shorts"/>
    {mode === 'count' ? <>
      <label>How many videos?</label>
      <div className="row">
        {[3, 5, 10, 15, 20].map((n) => <button key={n} className={`chip ${count === n ? 'on' : ''}`} onClick={() => setCount(n)}>{n}</button>)}
        <input type="number" min="1" max="50" value={count} onChange={(e) => setCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))} style={{maxWidth: 90, minWidth: 0}}/>
      </div>
      <p className="hint">Makes {count} empty video sections. Fill in each one's title, script, voice and JSON.</p>
    </> : <>
      <label>Titles: one per line</label>
      <textarea rows={6} value={titles} onChange={(e) => setTitles(e.target.value)} placeholder={'Skinny wrists fix\n5 exercises done wrong\nWhy your push-ups stall'}/>
      <label>Scripts: in the same order. Put each script in double quotes <code>"…"</code> (blank lines inside are fine), or separate them with a line <code>---</code></label>
      <textarea rows={10} value={scripts} onChange={(e) => setScripts(e.target.value)} placeholder={"Your wrists look skinny for one reason. ...\n---\nYou're doing these five exercises wrong. ...\n---\n..."}/>
      <p className={matched ? 'ok' : parsed.titles.length || parsed.scripts.length ? 'err' : 'hint'}>
        {parsed.titles.length} titles · {parsed.scripts.length} scripts{parsed.scripts.length ? ` (split by ${parsed.by})` : ''}{matched ? ' · matched one to one ✓' : parsed.titles.length || parsed.scripts.length ? ' · the numbers must be the same' : ''}
      </p>
      {matched ? <ol className="pairs">{parsed.titles.map((t, k) => <li key={k}><b>{t}</b> — {parsed.scripts[k].slice(0, 90)}{parsed.scripts[k].length > 90 ? '…' : ''}</li>)}</ol> : null}
    </>}
    <div className="row">
      <button className="primary" disabled={busy || (mode === 'paste' && !matched)} onClick={create}>
        {busy ? 'Creating…' : mode === 'count' ? `Create ${count} videos` : `Create ${parsed.titles.length || ''} videos`}
      </button>
    </div>
    <Msg m={msg}/>
  </section>;
}

// One video of the batch: everything here only touches this video's own project.
function VideoCard({item, index, voice, speed, onRefresh, onOpen}) {
  const p = item.project;
  const [title, setTitle] = useState(item.title);
  const [script, setScript] = useState(item.script);
  const [json, setJson] = useState(item.timeline);
  const [check, setCheck] = useState(null);
  const [msg, setMsg] = useState({});
  const [busy, setBusy] = useState('');
  const fileRef = useRef(null);
  // a different video in this slot (after remove / reload): take its saved values
  useEffect(() => { setTitle(item.title); setScript(item.script); setJson(item.timeline); setCheck(null); }, [p]);

  const say = (k, ok, text) => setMsg((m) => ({...m, [k]: text ? {ok, text} : null}));
  const run = async (k, fn) => {
    setBusy(k); say(k);
    try { const text = await fn(); if (text) say(k, true, text); } catch (e) { say(k, false, e.message); } finally { setBusy(''); onRefresh(); }
  };
  const saveDetails = (patch) => post(`/api/projects/${p}/details`, patch).then(onRefresh).catch(() => {});

  const makeVoice = () => run('voice', async () => {
    if (script !== item.script) await post(`/api/projects/${p}/details`, {script});
    await post(`/api/projects/${p}/tts`, {script, voice, speed: item.voiceSpeed && item.aiVoice ? item.voiceSpeed : speed});
    return 'AI voice queued.';
  });
  const uploadVoice = (file) => run('voice', async () => {
    if (!file) return null;
    if (script !== item.script) await post(`/api/projects/${p}/details`, {script});
    await post(`/api/projects/${p}/voice?filename=${encodeURIComponent(file.name)}`, file, true);
    const r = await post(`/api/projects/${p}/sync`, {script});
    return `Synced: ${r.words} words, ${r.seconds.toFixed(1)} s.${r.note ? ` ${r.note}` : ''}`;
  });
  const uploadCover = (file) => run('cover', async () => {
    if (!file) return null;
    await post(`/api/projects/${p}/cover?filename=${encodeURIComponent(file.name)}`, file, true);
    return 'Thumbnail saved: it is the first frame of the video (render again to add it).';
  });
  const removeCover = () => run('cover', async () => { await post(`/api/projects/${p}/cover/remove`, {}); return null; });
  const setSpeed = (s) => run('voice', async () => {
    const r = await post(`/api/projects/${p}/speed`, {speed: s});
    setCheck(null);
    return r.tts ? `Making the voice again at ${s}x…` : `Voice speed ${s}x. Validate again to preview at this speed.`;
  });
  const copyPrompt = () => run('prompt', async () => {
    const r = await api(`/api/projects/${p}/prompt`);
    return (await copy(r.prompt)) ? 'Prompt copied: paste it into ChatGPT / Claude, then paste the JSON answer below.' : 'Could not copy: open the single-video page for this project.';
  });
  // validate the JSON (format + plan rules) and save it to THIS video only
  const validate = (text = json) => run('json', async () => {
    const t = text.trim();
    if (!t) throw new Error('Paste the JSON for this video first.');
    const r = await post(`/api/projects/${p}/timeline`, t, true);
    setCheck(r);
    if (!r.ok) throw new Error(`Not valid (${r.errors.length} problem${r.errors.length === 1 ? '' : 's'}): see the list below.`);
    return `Valid ✓${r.quality?.length ? ` · ${r.quality.length} quality note${r.quality.length === 1 ? '' : 's'}` : ''}`;
  });
  const loadJsonFile = async (files) => {
    const text = (await Promise.all([...files].sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true})).map((f) => f.text()))).join('\n');
    setJson(text);
    validate(text);
  };
  const storyboard = () => run('board', async () => {
    await post(`/api/projects/${p}/storyboard`, {});
    return 'Making the storyboard…';
  });
  const render = () => run('render', async () => {
    await post(`/api/projects/${p}/render`, {});
    return null;
  });
  const remove = () => run('remove', async () => {
    if (!window.confirm(`Remove "${item.title}" from this batch? Its project stays in "Make a video".`)) return null;
    await post(`/api/batches/${item.batchId}/remove`, {project: p});
    return null;
  });
  const preview = async () => {
    if (check?.ok) return onOpen({title: item.title, check});
    if (!item.timeline) return say('json', false, 'Add and validate the JSON first.');
    setBusy('json');
    try {
      const r = await post(`/api/projects/${p}/timeline`, item.timeline, true);
      setCheck(r);
      if (r.ok) onOpen({title: item.title, check: r}); else say('json', false, 'The saved JSON is not valid: fix it and validate.');
    } catch (e) { say('json', false, e.message); } finally { setBusy(''); }
  };

  const voiceState = ['working', 'queued'].includes(item.tts?.state) ? (item.tts.state === 'queued' ? 'voice queued' : item.tts.step) : item.synced ? `voice ${item.seconds?.toFixed(0) ?? ''}s · ${item.voiceSpeed}x` : item.tts?.state === 'error' ? 'voice failed' : 'no voice';
  const jsonState = ['working', 'queued'].includes(item.plan?.state) ? (item.plan.state === 'queued' ? 'AI plan queued' : 'AI plan…')
    : item.planOk === true ? 'JSON ✓' : item.planOk === false ? 'JSON ✗' : item.timeline ? (item.synced ? 'JSON ?' : 'JSON waits for voice') : 'no JSON';
  const videoState = renderLabel(item.render) ?? (item.render?.state === 'error' ? 'render failed' : item.video ? 'video ✓' : 'not rendered');

  return <article className="vcard">
    <div className="vhead">
      <span className="vnum">{index + 1}</span>
      <input className="vtitle" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => title !== item.title && saveDetails({title})}/>
      <button className="mini" title="Remove from batch" onClick={remove}>✕</button>
    </div>
    <div className="vstatus">
      <span className={`pill ${item.synced ? 'good' : item.tts?.state === 'error' ? 'bad' : ''}`}>{voiceState}</span>
      <span className={`pill ${item.planOk ? 'good' : item.planOk === false ? 'bad' : ''}`}>{jsonState}</span>
      <span className={`pill ${item.video && !busyRender(item.render) ? 'good' : item.render?.state === 'error' ? 'bad' : ''}`}>{videoState}</span>
    </div>
    {busyRender(item.render) ? <progress value={item.render.progress || 0} max={1}/> : null}

    {item.video ? <video className="vthumb" src={`${item.video}#t=1`} controls preload="metadata"/> : check?.ok ? <div className="vplayer" onClick={() => onOpen({title: item.title, check})}>
      <Player component={ReelVideo} inputProps={check.props} durationInFrames={check.durationInFrames} fps={check.props.timeline.canvas.fps}
        compositionWidth={check.props.timeline.canvas.width} compositionHeight={check.props.timeline.canvas.height} style={{width: '100%', aspectRatio: '9 / 16'}}
        initialFrame={30} acknowledgeRemotionLicense/>
    </div> : <div className="vempty">{item.timeline ? 'Press Preview' : 'Preview appears after the JSON is valid'}</div>}

    <details open={!item.synced}>
      <summary>Script & voice</summary>
      <textarea rows={5} value={script} onChange={(e) => setScript(e.target.value)} onBlur={() => script !== item.script && saveDetails({script})} placeholder="The voiceover script for this video"/>
      <div className="row">
        <button className="primary" disabled={!script.trim() || busy === 'voice' || ['working', 'queued'].includes(item.tts?.state)} onClick={makeVoice}>Make AI voice</button>
        <button onClick={() => fileRef.current?.click()} disabled={!script.trim() || busy === 'voice'}>Upload voiceover</button>
        <input ref={fileRef} type="file" accept="audio/*" hidden onChange={(e) => uploadVoice(e.target.files[0])}/>
      </div>
      {item.voice ? <audio className="vaudio" controls preload="none" src={`/projects/${p}/${item.voice}?t=${item.seconds ?? ''}-${item.voiceSpeed}`}/> : null}
      {item.synced ? <><span className="hint">Speed of this video's voice:</span>
        <SpeedPicker value={item.voiceSpeed} disabled={busy === 'voice' || ['working', 'queued'].includes(item.tts?.state)} onPick={setSpeed}/></> : null}
      <Msg m={msg.voice}/>
    </details>

    <details open={item.synced && !item.planOk}>
      <summary>JSON plan</summary>
      <div className="row">
        <button disabled={!item.synced || busy === 'prompt'} onClick={copyPrompt}>Copy prompt</button>
        <label className="filebtn">Open .json<input type="file" accept=".json,.txt" multiple hidden onChange={(e) => loadJsonFile(e.target.files)}/></label>
      </div>
      <Msg m={msg.prompt}/>
      <textarea rows={6} className="mono" value={json} onChange={(e) => setJson(e.target.value)} placeholder="{ ... } paste this video's JSON here"/>
      <div className="row">
        <button className="primary" disabled={!item.synced || busy === 'json'} onClick={() => validate()}>{busy === 'json' ? 'Checking…' : 'Validate & save'}</button>
      </div>
      {!item.synced ? <p className="hint">Make or upload the voice first: the JSON times are words of the script.</p> : null}
      <Msg m={msg.json}/>
      {check && !check.ok ? <ul className="errors">{check.errors.map((e, i) => <li key={i}>{e}</li>)}</ul> : null}
      {check?.ok && check.quality?.length ? <details><summary className="warnings">{check.quality.length} quality notes</summary><ul className="warnings">{check.quality.map((e, i) => <li key={i}>{e}</li>)}</ul></details> : null}
    </details>

    <details>
      <summary>Thumbnail {item.cover ? '✓' : ''}</summary>
      <p className="hint">Upload the thumbnail you made: it is shown for the first 0.1 s of the Short, so you can pick it as the cover on YouTube.</p>
      <div className="row">
        {item.cover ? <img className="cover-thumb" src={`/projects/${p}/${item.cover}?t=${item.coverStamp ?? ''}`} alt="thumbnail"/> : null}
        <label className="button">{item.cover ? 'Replace thumbnail' : 'Upload thumbnail'}<input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => uploadCover(e.target.files[0])}/></label>
        {item.cover ? <button onClick={removeCover}>Remove</button> : null}
      </div>
      <Msg m={msg.cover}/>
    </details>

    <div className="row">
      <button disabled={!item.timeline || busy === 'json'} onClick={preview}>Preview</button>
      <button disabled={!item.planOk || item.board?.state === 'rendering'} onClick={storyboard}>{item.board?.state === 'rendering' ? `Storyboard ${Math.round((item.board.progress || 0) * 100)}%` : 'Storyboard'}</button>
      {item.board?.state === 'done' ? <a className="button" href={item.board.url} target="_blank" rel="noreferrer">Open storyboard</a> : null}
      <button className="primary" disabled={!item.planOk || busyRender(item.render)} onClick={render}>{item.video ? 'Render again' : 'Render'}</button>
      {item.video ? <a className="button" href={item.video.split('?')[0]} download={`${String(index + 1).padStart(2, '0')}_${p}.mp4`}>Download</a> : null}
    </div>
    <Msg m={msg.board || msg.render || msg.remove}/>
    {item.render?.state === 'error' ? <p className="err">Render failed: {item.render.error}</p> : null}
    {item.tts?.state === 'error' ? <p className="err">Voice: {item.tts.error}</p> : null}
    {item.plan?.state === 'error' ? <p className="err">AI plan: {item.plan.error}</p> : null}
    {item.autoRender && !item.video ? <p className="hint">⚡ Renders by itself as soon as voice and JSON are ready.</p> : null}
  </article>;
}

function BatchView({id, onBack}) {
  const [batch, setBatch] = useState(null);
  const [voices, setVoices] = useState([]);
  const [voice, setVoice] = useState('am_michael');
  const [speed, setSpeed] = useState(1);
  const [msg, setMsg] = useState(null);
  const [open, setOpen] = useState(null);
  const [answer, setAnswer] = useState('');
  const [imported, setImported] = useState(null);
  const load = () => api(`/api/batches/${id}`).then(setBatch).catch((e) => setMsg({ok: false, text: e.message}));
  useEffect(() => { load(); api('/api/tts/voices').then((r) => setVoices(r.voices)).catch(() => {}); }, [id]);
  // keep the statuses fresh while voices, storyboards or renders are running
  const anyWorking = batch?.items.some(working);
  useEffect(() => {
    if (!anyWorking) return undefined;
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, [anyWorking, id]);

  if (!batch) return <Msg m={msg}/>;
  const items = batch.items.map((it) => ({...it, batchId: batch.id}));
  const n = items.length;
  const voiced = items.filter((i) => i.synced).length;
  const valid = items.filter((i) => i.planOk).length;
  const done = items.filter((i) => i.video && !busyRender(i.render)).length;
  const failed = items.filter((i) => i.render?.state === 'error').length;
  const rendering = items.filter((i) => busyRender(i.render));
  const overall = n ? (done + rendering.reduce((s, i) => s + (i.render.progress || 0), 0)) / n : 0;

  const act = async (fn) => {
    setMsg(null);
    try { const text = await fn(); if (text) setMsg({ok: true, text}); } catch (e) { setMsg({ok: false, text: e.message}); } finally { load(); }
  };
  const voicesAll = (all) => act(async () => {
    const r = await post(`/api/batches/${id}/tts`, {voice, speed, all});
    return `${r.queued} AI voice${r.queued === 1 ? '' : 's'} queued${r.skipped ? `, ${r.skipped} skipped (no script${all ? '' : ' or already has a voice'})` : ''}.`;
  });
  const renderAll = (onlyMissing) => act(async () => {
    const r = await post(`/api/batches/${id}/render`, {onlyMissing});
    const q = r.items.filter((i) => ['queued', 'rendering'].includes(i.state)).length;
    const bad = r.items.filter((i) => i.state === 'error');
    const skipped = r.items.filter((i) => i.state === 'skipped');
    return `${q} video${q === 1 ? '' : 's'} in the render queue.${bad.length ? ` ${bad.length} not ready (fix their JSON): ${bad.map((b) => b.project).join(', ')}.` : ''}${skipped.length ? ` ${skipped.length} skipped (${[...new Set(skipped.map((x) => x.error))].join(' / ')}).` : ''}`;
  });
  const add = () => act(async () => { await post(`/api/batches/${id}/add`, {count: 1}); return null; });
  const doItAll = () => act(async () => {
    const r = await post(`/api/batches/${id}/run`, {voice, speed});
    const parts = [r.voices && `${r.voices} voice${r.voices === 1 ? '' : 's'} queued`, r.plans && `${r.plans} AI plan${r.plans === 1 ? '' : 's'} queued`, r.renders && `${r.renders} video${r.renders === 1 ? '' : 's'} in the render queue`].filter(Boolean);
    return `${parts.join(', ') || 'Nothing to start'}. Every video renders by itself once its voice and JSON are ready.${r.waiting.length ? ` ${r.waiting.length} still need${r.waiting.length === 1 ? 's' : ''} a JSON plan: paste them in step 2${r.ai ? '' : ' (or set up an AI in the Library tab to make them by itself)'}.` : ''}${r.noScript.length ? ` ${r.noScript.length} without a script.` : ''}`;
  });
  const masterPrompt = (save) => act(async () => {
    const r = await api(`/api/batches/${id}/prompt`);
    if (save) { download(r.prompt, `${id}-all-prompts.txt`); return `Saved ${id}-all-prompts.txt: one prompt for all ${r.count} videos.`; }
    return (await copy(r.prompt)) ? `Master prompt for all ${r.count} videos copied. Paste it into Claude; then paste its whole answer (or open its .json files) below.` : 'Could not copy: press "Save prompt as .txt" instead.';
  });
  const importPlans = (text) => act(async () => {
    if (!text.trim()) throw new Error('Paste Claude\'s whole answer first, or open the .json files.');
    const r = await post(`/api/batches/${id}/plans`, text, true);
    setImported(r.results);
    const ok = r.results.filter((x) => x.ok).length, wait = r.results.filter((x) => !x.ok && x.waiting).length, bad = r.results.length - ok - wait;
    return `${r.results.length} JSON plan${r.results.length === 1 ? '' : 's'} imported: ${ok} valid${wait ? `, ${wait} saved and checked when their voice is ready` : ''}${bad ? `, ${bad} with problems (see the list)` : ''}.`;
  });
  // .json files from Claude: the number in each file name says which video it is (01-wrists.json → video 1), else the order
  const importFiles = async (files) => {
    const sorted = [...files].sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
    const parts = await Promise.all(sorted.map(async (f, k) => `=== VIDEO ${Number(f.name.match(/\d+/)?.[0]) || k + 1} ===\n${await f.text()}\n`));
    importPlans(parts.join('\n'));
  };
  const aiPlans = () => act(async () => {
    const r = await post(`/api/batches/${id}/aiplans`, {});
    return `${r.queued} AI plan${r.queued === 1 ? '' : 's'} queued (one after another). Videos without a voice get theirs as soon as the voice is ready.`;
  });

  return <>
    <section className="step">
      <div className="row" style={{marginTop: 0}}>
        <button onClick={onBack}>← All batches</button>
        <h2 style={{margin: 0}}>{batch.name}</h2>
      </div>
      <div className="vstatus" style={{marginTop: 10}}>
        <span className="pill">{n} videos</span>
        <span className={`pill ${voiced === n ? 'good' : ''}`}>voice {voiced}/{n}</span>
        <span className={`pill ${valid === n ? 'good' : ''}`}>JSON valid {valid}/{n}</span>
        <span className={`pill ${done === n ? 'good' : ''}`}>rendered {done}/{n}</span>
        {failed ? <span className="pill bad">{failed} failed</span> : null}
      </div>
      <progress value={overall} max={1}/>
      <p className="hint">{rendering.length ? `Rendering ${rendering.length} video${rendering.length === 1 ? '' : 's'} one after another… ${Math.round(overall * 100)}% of the batch.` : 'Workflow: voices → copy each prompt, paste each JSON → validate → storyboard → render → download.'}</p>

      <div className="doall">
        <button className="primary big" onClick={doItAll}>⚡ Do it all</button>
        <span className="hint">Makes every missing voice, checks every JSON{batch.ai ? ', asks the AI for missing plans' : ''} and renders each video by itself as soon as it is ready. Videos without a JSON wait until you import it in step 2.</span>
      </div>
      <div className="batchbar">
        <div>
          <b>1 · AI voices</b>
          <VoicePicker voices={voices} value={voice} onPick={setVoice} speed={speed}/>
          <SpeedPicker value={speed} onPick={setSpeed}/>
          <div className="row">
            <button className="primary" onClick={() => voicesAll(false)}>Make all voices (one click)</button>
            <button onClick={() => voicesAll(true)}>Redo all voices</button>
          </div>
          <p className="hint">All voices are made in one run (the voice model loads once). A voice made before for the same script, voice and speed is reused at once.</p>
          <SavedVoices/>
        </div>
        <div>
          <b>2 · JSON for all videos</b>
          <div className="row">
            <button className="primary" onClick={() => masterPrompt(false)}>Copy all JSON prompts</button>
            <button onClick={() => masterPrompt(true)}>Save prompt as .txt</button>
          </div>
          <p className="hint">One master prompt with every script. Paste it into Claude: it writes one JSON per video. Then paste its whole answer here, or open all its .json files at once.</p>
          <textarea rows={4} className="mono" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Paste Claude's whole answer (=== VIDEO 1 === { … } === VIDEO 2 === { … } …)"/>
          <div className="row">
            <button className="primary" onClick={() => importPlans(answer)}>Import all JSON</button>
            <label className="filebtn">Open .json files<input type="file" accept=".json,.txt" multiple hidden onChange={(e) => { importFiles(e.target.files); e.target.value = ''; }}/></label>
            {batch.ai ? <button onClick={aiPlans}>Make all JSON with AI</button> : null}
          </div>
          {imported ? <ul className="imported">{imported.map((x) => <li key={x.n} className={x.ok ? 'ok' : x.waiting ? '' : 'err'}>
            Video {x.n}: {x.ok ? 'valid ✓' : x.waiting ? 'saved, checked when its voice is ready' : `${x.errors} problem${x.errors === 1 ? '' : 's'}: ${x.error}`}
          </li>)}</ul> : null}
        </div>
        <div>
          <b>3 · Render & download</b>
          <div className="row">
            <button className="primary" disabled={!valid} onClick={() => renderAll(true)}>Render all ready videos</button>
            <button disabled={!valid} onClick={() => renderAll(false)}>Render all again</button>
          </div>
          <div className="row">
            <a className={`button ${done ? '' : 'disabled'}`} href={done ? `/api/batches/${id}/zip` : undefined} download>Download all ({done}) as ZIP</a>
            <button onClick={add}>+ Add a video</button>
          </div>
        </div>
      </div>
      <Msg m={msg}/>
    </section>

    <div className="vgrid">
      {items.map((it, k) => <VideoCard key={it.project} item={it} index={k} voice={voice} speed={speed} onRefresh={load} onOpen={setOpen}/>)}
    </div>

    {open ? <div className="modal" onClick={() => setOpen(null)}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{marginTop: 0, justifyContent: 'space-between'}}><b>{open.title}</b><button onClick={() => setOpen(null)}>Close</button></div>
        <Player component={ReelVideo} inputProps={open.check.props} durationInFrames={open.check.durationInFrames} fps={open.check.props.timeline.canvas.fps}
          compositionWidth={open.check.props.timeline.canvas.width} compositionHeight={open.check.props.timeline.canvas.height}
          controls autoPlay style={{width: 'min(380px, 80vw)', aspectRatio: '9 / 16'}} numberOfSharedAudioTags={40} acknowledgeRemotionLicense/>
      </div>
    </div> : null}
  </>;
}

export function BulkVideos() {
  const [batches, setBatches] = useState([]);
  const [id, setId] = useState(null);
  const list = () => api('/api/batches').then((r) => setBatches(r.batches)).catch(() => {});
  useEffect(() => { list(); }, [id]);
  if (id) return <BatchView id={id} onBack={() => setId(null)}/>;
  return <>
    {batches.length ? <section className="step">
      <h2><span className="num">≡</span>Your batches</h2>
      <div className="chips">{batches.map((b) => <button key={b.id} className="chip" onClick={() => setId(b.id)}>{b.name} · {b.count} videos</button>)}</div>
    </section> : null}
    <NewBatch onCreated={setId}/>
    <p className="hint">One video at a time? Use <b>Make a video</b>: it works as before. Every video of a batch is also a normal project there.</p>
  </>;
}
