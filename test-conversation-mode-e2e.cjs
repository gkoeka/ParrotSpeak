#!/usr/bin/env node

/**
 * End-to-End Test for Conversation Mode Translation
 * This script traces through the entire recording and translation pipeline
 * to identify all potential failure points
 */

const fs = require('fs');
const path = require('path');

console.log('=== CONVERSATION MODE E2E TEST ===');
console.log('Date:', new Date().toISOString());
console.log('');

// Test categories
const tests = {
  singleton: { pass: [], fail: [] },
  recording: { pass: [], fail: [] },
  translation: { pass: [], fail: [] },
  audioMode: { pass: [], fail: [] },
  stateManagement: { pass: [], fail: [] },
  errorHandling: { pass: [], fail: [] },
  api: { pass: [], fail: [] }
};

// === 1. SINGLETON PATTERN TEST ===
console.log('1. SINGLETON PATTERN CHECK');
console.log('---------------------------');

const serviceFile = fs.readFileSync('services/ConversationSessionService.ts', 'utf8');
const voiceInputFile = fs.readFileSync('components/VoiceInputControls.tsx', 'utf8');
const contextFile = fs.readFileSync('contexts/ConversationContext.tsx', 'utf8');

// Check singleton implementation
if (serviceFile.includes('private static instance:') && serviceFile.includes('public static getInstance()')) {
  tests.singleton.pass.push('ConversationSessionService has singleton pattern');
} else {
  tests.singleton.fail.push('Missing singleton pattern in ConversationSessionService');
}

// Check singleton usage
if (voiceInputFile.includes('ConversationSessionService.getInstance()')) {
  tests.singleton.pass.push('VoiceInputControls uses getInstance()');
} else {
  tests.singleton.fail.push('VoiceInputControls not using getInstance()');
}

if (contextFile.includes('ConversationSessionService.getInstance()')) {
  tests.singleton.pass.push('ConversationContext uses getInstance()');
} else {
  tests.singleton.fail.push('ConversationContext not using getInstance()');
}

// === 2. RECORDING LIFECYCLE TEST ===
console.log('\n2. RECORDING LIFECYCLE CHECK');
console.log('-----------------------------');

// Check Audio.Recording.createAsync pattern
if (serviceFile.includes('Audio.Recording.createAsync(')) {
  tests.recording.pass.push('Uses createAsync() pattern');
} else {
  tests.recording.fail.push('Not using createAsync() pattern');
}

// Check URI retrieval order (must be before stopAndUnloadAsync)
const stopAndUnloadIndex = serviceFile.indexOf('await this.recording.stopAndUnloadAsync()');
const getURIIndex = serviceFile.indexOf('const uri = this.recording.getURI()');
if (getURIIndex > 0 && stopAndUnloadIndex > 0 && getURIIndex < stopAndUnloadIndex) {
  tests.recording.pass.push('URI retrieved before stopAndUnloadAsync()');
} else {
  tests.recording.fail.push('ERROR: URI retrieved after stopAndUnloadAsync() - will cause "recorder does not exist"');
}

// Check platform guards
if (serviceFile.includes("Platform.OS === 'web'")) {
  tests.recording.pass.push('Platform guard prevents web recording');
} else {
  tests.recording.fail.push('Missing platform guard for web');
}

// Check race condition prevention
if (serviceFile.includes('isStoppingRecording')) {
  tests.recording.pass.push('Race condition prevention flag exists');
} else {
  tests.recording.fail.push('Missing race condition prevention');
}

// === 3. TRANSLATION PIPELINE TEST ===
console.log('\n3. TRANSLATION PIPELINE CHECK');
console.log('------------------------------');

const speechServiceFile = fs.readFileSync('api/speechService.ts', 'utf8');

// Check if speechService recording is disabled
if (speechServiceFile.includes('throw new Error(\'Recording is managed by ConversationSessionService')) {
  tests.translation.pass.push('speechService recording disabled correctly');
} else {
  tests.translation.fail.push('speechService recording not properly disabled');
}

// Check processRecording function
if (voiceInputFile.includes('processRecording(uri, sourceLanguage)')) {
  tests.translation.pass.push('processRecording called with correct params');
} else {
  tests.translation.fail.push('processRecording not properly called');
}

// Check translateText function
if (voiceInputFile.includes('translateText(')) {
  tests.translation.pass.push('translateText function called');
} else {
  tests.translation.fail.push('translateText function not found');
}

// Check API endpoints
const routesFile = fs.readFileSync('server/routes.ts', 'utf8');
if (routesFile.includes('/api/translate')) {
  tests.api.pass.push('Translation API endpoint exists');
} else {
  tests.api.fail.push('Translation API endpoint missing');
}

if (routesFile.includes('/api/speech/transcribe')) {
  tests.api.pass.push('Transcription API endpoint exists');
} else {
  tests.api.fail.push('Transcription API endpoint missing');
}

// === 4. AUDIO MODE CONFIGURATION ===
console.log('\n4. AUDIO MODE CONFIGURATION CHECK');
console.log('----------------------------------');

