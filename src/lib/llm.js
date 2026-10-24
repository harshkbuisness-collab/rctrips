// JSON answers from a text model, chosen in the tool's ⚙ AI settings:
// - Gemini with the user's key (or the server's GEMINI_API_KEY), or
// - any OpenAI-compatible endpoint (Free LLM API, OpenRouter, Groq, ...) with base URL + key + model.
import {geminiJson} from './gemini.js';

// Pull the JSON object out of a reply that may wrap it in ```json fences or text.
export function parseJsonReply(text) {
  const s = String(text || '').replace(/```(?:json)?/gi, '');
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('AI reply had no JSON');
  return JSON.parse(s.slice(a, b + 1));
}

// The server calls the base URL itself, so only public https hosts are allowed;
// local addresses (e.g. Free LLM API on localhost) work only when the tool runs in local mode.
export function checkBaseUrl(raw) {
  let u;
  try { u = new URL(String(raw || '').trim()); } catch { throw new Error('AI base URL is not a valid URL'); }
  const host = u.hostname.toLowerCase();
  const local = host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal') || host === '0.0.0.0' || host === '[::1]'
    || /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
  if (local && process.env.LOCAL_TOOL_MODE !== '1') throw new Error('Local AI addresses (localhost) only work when the tool runs on your own computer. Use an online provider such as OpenRouter here.');
  if (!local && u.protocol !== 'https:') throw new Error('AI base URL must start with https://');
  return u.toString().replace(/\/+$/, '');
}

// ai: {provider: 'gemini' | 'openai', key, base, model} from request headers.
export async function askJson(prompt, ai = {}) {
  if (ai.provider !== 'openai') return geminiJson(prompt, ai.key || '');
  if (!ai.model) throw new Error('Choose a model name in ⚙ AI settings (for Free LLM API use: auto).');
  const res = await fetch(`${checkBaseUrl(ai.base)}/chat/completions`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', ...(ai.key ? {Authorization: `Bearer ${ai.key}`} : {})},
    body: JSON.stringify({
      model: ai.model,
      temperature: 0.4,
      messages: [{role: 'system', content: 'Reply with one JSON object only, no other text.'}, {role: 'user', content: prompt}],
    }),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`AI provider error (${res.status}): ${d.error?.message || d.message || 'request failed'}`);
  return parseJsonReply(d.choices?.[0]?.message?.content);
}

export const aiFromRequest = (request) => ({
  provider: request.headers.get('x-ai-provider') || 'gemini',
  key: request.headers.get('x-ai-key') || request.headers.get('x-gemini-key') || '',
  base: request.headers.get('x-ai-base') || '',
  model: request.headers.get('x-ai-model') || '',
});
