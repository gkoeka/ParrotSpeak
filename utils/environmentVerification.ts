// Comprehensive environment verification testing

import { spawn } from 'child_process';
import { promisify } from 'util';

export interface EnvironmentTest {
  name: string;
  description: string;
  envVars: Record<string, string | undefined>;
  expectedUrl: string;
  expectedSource: string;
  expectedEnvironment: string;
  shouldHaveWarnings: boolean;
  shouldHaveErrors: boolean;
}

export interface TestResult {
  test: EnvironmentTest;
  success: boolean;
  actualUrl: string;
  actualSource: string;
  actualEnvironment: string;
  errors: string[];
  warnings: string[];
  healthCheck: {
    success: boolean;
    status?: number;
    responseTime?: number;
    error?: string;
  };
  authCheck: {
    success: boolean;
    status?: number;
    responseTime?: number;
    error?: string;
  };
}

const TEST_SCENARIOS: EnvironmentTest[] = [
  {
    name: 'Expo Mobile Environment',
    description: 'Production mode with EXPO_PUBLIC_API_URL set (typical mobile deployment)',
    envVars: {
      EXPO_PUBLIC_API_URL: 'https://40e9270e-7819-4d9e-8fa8-ccb157c79dd9-00-luj1g8wui2hi.worf.replit.dev',
      NODE_ENV: 'production'
    },
    expectedUrl: 'https://40e9270e-7819-4d9e-8fa8-ccb157c79dd9-00-luj1g8wui2hi.worf.replit.dev',
    expectedSource: 'environment',
    expectedEnvironment: 'production',
    shouldHaveWarnings: false,
    shouldHaveErrors: false
  },
  {
    name: 'Local Development Environment',
    description: 'Development mode without env var (typical local development)',
    envVars: {
      EXPO_PUBLIC_API_URL: undefined,
      NODE_ENV: 'development'
    },
    expectedUrl: 'http://localhost:5000',
    expectedSource: 'development fallback',
    expectedEnvironment: 'development',
    shouldHaveWarnings: false,
    shouldHaveErrors: false
  },
  {
    name: 'Production Fallback Environment',
    description: 'Production mode without env var (production fallback)',
    envVars: {
      EXPO_PUBLIC_API_URL: undefined,
      NODE_ENV: 'production'
    },
    expectedUrl: 'https://40e9270e-7819-4d9e-8fa8-ccb157c79dd9-00-luj1g8wui2hi.worf.replit.dev',
    expectedSource: 'production fallback',
    expectedEnvironment: 'production',
    shouldHaveWarnings: true, // Should warn about missing env var in production
    shouldHaveErrors: false
  },
  {
    name: 'Unknown Environment Fallback',
    description: 'Unknown NODE_ENV (safest fallback behavior)',
    envVars: {
      EXPO_PUBLIC_API_URL: undefined,
      NODE_ENV: undefined
    },
    expectedUrl: 'https://40e9270e-7819-4d9e-8fa8-ccb157c79dd9-00-luj1g8wui2hi.worf.replit.dev',
    expectedSource: 'unknown environment fallback',
    expectedEnvironment: 'unknown',
    shouldHaveWarnings: true, // Should warn about unknown NODE_ENV
    shouldHaveErrors: false
  },
  {
    name: 'Invalid Environment Variable',
    description: 'Invalid EXPO_PUBLIC_API_URL (should fallback gracefully)',
    envVars: {
      EXPO_PUBLIC_API_URL: 'invalid-url-format',
      NODE_ENV: 'production'
    },
    expectedUrl: 'https://40e9270e-7819-4d9e-8fa8-ccb157c79dd9-00-luj1g8wui2hi.worf.replit.dev',
    expectedSource: 'production fallback',
    expectedEnvironment: 'production',
    shouldHaveWarnings: true, // Should warn about invalid env var
    shouldHaveErrors: true // Should error about malformed URL
  }
];

/**
 * Test API endpoint with specific URL
 */
