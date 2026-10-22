import {head} from '@vercel/blob';
import {requireBasicAuth, safePrivatePath} from '../../../lib/security.js';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));

export async function POST(request){
  const denied=requireBasicAuth(request);
  if(denied)return denied;
  try{
    const body=await request.json();
    const pathname=safePrivatePath(body?.pathname,['uploads/voice/','uploads/music/']);
    if(!pathname)return Response.json({error:'Invalid uploaded media path'},{status:400});

    let lastError;
    for(const delay of [0,250,750,1500]){
      if(delay)await sleep(delay);
      try{
        const meta=await head(pathname);
        if(meta?.pathname){
          return Response.json({
            ok:true,
            pathname:meta.pathname,
            size:meta.size,
            contentType:meta.contentType,
            etag:meta.etag,
          },{headers:{'Cache-Control':'no-store'}});
        }
      }catch(error){
        lastError=error;
      }
    }
    throw lastError||new Error('Uploaded Blob could not be verified');
  }catch(error){
    return Response.json({error:`Private Blob upload was not found after upload. ${error instanceof Error?error.message:String(error)}`},{status:404});
  }
}
