import fs from 'node:fs';
const reel=fs.readFileSync('src/remotion/Reel.jsx','utf8');
const style=fs.readFileSync('src/styleEngine.js','utf8');
const editor=fs.readFileSync('src/ReelEditor.jsx','utf8');
const dl=fs.readFileSync('src/app/api/download/route.js','utf8');
const checks=[
  ['hero uppercase', reel.includes("rawShown.toUpperCase()")],
  ['no decorative scene background', /function SceneBackground\(\)\{\s*return null;\s*\}/s.test(reel) && !reel.includes('ImpactBackgroundWipe')],
  ['no auto clipping mask', !style.includes("'mask-reveal'") || !/REFERENCE_ANIMS=.*mask-reveal/.test(style)],
  ['safe reveal has no clipPath', !reel.includes("clipPath=`inset") && !reel.includes("overflow:'hidden', opacity:contentReveal")],
  ['flat hero treatment', reel.includes("textShadow:'none'") && reel.includes("background:'transparent'")],
  ['same-origin download route', editor.includes('/api/download?blobPath=') && dl.includes('Content-Disposition')],
  ['render keeps blob path', editor.includes('setRenderBlobPath')],
  ['version stamp', editor.includes('1.9.6-blob-upload-path-fix')],
];
let bad=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)bad++;}
if(bad)process.exit(1);
