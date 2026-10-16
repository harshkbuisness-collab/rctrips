// usage: npm run render -- public/projects/<name> [out.mp4]
import path from 'node:path';
import {loadProject, report, ROOT} from './project.mjs';
import {renderProject} from './render-lib.mjs';

const [target, outArg] = process.argv.slice(2);
if (!target) {
  console.log('usage: npm run render -- public/projects/<name> [out.mp4]');
  process.exit(1);
}
const project = loadProject(target);
report(project);
if (!project.ok) process.exit(1);
const out = path.resolve(outArg ?? path.join(ROOT, 'out', `${path.basename(project.dir)}.mp4`));
let last = -1;
console.log('rendering…');
await renderProject(project, out, (p) => {
  const pct = Math.floor(p * 10) * 10;
  if (pct !== last) console.log(`  ${pct}%`), (last = pct);
});
console.log(`done → ${path.relative(process.cwd(), out)}`);
