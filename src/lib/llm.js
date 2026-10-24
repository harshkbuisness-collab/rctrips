// JSON answers from a text model: OpenCode Zen (OPENCODE_API_KEY) if set, otherwise Gemini (GEMINI_API_KEY).
import {geminiJson} from './gemini.js';

const OPENCODE_URL = 'https://opencode.ai/inference/openai/v1/chat/completions';

// Pull the JSON object out of a reply that may wrap it in ```json fences or text.
export function parseJsonReply(text) {
  const s = String(text || '').replace(/```(?:json)?/gi, '');
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('AI reply had no JSON');
  return JSON.parse(s.slice(a, b + 1));
}

export async function askJson(prompt) {
  const key = process.env.OPENCODE_API_KEY;
  if (!key && !process.env.GEMINI_API_KEY) throw new Error('No AI key set. Add OPENCODE_API_KEY (free models at opencode.ai) in Vercel → Settings → Environment Variables, then redeploy.');
  if (!key) return geminiJson(prompt);
  const res = await fetch(OPENCODE_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Authorization: `Bearer ${key}`},
    body: JSON.stringify({
      model: process.env.OPENCODE_MODEL || 'glm-5.3-flash-free',
      temperature: 0.4,
      messages: [{role: 'system', content: 'Reply with one JSON object only, no other text.'}, {role: 'user', content: prompt}],
    }),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`OpenCode error (${res.status}): ${d.error?.message || d.message || 'request failed'}`);
  return parseJsonReply(d.choices?.[0]?.message?.content);
}
