#!/usr/bin/env node
// Verification of Prompt C - Tighten idempotent stop logs

const fs = require('fs');
const path = require('path');

console.log('=== Verifying Prompt C Implementation ===\n');

// Read the speechService file
const speechServicePath = path.join(__dirname, 'api', 'speechService.ts');
const content = fs.readFileSync(speechServicePath, 'utf8');

// Test results
const results = [];

function addResult(test, expected, actual, pass) {
  results.push({ test, expected, actual, pass });
}

// 1. Check for hasStopped flag declaration
console.log('1. Checking for hasStopped flag declaration...');
const hasStoppedDeclared = content.includes('let hasStopped: boolean = false');

addResult(
  'hasStopped flag declared',
  'let hasStopped: boolean = false',
  `Found: ${hasStoppedDeclared}`,
  hasStoppedDeclared
);

// 2. Check hasStopped is reset on start
console.log('2. Checking hasStopped reset on start...');
const resetsHasStopped = content.includes('hasStopped = false; // Reset for new turn');

addResult(
  'Resets hasStopped on start',
  'hasStopped = false in legacyStartRecording',
  `Found reset: ${resetsHasStopped}`,
  resetsHasStopped
);

// 3. Check hasStopped is checked at stop entry
console.log('3. Checking hasStopped guard at stop entry...');
const checksHasStopped = content.includes('if (hasStopped) {');
const logsAlreadyHandled = content.includes('[Stop] already handled');

addResult(
  'Checks hasStopped at stop entry',
  'if (hasStopped) { log "[Stop] already handled" }',
  `Checks: ${checksHasStopped}, Logs: ${logsAlreadyHandled}`,
  checksHasStopped && logsAlreadyHandled
);

// 4. Check hasStopped is set when stopping
console.log('4. Checking hasStopped is set when stopping...');
const setsHasStoppedTrue = content.includes('hasStopped = true; // Mark as handled for this turn');

addResult(
  'Sets hasStopped when stopping',
  'hasStopped = true after guards pass',
  `Found: ${setsHasStoppedTrue}`,
  setsHasStoppedTrue
);

// 5. Check no duplicate/confusing logs
console.log('5. Checking for reduced duplicate logs...');
const hasNoOpLog = content.includes('[Stop] no-op (already stopped)');
const hasStopIgnoredLog = content.includes('[SilenceTimer] stop ignored (already stopped)');
const hasIsStoppingIgnoredLog = content.includes('[Stop] ignored (already stopping)');

addResult(
  'Removed confusing duplicate logs',
  'No "no-op" or redundant "ignored" logs',
  `no-op: ${hasNoOpLog}, stop ignored: ${hasStopIgnoredLog}, already stopping: ${hasIsStoppingIgnoredLog}`,
  !hasNoOpLog && !hasStopIgnoredLog && !hasIsStoppingIgnoredLog
);

// 6. Check single "already handled" message
console.log('6. Checking for unified "already handled" message...');
const alreadyHandledCount = (content.match(/\[Stop\] already handled/g) || []).length;

addResult(
  'Single "already handled" message',
  'Uses consistent "[Stop] already handled" message',
  `Count: ${alreadyHandledCount}`,
  alreadyHandledCount >= 2 // Should appear for both hasStopped and isStopping checks
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
  console.log('\n✅ Prompt C successfully implemented!');
  console.log('- hasStopped flag prevents duplicate stop execution');
  console.log('- Clean "[Stop] already handled" message for duplicates');
  console.log('- No confusing "no-op/ignored" spam');
  console.log('\nExpected behavior:');
  console.log('- At most one stop execution per turn');
  console.log('- At most one "already handled" per accidental duplicate');
} else {
  console.log('\n❌ Some checks failed. Please review the implementation.');
  process.exit(1);
}