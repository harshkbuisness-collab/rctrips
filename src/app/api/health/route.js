import {issueSignedToken} from '@vercel/blob';
import {requireBasicAuth, securityConfigured} from '../../../lib/security.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const denied = requireBasicAuth(request);
  if (denied) return denied;

  let blobConfigured = false;
  let blobAuthMode = 'unavailable';
  let blobError = '';

  try {
    // This works with both the legacy BLOB_READ_WRITE_TOKEN and Vercel's
    // newer project-scoped OIDC authentication for Private Blob.
    await issueSignedToken({operations:['get']});
    blobConfigured = true;
    blobAuthMode = process.env.BLOB_READ_WRITE_TOKEN ? 'static-token' : 'oidc';
  } catch (error) {
    blobError = error instanceof Error ? error.message : String(error);
  }

  return Response.json({
    ok: true,
    buildVersion: '1.9.6-blob-upload-path-fix',
    localMode: process.env.LOCAL_TOOL_MODE === '1',
    securityConfigured: securityConfigured(),
    blobConfigured,
    blobAuthMode,
    blobError,
    privateBlobRequired: true,
    sandboxSupported: true,
    runtime: 'vercel-node',
  }, {headers:{'Cache-Control':'no-store'}});
}
