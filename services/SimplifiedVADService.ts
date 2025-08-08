/**
 * SimplifiedVADService.ts
 * 
 * Purpose: Simplified Voice Activity Detection using a single continuous recording
 * with timer-based processing instead of multiple recording instances.
 */

import { Audio } from 'expo-av';

// Phase 1 Configuration
const SILENCE_THRESHOLD_MS = 2000; // 2 seconds of silence
const PROCESS_INTERVAL_MS = 2000;  // Process audio every 2 seconds

export interface AudioSegment {
  uri: string;
  timestamp: Date;
  duration: number;
  isProcessed: boolean;
}

export interface SimplifiedVADCallbacks {
  onRecordingStart: () => void;
  onSegmentReady: (segment: AudioSegment) => void;
  onSilenceDetected: () => void;
  onRecordingStop: (finalUri: string) => void;
  onError: (error: Error) => void;
}

export class SimplifiedVADService {
  private recording: Audio.Recording | null = null;
  private isRecording: boolean = false;
  private callbacks: SimplifiedVADCallbacks | null = null;
  
  // Timers
  private processTimer: NodeJS.Timeout | null = null;
  private silenceTimer: NodeJS.Timeout | null = null;
  
  // Tracking
  private recordingStartTime: Date | null = null;
  private lastProcessTime: Date | null = null;
  private segmentCount: number = 0;

  /**
   * Initialize the service with callbacks
   */
  public async initialize(callbacks: SimplifiedVADCallbacks): Promise<void> {
    console.log('🎤 SimplifiedVAD: Initializing...');
    
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Microphone permission not granted');
      }
      
      this.callbacks = callbacks;
      console.log('✅ SimplifiedVAD: Initialized');
    } catch (error) {
      console.error('❌ SimplifiedVAD: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Start a single continuous recording
   */
  public async startRecording(): Promise<void> {
    if (this.isRecording) {
      console.log('⚠️ Already recording');
      return;
    }

    try {
      console.log('🎤 Starting continuous recording...');
      
      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      // Create and start single recording
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
      
      this.isRecording = true;
      this.recordingStartTime = new Date();
      this.lastProcessTime = new Date();
      this.segmentCount = 0;
      
      this.callbacks?.onRecordingStart();
      
      // Start processing timer (every 2 seconds)
      this.startProcessingTimer();
      
      // Start silence detection
      this.resetSilenceTimer();
      
      console.log('✅ Recording started');
      
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      this.isRecording = false;
      this.callbacks?.onError(error instanceof Error ? error : new Error('Failed to start recording'));
    }
  }

  /**
   * Process audio segments every 2 seconds without stopping recording
   */
  private startProcessingTimer(): void {
    this.processTimer = setInterval(() => {
      if (this.isRecording && this.recording) {
        const now = new Date();
        const duration = this.lastProcessTime ? now.getTime() - this.lastProcessTime.getTime() : 0;
        
        // Get current URI without stopping
        const uri = this.recording.getURI();
        if (uri) {
          this.segmentCount++;
          const segment: AudioSegment = {
            uri,
            timestamp: now,
            duration,
            isProcessed: false,
          };
          
          console.log(`📦 Segment #${this.segmentCount} ready (${duration}ms)`);
          this.callbacks?.onSegmentReady(segment);
          this.lastProcessTime = now;
        }
      }
    }, PROCESS_INTERVAL_MS);
  }

  /**
   * Reset silence timer when speech is detected
   */
  public resetSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }
    
    this.silenceTimer = setTimeout(() => {
      if (this.isRecording) {
        console.log('🔇 Silence detected - stopping recording');
        this.callbacks?.onSilenceDetected();
        this.stopRecording();
      }
    }, SILENCE_THRESHOLD_MS);
  }

  /**
   * Stop the recording and clean up
   */
  public async stopRecording(): Promise<void> {
    if (!this.isRecording || !this.recording) {
      console.log('⚠️ Not recording');
      return;
    }

    try {
      console.log('🛑 Stopping recording...');
      
      // Clear timers
      if (this.processTimer) {
        clearInterval(this.processTimer);
        this.processTimer = null;
      }
      
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }
      
      // Stop recording
      const uri = this.recording.getURI();
      await this.recording.stopAndUnloadAsync();
      
      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
      
      this.isRecording = false;
      this.recording = null;
      
      if (uri) {
        this.callbacks?.onRecordingStop(uri);
      }
      
      console.log(`✅ Recording stopped (${this.segmentCount} segments)`);
      
    } catch (error) {
      console.error('❌ Error stopping recording:', error);
      this.callbacks?.onError(error instanceof Error ? error : new Error('Failed to stop recording'));
    }
  }

  /**
   * Clean up resources
   */
  public async cleanup(): Promise<void> {
    await this.stopRecording();
    this.callbacks = null;
  }
}