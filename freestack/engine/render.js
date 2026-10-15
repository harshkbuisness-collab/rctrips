// Render the template frame by frame.
//   node render.js <build_dir> stills 1.5,8,20   -> <build_dir>/still-<t>.png
//   node render.js <build_dir> full [fps]        -> <build_dir>/frames/f00000.jpg ...
const { chromium } = require('playwright');
const fs = require('fs');

const dir = process.argv[2], mode = process.argv[3], arg = process.argv[4];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => { console.error('PAGE ERROR:', e.message); process.exitCode = 1; });
  await page.goto(`file://${dir}/index.html`, { waitUntil: 'networkidle' });
  await page.evaluate(p => window.init(p), JSON.parse(fs.readFileSync(`${dir}/plan.json`, 'utf8')));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  if (mode === 'stills') {
    for (const t of arg.split(',').map(Number)) {
      await page.evaluate(t => window.render(t), t);
      await page.screenshot({ path: `${dir}/still-${t.toFixed(2)}.png` });
    }
  } else {
    const fps = Number(arg || 30);
    const total = await page.evaluate(() => window.TOTAL);
    fs.rmSync(`${dir}/frames_out`, { recursive: true, force: true });
    fs.mkdirSync(`${dir}/frames_out`, { recursive: true });
    const n = Math.round(total * fps);
    for (let i = 0; i < n; i++) {
      await page.evaluate(t => window.render(t), i / fps);
      await page.screenshot({ path: `${dir}/frames_out/f${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 92 });
    }
    console.log('frames', n, 'duration', total);
  }
  await browser.close();
})();
