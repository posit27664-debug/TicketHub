import * as Sentry from "@sentry/react";

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

  // Skip initialisation if no DSN is provided (e.g. local dev without key)
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: (import.meta.env.VITE_SENTRY_ENVIRONMENT as string) || import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Mask all text & user inputs for privacy by default
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Capture 10% of transactions for performance monitoring in production;
    // use 100% in development so every request shows up.
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

    // Capture replays only when an error occurs
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  });
}
