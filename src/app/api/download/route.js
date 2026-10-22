import {requireBasicAuth, safePrivatePath} from '../../../lib/security.js';
import {signedGetUrl} from '../../../lib/privateBlob.js';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const safeFileName = (value='reel.mp4') => {
  const cleaned=String(value||'reel.mp4').replace(/[^a-zA-Z0-9._-]+/g,'_').slice(0,120);
  return cleaned.toLowerCase().endsWith('.mp4')?cleaned:`${cleaned||'reel'}.mp4`;
};

export async function GET(request) {
  const denied=requireBasicAuth(request);
  if(denied)return denied;
  try{
    const url=new URL(request.url);
    const blobPath=safePrivatePath(url.searchParams.get('blobPath'),['renders/']);
    if(!blobPath)return Response.json({error:'Invalid render path'},{status:400});
    const fileName=safeFileName(url.searchParams.get('fileName')||blobPath.split('/').pop()||'reel.mp4');
    const signed=await signedGetUrl(blobPath,5*60);
    const upstream=await fetch(signed.url,{cache:'no-store'});
    if(!upstream.ok||!upstream.body)throw new Error(`Could not read rendered MP4 (${upstream.status})`);
    const headers=new Headers();
    headers.set('Content-Type','video/mp4');
    headers.set('Content-Disposition',`attachment; filename="${fileName}"`);
    headers.set('Cache-Control','private, no-store, max-age=0');
    const len=upstream.headers.get('content-length');
    if(len)headers.set('Content-Length',len);
    return new Response(upstream.body,{status:200,headers});
  }catch(error){
    return Response.json({error:error instanceof Error?error.message:String(error)},{status:500,headers:{'Cache-Control':'no-store'}});
  }
}
