// Video plan straight from an AI (Gemini, OpenAI, or Claude through the Claude Code app on this computer): the tool sends the same prompt the user would copy, checks
// the JSON it gets back, and sends the tool's error list back until the JSON passes (or the tries run out).
// Keys live only on this computer: settings/ai.json (git-ignored), or GEMINI_API_KEY / OPENAI_API_KEY.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {ROOT} from '../scripts/project.mjs';

const FILE = path.join(ROOT, 'settings', 'ai.json');
// overridable only for tests
const GEMINI = process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1beta';
const OPENAI = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';

export const PROVIDERS = {gemini: 'Gemini', openai: 'OpenAI (ChatGPT)', claude: 'Claude (Claude Code)'};
const DEFAULTS = {gemini: 'gemini-flash-latest', openai: '', claude: 'default'};

const readFile = () => (fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {});

// {provider, gemini: {key, model}, openai: {key, model}} (older files had key/model at the top = Gemini)
export function aiSettings() {
  const s = readFile();
  const env = {gemini: process.env.GEMINI_API_KEY, openai: process.env.OPENAI_API_KEY};
  const one = (p) => {
    const own = s[p] || (p === 'gemini' && s.key ? {key: s.key, model: s.model} : {});
    return {key: own.key || env[p] || '', model: own.model || DEFAULTS[p], fromEnv: !own.key && Boolean(env[p])};
  };
  const gemini = one('gemini'), openai = one('openai');
  // Claude Code uses the login of the app on this computer (Claude Pro plan): no key, just "enabled after a test"
  const claude = {key: s.claude?.enabled ? 'claude-code' : '', model: s.claude?.model || DEFAULTS.claude, fromEnv: false};
  const provider = s.provider && PROVIDERS[s.provider] ? s.provider : (gemini.key || !openai.key ? 'gemini' : 'openai');
  return {provider, gemini, openai, claude};
}

export function saveAiSettings(provider, patch) {
  const s = readFile();
  if (s.key && !s.gemini) { s.gemini = {key: s.key, model: s.model}; delete s.key; delete s.model; }
  if (patch.use) s.provider = provider;
  const {use, ...rest} = patch;
  s[provider] = {...(s[provider] || {}), ...rest};
  fs.mkdirSync(path.dirname(FILE), {recursive: true});
  fs.writeFileSync(FILE, JSON.stringify(s, null, 2));
}

class ModelGone extends Error {}
class Busy extends Error {} // the provider's servers are overloaded right now (5xx)
const sleep = (s) => new Promise((ok) => setTimeout(ok, s * 1000));

// fetch with a time limit and messages a person can act on
async function call(name, url, opts, seconds) {
  if (typeof fetch !== 'function') throw new Error('Node.js is too old for the AI button. Install Node.js 20 or newer from https://nodejs.org and run START.bat again.');
  try {
    return await fetch(url, {...opts, signal: AbortSignal.timeout(seconds * 1000)});
  } catch (e) {
    if (e.name === 'TimeoutError' || e.name === 'AbortError') throw new Error(`${name} did not answer within ${seconds} s. Try again.`);
    throw new Error(`Could not reach the ${name} server (${e.cause?.code || e.cause?.message || e.message}). Check the internet connection, VPN or firewall/antivirus.`);
  }
}

async function errorText(res) {
  try { return (await res.json())?.error?.message || ''; } catch { return ''; }
}

