import React from 'react';
import {Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {getLayoutProfile} from '../formats.js';
import {getStickerMeta} from '../stickerEngine.js';

const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));

function stickerSrc(src=''){
  const s=String(src||'').replace(/\\/g,'/').replace(/^\//,'');
  return staticFile(s.replace(/^public\//,''));
}

function motion(animation,frame,duration){
  const enter=interpolate(frame,[0,8],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.back(1.4))});
  const exit=interpolate(frame,[Math.max(0,duration-6),Math.max(1,duration-1)],[1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const opacity=Math.min(enter,exit);
  const t=Math.max(0,frame-7);
  let x=0,y=0,rot=0,scale=.25+.75*enter;
  if(animation==='bounce'){y=(1-enter)*56 + Math.sin(t*.36)*5;scale=.35+.65*enter;}
  else if(animation==='slap'){rot=(1-enter)*-18;scale=1.55-.55*enter;}
  else if(animation==='wiggle'){rot=(1-enter)*-10 + Math.sin(t*.72)*4.5;scale=.35+.65*enter;}
  else if(animation==='shake'){x=Math.sin(t*1.35)*7*enter;rot=Math.sin(t*.9)*2.5*enter;scale=.38+.62*enter;}
  else if(animation==='float'){y=(1-enter)*34 + Math.sin(t*.16)*6;scale=.45+.55*enter;}
  else if(animation==='peek'){x=(1-enter)*92;rot=(1-enter)*8;scale=.68+.32*enter;}
  else if(animation==='stamp'){scale=1.75-.75*enter;rot=(1-enter)*-8;}
  else if(animation==='swing'){rot=(1-enter)*-15 + Math.sin(t*.18)*5;scale=.45+.55*enter;}
  else if(animation==='bob'){y=(1-enter)*38 + Math.sin(t*.22)*8;rot=Math.sin(t*.16)*1.5;scale=.4+.6*enter;}
  else if(animation==='spin'){rot=(1-enter)*-55 + t*1.2;scale=.3+.7*enter;}
  else if(animation==='punch'){scale=.15+.85*enter + Math.max(0,1-enter)*.22;}
  else {scale=.28+.72*enter;}
  const exitScale=.92+.08*exit;
  return {opacity,transform:`translate3d(${x}px,${y}px,0) rotate(${rot}deg) scale(${scale*exitScale})`};
}

function placementStyle(placement,profile){
  const landscape=profile.orientation==='landscape';
  const side=landscape?118:72;
  const top=landscape?72:165;
  const bottom=landscape?78:205;
  const common={position:'absolute',zIndex:30};
  if(placement==='top-left')return {...common,left:side,top};
  if(placement==='top-right')return {...common,right:side,top};
  if(placement==='bottom-left')return {...common,left:side,bottom};
  return {...common,right:side,bottom};
}

export function StickerLayer({scene,project,editorMode=false,selected=false,onSelect}){
  const frame=useCurrentFrame();const {durationInFrames}=useVideoConfig();
  const sticker=getStickerMeta(scene.stickerId);
  if(!sticker||scene.stickerId==='none')return null;
  const profile=getLayoutProfile(project);
  const base=profile.orientation==='landscape'?230:255;
  const scale=clamp(scene.stickerScale??1,.45,1.8);
  const x=clamp(scene.stickerX||0,-profile.maxVisualOffsetX,profile.maxVisualOffsetX);
  const y=clamp(scene.stickerY||0,-profile.maxVisualOffsetY,profile.maxVisualOffsetY);
  const m=motion(scene.stickerAnimation||sticker.preferredAnimation||'pop',frame,durationInFrames);
  return <div
    onClick={editorMode?(e)=>{e.stopPropagation();onSelect?.();}:undefined}
    style={{
      ...placementStyle(scene.stickerPlacement||'bottom-right',profile),
      width:base*scale,height:base*scale,display:'flex',alignItems:'center',justifyContent:'center',
      transform:`translate3d(${x}px,${y}px,0)`,transformOrigin:'50% 50%',cursor:editorMode?'pointer':'default',
      outline:editorMode&&selected?'5px solid rgba(255,255,255,.8)':'none',outlineOffset:8,borderRadius:24,
      pointerEvents:m.opacity<.02?'none':'auto',
    }}
  >
    <Img src={stickerSrc(sticker.src)} style={{
      maxWidth:'100%',maxHeight:'100%',objectFit:'contain',...m,
      filter:'drop-shadow(0 0 2px rgba(255,255,255,.92)) drop-shadow(0 9px 12px rgba(0,0,0,.28))',
      transformOrigin:'50% 55%',
    }}/>
  </div>;
}
