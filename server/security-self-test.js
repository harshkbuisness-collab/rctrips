import assert from 'node:assert/strict';
import fs from 'node:fs';

const editor=fs.readFileSync(new URL('../src/ReelEditor.jsx',import.meta.url),'utf8');
const upload=fs.readFileSync(new URL('../src/app/api/upload-url/route.js',import.meta.url),'utf8');
const project=fs.readFileSync(new URL('../src/app/api/project/route.js',import.meta.url),'utf8');
const render=fs.readFileSync(new URL('../src/app/api/render/route.js',import.meta.url),'utf8');
const progress=fs.readFileSync(new URL('../src/app/api/render-progress/route.js',import.meta.url),'utf8');
const proxy=fs.readFileSync(new URL('../src/proxy.js',import.meta.url),'utf8');
const config=fs.readFileSync(new URL('../next.config.mjs',import.meta.url),'utf8');

assert.ok(editor.includes("/api/upload-url"),'Presigned private upload endpoint missing');
assert.ok(editor.includes('audioBlobPath'),'Private voice pathname is not retained');
assert.ok(upload.includes('requireBasicAuth(request)'),'Upload signing is not auth-gated');
assert.ok(upload.includes("operations:['put']"),'Upload URL is not scoped to PUT');
assert.ok(project.includes("access:'private'"),'Project save is not private');
assert.ok(render.includes("access:'private'"),'Render output is not private');
assert.ok(render.includes("audioCodec:'aac'"),'AAC audio option missing');
assert.ok(render.includes('enforceAudioTrack:true'),'Audio track enforcement missing');
assert.ok(progress.includes('signedGetUrl'),'Render download is not signed');
assert.ok(proxy.includes('WWW-Authenticate'),'App-level login gate missing');
assert.ok(config.includes('productionBrowserSourceMaps: false'),'Browser source maps are not disabled');
assert.ok(config.includes("X-Frame-Options"),'Security headers missing');
console.log('Secure Vercel self-test: PASS');
