export const TYPOGRAPHY_VARIETY_OPTIONS = [
  {id:'reference',label:'Reference Motion',description:'Curated fast editorial motion matching the supplied reference reels. Recommended.'},
  {id:'expanded',label:'Expanded Motion',description:'Adds the larger legacy animation pool while preserving the reference layout rules.'},
];

export const VISUAL_CADENCE_OPTIONS = [
  {id:'reference',label:'Reference Rhythm',description:'Mostly typography with a conceptual visual reset every 2–3 text beats. Recommended.'},
  {id:'alternate',label:'Alternate Scenes',description:'Visual → text-only → visual → text-only.'},
  {id:'smart',label:'Smart Semantic',description:'Adds a visual only when the meaning clearly benefits from one.'},
  {id:'dense',label:'Visual Heavy',description:'More visual proof/cards while retaining typography breathing room.'},
];

// Strict rule: canvas backgrounds are FLAT SOLID colors only. No gradient modes exist.
export const BACKGROUND_MODE_OPTIONS = [
  {id:'reference',label:'Reference Flat Rhythm',description:'Neutral base with strategic solid red/black/blue/pink/yellow impact scenes.'},
  {id:'hook-flash',label:'Minimal + Hook Flash',description:'Mostly one sober background with short solid hook/CTA flashes.'},
  {id:'brand-solid',label:'Single Brand Background',description:'One flat brand background for the whole reel.'},
  {id:'solid-cycle',label:'Solid Color Cycle',description:'Rotate only through the selected brand system’s flat colors.'},
  {id:'light-dark-solid',label:'Light + Dark Solid',description:'Alternate clean light and dark flat scenes.'},
];

export const BACKGROUND_MOTION_OPTIONS = [
  {id:'still',label:'Still',description:'No decorative background movement.'},
  {id:'subtle',label:'Subtle Editorial',description:'Flat background only; subtle motion comes from typography, never decorative bars/arrows.'},
];

