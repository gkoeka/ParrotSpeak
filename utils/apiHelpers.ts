import { SecureStorage } from './secureStorage';
import { API_BASE_URL } from '../config/api';

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

/**
 * Enhanced fetch wrapper with automatic JWT token handling and retry logic
 */
export async function authenticatedFetch(
  url: string, 
  options: FetchOptions = {}
): Promise<Response> {
  const { requireAuth = true, ...fetchOptions } = options;
  
  // Get auth token if required
  let token: string | null = null;
  if (requireAuth) {
    token = await SecureStorage.getAuthToken();
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
  
  // Handle 401 errors by clearing the token
  if (response.status === 401 && requireAuth) {
    console.log('Authentication failed, clearing token');
    await SecureStorage.clearAuthToken();
    await SecureStorage.clearUserData();
  }
  
  return response;
}

/**
 * Parse JWT token to check expiration
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp * 1000; // Convert to milliseconds
    return Date.now() > expiry;
  } catch (error) {
    console.error('Error parsing token:', error);
    return true; // Assume expired if can't parse
  }
}

/**
 * Check and refresh token if needed
 */
export async function validateAndRefreshToken(): Promise<string | null> {
  const token = await SecureStorage.getAuthToken();
  
  if (!token) {
    return null;
  }
  
  // Check if token is expired
  if (isTokenExpired(token)) {
    console.log('Token expired, clearing auth');
    await SecureStorage.clearAuthToken();
    await SecureStorage.clearUserData();
    return null;
  }
  
  return token;
}