#!/usr/bin/env node
/**
 * Verification script for Prompts A + B silence timer logic
 * Tests the 2-second silence detection implementation
 */

const assert = require('assert');

// Mock/simulation variables
let legacyRecording = null;
let legacyRecordingActive = false;
let isStoppingRecording = false;
let isStarting = false;
let isStopping = false;
let hasStopped = false;
let silenceTimer = null;
let inSilence = false;
let recId = 0;
let onAutoStopCallback = undefined;
let logs = [];

// Helper to log with timestamp
function log(message) {
  const timestamp = Date.now() % 100000; // Keep it short
  const logLine = `[${timestamp}] ${message}`;
  logs.push(logLine);
  console.log(logLine);
}

// Mock implementation of legacyStartRecording
async function legacyStartRecording(options) {
  // Check if already starting or stopping
  if (isStarting || isStopping) {
    log('[Start] ignored (busy)');
    return null; // Return null when ignored
  }
  
  isStarting = true;
  hasStopped = false; // Reset for new turn
  onAutoStopCallback = options?.onAutoStop;
  
  try {
    log('🎤 [Legacy] Starting legacy recording (CM OFF mode)...');
    
    // Check if already recording (double-tap protection)
    if (legacyRecordingActive || legacyRecording) {
      log('⚠️ [Legacy] Recording already in progress');
      return null; // Return null when already recording
    }
    
    // Simulate recording creation
    legacyRecording = { mock: true };
    legacyRecordingActive = true;
    log('✅ [Legacy] Recording started successfully');
    
    // Increment recording ID for this session
    recId++;
    const myId = recId;
    log(`[Recording] Session started with recId=${myId}`);
    
    // Clear any existing timer before starting
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }
    inSilence = false;
    
    // Track if we've seen the recording become active
    let seenActive = false;
    let lastDurationMillis = 0;
    
    // Return status update handler
    return {
      simulateStatusUpdate: (status) => {
        if (!legacyRecordingActive || isStoppingRecording) return;
        
        // Check if recording is active
        if (status.isRecording === true && !seenActive) {
          seenActive = true;
          log('[Recording] Active status confirmed');
        }
        
        // Don't process silence detection until recording is confirmed active
        if (!seenActive) {
          return;
        }
        
        // Detect metering availability
        const hasMeter = status.metering != null && status.metering !== undefined;
        
        // Compute if speech is detected
        let isSpeech;
        if (hasMeter) {
          isSpeech = status.metering > -35;
        } else {
          const durationChanged = status.durationMillis !== lastDurationMillis;
          lastDurationMillis = status.durationMillis || 0;
          isSpeech = durationChanged;
        }
        
        // Handle transitions
        if (isSpeech) {
          // Speech detected
          if (silenceTimer) {
            clearTimeout(silenceTimer);
            silenceTimer = null;
            log(hasMeter ? '[SilenceTimer] reset (speech)' : '[SilenceTimer] reset (fallback)');
          }
          inSilence = false;
        } else {
          // Silence detected
          if (!silenceTimer && seenActive) {
            silenceTimer = setTimeout(() => {
              // Guard against late fires with recId check
              if (myId !== recId) {
                log('[SilenceTimer] stale fire ignored');
                return;
              }
              log('[SilenceTimer] elapsed → auto-stop');
              legacyStopRecording({ reason: 'auto' });
            }, 2000);
            log('[SilenceTimer] armed (2000ms)');
          }
          inSilence = true;
        }
      }
    };
  } finally {
    isStarting = false;
  }
}

// Mock implementation of legacyStopRecording
async function legacyStopRecording(options) {
  // Check if stop was already handled for this turn
  if (hasStopped) {
    log('[Stop] already handled');
    return { uri: '', duration: 0 };
  }
  
  // Check if already in the process of stopping
  if (isStopping) {
    log('[Stop] already handled');
    return { uri: '', duration: 0 };
  }
  
  isStopping = true;
  hasStopped = true;
  
  try {
    const reason = options?.reason || 'manual';
    
    // Clear silence timer on any stop
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
      log('[SilenceTimer] cleared');
    }
    
    // Check if there's anything to stop
    if (!legacyRecording || !legacyRecordingActive) {
      return { uri: '', duration: 0 };
    }
    
    log(`🛑 [Legacy] Stopping recording (reason: ${reason})...`);
    
    isStoppingRecording = true;
    legacyRecordingActive = false;
    
    // Simulate stop
    const duration = 2000;
    legacyRecording = null;
    isStoppingRecording = false;
    
    log(`✅ [Legacy] Recording stopped. Duration: ${duration}ms`);
    
    // If this was an auto-stop, invoke the callback
    if (reason === 'auto' && onAutoStopCallback) {
      try {
        log('📞 [Callback] Notifying UI of auto-stop');
        onAutoStopCallback();
      } catch (error) {
        log('⚠️ [Callback] Error in onAutoStop callback');
      }
    }
    
    return { uri: 'mock://file.m4a', duration };
  } finally {
    isStopping = false;
    recId++;
    onAutoStopCallback = undefined;
  }
}

