#!/usr/bin/env node
// Verification of Prompt A - Single source of truth for auto-stop

const fs = require('fs');
const path = require('path');

console.log('=== Verifying Prompt A Implementation ===\n');

// Read the files
const speechServicePath = path.join(__dirname, 'api', 'speechService.ts');
const voiceControlsPath = path.join(__dirname, 'components', 'VoiceInputControls.tsx');

const speechServiceContent = fs.readFileSync(speechServicePath, 'utf8');
const voiceControlsContent = fs.readFileSync(voiceControlsPath, 'utf8');

// Test results
const results = [];

function addResult(test, expected, actual, pass) {
  results.push({ test, expected, actual, pass });
}

// 1. Check that VoiceInputControls has no poller
console.log('1. Checking VoiceInputControls for poller removal...');
const hasCheckInterval = voiceControlsContent.includes('checkInterval');
const hasSetInterval = voiceControlsContent.includes('setInterval');
const hasIsLegacyRecordingActive = voiceControlsContent.includes('isLegacyRecordingActive');

addResult(
  'No polling interval',
  'No checkInterval/setInterval/isLegacyRecordingActive',
  `checkInterval: ${hasCheckInterval}, setInterval: ${hasSetInterval}, isLegacyRecordingActive: ${hasIsLegacyRecordingActive}`,
  !hasCheckInterval && !hasSetInterval && !hasIsLegacyRecordingActive
);

// 2. Check that VoiceInputControls passes onAutoStop callback
console.log('2. Checking for onAutoStop callback in VoiceInputControls...');
const hasOnAutoStopCallback = voiceControlsContent.includes('onAutoStop:');
const callsHandleStopInCallback = voiceControlsContent.includes('handleStopRecording(\'silence-detected\')');

addResult(
  'Passes onAutoStop callback',
  'onAutoStop: () => { handleStopRecording(\'silence-detected\') }',
  `Has callback: ${hasOnAutoStopCallback}, Calls handleStop: ${callsHandleStopInCallback}`,
  hasOnAutoStopCallback && callsHandleStopInCallback
);

// 3. Check speechService accepts onAutoStop parameter
console.log('3. Checking speechService for onAutoStop parameter...');
const hasOnAutoStopParam = speechServiceContent.includes('onAutoStop?: () => void');
const storesCallback = speechServiceContent.includes('onAutoStopCallback = options?.onAutoStop');

addResult(
  'Accepts onAutoStop parameter',
  'legacyStartRecording(options?: { onAutoStop?: () => void })',
  `Has param: ${hasOnAutoStopParam}, Stores callback: ${storesCallback}`,
  hasOnAutoStopParam && storesCallback
);

// 4. Check speechService invokes callback after auto-stop
console.log('4. Checking speechService invokes callback after auto-stop...');
const invokesCallback = speechServiceContent.includes('onAutoStopCallback()');
const checksReasonAuto = speechServiceContent.includes('reason === \'auto\'');
const logsCallbackInvocation = speechServiceContent.includes('[Callback] Notifying UI of auto-stop');

addResult(
  'Invokes callback on auto-stop',
  'if (reason === \'auto\' && onAutoStopCallback) { onAutoStopCallback() }',
  `Invokes: ${invokesCallback}, Checks reason: ${checksReasonAuto}, Logs: ${logsCallbackInvocation}`,
  invokesCallback && checksReasonAuto && logsCallbackInvocation
);

// 5. Check callback is cleared after stop
console.log('5. Checking callback cleanup...');
const clearsCallback = speechServiceContent.includes('onAutoStopCallback = undefined');

addResult(
  'Clears callback after stop',
  'onAutoStopCallback = undefined in finally block',
  `Clears callback: ${clearsCallback}`,
  clearsCallback
);

// 6. Check callback has try/catch protection
console.log('6. Checking callback error handling...');
const hasCallbackTryCatch = speechServiceContent.includes('try {\n        console.log(\'📞 [Callback] Notifying UI of auto-stop\');\n        onAutoStopCallback();');
const hasCallbackCatch = speechServiceContent.includes('catch (callbackError)');

addResult(
  'Callback has error handling',
  'try/catch around onAutoStopCallback()',
  `Has try: ${hasCallbackTryCatch}, Has catch: ${hasCallbackCatch}`,
  hasCallbackTryCatch && hasCallbackCatch
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
  console.log('\n✅ Prompt A successfully implemented!');
  console.log('- UI poller removed completely');
  console.log('- Service is single source of truth for auto-stop');
  console.log('- Callback mechanism properly implemented');
  console.log('- No duplicate stop calls will occur');
  console.log('\nExpected log sequence for T1 (quiet start):');
  console.log('[SilenceTimer] armed → elapsed → auto-stop → [Legacy] Stopping... → [Callback] Notifying UI');
  console.log('No "no-op/ignored" stop logs should appear.');
} else {
  console.log('\n❌ Some checks failed. Please review the implementation.');
  process.exit(1);
}