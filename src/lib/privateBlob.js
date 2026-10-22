import {issueSignedToken, presignUrl} from '@vercel/blob';
import {safePrivatePath} from './security.js';

function assertPrivatePresignedGetUrl(url, pathname) {
  const parsed = new URL(url);
  if (parsed.hostname.includes('.undefined.')) {
    throw new Error('Invalid Vercel Blob signed URL: access mode was not resolved');
  }
  if (!parsed.hostname.endsWith('.private.blob.vercel-storage.com')) {
    throw new Error(`Invalid private Vercel Blob host for ${pathname}`);
  }
  return url;
}

export async function signedGetUrl(pathname, validForSeconds=7200) {
  const safePath = safePrivatePath(pathname);
  if (!safePath) throw new Error('Invalid private blob path');
  const ttl = Math.max(60, Math.min(6 * 60 * 60, Number(validForSeconds) || 7200));
  const validUntil = Date.now() + ttl * 1000;

  // Scope the delegation to the exact object and explicitly declare PRIVATE
  // access when building the URL. Without access:'private', @vercel/blob can
  // construct a malformed hostname such as <store>.undefined.blob....
  const token = await issueSignedToken({
    pathname: safePath,
    operations:['get'],
    validUntil,
  });
  const {presignedUrl} = await presignUrl(token, {
    pathname: safePath,
    operation: 'get',
    validUntil,
    access: 'private',
    useCache: false,
  });

  assertPrivatePresignedGetUrl(presignedUrl, safePath);
  return {url: presignedUrl, pathname: safePath, expiresAt: validUntil};
}
