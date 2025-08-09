/**
 * ConversationSessionService.ts
 * 
 * Purpose: Session-based Conversation Mode with explicit tap-to-arm lifecycle.
 * Privacy-forward: No passive listening, foreground-only, auto-disarm on inactivity.
 * Battery-optimized: Single recording per utterance, auto-cleanup, configurable timeouts.
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

// Session states for explicit lifecycle
export enum SessionState {
  DISARMED = 'DISARMED',       // No listening, mic closed
  ARMED_IDLE = 'ARMED_IDLE',   // Session active, waiting for speech
  RECORDING = 'RECORDING',      // Actively recording speech
  STOPPING = 'STOPPING',        // Stopping recording
  PROCESSING = 'PROCESSING'     // Processing audio (transcription/translation)
}

// Configuration constants (tunable)
export const SESSION_CONFIG = {
  START_HOLD_MS: 400,        // Time to hold VAD above threshold to start
  STOP_SILENCE_MS: 2000,     // Silence duration to stop recording
  MIN_SPEECH_MS: 500,        // Minimum utterance duration to process
  MAX_UTTERANCE_MS: 20000,   // Maximum recording duration
  AUTO_DISARM_MS: 60000,     // Auto-disarm after inactivity
  FOREGROUND_ONLY: true,     // Session ends on background
  FILE_CLEANUP_DELAY_MS: 10000, // Delete audio files after processing
};

export interface SessionCallbacks {
  onSessionStart: () => void;
  onSessionEnd: () => void;
  onRecordingStart: () => void;
  onRecordingStop: () => void;
  onUtteranceReady: (uri: string, duration: number) => void;
  onProcessingStart: () => void;
  onProcessingComplete: () => void;
  onStateChange: (state: SessionState) => void;
  onError: (error: Error) => void;
  onAutoDisarm?: (reason: string) => void;
}

export class ConversationSessionService {
  private state: SessionState = SessionState.DISARMED;
  private callbacks: SessionCallbacks | null = null;
  private recording: Audio.Recording | null = null;
  
  // Timers - use ReturnType for cross-platform compatibility
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private maxDurationTimer: ReturnType<typeof setTimeout> | null = null;
  private autoDisarmTimer: ReturnType<typeof setTimeout> | null = null;
  private fileCleanupTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  
  // Tracking
  private sessionStartTime: Date | null = null;
  private recordingStartTime: Date | null = null;
  private lastActivityTime: Date | null = null;
  private utteranceCount: number = 0;
  
  // Atomic operation flags
  private isTransitioning: boolean = false;

  constructor() {
    console.log('🎯 ConversationSessionService: Created');
  }

  /**
   * Initialize with callbacks
   */
  public async initialize(callbacks: SessionCallbacks): Promise<void> {
    console.log('🔧 Session: Initializing...');
    
    // Check permissions
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Microphone permission required for Conversation Mode');
    }
    
    this.callbacks = callbacks;
    console.log('✅ Session: Initialized');
  }

  /**
   * Get current state
   */
  public getState(): SessionState {
    return this.state;
  }

  /**
   * Check if session is armed (active)
   */
  public isArmed(): boolean {
    return this.state !== SessionState.DISARMED;
  }

  /**
   * State transition with guards
   */
  private async setState(newState: SessionState): Promise<void> {
    if (this.isTransitioning) {
      console.log(`⚠️ State transition in progress, ignoring ${newState}`);
      return;
    }
    
    const oldState = this.state;
    
    // Validate transitions
    if (!this.isValidTransition(oldState, newState)) {
      console.log(`❌ Invalid transition: ${oldState} → ${newState}`);
      return;
    }
    
    this.isTransitioning = true;
    console.log(`🔄 Session State: ${oldState} → ${newState}`);
    
    try {
      this.state = newState;
      this.callbacks?.onStateChange(newState);
      
      // Handle state-specific actions
      switch (newState) {
        case SessionState.ARMED_IDLE:
          this.resetAutoDisarmTimer();
          break;
          
        case SessionState.RECORDING:
          this.callbacks?.onRecordingStart();
          break;
          
        case SessionState.STOPPING:
          this.callbacks?.onRecordingStop();
          break;
          
        case SessionState.PROCESSING:
          this.callbacks?.onProcessingStart();
          break;
          
        case SessionState.DISARMED:
          this.clearAllTimers();
          break;
      }
    } finally {
      this.isTransitioning = false;
    }
  }

  /**
   * Validate state transitions
   */
  private isValidTransition(from: SessionState, to: SessionState): boolean {
    const validTransitions: Record<SessionState, SessionState[]> = {
      [SessionState.DISARMED]: [SessionState.ARMED_IDLE],
      [SessionState.ARMED_IDLE]: [SessionState.RECORDING, SessionState.DISARMED],
      [SessionState.RECORDING]: [SessionState.STOPPING],
      [SessionState.STOPPING]: [SessionState.PROCESSING],
      [SessionState.PROCESSING]: [SessionState.ARMED_IDLE, SessionState.DISARMED],
    };
    
    return validTransitions[from]?.includes(to) ?? false;
  }

  /**
   * Start a conversation session (tap to arm)
   */
  public async startSession(): Promise<void> {
    if (this.state !== SessionState.DISARMED) {
      console.log(`⚠️ Session already active (${this.state})`);
      return;
    }
    
    console.log('🚀 Starting Conversation Mode session...');
    
    try {
      // Configure audio for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: false, // Foreground only
        playThroughEarpieceAndroid: false,
      });
      
      this.sessionStartTime = new Date();
      this.lastActivityTime = new Date();
      this.utteranceCount = 0;
      
      await this.setState(SessionState.ARMED_IDLE);
      this.callbacks?.onSessionStart();
      
      console.log('✅ Session armed - tap to speak or wait for speech');
      
    } catch (error) {
      console.error('❌ Failed to start session:', error);
      this.callbacks?.onError(error instanceof Error ? error : new Error('Failed to start session'));
    }
  }

  /**
   * End the conversation session
   */
  public async endSession(reason: string = 'user'): Promise<void> {
    if (this.state === SessionState.DISARMED) {
      console.log('⚠️ Session already disarmed');
      return;
    }
    
    console.log(`🛑 Ending session (reason: ${reason})...`);
    
    // Stop any active recording
    if (this.state === SessionState.RECORDING) {
      await this.stopRecording();
    }
    
    // Clean up
    await this.cleanup();
    
    await this.setState(SessionState.DISARMED);
    this.callbacks?.onSessionEnd();
    
    if (reason === 'auto-disarm') {
      this.callbacks?.onAutoDisarm?.(reason);
    }
    
    console.log('✅ Session disarmed');
  }

  /**
   * Handle speech detected (reset silence timer)
   */
  public onSpeechDetected(): void {
    if (this.state !== SessionState.RECORDING) return;
    
    console.log('🗣️ Speech detected - resetting silence timer');
    this.resetSilenceTimer();
    this.lastActivityTime = new Date();
  }

  /**
   * Start recording an utterance
   */
  public async startRecording(): Promise<void> {
    if (this.state !== SessionState.ARMED_IDLE) {
      console.log(`⚠️ Cannot start recording from ${this.state}`);
      return;
    }
    
    try {
      await this.setState(SessionState.RECORDING);
      
      // Clean up any stale recording
      if (this.recording) {
        try {
          const status = await this.recording.getStatusAsync();
          if (status.isRecording) {
            await this.recording.stopAndUnloadAsync();
          }
        } catch (e) {
          // Ignore cleanup errors
        }
        this.recording = null;
      }
      
      // Create new recording
      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await this.recording.startAsync();
      
      this.recordingStartTime = new Date();
      this.utteranceCount++;
      
      console.log(`🎤 Recording utterance #${this.utteranceCount}`);
      
      // Set up timers
      this.resetSilenceTimer();
      this.setMaxDurationTimer();
      
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      await this.setState(SessionState.ARMED_IDLE);
      this.callbacks?.onError(error instanceof Error ? error : new Error('Failed to start recording'));
    }
  }

  /**
   * Stop recording and get URI
   */
  private async stopRecording(): Promise<void> {
    if (this.state !== SessionState.RECORDING) return;
    
    await this.setState(SessionState.STOPPING);
    
    try {
      // Clear timers
      this.clearRecordingTimers();
      
      if (!this.recording) {
        throw new Error('No recording to stop');
      }
      
      // Stop and get URI
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      
      if (!uri) {
        throw new Error('No URI from recording');
      }
      
      // Calculate duration
      const duration = this.recordingStartTime 
        ? Date.now() - this.recordingStartTime.getTime()
        : 0;
      
      console.log(`📦 Utterance #${this.utteranceCount} stopped (${duration}ms)`);
      
      // Check minimum duration
      if (duration < SESSION_CONFIG.MIN_SPEECH_MS) {
        console.log(`⚠️ Utterance too short (${duration}ms < ${SESSION_CONFIG.MIN_SPEECH_MS}ms), discarding`);
        await this.setState(SessionState.ARMED_IDLE);
        return;
      }
      
      // Process the utterance
      await this.setState(SessionState.PROCESSING);
      this.callbacks?.onUtteranceReady(uri, duration);
      
      // Schedule file cleanup
      this.scheduleFileCleanup(uri);
      
      // Clean up recording reference
      this.recording = null;
      
    } catch (error) {
      console.error('❌ Error stopping recording:', error);
      this.callbacks?.onError(error instanceof Error ? error : new Error('Failed to stop recording'));
      await this.setState(SessionState.ARMED_IDLE);
    }
  }

  /**
   * Mark processing as complete and return to armed state
   */
  public async onProcessingComplete(): Promise<void> {
    if (this.state !== SessionState.PROCESSING) {
      console.log(`⚠️ Not in PROCESSING state (${this.state})`);
      return;
    }
    
    this.callbacks?.onProcessingComplete();
    await this.setState(SessionState.ARMED_IDLE);
    this.lastActivityTime = new Date();
  }

  /**
   * Reset auto-disarm timer
   */
  private resetAutoDisarmTimer(): void {
    if (this.autoDisarmTimer) {
      clearTimeout(this.autoDisarmTimer);
    }
    
    this.autoDisarmTimer = setTimeout(() => {
      console.log('⏰ Auto-disarming due to inactivity');
      this.endSession('auto-disarm');
    }, SESSION_CONFIG.AUTO_DISARM_MS);
  }

  /**
   * Reset silence detection timer
   */
  private resetSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }
    
    this.silenceTimer = setTimeout(() => {
      console.log('🔇 Silence detected - stopping recording');
      this.stopRecording();
    }, SESSION_CONFIG.STOP_SILENCE_MS);
  }

  /**
   * Set maximum duration timer
   */
  private setMaxDurationTimer(): void {
    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
    }
    
    this.maxDurationTimer = setTimeout(() => {
      console.log('⏰ Max duration reached - stopping recording');
      this.stopRecording();
    }, SESSION_CONFIG.MAX_UTTERANCE_MS);
  }

  /**
   * Clear recording timers
   */
  private clearRecordingTimers(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    
    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = null;
    }
  }

  /**
   * Clear all timers
   */
  private clearAllTimers(): void {
    this.clearRecordingTimers();
    
    if (this.autoDisarmTimer) {
      clearTimeout(this.autoDisarmTimer);
      this.autoDisarmTimer = null;
    }
    
    // Clear file cleanup timers
    for (const timer of this.fileCleanupTimers.values()) {
      clearTimeout(timer);
    }
    this.fileCleanupTimers.clear();
  }

  /**
   * Schedule file cleanup
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
    }, SESSION_CONFIG.FILE_CLEANUP_DELAY_MS);
    
    this.fileCleanupTimers.set(uri, timer);
  }

  /**
   * Clean up all resources
   */
  private async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up session...');
    
    // Clear all timers
    this.clearAllTimers();
    
    // Force cleanup any recording
    if (this.recording) {
      try {
        const status = await this.recording.getStatusAsync();
        if (status.isRecording) {
          await this.recording.stopAndUnloadAsync();
        }
      } catch (e) {
        // Ignore errors during cleanup
      }
      this.recording = null;
    }
    
    // Reset tracking
    this.sessionStartTime = null;
    this.recordingStartTime = null;
    this.lastActivityTime = null;
    this.utteranceCount = 0;
  }

  /**
   * Handle app going to background (immediate disarm)
   */
  public onAppBackground(): void {
    if (this.isArmed()) {
      console.log('📱 App backgrounded - ending session');
      this.endSession('app-background');
    }
  }

  /**
   * Handle navigation away from chat (immediate disarm)
   */
  public onNavigateAway(): void {
    if (this.isArmed()) {
      console.log('🔄 Navigated away - ending session');
      this.endSession('navigation');
    }
  }
}