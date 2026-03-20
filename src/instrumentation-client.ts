// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const IS_PROD = process.env.NODE_ENV === "production";

Sentry.init({
  dsn: "https://98f02426bf8db378b4c6978e870ed3ab@o4511076061347840.ingest.de.sentry.io/4511076433264720",

  // ----------------------------------------------------------------
  // Environment & release
  // ----------------------------------------------------------------
  environment: process.env.NODE_ENV ?? "development",

  // ----------------------------------------------------------------
  // Integrations
  // ----------------------------------------------------------------
  integrations: [
    // Session replay — record user interactions around errors
    Sentry.replayIntegration({
      maskAllText: IS_PROD,   // mask PII in production
      blockAllMedia: IS_PROD,
    }),
    // Browser performance profiling (continuous profiling)
    Sentry.browserProfilingIntegration(),
  ],

  // ----------------------------------------------------------------
  // Tracing
  // ----------------------------------------------------------------
  // Lower in production to keep quota under control
  tracesSampleRate: IS_PROD ? 0.2 : 1.0,
  tracePropagationTargets: [
    "localhost",
    /^\/api\//,            // same-origin API routes
    /^https:\/\/gecko-cabane/,
  ],

  // ----------------------------------------------------------------
  // Profiling
  // ----------------------------------------------------------------
  // profilesSampleRate is relative to tracesSampleRate:
  // 1.0 → profile every sampled transaction
  profilesSampleRate: 1.0,

  // ----------------------------------------------------------------
  // Logs  (Sentry structured logging, requires enableLogs: true)
  // ----------------------------------------------------------------
  enableLogs: true,

  // ----------------------------------------------------------------
  // Session Replay sampling
  // ----------------------------------------------------------------
  replaysSessionSampleRate: IS_PROD ? 0.05 : 1.0,
  replaysOnErrorSampleRate: 1.0,

  // ----------------------------------------------------------------
  // Misc
  // ----------------------------------------------------------------
  sendDefaultPii: true,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
