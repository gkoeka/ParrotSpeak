/**
 * Thin wrapper around Sentry (mobile). Call sites should import from here,
 * not from '@sentry/react-native' directly — if the crash-reporting vendor
 * ever changes, only this file needs to change.
 *
 * initErrorReporting() must be called once, as early as possible in
 * App.tsx, before anything else renders.
 */
import * as Sentry from '@sentry/react-native';

let initialized = false;

export function initErrorReporting(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    console.warn('[Sentry] EXPO_PUBLIC_SENTRY_DSN not set — mobile error reporting is disabled');
    return;
  }

  Sentry.init({
    dsn,
    // Tagged, not disabled, in dev — so you can actually verify this works
    // locally before trusting it in a real build. Filter/mute the
    // "development" environment in Sentry's dashboard if it gets noisy.
    environment: __DEV__ ? 'development' : 'production',
    // Error capture works with no tracesSampleRate set at all — performance
    // tracing is a separate, optional add-on. Add it later if wanted.
  });

  initialized = true;
  console.log('[Sentry] Mobile error reporting initialized');
}

/**
 * Report a caught error to the crash-reporting service.
 * @param error The error object (or unknown caught value)
 * @param context Optional extra key/value data to attach for debugging
 */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  if (!initialized) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

/**
 * Report a non-exception event worth knowing about.
 */
export function reportMessage(
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, unknown>
): void {
  if (!initialized) return;
  Sentry.captureMessage(message, context ? { level, extra: context } : level);
}

/**
 * Wraps the root App component for automatic error-boundary + navigation
 * breadcrumb tracking. Re-exported here so App.tsx doesn't import the SDK
 * directly either.
 */
export const wrapRootComponent = Sentry.wrap;
