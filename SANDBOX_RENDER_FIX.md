# v1.9.4 — Vercel Sandbox Render Fix

## Symptom
Cloud render failed before the MP4 existed with an error similar to:

`Failed to create directory "public" in Vercel sandbox at "remotion-bundle/public" ... No such file or directory`

## Root cause
`@remotion/vercel` uploads the prebuilt Remotion bundle into a sandbox path named `remotion-bundle`. Nested directories can be created before that bundle root exists. Vercel Sandbox directory creation is not recursive in that operation, so `remotion-bundle/public` fails when `remotion-bundle` has not been created first.

## Fix
The render API now creates `remotion-bundle` immediately after creating the sandbox, then calls `addBundleToSandbox()`. This keeps all public assets and avoids stripping stickers/static files just to work around the directory error.

## Download
The previous secure browser download route is preserved. A video can only download after rendering finishes successfully.
