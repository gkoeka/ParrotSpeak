// Environment configuration with robust error handling and validation

// Default URLs for different environments
const REPLIT_URL = "https://40e9270e-7819-4d9e-8fa8-ccb157c79dd9-00-luj1g8wui2hi.worf.replit.dev";
const LOCALHOST_URL = "http://localhost:5000";

/**
 * Validate and sanitize URL input
 */
function validateUrl(url: string, source: string): { isValid: boolean; url: string; error?: string } {
  if (!url || typeof url !== 'string') {
    return { isValid: false, url: '', error: `Invalid URL from ${source}: empty or non-string value` };
  }
  
  try {
    // Basic URL validation
    const urlObj = new URL(url);
    
    // Ensure protocol is http or https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, url: '', error: `Invalid protocol in ${source}: ${urlObj.protocol}` };
    }
    
    // Return cleaned URL
    return { isValid: true, url: url.trim() };
  } catch (error) {
    return { isValid: false, url: '', error: `Malformed URL from ${source}: ${error.message}` };
  }
}

/**
 * Get API base URL with comprehensive fallback logic and error handling
 * Handles both development and production environments
 */
function getAPIBaseURL(): { url: string; source: string; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check environment variable first
  const envURL = process.env.EXPO_PUBLIC_API_URL;
  if (envURL) {
    const validation = validateUrl(envURL, 'environment variable EXPO_PUBLIC_API_URL');
    if (validation.isValid) {
      console.log('🔗 Using API URL from environment:', validation.url);
      return { url: validation.url, source: 'environment', errors, warnings };
    } else {
      errors.push(validation.error!);
      warnings.push('Environment variable EXPO_PUBLIC_API_URL is invalid, falling back to default');
    }
  }
  
  // Smart fallback logic with environment detection
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isDevelopment) {
    console.log('🔗 Development mode: Using localhost URL');
    return { url: LOCALHOST_URL, source: 'development fallback', errors, warnings };
  } else if (isProduction) {
    console.log('🔗 Production mode: Using Replit URL');
    if (!envURL) {
      warnings.push('Production environment without EXPO_PUBLIC_API_URL set - consider setting for consistency');
    }
    return { url: REPLIT_URL, source: 'production fallback', errors, warnings };
  } else {
    // Unknown environment
    console.log('🔗 Unknown environment: Using Replit URL as safest fallback');
    warnings.push(`Unknown NODE_ENV: ${process.env.NODE_ENV || 'undefined'} - using production fallback`);
    return { url: REPLIT_URL, source: 'unknown environment fallback', errors, warnings };
  }
}

// Get configuration with error handling
const configResult = getAPIBaseURL();

// Export the configured API base URL
const API_BASE_URL = configResult.url;

// Export comprehensive configuration info
const API_CONFIG = {
  baseURL: API_BASE_URL,
  source: configResult.source,
  environment: process.env.NODE_ENV || 'unknown',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  hasEnvironmentVariable: !!process.env.EXPO_PUBLIC_API_URL,
  environmentVariableValue: process.env.EXPO_PUBLIC_API_URL || null,
  errors: configResult.errors,
  warnings: configResult.warnings,
  timestamp: new Date().toISOString(),
  loadTime: Date.now()
};

// Log configuration with error/warning details
console.log('🔗 API Configuration loaded:', {
  baseURL: API_CONFIG.baseURL,
  source: API_CONFIG.source,
  environment: API_CONFIG.environment
});

// Log errors and warnings if any
if (API_CONFIG.errors.length > 0) {
  console.error('❌ Configuration errors:', API_CONFIG.errors);
}
if (API_CONFIG.warnings.length > 0) {
  console.warn('⚠️ Configuration warnings:', API_CONFIG.warnings);
}

// ES module exports for TypeScript compatibility
export { API_BASE_URL, API_CONFIG };