import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
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

  // Disable the Sentry logger statements tree-shaking so that Sentry.logger.*
  // calls are preserved in the bundle (required for structured logs feature).
  disableLogger: false,

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors.
    automaticVercelMonitors: true,
  },
});
