import crypto from 'node:crypto';

function safeEqual(a='', b='') {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

export function securityConfigured() {
  return Boolean(process.env.TOOL_USERNAME && process.env.TOOL_PASSWORD);
}

export function isBasicAuthorized(request) {
  if (!securityConfigured()) return false;
  const header = request.headers.get('authorization') || '';
  if (!header.startsWith('Basic ')) return false;
  try {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const split = decoded.indexOf(':');
    if (split < 0) return false;
    const username = decoded.slice(0, split);
    const password = decoded.slice(split + 1);
    return safeEqual(username, process.env.TOOL_USERNAME) && safeEqual(password, process.env.TOOL_PASSWORD);
  } catch {
    return false;
  }
}

export function unauthorizedResponse(message='Authentication required') {
  return new Response(message, {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="AI Reel Generator Secure", charset="UTF-8"',
      'Cache-Control': 'no-store',
    },
  });
}

export function requireBasicAuth(request) {
  if (!securityConfigured()) {
    return new Response('Security is not configured. Add TOOL_USERNAME and TOOL_PASSWORD in Vercel Environment Variables.', {
      status: 503,
      headers: {'Cache-Control': 'no-store'},
    });
  }
  if (!isBasicAuthorized(request)) return unauthorizedResponse();
  return null;
}

export function safePrivatePath(pathname, prefixes=['uploads/','renders/','projects/']) {
  const value = String(pathname || '').replace(/^\/+/, '');
  if (!value || value.includes('..') || value.includes('\\')) return null;
  if (!prefixes.some(prefix => value.startsWith(prefix))) return null;
  return value;
}