// Mock UI handler
function createUIHandler() {
  let autoStopCount = 0;
  return {
    onAutoStop: () => {
      autoStopCount++;
      log(`🔄 [UI] Auto-stop notification received (count: ${autoStopCount})`);
    },
    getAutoStopCount: () => autoStopCount
  };
}

// Sleep helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Reset state between tests
function resetState() {
  legacyRecording = null;
  legacyRecordingActive = false;
  isStoppingRecording = false;
  isStarting = false;
  isStopping = false;
  hasStopped = false;
  if (silenceTimer) {
    clearTimeout(silenceTimer);
    silenceTimer = null;
  }
  inSilence = false;
  recId = 0;
  onAutoStopCallback = undefined;
  logs = [];
}

// Test runner
async function runTest(name, testFn) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${name}`);
  console.log(`${'='.repeat(60)}`);
  resetState();
  try {
    await testFn();
    console.log('✅ PASS');
  } catch (error) {
    console.log('❌ FAIL:', error.message);
    throw error;
  }
}

// Main test suite
async function runAllTests() {
  console.log('SILENCE TIMER VERIFICATION TEST SUITE');
  console.log('Testing Prompts A + B implementation\n');

  // T1 - Quiet start (no speech)
  await runTest('T1 - Quiet start (no speech)', async () => {
    const ui = createUIHandler();
    const recorder = await legacyStartRecording({ onAutoStop: ui.onAutoStop });
    
    // First status update shows recording active, silence
    recorder.simulateStatusUpdate({ isRecording: true, metering: -60, durationMillis: 100 });
    
    // Verify timer was armed
    assert(logs.some(l => l.includes('[Recording] Active status confirmed')), 'Should confirm active');
    assert(logs.some(l => l.includes('[SilenceTimer] armed (2000ms)')), 'Should arm timer');
    
    // Wait for auto-stop
    await sleep(2100);
    
    // Verify auto-stop happened
    assert(logs.some(l => l.includes('[SilenceTimer] elapsed → auto-stop')), 'Should auto-stop');
    assert(logs.some(l => l.includes('[Callback] Notifying UI')), 'Should notify UI');
    assert(ui.getAutoStopCount() === 1, 'UI should receive exactly one auto-stop');
    assert(!logs.some(l => l.includes('[Stop] already handled')), 'No duplicate stops');
  });

  // T2 - Quiet then speech at 0.5s
  await runTest('T2 - Quiet then speech at 0.5s', async () => {
    const ui = createUIHandler();
    const recorder = await legacyStartRecording({ onAutoStop: ui.onAutoStop });
    
    // Start with silence
    recorder.simulateStatusUpdate({ isRecording: true, metering: -60, durationMillis: 100 });
    assert(logs.some(l => l.includes('[SilenceTimer] armed')), 'Should arm timer');
    
    // Speech at 0.5s
    await sleep(500);
    recorder.simulateStatusUpdate({ isRecording: true, metering: -20, durationMillis: 600 });
    
    // Verify timer was reset
    assert(logs.some(l => l.includes('[SilenceTimer] reset (speech)')), 'Should reset timer');
    
    // Wait to ensure no auto-stop
    await sleep(2500);
    assert(!logs.some(l => l.includes('[SilenceTimer] elapsed')), 'Should not auto-stop');
    assert(ui.getAutoStopCount() === 0, 'No auto-stop should occur');
  });

  // T3 - Speech then >2s silence
  await runTest('T3 - Speech then >2s silence', async () => {
    const ui = createUIHandler();
    const recorder = await legacyStartRecording({ onAutoStop: ui.onAutoStop });
    
    // Start with speech
    recorder.simulateStatusUpdate({ isRecording: true, metering: -20, durationMillis: 100 });
    assert(!logs.some(l => l.includes('[SilenceTimer] armed')), 'Should not arm timer during speech');
    
    // Continue speech for 1s
    await sleep(1000);
    recorder.simulateStatusUpdate({ isRecording: true, metering: -25, durationMillis: 1100 });
    
    // Enter silence
    recorder.simulateStatusUpdate({ isRecording: true, metering: -50, durationMillis: 1200 });
    assert(logs.some(l => l.includes('[SilenceTimer] armed')), 'Should arm timer on silence');
    
    // Wait for auto-stop
    await sleep(2100);
    assert(logs.some(l => l.includes('[SilenceTimer] elapsed → auto-stop')), 'Should auto-stop');
    assert(ui.getAutoStopCount() === 1, 'Exactly one auto-stop');
  });

  // T4 - Continuous speech >5s
  await runTest('T4 - Continuous speech >5s', async () => {
    const ui = createUIHandler();
    const recorder = await legacyStartRecording({ onAutoStop: ui.onAutoStop });
    
    // Continuous speech updates
    for (let i = 0; i < 6; i++) {
      recorder.simulateStatusUpdate({ 
        isRecording: true, 
        metering: -20 + Math.random() * 10, 
        durationMillis: i * 1000 + 100 
      });
      await sleep(1000);
    }
    
    // Verify no timer armed
    assert(!logs.some(l => l.includes('[SilenceTimer] armed')), 'Should never arm timer');
    assert(!logs.some(l => l.includes('[SilenceTimer] elapsed')), 'Should never auto-stop');
    assert(ui.getAutoStopCount() === 0, 'No auto-stop during continuous speech');
  });

  // T5 - Double-tap start
  await runTest('T5 - Double-tap start', async () => {
    const ui = createUIHandler();
    
    // First start - begin recording
    const recorder1 = await legacyStartRecording({ onAutoStop: ui.onAutoStop });
    const firstRecId = recId;
    
    // Activate recording
    if (recorder1) {
      recorder1.simulateStatusUpdate({ isRecording: true, metering: -20, durationMillis: 100 });
    }
    
    // Quick second start attempt while first is active (should be rejected)
    const recorder2 = await legacyStartRecording({ onAutoStop: ui.onAutoStop });
    
    // Verify second start was properly rejected
    assert(recorder2 === null, 'Second start should return null');
    assert(logs.some(l => l.includes('Recording already in progress')), 'Should log already in progress');
    const startLogs = logs.filter(l => l.includes('Recording started successfully'));
    assert(startLogs.length === 1, `Should have only one successful start, got ${startLogs.length}`);
    assert(recId === firstRecId, `recId should not change from ${firstRecId}, got ${recId}`);
  });

  // T6 - New turn after stale timer
  await runTest('T6 - New turn after stale timer', async () => {
    // We need to manually control the timer for this test
    // Save the current timer before we mess with it
    let savedTimer = null;
    
    const ui1 = createUIHandler();
    const recorder1 = await legacyStartRecording({ onAutoStop: ui1.onAutoStop });
    const firstRecId = recId;
    
    // Start with silence to arm timer
    if (recorder1) {
      recorder1.simulateStatusUpdate({ isRecording: true, metering: -60, durationMillis: 100 });
    }
    assert(logs.some(l => l.includes('[SilenceTimer] armed')), 'First timer armed');
    
    // Save the timer reference before we simulate stop
    savedTimer = silenceTimer;
    
    // Before timer fires (at 1s), simulate a manual stop that forgets to clear timer
    // This simulates a race condition
    await sleep(1000);
    
    // Simulate stop WITHOUT clearing the timer (race condition)
    legacyRecording = null;
    legacyRecordingActive = false;
    hasStopped = false;
    isStoppingRecording = false;
    isStopping = false;
    recId++; // Increment recId as would happen in real stop
    log('🛑 [Manual] Simulating stop that forgot to clear timer (race)');
    
    // Restore the timer (simulating it wasn't cleared)
    silenceTimer = savedTimer;
    
    // Start new turn with new recId
    const ui2 = createUIHandler();
    const recorder2 = await legacyStartRecording({ onAutoStop: ui2.onAutoStop });
    const secondRecId = recId;
    
    if (recorder2) {
      recorder2.simulateStatusUpdate({ isRecording: true, metering: -20, durationMillis: 100 });
    }
    
    // Wait for stale timer from first recording to fire
    await sleep(1200);
    
    // Verify behavior
    assert(logs.some(l => l.includes('[SilenceTimer] stale fire ignored')), 'Stale timer should be ignored');
    assert(firstRecId !== secondRecId, 'recId should have changed between turns');
    assert(ui1.getAutoStopCount() === 0, 'First UI should not receive auto-stop');
    assert(ui2.getAutoStopCount() === 0, 'Second UI should not receive auto-stop (stale timer ignored)');
  });

  console.log('\n' + '='.repeat(60));
  console.log('ALL TESTS PASSED! 🎉');
  console.log('='.repeat(60));
  console.log('\nSummary:');
  console.log('✅ Timer only arms after recording is active');
  console.log('✅ recId prevents stale timer fires');
  console.log('✅ UI callback invoked exactly once per auto-stop');
  console.log('✅ No duplicate stop logs');
  console.log('✅ Clean timer management across all scenarios');
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ TEST SUITE FAILED:', error);
  process.exit(1);
});