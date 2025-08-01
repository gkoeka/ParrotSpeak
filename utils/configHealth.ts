// Configuration health monitoring and diagnostics

import { API_BASE_URL, API_CONFIG } from '../api/envConfig';
import { validateConfiguration } from './configValidator';
import { runProductionReadinessChecks } from './productionReadiness';
import { testConnection } from './envValidator';

export interface ConfigHealthReport {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  apiUrl: string;
  connectivity: {
    status: 'connected' | 'failed';
    responseTime?: number;
    error?: string;
  };
  configuration: {
    status: 'valid' | 'invalid';
    source: string;
    environment: string;
    errors: string[];
    warnings: string[];
  };
  production: {
    ready: boolean;
    issues: number;
    recommendations: string[];
  };
}

/**
 * Generate comprehensive configuration health report
 */
export async function generateConfigHealthReport(): Promise<ConfigHealthReport> {
  const timestamp = new Date().toISOString();
  
  // Test connectivity
  const connectivityTest = await testConnection(API_BASE_URL);
  
  // Validate configuration
  const configValidation = validateConfiguration(API_BASE_URL, API_CONFIG.source);
  
  // Check production readiness
  const productionCheck = runProductionReadinessChecks();
  
  // Determine overall health
  let overall: 'healthy' | 'degraded' | 'unhealthy';
  
  if (!connectivityTest.success || !configValidation.isValid) {
    overall = 'unhealthy';
  } else if (configValidation.warnings.length > 0 || productionCheck.summary.warnings > 0) {
    overall = 'degraded';
  } else {
    overall = 'healthy';
  }
  
  return {
    overall,
    timestamp,
    apiUrl: API_BASE_URL,
    connectivity: {
      status: connectivityTest.success ? 'connected' : 'failed',
      responseTime: connectivityTest.responseTime,
      error: connectivityTest.error
    },
    configuration: {
      status: configValidation.isValid ? 'valid' : 'invalid',
      source: API_CONFIG.source,
      environment: API_CONFIG.environment,
      errors: [...(API_CONFIG.errors || []), ...configValidation.errors],
      warnings: [...(API_CONFIG.warnings || []), ...configValidation.warnings]
    },
    production: {
      ready: productionCheck.overallStatus === 'ready',
      issues: productionCheck.summary.warnings + productionCheck.summary.failed,
      recommendations: productionCheck.checks
        .filter(check => check.recommendation)
        .map(check => check.recommendation!)
    }
  };
}

/**
 * Log configuration health report in a user-friendly format
 */
export function logConfigHealthReport(report: ConfigHealthReport): void {
  const statusIcon = report.overall === 'healthy' ? '✅' : 
                     report.overall === 'degraded' ? '⚠️' : '❌';
  
  console.log(`\n${statusIcon} Configuration Health: ${report.overall.toUpperCase()}`);
  console.log('─'.repeat(60));
  
  // API connectivity
  const connIcon = report.connectivity.status === 'connected' ? '✅' : '❌';
  console.log(`${connIcon} API Connectivity: ${report.connectivity.status}`);
  if (report.connectivity.responseTime) {
    console.log(`   Response time: ${report.connectivity.responseTime}ms`);
  }
  if (report.connectivity.error) {
    console.log(`   Error: ${report.connectivity.error}`);
  }
  
  // Configuration status
  const configIcon = report.configuration.status === 'valid' ? '✅' : '❌';
  console.log(`${configIcon} Configuration: ${report.configuration.status}`);
  console.log(`   URL: ${report.apiUrl}`);
  console.log(`   Source: ${report.configuration.source}`);
  console.log(`   Environment: ${report.configuration.environment}`);
  
  // Errors and warnings
  if (report.configuration.errors.length > 0) {
    console.log('   ❌ Errors:');
    report.configuration.errors.forEach(error => console.log(`      - ${error}`));
  }
  
  if (report.configuration.warnings.length > 0) {
    console.log('   ⚠️ Warnings:');
    report.configuration.warnings.forEach(warning => console.log(`      - ${warning}`));
  }
  
  // Production readiness
  const prodIcon = report.production.ready ? '✅' : '⚠️';
  console.log(`${prodIcon} Production Ready: ${report.production.ready ? 'Yes' : 'No'}`);
  if (report.production.issues > 0) {
    console.log(`   Issues to address: ${report.production.issues}`);
  }
  
  // Recommendations
  if (report.production.recommendations.length > 0) {
    console.log('   💡 Recommendations:');
    report.production.recommendations.forEach(rec => console.log(`      - ${rec}`));
  }
  
  console.log('─'.repeat(60));
  console.log(`📊 Generated: ${report.timestamp}`);
}