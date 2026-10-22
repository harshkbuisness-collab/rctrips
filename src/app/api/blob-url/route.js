import {issueSignedToken, presignUrl} from '@vercel/blob';
import {requireBasicAuth, safePrivatePath} from '../../../lib/security.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const denied = requireBasicAuth(request);
  if (denied) return denied;
  try {
    const {pathname, validForSeconds=7200} = await request.json();
    const safePath = safePrivatePath(pathname);
    if (!safePath) return Response.json({error:'Invalid private blob path'}, {status:400});
    const ttl = Math.max(60, Math.min(6 * 60 * 60, Number(validForSeconds) || 7200));
    const validUntil = Date.now() + ttl * 1000;
    const token = await issueSignedToken({pathname:safePath, operations:['get'], validUntil});
    const {presignedUrl} = await presignUrl(token, {
      pathname: safePath,
      operation: 'get',
      validUntil,
      access:'private',
      useCache:false,
    });
    return Response.json({ok:true, url:presignedUrl, pathname:safePath, expiresAt:validUntil}, {
      headers:{'Cache-Control':'no-store'},
    });
  } catch (error) {
    return Response.json({error:error instanceof Error ? error.message : String(error)}, {status:400});
  }
}
