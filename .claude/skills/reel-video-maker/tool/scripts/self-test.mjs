// Fast checks that need no browser: schema, validator messages, SRT parsing, demo project.
import assert from 'node:assert/strict';
import {checkTimeline} from '../src/schema.js';
import {srtToWords} from './srt-to-words.mjs';
import {loadProject} from './project.mjs';
import {phrases} from '../src/words.js';

const lib = {assets: [{id: 'a', file: 'x.png'}]};
const ok = checkTimeline({scenes: [{start: 0, end: 2, layers: [{type: 'image', asset: 'a'}]}]}, lib);
assert.ok(ok.ok, ok.errors.join('\n'));
assert.equal(ok.timeline.canvas.width, 1080);

const bad = checkTimeline({scenes: [{start: 2, end: 1, layers: [{type: 'image', asset: 'nope'}, {type: 'wobble'}]}]}, lib);
assert.equal(bad.ok, false);
assert.ok(bad.errors.some((e) => e.includes('wobble') || e.includes('type')), bad.errors.join('\n'));

const timing = checkTimeline({scenes: [{start: 2, end: 1, layers: [{type: 'image', asset: 'nope'}]}]}, lib);
assert.ok(timing.errors.some((e) => e.includes('end (1) must be after start')));
assert.ok(timing.errors.some((e) => e.includes('unknown asset "nope"')));

const words = srtToWords('1\n00:00:01,000 --> 00:00:02,000\nhello big world\n\n2\n00:00:02,500 --> 00:00:02,900\nyes\n');
assert.equal(words.length, 4);
assert.equal(words[0].start, 1);
assert.ok(Math.abs(words[2].end - 2) < 0.01);
assert.deepEqual(words[3], {text: 'yes', start: 2.5, end: 2.9});

const groups = phrases([{text: 'a', start: 0, end: 0.2}, {text: 'b.', start: 0.2, end: 0.4}, {text: 'c', start: 0.5, end: 0.6}], 3);
assert.equal(groups.length, 2);

const demo = loadProject('public/projects/demo');
assert.ok(demo.ok, demo.errors.join('\n'));
assert.ok(demo.timeline.words.length > 10);
console.log('✔ all self-tests passed');

// script words as times
import {makeTimeResolver} from '../src/timeRefs.js';
const tw = [{text: 'Number', start: 1, end: 1.3}, {text: 'one:', start: 1.3, end: 1.6}, {text: 'lift', start: 2, end: 2.2},
  {text: 'your', start: 2.2, end: 2.3}, {text: 'legs.', start: 2.3, end: 2.6}, {text: 'Number', start: 3, end: 3.3}, {text: 'two', start: 3.3, end: 3.5}];
const errs = [];
const tr = makeTimeResolver(tw);
assert.equal(tr('lift your legs', 'a', errs), 2);
assert.equal(tr('lift your legs|end', 'a', errs), 2.6);
assert.equal(tr('Lift YOUR legs+0.25', 'a', errs), 2.25);
assert.equal(tr('number#2', 'a', errs), 3);
assert.equal(tr(4.5, 'a', errs), 4.5);
assert.equal(errs.length, 0);
tr('number', 'b', errs);
tr('jump', 'c', errs);
assert.ok(errs[0].includes('spoken 2 times') && errs[1].includes('not in the script'), errs.join('\n'));

// body-part anchors
import {imageAnchor, parseAnchor} from '../src/anchors.js';
assert.deepEqual(parseAnchor('left_hand'), {base: 'hands', side: 'left'});
assert.deepEqual(parseAnchor('Glutes'), {base: 'hips', side: null});
assert.equal(parseAnchor('elbowpit'), null);
const pts = {nose: [0.5, 0.1], shoulder_l: [0.6, 0.2], shoulder_r: [0.4, 0.2], elbow_l: [0.7, 0.3], elbow_r: [0.3, 0.3],
  wrist_l: [0.7, 0.4], wrist_r: [0.3, 0.4], hip_l: [0.55, 0.5], hip_r: [0.45, 0.5], knee_l: [0.55, 0.7], knee_r: [0.45, 0.7], ankle_l: [0.55, 0.9], ankle_r: [0.45, 0.9]};
const hands = imageAnchor({size: [100, 100], bbox: [0, 0, 1, 1], points: pts}, 'hands');
assert.equal(hands.points.length, 2);
assert.deepEqual(imageAnchor({size: [100, 100], bbox: [0, 0, 1, 1], points: pts}, 'left_hand').points, [[0.3, 0.4]]);
const noScene = checkTimeline({scenes: [{start: 0, layers: [{type: 'highlight', anchor: 'elbowpit'}]}]}, lib);
assert.ok(noScene.errors.some((e) => e.includes('unknown body part')), noScene.errors.join('\n'));
console.log('✔ time + anchor tests passed');

// Invalid occurrence indices must not silently bind to a different spoken word.
for (const ref of ['number#0', 'number#3', 'number|end#99+0.3']) {
  const errors = [];
  assert.equal(tr(ref, 'occurrence', errors), 0);
  assert.ok(errors.some((e) => e.includes('does not exist')), ref);
}
assert.equal(tr('number|end#2+0.3', 'occurrence', []), 3.6);
console.log('✔ occurrence bounds tests passed');
