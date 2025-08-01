// Environment configuration with proper error handling and validation
// JavaScript version for maximum compatibility

/**
 * Get API base URL with comprehensive fallback logic
 * Handles both development and production environments
 */
function getAPIBaseURL() {
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
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    console.log('🔗 Development mode: Using localhost with Replit fallback');
    return LOCALHOST_URL;
  } else {
    console.log('🔗 Production mode: Using Replit URL');
    return REPLIT_URL;
  }
}

// Export the configured API base URL
const API_BASE_URL = getAPIBaseURL();

// Export configuration info for debugging
const API_CONFIG = {
  baseURL: API_BASE_URL,
  source: process.env.EXPO_PUBLIC_API_URL ? 'environment' : 'fallback',
  environment: process.env.NODE_ENV === 'development' ? 'development' : 'production',
  timestamp: new Date().toISOString()
};

// Log configuration on import (helpful for debugging)
console.log('🔗 API Configuration loaded:', API_CONFIG);

// Export for both CommonJS and ES modules compatibility
module.exports = { API_BASE_URL, API_CONFIG };
module.exports.API_BASE_URL = API_BASE_URL;
module.exports.API_CONFIG = API_CONFIG;