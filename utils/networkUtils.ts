// Network utilities for mobile development and debugging

import { API_BASE_URL } from '../api/config';

declare const __DEV__: boolean;

/**
 * Test network connectivity to the API server
 */
export async function testNetworkConnectivity(): Promise<{
  success: boolean;
  error?: string;
  responseTime?: number;
}> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      credentials: 'include',
      // Note: timeout option not available in fetch API
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return {
        success: true,
        responseTime
      };
    } else {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        responseTime
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown network error',
      responseTime
    };
  }
}

/**
 * Get current API configuration info for debugging
 */
export function getAPIInfo() {
  return {
    baseUrl: API_BASE_URL,
    isDevelopment: __DEV__,
    timestamp: new Date().toISOString()
  };
}

/**
 * Enhanced fetch with better error handling for mobile
 */
export async function mobileFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Respect a caller-supplied signal/timeout (e.g. recognizeSpeech's 30s, translateText's 20s)
  // instead of silently overriding it — only fall back to our own default when the caller didn't set one.
  const hasOwnSignal = !!options.signal;
  const controller = hasOwnSignal ? null : new AbortController();
  const timeout = hasOwnSignal ? null : setTimeout(() => controller!.abort(), 15000); // 15 second default

  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Important for session-based auth
      signal: hasOwnSignal ? options.signal : controller!.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (timeout) clearTimeout(timeout);
    return response;
  } catch (error) {
    if (timeout) clearTimeout(timeout);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out - check network connection');
      }
      if (error.message.includes('Network request failed')) {
        throw new Error('Cannot connect to server - ensure API server is running');
      }
    }
    
    throw error;
  }
}