// App initialization with environment validation and error handling

import { validateEnvironment, testConnection } from './envValidator';
import { validateConfiguration, getConfigurationRecommendations } from './configValidator';
import { API_BASE_URL, API_CONFIG } from '../api/envConfig';

/**
 * Initialize the app with proper environment validation
 * Call this on app startup to ensure everything is configured correctly
 */
export async function initializeApp(): Promise<{
  success: boolean;
  apiUrl: string;
  connectivity: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  
  try {
    console.log('🚀 Initializing ParrotSpeak App...');
    
    // Step 1: Validate environment
    const envValidation = validateEnvironment();
    console.log('✅ Environment validation completed');
    
    // Step 2: Validate configuration
    const configValidation = validateConfiguration(API_BASE_URL, API_CONFIG.source);
    if (!configValidation.isValid) {
      errors.push(...configValidation.errors);
    }
    
    // Add configuration warnings to our warnings list
    if (configValidation.warnings.length > 0) {
      console.warn('⚠️ Configuration warnings:', configValidation.warnings);
    }
    
    // Add any errors from config loading
    if (API_CONFIG.errors && API_CONFIG.errors.length > 0) {
      errors.push(...API_CONFIG.errors);
    }
    
    // Step 3: Test API connectivity
    console.log(`🔍 Testing connectivity to: ${API_BASE_URL}`);
    const connectivity = await testConnection(API_BASE_URL);
    
    console.log('🔗 API Configuration:', {
      baseURL: API_CONFIG.baseURL,
      source: API_CONFIG.source,
      environment: API_CONFIG.environment,
      hasEnvVar: API_CONFIG.hasEnvironmentVariable
    });
    
    if (!connectivity.success) {
      errors.push(`API connectivity failed: ${connectivity.error}`);
      console.warn('⚠️ API connectivity issue:', connectivity.error);
      
      // Provide helpful suggestions for connectivity issues
      if (API_CONFIG.isDevelopment && API_BASE_URL.includes('localhost')) {
        errors.push('Local server may not be running. Start the server with: npm run dev');
      }
    } else {
      console.log(`✅ API connected successfully (${connectivity.responseTime}ms)`);
    }
    
    // Step 4: Get configuration recommendations
    const recommendations = getConfigurationRecommendations(configValidation);
    if (recommendations.length > 0) {
      console.log('💡 Configuration recommendations:', recommendations);
    }
    
    // Step 5: Report initialization results
    const success = errors.length === 0;
    
    console.log(success ? '✅ App initialization completed successfully' : '⚠️ App initialization completed with warnings');
    
    return {
      success,
      apiUrl: API_BASE_URL,
      connectivity: connectivity.success,
      errors
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
    errors.push(errorMessage);
    console.error('❌ App initialization failed:', errorMessage);
    
    return {
      success: false,
      apiUrl: API_BASE_URL,
      connectivity: false,
      errors
    };
  }
}

/**
 * Get current app configuration for debugging
 */
export function getAppConfig() {
  return {
    apiConfig: API_CONFIG,
    environment: validateEnvironment(),
    timestamp: new Date().toISOString()
  };
}