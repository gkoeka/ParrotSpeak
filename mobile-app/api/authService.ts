import { API_BASE_URL } from '../constants/api';

// Common options that include credentials for all API requests
const credentialsOption = {
  credentials: 'include' as RequestCredentials
};

/**
 * Log out the current user
 */
export async function logout(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      ...credentialsOption
    });
    
    if (!response.ok) {
      throw new Error(`Failed to logout: ${response.statusText}`);
    }
    
    return;
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
}

/**
 * Get current user information
 */
export async function getCurrentUser(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/user`, credentialsOption);
    
    if (!response.ok) {
      throw new Error(`Failed to get user: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
}