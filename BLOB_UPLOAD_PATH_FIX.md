# v1.9.6 Private Blob upload/path hard fix

This build fixes the case where rendering receives a 404 `Blob not found` for a freshly uploaded voice/music file.

Changes:
- Presigned PUT explicitly sets `addRandomSuffix: false` and `allowOverwrite: false`.
- Browser now reads the Blob PUT response and uses the actual returned `pathname` when available.
- New `/api/verify-upload` endpoint checks the uploaded object with authenticated Blob `head()` before the editor marks media as ready.
- Render route re-verifies voice/music presence before generating a signed GET URL.
- Short retry window handles immediate post-upload propagation without starting a doomed Remotion render.
- `@vercel/blob` updated to 2.8.0.
