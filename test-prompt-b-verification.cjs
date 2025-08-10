#!/usr/bin/env node
// Verification of Prompt B - Arm timer only after recording is active with recId guard

const fs = require('fs');
const path = require('path');

console.log('=== Verifying Prompt B Implementation ===\n');

// Read the speechService file
const speechServicePath = path.join(__dirname, 'api', 'speechService.ts');
const content = fs.readFileSync(speechServicePath, 'utf8');

// Test results
const results = [];

function addResult(test, expected, actual, pass) {
  results.push({ test, expected, actual, pass });
}

// 1. Check for seenActive tracking
console.log('1. Checking for seenActive tracking...');
const hasSeenActive = content.includes('let seenActive = false');
const checksIsRecording = content.includes('status.isRecording === true && !seenActive');
const setsSeenActive = content.includes('seenActive = true');
const logsActiveConfirmed = content.includes('[Recording] Active status confirmed');

addResult(
  'Tracks seenActive',
  'let seenActive = false; checks status.isRecording',
  `Has seenActive: ${hasSeenActive}, Checks isRecording: ${checksIsRecording}, Sets true: ${setsSeenActive}`,
  hasSeenActive && checksIsRecording && setsSeenActive && logsActiveConfirmed
);

// 2. Check that timer only arms after seenActive
console.log('2. Checking timer only arms after seenActive...');
const checksSeenActiveBeforeProcessing = content.includes('if (!seenActive) {\n          return;');
const armsOnlyWhenSeenActive = content.includes('if (!silenceTimer && seenActive)');

addResult(
  'Timer arms only after active',
  'Returns early if !seenActive; arms only when seenActive',
  `Early return: ${checksSeenActiveBeforeProcessing}, Arms with seenActive: ${armsOnlyWhenSeenActive}`,
  checksSeenActiveBeforeProcessing && armsOnlyWhenSeenActive
);

// 3. Check for recId guard
console.log('3. Checking recId guard implementation...');
const incrementsRecId = content.includes('recId++');
const capturesMyId = content.includes('const myId = recId');
const checksRecIdMismatch = content.includes('if (myId !== recId)');
const logsStaleIgnored = content.includes('[SilenceTimer] stale fire ignored');

addResult(
  'recId guard implemented',
  'Increments recId, captures myId, checks mismatch',
  `Increments: ${incrementsRecId}, Captures: ${capturesMyId}, Checks: ${checksRecIdMismatch}, Logs stale: ${logsStaleIgnored}`,
  incrementsRecId && capturesMyId && checksRecIdMismatch && logsStaleIgnored
);

// 4. Check for fallback logic with duration
console.log('4. Checking fallback logic for no metering...');
const hasLastDurationMillis = content.includes('let lastDurationMillis = 0');
const checksDurationChanged = content.includes('const durationChanged = status.durationMillis !== lastDurationMillis');
const updatesDuration = content.includes('lastDurationMillis = status.durationMillis || 0');
const usesDurationForSpeech = content.includes('isSpeech = durationChanged');

addResult(
  'Fallback uses duration change',
  'Tracks lastDurationMillis, uses change as activity',
  `Has lastDuration: ${hasLastDurationMillis}, Checks change: ${checksDurationChanged}, Updates: ${updatesDuration}`,
  hasLastDurationMillis && checksDurationChanged && updatesDuration && usesDurationForSpeech
);

// 5. Check for proper reset logging
console.log('5. Checking reset logging differentiates speech vs fallback...');
const logsResetSpeech = content.includes('[SilenceTimer] reset (speech)');
const logsResetFallback = content.includes('[SilenceTimer] reset (fallback)');
const conditionalResetLog = content.includes('hasMeter ? \'[SilenceTimer] reset (speech)\' : \'[SilenceTimer] reset (fallback)\'');

addResult(
  'Differentiates reset reasons',
  'Logs reset (speech) or reset (fallback) based on hasMeter',
  `Speech log: ${logsResetSpeech}, Fallback log: ${logsResetFallback}, Conditional: ${conditionalResetLog}`,
  conditionalResetLog || (logsResetSpeech && logsResetFallback)
);

// 6. Check timer is cleared on all stop paths
console.log('6. Checking timer cleared on all stop paths...');

// Check in stop function
const stopClearsTimer = /legacyStopRecording[\s\S]*?if \(silenceTimer\)[\s\S]*?clearTimeout\(silenceTimer\)/.test(content);

// Check in error handler
const errorClearsTimer = /catch[\s\S]*?if \(silenceTimer\)[\s\S]*?clearTimeout\(silenceTimer\)/.test(content);

// Check in background handler
const backgroundClearsTimer = /background[\s\S]*?if \(silenceTimer\)[\s\S]*?clearTimeout\(silenceTimer\)/.test(content);

addResult(
  'Timer cleared on all paths',
  'Cleared in stop, error, and background handlers',
  `Stop: ${stopClearsTimer}, Error: ${errorClearsTimer}, Background: ${backgroundClearsTimer}`,
  stopClearsTimer && errorClearsTimer && backgroundClearsTimer
);

// Print results
console.log('\n=== RESULTS TABLE ===\n');
console.log('| Test | Expected | Actual | Pass |');
console.log('|------|----------|--------|------|');

results.forEach(r => {
  const status = r.pass ? '✅' : '❌';
  console.log(`| ${r.test} | ${r.expected} | ${r.actual} | ${status} |`);
});

// Summary
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;

console.log(`\n=== SUMMARY ===`);
console.log(`Total: ${results.length} tests`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed === 0) {
  console.log('\n✅ Prompt B successfully implemented!');
  console.log('- Timer only arms after recording is confirmed active');
  console.log('- recId guard prevents stale timer fires');
  console.log('- Fallback logic for devices without metering');
  console.log('- Timer properly cleared on all stop paths');
  console.log('\nExpected behavior:');
  console.log('- No auto-stop before [Recording] Active status confirmed');
  console.log('- No stray auto-stops when speaking after quiet start');
  console.log('- Stale timers logged as [SilenceTimer] stale fire ignored');
} else {
  console.log('\n❌ Some checks failed. Please review the implementation.');
  process.exit(1);
}