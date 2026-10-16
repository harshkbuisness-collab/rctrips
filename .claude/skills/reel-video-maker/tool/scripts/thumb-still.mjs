// Renders one full-size JPEG still per project (frame `--frame`, default 10): used to make thumbnails from a
// one-scene plan. usage: node scripts/thumb-still.mjs <projectDir> <out.jpg> [<projectDir> <out.jpg> ...]
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {browserExecutable, loadProject, ROOT} from './project.mjs';

const args = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.join(ROOT, 'src/index.jsx'), publicDir: path.join(ROOT, 'public')});
const exe = browserExecutable();
for (let i = 0; i + 1 < args.length; i += 2) {
  const p = loadProject(args[i]);
  if (!p.ok) throw new Error(`${args[i]}: ${p.errors.join('; ')}`);
  const inputProps = {timeline: p.timeline, library: p.library};
  const composition = await selectComposition({serveUrl, id: 'Reel', inputProps, browserExecutable: exe});
  await renderStill({composition, serveUrl, inputProps, browserExecutable: exe, frame: 10, output: args[i + 1], imageFormat: 'jpeg', jpegQuality: 92});
  console.log('still', args[i + 1]);
}