// Ten fixed brand systems. Each uses a limited palette and a locked font family pair.
// The default palette is derived from the supplied reference reels: warm white, black, signal red,
// cobalt, hot pink, sky blue and neon yellow. No gradients are used anywhere in these themes.
export const BRAND_THEME_OPTIONS = [
  {id:'reference-red',label:'01 · Reference Red',description:'Off-white + black + signal red with cobalt/pink reset scenes.',bg:'#FCFCFC',altBg:'#F5F5F3',lightBg:'#FCFCFC',lightFg:'#111111',fg:'#111111',muted:'#6F6F6B',accent:'#F3130F',accent2:'#111111',flashBg:'#F3130F',flashFg:'#FFFFFF',impact2:'#0F2FCB',impact2Fg:'#FFFFFF',impact3:'#F10B93',impact3Fg:'#FFFFFF',ctaBg:'#0F2FCB',ctaFg:'#FFFFFF',hookFontKey:'impact',bodyFontKey:'body',accentFontKey:'script'},
  {id:'cobalt-white',label:'02 · Cobalt White',description:'White + cobalt + black with red accent.',bg:'#FCFCFC',altBg:'#F0F3FB',lightBg:'#FFFFFF',lightFg:'#101114',fg:'#101114',muted:'#70747D',accent:'#1338D2',accent2:'#F3130F',flashBg:'#1338D2',flashFg:'#FFFFFF',impact2:'#000000',impact2Fg:'#FFFFFF',impact3:'#F3130F',impact3Fg:'#FFFFFF',ctaBg:'#1338D2',ctaFg:'#FFFFFF',hookFontKey:'condensed',bodyFontKey:'body',accentFontKey:'script'},
  {id:'black-red',label:'03 · Black Red',description:'Black + white + signal red. High-impact creator identity.',bg:'#050505',altBg:'#101010',lightBg:'#FCFCFC',lightFg:'#111111',fg:'#FFFFFF',muted:'#A5A5A5',accent:'#F3130F',accent2:'#FFFFFF',flashBg:'#F3130F',flashFg:'#FFFFFF',impact2:'#FCFCFC',impact2Fg:'#111111',impact3:'#F7EF12',impact3Fg:'#111111',ctaBg:'#F3130F',ctaFg:'#FFFFFF',hookFontKey:'impact',bodyFontKey:'body',accentFontKey:'script'},
  {id:'pink-black',label:'04 · Pink Black',description:'Clean white + black + hot-pink CTA energy.',bg:'#FCFCFC',altBg:'#F4F4F4',lightBg:'#FFFFFF',lightFg:'#101010',fg:'#101010',muted:'#707070',accent:'#F10B93',accent2:'#000000',flashBg:'#F10B93',flashFg:'#FFFFFF',impact2:'#000000',impact2Fg:'#FFFFFF',impact3:'#F3130F',impact3Fg:'#FFFFFF',ctaBg:'#F10B93',ctaFg:'#FFFFFF',hookFontKey:'impact',bodyFontKey:'rounded',accentFontKey:'script'},
  {id:'sky-black',label:'05 · Sky Black',description:'White + black + bright sky-blue.',bg:'#FCFCFC',altBg:'#EFF8FC',lightBg:'#FFFFFF',lightFg:'#111111',fg:'#111111',muted:'#6A7378',accent:'#2DA9EA',accent2:'#111111',flashBg:'#2DA9EA',flashFg:'#FFFFFF',impact2:'#000000',impact2Fg:'#FFFFFF',impact3:'#F3130F',impact3Fg:'#FFFFFF',ctaBg:'#2DA9EA',ctaFg:'#FFFFFF',hookFontKey:'condensed',bodyFontKey:'body',accentFontKey:'script'},
  {id:'yellow-black',label:'06 · Yellow Black',description:'Black + neon yellow + white. Strong contrast without gradients.',bg:'#050505',altBg:'#111111',lightBg:'#FFFDF0',lightFg:'#111111',fg:'#FFFFFF',muted:'#A4A4A4',accent:'#F7EF12',accent2:'#FFFFFF',flashBg:'#F7EF12',flashFg:'#111111',impact2:'#F3130F',impact2Fg:'#FFFFFF',impact3:'#FCFCFC',impact3Fg:'#111111',ctaBg:'#F7EF12',ctaFg:'#111111',hookFontKey:'poster',bodyFontKey:'body',accentFontKey:'script'},
  {id:'cream-red',label:'07 · Cream Red',description:'Warm editorial cream + black + red.',bg:'#F6F0E7',altBg:'#EEE7DD',lightBg:'#FCFAF6',lightFg:'#171411',fg:'#171411',muted:'#726B64',accent:'#D9342B',accent2:'#171411',flashBg:'#D9342B',flashFg:'#FFFFFF',impact2:'#171411',impact2Fg:'#FFFFFF',impact3:'#E7C84F',impact3Fg:'#171411',ctaBg:'#171411',ctaFg:'#FFFFFF',hookFontKey:'impact',bodyFontKey:'body',accentFontKey:'script'},
  {id:'mono-editorial',label:'08 · Mono Editorial',description:'White + black only with one red accent.',bg:'#FCFCFC',altBg:'#F2F2F2',lightBg:'#FFFFFF',lightFg:'#111111',fg:'#111111',muted:'#707070',accent:'#111111',accent2:'#F3130F',flashBg:'#000000',flashFg:'#FFFFFF',impact2:'#F3130F',impact2Fg:'#FFFFFF',impact3:'#FCFCFC',impact3Fg:'#111111',ctaBg:'#000000',ctaFg:'#FFFFFF',hookFontKey:'impact',bodyFontKey:'body',accentFontKey:'script'},
  {id:'cobalt-pink',label:'09 · Cobalt Pink',description:'White + cobalt + hot pink for bold social content.',bg:'#FCFCFC',altBg:'#F1F3FA',lightBg:'#FFFFFF',lightFg:'#111111',fg:'#111111',muted:'#6F7380',accent:'#1739D4',accent2:'#F10B93',flashBg:'#1739D4',flashFg:'#FFFFFF',impact2:'#F10B93',impact2Fg:'#FFFFFF',impact3:'#000000',impact3Fg:'#FFFFFF',ctaBg:'#F10B93',ctaFg:'#FFFFFF',hookFontKey:'condensed',bodyFontKey:'rounded',accentFontKey:'script'},
  {id:'red-yellow',label:'10 · Red Yellow',description:'Signal red + neon yellow + white, inspired by high-retention hook scenes.',bg:'#FCFCFC',altBg:'#F4F4F2',lightBg:'#FFFFFF',lightFg:'#111111',fg:'#111111',muted:'#6E6E69',accent:'#F3130F',accent2:'#F7EF12',flashBg:'#F3130F',flashFg:'#F7EF12',impact2:'#000000',impact2Fg:'#FFFFFF',impact3:'#F7EF12',impact3Fg:'#111111',ctaBg:'#F3130F',ctaFg:'#F7EF12',hookFontKey:'poster',bodyFontKey:'body',accentFontKey:'script'},
];

