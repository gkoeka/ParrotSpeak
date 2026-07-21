/**
 * Thin wrapper around Sentry (backend). Call sites should import from here,
 * not from '@sentry/node' directly — if the crash-reporting vendor ever
 * changes, only this file (and server/instrument.ts) needs to change.
 *
 * No-ops safely if SENTRY_DSN isn't set (Sentry.init wasn't called), so it's
 * always safe to call these regardless of environment.
 */
import * as Sentry from '@sentry/node';

/**
 * Report a caught error to the crash-reporting service.
 * @param error The error object (or unknown caught value)
 * @param context Optional extra key/value data to attach for debugging
 */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

/**
 * Report a non-exception event worth knowing about (e.g. a misconfiguration
 * that causes a request to be rejected, not a thrown error).
 */
export function reportMessage(
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, unknown>
): void {
  Sentry.captureMessage(message, context ? { level, extra: context } : level);
}
