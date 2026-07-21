/**
 * Sentry must be initialized before any other module is imported, so this
 * file exists solely to be the very first import in server/index.ts.
 * Do not add other logic here.
 */
import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    // Error capture works with no tracesSampleRate set at all — performance
    // tracing is a separate, optional add-on and consumes a different
    // quota on Sentry's free tier. Add it later if/when it's actually
    // wanted, rather than defaulting it on.
  });
  console.log('[Sentry] Backend error reporting initialized');
} else {
  console.warn('[Sentry] SENTRY_DSN not set — backend error reporting is disabled');
}
