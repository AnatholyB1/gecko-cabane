import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import { buildCsp } from './src/utils/csp';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const cspBase = {
  dev: process.env.NODE_ENV !== 'production',
  upgradeInsecureRequests: process.env.VERCEL === '1',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
};

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,  // Local images only (no remotePatterns); qualities allowlist limits optimizer abuse.
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [60, 75],
    minimumCacheTTL: 2678400,
  },
  // 308 before middleware, no Accept-Language detection (D-02).
  // A permanent redirect is browser-cached: never reuse '/' for another purpose.
  async redirects() {
    return [{ source: '/', destination: '/fr', permanent: true }];
  },
  // WiFi credentials are rendered per request: never cache (T-07-05-03).
  async headers() {
    return [
      // SEC-01..04: baseline security headers on every route (CSP is the next rule: SEC-05).
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), payment=(), usb=(), bluetooth=(), serial=(), hid=(), magnetometer=(), gyroscope=(), accelerometer=()',
          },
        ],
      },
      // SEC-05: Content-Security-Policy, applied (not Report-Only). See src/utils/csp.ts for the trade-offs.
      // Public and API routes: strict img-src. /admin has its own rule (any https image for the photo preview);
      // the two sources are disjoint so the header is never emitted twice.
      {
        source: '/:path((?!admin(?:/|$)).*)',
        headers: [{ key: 'Content-Security-Policy', value: buildCsp(cspBase) }],
      },
      {
        source: '/admin/:path*',
        headers: [{ key: 'Content-Security-Policy', value: buildCsp({ ...cspBase, admin: true }) }],
      },
      {
        source: '/:locale(fr|en|de|sv)/wifi',
        headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
      },
      // Plausible script proxied from plausible.io (rewrite below): without this it is served with a
      // short TTL (PERF-04). Long cache + revalidation window; the script is not versioned in its URL.
      {
        source: '/gcm/js/script.js',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
      },
    ];
  },
  // Plausible first-party proxy (D-02). Keyed on the same env var as PlausibleScript.
  // Rewrites are baked at build time on Vercel: set the env, then redeploy.
  // /gcm is excluded from the middleware matcher like /monitoring.
  async rewrites() {
    const id = process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_ID;
    if (!id || !/^pa-[A-Za-z0-9_-]+$/.test(id)) return [];
    return [
      { source: '/gcm/js/script.js', destination: `https://plausible.io/js/${id}.js` },
      { source: '/gcm/api/event', destination: 'https://plausible.io/api/event' },
    ];
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "anatholy",
  project: "gecko-cabane",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // Note: the /monitoring path is excluded from the Next.js middleware matcher.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors.
    automaticVercelMonitors: true,
    // Keep Sentry.logger.* calls in the bundle (required for structured logs).
    // Replaces the deprecated `disableLogger: false` option.
    treeshake: {
      removeDebugLogging: false,
    },
  },
});
