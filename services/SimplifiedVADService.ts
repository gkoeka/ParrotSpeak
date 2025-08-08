/**
 * SimplifiedVADService.ts
 * 
 * Purpose: Turn-based Voice Activity Detection that respects Expo's single-recording constraint.
 * One recording per utterance, no mid-recording file reads or chunk rotations.
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

// Configuration
const SILENCE_THRESHOLD_MS = 1800; // 1.8 seconds of silence to end utterance
const MAX_UTTERANCE_MS = 20000;    // 20 seconds max per utterance
const FILE_CLEANUP_DELAY_MS = 30000; // Delete files after 30 seconds

// State machine states
export enum RecordingState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING', 
  STOPPING = 'STOPPING'
}

export interface UtteranceChunk {
  uri: string;
  timestamp: Date;
  duration: number;
  speakerId?: string;
}

export interface SimplifiedVADCallbacks {
  onRecordingStart: () => void;
  onUtteranceComplete: (chunk: UtteranceChunk) => void;
  onSilenceDetected: () => void;
  onError: (error: Error) => void;
  onStateChange?: (state: RecordingState) => void;
}

export class SimplifiedVADService {
  private recording: Audio.Recording | null = null;
  private state: RecordingState = RecordingState.IDLE;
  private callbacks: SimplifiedVADCallbacks | null = null;
  
  // Timers
  private silenceTimer: NodeJS.Timeout | null = null;
  private maxDurationTimer: NodeJS.Timeout | null = null;
  private fileCleanupTimers: Map<string, NodeJS.Timeout> = new Map();
  
  // Tracking
  private recordingStartTime: Date | null = null;
  private utteranceCount: number = 0;
  private lastSpeechTime: Date | null = null;

  /**
   * Initialize the service with callbacks
   */
  public async initialize(callbacks: SimplifiedVADCallbacks): Promise<void> {
    console.log('🎤 TurnBasedVAD: Initializing...');
    
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Microphone permission not granted');
      }
      
      this.callbacks = callbacks;
      this.state = RecordingState.IDLE;
      console.log('✅ TurnBasedVAD: Initialized');
    } catch (error) {
      console.error('❌ TurnBasedVAD: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get current state
   */
  public getState(): RecordingState {
    return this.state;
  }

  /**
   * State transition helper
   */
  private setState(newState: RecordingState): void {
    const oldState = this.state;
    this.state = newState;
    console.log(`📊 State: ${oldState} → ${newState}`);
    this.callbacks?.onStateChange?.(newState);
  }

  /**
   * Start a single recording for one utterance
   * Guards against multiple concurrent recordings
   */
  public async startUtterance(): Promise<void> {
    // State machine guard - only start from IDLE
    if (this.state !== RecordingState.IDLE) {
      console.log(`⚠️ Cannot start: state is ${this.state}`);
      return;
    }

    try {
      this.setState(RecordingState.RECORDING);
      console.log('🎤 Starting utterance recording...');
      
      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      // Create ONE recording instance per utterance
      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm;codecs=opus',
          bitsPerSecond: 128000,
        },
      });

      await this.recording.startAsync();
      
      this.recordingStartTime = new Date();
      this.lastSpeechTime = new Date();
      this.utteranceCount++;
      
      this.callbacks?.onRecordingStart();
      
      // Start silence detection
      this.resetSilenceTimer();
      
      // Start max duration safety timer
      this.startMaxDurationTimer();
      
      console.log(`✅ Utterance #${this.utteranceCount} recording started`);
      
    } catch (error) {
      console.error('❌ Failed to start utterance:', error);
      this.setState(RecordingState.IDLE);
      this.callbacks?.onError(error instanceof Error ? error : new Error('Failed to start recording'));
    }
  }

  /**
   * Start max duration timer to prevent infinite recordings
   */
  private startMaxDurationTimer(): void {
    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
    }
    
    this.maxDurationTimer = setTimeout(() => {
      if (this.state === RecordingState.RECORDING) {
        console.log('⏰ Max utterance duration reached - stopping');
        this.stopUtterance();
      }
    }, MAX_UTTERANCE_MS);
  }

  /**
   * Reset silence timer when speech is detected
   * This is the ONLY silence detection mechanism
   */
  public resetSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }
    
    // Only set timer if actively recording
    if (this.state === RecordingState.RECORDING) {
      this.lastSpeechTime = new Date();
      
      this.silenceTimer = setTimeout(() => {
        if (this.state === RecordingState.RECORDING) {
          console.log('🔇 Silence detected - stopping utterance');
          this.callbacks?.onSilenceDetected();
          this.stopUtterance();
        }
      }, SILENCE_THRESHOLD_MS);
    }
  }

  /**
   * Called when speech activity is detected
   */
  public onSpeechDetected(): void {
    console.log('🗣️ Speech detected - resetting silence timer');
    this.resetSilenceTimer();
  }

  /**
   * Stop the current utterance recording
   * Guards against multiple stop calls
   */
  public async stopUtterance(): Promise<void> {
    // State machine guard - only stop if recording
    if (this.state !== RecordingState.RECORDING) {
      console.log(`⚠️ Cannot stop: state is ${this.state}`);
      return;
    }

    if (!this.recording) {
      console.log('⚠️ No recording to stop');
      this.setState(RecordingState.IDLE);
      return;
    }

    try {
      this.setState(RecordingState.STOPPING);
      console.log('🛑 Stopping utterance recording...');
      
      // Clear all timers
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }
      
      if (this.maxDurationTimer) {
        clearTimeout(this.maxDurationTimer);
        this.maxDurationTimer = null;
      }
      
      // Stop and get the final URI
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      
      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
      
      // Calculate duration
      const duration = this.recordingStartTime 
        ? Date.now() - this.recordingStartTime.getTime() 
        : 0;
      
      // Clean up recording reference
      this.recording = null;
      
      // Emit utterance chunk if we have a URI
      if (uri && duration > 500) { // Only emit meaningful utterances
        const chunk: UtteranceChunk = {
          uri,
          timestamp: new Date(),
          duration,
        };
        
        console.log(`📦 Utterance #${this.utteranceCount} complete (${duration}ms)`);
        this.callbacks?.onUtteranceComplete(chunk);
        
        // Schedule file cleanup
        this.scheduleFileCleanup(uri);
      }
      
      // Transition back to IDLE
      this.setState(RecordingState.IDLE);
      console.log(`✅ Utterance stopped`);
      
    } catch (error) {
      console.error('❌ Error stopping utterance:', error);
      this.setState(RecordingState.IDLE);
      this.callbacks?.onError(error instanceof Error ? error : new Error('Failed to stop recording'));
    }
  }

  /**
   * Schedule cleanup of audio file after delay
   */
  private scheduleFileCleanup(uri: string): void {
    const timer = setTimeout(async () => {
      try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
        console.log(`🗑️ Cleaned up audio file: ${uri.substring(uri.length - 20)}`);
      } catch (error) {
        console.log('⚠️ Could not delete audio file:', error);
      }
      this.fileCleanupTimers.delete(uri);
    }, FILE_CLEANUP_DELAY_MS);
    
    this.fileCleanupTimers.set(uri, timer);
  }

  /**
   * Clean up all resources
   */
  public async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up VAD service...');
    
    // Stop any active recording
    if (this.state === RecordingState.RECORDING) {
      await this.stopUtterance();
    }
    
    // Clear all file cleanup timers
    for (const timer of this.fileCleanupTimers.values()) {
      clearTimeout(timer);
    }
    this.fileCleanupTimers.clear();
    
    // Reset state
    this.state = RecordingState.IDLE;
    this.callbacks = null;
    this.utteranceCount = 0;
  }
}