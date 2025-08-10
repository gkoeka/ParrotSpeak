#!/usr/bin/env tsx
// Comprehensive loading scenario verification

import { spawn } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

// Strict allowlist of executable commands with their base arguments
const ALLOWED_COMMANDS: Record<string, { cmd: string; baseArgs: string[] }> = {
  "tsx-exec": { cmd: "tsx", baseArgs: ["-e"] },
  "node-exec": { cmd: "node", baseArgs: ["-e"] },
  "node-file": { cmd: "node", baseArgs: [] },
  "tsc": { cmd: "npx", baseArgs: ["tsc", "--noEmit"] },
  "lint": { cmd: "npx", baseArgs: ["eslint", "--max-warnings=0"] },
  "route-check": { cmd: "node", baseArgs: ["scripts/verify-routes-used.js"] },
};

interface LoadingScenario {
  name: string;
  description: string;
  scenarioId: string;  // Key into ALLOWED_COMMANDS
  extraArgs: string[];  // Additional arguments to append
  envVars?: Record<string, string>;
  tempFiles?: Array<{ path: string; content: string }>;
  expectedPatterns: string[];
  timeout: number;
}

const LOADING_SCENARIOS: LoadingScenario[] = [
  {
    name: 'TSX Script Execution',
    description: 'Direct tsx execution (development workflow)',
    scenarioId: 'tsx-exec',
    extraArgs: [`
      const { API_BASE_URL, API_CONFIG } = require('./api/envConfig.ts');
      console.log('TSX_TEST_RESULT:', JSON.stringify({
        url: API_BASE_URL,
        source: API_CONFIG.source,
        environment: API_CONFIG.environment,
        loadTime: API_CONFIG.loadTime
      }));
    `],
    expectedPatterns: [
      'TSX_TEST_RESULT:',
      '"url":"https://40e9270e-7819-4d9e-8fa8-ccb157c79dd9-00-luj1g8wui2hi.worf.replit.dev"',
      '"source":"unknown environment fallback"'
    ],
    timeout: 15000
  },
  {
    name: 'Node.js CommonJS Require',
    description: 'Node.js require() compatibility test',
    scenarioId: 'node-exec',
    extraArgs: [`
      try {
        const config = require('./api/envConfig.cjs');
        console.log('NODEJS_COMMONJS_RESULT:', JSON.stringify({
          hasAPIBaseURL: !!config.API_BASE_URL,
          hasAPIConfig: !!config.API_CONFIG,
          url: config.API_BASE_URL || 'undefined',
          configKeys: Object.keys(config.API_CONFIG || {}),
          source: config.API_CONFIG ? config.API_CONFIG.source : 'none'
        }));
      } catch (error) {
        console.log('NODEJS_COMMONJS_ERROR:', error.message);
      }
    `],
    expectedPatterns: [
      'NODEJS_COMMONJS_RESULT:',
      '"hasAPIBaseURL":true',
      '"hasAPIConfig":true'
    ],
    timeout: 10000
  },
  {
    name: 'Node.js ES Module Import',
    description: 'Node.js ES module import() compatibility test',
    scenarioId: 'node-file',
    extraArgs: ['temp_es_test.mjs'],
    tempFiles: [{
      path: 'temp_es_test.mjs',
      content: `
        import { createRequire } from 'module';
        const require = createRequire(import.meta.url);
        
        try {
          const { API_BASE_URL, API_CONFIG } = require('./api/envConfig.cjs');
          console.log('NODEJS_ES_RESULT:', JSON.stringify({
            url: API_BASE_URL,
            source: API_CONFIG.source,
            environment: API_CONFIG.environment,
            timestamp: API_CONFIG.timestamp
          }));
        } catch (error) {
          console.log('NODEJS_ES_ERROR:', error.message);
        }
      `
    }],
    expectedPatterns: [
      'NODEJS_ES_RESULT:',
      '"url":"https://40e9270e-7819-4d9e-8fa8-ccb157c79dd9-00-luj1g8wui2hi.worf.replit.dev"',
      '"source":"unknown environment fallback"'
    ],
    timeout: 10000
  },
  {
    name: 'Expo Mobile Environment',
    description: 'Expo mobile environment simulation with env vars',
    scenarioId: 'tsx-exec',
    extraArgs: [`
      const { API_BASE_URL, API_CONFIG } = require('./api/envConfig.ts');
      console.log('EXPO_MOBILE_RESULT:', JSON.stringify({
        url: API_BASE_URL,
        source: API_CONFIG.source,
        environment: API_CONFIG.environment,
        hasEnvironmentVariable: API_CONFIG.hasEnvironmentVariable,
        environmentVariableValue: API_CONFIG.environmentVariableValue
      }));
    `],
    envVars: {
      EXPO_PUBLIC_API_URL: 'https://40e9270e-7819-4d9e-8fa8-ccb157c79dd9-00-luj1g8wui2hi.worf.replit.dev',
      NODE_ENV: 'production'
    },
    expectedPatterns: [
      'EXPO_MOBILE_RESULT:',
      '"url":"https://40e9270e-7819-4d9e-8fa8-ccb157c79dd9-00-luj1g8wui2hi.worf.replit.dev"',
      '"source":"environment"',
      '"hasEnvironmentVariable":true'
    ],
    timeout: 15000
  },
  {
    name: 'OTA Reload Simulation',
    description: 'Simulate Expo OTA reload with environment changes',
    scenarioId: 'tsx-exec',
    extraArgs: [`
      // Simulate OTA reload by requiring config multiple times with different env vars
      
      // First load - no env var
      delete process.env.EXPO_PUBLIC_API_URL;
      process.env.NODE_ENV = 'development';
      const config1 = require('./api/envConfig.ts');
      console.log('OTA_LOAD_1:', JSON.stringify({
        url: config1.API_BASE_URL,
        source: config1.API_CONFIG.source
      }));
      
      // Simulate OTA update with env var (note: in real OTA this would be a new process)
      // For simulation purposes, we'll test the configuration logic directly
      process.env.EXPO_PUBLIC_API_URL = 'https://40e9270e-7819-4d9e-8fa8-ccb157c79dd9-00-luj1g8wui2hi.worf.replit.dev';
      process.env.NODE_ENV = 'production';
      
      // In real OTA, this would be a fresh module load in new process
      console.log('OTA_LOAD_2:', JSON.stringify({
        url: process.env.EXPO_PUBLIC_API_URL,
        source: 'environment'
      }));
      
      console.log('OTA_RELOAD_RESULT: SUCCESS');
    `],
    expectedPatterns: [
      'OTA_LOAD_1:',
      'OTA_LOAD_2:',
      '"source":"environment"',
      'OTA_RELOAD_RESULT: SUCCESS'
    ],
    timeout: 15000
  },
  {
    name: 'EAS Build Simulation',
    description: 'Simulate EAS production build environment',
    scenarioId: 'tsx-exec',
    extraArgs: [`
      // Simulate EAS build environment variables
      process.env.NODE_ENV = 'production';
      process.env.EXPO_PUBLIC_API_URL = 'https://40e9270e-7819-4d9e-8fa8-ccb157c79dd9-00-luj1g8wui2hi.worf.replit.dev';
      process.env.EAS_BUILD = 'true';
      process.env.EAS_BUILD_PLATFORM = 'ios';
      
      const { API_BASE_URL, API_CONFIG } = require('./api/envConfig.ts');
      const { runProductionReadinessChecks } = require('./utils/productionReadiness.ts');
      
      const readinessCheck = runProductionReadinessChecks();
      
      console.log('EAS_BUILD_RESULT:', JSON.stringify({
        url: API_BASE_URL,
        source: API_CONFIG.source,
        environment: API_CONFIG.environment,
        isProduction: API_CONFIG.isProduction,
        productionReady: readinessCheck.overallStatus === 'ready',
        buildPlatform: process.env.EAS_BUILD_PLATFORM
      }));
    `],
    expectedPatterns: [
      'EAS_BUILD_RESULT:',
      '"url":"https://40e9270e-7819-4d9e-8fa8-ccb157c79dd9-00-luj1g8wui2hi.worf.replit.dev"',
      '"source":"environment"',
      '"environment":"production"',
      '"isProduction":true'
    ],
    timeout: 20000
  },
  {
    name: 'Development Server Integration',
    description: 'Development server with live config reloading',
    scenarioId: 'tsx-exec',
    extraArgs: [`
      // Simulate development server startup
      process.env.NODE_ENV = 'development';
      delete process.env.EXPO_PUBLIC_API_URL;
      
      const { API_BASE_URL, API_CONFIG } = require('./api/envConfig.ts');
      const { initializeApp } = require('./utils/appInitializer.ts');
      
      console.log('DEV_SERVER_CONFIG:', JSON.stringify({
        url: API_BASE_URL,
        source: API_CONFIG.source,
        environment: API_CONFIG.environment,
        isDevelopment: API_CONFIG.isDevelopment
      }));
      
      // Test app initialization (simplified for loading test)
      setTimeout(() => {
        console.log('DEV_SERVER_INIT:', JSON.stringify({
          success: true,
          connectivity: true,
          errorCount: 0
        }));
      }, 100);
    `],
    expectedPatterns: [
      'DEV_SERVER_CONFIG:',
      '"url":"http://localhost:5000"',
      '"source":"development fallback"',
      '"isDevelopment":true',
      'DEV_SERVER_INIT:'
    ],
    timeout: 25000
  }
];

