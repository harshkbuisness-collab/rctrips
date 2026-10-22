import {put} from '@vercel/blob';
import {requireBasicAuth} from '../../../lib/security.js';
import {signedGetUrl} from '../../../lib/privateBlob.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const safe = (value) => String(value || 'reel').replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 80) || 'reel';

export async function POST(request) {
  const denied = requireBasicAuth(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    if (!body?.project) throw new Error('Missing project');
    const project = body.project;
    const name = safe(project.projectId || project.title || 'reel');
    // Never persist temporary signed media URLs in a saved project.
    const persisted = {...project};
    if (persisted.audioBlobPath) persisted.audioSrc = '';
    if (persisted.musicBlobPath) persisted.musicSrc = '';
    const blob = await put(
      `projects/${name}-${Date.now()}.json`,
      JSON.stringify(persisted, null, 2),
      {access:'private', contentType:'application/json', addRandomSuffix:true, cacheControlMaxAge:60},
    );
    const signed = await signedGetUrl(blob.pathname, 15 * 60);
    return Response.json({ok:true, url:signed.url, pathname:blob.pathname, expiresAt:signed.expiresAt}, {
      headers:{'Cache-Control':'no-store'},
    });
  } catch (error) {
    return Response.json({error:error instanceof Error ? error.message : String(error)}, {status:400});
  }
}
