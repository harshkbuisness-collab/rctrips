// Browser-side helpers for media upload, server render and download.
// Uses the existing API routes (local disk on localhost, Private Blob + Vercel Sandbox in the cloud).

const safeName = (name = 'file') => String(name).replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'file';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function json(res, fallback) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || fallback);
  return data;
}

export function getAudioDuration(file) {
  return new Promise((resolve, reject) => {
    const a = document.createElement('audio'), u = URL.createObjectURL(file);
    a.preload = 'metadata';
    a.onloadedmetadata = () => { URL.revokeObjectURL(u); Number.isFinite(a.duration) && a.duration > 0 ? resolve(a.duration) : reject(new Error('Could not read audio duration')); };
    a.onerror = () => { URL.revokeObjectURL(u); reject(new Error('Could not read audio file')); };
    a.src = u;
  });
}

// Returns {pathname} for the server-side copy used by the renderer.
export async function uploadMedia(file, folder, setStatus) {
  if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    setStatus(`Saving ${folder} for local render...`);
    const fd = new FormData(); fd.append('file', file); fd.append('folder', folder);
    const d = await json(await fetch('/api/local-upload', {method: 'POST', body: fd}), 'Could not save local media copy');
    return {pathname: d.pathname};
  }
  setStatus(`Uploading ${folder}...`);
  const token = await json(await fetch('/api/upload-url', {method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({folder, fileName: safeName(file.name), contentType: file.type || 'application/octet-stream', size: file.size})}), 'Could not authorize upload');
  const put = await fetch(token.presignedUrl, {method: 'PUT', headers: {'Content-Type': file.type || 'application/octet-stream'}, body: file});
  if (!put.ok) throw new Error(`Upload failed (${put.status})`);
  let uploaded = {}; try { uploaded = JSON.parse(await put.text()); } catch {}
  const pathname = uploaded?.pathname || token.pathname;
  const v = await json(await fetch('/api/verify-upload', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({pathname})}), 'Upload could not be verified');
  return {pathname: v.pathname || pathname};
}

function download({url = '', blobPath = '', fileName = 'reel.mp4'}) {
  const name = String(fileName).replace(/[^a-zA-Z0-9._-]+/g, '_');
  const href = blobPath ? `/api/download?blobPath=${encodeURIComponent(blobPath)}&fileName=${encodeURIComponent(name)}` : url;
  if (!href) throw new Error('MP4 download link is missing');
  const a = document.createElement('a'); a.href = href; a.download = name; document.body.appendChild(a); a.click(); a.remove();
}

export async function renderVideo(project, setStatus) {
  setStatus('Starting MP4 renderer...');
  const d = await json(await fetch('/api/render', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({project})}), 'Could not start render');
  if (d.done && d.url) { download({url: d.url, blobPath: d.blobPath, fileName: d.fileName}); return setStatus('Render complete ✓ — download started'); }
  if (!d.sandboxId || !d.cmdId) throw new Error('Render service did not return a render handle');
  for (let i = 0; i < 900; i++) {
    await wait(2000);
    const p = await json(await fetch(`/api/render-progress?sandboxId=${encodeURIComponent(d.sandboxId)}&cmdId=${encodeURIComponent(d.cmdId)}&blobPath=${encodeURIComponent(d.blobPath || '')}`), 'Could not read render progress');
    if (p.stage === 'error') throw new Error(p.message || 'Render failed');
    if (p.stage === 'expired') throw new Error('Render session expired. Please render again.');
    if (p.stage === 'done') { download({url: p.url, blobPath: p.privateBlobPath || d.blobPath, fileName: d.fileName}); return setStatus('Render complete ✓ — download started'); }
    setStatus(`Rendering MP4 • ${Math.round(Math.max(0, Math.min(1, Number(p.overallProgress || 0))) * 100)}%`);
  }
  throw new Error('Render timed out');
}