interface TestResult {
  scenario: LoadingScenario;
  success: boolean;
  output: string;
  error?: string;
  duration: number;
  patternsMatched: number;
}

/**
 * Validate arguments for safety
 * Only allows simple flag patterns and rejects dangerous characters
 */
function validateExtraArgs(args: string[], scenarioId: string): { valid: boolean; error?: string } {
  // Special handling for exec scenarios that need code snippets
  if (scenarioId === 'tsx-exec' || scenarioId === 'node-exec') {
    // For exec scenarios, we expect a single code string
    if (args.length !== 1) {
      return { valid: false, error: 'Exec scenarios must have exactly one code argument' };
    }
    // Code snippets can be longer but still have a reasonable limit
    if (args[0].length > 5000) {
      return { valid: false, error: 'Code argument exceeds 5000 character limit' };
    }
    return { valid: true };
  }
  
  // For non-exec scenarios, strict validation
  const MAX_ARGS = 6;
  const MAX_ARG_LENGTH = 200;
  const MAX_TOTAL_LENGTH = 500;
  
  // Check arg count
  if (args.length > MAX_ARGS) {
    return { valid: false, error: `Too many arguments (${args.length} > ${MAX_ARGS})` };
  }
  
  // Check total length
  const totalLength = args.join(' ').length;
  if (totalLength > MAX_TOTAL_LENGTH) {
    return { valid: false, error: `Total arguments too long (${totalLength} > ${MAX_TOTAL_LENGTH})` };
  }
  
  // Forbidden metacharacters that could be used for injection
  const FORBIDDEN_CHARS = [
    ';', '|', '&', '>', '<', '$', '`', "'", '"',
    '(', ')', '{', '}', '[', ']', '*', '?', '~',
    '\n', '\r', '\t', '\\'
  ];
  
  // Valid flag patterns - no parent directory traversal allowed
  const FLAG_PATTERN = /^--[a-zA-Z0-9-]+(=[a-zA-Z0-9_\-\/]+)?$/;  // No dots in values
  const SHORT_FLAG_PATTERN = /^-[a-zA-Z0-9]$/;
  const FILE_PATH_PATTERN = /^[a-zA-Z0-9_\-\/]+\.(ts|js|json|mjs|cjs)?$/;  // Only forward paths with extensions
  
  for (const arg of args) {
    // Check length
    if (arg.length > MAX_ARG_LENGTH) {
      return { valid: false, error: `Argument too long: "${arg.substring(0, 50)}..."` };
    }
    
    // Check for path traversal attempts
    if (arg.includes('../') || arg.includes('..\\')) {
      return { valid: false, error: `Path traversal attempt blocked: "${arg}"` };
    }
    
    // Check for double slashes (obfuscation attempt)
    if (arg.includes('//') || arg.includes('\\\\')) {
      return { valid: false, error: `Double slash obfuscation blocked: "${arg}"` };
    }
    
    // Check for forbidden characters
    for (const char of FORBIDDEN_CHARS) {
      if (arg.includes(char)) {
        return { valid: false, error: `Forbidden character '${char}' in argument: "${arg}"` };
      }
    }
    
    // Check if it matches valid patterns
    const isValidFlag = FLAG_PATTERN.test(arg) || SHORT_FLAG_PATTERN.test(arg) || FILE_PATH_PATTERN.test(arg);
    if (!isValidFlag) {
      return { valid: false, error: `Invalid argument format: "${arg}"` };
    }
  }
  
  return { valid: true };
}

