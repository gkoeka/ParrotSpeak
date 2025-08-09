#!/usr/bin/env node

/**
 * Navigation Fix Verification Script
 * Verifies that all navigation issues have been resolved
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  dim: '\x1b[2m'
};

// Test results
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;
let warnings = [];

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function testPassed(testName) {
  testsRun++;
  testsPassed++;
  log(`✓ ${testName}`, colors.green);
}

function testFailed(testName, reason) {
  testsRun++;
  testsFailed++;
  log(`✗ ${testName}`, colors.red);
  if (reason) {
    log(`  Reason: ${reason}`, colors.dim);
  }
}

function addWarning(message) {
  warnings.push(message);
}

// Check for type casting in navigation
function checkTypeCasting() {
  const patterns = [
    { pattern: /navigate\([^)]*as\s+never/g, description: 'as never casting' },
    { pattern: /navigate\([^)]*as\s+any(?!\w)/g, description: 'as any casting' }
  ];
  
  const filesToCheck = [
    'screens/HomeScreen.tsx',
    'components/Header.tsx',
    'components/PreviewExpiryWarning.tsx',
    'screens/SettingsScreen.tsx'
  ];
  
  let foundIssues = false;
  
  filesToCheck.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      patterns.forEach(({ pattern, description }) => {
        const matches = content.match(pattern);
        if (matches) {
          foundIssues = true;
          testFailed(`No ${description} in ${file}`, `Found: ${matches.join(', ')}`);
        }
      });
    }
  });
  
  if (!foundIssues) {
    testPassed('No type casting in navigation calls');
  }
}

// Check TabParamList supports nested navigation
function checkTabParamList() {
  const filePath = path.join(process.cwd(), 'navigation/MainTabNavigator.tsx');
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if TabParamList has proper nested navigation support
    if (content.includes('{ screen?: keyof') && content.includes('params?: any }')) {
      testPassed('TabParamList supports nested navigation');
    } else {
      testFailed('TabParamList nested navigation support', 'Missing proper type definitions');
    }
  } else {
    testFailed('MainTabNavigator.tsx not found');
  }
}

// Check navigation imports are correct
function checkNavigationImports() {
  const filesToCheck = [
    { file: 'screens/HomeScreen.tsx', expectedImports: ['TabParamList', 'ChatStackParamList'] },
    { file: 'components/Header.tsx', expectedImports: ['TabParamList'] },
    { file: 'components/PreviewExpiryWarning.tsx', expectedImports: ['TabParamList'] }
  ];
  
  filesToCheck.forEach(({ file, expectedImports }) => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      const hasAllImports = expectedImports.every(imp => content.includes(imp));
      if (hasAllImports) {
        testPassed(`Correct imports in ${file}`);
      } else {
        testFailed(`Missing imports in ${file}`, `Expected: ${expectedImports.join(', ')}`);
      }
    }
  });
}

// Check for ConversationsTab usage (should be HistoryTab)
function checkHistoryTabUsage() {
  const filePath = path.join(process.cwd(), 'screens/HomeScreen.tsx');
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes("navigate('ConversationsTab')")) {
      testFailed('ConversationsTab usage', 'Should use HistoryTab');
    } else if (content.includes("navigate('HistoryTab')")) {
      testPassed('Correct HistoryTab usage');
    } else {
      addWarning('Could not verify HistoryTab usage');
    }
  }
}

// Main execution
log('\n=== Navigation Fix Verification ===\n', colors.blue);

checkTypeCasting();
checkTabParamList();
checkNavigationImports();
checkHistoryTabUsage();

// Summary
log('\n=== Summary ===\n', colors.blue);
log(`Tests run: ${testsRun}`);
log(`Tests passed: ${testsPassed}`, colors.green);
if (testsFailed > 0) {
  log(`Tests failed: ${testsFailed}`, colors.red);
}

if (warnings.length > 0) {
  log('\nWarnings:', colors.yellow);
  warnings.forEach(warning => log(`  - ${warning}`, colors.yellow));
}

// Exit code
if (testsFailed > 0) {
  log('\n❌ Navigation verification failed', colors.red);
  process.exit(1);
} else {
  log('\n✅ All navigation issues resolved!', colors.green);
  process.exit(0);
}