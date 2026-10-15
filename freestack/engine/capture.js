// Screenshot GitHub repo pages (vertical) and record where the star count is.
// Usage: node capture.js <out_dir> <owner/repo> [<owner/repo> ...]
const { chromium } = require('playwright');
const fs = require('fs');

const outDir = process.argv[2];
const repos = process.argv.slice(3);

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
  const out = {};
  for (const repo of repos) {
    await page.goto(`https://github.com/${repo}`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(1200);
    const file = `shots/${repo.replace('/', '__')}.png`;
    const info = { file };
    const star = page.getByText(/^[\d.,]+k? stars$/).first();
    if (await star.count()) {
      info.stars = (await star.innerText()).replace(/ stars$/, '').toUpperCase();
      info.box = await star.boundingBox();
    }
    await page.screenshot({ path: `${outDir}/${repo.replace('/', '__')}.png` });
    out[repo] = info;
    console.log(repo, info.stars || 'NO STAR COUNT FOUND');
  }
  fs.writeFileSync(`${outDir}/shots.json`, JSON.stringify(out, null, 2));
  await browser.close();
})();
