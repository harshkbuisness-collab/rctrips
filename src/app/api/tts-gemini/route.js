import {requireBasicAuth} from '../../../lib/security.js';
import {geminiSpeech, wordTimings, shrinkPcm, wav} from '../../../lib/gemini.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Script → Gemini creator voice (WAV, base64) + word timings, the same shape as /api/tts.
export async function POST(request) {
  const denied = requireBasicAuth(request);
  if (denied) return denied;
  try {
    const {text = '', voice = 'ContentCreator', speed = 0} = await request.json().catch(() => ({}));
    const script = String(text).trim().slice(0, 5000);
    if (!script) return Response.json({error: 'Script is empty'}, {status: 400});
    const pcm = await geminiSpeech(script, voice, Number(speed) || 0);
    const {words, source} = await wordTimings(pcm, script);
    // Long voices are resampled to 16 kHz so the answer fits Vercel's response size limit.
    const big = pcm.length > 3_000_000;
    const audio = big ? wav(shrinkPcm(pcm), 16000) : wav(pcm);
    return Response.json({audio: audio.toString('base64'), format: 'wav', words, timing: source});
  } catch (e) {
    return Response.json({error: e.message || 'Gemini voice failed'}, {status: 502});
  }
}
