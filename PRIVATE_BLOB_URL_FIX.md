# v1.9.5 — Private Blob signed URL fix

The previous build generated signed GET URLs without passing the required Blob access mode to `presignUrl()`. That produced malformed hosts such as:

`<store-id>.undefined.blob.vercel-storage.com`

Remotion then failed DNS resolution inside the Vercel Sandbox.

v1.9.5 fixes this by:

- explicitly passing `access: 'private'` to every presigned Blob URL call;
- scoping GET delegation tokens to the exact pathname;
- validating that generated GET URLs use `.private.blob.vercel-storage.com` and never `.undefined.`;
- using `useCache: false` for freshly uploaded voice/music reads;
- upgrading `@vercel/blob` to 2.6.1;
- keeping Private Blob, same-origin download route, local mode, and existing Vercel project deployment flow intact.