// ---------- Gemini ----------
const gemini = {
  name: 'Gemini',
  async list(key) {
    const res = await call('Gemini', `${GEMINI}/models?pageSize=1000`, {headers: {'x-goog-api-key': key}}, 30);
    if (!res.ok) throw new Error(await this.explain(res));
    const {models = []} = await res.json();
    return models
      .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent') && /gemini/i.test(m.name)
        && !/embedding|image|tts|audio|live|robotics|omni|transcribe|customtools/i.test(m.name))
      .map((m) => m.name.replace(/^models\//, ''))
      .sort((a, b) => b.localeCompare(a, undefined, {numeric: true}));
  },
  async explain(res) {
    const msg = await errorText(res);
    if (res.status === 400 && /api key/i.test(msg)) return 'The Gemini API key is not valid. Check it in Library → AI settings.';
    if (res.status === 403) return `Gemini refused the key (${msg || 'permission denied'}). Make sure the Generative Language API is enabled for it.`;
    if (res.status === 429) return 'Gemini says the limit is reached (too many requests or the free quota is used up). Wait a minute, or pick a flash model.';
    return `Gemini error ${res.status}: ${msg || res.statusText}`;
  },
  request(key, model, messages, maxTokens) {
    return call('Gemini', `${GEMINI}/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: {'x-goog-api-key': key, 'Content-Type': 'application/json'},
      body: JSON.stringify({
        contents: messages.map((m) => ({role: m.role === 'assistant' ? 'model' : 'user', parts: [{text: m.text}]})),
        generationConfig: {responseMimeType: 'application/json', temperature: 0.7, maxOutputTokens: maxTokens},
      }),
    }, 600);
  },
  async read(res) {
    const data = await res.json();
    const cand = data.candidates?.[0];
    if (!cand) throw new Error(`Gemini returned no answer${data.promptFeedback?.blockReason ? ` (blocked: ${data.promptFeedback.blockReason})` : ''}.`);
    return {text: (cand.content?.parts || []).filter((p) => !p.thought && p.text).map((p) => p.text).join(''), cut: cand.finishReason === 'MAX_TOKENS', reason: cand.finishReason};
  },
  // best for plans on a free key: the "flash-latest" alias, then the highest numbered stable flash, lite, pro
  ranked(models) {
    const ver = (m) => Number(m.match(/(\d+(?:\.\d+)?)/)?.[1] || 0);
    return [...models.filter((m) => /^gemini-flash-latest$/.test(m)),
      ...models.filter((m) => /flash/.test(m) && !/preview|exp|lite|latest/.test(m)).sort((a, b) => ver(b) - ver(a)),
      ...models.filter((m) => /flash-lite/.test(m) && !/preview|exp/.test(m)).sort((a, b) => ver(b) - ver(a)),
      ...models.filter((m) => /^gemini-pro-latest$/.test(m))];
  },
};

// ---------- OpenAI ----------
const openai = {
  name: 'OpenAI',
  async list(key) {
    const res = await call('OpenAI', `${OPENAI}/models`, {headers: {Authorization: `Bearer ${key}`}}, 30);
    if (!res.ok) throw new Error(await this.explain(res));
    const {data = []} = await res.json();
    return data.map((m) => m.id)
      .filter((id) => /^(gpt-|o\d|chatgpt-)/.test(id) && !/audio|realtime|tts|transcribe|image|search|instruct|embedding|moderation|codex|computer/i.test(id))
      .sort((a, b) => b.localeCompare(a, undefined, {numeric: true}));
  },
  async explain(res) {
    const msg = await errorText(res);
    if (res.status === 401) return 'The OpenAI API key is not valid. Check it in Library → AI settings.';
    if (res.status === 429 && /quota|billing/i.test(msg)) return 'OpenAI says this key has no credit left (quota). Add billing / credit at platform.openai.com, or use Gemini.';
    if (res.status === 429) return 'OpenAI says too many requests. Wait a minute and try again.';
    if (res.status === 403) return `OpenAI refused the request (${msg || 'permission denied'}). The key may not have access to this model.`;
    return `OpenAI error ${res.status}: ${msg || res.statusText}`;
  },
  request(key, model, messages, maxTokens) {
    return call('OpenAI', `${OPENAI}/chat/completions`, {
      method: 'POST',
      headers: {Authorization: `Bearer ${key}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({
        model,
        messages: messages.map((m) => ({role: m.role, content: m.text})),
        response_format: {type: 'json_object'},
        ...(maxTokens < 4000 ? {max_completion_tokens: maxTokens} : {}),
      }),
    }, 600);
  },
  async read(res) {
    const data = await res.json();
    const choice = data.choices?.[0];
    if (!choice) throw new Error('OpenAI returned no answer.');
    return {text: choice.message?.content || '', cut: choice.finish_reason === 'length', reason: choice.finish_reason};
  },
  // newest full GPT model first (best plans), then mini versions
  ranked(models) {
    const ver = (m) => Number(m.match(/(\d+(?:\.\d+)?)/)?.[1] || 0);
    const gpt = models.filter((m) => /^gpt-\d/.test(m) && !/preview|nano|-\d{4}-\d{2}-\d{2}$/.test(m));
    return [...gpt.filter((m) => !/mini/.test(m)).sort((a, b) => ver(b) - ver(a)),
      ...gpt.filter((m) => /mini/.test(m)).sort((a, b) => ver(b) - ver(a))];
  },
};

