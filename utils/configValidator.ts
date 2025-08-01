// Configuration validation and error handling utilities

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: {
    apiUrl: string;
    source: string;
    isProduction: boolean;
    hasEnvironmentVariable: boolean;
  };
}

/**
 * Validate API URL format and accessibility
 */
export function validateApiUrl(url: string): { isValid: boolean; error?: string } {
  if (!url) {
    return { isValid: false, error: 'API URL is empty or undefined' };
  }

  try {
    const urlObj = new URL(url);
    
    // Check protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: `Invalid protocol: ${urlObj.protocol}. Must be http: or https:` };
    }
    
    // Check if it's localhost in production
    if (process.env.NODE_ENV === 'production' && urlObj.hostname === 'localhost') {
      return { isValid: false, error: 'Localhost URL detected in production environment' };
    }
    
    // Check for valid hostname
    if (!urlObj.hostname || urlObj.hostname === '') {
      return { isValid: false, error: 'Invalid hostname in URL' };
    }
    
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: `Invalid URL format: ${error.message}` };
  }
}

/**
 * Comprehensive configuration validation
 */
export function validateConfiguration(apiUrl: string, source: string): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate API URL
  const urlValidation = validateApiUrl(apiUrl);
  if (!urlValidation.isValid) {
    errors.push(`API URL validation failed: ${urlValidation.error}`);
  }
  
  // Check environment configuration
  const hasEnvVar = !!process.env.EXPO_PUBLIC_API_URL;
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Production environment checks
  if (isProduction) {
    if (!hasEnvVar) {
      warnings.push('Production environment detected but EXPO_PUBLIC_API_URL not set');
    }
    
    if (source === 'fallback') {
      warnings.push('Production environment using fallback URL instead of environment variable');
    }
  }
  
  // Development environment checks
  if (!isProduction && hasEnvVar) {
    const envUrl = process.env.EXPO_PUBLIC_API_URL;
    if (envUrl && envUrl.includes('localhost')) {
      warnings.push('Development environment using localhost URL - ensure server is running');
    }
  }
  
  // URL accessibility warnings
  if (apiUrl.includes('replit.dev') && source === 'fallback') {
    warnings.push('Using Replit fallback URL - consider setting EXPO_PUBLIC_API_URL for consistency');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config: {
      apiUrl,
      source,
      isProduction,
      hasEnvironmentVariable: hasEnvVar
    }
  };
}

/**
 * Get environment-specific recommendations
 */
export function getConfigurationRecommendations(validation: ConfigValidationResult): string[] {
  const recommendations: string[] = [];
  
  if (validation.config.isProduction && !validation.config.hasEnvironmentVariable) {
    recommendations.push('Set EXPO_PUBLIC_API_URL environment variable for production deployment');
  }
  
  if (!validation.config.isProduction && validation.config.source === 'environment') {
    recommendations.push('Consider commenting out EXPO_PUBLIC_API_URL in .env.local for local development');
  }
  
  if (validation.warnings.length > 0) {
    recommendations.push('Review configuration warnings for potential improvements');
  }
  
  return recommendations;
}