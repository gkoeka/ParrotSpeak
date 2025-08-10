#!/usr/bin/env node

/**
 * Test no-speech guard with 2-second silence timer
 * Simulates real recording scenarios with auto-stop
 */

const SILENCE_DB = -40;
const GRACE_PERIOD_MS = 700;
const SILENCE_TIMEOUT_MS = 2000;

class RecordingSimulator {
  constructor(scenario) {
    this.scenario = scenario;
    this.hadSpeech = false;
    this.speechFrames = 0;
    this.isRecording = false;
    this.startTime = null;
    this.silenceTimer = null;
    this.inSilence = false;
    this.graceEnded = false;
  }
  
  start() {
    console.log('🎤 Recording started');
    this.isRecording = true;
    this.startTime = Date.now();
    this.hadSpeech = false;
    this.speechFrames = 0;
    
    // Start status updates
    this.statusInterval = setInterval(() => {
      if (!this.isRecording) {
        clearInterval(this.statusInterval);
        return;
      }
      
      const elapsed = Date.now() - this.startTime;
      const metering = this.scenario.getMeteringAt(elapsed);
      
      this.processStatus({
        isRecording: true,
        durationMillis: elapsed,
        metering
      });
    }, 100);
  }
  
  processStatus(status) {
    const duration = status.durationMillis;
    
    // Grace period check
    if (duration < GRACE_PERIOD_MS) {
      if (!this.inSilence) {
        console.log('[SilenceTimer] grace active');
        this.inSilence = true;
      }
      return;
    }
    
    if (!this.graceEnded) {
      console.log('[SilenceTimer] grace ended');
      this.graceEnded = true;
      this.inSilence = false;
    }
    
    // Process speech detection
    const isSpeech = status.metering > SILENCE_DB;
    
    // Track speech activity
    if (isSpeech) {
      if (!this.hadSpeech) {
        console.log('[Filter] speech detected');
        this.hadSpeech = true;
      }
      this.speechFrames++;
    }
    
    // Log RMS for first 3 seconds
    if (duration <= 3000) {
      const isArmed = this.silenceTimer !== null;
      console.log(`[SilenceTimer] rms=${status.metering}dB, isSpeech=${isSpeech}, armed=${isArmed}`);
    }
    
    // Handle silence timer
    if (isSpeech) {
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
        console.log('[SilenceTimer] reset (speech)');
      }
      this.inSilence = false;
    } else {
      if (!this.silenceTimer) {
        this.silenceTimer = setTimeout(() => {
          console.log('[SilenceTimer] elapsed → auto-stop');
          this.stop('auto');
        }, SILENCE_TIMEOUT_MS);
        console.log('[SilenceTimer] armed (2000ms)');
      }
      this.inSilence = true;
    }
  }
  
  stop(reason = 'manual') {
    if (!this.isRecording) return;
    
    this.isRecording = false;
    const duration = Date.now() - this.startTime;
    
    console.log(`🛑 Recording stopped (${reason}). Duration: ${duration}ms`);
    console.log(`[Filter] hadSpeech=${this.hadSpeech} frames=${this.speechFrames} duration=${duration}ms`);
    
    // Clear timer
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    
    // Apply no-speech guard
    if (!this.hadSpeech || this.speechFrames < 3) {
      console.log('[Filter] no speech energy detected, skipping');
      console.log('⚠️ Transcription SKIPPED - no speech detected');
    } else if (duration < 500) {
      console.log(`[Filter] short (<500ms) recording (${duration}ms), skipping`);
      console.log('⚠️ Transcription SKIPPED - too short');
    } else {
      console.log('✅ Transcription would proceed normally');
    }
    
    return {
      uri: 'mock://recording.m4a',
      duration,
      hadSpeech: this.hadSpeech,
      speechFrames: this.speechFrames
    };
  }
}

// Test scenarios
const scenarios = {
  // Scenario 1: Complete silence (should skip)
  silenceOnly: {
    name: 'Silence Only (3s)',
    getMeteringAt: (ms) => -50 // Always silent
  },
  
  // Scenario 2: Speech then 2s pause (should process)
  speechThenPause: {
    name: 'Speech (1s) then Pause (2s)',
    getMeteringAt: (ms) => {
      if (ms < 700) return -50; // Grace period
      if (ms < 1700) return -30; // Speech for 1s
      return -50; // Silence after
    }
  },
  
  // Scenario 3: Very brief speech (should still process if > 3 frames)
  briefSpeech: {
    name: 'Brief Speech (400ms) then Silence',
    getMeteringAt: (ms) => {
      if (ms < 700) return -50; // Grace period
      if (ms < 1100) return -30; // Speech for 400ms
      return -50; // Silence after
    }
  },
  
  // Scenario 4: Intermittent speech (should process)
  intermittentSpeech: {
    name: 'Intermittent Speech',
    getMeteringAt: (ms) => {
      if (ms < 700) return -50; // Grace period
      // Alternate speech/silence every 500ms
      const cycle = Math.floor((ms - 700) / 500);
      return cycle % 2 === 0 ? -30 : -50;
    }
  }
};

async function runScenario(scenario) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Scenario: ${scenario.name}`);
  console.log('='.repeat(60));
  
  const sim = new RecordingSimulator(scenario);
  sim.start();
  
  // Wait for auto-stop or timeout
  await new Promise(resolve => {
    const timeout = setTimeout(() => {
      if (sim.isRecording) {
        console.log('\n⏰ Test timeout - stopping manually');
        sim.stop('manual');
      }
      resolve();
    }, 5000);
    
    // Check periodically if recording stopped
    const checkInterval = setInterval(() => {
      if (!sim.isRecording) {
        clearInterval(checkInterval);
        clearTimeout(timeout);
        resolve();
      }
    }, 100);
  });
  
  console.log('');
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║      No-Speech Guard with 2-Second Timer Test Suite       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  for (const scenario of Object.values(scenarios)) {
    await runScenario(scenario);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Test suite completed');
  console.log('='.repeat(60));
}

// Run tests
runAllTests().catch(console.error);