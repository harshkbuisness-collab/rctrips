import path from 'node:path';
import {bundle} from '@remotion/bundler';

const root = process.cwd();
const outDir = path.join(root, 'remotion-build');

console.log('Building Remotion bundle for Vercel Sandbox...');
await bundle({
  entryPoint: path.join(root, 'src/remotion/index.jsx'),
  publicDir: path.join(root, 'public'),
  outDir,
  webpackOverride: (config) => config,
});
console.log(`Remotion bundle ready: ${outDir}`);
