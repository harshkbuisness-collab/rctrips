import {loadProject, report} from './project.mjs';

const target = process.argv[2];
if (!target) {
  console.log('usage: npm run validate -- public/projects/<name>');
  process.exit(1);
}
const result = loadProject(target);
report(result);
process.exit(result.ok ? 0 : 1);
