#!/usr/bin/env tsx
// Environment verification script - run comprehensive tests

import { runAllEnvironmentTests, generateVerificationReport } from '../utils/environmentVerification';

async function main() {
  try {
    console.log('🚀 Starting comprehensive environment verification...\n');
    
    const results = await runAllEnvironmentTests();
    generateVerificationReport(results);
    
    // Check if all tests passed
    const allPassed = results.every(result => {
      const configOk = result.success;
      const urlOk = result.actualUrl === result.test.expectedUrl;
      const sourceOk = result.actualSource === result.test.expectedSource;
      const envOk = result.actualEnvironment === result.test.expectedEnvironment;
      const errorsOk = result.test.shouldHaveErrors === (result.errors.length > 0);
      const warningsOk = result.test.shouldHaveWarnings === (result.warnings.length > 0);
      
      // API checks - allow localhost failures but require replit.dev success
      const healthOk = result.healthCheck.success || result.actualUrl.includes('localhost');
      const authOk = result.authCheck.success || result.authCheck.status === 401 || result.actualUrl.includes('localhost');
      
      return configOk && urlOk && sourceOk && envOk && errorsOk && warningsOk && healthOk && authOk;
    });
    
    if (allPassed) {
      console.log('\n🎉 All environment verification tests passed! Ready for Phase 3.');
      process.exit(0);
    } else {
      console.log('\n❌ Some verification tests failed. Please review the results above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Verification script failed:', error);
    process.exit(1);
  }
}

main();