export function getBrandTheme(id='reference-red'){
  return BRAND_THEME_OPTIONS.find(t=>t.id===id)||BRAND_THEME_OPTIONS[0];
}

// Auto-layouts stay straight and grid-aligned. No random/scattered X/Y composition is allowed.
export const TYPOGRAPHY_LAYOUT_OPTIONS = [
  {id:'straight-center',label:'Straight Center'},
  {id:'straight-left',label:'Straight Left'},
  {id:'hero-line',label:'Hero Word Line'},
  {id:'clean-stack',label:'Clean Line Stack'},
  {id:'minimal-focus',label:'Minimal Focus'},
  {id:'cta-poster',label:'CTA Poster'},
];

// First ten are the curated reference grammar. Remaining families stay available manually/expanded mode.
export const ANIMATION_FAMILY_OPTIONS = [
  {id:'blur-snap',label:'01 · Blur → Snap'},
  {id:'smear-snap',label:'02 · Motion Smear → Snap'},
  {id:'slide-blur',label:'03 · Fast Slide + Blur'},
  {id:'scale-pop',label:'04 · Scale Pop'},
  {id:'mask-reveal',label:'05 · Soft Full-Word Reveal'},
  {id:'word-build',label:'06 · Sequential Word Build'},
  {id:'clean-fade',label:'07 · Clean Fade'},
  {id:'snap',label:'08 · Snap In'},
  {id:'editorial',label:'09 · Editorial Reveal'},
  {id:'punch',label:'10 · Punch In'},
  {id:'rise',label:'11 · Clean Rise'},
  {id:'slide-left',label:'12 · Slide From Left'},
  {id:'slide-right',label:'13 · Slide From Right'},
  {id:'elastic',label:'14 · Elastic Spring'},
  {id:'mask-up',label:'15 · Soft Rise Reveal'},
  {id:'mask-side',label:'16 · Soft Side Reveal'},
  {id:'tracking',label:'17 · Tracking Expand'},
  {id:'focus',label:'18 · Focus / Blur In'},
  {id:'zoom',label:'19 · Zoom Settle'},
  {id:'soft-pop',label:'20 · Soft Pop'},
];

export const BACKGROUND_STYLE_OPTIONS = [
  {id:'solid',label:'Solid Only'},
];

export const HERO_TREATMENT_OPTIONS = [
  {id:'solid',label:'Solid Accent'},
];

const REFERENCE_LAYOUTS=['straight-center','hero-line','clean-stack'];
const EXPANDED_LAYOUTS=['straight-center','straight-left','hero-line','clean-stack'];
const REFERENCE_ANIMS=['blur-snap','smear-snap','slide-blur','scale-pop','word-build','clean-fade','snap','editorial','punch'];
const EXPANDED_ANIMS=ANIMATION_FAMILY_OPTIONS.map(x=>x.id);
const HERO_TREATMENTS=HERO_TREATMENT_OPTIONS.map(x=>x.id);
const BACKGROUND_STYLES=['solid'];

