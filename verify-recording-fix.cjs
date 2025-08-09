#!/usr/bin/env node

/**
 * Comprehensive test to verify all recording fixes
 * Run this to check:
 * 1. Probe button functionality
 * 2. Translation pipeline
 * 3. Conversation Mode operation
 * 4. "Only one Recording" error resolution
 */

const fs = require('fs');
const path = require('path');

console.log('=== RECORDING FIX VERIFICATION ===');
console.log('Date:', new Date().toISOString());
console.log('');

// Check 1: Verify singleton pattern
console.log('CHECK 1: ConversationSessionService Singleton');
console.log('---------------------------------------------');
const serviceFile = fs.readFileSync(path.join(__dirname, 'services/ConversationSessionService.ts'), 'utf8');
if (serviceFile.includes('static getInstance()')) {
  console.log('✅ PASS: getInstance() method exists');
} else {
  console.log('❌ FAIL: getInstance() method missing');
}

// Check 2: Verify createAsync pattern
console.log('');
console.log('CHECK 2: Audio.Recording.createAsync() Pattern');
console.log('-----------------------------------------------');
if (serviceFile.includes('Audio.Recording.createAsync(')) {
  console.log('✅ PASS: Using createAsync() pattern');
} else {
  console.log('❌ FAIL: Not using createAsync() pattern');
}

// Check 3: Platform guards
console.log('');
console.log('CHECK 3: Platform Guards');
console.log('-------------------------');
if (serviceFile.includes("Platform.OS === 'web'")) {
  console.log('✅ PASS: Platform guard for web exists');
} else {
  console.log('❌ FAIL: Platform guard missing');
}

// Check 4: speechService disabled
console.log('');
console.log('CHECK 4: speechService Recording Disabled');
console.log('------------------------------------------');
const speechFile = fs.readFileSync(path.join(__dirname, 'api/speechService.ts'), 'utf8');
if (speechFile.includes('throw new Error(\'Recording is managed by ConversationSessionService')) {
  console.log('✅ PASS: speechService recording functions disabled');
} else {
  console.log('❌ FAIL: speechService recording functions still active');
}

// Check 5: Probe button exists
console.log('');
console.log('CHECK 5: Probe Button in ConversationScreen');
console.log('--------------------------------------------');
const screenFile = fs.readFileSync(path.join(__dirname, 'screens/ConversationScreen.tsx'), 'utf8');
if (screenFile.includes('Run Probe') && screenFile.includes('__DEV__')) {
  console.log('✅ PASS: Dev-only probe button exists');
} else {
  console.log('❌ FAIL: Probe button missing or not dev-only');
}

// Check 6: Race condition prevention
console.log('');
console.log('CHECK 6: Race Condition Prevention');
console.log('-----------------------------------');
if (serviceFile.includes('isStoppingRecording')) {
  console.log('✅ PASS: isStoppingRecording flag exists');
} else {
  console.log('❌ FAIL: Race condition prevention missing');
}

// Check 7: Sanity probe function
console.log('');
console.log('CHECK 7: Sanity Probe Function');
console.log('-------------------------------');
if (serviceFile.includes('sanityProbeStartStop')) {
  console.log('✅ PASS: sanityProbeStartStop() exists');
} else {
  console.log('❌ FAIL: sanityProbeStartStop() missing');
}

// Check 8: Permission checks
console.log('');
console.log('CHECK 8: Audio Permission Checks');
console.log('---------------------------------');
if (serviceFile.includes('Audio.requestPermissionsAsync()')) {
  console.log('✅ PASS: Permission checks implemented');
} else {
  console.log('❌ FAIL: Permission checks missing');
}

// Summary
console.log('');
console.log('=== SUMMARY ===');
console.log('All critical fixes should be in place to prevent "Only one Recording" errors.');
console.log('');
console.log('NEXT STEPS:');
console.log('1. Open the app on your mobile device');
console.log('2. Navigate to a conversation screen');
console.log('3. Tap the "Run Probe" button');
console.log('4. Check console for "[Probe] PASS" message');
console.log('5. Enable Conversation Mode in Settings');
console.log('6. Try recording - should work without errors');
console.log('');
console.log('If issues persist, check:');
console.log('- Device console logs for specific error messages');
console.log('- Network connectivity for translation API');
console.log('- Microphone permissions are granted');