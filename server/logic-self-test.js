import {selectVisualPlans, getThemeByName} from '../src/visualEngine.js';

const theme=getThemeByName('Paper');
const scenes=[
  'Don’t only look at views',
  'Watch time and retention bhi check karo',
  'Dubai package starts at ₹39,000',
  'WhatsApp par reply fast karo',
  'Client ne 4.9 rating di',
  'Mumbai se Shanghai travel',
].map((text,index)=>({
  id:`test-${index}`,index,start:index*1.2,end:index*1.2+1.1,text,wordTimings:[],
  themeName:theme.name,bg:theme.bg,fg:theme.fg,muted:theme.muted,accent:theme.accent,accent2:theme.accent2,
  visual:'none',visualLocked:false,visualSource:'auto',
}));

const out=selectVisualPlans(scenes,{seed:0});
for(const s of out) console.log(`${s.text} => ${s.visual} [${s.semantic?.primaryConcept||'generic'} / ${s.semantic?.polarity||'neutral'}]`);

const checks=[
  ['negative/corrective views', (out[0].visual==='views' && out[0].visualState==='negative') || ['comparison','splitCompare','beforeAfter'].includes(out[0].visual)],
  ['retention', ['retention','watch','progressBar'].includes(out[1].visual)],
  ['priced offer', ['priceTag','productShowcase','discountCalculator','flashSale'].includes(out[2].visual)],
  ['whatsapp', out[3].visual==='whatsapp'],
  ['rating', ['starRatingBig','quoteCard','badgeStamp'].includes(out[4].visual)],
  ['location', out[5].visual==='mapPin'],
];
const failed=checks.filter(([,ok])=>!ok);
if(failed.length){console.error('FAILED:',failed.map(x=>x[0]).join(', '));process.exit(1)}
console.log('Visual selection self-test: PASS');
