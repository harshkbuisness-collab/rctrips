// Generates a stand-in character library (simple SVG figure in several poses)
// so the engine can be tested before real artwork exists. Replace these with
// your own transparent PNGs and update public/library/library.json.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {PUBLIC} from './project.mjs';

const OUT = path.join(PUBLIC, 'library', 'demo');
fs.mkdirSync(OUT, {recursive: true});

const SKIN = '#F2C230', SKIN_BACK = '#D9A514', LINE = '#1A1A1A', SHORTS = '#3A3A3A';
const poses = {
  stand: {head: [250, 85], torso: [[250, 135], [250, 280]], limbs: [
    {back: 1, pts: [[262, 150], [285, 215], [290, 285]]}, {back: 1, pts: [[258, 285], [265, 370], [270, 462]]},
    {pts: [[242, 285], [235, 370], [230, 462]]}, {pts: [[238, 150], [215, 215], [210, 285]]}]},
  flex: {head: [250, 85], torso: [[250, 135], [250, 280]], limbs: [
    {pts: [[240, 285], [218, 370], [205, 462]]}, {pts: [[260, 285], [282, 370], [295, 462]]},
    {pts: [[215, 150], [148, 152], [146, 82]]}, {pts: [[285, 150], [352, 152], [354, 82]]}]},
  plank: {head: [405, 300], torso: [[372, 318], [205, 352]], limbs: [
    {back: 1, pts: [[362, 322], [356, 382], [352, 440]]}, {back: 1, pts: [[208, 354], [138, 392], [70, 432]]},
    {pts: [[200, 350], [130, 386], [60, 426]]}, {pts: [[372, 322], [374, 382], [376, 440]]}]},
  walk: {head: [392, 330], torso: [[360, 338], [232, 262]], limbs: [
    {back: 1, pts: [[352, 342], [352, 392], [354, 440]]}, {back: 1, pts: [[236, 266], [196, 346], [168, 436]]},
    {pts: [[228, 262], [184, 344], [148, 434]]}, {pts: [[362, 342], [370, 392], [376, 440]]}]},
  pike_top: {head: [372, 388], torso: [[345, 352], [250, 200]], limbs: [
    {back: 1, pts: [[338, 358], [348, 400], [354, 440]]}, {back: 1, pts: [[256, 205], [210, 322], [164, 436]]},
    {pts: [[250, 200], [200, 320], [150, 434]]}, {pts: [[347, 358], [360, 400], [372, 440]]}]},
  pike_bottom: {head: [388, 420], torso: [[338, 372], [255, 205]], limbs: [
    {back: 1, pts: [[330, 378], [300, 404], [340, 440]]}, {back: 1, pts: [[260, 210], [212, 324], [164, 436]]},
    {pts: [[255, 205], [202, 322], [150, 434]]}, {pts: [[338, 376], [310, 410], [362, 440]]}]},
};

const poly = (pts, color, width) => `<polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
const limb = (l) => poly(l.pts, LINE, 40) + poly(l.pts, l.back ? SKIN_BACK : SKIN, 30);

function svg(p, only) {
  const parts = [];
  const limbs = only ? p.limbs.filter(only) : p.limbs;
  if (!only) {
    p.limbs.filter((l) => l.back).forEach((l) => parts.push(limb(l)));
    parts.push(poly(p.torso, LINE, 66) + poly(p.torso, SKIN, 56));
    const [n, h] = p.torso;
    const s = [n[0] + (h[0] - n[0]) * 0.7, n[1] + (h[1] - n[1]) * 0.7];
    parts.push(poly([s, h], SHORTS, 60));
    p.limbs.filter((l) => !l.back).forEach((l) => parts.push(limb(l)));
    parts.push(`<circle cx="${p.head[0]}" cy="${p.head[1]}" r="40" fill="${SKIN}" stroke="${LINE}" stroke-width="5"/>`);
  } else {
    limbs.forEach((l) => parts.push(poly(l.pts, '#FFFFFF', 34)));
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 480" width="1000" height="960">${parts.join('')}</svg>`;
}

const assets = [];
for (const [name, p] of Object.entries(poses)) {
  fs.writeFileSync(path.join(OUT, `${name}.svg`), svg(p));
  assets.push({id: `demo_${name}`, file: `demo/${name}.svg`, kind: 'image', description: `placeholder figure, pose: ${name.replace('_', ' ')}`, tags: ['placeholder', name]});
}
// Mask: only the front leg of the pike pose, used by highlight shape "mask".
fs.writeFileSync(path.join(OUT, 'pike_top_legs_mask.svg'), svg(poses.pike_top, (l) => !l.back && l.pts[0][1] < 300));
assets.push({id: 'demo_pike_top_legs_mask', file: 'demo/pike_top_legs_mask.svg', kind: 'mask', description: 'mask of the front leg in demo_pike_top', tags: ['mask']});

// Sound effects (synthesised so the repo has no third-party audio).
const SFX = path.join(PUBLIC, 'library', 'sfx');
fs.mkdirSync(SFX, {recursive: true});
const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args]);
ff(['-f', 'lavfi', '-i', 'sine=frequency=900:duration=0.09', '-af', 'afade=t=out:st=0.02:d=0.07,volume=0.6', path.join(SFX, 'pop.wav')]);
ff(['-f', 'lavfi', '-i', 'anoisesrc=d=0.35:c=pink:a=0.5', '-af', 'highpass=f=600,afade=t=in:d=0.12,afade=t=out:st=0.15:d=0.2', path.join(SFX, 'whoosh.wav')]);
assets.push({id: 'sfx_pop', file: 'sfx/pop.wav', kind: 'audio', description: 'short pop', tags: ['sfx']});
assets.push({id: 'sfx_whoosh', file: 'sfx/whoosh.wav', kind: 'audio', description: 'soft whoosh for transitions', tags: ['sfx']});

fs.writeFileSync(path.join(PUBLIC, 'library', 'library.json'), JSON.stringify({assets}, null, 2) + '\n');
console.log(`wrote ${assets.length} assets to public/library/`);
