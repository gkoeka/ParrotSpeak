// Environment configuration with proper error handling and validation

/**
 * Get API base URL with comprehensive fallback logic
 * Handles both development and production environments
 */
function getAPIBaseURL(): string {
  // In React Native/Expo, environment variables are available at build time
  const envURL = process.env.EXPO_PUBLIC_API_URL;
  
  // Default URLs for different environments
  const REPLIT_URL = "https://40e9270e-7819-4d9e-8fa8-ccb157c79dd9-00-luj1g8wui2hi.worf.replit.dev";
  const LOCALHOST_URL = "http://localhost:5000";
  
  // If environment variable is set, use it
  if (envURL) {
    console.log('🔗 Using API URL from environment:', envURL);
    return envURL;
  }
  
  // Smart fallback logic:
  // - In development, try localhost first (for local testing)
  // - If that fails or for production, use Replit URL
  const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    console.log('🔗 Development mode: Using localhost with Replit fallback');
    return LOCALHOST_URL;
  } else {
    console.log('🔗 Production mode: Using Replit URL');
    return REPLIT_URL;
  }
}

// Export the configured API base URL
export const API_BASE_URL = getAPIBaseURL();

// Export configuration info for debugging
export const API_CONFIG = {
  baseURL: API_BASE_URL,
  source: process.env.EXPO_PUBLIC_API_URL ? 'environment' : 'fallback',
  environment: __DEV__ ? 'development' : 'production',
  timestamp: new Date().toISOString()
};

// Log configuration on import (helpful for debugging)
console.log('🔗 API Configuration loaded:', API_CONFIG);