async function testApiEndpoint(url: string, endpoint: string): Promise<{
  success: boolean;
  status?: number;
  responseTime?: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${url}${endpoint}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      success: response.ok,
      status: response.status,
      responseTime
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Run configuration test in isolated environment
 */
async function runConfigTest(test: EnvironmentTest): Promise<TestResult> {
  return new Promise((resolve) => {
    // Prepare environment variables
    const env = { ...process.env };
    
    // Set test environment variables
    Object.entries(test.envVars).forEach(([key, value]) => {
      if (value === undefined) {
        delete env[key];
      } else {
        env[key] = value;
      }
    });
    
    // Create test script
    const testScript = `
      const { API_BASE_URL, API_CONFIG } = require('./api/envConfig.ts');
      console.log(JSON.stringify({
        url: API_BASE_URL,
        source: API_CONFIG.source,
        environment: API_CONFIG.environment,
        errors: API_CONFIG.errors || [],
        warnings: API_CONFIG.warnings || []
      }));
    `;
    
    const child = spawn('tsx', ['-e', testScript], {
      env,
      stdio: 'pipe'
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', async (code) => {
      try {
        // Parse the last JSON line from stdout (ignore console.log messages)
        const lines = stdout.trim().split('\n');
        const jsonLine = lines[lines.length - 1];
        const config = JSON.parse(jsonLine);
        
        // Test API endpoints
        const healthCheck = await testApiEndpoint(config.url, '/api/health');
        const authCheck = await testApiEndpoint(config.url, '/api/auth/user');
        
        resolve({
          test,
          success: code === 0,
          actualUrl: config.url,
          actualSource: config.source,
          actualEnvironment: config.environment,
          errors: config.errors,
          warnings: config.warnings,
          healthCheck,
          authCheck
        });
      } catch (error) {
        resolve({
          test,
          success: false,
          actualUrl: 'unknown',
          actualSource: 'unknown',
          actualEnvironment: 'unknown',
          errors: [`Failed to parse config: ${error.message}`],
          warnings: [],
          healthCheck: { success: false, error: 'Config test failed' },
          authCheck: { success: false, error: 'Config test failed' }
        });
      }
    });
  });
}

/**
 * Run all environment verification tests
 */
export async function runAllEnvironmentTests(): Promise<TestResult[]> {
  console.log('🧪 Running comprehensive environment verification tests...\n');
  
  const results: TestResult[] = [];
  
  for (const test of TEST_SCENARIOS) {
    console.log(`Running: ${test.name}`);
    const result = await runConfigTest(test);
    results.push(result);
    
    // Brief result summary
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${test.name}: ${result.actualUrl} (${result.actualSource})\n`);
  }
  
  return results;
}

/**
 * Generate detailed verification report
 */
export function generateVerificationReport(results: TestResult[]): void {
  console.log('\n📋 ENVIRONMENT VERIFICATION REPORT');
  console.log('═'.repeat(80));
  
  let overallSuccess = true;
  
  results.forEach((result, index) => {
    const { test } = result;
    console.log(`\n${index + 1}. ${test.name}`);
    console.log('─'.repeat(60));
    console.log(`Description: ${test.description}`);
    
    // Configuration verification
    const configStatus = result.success ? '✅' : '❌';
    console.log(`${configStatus} Configuration Loading: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    
    // URL verification
    const urlMatch = result.actualUrl === test.expectedUrl;
    const urlStatus = urlMatch ? '✅' : '❌';
    console.log(`${urlStatus} URL Resolution: ${result.actualUrl}`);
    if (!urlMatch) {
      console.log(`   Expected: ${test.expectedUrl}`);
      overallSuccess = false;
    }
    
    // Source verification
    const sourceMatch = result.actualSource === test.expectedSource;
    const sourceStatus = sourceMatch ? '✅' : '❌';
    console.log(`${sourceStatus} Source: ${result.actualSource}`);
    if (!sourceMatch) {
      console.log(`   Expected: ${test.expectedSource}`);
      overallSuccess = false;
    }
    
    // Environment verification
    const envMatch = result.actualEnvironment === test.expectedEnvironment;
    const envStatus = envMatch ? '✅' : '❌';
    console.log(`${envStatus} Environment: ${result.actualEnvironment}`);
    if (!envMatch) {
      console.log(`   Expected: ${test.expectedEnvironment}`);
      overallSuccess = false;
    }
    
    // Health check verification
    const healthStatus = result.healthCheck.success ? '✅' : '❌';
    console.log(`${healthStatus} /api/health: ${result.healthCheck.success ? 'SUCCESS' : 'FAILED'}`);
    if (result.healthCheck.success) {
      console.log(`   Status: ${result.healthCheck.status}, Time: ${result.healthCheck.responseTime}ms`);
    } else {
      console.log(`   Error: ${result.healthCheck.error}`);
      if (!result.actualUrl.includes('localhost')) { // Don't fail overall for localhost issues
        overallSuccess = false;
      }
    }
    
    // Auth check verification
    const authStatus = result.authCheck.success ? '✅' : result.authCheck.status === 401 ? '⚠️' : '❌';
    console.log(`${authStatus} /api/auth/user: ${result.authCheck.status === 401 ? 'UNAUTHORIZED (EXPECTED)' : result.authCheck.success ? 'SUCCESS' : 'FAILED'}`);
    if (result.authCheck.success || result.authCheck.status === 401) {
      console.log(`   Status: ${result.authCheck.status}, Time: ${result.authCheck.responseTime}ms`);
    } else {
      console.log(`   Error: ${result.authCheck.error}`);
      if (!result.actualUrl.includes('localhost')) { // Don't fail overall for localhost issues
        overallSuccess = false;
      }
    }
    
    // Error/Warning verification
    const hasExpectedErrors = test.shouldHaveErrors === (result.errors.length > 0);
    const hasExpectedWarnings = test.shouldHaveWarnings === (result.warnings.length > 0);
    
    const errorStatus = hasExpectedErrors ? '✅' : '❌';
    console.log(`${errorStatus} Errors: ${result.errors.length} (expected: ${test.shouldHaveErrors ? 'yes' : 'no'})`);
    if (result.errors.length > 0) {
      result.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    const warningStatus = hasExpectedWarnings ? '✅' : '❌';
    console.log(`${warningStatus} Warnings: ${result.warnings.length} (expected: ${test.shouldHaveWarnings ? 'yes' : 'no'})`);
    if (result.warnings.length > 0) {
      result.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    if (!hasExpectedErrors || !hasExpectedWarnings) {
      overallSuccess = false;
    }
  });
  
  console.log('\n═'.repeat(80));
  const overallStatus = overallSuccess ? '✅' : '❌';
  console.log(`${overallStatus} OVERALL VERIFICATION: ${overallSuccess ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  console.log('═'.repeat(80));
}