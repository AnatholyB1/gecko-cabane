// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

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
    // Node.js continuous profiling
    nodeProfilingIntegration(),
  ],

  // ----------------------------------------------------------------
  // Tracing
  // ----------------------------------------------------------------
  tracesSampleRate: IS_PROD ? 0.2 : 1.0,

  // ----------------------------------------------------------------
  // Profiling
  // ----------------------------------------------------------------
  // profilesSampleRate is relative to tracesSampleRate
  profilesSampleRate: 1.0,

  // ----------------------------------------------------------------
  // Logs  (structured server-side logging)
  // ----------------------------------------------------------------
  enableLogs: true,

  // ----------------------------------------------------------------
  // Misc
  // ----------------------------------------------------------------
  sendDefaultPii: true,
});
