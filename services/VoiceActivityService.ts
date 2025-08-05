/**
 * VoiceActivityService.ts
 * 
 * Purpose: Manages microphone input, voice activity detection (VAD), silence detection,
 * and chunked audio output for the always listening functionality. This service handles
 * the low-level audio processing pipeline including continuous recording, noise filtering,
 * and speech segment extraction.
 */

import { Audio } from 'expo-av';

// Phase 1 Configuration Constants
const SILENCE_THRESHOLD_DB = -50;
const MIN_SPEECH_DURATION_MS = 500;
const MAX_SILENCE_DURATION_MS = 2000;
const CHUNK_DURATION_MS = 2000;

export interface AudioChunk {
  uri: string;
  duration: number;
  timestamp: Date;
  silenceDuration: number;
  confidenceScore: number;
}

export interface VoiceActivityConfig {
  silenceThreshold: number;        // dB level to consider silence
  minSpeechDuration: number;       // minimum ms of speech to process
  maxSilenceDuration: number;      // ms of silence before considering speaker switch
  chunkSize: number;               // audio chunk size in ms
  noiseFilterEnabled: boolean;     // enable background noise filtering
}

export interface VoiceActivityCallbacks {
  onSpeechStart: () => void;
  onSpeechEnd: (chunk: AudioChunk) => void;
  onSilenceDetected: (duration: number) => void;
  onError: (error: Error) => void;
}

export class VoiceActivityService {
  private isListening: boolean = false;
  private recording: Audio.Recording | null = null;
  private config: VoiceActivityConfig;
  private callbacks: VoiceActivityCallbacks | null = null;
  private silenceTimer: NodeJS.Timeout | null = null;
  private lastSpeechTime: Date | null = null;
  private isSpeechActive: boolean = false;
  private speechStartTime: Date | null = null;

  private audioAnalysisInterval: NodeJS.Timeout | null = null;
  private chunkStartTime: Date | null = null;

  constructor(config?: Partial<VoiceActivityConfig>) {
    this.config = {
      silenceThreshold: SILENCE_THRESHOLD_DB,
      minSpeechDuration: MIN_SPEECH_DURATION_MS,
      maxSilenceDuration: MAX_SILENCE_DURATION_MS,
      chunkSize: CHUNK_DURATION_MS,
      noiseFilterEnabled: true,
      ...config
    };
  }

