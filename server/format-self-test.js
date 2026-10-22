import assert from 'node:assert/strict';
import {VIDEO_FORMATS, applyFormat, getActiveViewport, getLayoutProfile} from '../src/formats.js';

assert.equal(VIDEO_FORMATS.length, 3);

const portrait = applyFormat({}, 'portrait');
assert.deepEqual([portrait.width, portrait.height], [1080, 1920]);
assert.equal(getLayoutProfile(portrait).orientation, 'portrait');

const landscape = applyFormat({}, 'landscape');
assert.deepEqual([landscape.width, landscape.height], [1920, 1080]);
const landscapeProfile = getLayoutProfile(landscape);
assert.equal(landscapeProfile.orientation, 'landscape');
assert.ok(landscapeProfile.contentMaxWidth > 1500);

const hybrid = applyFormat({}, 'landscape-in-portrait');
assert.deepEqual([hybrid.width, hybrid.height], [1080, 1920]);
const vp = getActiveViewport(hybrid);
assert.equal(vp.mode, 'window');
assert.equal(vp.activeWidth, 1080);
assert.ok(Math.abs(vp.activeHeight - 607.5) < 0.01);
assert.ok(Math.abs(vp.offsetY - 656.25) < 0.01);
assert.equal(getLayoutProfile(hybrid).orientation, 'landscape');

console.log('Format self-test: PASS');
console.log('Portrait:', portrait.width+'x'+portrait.height);
console.log('Landscape:', landscape.width+'x'+landscape.height);
console.log('Hybrid export:', hybrid.width+'x'+hybrid.height, 'active 16:9:', `${vp.activeWidth}x${vp.activeHeight}`);
