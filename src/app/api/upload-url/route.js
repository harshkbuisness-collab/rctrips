import crypto from 'node:crypto';
import {issueSignedToken, presignUrl} from '@vercel/blob';
import {requireBasicAuth} from '../../../lib/security.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const safeName=(name='file')=>String(name).replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,120)||'file';

export async function POST(request) {
  const denied=requireBasicAuth(request);
  if(denied)return denied;
  try{
    const body=await request.json();
    const folder=body?.folder;
    const fileName=safeName(body?.fileName);
    const contentType=String(body?.contentType||'application/octet-stream').slice(0,120);
    const size=Math.max(1,Math.min(1024*1024*1024,Number(body?.size)||1));
    if(!['voice','music'].includes(folder))return Response.json({error:'Invalid upload folder'},{status:400});
    if(!(contentType.startsWith('audio/')||contentType.startsWith('video/')||contentType==='application/octet-stream'))return Response.json({error:'Unsupported media type'},{status:400});

    // The pathname is already globally unique (timestamp + UUID), so explicitly
    // disable Blob's random suffix. The browser must later render the exact same
    // pathname that was uploaded.
    const pathname=`uploads/${folder}/${Date.now()}-${crypto.randomUUID().slice(0,8)}-${fileName}`;
    const validUntil=Date.now()+10*60*1000;
    const token=await issueSignedToken({
      pathname,
      operations:['put'],
      allowedContentTypes:[contentType],
      maximumSizeInBytes:size,
      validUntil,
    });
    const {presignedUrl}=await presignUrl(token,{
      pathname,
      operation:'put',
      validUntil,
      access:'private',
      allowedContentTypes:[contentType],
      maximumSizeInBytes:size,
      addRandomSuffix:false,
      allowOverwrite:false,
    });
    return Response.json({ok:true,pathname,presignedUrl,expiresAt:validUntil},{headers:{'Cache-Control':'no-store'}});
  }catch(error){
    return Response.json({error:error instanceof Error?error.message:String(error)},{status:400});
  }
}
