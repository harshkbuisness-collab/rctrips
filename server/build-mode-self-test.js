import fs from 'node:fs';
import assert from 'node:assert/strict';
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url),'utf8'));
const cfg=fs.readFileSync(new URL('../next.config.mjs', import.meta.url),'utf8');
assert.match(pkg.scripts.build,/next build --webpack/);
assert.match(pkg.scripts.dev,/next dev --webpack/);
for (const p of ['@remotion/bundler','@remotion/renderer','@remotion/vercel','esbuild']) assert.ok(cfg.includes(`'${p}'`));
console.log('Build mode self-test: PASS');
