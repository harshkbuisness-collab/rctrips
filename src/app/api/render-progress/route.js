import {getRenderProgress} from '@remotion/vercel';
import {requireBasicAuth, safePrivatePath} from '../../../lib/security.js';
import {signedGetUrl} from '../../../lib/privateBlob.js';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const denied = requireBasicAuth(request);
  if (denied) return denied;
  try {
    const url = new URL(request.url);
    const sandboxId = url.searchParams.get('sandboxId');
    const cmdId = url.searchParams.get('cmdId');
    const blobPath = safePrivatePath(url.searchParams.get('blobPath'), ['renders/']);
    if (!sandboxId || !cmdId || !blobPath) {
      return Response.json({error:'Missing or invalid render handle'}, {status:400});
    }
    const progress = await getRenderProgress({sandboxId, cmdId});
    if (progress?.stage === 'done') {
      const signed = await signedGetUrl(blobPath, 15 * 60);
      return Response.json({...progress, url:signed.url, privateBlobPath:blobPath, urlExpiresAt:signed.expiresAt}, {
        headers:{'Cache-Control':'no-store'},
      });
    }
    return Response.json(progress, {headers:{'Cache-Control':'no-store'}});
  } catch (error) {
    return Response.json({error:error instanceof Error ? error.message : String(error)}, {status:500});
  }
}
