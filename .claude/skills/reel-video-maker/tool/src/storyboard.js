// Storyboard: the plan cut into beats (a new scene, picture, sticker or graphic), each with the words spoken,
// what appears on screen and the sounds, so the video can be approved before it is rendered.
import {graphicSounds} from './mgLayout.js';

const nice = (id) => String(id || '').replace(/^(hero|prop)_/, '').replace(/_/g, ' ');
const q = (s) => `"${s}"`;

export function describeLayer(l) {
  switch (l.type) {
    case 'image': return /^prop_/.test(l.asset) ? `prop: ${nice(l.asset)}` : `H: ${nice(l.asset)}${l.enter ? ` (${typeof l.enter === 'string' ? l.enter : l.enter.type})` : ''}`;
    case 'poses': return `H moves: ${l.frames.map((f) => nice(f.asset)).join(' → ')}`;
    case 'video': return `video: ${nice(l.asset)}`;
    case 'text': return `${(l.y ?? 0.17) < 0.3 ? 'title' : l.look === 'box' ? 'sticker' : 'text'} ${q(l.text)}${l.strike !== undefined ? ' (crossed out)' : ''}${l.marker !== undefined ? ' (highlighted)' : ''}`;
    case 'banner': return `banner ${q(l.text)}`;
    case 'callout': return `callout ${q(l.text)}${l.anchor ? ` → ${l.anchor}` : ''}`;
    case 'checklist': return `checklist${l.title ? ` ${q(l.title)}` : ''}: ${l.items.map((i) => `${i.mark === 'cross' ? '✗' : '✓'} ${i.text}`).join(', ')}`;
    case 'bars': return `bar chart: ${l.items.map((i) => `${i.label} ${i.display ?? i.value}`).join(' vs ')}`;
    case 'ring': return `ring ${l.count ? `${l.count.from}→${l.count.to}` : l.text ?? ''}${l.label ? ` ${q(l.label)}` : ''}`;
    case 'stat': return `stat card ${l.count ? `${l.count.prefix ?? ''}${l.count.to}${l.count.suffix ?? ''}` : l.value ?? ''}${l.label ? ` ${q(l.label)}` : ''}`;
    case 'comment': return `comment ${q(l.text)}`;
    case 'chat': return `chat: ${l.messages.map((m) => q(m.text)).join(' / ')}`;
    case 'timeline': return `timeline: ${l.steps.map((s) => s.label).join(' → ')}`;
    case 'slider': return `before/after: ${l.before.label ?? 'before'} → ${l.after.label ?? 'after'}`;
    case 'kinetic': return `big words: ${l.lines.map((x) => x.text).join(' / ')}`;
    case 'versus': return `wrong vs right: ${l.left.label} / ${l.right.label}`;
    case 'icon': return `icon: ${l.name}${l.label ? ` ${q(l.label)}` : ''}`;
    case 'accent': return `accent: ${l.kind}`;
    case 'highlight': return `ring on ${l.anchor ?? 'a spot'}`;
    case 'arrow': return `arrow${l.pointing ? ` ${l.pointing}` : ''}${l.anchor ? ` at ${l.anchor}` : ''}`;
    case 'measure': return `measure ${l.label ?? ''}`.trim();
    case 'zoomBubble': return `zoom circle${l.anchor ? ` on ${l.anchor}` : ''}`;
    case 'counter': return `counter ${l.prefix ?? ''}${l.from ?? 0}→${l.to}${l.suffix ?? ''}`;
    case 'progress': return `progress bar${l.label ? ` ${q(l.label)}` : ''}`;
    case 'split': return `split screen (${l.cells.length})`;
    default: return l.type;
  }
}

// beats: [{t, until, scene, sceneStart, voice, onScreen: [..], sounds: [..]}]
export function storyboardBeats(timeline, maxBeats = 30) {
  const words = timeline.words;
  const end = Math.max(...timeline.scenes.map((s) => s.end), words.length ? words[words.length - 1].end : 0);
  const events = [];
  timeline.scenes.forEach((s, si) => {
    events.push({t: s.start, scene: si});
    s.layers.forEach((l) => events.push({t: l.at ?? s.start, scene: si, layer: l}));
  });
  events.sort((a, b) => a.t - b.t);
  let gap = 0.7, times;
  do {
    times = [];
    events.forEach((e) => { if (!times.length || e.t - times[times.length - 1] >= gap) times.push(e.t); });
    gap += 0.3;
  } while (times.length > maxBeats);
  const auto = timeline.audio?.autoSfx === false ? [] : timeline.scenes.flatMap((s) => s.layers.flatMap((l) => graphicSounds(l, l.at ?? s.start)));
  return times.map((t, i) => {
    const until = times[i + 1] ?? end;
    const inWin = (x) => x >= t - 0.001 && x < until - 0.001;
    const sceneIndex = timeline.scenes.reduce((k, s, j) => (s.start <= t + 0.001 ? j : k), 0);
    const scene = timeline.scenes[sceneIndex];
    const onScreen = events.filter((e) => e.layer && inWin(e.t)).map((e) => describeLayer(e.layer));
    const sounds = [...timeline.sfx.filter((x) => inWin(x.at)).map((x) => nice(x.src.replace(/^sfx_/, ''))),
      ...auto.filter((x) => inWin(x.at)).map((x) => `${nice(x.src.replace(/^sfx_/, ''))} (auto)`)];
    // the still: just after the last thing of this beat has appeared (its animation done), before the next beat
    const last = Math.max(t, ...events.filter((e) => e.layer && inWin(e.t)).map((e) => e.t));
    return {
      t, until, sceneIndex, still: Math.max(t, Math.min(until - 0.05, last + 0.9)), sceneId: scene.id ?? `scene ${sceneIndex + 1}`,
      sceneStart: Math.abs(scene.start - t) < 0.001,
      backdrop: scene.backdrop ?? 'auto', transition: typeof scene.transition === 'string' ? scene.transition : scene.transition?.type,
      voice: words.filter((w) => inWin(w.start)).map((w) => w.text).join(' '),
      onScreen: [...new Set(onScreen)], sounds: [...new Set(sounds)],
    };
  });
}
