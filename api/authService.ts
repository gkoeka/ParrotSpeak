import { API_BASE_URL } from "../api/config";
import { SecureStorage } from "../utils/secureStorage";

const requestHeaders = {
  "Content-Type": "application/json",
};

// Get auth headers with token if available
async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await SecureStorage.getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
}

// Utility: Safe fetch with error and timeout handling
async function safeFetch(
  url: string,
  options?: RequestInit,
  timeoutMs = 15000, // 15 seconds default timeout
): Promise<Response | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(url, {
      ...options,
      headers: {
        ...authHeaders,
        ...(options?.headers || {}),
      },
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
  });
  
  // Clear stored auth token on logout regardless of server response
  await SecureStorage.clearAuthData();
  
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
  const response = await safeFetch(`${API_BASE_URL}/api/auth/user`);
  if (!response) return null; // network error, treat as unauthenticated

  if (!response.ok) {
    if (response.status === 401) return null; // Unauthenticated (normal)
    console.warn(
      `Failed to get user: ${response.status} ${response.statusText}`,
    );
    return null;
  }

  try {
    const data = await response.json();
    return data.user || data; // Handle both { user: {...} } and direct user object responses
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
    body: JSON.stringify(credentials),
  });
  if (!response) return null;
  if (!response.ok) {
    // Optionally handle 401 vs other codes differently
    return null;
  }
  try {
    const data = await response.json();
    // Store auth token if provided by server
    if (data.token) {
      await SecureStorage.setAuthToken(data.token);
    }
    return data;
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
    body: JSON.stringify(credentials),
  });
  if (!response) return null;
  if (!response.ok) {
    return null;
  }
  try {
    const data = await response.json();
    // Store auth token if provided by server
    if (data.token) {
      await SecureStorage.setAuthToken(data.token);
    }
    return data;
  } catch (e) {
    console.error("Error parsing register JSON:", e);
    return null;
  }
}

export async function loginWithGoogle(): Promise<any | null> {
  try {
    const response = await safeFetch(`${API_BASE_URL}/api/auth/google/mobile`, {
      method: "POST",
    });
    if (!response) return null;
    if (!response.ok) return null;
    const data = await response.json();
    // Store auth token if provided by server
    if (data.token) {
      await SecureStorage.setAuthToken(data.token);
    }
    return data;
  } catch (e) {
    console.error("Error with Google login:", e);
    return null;
  }
}

export async function loginWithApple(): Promise<any | null> {
  try {
    const response = await safeFetch(`${API_BASE_URL}/api/auth/apple/mobile`, {
      method: "POST",
    });
    if (!response) return null;
    if (!response.ok) return null;
    const data = await response.json();
    // Store auth token if provided by server
    if (data.token) {
      await SecureStorage.setAuthToken(data.token);
    }
    return data;
  } catch (e) {
    console.error("Error with Apple login:", e);
    return null;
  }
}

export async function validateSession(): Promise<any | null> {
  return await getCurrentUser();
}

export async function requestPasswordReset(email: string): Promise<boolean> {
  const response = await safeFetch(`${API_BASE_URL}/api/auth/request-reset`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  if (!response) return false;
  return response.ok;
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const response = await safeFetch(`${API_BASE_URL}/api/auth/reset-password`, {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
  if (!response) return false;
  return response.ok;
}

export function checkSubscriptionAccess(user: any): boolean {
  // TODO: check user.subscription etc
  return !!user && !!user.subscription && user.subscription.active;
}

export function isFeatureProtected(feature: string): boolean {
  // TODO: Real logic based on feature flags/config
  return false;
}