  /**
   * Initialize voice activity detection with callback handlers
   * Phase 1 - Set up audio permissions and initialize recording
   * @param callbacks Event handlers for voice activity events
   */
  public async initialize(callbacks: VoiceActivityCallbacks): Promise<void> {
    console.log('🎤 VoiceActivityService: Initializing...');
    
    try {
      // Request microphone permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Microphone permission not granted');
      }
      console.log('✅ VoiceActivityService: Microphone permissions granted');

      // Configure audio recording settings for continuous recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      console.log('✅ VoiceActivityService: Audio mode configured');

      this.callbacks = callbacks;
      console.log('✅ VoiceActivityService: Initialization complete');
    } catch (error) {
      console.error('❌ VoiceActivityService: Initialization failed:', error);
      this.callbacks?.onError(error instanceof Error ? error : new Error('Initialization failed'));
      throw error;
    }
  }

  /**
   * Start continuous voice activity detection
   * Phase 1 - Begin continuous audio capture and analysis
   */
  public async startListening(): Promise<void> {
    if (this.isListening) {
      console.log('⚠️ VoiceActivityService: Already listening');
      return;
    }

    try {
      console.log('🎤 VoiceActivityService: Starting continuous listening...');
      
      // Create new recording instance
      this.recording = new Audio.Recording();
      
      // Configure recording options for VAD with proper Expo AV constants
      const recordingOptions = {
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
      };

      // Start recording
      await this.recording.prepareToRecordAsync(recordingOptions);
      await this.recording.startAsync();
      
      this.isListening = true;
      this.chunkStartTime = new Date();
      console.log('✅ VoiceActivityService: Mic started');

      // Begin audio level monitoring for VAD
      this.startAudioAnalysis();
      
    } catch (error) {
      console.error('❌ VoiceActivityService: Failed to start listening:', error);
      this.isListening = false;
      this.callbacks?.onError(error instanceof Error ? error : new Error('Failed to start listening'));
      throw error;
    }
  }

  /**
   * Stop voice activity detection and clean up resources
   * Phase 1 - Clean shutdown of audio processing
   */
  public async stopListening(): Promise<void> {
    if (!this.isListening) {
      console.log('⚠️ VoiceActivityService: Not currently listening');
      return;
    }

    try {
      console.log('🛑 VoiceActivityService: Stopping listening...');
      
      // Clear timers
      this.clearTimers();
      
      // Stop audio analysis
      if (this.audioAnalysisInterval) {
        clearInterval(this.audioAnalysisInterval);
        this.audioAnalysisInterval = null;
      }

      // Stop and clean up recording
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
      }

      // Reset state
      this.isListening = false;
      this.isSpeechActive = false;
      this.speechStartTime = null;
      this.chunkStartTime = null;
      this.lastSpeechTime = null;

      console.log('✅ VoiceActivityService: Mic stopped');
      
    } catch (error) {
      console.error('❌ VoiceActivityService: Error stopping listening:', error);
      this.callbacks?.onError(error instanceof Error ? error : new Error('Failed to stop listening'));
    }
  }

  /**
   * Start audio level monitoring for voice activity detection
   * Phase 1 - Implement basic VAD using audio level thresholds
   */
  private startAudioAnalysis(): void {
    // Monitor audio levels every 100ms for responsive VAD
    this.audioAnalysisInterval = setInterval(async () => {
      if (!this.recording || !this.isListening) return;

      try {
        // Get current recording status with audio level
        const status = await this.recording.getStatusAsync();
        if (status.isRecording && status.metering !== undefined) {
          const audioLevel = status.metering; // This is in dB, typically -160 to 0
          await this.processAudioLevel(audioLevel);
        }
      } catch (error) {
        console.error('❌ VoiceActivityService: Error in audio analysis:', error);
      }
    }, 100); // 100ms intervals for responsive detection
  }

  /**
   * Process audio level for voice activity detection
   * Phase 1 - Implement core VAD algorithm using volume thresholds
   * @param audioLevel Current audio level in dB
   */
  private async processAudioLevel(audioLevel: number): Promise<void> {
    const now = new Date();
    const hasSpeech = audioLevel > this.config.silenceThreshold;

    if (hasSpeech && !this.isSpeechActive) {
      // Speech detected - start of speech
      this.onSpeechDetected();
    } else if (!hasSpeech && this.isSpeechActive) {
      // Silence detected - potential end of speech
      this.startSilenceTimer();
    } else if (hasSpeech && this.isSpeechActive) {
      // Continuing speech - reset silence timer
      this.clearSilenceTimer();
      this.lastSpeechTime = now;
    }

    // Check if we should create a chunk based on duration
    if (this.chunkStartTime && (now.getTime() - this.chunkStartTime.getTime()) >= this.config.chunkSize) {
      await this.createAudioChunk();
    }
  }

  /**
   * Handle detected speech start event
   * Phase 1 - Manage speech start detection
   */
  private onSpeechDetected(): void {
    const now = new Date();
    
    // Clear any existing silence timer
    this.clearSilenceTimer();
    
    // Mark speech as active
    this.isSpeechActive = true;
    this.speechStartTime = now;
    this.lastSpeechTime = now;
    
    console.log('🗣️ VoiceActivityService: Speech detected');
    
    // Notify callbacks
    this.callbacks?.onSpeechStart();
  }

  /**
   * Handle detected speech end event
   * Phase 1 - Manage speech end detection and chunk creation
   */
  private async onSpeechEnded(): Promise<void> {
    if (!this.isSpeechActive || !this.speechStartTime) return;

    const now = new Date();
    const speechDuration = now.getTime() - this.speechStartTime.getTime();
    
    // Only process if speech duration meets minimum threshold
    if (speechDuration >= this.config.minSpeechDuration) {
      console.log(`🔇 VoiceActivityService: Speech ended (${speechDuration}ms)`);
      
      // Create audio chunk for the completed speech
      await this.createAudioChunk();
    }
    
    // Reset speech state
    this.isSpeechActive = false;
    this.speechStartTime = null;
  }

  /**
   * Start silence timer for speech end detection
   * Phase 1 - Implement silence timeout detection
   */
  private startSilenceTimer(): void {
    // Clear any existing timer
    this.clearSilenceTimer();
    
    // Start new silence timer
    this.silenceTimer = setTimeout(() => {
      this.onSilenceTimeout();
    }, this.config.maxSilenceDuration);
  }

  /**
   * Clear silence timer
   * Phase 1 - Timer management
   */
  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  /**
   * Clear all timers
   * Phase 1 - Cleanup helper
   */
  private clearTimers(): void {
    this.clearSilenceTimer();
  }

  /**
   * Handle silence timeout for speech end detection
   * Phase 1 - Implement silence timeout detection
   */
  private async onSilenceTimeout(): Promise<void> {
    const now = new Date();
    const silenceDuration = this.config.maxSilenceDuration;
    
    console.log(`⏰ VoiceActivityService: Silence timeout reached (${silenceDuration}ms) at ${now.toISOString()}`);
    
    // End current speech if active
    if (this.isSpeechActive) {
      await this.onSpeechEnded();
    }
    
    // Notify callbacks of silence detection
    this.callbacks?.onSilenceDetected(silenceDuration);
  }

  /**
   * Update voice activity detection configuration
   * TODO: Phase 3 - Allow runtime configuration updates
   * @param newConfig Partial configuration to update
   */
  public updateConfig(newConfig: Partial<VoiceActivityConfig>): void {
    // TODO: Validate new configuration values
    // TODO: Apply configuration changes
    // TODO: Restart VAD if necessary
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current voice activity detection status
   * TODO: Phase 1 - Provide status information for UI
   */
  public getStatus(): {
    isListening: boolean;
    lastSpeechTime: Date | null;
    currentConfig: VoiceActivityConfig;
  } {
    return {
      isListening: this.isListening,
      lastSpeechTime: this.lastSpeechTime,
      currentConfig: this.config
    };
  }

  /**
   * Create audio chunk from current recording
   * Phase 3 - Extract real audio data for downstream processing
   */
  private async createAudioChunk(): Promise<void> {
    if (!this.recording || !this.chunkStartTime) return;

    try {
      const now = new Date();
      const chunkDuration = now.getTime() - this.chunkStartTime.getTime();
      
      // Get current recording status
      const status = await this.recording.getStatusAsync();
      if (!status.isRecording) return;

      // Phase 3: Extract real audio chunk
      // Stop current recording to get the audio file
      await this.recording.stopAndUnloadAsync();
      const recordingUri = this.recording.getURI();
      
      if (!recordingUri) {
        console.error('❌ VoiceActivityService: No recording URI available');
        return;
      }

      // Create real AudioChunk with actual audio file
      const audioChunk: AudioChunk = {
        uri: recordingUri,
        duration: chunkDuration,
        timestamp: this.chunkStartTime,
        silenceDuration: this.isSpeechActive ? 0 : this.config.maxSilenceDuration,
        confidenceScore: this.isSpeechActive ? 0.8 : 0.2,
      };

      console.log('📦 VoiceActivityService: Audio chunk extracted:', {
        duration: `${chunkDuration}ms`,
        timestamp: audioChunk.timestamp.toISOString(),
        hasSpeech: this.isSpeechActive,
        uri: audioChunk.uri,
        fileExists: !!recordingUri
      });

      // Notify callback with real audio chunk
      this.callbacks?.onSpeechEnd(audioChunk);

      // Start a new recording for the next chunk
      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await this.recording.startAsync();
      
      // Reset chunk timing
      this.chunkStartTime = now;
      
    } catch (error) {
      console.error('❌ VoiceActivityService: Error creating audio chunk:', error);
      
      // Try to restart recording if it failed
      try {
        this.recording = new Audio.Recording();
        await this.recording.prepareToRecordAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        await this.recording.startAsync();
        this.chunkStartTime = new Date();
      } catch (restartError) {
        console.error('❌ VoiceActivityService: Failed to restart recording:', restartError);
        this.callbacks?.onError(new Error('Failed to restart recording'));
      }
    }
  }

  /**
   * Clean up resources when service is destroyed
   * Phase 1 - Ensure proper cleanup
   */
  public async dispose(): Promise<void> {
    console.log('🧹 VoiceActivityService: Disposing...');
    
    try {
      // Stop listening if active
      if (this.isListening) {
        await this.stopListening();
      }
      
      // Clear all timers and callbacks
      this.clearTimers();
      if (this.audioAnalysisInterval) {
        clearInterval(this.audioAnalysisInterval);
        this.audioAnalysisInterval = null;
      }
      
      // Reset all internal state
      this.callbacks = null;
      
      console.log('✅ VoiceActivityService: Disposal complete');
      
    } catch (error) {
      console.error('❌ VoiceActivityService: Error during disposal:', error);
    }
  }
}

export default VoiceActivityService;