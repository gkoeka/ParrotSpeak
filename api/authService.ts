import { API_BASE_URL } from "../api/config";
import { getAuthToken } from "./authToken";

// Get auth headers — token comes from Clerk via AuthContext
async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getAuthToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
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
