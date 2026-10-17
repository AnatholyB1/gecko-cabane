import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // 308 before middleware, no Accept-Language detection (D-02).
  // A permanent redirect is browser-cached: never reuse '/' for another purpose.
  async redirects() {
    return [{ source: '/', destination: '/fr', permanent: true }];
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