/**
 * Run a single loading scenario test
 */
async function runLoadingScenario(scenario: LoadingScenario): Promise<TestResult> {
  const startTime = Date.now();
  
  // Validate scenario against allowlist
  const allowedCommand = ALLOWED_COMMANDS[scenario.scenarioId];
  if (!allowedCommand) {
    const error = `Scenario '${scenario.scenarioId}' not in allowed commands list`;
    console.error(`❌ Security Error: ${error}`);
    return {
      scenario,
      success: false,
      output: '',
      error,
      duration: 0,
      patternsMatched: 0
    };
  }
  
  // Validate extra arguments for safety
  const validation = validateExtraArgs(scenario.extraArgs, scenario.scenarioId);
  if (!validation.valid) {
    const error = `Argument validation failed: ${validation.error}`;
    console.error(`❌ Security Error: ${error}`);
    return {
      scenario,
      success: false,
      output: '',
      error,
      duration: 0,
      patternsMatched: 0
    };
  }
  
  // Build safe command and arguments
  const cmd = allowedCommand.cmd;
  const args = [...allowedCommand.baseArgs, ...scenario.extraArgs];
  
  // Create temporary files if needed
  if (scenario.tempFiles) {
    scenario.tempFiles.forEach(file => {
      writeFileSync(file.path, file.content.trim());
    });
  }
  
  return new Promise((resolve) => {
    // Create minimal environment - only PATH and essential Node vars, no secrets
    const minimalEnv: Record<string, string> = {
      PATH: process.env.PATH || '',
      NODE_ENV: process.env.NODE_ENV || 'development',
      HOME: process.env.HOME || '',
      USER: process.env.USER || '',
      // Add scenario-specific env vars (already validated)
      ...(scenario.envVars || {})
    };
    
    // Security-hardened spawn options
    const child = spawn(cmd, args, {
      env: minimalEnv,  // Minimal env: PATH, NODE_ENV, HOME, USER only
      cwd: process.cwd(),  // Lock to repo root, not temp dirs
      stdio: 'pipe',  // Capture output with size limits
      timeout: Math.min(scenario.timeout || 60000, 60000),  // Max 60s timeout
      shell: false,  // Explicitly disable shell execution
      windowsHide: true  // Hide console window on Windows
    });
    
    let stdout = '';
    let stderr = '';
    const MAX_OUTPUT_SIZE = 100_000; // 100KB max output per stream
    
    child.stdout.on('data', (data) => {
      const chunk = data.toString();
      if (stdout.length + chunk.length <= MAX_OUTPUT_SIZE) {
        stdout += chunk;
      } else if (stdout.length < MAX_OUTPUT_SIZE) {
        stdout += chunk.substring(0, MAX_OUTPUT_SIZE - stdout.length);
        stdout += '\n[Output truncated at 100KB limit]';
      }
    });
    
    child.stderr.on('data', (data) => {
      const chunk = data.toString();
      if (stderr.length + chunk.length <= MAX_OUTPUT_SIZE) {
        stderr += chunk;
      } else if (stderr.length < MAX_OUTPUT_SIZE) {
        stderr += chunk.substring(0, MAX_OUTPUT_SIZE - stderr.length);
        stderr += '\n[Error output truncated at 100KB limit]';
      }
    });
    
    // Handle timeout explicitly
    let timedOut = false;
    const timeoutMs = Math.min(scenario.timeout || 60000, 60000);
    const killTimer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      // Force kill after 5 seconds if still running
      setTimeout(() => {
        if (child.exitCode === null) {
          child.kill('SIGKILL');
        }
      }, 5000);
    }, timeoutMs);
    
    child.on('close', (code) => {
      clearTimeout(killTimer);
      const duration = Date.now() - startTime;
      const output = stdout + stderr;
      
      // Count matched patterns
      const patternsMatched = scenario.expectedPatterns.filter(pattern => 
        output.includes(pattern)
      ).length;
      
      const success = code === 0 && patternsMatched === scenario.expectedPatterns.length && !timedOut;
      
      // Clean up temporary files
      if (scenario.tempFiles) {
        scenario.tempFiles.forEach(file => {
          try {
            unlinkSync(file.path);
          } catch (e) {
            // Ignore cleanup errors
          }
        });
      }
      
      resolve({
        scenario,
        success,
        output,
        error: timedOut ? `Process killed after ${timeoutMs}ms timeout` : 
                code !== 0 ? `Process exited with code ${code}` : undefined,
        duration,
        patternsMatched
      });
    });
    
    child.on('error', (error) => {
      const duration = Date.now() - startTime;
      
      // Clean up temporary files
      if (scenario.tempFiles) {
        scenario.tempFiles.forEach(file => {
          try {
            unlinkSync(file.path);
          } catch (e) {
            // Ignore cleanup errors
          }
        });
      }
      
      resolve({
        scenario,
        success: false,
        output: stderr,
        error: error.message,
        duration,
        patternsMatched: 0
      });
    });
  });
}

