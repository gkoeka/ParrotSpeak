/**
 * ConversationSessionService.ts
 * 
 * Purpose: Session-based Conversation Mode with explicit tap-to-arm lifecycle.
 * Privacy-forward: No passive listening, foreground-only, auto-disarm on inactivity.
 * Battery-optimized: Single recording per utterance, auto-cleanup, configurable timeouts.
 * 
 * CRITICAL FIX: Centralized recording control with platform guards and proper Audio.Recording.createAsync usage
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform, AppState } from 'react-native';
import { stopSpeaking } from '../api/speechService';

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
  FOREGROUND_ONLY: true,     // Session ends on background (docs: privacy protection)
  FILE_CLEANUP_DELAY_MS: 10000, // Delete audio files after processing
  STOP_DEBOUNCE_MS: 50,      // Debounce stop requests to prevent races
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
  private static instance: ConversationSessionService | null = null;
  
  private state: SessionState = SessionState.DISARMED;
  private callbacks: SessionCallbacks | null = null;
  private recording: Audio.Recording | null = null;
  
  // CRITICAL FIX: Track stopping state to prevent race conditions
  private isStoppingRecording: boolean = false;
  
  // START MUTEX: Prevent overlapping start attempts
  private startMutex: boolean = false;
  private startToken: number = 0; // Monotonic counter for start attempts
  
  // Timers - use ReturnType for cross-platform compatibility
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private maxDurationTimer: ReturnType<typeof setTimeout> | null = null;
  private autoDisarmTimer: ReturnType<typeof setTimeout> | null = null;
  private stopDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private fileCleanupTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  
  // Tracking
  private sessionStartTime: Date | null = null;
  private recordingStartTime: Date | null = null;
  private lastActivityTime: Date | null = null;
  private utteranceCount: number = 0;
  
  // Atomic operation flags
  private isTransitioning: boolean = false;
  
  // AppState listener for FOREGROUND-ONLY enforcement
  private appStateSubscription: any = null;

  constructor() {
    console.log('🎯 ConversationSessionService: Created');
    this.initializeAppStateListener();
  }
  
  /**
   * Initialize AppState listener for FOREGROUND-ONLY enforcement
   */
  private initializeAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Force disarm when app goes to background
        if (this.state !== SessionState.DISARMED) {
          console.log('📱 [CM] App backgrounded → DISARMED');
          this.forceDisarm('App backgrounded');
        }
      }
    });
    console.log('✅ [CM] AppState listener initialized for foreground-only sessions');
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): ConversationSessionService {
    if (!this.instance) {
      this.instance = new ConversationSessionService();
    }
    return this.instance;
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
    // Check if app is in foreground (FOREGROUND-ONLY enforcement)
    const currentAppState = AppState.currentState;
    if (currentAppState !== 'active') {
      console.warn('⚠️ [CM Start] blocked: app not foreground');
      throw new Error('Cannot start session when app is not in foreground');
    }
    
    if (this.state !== SessionState.DISARMED) {
      console.log(`⚠️ Session already active (${this.state})`);
      return;
    }
    
    console.log('🚀 Starting Conversation Mode session...');
    
    try {
      // Configure audio for recording - FOREGROUND-ONLY configuration
      const audioModeConfig = {
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: false, // Foreground-only. Backgrounding stops recording/session.
        playThroughEarpieceAndroid: false,
        interruptionModeIOS: Audio.InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: Audio.InterruptionModeAndroid.DoNotMix,
      };
      
      console.log('🔊 [CM] Audio mode config:', audioModeConfig);
      await Audio.setAudioModeAsync(audioModeConfig);
      
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
      await this.requestStop('session-end');
      // Wait for debounce to complete
      await new Promise(resolve => setTimeout(resolve, SESSION_CONFIG.STOP_DEBOUNCE_MS + 50));
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
   * Start recording an utterance with source tracking and single-flight guard
   * @param source Where the start request originated from
   * @returns Success/failure with reason
   */
  public async startRecording(source: 'micTap' | 'VAD' | 'probe' = 'micTap'): Promise<{ ok: boolean; reason: string }> {
    // Check state first
    if (this.state !== SessionState.ARMED_IDLE) {
      console.log(`[START] Ignored (state=${this.state}) from ${source}`);
      return { ok: false, reason: 'state' };
    }
    
    // Single-flight guard - prevent overlapping starts
    if (this.startMutex) {
      console.log(`[START] Ignored (in-flight) from ${source}`);
      return { ok: false, reason: 'inflight' };
    }
    
    // Check if already stopping
    if (this.isStoppingRecording) {
      console.log(`[START] Ignored (stopping) from ${source}`);
      return { ok: false, reason: 'stopping' };
    }
    
    // Set mutex and increment token
    this.startMutex = true;
    const token = ++this.startToken;
    console.log(`[START] Attempting start from ${source} (token=${token})`);
    
    // Clear any stray timers BEFORE starting to avoid double-start
    this.clearRecordingTimers();
    
    // FIX 1: Platform guard - only run on native
    if (Platform.OS === 'web') {
      console.error(`[START] Failed - web platform not supported (from ${source})`);
      this.startMutex = false;
      this.callbacks?.onError(new Error('Recording is only supported on iOS and Android'));
      return { ok: false, reason: 'platform' };
    }
    
    console.log(`[START] Platform check passed: ${Platform.OS}`);
    
    // FOREGROUND-ONLY guard: Check if app is in foreground
    const currentAppState = AppState.currentState;
    if (SESSION_CONFIG.FOREGROUND_ONLY && currentAppState !== 'active') {
      console.warn(`⚠️ [CM Start] blocked: app not foreground (from ${source})`);
      this.startMutex = false;
      return { ok: false, reason: 'background' };
    }
    
    try {
      // Stop any TTS playback FIRST
      console.log('[START] Stopping TTS...');
      stopSpeaking();
      
      // Request permissions
      console.log('[START] Requesting permissions...');
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        console.error(`[START] Permission denied (from ${source})`);
        this.startMutex = false;
        throw new Error('Microphone permission denied');
      }
      
      // Set audio mode - FOREGROUND-ONLY configuration
      const audioModeConfig = {
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false, // Foreground-only. Backgrounding stops recording/session.
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        interruptionModeIOS: Audio.InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: Audio.InterruptionModeAndroid.DoNotMix,
      };
      
      console.log('[START] Configuring audio mode:', audioModeConfig);
      await Audio.setAudioModeAsync(audioModeConfig);
      
      // Update state
      await this.setState(SessionState.RECORDING);
      
      // FIX 4: Clean up any stale recording with detailed logging
      if (this.recording) {
        console.log('⚠️ [CLEANUP] Found existing recording, cleaning up...');
        try {
          const status = await this.recording.getStatusAsync();
          console.log(`📊 [CLEANUP] Existing recording status: ${status.isRecording ? 'RECORDING' : 'STOPPED'}`);
          if (status.isRecording) {
            await this.recording.stopAndUnloadAsync();
            console.log('✅ [CLEANUP] Stopped and unloaded existing recording');
          }
        } catch (e) {
          console.log('⚠️ [CLEANUP] Error during cleanup (safe to ignore):', e);
        }
        this.recording = null;
      }
      
      // FIX 6: Assert single instance
      if (this.recording !== null) {
        console.error('❌ [ASSERT] Recording should be null after cleanup');
        throw new Error('Recording instance not properly cleaned up');
      }
      
      // Create recording with createAsync (ONLY place this happens)
      console.log(`[START] Creating recording with createAsync...`);
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        undefined, // No status update callback needed
        undefined  // No metadata update callback needed
      );
      
      // Check if another start superseded this one
      if (token !== this.startToken) {
        console.log(`[START] Superseded by newer start (token ${token} != ${this.startToken}), cleaning up`);
        await recording.stopAndUnloadAsync();
        this.startMutex = false;
        return { ok: false, reason: 'superseded' };
      }
      
      // Success - save recording and update state
      this.recording = recording;
      this.recordingStartTime = new Date();
      this.utteranceCount++;
      
      console.log(`[START] Success from ${source} (utterance #${this.utteranceCount}, token=${token})`);
      
      // Clear mutex BEFORE setting timers
      this.startMutex = false;
      
      // Set up timers
      this.resetSilenceTimer();
      this.setMaxDurationTimer();
      
      return { ok: true, reason: 'started' };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[START] Failed from ${source}: ${errorMessage}`);
      
      // Clean up on error
      this.recording = null;
      this.isStoppingRecording = false;
      this.startMutex = false;
      await this.setState(SessionState.ARMED_IDLE);
      
      // Provide explicit error messages
      if (errorMessage.includes('permission')) {
        this.callbacks?.onError(new Error('Microphone permission denied. Please enable in settings.'));
      } else if (errorMessage.includes('audio mode')) {
        this.callbacks?.onError(new Error('Failed to configure audio mode. Please restart the app.'));
      } else if (errorMessage.includes('createAsync') || errorMessage.includes('Recording object')) {
        this.callbacks?.onError(new Error('Recording conflict detected. Please try again.'));
      } else {
        this.callbacks?.onError(error instanceof Error ? error : new Error('Failed to start recording'));
      }
      
      return { ok: false, reason: 'create-failed' };
    }
  }

  /**
   * Public stop request with debouncing and reason tracking
   * This is the ONLY public way to stop recording - all UI and timers use this
   */
  public async requestStop(reason: string = 'manual'): Promise<void> {
    console.log(`📨 [STOP] Request received (reason: ${reason})`);
    
    // Clear any pending debounced stop
    if (this.stopDebounceTimer) {
      clearTimeout(this.stopDebounceTimer);
      console.log('[STOP] Cleared pending debounce');
    }
    
    // Debounce rapid stop requests
    this.stopDebounceTimer = setTimeout(async () => {
      console.log(`[STOP] Executing debounced stop (${reason})`);
      await this.stopRecordingIdempotent(reason);
    }, SESSION_CONFIG.STOP_DEBOUNCE_MS);
  }

  /**
   * IDEMPOTENT Stop recording - safe to call multiple times
   * Only this method actually stops the recording
   */
  private async stopRecordingIdempotent(reason: string): Promise<void> {
    // Early return if not in a stoppable state
    if (this.state !== SessionState.RECORDING && this.state !== SessionState.STOPPING) {
      console.log(`[STOP] Ignored (state not recording): ${this.state}`);
      return;
    }
    
    // Check atomic flag
    if (this.isStoppingRecording) {
      console.log('[STOP] Already stopping');
      return;
    }
    
    // Set atomic flag
    this.isStoppingRecording = true;
    
    try {
      // Clear ALL timers BEFORE stopping to prevent cascade calls
      this.clearAllRecordingTimers();
      
      // Check if recording exists
      if (!this.recording) {
        console.log('[STOP] Already cleared recorder');
        this.isStoppingRecording = false;
        await this.setState(SessionState.ARMED_IDLE);
        return;
      }
      
      // Transition to stopping state
      await this.setState(SessionState.STOPPING);
      
      // Try to get recording status (may fail if already stopped)
      let isRecording = false;
      try {
        const status = await this.recording.getStatusAsync();
        isRecording = status?.isRecording || false;
        console.log(`[STOP] Status check: ${isRecording ? 'still recording' : 'already stopped'}`);
      } catch (statusError) {
        console.log('[STOP] Status check failed (likely already stopped)');
      }
      
      // Get URI before attempting stop (may be null if recorder destroyed)
      let uri: string | null = null;
      try {
        uri = this.recording.getURI();
        console.log(`[STOP] URI retrieved: ${uri ? 'Valid' : 'NULL'}`);
      } catch (uriError) {
        console.log('[STOP] URI retrieval failed');
      }
      
      // Only stop if actually recording
      if (isRecording) {
        try {
          console.log('[STOP] Calling stopAndUnloadAsync...');
          await this.recording.stopAndUnloadAsync();
          console.log('[STOP] Successfully stopped');
        } catch (stopError) {
          const errorMsg = stopError instanceof Error ? stopError.message : 'Unknown';
          
          // Check if it's the "already stopped" error
          if (errorMsg.includes('Recorder does not exist')) {
            console.log('[STOP] Already stopped (native)');
          } else {
            // Real error - rethrow
            throw stopError;
          }
        }
      } else {
        console.log('[STOP] Already stopped (status)');
      }
      
      // Calculate duration if we have timestamps
      const duration = this.recordingStartTime 
        ? Date.now() - this.recordingStartTime.getTime()
        : 0;
      
      // Log completion
      console.log(`[STOP] Completed, uri=${uri || 'null'}, duration=${duration}ms, reason=${reason}`);
      
      // Process if we have a valid URI and duration
      if (uri && duration >= SESSION_CONFIG.MIN_SPEECH_MS) {
        await this.setState(SessionState.PROCESSING);
        this.callbacks?.onUtteranceReady(uri, duration);
        this.scheduleFileCleanup(uri);
      } else if (duration < SESSION_CONFIG.MIN_SPEECH_MS) {
        console.log(`[STOP] Too short (${duration}ms), discarding`);
        await this.setState(SessionState.ARMED_IDLE);
      } else {
        console.log('[STOP] No URI available, returning to armed state');
        await this.setState(SessionState.ARMED_IDLE);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[STOP] Error during stop: ${errorMessage}`);
      
      // Don't propagate "Recorder does not exist" errors
      if (!errorMessage.includes('Recorder does not exist')) {
        this.callbacks?.onError(error instanceof Error ? error : new Error('Failed to stop recording'));
      }
      
      await this.setState(SessionState.ARMED_IDLE);
      
    } finally {
      // Always clean up
      this.recording = null;
      this.isStoppingRecording = false;
    }
  }

  /**
   * Clear all recording-related timers
   */
  private clearAllRecordingTimers(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = null;
    }
    if (this.stopDebounceTimer) {
      clearTimeout(this.stopDebounceTimer);
      this.stopDebounceTimer = null;
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
      this.requestStop('silence-timeout');
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
      this.requestStop('max-duration');
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
   * Force disarm the session (used when app backgrounds)
   */
  private async forceDisarm(reason: string): void {
    console.log(`⚠️ Force disarming session: ${reason}`);
    
    // Clear all timers immediately
    this.clearAllTimers();
    
    // Stop recording if active
    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch (error) {
        console.error('Error stopping recording during force disarm:', error);
      }
      this.recording = null;
    }
    
    // Reset state
    this.state = SessionState.DISARMED;
    this.callbacks?.onStateChange(SessionState.DISARMED);
    this.callbacks?.onSessionEnd();
    this.callbacks?.onAutoDisarm?.(reason);
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