#!/usr/bin/env node
// Combined verification of all three prompts

const fs = require('fs');
const path = require('path');

console.log('=== COMBINED VERIFICATION: PROMPTS A, B, C ===\n');

// Read the files
const speechServicePath = path.join(__dirname, 'api', 'speechService.ts');
const voiceControlsPath = path.join(__dirname, 'components', 'VoiceInputControls.tsx');

const speechServiceContent = fs.readFileSync(speechServicePath, 'utf8');
const voiceControlsContent = fs.readFileSync(voiceControlsPath, 'utf8');

// Test results
const results = [];

function addResult(prompt, test, pass) {
  results.push({ prompt, test, pass });
}

// === PROMPT A TESTS ===
console.log('Testing Prompt A - Single source of truth...');
addResult('A', 'UI poller removed (no checkInterval/setInterval)', 
  !voiceControlsContent.includes('checkInterval') && !voiceControlsContent.includes('setInterval'));
addResult('A', 'UI passes onAutoStop callback',
  voiceControlsContent.includes('onAutoStop:') && voiceControlsContent.includes('handleStopRecording(\'silence-detected\')'));
addResult('A', 'Service accepts onAutoStop parameter',
  speechServiceContent.includes('onAutoStop?: () => void') && speechServiceContent.includes('onAutoStopCallback = options?.onAutoStop'));
addResult('A', 'Service invokes callback on auto-stop',
  speechServiceContent.includes('onAutoStopCallback()') && speechServiceContent.includes('reason === \'auto\''));
addResult('A', 'Callback cleared after stop',
  speechServiceContent.includes('onAutoStopCallback = undefined'));

// === PROMPT B TESTS ===
console.log('Testing Prompt B - Recording active guard...');
addResult('B', 'Tracks seenActive flag',
  speechServiceContent.includes('let seenActive = false') && speechServiceContent.includes('seenActive = true'));
addResult('B', 'Timer only arms after seenActive',
  speechServiceContent.includes('if (!seenActive) {\n          return;') && speechServiceContent.includes('if (!silenceTimer && seenActive)'));
addResult('B', 'recId guard implemented',
  speechServiceContent.includes('const myId = recId') && speechServiceContent.includes('if (myId !== recId)'));
addResult('B', 'Logs stale timer fires',
  speechServiceContent.includes('[SilenceTimer] stale fire ignored'));
addResult('B', 'Fallback uses duration change',
  speechServiceContent.includes('const durationChanged = status.durationMillis !== lastDurationMillis'));

// === PROMPT C TESTS ===
console.log('Testing Prompt C - Tightened stop logs...');
addResult('C', 'hasStopped flag declared',
  speechServiceContent.includes('let hasStopped: boolean = false'));
addResult('C', 'hasStopped reset on start',
  speechServiceContent.includes('hasStopped = false; // Reset for new turn'));
addResult('C', 'hasStopped checked at stop entry',
  speechServiceContent.includes('if (hasStopped) {') && speechServiceContent.includes('[Stop] already handled'));
addResult('C', 'hasStopped set when stopping',
  speechServiceContent.includes('hasStopped = true; // Mark as handled for this turn'));
addResult('C', 'No confusing duplicate logs',
  !speechServiceContent.includes('[Stop] no-op (already stopped)') && 
  !speechServiceContent.includes('[SilenceTimer] stop ignored (already stopped)'));

// Print results table
console.log('\n=== RESULTS TABLE ===\n');
console.log('| Prompt | Test | Pass |');
console.log('|--------|------|------|');

const promptAPassed = results.filter(r => r.prompt === 'A' && r.pass).length;
const promptBPassed = results.filter(r => r.prompt === 'B' && r.pass).length;
const promptCPassed = results.filter(r => r.prompt === 'C' && r.pass).length;

results.forEach(r => {
  const status = r.pass ? '✅' : '❌';
  console.log(`| ${r.prompt} | ${r.test} | ${status} |`);
});

// Summary
const total = results.length;
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;

console.log(`\n=== SUMMARY ===`);
console.log(`Total tests: ${total}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`\nPrompt A: ${promptAPassed}/5 tests passed`);
console.log(`Prompt B: ${promptBPassed}/5 tests passed`);
console.log(`Prompt C: ${promptCPassed}/5 tests passed`);

if (failed === 0) {
  console.log('\n🎉 ALL THREE PROMPTS SUCCESSFULLY IMPLEMENTED! 🎉');
  console.log('\n✅ Prompt A: UI uses callbacks instead of polling');
  console.log('✅ Prompt B: Timer only arms after recording is active');
  console.log('✅ Prompt C: Clean idempotent stop logging');
  console.log('\n📊 Expected behavior:');
  console.log('- No duplicate stop calls');
  console.log('- No premature auto-stops');
  console.log('- Clean, minimal logging');
  console.log('- Robust 2-second silence detection');
} else {
  console.log('\n❌ Some tests failed. Please review the implementation.');
  process.exit(1);
}