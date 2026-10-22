import path from 'node:path';
import crypto from 'node:crypto';
import {head, put} from '@vercel/blob';
import {addBundleToSandbox, createSandbox, renderMediaOnVercel} from '@remotion/vercel';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import fs from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {requireBasicAuth, safePrivatePath} from '../../../lib/security.js';
import {signedGetUrl} from '../../../lib/privateBlob.js';

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const safe = (value) => String(value || 'reel').replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 80) || 'reel';

let localBundlePromise;
async function getLocalBundle(){
  if(!localBundlePromise){
    localBundlePromise=bundle({
      entryPoint:path.join(process.cwd(),'src/remotion/index.jsx'),
      publicDir:path.join(process.cwd(),'public'),
      outDir:path.join(process.cwd(),'remotion-build-local'),
      webpackOverride:(config)=>config,
    });
  }
  return localBundlePromise;
}

async function renderLocally(request,incoming,fileName){
  // Read local uploads from disk as data URLs: fetching them over HTTP would hit Basic Auth.
  const uploads=path.join(process.cwd(),'public','local-uploads');
  const localize=(value)=>{
    const v=String(value||'');
    if(!v.startsWith('/local-uploads/'))return v;
    const file=path.join(process.cwd(),'public',v);
    if(!file.startsWith(uploads+path.sep))throw new Error('Invalid local upload path');
    const type=/\.wav$/i.test(file)?'audio/wav':/\.m4a$/i.test(file)?'audio/mp4':'audio/mpeg';
    return `data:${type};base64,${readFileSync(file).toString('base64')}`;
  };
  const project={...incoming};
  if(project.audioBlobPath?.startsWith('/local-uploads/'))project.audioSrc=localize(project.audioBlobPath);
  else project.audioSrc=localize(project.audioSrc);
  if(project.musicBlobPath?.startsWith('/local-uploads/'))project.musicSrc=localize(project.musicBlobPath);
  else project.musicSrc=localize(project.musicSrc);
  if(!project.audioSrc)throw new Error('Voice audio is missing');
  const serveUrl=await getLocalBundle();
  const composition=await selectComposition({serveUrl,id:'Reel',inputProps:{project}});
  const rel=`local-renders/${fileName}`;
  const outputLocation=path.join(process.cwd(),'public',rel);
  await fs.mkdir(path.dirname(outputLocation),{recursive:true});
  await renderMedia({
    composition,
    serveUrl,
    codec:'h264',
    audioCodec:'aac',
    outputLocation,
    inputProps:{project},
    crf:18,
    x264Preset:'veryfast',
    enforceAudioTrack:true,
  });
  return Response.json({ok:true,done:true,mode:'local',fileName,url:`/${rel}`},{headers:{'Cache-Control':'no-store'}});
}

async function assertBlobExists(pathname,label){
  let lastError;
  for(const delay of [0,250,750,1500]){
    if(delay)await new Promise(r=>setTimeout(r,delay));
    try{
      const meta=await head(pathname);
      if(meta?.pathname)return meta;
    }catch(error){lastError=error;}
  }
  throw new Error(`${label} is not present in Private Blob at ${pathname}. Re-upload the file before rendering.${lastError?.message?` ${lastError.message}`:''}`);
}

async function refreshPrivateMedia(project) {
  const fresh = {...project};
  if (fresh.audioBlobPath) {
    const audioPath = safePrivatePath(fresh.audioBlobPath, ['uploads/voice/']);
    if (!audioPath) throw new Error('Invalid voice blob path');
    await assertBlobExists(audioPath,'Voice audio');
    fresh.audioSrc = (await signedGetUrl(audioPath, 2 * 60 * 60)).url;
  }
  if (fresh.musicBlobPath) {
    const musicPath = safePrivatePath(fresh.musicBlobPath, ['uploads/music/']);
    if (!musicPath) throw new Error('Invalid music blob path');
    await assertBlobExists(musicPath,'Background music');
    fresh.musicSrc = (await signedGetUrl(musicPath, 2 * 60 * 60)).url;
  }
  return fresh;
}

