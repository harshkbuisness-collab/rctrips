import {NextResponse} from 'next/server';

function basicAuthorized(request) {
  const username = process.env.TOOL_USERNAME;
  const password = process.env.TOOL_PASSWORD;
  if (!username || !password) return false;
  const header = request.headers.get('authorization') || '';
  if (!header.startsWith('Basic ')) return false;
  try {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const split = decoded.indexOf(':');
    if (split < 0) return false;
    return decoded.slice(0, split) === username && decoded.slice(split + 1) === password;
  } catch {
    return false;
  }
}

export function proxy(request) {
  const {pathname} = request.nextUrl;

  if (!process.env.TOOL_USERNAME || !process.env.TOOL_PASSWORD) {
    return new NextResponse('Security is not configured. Add TOOL_USERNAME and TOOL_PASSWORD in Vercel Environment Variables.', {
      status: 503,
      headers: {'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow'},
    });
  }

  if (!basicAuthorized(request)) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="AI Reel Generator Secure", charset="UTF-8"',
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = {
  matcher: '/:path*',
};
