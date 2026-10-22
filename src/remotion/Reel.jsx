import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONTS, getVisualMeta} from '../editorConfig.js';
import {getActiveViewport, getLayoutProfile} from '../formats.js';
import {VisualLibrary} from './VisualLibrary.jsx';
import {StickerLayer} from './StickerLayer.jsx';

const HERO_STYLE = {
  hello:'sticker', bonus:'script', growth:'script', hook:'impact', views:'impact', retention:'condensed',
  watch:'condensed', comment:'impact', follow:'script', instagram:'impact', youtube:'impact', whatsapp:'bold',
  publish:'condensed', reel:'impact', content:'bold', viral:'impact', value:'condensed', proof:'bold', cta:'impact',
};

const clean = (w) => String(w || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const mediaSrc = (src) => {
  if (!src) return '';
  const s = String(src).trim().replace(/\\/g, '/');

  // Uploaded files are part of public/uploads. Always resolve them through
  // Remotion's staticFile() so preview and headless MP4 rendering read the
  // exact same local asset. Older projects may still contain the old
  // http://127.0.0.1:3001/uploads/... URL, so convert that too.
  const localUpload = s.match(/^https?:\/\/(?:127\.0\.0\.1|localhost):3001\/uploads\/([^?#]+)(?:[?#].*)?$/i);
  if (localUpload) return staticFile(`uploads/${decodeURIComponent(localUpload[1])}`);
  if (/^\/?(?:public\/)?uploads\//i.test(s)) {
    return staticFile(s.replace(/^\/?public\//i, '').replace(/^\//, ''));
  }

  if (/^(https?:|data:|blob:|file:)/i.test(s)) return s;
  return staticFile(s.replace(/^\/?public\//i, '').replace(/^\//, ''));
};
const int = (v) => Math.round(v);
const fontFor = (key) => FONTS[key] || FONTS.bold;
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));

function keywordFont(k) {
  const style = HERO_STYLE[k] || 'bold';
  return fontFor(style);
}

function wordSize(word, hero, styleType, hasVisual, stacked, profile) {
  const raw = String(word || '').replace(/[.,!?]/g, '');
  const len = Math.max(1, raw.length);
  const landscape = profile.orientation === 'landscape';
  let size;

  if (landscape) {
    size = hero ? (styleType === 'script' ? 144 : 132) : (hasVisual ? 62 : 72);
    if (hero && len > 9) size -= 16;
    if (hero && len > 13) size -= 18;
    if (!hero && len > 12) size -= 8;
  } else {
    size = hero ? (styleType === 'script' ? 142 : 126) : (hasVisual ? (stacked ? 54 : 49) : 56);
    if (hero && len > 9) size -= 18;
    if (hero && len > 13) size -= 18;
    if (!hero && len > 12) size -= 7;
  }

  const maxWidth = hasVisual
    ? (stacked ? (landscape ? 1180 : 720) : profile.splitTextWidth - 35)
    : profile.textOnlyWidth - 60;
  const widthFactor = styleType === 'script' ? 0.72 : styleType === 'impact' ? 0.64 : styleType === 'condensed' ? 0.56 : 0.60;
  const fitted = Math.floor((maxWidth - 18) / (len * widthFactor));
  size = Math.min(size, fitted);
  return Math.max(hero ? (landscape ? 54 : 58) : (landscape ? 30 : 34), size);
}

function exactEnter(kind, f, lead) {
  if (f < -lead) return {opacity:0, transform:'translate3d(0,0,0) scale(1)'};
  const p = interpolate(f, [-lead, 0], [0, 1], {
    extrapolateLeft:'clamp', extrapolateRight:'clamp', easing:Easing.out(Easing.cubic),
  });
  const wave = Math.sin(Math.max(0, Math.min(1,p))*Math.PI);
  let x=0,y=0,rot=0,scale=1,scaleX=1,scaleY=1,skew=0,opacity=p,filter='none',letterSpacing=0,perspective='none';
  if(kind==='up')y=int(34*(1-p));
  else if(kind==='left')x=int(-46*(1-p));
  else if(kind==='right')x=int(46*(1-p));
  else if(kind==='drop')y=int(-42*(1-p));
  else if(kind==='pop')scale=.72+.28*p+.06*wave;
  else if(kind==='tilt'){rot=-7*(1-p);y=int(24*(1-p));}
  else if(kind==='punch')scale=.48+.52*p+.09*wave;
  else if(kind==='soft'){y=int(15*(1-p));filter=`blur(${(1-p)*8}px)`;}
  else if(kind==='elastic'){scale=.55+.45*p+.16*wave;rot=-2.5*(1-p);}
  else if(kind==='bounce'){y=int(-54*(1-p)+12*wave);scale=.82+.18*p+.05*wave;}
  else if(kind==='stretch'){scaleX=.35+.65*p+.08*wave;scaleY=1.18-.18*p;}
  else if(kind==='scaleY'){scaleY=.3+.7*p+.08*wave;}
  else if(kind==='zoom'){scale=1.65-.65*p;filter=`blur(${(1-p)*5}px)`;}
  else if(kind==='blur'){scale=.92+.08*p;filter=`blur(${(1-p)*13}px)`;}
  else if(kind==='blurZoom'){scale=1.35-.35*p;filter=`blur(${(1-p)*12}px)`;}
  else if(kind==='smear'){x=int(-92*(1-p));scaleX=1+(1-p)*.55;filter=`blur(${(1-p)*10}px)`;}
  else if(kind==='slideBlur'){x=int(-82*(1-p));filter=`blur(${(1-p)*9}px)`;scale=.94+.06*p;}
  else if(kind==='slideBlurRight'){x=int(82*(1-p));filter=`blur(${(1-p)*9}px)`;scale=.94+.06*p;}
  else if(kind==='cleanFade'){y=int(8*(1-p));opacity=p;}
  else if(kind==='wipeUp'){y=int(26*(1-p));opacity=p;}
  else if(kind==='wipeLeft'){x=int(-34*(1-p));opacity=p;}
  else if(kind==='reveal'){y=int(18*(1-p));opacity=p;}
  else if(kind==='tracking'){letterSpacing=(1-p)*14;filter=`blur(${(1-p)*3}px)`;}
  else if(kind==='flipX'){rot=-78*(1-p);perspective='rotateX';}
  else if(kind==='flipY'){rot=-82*(1-p);perspective='rotateY';}
  else if(kind==='leftBig'){x=int(-120*(1-p));skew=-12*(1-p);}
  else if(kind==='rightBig'){x=int(120*(1-p));skew=12*(1-p);}
  else if(kind==='flick'){x=int(-70*(1-p));rot=-10*(1-p);scale=.86+.14*p;}
  else if(kind==='slam'){y=int(-95*(1-p));scale=1.24-.24*p;rot=-2*(1-p);}
  else if(kind==='springUp'){y=int(70*(1-p)-16*wave);scale=.8+.2*p+.05*wave;}
  const core=`translate3d(${x}px,${y}px,0) rotate(${rot}deg) skewX(${skew}deg) scale(${scale}) scaleX(${scaleX}) scaleY(${scaleY})`;
  const transform=perspective==='rotateX'?`perspective(700px) rotateX(${rot}deg) scale(${scale})`:perspective==='rotateY'?`perspective(700px) rotateY(${rot}deg) scale(${scale})`:core;
  return {opacity,transform,filter,letterSpacing};
}

const MOTION_FAMILIES={
  'blur-snap':['blur','soft','blur','cleanFade','pop'],
  'smear-snap':['smear','smear','blur','flick','cleanFade'],
  'slide-blur':['slideBlur','slideBlurRight','slideBlur','soft','pop'],
  'scale-pop':['pop','punch','pop','zoom','cleanFade'],
  'mask-reveal':['wipeLeft','wipeUp','reveal','wipeLeft','cleanFade'],
  'word-build':['up','cleanFade','up','cleanFade','pop'],
  'clean-fade':['cleanFade','soft','cleanFade','cleanFade','up'],
  snap:['flick','pop','right','up','punch'],
  editorial:['tracking','cleanFade','wipeUp','tilt','reveal'],
  punch:['punch','pop','punch','zoom','up'],
  rise:['up','soft','up','reveal','pop'],
  'slide-left':['left','leftBig','wipeLeft','left','flick'],
  'slide-right':['right','rightBig','reveal','right','pop'],
  elastic:['elastic','springUp','pop','stretch','bounce'],
  'mask-up':['wipeUp','reveal','wipeUp','soft','up'],
  'mask-side':['wipeLeft','left','wipeLeft','reveal','right'],
  tracking:['tracking','soft','tracking','reveal','up'],
  focus:['blur','soft','blurZoom','tracking','pop'],
  zoom:['zoom','punch','blurZoom','pop','soft'],
  'soft-pop':['soft','pop','up','blur','reveal'],
};
const HERO_MOTION={
  'blur-snap':'blurZoom','smear-snap':'smear','slide-blur':'slideBlur','scale-pop':'punch','mask-reveal':'wipeLeft','word-build':'pop','clean-fade':'cleanFade',
  snap:'punch',editorial:'tracking',punch:'punch',rise:'up','slide-left':'leftBig','slide-right':'rightBig',elastic:'elastic','mask-up':'wipeUp','mask-side':'wipeLeft',tracking:'tracking',focus:'blurZoom',zoom:'zoom','soft-pop':'pop'
};

function heroTreatmentStyle(scene, edit, hero) {
  if(!hero)return{};
  if(edit.color)return{};
  // Reference rule: hero words stay clean and flat. No shadow, outline,
  // underline, sticker box or glow is ever auto-rendered behind the letters.
  return{color:scene.accent,textShadow:'none',boxShadow:'none',background:'transparent',border:'none'};
}

function Token({item, scene, hasVisual, stacked, profile, editorMode, selected, onSelectWord, scaleMult=1}) {
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  const edit=scene.wordEdits?.[item.index]||{};
  const rawShown=String(edit.text??item.word);
  const exactFrame=(item.start-scene.start)*fps;
  const f=frame-exactFrame;
  const k=clean(item.word);
  const hero=k===clean(scene.keyword);
  const shown=hero?rawShown.toUpperCase():rawShown;
  const familyName=scene.animationFamily||'kinetic';
  const family=MOTION_FAMILIES[familyName]||MOTION_FAMILIES.rise;
  const effect=hero?(HERO_MOTION[familyName]||'punch'):family[(item.index+scene.index+(scene.animationVariant||0))%family.length];
  const lead=hero?5:3;
  const motion=exactEnter(effect,f,lead);
  const heroFontKey=scene.autoHeroFontKey||'impact';
  const styleType=hero?heroFontKey:(scene.autoBodyFontKey||'bold');
  const size=wordSize(shown,hero,styleType,hasVisual,stacked,profile)*(Number(edit.scale)||1)*scaleMult;
  const sticker=false;
  const familyFont=(edit.fontKey||scene.textFontKey)?fontFor(edit.fontKey||scene.textFontKey):(hero?fontFor(heroFontKey):fontFor(scene.autoBodyFontKey||'bold'));
  const baseColor=edit.color||(sticker?scene.bg:hero?scene.accent:scene.fg);
  const strokeWidth=Number(edit.strokeWidth||0);
  const strokeColor=edit.strokeColor||'#000000';
  const marginRight=profile.orientation==='landscape'?13:10;
  const marginBottom=profile.orientation==='landscape'?10:12;
  const treatment=heroTreatmentStyle(scene,edit,hero);
  return <span
    onClick={editorMode?(e)=>{e.stopPropagation();onSelectWord?.(item.index);}:undefined}
    style={{
      display:'inline-block',flex:'0 0 auto',maxWidth:'none',whiteSpace:'nowrap',wordBreak:'keep-all',overflowWrap:'normal',
      margin:`0 ${marginRight}px ${marginBottom}px 0`,fontFamily:familyFont,fontWeight:hero?900:800,fontSize:size,
      lineHeight:1.12,letterSpacing:hero?-0.55:0,padding:'0.10em 0.03em 0.14em',overflow:'visible',color:baseColor,textTransform:hero?'uppercase':'none',textShadow:'none',boxShadow:'none',...motion,...treatment,
      textRendering:'geometricPrecision',WebkitFontSmoothing:'antialiased',backfaceVisibility:'hidden',transformOrigin:'50% 60%',
      cursor:editorMode?'pointer':'default',pointerEvents:f < -lead?'none':'auto',
      outline:editorMode&&selected?'5px solid rgba(255,255,255,.78)':'none',outlineOffset:6,
      WebkitTextStroke:strokeWidth?`${strokeWidth}px ${strokeColor}`:'0 transparent',
    }}
  ><span style={{display:'inline-block',transform:`translate3d(${Number(edit.x)||0}px,${Number(edit.y)||0}px,0)`}}>{shown}</span></span>;
}

function ClickWrap({children, editorMode, selected, onClick, style={}}) {
  return <div onClick={editorMode?(e)=>{e.stopPropagation();onClick?.();}:undefined} style={{...style,position:'relative',outline:editorMode&&selected?'5px solid rgba(255,255,255,.72)':'none',outlineOffset:10,borderRadius:18,cursor:editorMode?'pointer':'default'}}>{children}</div>;
}

function chunkWords(words,count=2){const chunks=[];const size=Math.max(1,Math.ceil(words.length/count));for(let i=0;i<words.length;i+=size)chunks.push(words.slice(i,i+size));return chunks;}

function TextBlock({scene, hasVisual, stacked, profile, editorMode, selected, onSelectElement}) {
  const tx=clamp(scene.textX,-profile.maxTextOffsetX,profile.maxTextOffsetX);
  const ty=clamp(scene.textY,-profile.maxTextOffsetY,profile.maxTextOffsetY);
  const textTransform=`translate3d(${tx}px,${ty}px,0) scale(${scene.textScale??1})`;
  const select=(target,extra={})=>onSelectElement?.(scene.id,target,extra);
  const maxWidth=hasVisual?(stacked?profile.textOnlyWidth:profile.splitTextWidth):profile.textOnlyWidth;
  const minHeight=stacked?(profile.orientation==='landscape'?430:240):profile.textMinHeight;
  const words=scene.wordTimings||[];
  const heroIdx=words.findIndex(w=>clean(w.word)===clean(scene.keyword));
  const hero=heroIdx>=0?words[heroIdx]:null;
  const renderToken=(it,scaleMult=1)=><Token key={`${it.index}-${it.word}`} item={it} scene={scene} hasVisual={hasVisual} stacked={stacked} profile={profile} editorMode={editorMode} selected={selected?.sceneId===scene.id&&selected?.target==='word'&&selected?.wordIndex===it.index} onSelectWord={(wordIndex)=>select('word',{wordIndex})} scaleMult={scaleMult}/>;
  const row=(arr,justify='center',scaleMult=1)=><div style={{width:'100%',display:'flex',flexWrap:'wrap',justifyContent:justify,alignItems:'baseline',alignContent:'center'}}>{arr.map(it=>renderToken(it,scaleMult))}</div>;
  const splitClean=(arr,maxPerLine=4)=>{const out=[];for(let i=0;i<arr.length;i+=maxPerLine)out.push(arr.slice(i,i+maxPerLine));return out};
  const layout=scene.typographyLayout||'straight-center';
  let content;
  if(layout==='cta-poster'&&hero){
    const rest=words.filter(w=>w.index!==hero.index);
    content=<div style={{width:'100%',display:'flex',flexDirection:'column',alignItems:'center',gap:18}}>
      <div style={{width:'100%',display:'flex',justifyContent:'center'}}>{renderToken(hero,1.52)}</div>
      {rest.length?row(rest,'center',.66):null}
    </div>;
  } else if(layout==='straight-left'){
    const lines=splitClean(words,profile.orientation==='landscape'?5:4);
    content=<div style={{width:'100%',display:'flex',flexDirection:'column',gap:5,alignItems:'flex-start'}}>{lines.map((line,i)=><div key={i} style={{width:'100%'}}>{row(line,'flex-start',i===0?1:.94)}</div>)}</div>;
  } else if(layout==='hero-line'&&hero){
    const before=words.slice(0,heroIdx),after=words.slice(heroIdx+1);
    content=<div style={{width:'100%',display:'flex',flexDirection:'column',alignItems:'center',gap:7}}>{before.length?row(before,'center',.82):null}<div style={{width:'100%',display:'flex',justifyContent:'center'}}>{renderToken(hero,1.22)}</div>{after.length?row(after,'center',.86):null}</div>;
  } else if(layout==='clean-stack'){
    const lines=splitClean(words,profile.orientation==='landscape'?5:3);
    content=<div style={{width:'100%',display:'flex',flexDirection:'column',gap:5,alignItems:'center'}}>{lines.map((line,i)=><div key={i} style={{width:'100%'}}>{row(line,'center',i===0?1:.94)}</div>)}</div>;
  } else if(layout==='label-line'){
    const first=words.slice(0,Math.min(2,words.length)),rest=words.slice(first.length);
    content=<div style={{width:'100%',display:'flex',flexDirection:'column',alignItems:'flex-start',gap:12}}>{first.length?row(first,'flex-start',.72):null}{rest.length?row(rest,'flex-start',1):null}</div>;
  } else if(layout==='minimal-focus'&&hero){
    const rest=words.filter(w=>w.index!==hero.index);
    content=<div style={{width:'100%',display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>{rest.length?row(rest,'center',.7):null}<div style={{display:'flex',justifyContent:'center'}}>{renderToken(hero,1.30)}</div></div>;
  } else {
    const lines=splitClean(words,profile.orientation==='landscape'?6:4);
    const justify=scene.textAlign==='left'?'flex-start':scene.textAlign==='right'?'flex-end':'center';
    content=<div style={{width:'100%',display:'flex',flexDirection:'column',gap:4}}>{lines.map((line,i)=><div key={i} style={{width:'100%'}}>{row(line,justify,1)}</div>)}</div>;
  }

  return <ClickWrap editorMode={editorMode} selected={selected?.sceneId===scene.id&&selected?.target==='text'} onClick={()=>select('text')} style={{textAlign:scene.textAlign||'center',display:'flex',alignItems:'center',justifyContent:'center',minHeight,minWidth:0,width:'100%',maxWidth,transform:textTransform,transformOrigin:'50% 50%'}}>
    <div style={{width:'100%',maxWidth:Math.max(280,maxWidth-20),overflow:'visible'}}>{content}</div>
  </ClickWrap>;
}

function SceneBackground(){
  return null;
}

function Scene({scene, project, previousBg, editorMode=false, selected, onSelectElement}) {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const profile = getLayoutProfile(project);
  const fade = interpolate(frame, [0, 2, Math.max(3, durationInFrames - 3), durationInFrames - 1], [0, 1, 1, 0], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
  const contentReveal=1;
  const baseBg=scene.bg;
  const meta = getVisualMeta(scene.visual);
  const hasVisual = Boolean(meta && scene.visual !== 'none');

  // Portrait uses stacked layouts for full-bleed visuals. Landscape deliberately converts them
  // into a balanced left/right composition so the 16:9 frame never wastes vertical space.
  const landscape = profile.orientation === 'landscape';
  const stacked = hasVisual && !landscape && (scene.layoutMode === 'stacked' || meta?.fullBleed);
  const visualRight = scene.layoutMode === 'split-left' ? false : scene.layoutMode === 'split-right' ? true : scene.index % 2 === 0;
  const vx = clamp(scene.visualX, -profile.maxVisualOffsetX, profile.maxVisualOffsetX);
  const vy = clamp(scene.visualY, -profile.maxVisualOffsetY, profile.maxVisualOffsetY);
  const visualScale = (scene.visualScale ?? 1) * profile.visualScaleBoost;
  const visualTransform = `translate3d(${vx}px,${vy}px,0) scale(${visualScale})`;
  const select = (target, extra={}) => onSelectElement?.(scene.id, target, extra);

  const visualNode = hasVisual ? <ClickWrap
    editorMode={editorMode}
    selected={selected?.sceneId === scene.id && selected?.target === 'visual'}
    onClick={() => select('visual')}
    style={{
      display:'flex', justifyContent:'center', alignItems:'center', width:'100%',
      maxWidth:stacked ? profile.textOnlyWidth : profile.splitVisualWidth,
      transform:visualTransform, transformOrigin:'50% 50%',
    }}
  >
    <VisualLibrary
      kind={scene.visual}
      scene={scene}
      editorMode={editorMode}
      selectedTextKey={selected?.sceneId === scene.id && selected?.target === 'visualText' ? selected.visualTextKey : ''}
      onSelectText={(key) => select('visualText', {visualTextKey:key})}
    />
  </ClickWrap> : null;

  const textNode = <TextBlock scene={scene} hasVisual={hasVisual} stacked={stacked} profile={profile} editorMode={editorMode} selected={selected} onSelectElement={onSelectElement}/>;
  const safe = profile.safe;

  let layoutNode;
  if (!hasVisual) {
    layoutNode = <div style={{width:'100%', display:'flex', justifyContent:'center'}}>{textNode}</div>;
  } else if (stacked) {
    layoutNode = <div style={{width:'100%', height:'100%', display:'grid', gridTemplateRows:'minmax(230px,.8fr) minmax(500px,1.5fr)', gap:28, alignItems:'center', justifyItems:'center'}}>{textNode}{visualNode}</div>;
  } else {
    layoutNode = <div style={{
      width:'100%', maxWidth:profile.contentMaxWidth, display:'grid',
      gridTemplateColumns:`minmax(0,${profile.splitTextWidth}px) minmax(0,${profile.splitVisualWidth}px)`,
      gap:profile.splitGap, alignItems:'center', justifyContent:'center',
    }}>
      {!visualRight ? visualNode : null}
      {textNode}
      {visualRight ? visualNode : null}
    </div>;
  }

  return <AbsoluteFill
    onClick={editorMode ? () => select('background') : undefined}
    style={{background:baseBg, color:scene.fg, opacity:fade, overflow:'hidden', cursor:editorMode ? 'pointer' : 'default'}}
  >
    <SceneBackground scene={scene} project={project}/>
    <div style={{
      position:'absolute', left:safe.left, right:safe.right, top:safe.top, bottom:safe.bottom,
      display:'flex', alignItems:'center', justifyContent:'center', overflow:'visible', opacity:contentReveal,
    }}>{layoutNode}</div>
    <div style={{opacity:contentReveal}}><StickerLayer scene={scene} project={project} editorMode={editorMode} selected={selected?.sceneId===scene.id&&selected?.target==='sticker'} onSelect={()=>select('sticker')}/></div>
  </AbsoluteFill>;
}

function SceneSequences({project, editorMode, selected, onSelectElement}) {
  const fps = project.fps || 30;
  const scenes=project.scenes||[];
  return <>{scenes.map((scene,index) => {
    const from = Math.max(0, Math.floor(scene.start * fps));
    const duration = Math.max(1, Math.ceil((scene.end - scene.start) * fps));
    const previousBg=index>0?scenes[index-1].bg:(project.formatMatteColor||scene.bg);
    return <Sequence key={scene.id} from={from} durationInFrames={duration}>
      <Scene scene={scene} project={project} previousBg={previousBg} editorMode={editorMode} selected={selected} onSelectElement={onSelectElement}/>
    </Sequence>;
  })}</>;
}

export const Reel = ({project, editorMode=false, selected=null, onSelectElement=null}) => {
  const voiceVolume = Math.max(0, Number(project.audioVolume ?? 1));
  const musicVolume = Math.max(0, Number(project.musicVolume ?? .15));
  const viewport = getActiveViewport(project);
  const windowMode = viewport.mode === 'window';

  return <AbsoluteFill style={{background:project.formatMatteColor || '#0B0C0F', overflow:'hidden'}}>
    {project.audioSrc ? <Audio src={mediaSrc(project.audioSrc)} volume={voiceVolume}/> : null}
    {project.musicSrc && musicVolume > 0 ? <Audio src={mediaSrc(project.musicSrc)} volume={musicVolume} loop/> : null}

    {windowMode ? <div style={{
      position:'absolute', left:viewport.offsetX, top:viewport.offsetY,
      width:viewport.designWidth, height:viewport.designHeight,
      transform:`scale(${viewport.scale})`, transformOrigin:'top left', overflow:'hidden',
      boxShadow:editorMode ? '0 0 0 5px rgba(255,255,255,.28)' : 'none',
    }}>
      <SceneSequences project={project} editorMode={editorMode} selected={selected} onSelectElement={onSelectElement}/>
    </div> : <SceneSequences project={project} editorMode={editorMode} selected={selected} onSelectElement={onSelectElement}/>} 
  </AbsoluteFill>;
};
