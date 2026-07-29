import { getAuthToken } from '../api/authToken';
import { API_BASE_URL } from '../config/api';

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

/**
 * Enhanced fetch wrapper with automatic Clerk token handling
 */
export async function authenticatedFetch(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { requireAuth = true, ...fetchOptions } = options;

  // Get auth token if required
  let token: string | null = null;
  if (requireAuth) {
    token = await getAuthToken();
  }
  
  // Set up headers
  const headers = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Make the request
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include',
  });

  return response;
}