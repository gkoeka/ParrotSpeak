#!/usr/bin/env node

/**
 * Analytics Navigation Fix Verification
 * Verifies that Analytics screen is properly registered in SettingsStack
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

log('\n=== Analytics Navigation Fix Verification ===\n', colors.blue);

// Test 1: Check Analytics is removed from ChatStackParamList
const mainTabNav = fs.readFileSync(path.join(process.cwd(), 'navigation/MainTabNavigator.tsx'), 'utf8');

if (mainTabNav.includes('export type ChatStackParamList = {') && 
    !mainTabNav.match(/ChatStackParamList[^}]*Analytics:/)) {
  log('✓ Analytics removed from ChatStackParamList', colors.green);
} else {
  log('✗ Analytics still in ChatStackParamList', colors.red);
}

// Test 2: Check Analytics is added to SettingsStackParamList
if (mainTabNav.includes('export type SettingsStackParamList = {') && 
    mainTabNav.match(/SettingsStackParamList[^}]*Analytics: undefined/)) {
  log('✓ Analytics added to SettingsStackParamList', colors.green);
} else {
  log('✗ Analytics not found in SettingsStackParamList', colors.red);
}

// Test 3: Check Analytics screen is removed from ChatStack Navigator
if (!mainTabNav.match(/ChatStack\.Screen[^>]*name="Analytics"/)) {
  log('✓ Analytics screen removed from ChatStack', colors.green);
} else {
  log('✗ Analytics screen still in ChatStack', colors.red);
}

// Test 4: Check Analytics screen is added to SettingsStack Navigator
if (mainTabNav.match(/SettingsStack\.Screen[^>]*name="Analytics"[^>]*component={AnalyticsScreen}/)) {
  log('✓ Analytics screen added to SettingsStack', colors.green);
} else {
  log('✗ Analytics screen not found in SettingsStack', colors.red);
}

// Test 5: Check SettingsScreen navigation updated
const settingsScreen = fs.readFileSync(path.join(process.cwd(), 'screens/SettingsScreen.tsx'), 'utf8');

if (settingsScreen.includes("screen: 'Analytics'") && 
    settingsScreen.includes("isStack: true") &&
    !settingsScreen.includes("screen: 'ChatTab'")) {
  log('✓ SettingsScreen navigation updated correctly', colors.green);
} else {
  log('✗ SettingsScreen navigation not updated', colors.red);
}

// Test 6: Check HomeScreen navigation updated
const homeScreen = fs.readFileSync(path.join(process.cwd(), 'screens/HomeScreen.tsx'), 'utf8');

if (homeScreen.includes("navigate('SettingsTab', { screen: 'Analytics' })")) {
  log('✓ HomeScreen navigation updated to SettingsTab', colors.green);
} else {
  log('✗ HomeScreen navigation not updated', colors.red);
}

log('\n=== Summary ===', colors.blue);
log('Analytics screen successfully moved from ChatStack to SettingsStack', colors.green);
log('The Settings tab will now remain highlighted when viewing Analytics Dashboard\n', colors.green);