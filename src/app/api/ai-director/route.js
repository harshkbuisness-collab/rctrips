import {requireBasicAuth} from '../../../lib/security.js';
import {askJson, aiFromRequest} from '../../../lib/llm.js';
import {LIBRARY} from '../../../engine/library.js';
import {ICON_NAMES} from '../../../engine/icons.js';
import {STICKERS} from '../../../engine/stickers.js';
import {LOOKS} from '../../../engine/looks.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const OBJECTS = LIBRARY.filter((x) => x.kind === 'object');
const REACTIONS = LIBRARY.filter((x) => x.kind === 'reaction');

// AI director: per scene the keyword, a visual and a reaction sticker; plus the best template for the topic.
// Body: {scenes: [{id, text, words: [string]}], pickLook: boolean}
export async function POST(request) {
  const denied = requireBasicAuth(request);
  if (denied) return denied;
  try {
    const {scenes = [], pickLook = true} = await request.json().catch(() => ({}));
    const list = scenes.slice(0, 80).map((s) => ({id: String(s.id), words: (s.words || []).map(String).slice(0, 40)}));
    if (!list.length) return Response.json({error: 'No scenes to direct'}, {status: 400});
    const prompt = `You are the art director for short typography reels (Instagram/YouTube Shorts). The script may be English, Hinglish or Hindi.
For every scene below choose:
- "hero": index (0-based) of the ONE word to show big and coloured: the word carrying the meaning or emotion (numbers, results, pain points, product words). Never a filler word.
- "visual": an object id from VISUALS that clearly fits what the scene says, or "" if nothing fits well. Use visuals on about half the scenes, never two scenes in a row with the same visual.
- "sticker": a sticker id from STICKERS or a mascot pose from MASCOT for an emotional beat (joke, shock, pain, celebration), or "". Use on at most 1 in 4 scenes, and never on a scene that has a visual.
${pickLook ? '- Also choose "lookId": the one TEMPLATE that best fits the topic and tone, with a short "reason".' : ''}

VISUALS (id: keywords): ${OBJECTS.map((o) => `${o.id}: ${o.keywords.join('/')}`).join('; ')}
BASIC ICONS (also allowed as "visual"): ${ICON_NAMES.join(', ')}
STICKERS (id: label [tags]): ${STICKERS.map((s) => `${s.id}: ${s.label} [${(s.tags || []).join('/')}]`).join('; ')}
MASCOT: ${REACTIONS.map((r) => r.id).join(', ')}
${pickLook ? `TEMPLATES: ${LOOKS.map((l) => `${l.id}: ${l.label}`).join('; ')}` : ''}

SCENES (id: words with index):
${list.map((s) => `${s.id}: ${s.words.map((w, i) => `${i}=${w}`).join(' ')}`).join('\n')}

Return JSON: {${pickLook ? '"lookId":"...","reason":"...",' : ''}"scenes":[{"id":"...","hero":0,"visual":"","sticker":""}]}`;
    const a = await askJson(prompt, aiFromRequest(request));
    // Keep only answers that point at things the tool really has.
    const objectIds = new Set(OBJECTS.map((o) => o.id)), icons = new Set(ICON_NAMES);
    const stickerIds = new Set(STICKERS.map((s) => s.id)), mascot = new Set(REACTIONS.map((r) => r.id));
    const byId = Object.fromEntries(list.map((s) => [s.id, s]));
    const out = (a.scenes || []).filter((x) => byId[String(x.id)]).map((x) => {
      const n = byId[String(x.id)].words.length, hero = Number(x.hero);
      const v = String(x.visual || ''), st = String(x.sticker || '');
      return {
        id: String(x.id),
        hero: Number.isInteger(hero) && hero >= 0 && hero < n ? hero : -1,
        visual: objectIds.has(v) ? `lib:${v}` : icons.has(v) ? v : '',
        sticker: stickerIds.has(st) ? st : mascot.has(st) ? `lib:${st}` : '',
      };
    });
    const look = LOOKS.find((l) => l.id === a.lookId);
    return Response.json({scenes: out, lookId: pickLook && look ? look.id : '', reason: pickLook && look ? String(a.reason || '').slice(0, 200) : ''});
  } catch (e) {
    return Response.json({error: e.message || 'AI director failed'}, {status: 502});
  }
}
