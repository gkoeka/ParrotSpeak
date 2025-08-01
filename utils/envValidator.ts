// Environment validation utilities for development debugging

/**
 * Validate that environment variables are properly loaded
 */
export function validateEnvironment() {
  const checks = {
    hasExpoPublicApiUrl: !!process.env.EXPO_PUBLIC_API_URL,
    expoPublicApiUrlValue: process.env.EXPO_PUBLIC_API_URL || 'undefined',
    nodeEnv: process.env.NODE_ENV || 'undefined',
    isDevMode: __DEV__ || false,
    timestamp: new Date().toISOString()
  };
  
  console.log('🔍 Environment Validation:', checks);
  
  return checks;
}

/**
 * Test network connectivity to a given URL
 */
export async function testConnection(url: string): Promise<{
  success: boolean;
  error?: string;
  responseTime: number;
}> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${url}/api/health`, {
      method: 'GET',
      signal: controller.signal,
      credentials: 'include'
    });
    
    clearTimeout(timeout);
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return { success: true, responseTime };
    } else {
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${response.statusText}`,
        responseTime 
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime
    };
  }
}