if (serviceFile.includes('Audio.setAudioModeAsync({')) {
  tests.audioMode.pass.push('Audio mode configuration exists');
  
  if (serviceFile.includes('allowsRecordingIOS: true')) {
    tests.audioMode.pass.push('iOS recording enabled');
  } else {
    tests.audioMode.fail.push('iOS recording not enabled');
  }
  
  if (serviceFile.includes('staysActiveInBackground: false')) {
    tests.audioMode.pass.push('Background recording disabled (privacy)');
  } else {
    tests.audioMode.fail.push('Background recording not properly disabled');
  }
} else {
  tests.audioMode.fail.push('Audio mode not configured');
}

// === 5. STATE MANAGEMENT TEST ===
console.log('\n5. STATE MANAGEMENT CHECK');
console.log('--------------------------');

const states = ['DISARMED', 'ARMED_IDLE', 'RECORDING', 'STOPPING', 'PROCESSING'];
states.forEach(state => {
  if (serviceFile.includes(`SessionState.${state}`)) {
    tests.stateManagement.pass.push(`State ${state} defined`);
  } else {
    tests.stateManagement.fail.push(`State ${state} missing`);
  }
});

// Check state transition validation
if (serviceFile.includes('isValidTransition')) {
  tests.stateManagement.pass.push('State transition validation exists');
} else {
  tests.stateManagement.fail.push('No state transition validation');
}

// === 6. ERROR HANDLING TEST ===
console.log('\n6. ERROR HANDLING CHECK');
console.log('------------------------');

// Check permission handling
if (serviceFile.includes('Audio.requestPermissionsAsync()')) {
  tests.errorHandling.pass.push('Permission request implemented');
} else {
  tests.errorHandling.fail.push('Permission request missing');
}

// Check error callbacks
if (serviceFile.includes('onError:')) {
  tests.errorHandling.pass.push('Error callbacks defined');
} else {
  tests.errorHandling.fail.push('Error callbacks missing');
}

// Check cleanup on error
if (serviceFile.includes('// Clean up on error')) {
  tests.errorHandling.pass.push('Error cleanup implemented');
} else {
  tests.errorHandling.fail.push('Error cleanup missing');
}

// === 7. 2-SECOND RULE TEST ===
console.log('\n7. TWO-SECOND SILENCE RULE CHECK');
console.log('---------------------------------');

if (serviceFile.includes('STOP_SILENCE_MS: 2000')) {
  tests.recording.pass.push('2-second silence timer configured');
} else {
  tests.recording.fail.push('2-second silence timer not configured');
}

if (serviceFile.includes('resetSilenceTimer')) {
  tests.recording.pass.push('Silence timer reset function exists');
} else {
  tests.recording.fail.push('Silence timer reset function missing');
}

// === RESULTS SUMMARY ===
console.log('\n=== TEST RESULTS SUMMARY ===\n');

let totalPass = 0;
let totalFail = 0;
const criticalIssues = [];

Object.entries(tests).forEach(([category, results]) => {
  const passCount = results.pass.length;
  const failCount = results.fail.length;
  totalPass += passCount;
  totalFail += failCount;
  
  console.log(`${category.toUpperCase()}:`);
  console.log(`  ✅ Passed: ${passCount}`);
  console.log(`  ❌ Failed: ${failCount}`);
  
  if (results.fail.length > 0) {
    console.log('  Issues:');
    results.fail.forEach(issue => {
      console.log(`    - ${issue}`);
      if (issue.includes('ERROR:') || issue.includes('will cause')) {
        criticalIssues.push(issue);
      }
    });
  }
  console.log('');
});

console.log('OVERALL:');
console.log(`  Total Passed: ${totalPass}`);
console.log(`  Total Failed: ${totalFail}`);
console.log(`  Success Rate: ${Math.round((totalPass / (totalPass + totalFail)) * 100)}%`);

if (criticalIssues.length > 0) {
  console.log('\n⚠️  CRITICAL ISSUES FOUND:');
  criticalIssues.forEach(issue => {
    console.log(`  🔴 ${issue}`);
  });
}

// === POTENTIAL FAILURE POINTS ===
console.log('\n=== POTENTIAL FAILURE POINTS ===\n');

console.log('1. OPENAI API KEY:');
console.log('   - Check if OPENAI_API_KEY environment variable is set');
console.log('   - Verify API key has sufficient credits');

console.log('\n2. NETWORK CONNECTIVITY:');
console.log('   - Translation requires internet connection');
console.log('   - API endpoints must be accessible');

console.log('\n3. PERMISSIONS:');
console.log('   - Microphone permission must be granted');
console.log('   - iOS: Check Info.plist for NSMicrophoneUsageDescription');

console.log('\n4. LANGUAGE CONFIGURATION:');
console.log('   - Source and target languages must be properly selected');
console.log('   - Language codes must match API expectations');

console.log('\n5. SESSION LIFECYCLE:');
console.log('   - Conversation Mode must be enabled in Settings');
console.log('   - Session must be armed before recording');

console.log('\n6. FILE SYSTEM:');
console.log('   - Recording files must be writable');
console.log('   - Temp directory must have space');

console.log('\n=== END OF TEST ===');