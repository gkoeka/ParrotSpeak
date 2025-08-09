/**
 * Safe wrapper for AppState to handle platform differences
 * Prevents ReferenceError on platforms where AppState might not exist
 */

import { Platform } from 'react-native';

// Import AppState conditionally to avoid errors
let AppState: any;
try {
  AppState = require('react-native').AppState;
} catch {
  AppState = null;
}

type Listener = (state: string) => void;

/**
 * Check if AppState is available on the current platform
 */
export function canUseAppState(): boolean {
  // Only on native, and ensure object + addEventListener exist
  return Platform.OS !== 'web' && !!AppState && typeof AppState?.addEventListener === 'function';
}

/**
 * Safely add an AppState listener
 * Returns a subscription object with a remove() method
 */
export function addAppStateListener(cb: Listener) {
  if (!canUseAppState()) {
    // No-op subscription for platforms without AppState
    return { remove: () => {} };
  }
  
  const sub = AppState.addEventListener('change', cb);
  
  // RN 0.65+: sub has remove(), older RN needs removeEventListener fallback
  return { 
    remove: () => {
      if (sub && typeof sub.remove === 'function') {
        sub.remove();
      } else if (AppState?.removeEventListener) {
        AppState.removeEventListener('change', cb);
      }
    }
  };
}

/**
 * Safely get the current app state
 * Returns null if unavailable
 */
export function getCurrentAppState(): string | null {
  // AppState.currentState can be undefined on some platforms
  try {
    if (!canUseAppState()) return null;
    return AppState?.currentState ?? null;
  } catch {
    return null;
  }
}

/**
 * Check if app is currently in foreground
 */
export function isAppInForeground(): boolean {
  return getCurrentAppState() === 'active';
}