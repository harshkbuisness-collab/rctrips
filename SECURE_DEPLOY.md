# Secure Vercel Deployment — required setup

This build is designed as a private internal tool. It intentionally **fails closed** when credentials are missing.

## 1. Deploy the ZIP to Vercel
Create/import the project normally.

## 2. Add two Environment Variables
Project → Settings → Environment Variables:

- `TOOL_USERNAME` = your private username
- `TOOL_PASSWORD` = a long unique password (20+ random characters recommended)

Apply them to Production + Preview, then redeploy.

## 3. Create a PRIVATE Blob store
Project → Storage → Create → Blob → choose **Private** access.

Connect the store to this project so `BLOB_READ_WRITE_TOKEN` is added automatically. Do not use a Public Blob store for this secure build.

## 4. Enable Vercel Authentication as a second security layer
Project → Security → Deployment Protection → Vercel Authentication → **All Deployments**.

Only Vercel users with project access can then reach the deployment at all. The app-level username/password remains a second gate.

## 5. Keep the project/repository private
If you connect GitHub, use a **Private repository** and only add trusted collaborators.

## What this build protects
- The editor, Next.js JS chunks, static sticker assets and APIs are blocked by app-level Basic Auth.
- Recommended Vercel Authentication blocks the deployment before the app is reached.
- Voice/music uploads use **Private Vercel Blob**.
- Private media is exposed to the browser only through short-lived signed GET URLs.
- Rendered MP4s use Private Blob and receive a signed download URL valid for 15 minutes.
- Saved project JSON uses Private Blob and receives a signed URL valid for 15 minutes.
- Browser source maps are disabled in production.
- Source/reference archives are not shipped in this secure package.
- Security headers disable framing/indexing and reduce browser attack surface.

## Important limitation
A web app cannot make JavaScript already delivered to an authorized user's browser mathematically impossible to inspect. This build prevents anonymous/public access and removes source maps; only someone who passes your access gates can receive the compiled browser code. Keep proprietary secrets, credentials and tokens server-side.
