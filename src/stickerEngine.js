import stickerData from './stickerData.js';

export const STICKER_MODES = [
  {id:'off',label:'Off',description:'No meme/reaction stickers.'},
  {id:'light',label:'Light',description:'Only strong punchline/reaction moments.'},
  {id:'balanced',label:'Balanced',description:'Context-aware stickers with breathing room.'},
  {id:'expressive',label:'Expressive',description:'More frequent meme reactions, still context controlled.'},
];

export const STICKERS = stickerData;
export const STICKER_BY_ID = Object.fromEntries(STICKERS.map(s=>[s.id,s]));

const MODE = {
  off:{threshold:999,chance:0},
  light:{threshold:7.0,chance:.60},
  balanced:{threshold:4.7,chance:.80},
  expressive:{threshold:2.9,chance:.95},
};

const ANIMATIONS = ['pop','bounce','slap','wiggle','shake','float','peek','stamp','swing','bob','spin','punch'];

function norm(text=''){return String(text).toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9₹$€£%+?.\s-]/g,' ').replace(/\s+/g,' ').trim()}
function hashString(s=''){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function noise(seed,key){return (hashString(`${seed}|${key}`)%10000)/10000}
function hasAny(text,arr){return arr.some(x=>text.includes(x))}
function unique(a){return [...new Set(a)]}

function desiredTags(scene){
  const a=scene.semantic||{}; const t=norm(scene.text||''); const concepts=a.concepts||[]; const tags=[];
  const add=(...x)=>tags.push(...x);

  if(a.question||hasAny(t,['why ','kya ','kaise ','kyun ','how ','what ','really','seriously'])) add('question','confused','thinking','suspicious','curious','disbelief');
  if(a.polarity==='negative'||concepts.includes('warning')||hasAny(t,['problem','weak','wrong','galat','mistake','fail','nahi','nhi','mat ','ignore','avoid'])) add('judging','frustrated','negative','sideeye','facepalm','angry','sad');
  if(a.contrast||concepts.includes('comparison')||hasAny(t,['but ','instead','rather','vs ','versus'])) add('confused','judging','sideeye','disbelief');
  if(a.polarity==='positive'||concepts.includes('achievement')||hasAny(t,['success','successful','best','better','great','finally','achieved','congrat'])) add('approval','positive','success','happy','thumbsup','celebrate');
  if(concepts.includes('growth')&&hasAny(t,['not grow','nahi ho','nahi badh','stuck'])) add('frustrated','confused','sad','judging');
  if(concepts.includes('offer')||concepts.includes('finance')||a.data?.currency?.length||hasAny(t,['price','budget','money','paise','cost','cheap','expensive','revenue'])) add('money','finance','offer');
  if(concepts.includes('cta')||hasAny(t,['send','share','comment','follow','save','dm','scan','click','tap'])) add('pointing','cta','approval','qr');
  if(hasAny(t,['wait','time','seconds','minute','ruk','hold on'])) add('wait','time');
  if(hasAny(t,['thank','thanks','please','plz','shukriya'])) add('thanks','prayer','love','please');
  if(hasAny(t,['friend','dost','audience','fans'])) add('love','happy','cute');
  if(hasAny(t,['funny','lol','haha','😂','joke','meme'])) add('funny','laughing','silly');
  if(hasAny(t,['shock','surprise','what!','omg','unbelievable'])) add('shocked','surprised');
  if(hasAny(t,['tired','boring','bored','sleep','yawn'])) add('tired','bored','relatable');
  if(hasAny(t,['think','socho','idea','brain','learn','samjho'])) add('thinking','idea','advice','brain','education');
  if(hasAny(t,['yes','correct','right','sahi','approved','done'])) add('approval','yes','thumbsup');
  if(hasAny(t,['qr','scan code'])) add('qr','cta');
  if(hasAny(t,['loading','process ho','wait kar'])) add('loading','wait');
  return unique(tags);
}

function needScore(scene){
  const a=scene.semantic||{}; const c=a.concepts||[]; const t=norm(scene.text||''); let s=0;
  if(a.question)s+=2.0;
  if(a.polarity==='negative')s+=2.7;
  if(a.polarity==='positive')s+=1.0;
  if(a.contrast)s+=2.4;
  if(c.includes('warning'))s+=2.6;
  if(c.includes('achievement'))s+=3.8;
  if(c.includes('comparison'))s+=1.8;
  if(c.includes('cta'))s+=1.5;
  if(c.includes('offer'))s+=1.2;
  if(hasAny(t,['problem','galat','wrong','mistake','weak','fail','seriously','really','kya','kyun','why','what','finally','wow','omg','wait','mat ','nahi']))s+=1.6;
  if(hasAny(t,['money','price','budget','paise','cheap','expensive']))s+=1.1;
  if(hasAny(t,['thank','thanks','please','friend','dost','funny','lol','haha']))s+=1.0;
  if(hasAny(t,['finally','congrat','wow','omg','achieved','milestone']))s+=2.8;
  if(hasAny(t,['qr','scan code','scan this','send it','share it']))s+=3.2;
  if(c.includes('analytics')||c.includes('trust')||c.includes('finance')){
    const expressive=hasAny(t,['problem','wrong','galat','wow','shocked','money','budget','cheap','expensive','finally','fail','why','kya','nahi']);
    if(!expressive)s-=2.2;
  }
  if(scene.layoutMode==='stacked'&&c.includes('analytics')&&!a.question&&a.polarity==='neutral')s-=1.2;
  return s;
}

function scoreSticker(sticker,tags,scene,ctx){
  let score=(sticker.priority||1)*1.4;
  for(const tag of tags){if(sticker.tags.includes(tag))score+=tag==='approval'||tag==='confused'||tag==='judging'||tag==='money'||tag==='shocked'?3.4:2.4}
  const a=scene.semantic||{};
  if(a.polarity==='negative'&&sticker.tags.some(x=>['happy','celebrate','success','love'].includes(x)))score-=5;
  if(a.polarity==='positive'&&sticker.tags.some(x=>['sad','crying','angry','negative'].includes(x)))score-=5;
  if((a.concepts||[]).includes('finance')&&sticker.tags.includes('money'))score+=3;
  if((a.concepts||[]).includes('cta')&&sticker.tags.some(x=>['pointing','qr','approval'].includes(x)))score+=2.5;
  const recentIds=ctx.recentIds||[]; const recentFamilies=ctx.recentFamilies||[];
  const idPos=recentIds.indexOf(sticker.id); if(idPos>=0)score-=[28,18,11,7,5,3][Math.min(idPos,5)];
  const famPos=recentFamilies.indexOf(sticker.family); if(famPos>=0)score-=[2.4,1.3,.8][Math.min(famPos,2)];
  score+=(noise(ctx.seed||0,`${scene.index}|${sticker.id}`)-.5)*1.2;
  return score;
}

function placementFor(scene,seed){
  const layout=scene.layoutMode||'text'; const i=scene.index||0;
  const sets={
    'split-right':['bottom-right','top-right','bottom-left'],
    'split-left':['bottom-left','top-left','bottom-right'],
    stacked:['top-right','bottom-left','bottom-right'],
    text:['bottom-right','top-left','bottom-left','top-right'],
  };
  const arr=sets[layout]||sets.text; return arr[Math.floor(noise(seed,`place-${i}`)*arr.length)%arr.length];
}

function animationFor(sticker,scene,seed){
  const t=desiredTags(scene); let a=sticker.preferredAnimation||'pop';
  if(t.includes('shocked'))a='punch';
  else if(t.includes('angry')||t.includes('frustrated'))a='shake';
  else if(t.includes('approval'))a='stamp';
  else if(t.includes('laughing'))a='wiggle';
  else if(t.includes('sad'))a='drop';
  else if(t.includes('wait'))a='swing';
  else if(t.includes('thinking'))a='bob';
  if(!ANIMATIONS.includes(a))a=ANIMATIONS[Math.floor(noise(seed,`${scene.index}-anim`)*ANIMATIONS.length)%ANIMATIONS.length];
  return a;
}

export function getStickerMeta(id){return STICKER_BY_ID[id]||null}
export function getStickerOption(id){const s=getStickerMeta(id);return s?{id:s.id,label:s.label,src:s.src,family:s.family}:{id:'none',label:'No sticker',src:'',family:'none'}}

export function selectStickerPlans(scenes,{mode='balanced',seed=0,preserveLocked=true}={}){
  const cfg=MODE[mode]||MODE.balanced; const recentIds=[], recentFamilies=[]; let previousHad=false;
  return scenes.map((scene,index)=>{
    if(preserveLocked&&scene.stickerLocked){
      const s=getStickerMeta(scene.stickerId); if(s){recentIds.unshift(s.id);recentFamilies.unshift(s.family);recentIds.splice(8);recentFamilies.splice(3);previousHad=true}else previousHad=false;
      return scene;
    }
    if(mode==='off') {previousHad=false;return {...scene,stickerId:'none',stickerSource:'auto',stickerLocked:false};}
    const duration=Math.max(.1,(scene.end||0)-(scene.start||0)); const need=needScore(scene); const tags=desiredTags(scene);
    if(duration<.55||!tags.length||need<cfg.threshold){previousHad=false;return {...scene,stickerId:'none',stickerSource:'auto',stickerLocked:false,stickerScore:Number(need.toFixed(2))};}
    const strong=need>=8.0;
    if(previousHad&&!strong&&mode!=='expressive'){previousHad=false;return {...scene,stickerId:'none',stickerSource:'auto',stickerLocked:false,stickerScore:Number(need.toFixed(2))};}
    const chance=noise(seed,`use-${index}-${scene.text}`); if(!strong&&chance>cfg.chance){previousHad=false;return {...scene,stickerId:'none',stickerSource:'auto',stickerLocked:false,stickerScore:Number(need.toFixed(2))};}
    const pool=STICKERS.filter(s=>s.autoEligible!==false).map(s=>({s,score:scoreSticker(s,tags,scene,{recentIds,recentFamilies,seed})})).sort((a,b)=>b.score-a.score);
    const chosen=pool[0];
    if(!chosen||chosen.score<3.1){previousHad=false;return {...scene,stickerId:'none',stickerSource:'auto',stickerLocked:false,stickerScore:Number(need.toFixed(2))};}
    const st=chosen.s;recentIds.unshift(st.id);recentFamilies.unshift(st.family);recentIds.splice(8);recentFamilies.splice(3);previousHad=true;
    return {...scene,stickerId:st.id,stickerSource:'auto',stickerLocked:false,stickerAnimation:animationFor(st,scene,seed),stickerPlacement:placementFor(scene,seed),stickerScale:scene.stickerScale??1,stickerX:scene.stickerX??0,stickerY:scene.stickerY??0,stickerScore:Number(chosen.score.toFixed(2)),stickerTags:tags.slice(0,6)};
  });
}

export function getStickerAlternatives(currentId,scene,{limit=6,seed=0}={}){
  const tags=desiredTags(scene||{}); const current=getStickerMeta(currentId); const pool=STICKERS.filter(s=>s.autoEligible!==false&&s.id!==currentId).map(s=>{
    let score=scoreSticker(s,tags,scene||{}, {recentIds:[],recentFamilies:[],seed});
    if(current&&s.family!==current.family)score+=.8;
    return {s,score};
  }).sort((a,b)=>b.score-a.score);
  const out=current?[currentId]:[];const fam=new Map();if(current)fam.set(current.family,1);
  for(const {s} of pool){if(out.length>=limit)break;const n=fam.get(s.family)||0;if(n>=2)continue;out.push(s.id);fam.set(s.family,n+1)}
  for(const {s} of pool){if(out.length>=limit)break;if(!out.includes(s.id))out.push(s.id)}
  return out;
}

export function chooseStickerAnimation(id,scene,seed=0){const s=getStickerMeta(id);return s?animationFor(s,scene||{},seed):'pop'}
