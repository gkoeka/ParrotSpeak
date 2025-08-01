// App initialization with environment validation and error handling

import { validateEnvironment, testConnection } from './envValidator';
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
    
    // Step 2: Test API connectivity
    console.log(`🔍 Testing connectivity to: ${API_BASE_URL}`);
    const connectivity = await testConnection(API_BASE_URL);
    
    console.log('🔗 API Configuration:', API_CONFIG);
    console.log('🌐 Connectivity test:', connectivity);
    
    if (!connectivity.success) {
      errors.push(`API connectivity failed: ${connectivity.error}`);
      console.warn('⚠️ API connectivity issue:', connectivity.error);
    } else {
      console.log(`✅ API connected successfully (${connectivity.responseTime}ms)`);
    }
    
    // Step 3: Report initialization results
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