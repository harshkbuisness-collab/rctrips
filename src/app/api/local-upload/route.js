import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {requireBasicAuth} from '../../../lib/security.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const safeName=(name='file')=>String(name).replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,120)||'file';

export async function POST(request){
  const denied=requireBasicAuth(request);
  if(denied)return denied;
  if(process.env.LOCAL_TOOL_MODE!=='1')return Response.json({error:'Local upload endpoint is disabled in production.'},{status:403});
  try{
    const form=await request.formData();
    const file=form.get('file');
    const folder=String(form.get('folder')||'');
    if(!file||typeof file.arrayBuffer!=='function')throw new Error('Missing media file');
    if(!['voice','music'].includes(folder))throw new Error('Invalid upload folder');
    const fileName=`${Date.now()}-${crypto.randomUUID().slice(0,8)}-${safeName(file.name||'media')}`;
    const rel=`local-uploads/${folder}/${fileName}`;
    const abs=path.join(process.cwd(),'public',rel);
    await fs.mkdir(path.dirname(abs),{recursive:true});
    await fs.writeFile(abs,Buffer.from(await file.arrayBuffer()));
    return Response.json({ok:true,local:true,pathname:`/${rel}`,url:`/${rel}`},{headers:{'Cache-Control':'no-store'}});
  }catch(error){
    return Response.json({error:error instanceof Error?error.message:String(error)},{status:400});
  }
}
