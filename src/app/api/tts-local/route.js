import {spawn} from 'node:child_process';
import path from 'node:path';
import {requireBasicAuth} from '../../../lib/security.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// Local-only twin of the Vercel Python function api/tts.py: runs api/_edge.py with the system Python.
export async function POST(request) {
  const denied = requireBasicAuth(request);
  if (denied) return denied;
  if (process.env.LOCAL_TOOL_MODE !== '1') return Response.json({error: 'Local voice endpoint is disabled in production.'}, {status: 403});
  const body = JSON.stringify(await request.json().catch(() => ({})));
  const python = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');
  const out = await new Promise((resolve) => {
    const child = spawn(python, [path.join(process.cwd(), 'api', '_edge.py')], {stdio: ['pipe', 'pipe', 'pipe']});
    let stdout = '', stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('error', (e) => resolve({error: `Could not start Python (${e.message}). Install Python and run: pip install edge-tts`}));
    child.on('close', () => {
      try { resolve(JSON.parse(stdout)); } catch { resolve({error: stderr.trim().split('\n').pop() || 'Voice generation failed'}); }
    });
    child.stdin.end(body);
  });
  return Response.json(out, {status: out.error ? 502 : 200});
}
