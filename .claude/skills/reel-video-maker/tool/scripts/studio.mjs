// Live preview with scrubbing: npm run studio -- public/projects/<name>
// Edit timeline.json, then re-run this command to reload it.
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {browserExecutable, loadProject, report, ROOT} from './project.mjs';

const target = process.argv[2] ?? 'public/projects/demo';
const project = loadProject(target);
report(project);
if (!project.ok) process.exit(1);
const propsFile = path.join(ROOT, '.cache', 'props.json');
fs.mkdirSync(path.dirname(propsFile), {recursive: true});
fs.writeFileSync(propsFile, JSON.stringify({timeline: project.timeline, library: project.library}));
const args = ['remotion', 'studio', 'src/index.jsx', `--props=${propsFile}`];
const exe = browserExecutable();
if (exe) args.push(`--browser-executable=${exe}`);
spawn('npx', args, {cwd: ROOT, stdio: 'inherit'});