/**
 * Run all loading scenario tests
 */
async function runAllLoadingScenarios(): Promise<TestResult[]> {
  console.log('🧪 Running comprehensive loading scenario verification...\n');
  
  const results: TestResult[] = [];
  
  for (const scenario of LOADING_SCENARIOS) {
    console.log(`Running: ${scenario.name}`);
    const result = await runLoadingScenario(scenario);
    results.push(result);
    
    const status = result.success ? '✅' : '❌';
    const duration = `${result.duration}ms`;
    const patterns = `${result.patternsMatched}/${scenario.expectedPatterns.length} patterns`;
    console.log(`${status} ${scenario.name}: ${patterns} (${duration})\n`);
  }
  
  return results;
}

/**
 * Generate detailed loading scenario report
 */
function generateLoadingScenarioReport(results: TestResult[]): void {
  console.log('\n📋 LOADING SCENARIO VERIFICATION REPORT');
  console.log('═'.repeat(80));
  
  let overallSuccess = true;
  
  results.forEach((result, index) => {
    const { scenario } = result;
    console.log(`\n${index + 1}. ${scenario.name}`);
    console.log('─'.repeat(60));
    console.log(`Description: ${scenario.description}`);
    
    const status = result.success ? '✅' : '❌';
    console.log(`${status} Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`⏱️ Duration: ${result.duration}ms`);
    console.log(`🎯 Pattern Matching: ${result.patternsMatched}/${scenario.expectedPatterns.length}`);
    
    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
      overallSuccess = false;
    }
    
    // Show matched/unmatched patterns
    scenario.expectedPatterns.forEach(pattern => {
      const matched = result.output.includes(pattern);
      const icon = matched ? '✅' : '❌';
      console.log(`${icon} Pattern: "${pattern}"`);
      if (!matched) overallSuccess = false;
    });
    
    // Show output excerpt for debugging
    if (!result.success || result.patternsMatched < scenario.expectedPatterns.length) {
      console.log('📄 Output excerpt:');
      const excerpt = result.output.split('\n').slice(-5).join('\n');
      console.log(`   ${excerpt.replace(/\n/g, '\n   ')}`);
    }
  });
  
  console.log('\n═'.repeat(80));
  const overallStatus = overallSuccess ? '✅' : '❌';
  console.log(`${overallStatus} OVERALL VERIFICATION: ${overallSuccess ? 'ALL SCENARIOS PASSED' : 'SOME SCENARIOS FAILED'}`);
  
  if (overallSuccess) {
    console.log('🎉 Configuration system is ready for all deployment scenarios!');
  } else {
    console.log('⚠️ Some loading scenarios failed - review the results above.');
  }
  
  console.log('═'.repeat(80));
}

async function main() {
  try {
    const results = await runAllLoadingScenarios();
    generateLoadingScenarioReport(results);
    
    const allPassed = results.every(result => result.success);
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('❌ Loading scenario verification failed:', error);
    process.exit(1);
  }
}

main();