// ---------- Claude Code (uses the Claude Pro / Max plan the app is logged in with) ----------
// Runs `claude -p` in the background: no window, no tools, no files, just text in and the answer out.
function runClaude(model, prompt) {
  return new Promise((resolve, reject) => {
    const args = ['-p', '--output-format', 'json', '--tools', '""', '--strict-mcp-config', '--no-session-persistence',
      '--system-prompt', '"You are a video editor. Answer with ONE JSON object only: no prose, no markdown fences."',
      ...(model && model !== 'default' ? ['--model', model] : [])];
    const win = process.platform === 'win32';
    // an empty folder, so no project files or settings are read
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-claude-'));
    const p = spawn('claude', win ? args : args.map((a) => a.replace(/^"(.*)"$/s, '$1')), {cwd, shell: win, windowsHide: true});
    let out = '', err = '';
    const timer = setTimeout(() => { p.kill(); reject(new Error('Claude Code did not answer within 10 minutes. Try again.')); }, 600000);
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('error', (e) => {
      clearTimeout(timer);
      reject(new Error(e.code === 'ENOENT' ? 'Claude Code is not installed on this computer (the "claude" command was not found).' : `Could not start Claude Code: ${e.message}`));
    });
    p.on('close', (code) => {
      clearTimeout(timer);
      fs.rmSync(cwd, {recursive: true, force: true});
      if (/not recognized|command not found/i.test(err)) return reject(new Error('Claude Code is not installed on this computer (the "claude" command was not found).'));
      let data;
      try { data = JSON.parse(out); } catch { return reject(new Error(`Claude Code stopped (${code}): ${(err || out).trim().split('\n').pop() || 'no answer'}`)); }
      resolve(data);
    });
    p.stdin.end(prompt);
  });
}

const claude = {
  name: 'Claude',
  direct: true,
  async list() {
    return ['default', 'sonnet', 'opus', 'haiku'];
  },
  ranked(models) {
    return models;
  },
  async run(model, messages) {
    // one prompt: the task, then (when fixing) the last answer and the tool's error list
    const prompt = messages.map((m, i) => (i === 0 ? m.text : m.role === 'assistant' ? `Your previous answer:\n${m.text}` : m.text)).join('\n\n---\n\n');
    const data = await runClaude(model, prompt);
    const text = String(data.result ?? '');
    if (data.is_error || data.subtype !== 'success') {
      if (/log ?in|auth|api key|credential|401/i.test(text)) throw new Error('Claude Code is not logged in. Open a Command Prompt, type claude, log in with your Claude account, then try again.');
      if (/overload|529|503/i.test(text)) throw new Busy(`Claude: ${text}`);
      if (/limit|usage/i.test(text)) throw new Error(`Your Claude plan's usage limit is reached (${text}). Wait until it resets, or use Gemini.`);
      if (/model/i.test(text)) throw new ModelGone(`Claude Code cannot use the model "${model}" (${text}). Pick "default" in Library → AI settings.`);
      throw new Error(`Claude Code: ${text || data.subtype || 'error'}`);
    }
    return text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  },
};

const API = {gemini, openai, claude};

export async function listModels(provider, key) {
  return API[provider].list(key);
}

// one answer, retrying a short hiccup; 5xx after the waits -> Busy, 404 -> ModelGone
async function generate(provider, key, model, messages, {maxTokens = 65536, waits = [4, 10], onWait} = {}) {
  const api = API[provider];
  if (api.direct) {
    const text = await api.run(model, messages);
    if (!text.trim()) throw new Error(`${api.name} returned an empty answer.`);
    return text;
  }
  let res;
  for (let i = 0; ; i++) {
    res = await api.request(key, model, messages, maxTokens);
    if (![500, 502, 503, 504, 529].includes(res.status)) break;
    if (i >= waits.length) {
      const msg = await errorText(res);
      throw new Busy(`${model}: ${api.name} error ${res.status}${msg ? ` (${msg})` : ''}`);
    }
    onWait?.(`${model} is busy; asking again in ${waits[i]} s…`);
    await sleep(waits[i]);
  }
  if (res.status === 404) {
    // providers retire models; Gemini's message usually names the replacement ("use models/gemini-3.5-flash-lite")
    const msg = await api.explain(res);
    const e = new ModelGone(`${api.name} does not offer ${model} to this key (${msg}). Pick another model in Library → AI settings.`);
    e.replacement = msg.match(/use\s+(?:models\/)?(gemini[\w.-]*\w)/i)?.[1];
    throw e;
  }
  if (!res.ok) throw new Error(await api.explain(res));
  const {text, cut, reason} = await api.read(res);
  if (cut) throw new Error('The script is too long for one answer from this model. Try a bigger model, or make the plan in parts by copying the prompt.');
  if (!text.trim()) throw new Error(`${api.name} returned an empty answer (${reason || 'no reason given'}).`);
  return text;
}

// A model can be listed but closed to this key: try it with a tiny request.
export async function usableModel(provider, key, preferred, models) {
  const order = [...new Set([preferred, ...API[provider].ranked(models), ...models])].filter(Boolean);
  let lastErr = null, busy = null;
  for (const m of order.slice(0, 6)) {
    try {
      await generate(provider, key, m, [{role: 'user', text: 'Reply with the JSON object {"ok": true}'}], {maxTokens: 1024, waits: [3]});
      return {model: m};
    } catch (e) {
      lastErr = e;
      if (e instanceof ModelGone) { if (e.replacement && !order.includes(e.replacement)) order.splice(order.indexOf(m) + 1, 0, e.replacement); continue; }
      if (e instanceof Busy) { busy ??= m; continue; } // exists but overloaded: try the next one
      if (/too long|empty answer/i.test(e.message)) return {model: m}; // it answered: the model works
      throw e; // key, quota or network problem: no point trying other models
    }
  }
  // every model tried was only busy: keep the first; the plan button waits and switches models itself
  if (busy) return {model: busy, busy: true};
  throw lastErr || new Error(`No ${API[provider].name} model works with this key.`);
}

