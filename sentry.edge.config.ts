// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note: Edge Runtime does NOT support Node.js profiling or metrics — only tracing & logs.
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
  // Tracing
  // ----------------------------------------------------------------
  // Edge Runtime does not support profiling; tracing only
  tracesSampleRate: IS_PROD ? 0.2 : 1.0,

  // ----------------------------------------------------------------
  // Logs
  // ----------------------------------------------------------------
  enableLogs: true,

  // ----------------------------------------------------------------
  // Misc
  // ----------------------------------------------------------------
  sendDefaultPii: true,
});