function hashString(s=''){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function noise(seed,key){return (hashString(`${seed}|${key}`)%100000)/100000}
function pick(arr,seed,key){return arr[Math.floor(noise(seed,key)*arr.length)%arr.length]}
function avoidSame(arr,value,seed,key){if(arr.length<=1)return arr[0];const filtered=arr.filter(x=>x!==value);return pick(filtered.length?filtered:arr,seed,key)}
function textOf(scene){return String(scene.text||'').toLowerCase()}
function isHookish(scene){const t=textOf(scene);return scene.index<=1||/[?]/.test(t)||/\b(stop|wait|listen|secret|mistake|problem|why|how|kya|kyun|kaise|instagram|growth|viral|warning|agar|dekho|free|important)\b/.test(t)}
function isCTA(scene){return /\b(comment|follow|save|share|subscribe|dm|message|click|tap|link|book|contact|reply|send|comment karo|follow karo)\b/i.test(textOf(scene))}
function isNumberish(scene){return /(?:^|\s)(?:\d+[.,]?\d*|\d+%|\d+\s*(?:sec|second|seconds|min|minute|minutes|month|months|year|years|am|pm))(?:\s|$)/i.test(textOf(scene))}
function isNegative(scene){return /\b(no|not|never|dont|don't|nahi|nhi|mat|problem|mistake|wrong|galat|fail|failure)\b/i.test(textOf(scene))}
function wantsScriptAccent(scene){return /\b(follow|bonus|detail|details|comment)\b/i.test(textOf(scene))}
function contrastInk(hex='#000000'){const h=String(hex).replace('#','');const x=h.length===3?h.split('').map(c=>c+c).join(''):h;const n=parseInt(x,16)||0;const y=((n>>16)&255)*.299+((n>>8)&255)*.587+(n&255)*.114;return y>155?'#111111':'#FFFFFF'}

function referenceImpact(theme,index,scene){
  // Strategic interruption only: roughly 20–30% of scenes get a strong flat background.
  const cta=isCTA(scene); const hook=isHookish(scene);
  if(cta)return {bg:theme.ctaBg||theme.flashBg,fg:theme.ctaFg||contrastInk(theme.ctaBg||theme.flashBg),name:'CTA'};
  if(index===0&&hook)return {bg:theme.bg,fg:theme.fg,name:'Neutral Hook'};
  if((index%5===3&&hook)||(index>1&&index%6===0))return {bg:theme.flashBg,fg:theme.flashFg||contrastInk(theme.flashBg),name:'Impact A'};
  if(index>2&&index%9===5)return {bg:theme.impact2||theme.flashBg,fg:theme.impact2Fg||contrastInk(theme.impact2||theme.flashBg),name:'Impact B'};
  if(index>3&&index%11===7)return {bg:theme.impact3||theme.flashBg,fg:theme.impact3Fg||contrastInk(theme.impact3||theme.flashBg),name:'Impact C'};
  return null;
}

export function getAutoSceneTheme(project={},scene,index,seed=0){
  const brand=getBrandTheme(project.brandThemeId||'reference-red');
  const mode=project.backgroundMode||'reference';
  let bg=brand.bg,fg=brand.fg,muted=brand.muted,accent=brand.accent,accent2=brand.accent2,name=brand.label,isImpact=false;
  if(mode==='reference'){
    const hit=referenceImpact(brand,index,scene);
    if(hit){bg=hit.bg;fg=hit.fg;muted=fg;isImpact=hit.name!=='Neutral Hook';name=`${brand.label} · ${hit.name}`;if(isImpact){accent=fg;accent2=brand.accent2;}}
  }else if(mode==='hook-flash'&&isHookish(scene)&&(index===0||index%4===0||/[?]/.test(textOf(scene)))){
    bg=brand.flashBg;fg=brand.flashFg||contrastInk(bg);muted=fg;accent=fg;accent2=brand.bg;name=`${brand.label} · Hook Flash`;isImpact=true;
  }else if(mode==='solid-cycle'){
    const choice=(index+Math.abs(Number(seed)||0))%4;
    const colors=[{bg:brand.bg,fg:brand.fg},{bg:brand.altBg,fg:brand.fg},{bg:brand.flashBg,fg:brand.flashFg||contrastInk(brand.flashBg)},{bg:brand.impact2||brand.bg,fg:brand.impact2Fg||brand.fg}];
    ({bg,fg}=colors[choice]);muted=fg;name=`${brand.label} · Solid ${choice+1}`;isImpact=choice>=2;
  }else if(mode==='light-dark-solid'&&index%3===1){
    bg=brand.lightBg;fg=brand.lightFg;muted=brand.lightFg;name=`${brand.label} · Light`;
  }
  return {name,bg,fg,muted,accent,accent2,hookFontKey:brand.hookFontKey,bodyFontKey:brand.bodyFontKey,accentFontKey:brand.accentFontKey||'script',isImpact};
}

export function planSceneStyle(scene,index,project={},previous={}){
  const seed=Number(project.regenCounter)||0;
  const expanded=(project.typographyVariety||'reference')==='expanded';
  const layouts=expanded?EXPANDED_LAYOUTS:REFERENCE_LAYOUTS;
  const families=expanded?EXPANDED_ANIMS:REFERENCE_ANIMS;
  const brand=getBrandTheme(project.brandThemeId||'reference-red');
  const hook=isHookish(scene),cta=isCTA(scene);

  let typographyLayout=avoidSame(layouts,previous.typographyLayout,seed,`layout-${index}-${scene.text}`);
  let animationFamily=avoidSame(families,previous.animationFamily,seed,`anim-${index}-${scene.text}`);
  let heroTreatment=avoidSame(HERO_TREATMENTS,previous.heroTreatment,seed,`treatment-${index}-${scene.keyword}`);
  let backgroundStyle=pick(BACKGROUND_STYLES,seed,`bg-${index}-${scene.text}`);

  if(hook){
    typographyLayout=pick(['hero-line','straight-center','clean-stack'],seed,`hook-layout-${index}`);
    animationFamily=pick(['blur-snap','smear-snap','slide-blur','scale-pop','word-build','clean-fade','punch'],seed,`hook-anim-${index}`);
    heroTreatment='solid';
  }
  if(cta){
    typographyLayout='cta-poster';
    animationFamily=pick(['scale-pop','blur-snap','snap','clean-fade'],seed,`cta-anim-${index}`);
    heroTreatment='solid';
  }
  if(isNumberish(scene)){
    typographyLayout=pick(['hero-line','straight-center','minimal-focus'],seed,`num-layout-${index}`);
    animationFamily=pick(['scale-pop','blur-snap','word-build','snap'],seed,`num-anim-${index}`);
  }
  if(isNegative(scene)){
    animationFamily=pick(['smear-snap','slide-blur','snap','punch'],seed,`neg-anim-${index}`);
    heroTreatment='solid';
  }

  if(animationFamily===previous.animationFamily)animationFamily=avoidSame(families,previous.animationFamily,seed,`final-anim-${index}`);
  if(typographyLayout===previous.typographyLayout&&!cta)typographyLayout=avoidSame(layouts,previous.typographyLayout,seed,`final-layout-${index}`);
  if(heroTreatment===previous.heroTreatment)heroTreatment=avoidSame(HERO_TREATMENTS,previous.heroTreatment,seed,`final-treatment-${index}`);

  // Decorative script is rare on purpose (reference reels use it as a reset, not as body typography).
  const scriptMoment=wantsScriptAccent(scene)&&(index%6===0||cta);
  const autoHeroFontKey=scriptMoment?(brand.accentFontKey||'script'):brand.hookFontKey;
  return {typographyLayout,animationFamily,autoHeroFontKey,autoBodyFontKey:brand.bodyFontKey,heroTreatment,backgroundStyle};
}

export function applyEngagementStylePlans(scenes=[],project={}){
  let previous={};
  return scenes.map((scene,index)=>{
    const theme=getAutoSceneTheme(project,scene,index,project.regenCounter||0);
    const plan=planSceneStyle(scene,index,project,previous);
    // Impact scenes can use the circle-expansion transition seen in the references. Keep it occasional.
    const transitionStyle='hard-cut';
    const typographyPart=scene.typographyLocked?{}:{typographyLayout:plan.typographyLayout,animationFamily:plan.animationFamily,autoHeroFontKey:plan.autoHeroFontKey,autoBodyFontKey:plan.autoBodyFontKey,heroTreatment:plan.heroTreatment,textAlign:plan.typographyLayout==='straight-left'?'left':'center'};
    const backgroundPart=scene.backgroundLocked?{}:{themeName:theme.name,bg:theme.bg,fg:theme.fg,muted:theme.muted,accent:theme.accent,accent2:theme.accent2,backgroundStyle:theme.isImpact?'solid':plan.backgroundStyle,transitionStyle,isImpactScene:theme.isImpact};
    const final={...scene,...typographyPart,...backgroundPart};
    previous={typographyLayout:final.typographyLayout,animationFamily:final.animationFamily,heroTreatment:final.heroTreatment,backgroundStyle:final.backgroundStyle};
    return final;
  });
}
