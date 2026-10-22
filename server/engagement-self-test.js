import assert from 'node:assert/strict';
import {selectVisualPlans} from '../src/visualEngine.js';
import {applyEngagementStylePlans,getBrandTheme} from '../src/styleEngine.js';

const texts=[
  'Instagram growth ke liye hook strong hona chahiye.',
  'Daily content daalne se hi growth nahi aati.',
  'Retention aur watch time ko improve karo.',
  'Viewer ko clear reason do rukne ka.',
  'Better content audience ko share karne par majboor karta hai.',
  'Next reel mein structure improve karo.',
];
const base=texts.map((text,index)=>({
  id:`scene-${index+1}`,index,start:index*1.2,end:index*1.2+1.1,text,keyword:text.split(/\s+/).sort((a,b)=>b.length-a.length)[0],
  bg:'#fff',fg:'#111',muted:'#777',accent:'#F04438',accent2:'#FF7A70',wordTimings:[],visual:'none',visualLocked:false,
}));
const visuals=selectVisualPlans(base,{seed:3,preserveLocked:false,cadence:'alternate'});
for(let i=1;i<visuals.length;i+=2) assert.equal(visuals[i].visual,'none',`Expected text-only breathing scene at ${i}`);
for(const s of visuals){
  const vals=Object.values(s.visualBindings||{}).map(v=>String(v).trim().toLowerCase());
  assert.ok(!vals.includes(s.text.trim().toLowerCase()),`Visual duplicated full scene text: ${s.text}`);
}
const project={backgroundMode:'solid-cycle',backgroundMotion:'subtle',brandThemeId:'signal-red',typographyVariety:'maximum',regenCounter:2};
const styled=applyEngagementStylePlans(visuals,project);
const brand=getBrandTheme('signal-red');
assert.ok(new Set(styled.map(s=>s.bg)).size>=2,'Expected solid background variation');
assert.ok(new Set(styled.map(s=>s.animationFamily)).size>=4,'Expected varied animation families');
assert.ok(styled.every(s=>s.autoHeroFontKey===brand.hookFontKey),'Hero font must stay fixed for brand identity');
assert.ok(styled.every(s=>s.autoBodyFontKey===brand.bodyFontKey),'Body font must stay fixed for brand identity');
assert.ok(styled.every((s,i)=>i===0||s.animationFamily!==styled[i-1].animationFamily),'Adjacent animation family repeated');
console.log('Engagement engine self-test: PASS');
console.table(styled.map(s=>({scene:s.index+1,visual:s.visual,bg:s.themeName,layout:s.typographyLayout,animation:s.animationFamily,heroFont:s.autoHeroFontKey,treatment:s.heroTreatment})));