async function ensureSandboxBundleRoot(sandbox) {
  // IMPORTANT: Do not rely on sandbox.mkDir('remotion-bundle') here.
  // Some Sandbox SDK / Remotion combinations resolve that relative path
  // differently from addBundleToSandbox(), which later writes under
  // /vercel/sandbox/remotion-bundle. Create the exact absolute directory
  // using the shell and verify it exists before Remotion uploads any files.
  const root = '/vercel/sandbox/remotion-bundle';
  const mkdir = await sandbox.runCommand({
    cmd:'mkdir',
    args:['-p', root],
  });
  if (mkdir.exitCode !== 0) {
    const stderr = await mkdir.stderr?.().catch(()=>'');
    throw new Error(`Failed to prepare Vercel Sandbox bundle root (${root}): ${stderr || `exit ${mkdir.exitCode}`}`);
  }

  const check = await sandbox.runCommand({
    cmd:'test',
    args:['-d', root],
  });
  if (check.exitCode !== 0) {
    throw new Error(`Vercel Sandbox bundle root was not created at ${root}`);
  }
}

async function createPreparedSandbox() {
  const sandbox = await createSandbox({
    resources: {vcpus:4},
    timeoutInMilliseconds:280000,
  });

  await ensureSandboxBundleRoot(sandbox);

  try {
    await addBundleToSandbox({
      sandbox,
      bundleDir:path.join(process.cwd(), 'remotion-build'),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/remotion-bundle\/public|cannot create directory/i.test(message)) {
      throw new Error(`Vercel Sandbox bundle upload failed after the root directory was verified. ${message}`);
    }
    throw error;
  }
  return sandbox;
}

export async function POST(request) {
  const denied = requireBasicAuth(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const incoming = body?.project;
    if (!incoming) throw new Error('Missing project');
    if (!incoming.audioBlobPath && !incoming.audioSrc) throw new Error('Voice audio is missing');
    if (!Array.isArray(incoming.scenes) || !incoming.scenes.length) throw new Error('The video has no scenes yet — generate or upload the voice first');

    const fileName = `${safe(incoming.projectId || incoming.title || 'reel')}-${Date.now()}-${crypto.randomUUID().slice(0,8)}.mp4`;
    if(process.env.LOCAL_TOOL_MODE==='1')return await renderLocally(request,incoming,fileName);
    const project = await refreshPrivateMedia(incoming);
    const blobPath = `renders/${fileName}`;
    const sandbox = await createPreparedSandbox();

    // Legacy/static-token path: keeps the long-running detached renderer.
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const render = await renderMediaOnVercel({
        sandbox,
        compositionId:'Reel',
        inputProps:{project},
        codec:'h264',
        audioCodec:'aac',
        crf:18,
        x264Preset:'veryfast',
        enforceAudioTrack:true,
        timeoutInMilliseconds:90000,
        detached:true,
        detachedSandboxTimeoutInMilliseconds:30 * 60 * 1000,
        vercelBlob:{
          blobToken:process.env.BLOB_READ_WRITE_TOKEN,
          access:'private',
          blobPath,
        },
      });

      return Response.json({
        ok:true,
        mode:'detached-token',
        sandboxId:render.sandboxId,
        cmdId:render.cmdId,
        outputFile:render.outputFile,
        fileName,
        blobPath,
      }, {headers:{'Cache-Control':'no-store'}});
    }

    // OIDC path: newer Private Blob connections may not expose a static token.
    // Render inside the Sandbox, pull the MP4 back to this Function, then upload
    // it to Private Blob using the project's short-lived OIDC identity.
    try {
      const render = await renderMediaOnVercel({
        sandbox,
        compositionId:'Reel',
        inputProps:{project},
        codec:'h264',
        audioCodec:'aac',
        crf:18,
        x264Preset:'veryfast',
        enforceAudioTrack:true,
        timeoutInMilliseconds:240000,
        detached:false,
      });

      const buffer = await sandbox.readFileToBuffer({path:render.sandboxFilePath});
      if (!buffer || !buffer.length) throw new Error('Renderer finished but the MP4 could not be read from the Vercel Sandbox');

      await put(blobPath, buffer, {
        access:'private',
        contentType:'video/mp4',
        addRandomSuffix:false,
      });

      const signed = await signedGetUrl(blobPath, 15 * 60);
      return Response.json({
        ok:true,
        done:true,
        mode:'oidc-sync',
        fileName,
        blobPath,
        url:signed.url,
        urlExpiresAt:signed.expiresAt,
      }, {headers:{'Cache-Control':'no-store'}});
    } finally {
      try { await sandbox.stop?.(); } catch {}
    }
  } catch (error) {
    console.error(error);
    return Response.json({error:error instanceof Error ? error.message : String(error)}, {status:500});
  }
}
