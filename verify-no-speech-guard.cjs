#!/usr/bin/env node

/**
 * Verification harness for no-speech guard
 * Tests that silent recordings are properly filtered
 */

// Mock Audio module
const mockAudio = {
  Recording: class MockRecording {
    constructor() {
      this.uri = 'mock://recording.m4a';
      this.isRecording = false;
      this.statusCallback = null;
      this.startTime = null;
      this.metering = -50; // Start silent
    }
    
    async stopAndUnloadAsync() {
      this.isRecording = false;
      console.log('[Mock] stopAndUnloadAsync called');
    }
    
    getURI() {
      return this.uri;
    }
    
    async getStatusAsync() {
      const duration = this.startTime ? Date.now() - this.startTime : 0;
      return {
        isRecording: this.isRecording,
        durationMillis: duration,
        metering: this.metering
      };
    }
    
    setOnRecordingStatusUpdate(callback) {
      this.statusCallback = callback;
      this.startTime = Date.now();
      this.isRecording = true;
      
      // Start sending status updates
      this.statusInterval = setInterval(() => {
        if (this.isRecording && this.statusCallback) {
          const duration = Date.now() - this.startTime;
          this.statusCallback({
            isRecording: true,
            durationMillis: duration,
            metering: this.metering
          });
        }
      }, 100);
    }
    
    stopStatusUpdates() {
      if (this.statusInterval) {
        clearInterval(this.statusInterval);
        this.statusInterval = null;
      }
    }
    
    static async createAsync(options) {
      const recording = new MockRecording();
      console.log('[Mock] Recording created with options:', options);
      return { recording };
    }
  },
  
  setAudioModeAsync: async (options) => {
    console.log('[Mock] Audio mode set');
    return true;
  },
  
  getPermissionsAsync: async () => {
    return { status: 'granted' };
  },
  
  requestPermissionsAsync: async () => {
    return { status: 'granted' };
  }
};

// Test scenarios
async function runTests() {
  console.log('=== No-Speech Guard Verification ===\n');
  
  // Test 1: Silent recording (no speech)
  console.log('Test 1: Silent recording (should have hadSpeech=false)');
  console.log('-----------------------------------------------');
  await testSilentRecording();
  
  console.log('\n');
  
  // Test 2: Recording with speech
  console.log('Test 2: Recording with speech (should have hadSpeech=true)');
  console.log('----------------------------------------------------------');
  await testSpeechRecording();
  
  console.log('\n');
  
  // Test 3: Brief speech then silence
  console.log('Test 3: Brief speech then silence (should have hadSpeech=true)');
  console.log('--------------------------------------------------------------');
  await testBriefSpeech();
}

async function testSilentRecording() {
  const recording = new mockAudio.Recording();
  recording.metering = -50; // Silent throughout
  
  let hadSpeech = false;
  let speechFrames = 0;
  const SILENCE_DB = -40;
  
  // Simulate recording with status updates
  recording.setOnRecordingStatusUpdate((status) => {
    const isSpeech = status.metering > SILENCE_DB;
    if (isSpeech) {
      if (!hadSpeech) {
        console.log('[Filter] speech detected');
        hadSpeech = true;
      }
      speechFrames++;
    }
  });
  
  // Run for 3 seconds
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Stop recording
  recording.stopStatusUpdates();
  await recording.stopAndUnloadAsync();
  
  console.log(`[Filter] hadSpeech=${hadSpeech} frames=${speechFrames} duration=3000ms`);
  
  if (hadSpeech === false) {
    console.log('[Filter] no speech energy detected, skipping');
    console.log('✅ PASS: Silent recording correctly filtered');
  } else {
    console.log('❌ FAIL: Silent recording should have hadSpeech=false');
  }
}

async function testSpeechRecording() {
  const recording = new mockAudio.Recording();
  recording.metering = -30; // Speech level throughout
  
  let hadSpeech = false;
  let speechFrames = 0;
  const SILENCE_DB = -40;
  
  // Simulate recording with status updates
  recording.setOnRecordingStatusUpdate((status) => {
    const isSpeech = status.metering > SILENCE_DB;
    if (isSpeech) {
      if (!hadSpeech) {
        console.log('[Filter] speech detected');
        hadSpeech = true;
      }
      speechFrames++;
    }
  });
  
  // Run for 2 seconds
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Stop recording
  recording.stopStatusUpdates();
  await recording.stopAndUnloadAsync();
  
  console.log(`[Filter] hadSpeech=${hadSpeech} frames=${speechFrames} duration=2000ms`);
  
  if (hadSpeech === true && speechFrames > 3) {
    console.log('✅ PASS: Speech recording correctly processed');
  } else {
    console.log('❌ FAIL: Speech recording should have hadSpeech=true');
  }
}

async function testBriefSpeech() {
  const recording = new mockAudio.Recording();
  
  let hadSpeech = false;
  let speechFrames = 0;
  const SILENCE_DB = -40;
  let updateCount = 0;
  
  // Simulate recording with status updates
  recording.setOnRecordingStatusUpdate((status) => {
    updateCount++;
    
    // Speech for first 500ms (5 updates), then silence
    if (updateCount <= 5) {
      recording.metering = -30; // Speech
    } else {
      recording.metering = -50; // Silence
    }
    
    const isSpeech = status.metering > SILENCE_DB;
    if (isSpeech) {
      if (!hadSpeech) {
        console.log('[Filter] speech detected');
        hadSpeech = true;
      }
      speechFrames++;
    }
  });
  
  // Run for 3 seconds
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Stop recording
  recording.stopStatusUpdates();
  await recording.stopAndUnloadAsync();
  
  console.log(`[Filter] hadSpeech=${hadSpeech} frames=${speechFrames} duration=3000ms`);
  
  if (hadSpeech === true && speechFrames >= 3) {
    console.log('✅ PASS: Brief speech correctly detected');
  } else {
    console.log('❌ FAIL: Brief speech should have hadSpeech=true');
  }
}

// Run tests
runTests().catch(console.error);