// Free keys often meet "high demand" (5xx). Keep going round the usable models for a few minutes before giving up.
async function askPatiently(provider, key, first, messages, onStep, minutes = 4) {
  const api = API[provider];
  const others = api.ranked(await api.list(key).catch(() => [])).filter((m) => m !== first).slice(0, provider === 'gemini' ? 6 : 2);
  const models = [first, ...others];
  const until = Date.now() + minutes * 60000;
  let lastBusy = '';
  for (let round = 1; ; round++) {
    for (const m of models) {
      onStep(round === 1 && m === first ? `Asking ${m} for the video plan…` : `${api.name} is busy; trying ${m} (round ${round})…`);
      try {
        return {answer: await generate(provider, key, m, messages, {waits: [], onWait: onStep}), model: m};
      } catch (e) {
        if (e instanceof ModelGone && m !== first) continue;
        if (!(e instanceof Busy)) throw e;
        lastBusy = e.message;
      }
    }
    if (Date.now() + 20000 > until) break;
    for (let s = 20; s > 0; s -= 5) { onStep(`All ${api.name} models are busy right now. Trying again in ${s} s…`); await sleep(5); }
  }
  throw new Error(`${api.name} stayed overloaded for ${minutes} minutes (last answer: ${lastBusy}). This is on their side; try again later, or use "Copy prompt" with ChatGPT / Claude.`);
}

// prompt + worked examples -> JSON that passes the tool's checks
export async function planWithAi({prompt, examples, check, onStep, tries = 3}) {
  const s = aiSettings();
  const provider = s.provider;
  const {key} = s[provider];
  let {model} = s[provider];
  const name = API[provider].name;
  if (!key) throw new Error(`Add your ${name} API key first (Library → AI settings).`);
  if (!model) model = API[provider].ranked(await listModels(provider, key))[0];
  if (!model) throw new Error(`Pick a ${name} model in Library → AI settings.`);
  const intro = examples
    ? `Here is the editor's guide with rules and complete worked examples. Study it, then do the task that follows.\n\n${examples}\n\n---\n\n`
    : '';
  const task = `${intro}${prompt}\n\nIMPORTANT: answer with ONE complete JSON object for the WHOLE script (do not split it into parts).`;
  const messages = [{role: 'user', text: task}];
  let last = null, best = null, polish = 0;
  for (let attempt = 1; attempt <= tries + 1; attempt++) {
    if (attempt > 1) onStep(`Fixing ${last.errors.length} problem(s), try ${attempt - 1} of ${tries}…`);
    const step = attempt === 1 ? onStep : (x) => onStep(`Fix ${attempt - 1}: ${x}`);
    let answer;
    try {
      ({answer, model} = await askPatiently(provider, key, model, messages, step));
    } catch (e) {
      if (!(e instanceof ModelGone && e.replacement)) throw e;
      onStep(`${model} is retired; switching to ${e.replacement}…`);
      model = e.replacement;
      saveAiSettings(provider, {model});
      ({answer, model} = await askPatiently(provider, key, model, messages, step));
    }
    const result = await check(answer);
    if (result.ok) {
      best = {json: answer, check: result, attempts: attempt, model, provider: name};
      // a working plan: let the AI improve the weak spots the quality check found (empty moments, rhythm…), twice at most
      if (!result.quality?.length || polish >= 2) return best;
      polish++;
      onStep(`Plan works. Improving ${result.quality.length} weak spot(s), round ${polish} of 2…`);
      messages.push({role: 'assistant', text: answer});
      messages.push({role: 'user', text: `The plan works. The quality check found these weak spots. Improve them (keep everything that is good) and send the FULL corrected JSON again (one object, nothing else):\n\n${result.quality.map((e) => `- ${e}`).join('\n')}`});
      attempt--;
      continue;
    }
    if (best) return best;
    last = {...result, json: answer};
    messages.push({role: 'assistant', text: answer});
    messages.push({role: 'user', text: `The tool found these problems in your JSON. Fix all of them and send the FULL corrected JSON again (one object, nothing else):\n\n${result.errors.map((e) => `- ${e}`).join('\n')}`});
  }
  const err = new Error(`The AI could not fix every problem after ${tries} tries. The last JSON is in the box: press "Check & preview" to see what is left, or make the plan again.`);
  err.last = last;
  throw err;
}
