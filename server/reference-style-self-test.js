import assert from 'node:assert/strict';
import fs from 'node:fs';
import pkg from '../package.json' with {type:'json'};
import {ANIMATION_FAMILY_OPTIONS,BACKGROUND_MODE_OPTIONS,BRAND_THEME_OPTIONS,TYPOGRAPHY_LAYOUT_OPTIONS,applyEngagementStylePlans} from '../src/styleEngine.js';
import {selectVisualPlans} from '../src/visualEngine.js';

assert.equal(BRAND_THEME_OPTIONS.length,10,'Expected ten reusable brand systems');
assert.ok(BRAND_THEME_OPTIONS.some(t=>t.id==='reference-red'),'Reference Red theme missing');
assert.ok(BACKGROUND_MODE_OPTIONS.some(x=>x.id==='reference'),'Reference flat background mode missing');
assert.ok(BACKGROUND_MODE_OPTIONS.every(x=>!/gradient/i.test(`${x.id} ${x.label} ${x.description}`)),'Gradient background option exposed');
assert.ok(TYPOGRAPHY_LAYOUT_OPTIONS.some(x=>x.id==='cta-poster'),'CTA poster layout missing');
for(const id of ['blur-snap','smear-snap','slide-blur','scale-pop','mask-reveal','word-build','clean-fade']){
  assert.ok(ANIMATION_FAMILY_OPTIONS.some(x=>x.id===id),`Missing reference animation: ${id}`);
}
for(const dep of ['@fontsource/inter','@fontsource/anton','@fontsource/oswald','@fontsource/caveat']) assert.ok(pkg.dependencies[dep],`Missing packaged font dependency ${dep}`);

const base=Array.from({length:12},(_,i)=>({id:`s${i}`,index:i,start:i,end:i+.9,text:i===10?'Comment for details':i===0?'Instagram growth ka secret':'Simple clean information beat '+i,keyword:i===10?'Comment':i===0?'Instagram':'information',wordTimings:[],visual:'none',visualLocked:false,bg:'#fff',fg:'#111',muted:'#777',accent:'#f00',accent2:'#111'}));
const visuals=selectVisualPlans(base,{seed:2,preserveLocked:false,cadence:'reference'});
for(let i=1;i<visuals.length;i++) assert.ok(!(visuals[i].visual!=='none'&&visuals[i-1].visual!=='none'),'Reference rhythm produced back-to-back visuals');
for(const s of visuals){
  const vals=Object.values(s.visualBindings||{}).map(v=>String(v).trim().toLowerCase());
  assert.ok(!vals.includes(s.text.toLowerCase()),'Visual duplicated full spoken text');
}
const styled=applyEngagementStylePlans(visuals,{brandThemeId:'reference-red',backgroundMode:'reference',typographyVariety:'reference',regenCounter:4});
assert.equal(styled[10].typographyLayout,'cta-poster','CTA did not receive poster layout');
assert.ok(styled.every((s,i)=>i===0||s.animationFamily!==styled[i-1].animationFamily),'Adjacent text animation family repeated');
assert.ok(styled.every(s=>['left','center'].includes(s.textAlign)),'Unexpected scattered/right auto alignment');
assert.ok(new Set(styled.map(s=>s.bg)).size>=2,'Expected strategic flat-color reset scenes');

const reel=fs.readFileSync(new URL('../src/remotion/Reel.jsx',import.meta.url),'utf8');
assert.ok(reel.includes("kind==='smear'"),'Motion smear effect missing');
assert.ok(!reel.includes('ImpactBackgroundWipe'),'Decorative circle wipe should be disabled in the clean reference build');
const bgStart=reel.indexOf('function SceneBackground');
const bgEnd=reel.indexOf('function Scene(',bgStart);
assert.ok(!/linear-gradient|radial-gradient/i.test(reel.slice(bgStart,bgEnd)),'Gradient found in canvas SceneBackground');
const editor=fs.readFileSync(new URL('../src/ReelEditor.jsx',import.meta.url),'utf8');
assert.ok(editor.includes("visualCadence:'reference'"),'Reference visual cadence is not default');
assert.ok(editor.includes("stickerMode:'off'"),'Stickers are not off by default');
console.log('Reference style self-test: PASS');
