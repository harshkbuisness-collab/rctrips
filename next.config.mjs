/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  // Remotion's renderer/bundler contain native and optional platform modules.
  // Keep them as Node.js server dependencies instead of asking Next/Turbopack
  // to statically analyze binaries and optional packages during the app build.
  serverExternalPackages: [
    '@remotion/bundler',
    '@remotion/renderer',
    '@remotion/vercel',
    '@remotion/studio',
    '@vercel/sandbox',
    'esbuild',
  ],
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  outputFileTracingIncludes: {
    '/api/render': ['./remotion-build/**/*'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {key:'X-Content-Type-Options', value:'nosniff'},
          {key:'X-Frame-Options', value:'DENY'},
          {key:'Referrer-Policy', value:'no-referrer'},
          {key:'X-Robots-Tag', value:'noindex, nofollow, noarchive'},
          {key:'Permissions-Policy', value:'camera=(), microphone=(), geolocation=(), payment=(), usb=()'},
          {key:'Content-Security-Policy', value:"frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'"},
        ],
      },
    ];
  },
};

export default nextConfig;
