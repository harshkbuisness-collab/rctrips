// Builds the text the user pastes into Claude: instructions + image library + script.
import fs from 'node:fs';
import path from 'node:path';
import {ROOT} from '../scripts/project.mjs';

const MOVE_ORDER = ['start', 'top', 'down', 'open', 'mid', 'bottom', 'up', 'closed', 'end', 'a', 'b'];

// hero_pushup_top / _mid / _bottom -> "hero_pushup: top → mid → bottom"
function movementSets(ids) {
  const groups = new Map();
  for (const id of ids) {
    const m = id.match(/^(.*)_(start|top|mid|bottom|end|down|up|open|closed|a|b)$/);
    if (!m) continue;
    if (!groups.has(m[1])) groups.set(m[1], []);
    groups.get(m[1]).push(m[2]);
  }
  return [...groups].filter(([, s]) => s.length > 1)
    .map(([base, s]) => `${base}: ${s.sort((x, y) => MOVE_ORDER.indexOf(x) - MOVE_ORDER.indexOf(y)).map((x) => `${base}_${x}`).join(' → ')}`);
}

export function libraryText(library) {
  const assets = library.assets.filter((a) => a.kind !== 'mask' && a.kind !== 'audio' && !a.id.startsWith('demo_'));
  const byBase = new Map();
  for (const a of assets) {
    const base = a.id.replace(/_v\d+$/, '');
    if (!byBase.has(base)) byBase.set(base, {main: null, alts: []});
    const g = byBase.get(base);
    if (base === a.id) g.main = a;
    else g.alts.push(a.id.slice(base.length));
  }
  const line = ([base, g]) => {
    const desc = (g.main?.description ?? '').replace(/^H: /, '').replace(/ \(alternative drawing\)$/, '');
    const alts = g.alts.length ? ` (other drawings: ${g.alts.sort().join(', ')})` : '';
    const noBody = g.main?.noPoints ? ' [no body parts: place rings with x/y]' : '';
    return `- ${base}: ${desc}${alts}${noBody}`;
  };
  const chars = [...byBase].filter(([b]) => b.startsWith('hero_'));
  const props = [...byBase].filter(([b]) => !b.startsWith('hero_'));
  const GROUPS = {transition: 'Transitions', ui: 'Pops, clicks, dings', impact: 'Impacts', meme: 'Reactions & memes (voice clips: use sparingly)', body: 'Body', ambience: 'Ambience (long, quiet)'};
  const sounds = library.assets.filter((a) => a.kind === 'audio');
  const clips = library.assets.filter((a) => a.kind === 'video' && a.id.startsWith('clip_'));
  const sfx = Object.entries(GROUPS).flatMap(([k, title]) => {
    const list = sounds.filter((a) => (a.category || 'ui') === k);
    return list.length ? [`**${title}**`, ...list.map((a) => `- ${a.id}: ${a.description}${a.duration ? ` (${a.duration} s)` : ''}`)] : [];
  });
  return [
    `### Character images (${chars.length})`, ...chars.map(line), '',
    '### Movement sets (use as poses frames, in this order)', ...movementSets(chars.map(([b]) => b)), '',
    `### Props (${props.length})`, ...props.map(line), '',
    ...(clips.length ? ['### Animation clips (H really moves: use these for the exercise instead of still poses)', ...clips.map((a) => `- ${a.id}: ${a.description}`), ''] : []),
    '### Sound effects', ...sfx,
  ].join('\n');
}

export function buildPrompt(library, script, format = 'vertical') {
  let instructions = fs.readFileSync(path.join(ROOT, 'prompts', 'generate-timeline.md'), 'utf8');
  if (format === 'landscape') {
    instructions = instructions.replace('short vertical fitness reels (1080×1920)', 'landscape 16:9 fitness YouTube videos (1920×1080)');
    instructions += `\n\n${fs.readFileSync(path.join(ROOT, 'prompts', 'format-landscape.md'), 'utf8')}`;
  }
  else instructions = instructions.replace('Return **one JSON object only**', 'This is a VERTICAL 9:16 reel (1080×1920). Return **one JSON object only**');
  return `${instructions}\n\n## Image library\n\n${libraryText(library)}\n\n## Script (the voiceover says exactly this)\n\n${script.trim()}\n\nNow write the JSON for this script.`;
}

// One master prompt for a whole batch: the rules and the library once, then every video's script.
// Claude answers with one JSON per video (files 01-….json, or "=== VIDEO n ===" before each), which the batch imports in one go.
export function buildBatchPrompt(library, videos, format = 'vertical') {
  let instructions = fs.readFileSync(path.join(ROOT, 'prompts', 'generate-timeline.md'), 'utf8');
  const kind = format === 'landscape' ? 'landscape 16:9 videos (1920×1080)' : 'VERTICAL 9:16 reels (1080×1920)';
  if (format === 'landscape') {
    instructions = instructions.replace('short vertical fitness reels (1080×1920)', 'landscape 16:9 fitness YouTube videos (1920×1080)');
    instructions += `\n\n${fs.readFileSync(path.join(ROOT, 'prompts', 'format-landscape.md'), 'utf8')}`;
  }
  instructions = instructions.replace('Return **one JSON object only**: no prose, no markdown fences.',
    `This is a BATCH of ${videos.length} ${kind}. Write **one JSON object per video** (see "How to answer" at the end).`);
  const list = videos.map((v) => `### VIDEO ${v.n}: ${v.title}\n\n${v.script.trim()}`).join('\n\n');
  return `${instructions}\n\n## Image library\n\n${libraryText(library)}\n\n## The ${videos.length} videos (each voiceover says exactly this)\n\n${list}\n\n`
    + `## How to answer\n\n`
    + `Write one complete JSON plan for EVERY video above, in order. Each plan follows all the rules above on its own: its times are words of THAT video's script only.\n`
    + `- If you can create files: one file per video, named with its number first (\`01-short-title.json\`, \`02-short-title.json\`, …), each containing only that video's JSON.\n`
    + `- Otherwise answer in plain text: before each plan a line \`=== VIDEO 1 ===\` (the number from the list), then the JSON object. No other text.\n`
    + `- If the answer gets too long, stop after a complete video and write "continue from VIDEO n": I will ask you to continue.\n\n`
    + `Now write the ${videos.length} JSON plans.`;
}
