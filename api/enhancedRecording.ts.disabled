/**
 * Enhanced recording service with real-time silence detection
 * for automatic processing after 2 seconds of silence
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export interface RecordingOptions {
  onSilenceDetected?: (duration: number) => void;
  onAudioLevel?: (level: number) => void;
  onSpeechDetected?: () => void;
  silenceThreshold?: number; // dB level for silence detection
  silenceDuration?: number; // ms of silence before auto-stop
}

class EnhancedRecordingService {
  private recording: Audio.Recording | null = null;
  private audioLevelInterval: NodeJS.Timeout | null = null;
  private silenceStartTime: number | null = null;
  private lastSpeechTime: number = Date.now();
  private options: RecordingOptions = {};
  private isMonitoring: boolean = false;
  
  // Default configuration
  private readonly SILENCE_THRESHOLD = -40; // dB level for silence
  private readonly SILENCE_DURATION = 2000; // 2 seconds
  private readonly MONITOR_INTERVAL = 100; // Check every 100ms
  
  /**
   * Start recording with silence detection
   */
  async startRecording(options: RecordingOptions = {}): Promise<{ uri: string }> {
    try {
      this.options = {
        silenceThreshold: this.SILENCE_THRESHOLD,
        silenceDuration: this.SILENCE_DURATION,
        ...options
      };
      
      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Audio recording permission not granted');
      }
      
      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
      
      // Create and configure recording
      this.recording = new Audio.Recording();
      
      // Configure for real-time monitoring
      const recordingOptions = {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        ios: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        android: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        keepAudioActiveHint: true,
      };
      
      await this.recording.prepareToRecordAsync(recordingOptions);
      
      // Set up status update callback for monitoring
      this.recording.setOnRecordingStatusUpdate(this.handleStatusUpdate.bind(this));
      
      await this.recording.startAsync();
      
      // Start monitoring audio levels
      this.startAudioMonitoring();
      
      console.log('Enhanced recording started with silence detection');
      return { uri: this.recording.getURI() || '' };
      
    } catch (error) {
      console.error('Error starting enhanced recording:', error);
      throw error;
    }
  }
  
  /**
   * Stop recording and return the audio file
   */
  async stopRecording(): Promise<{ uri: string; duration?: number }> {
    try {
      if (!this.recording) {
        throw new Error('No recording in progress');
      }
      
      // Stop monitoring
      this.stopAudioMonitoring();
      
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      const status = await this.recording.getStatusAsync();
      
      // Reset recording instance
      this.recording = null;
      this.silenceStartTime = null;
      
      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
      
      console.log('Enhanced recording stopped:', uri);
      return { 
        uri: uri || '', 
        duration: status && status.durationMillis ? status.durationMillis : undefined 
      };
      
    } catch (error) {
      console.error('Error stopping enhanced recording:', error);
      this.recording = null;
      this.stopAudioMonitoring();
      throw error;
    }
  }
  
  /**
   * Handle recording status updates for audio level monitoring
   */
  private handleStatusUpdate(status: Audio.RecordingStatus) {
    if (!status.isRecording || !this.isMonitoring) return;
    
    // Get current audio level (metering)
    const currentLevel = status.metering || -160;
    
    // Notify audio level callback
    if (this.options.onAudioLevel) {
      // Convert dB to 0-100 scale for UI
      const normalizedLevel = Math.max(0, Math.min(100, (currentLevel + 60) * 1.67));
      this.options.onAudioLevel(normalizedLevel);
    }
    
    // Check for silence
    if (currentLevel < (this.options.silenceThreshold || this.SILENCE_THRESHOLD)) {
      // Audio is below threshold (silence)
      if (!this.silenceStartTime) {
        this.silenceStartTime = Date.now();
      }
      
      const silenceDuration = Date.now() - this.silenceStartTime;
      
      // Notify silence callback
      if (this.options.onSilenceDetected) {
        this.options.onSilenceDetected(silenceDuration);
      }
      
    } else {
      // Audio is above threshold (speech detected)
      if (this.silenceStartTime) {
        console.log('Speech detected, resetting silence timer');
        this.silenceStartTime = null;
        
        // Notify speech detected
        if (this.options.onSpeechDetected) {
          this.options.onSpeechDetected();
        }
      }
      
      this.lastSpeechTime = Date.now();
    }
  }
  
  /**
   * Start monitoring audio levels
   */
  private startAudioMonitoring() {
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
    }
    
    this.isMonitoring = true;
    
    // Request status updates frequently for monitoring
    this.audioLevelInterval = setInterval(async () => {
      if (this.recording && this.isMonitoring) {
        try {
          const status = await this.recording.getStatusAsync();
          this.handleStatusUpdate(status);
        } catch (error) {
          console.error('Error getting recording status:', error);
        }
      }
    }, this.MONITOR_INTERVAL);
  }
  
  /**
   * Stop monitoring audio levels
   */
  private stopAudioMonitoring() {
    this.isMonitoring = false;
    
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = null;
    }
  }
  
  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.recording !== null;
  }
  
  /**
   * Get time since last speech was detected
   */
  getTimeSinceLastSpeech(): number {
    return Date.now() - this.lastSpeechTime;
  }
}

// Export singleton instance
export const enhancedRecording = new EnhancedRecordingService();

// Export convenience functions for backward compatibility
export async function startEnhancedRecording(options?: RecordingOptions): Promise<{ uri: string }> {
  return enhancedRecording.startRecording(options);
}

export async function stopEnhancedRecording(): Promise<{ uri: string; duration?: number }> {
  return enhancedRecording.stopRecording();
}

export function isEnhancedRecording(): boolean {
  return enhancedRecording.isRecording();
}