import { API_BASE_URL } from "../constants/api";

const requestHeaders = {
  "Content-Type": "application/json",
};

// Utility: Safe fetch with error and timeout handling
async function safeFetch(
  url: string,
  options?: RequestInit,
  timeoutMs = 15000, // 15 seconds default timeout
): Promise<Response | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response;
  } catch (err) {
    clearTimeout(timeout);
    if (err && typeof err === "object" && (err as any).name === "AbortError") {
      console.error(`Request timed out: ${url}`);
    } else {
      console.error(`Network error for ${url}:`, err);
    }
    return null; // Always return null on network errors
  }
}

/**
 * Log out the current user
 */
export async function logout(): Promise<boolean> {
  const response = await safeFetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: requestHeaders,
  });
  if (!response) return false; // network error

  if (!response.ok) {
    console.warn(`Logout failed: ${response.status} ${response.statusText}`);
    return false;
  }
  return true;
}

/**
 * Get current user information
 */
export async function getCurrentUser(): Promise<any | null> {
  const response = await safeFetch(`${API_BASE_URL}/api/auth/user`, {
    headers: requestHeaders,
  });
  if (!response) return null; // network error, treat as unauthenticated

  if (!response.ok) {
    if (response.status === 401) return null; // Unauthenticated (normal)
    console.warn(
      `Failed to get user: ${response.status} ${response.statusText}`,
    );
    return null;
  }

  try {
    return await response.json();
  } catch (e) {
    console.error("Error parsing user JSON:", e);
    return null;
  }
}

/**
 * Login (stub, example real logic)
 */
export async function login(credentials: {
  email: string;
  password: string;
}): Promise<any | null> {
  const response = await safeFetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify(credentials),
  });
  if (!response) return null;
  if (!response.ok) {
    // Optionally handle 401 vs other codes differently
    return null;
  }
  try {
    return await response.json();
  } catch (e) {
    console.error("Error parsing login JSON:", e);
    return null;
  }
}

// Repeat similar for register, Google/Apple login, etc

export async function register(credentials: {
  email: string;
  firstName: string;
  lastName?: string;
  password: string;
}): Promise<any | null> {
  const response = await safeFetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify(credentials),
  });
  if (!response) return null;
  if (!response.ok) {
    return null;
  }
  try {
    return await response.json();
  } catch (e) {
    console.error("Error parsing register JSON:", e);
    return null;
  }
}

export async function loginWithGoogle(): Promise<any | null> {
  // ...Google OAuth flow here
  return null;
}

export async function loginWithApple(): Promise<any | null> {
  // ...Apple OAuth flow here
  return null;
}

export async function validateSession(): Promise<any | null> {
  // ...Validate session logic here
  return null;
}

export function checkSubscriptionAccess(user: any): boolean {
  // TODO: check user.subscription etc
  return !!user && !!user.subscription && user.subscription.active;
}

export function isFeatureProtected(feature: string): boolean {
  // TODO: Real logic based on feature flags/config
  return false;
}
