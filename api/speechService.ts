import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system';
import { recognizeSpeech } from './languageService';

// Mobile-only speech service with module availability checks
const isSpeechAvailable = !!Speech;
const isAudioAvailable = !!Audio;
const isFileSystemAvailable = !!FileSystem;

// Interface for voice profile
export interface VoiceProfile {
  id: string;
  name: string;
  languageCode: string;
  pitch: number;
  rate: number;
  isDefault?: boolean;
}

// Text-to-speech functionality with voice profile support
export async function speakText(
  text: string, 
  languageCode: string, 
  voiceProfile?: VoiceProfile | null,
  onDone?: () => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Check if speech module is available
      if (!isSpeechAvailable) {
        console.log('Speech module not available:', text);
        if (onDone) onDone();
        resolve();
        return;
      }

      // Use voice profile settings if provided, otherwise use defaults
      const options = {
        language: languageCode,
        pitch: voiceProfile?.pitch ?? 1.0,
        rate: voiceProfile?.rate ?? 0.9,
        onDone: () => {
          if (onDone) onDone();
          resolve();
        },
        onError: (error: any) => {
          // Ignore interruption errors as they are expected when stopping speech
          if (error && error.toString().includes('interrupted')) {
            resolve();
          } else {
            reject(error);
          }
        }
      };
      
      // Start speaking with the given options
      Speech.speak(text, options);
    } catch (error) {
      reject(error);
    }
  });
}

// Check if speech is currently playing
export function isSpeaking(): Promise<boolean> {
  if (!isSpeechAvailable) {
    return Promise.resolve(false);
  }
  return Speech.isSpeakingAsync();
}

// Stop any ongoing speech
export function stopSpeaking(): void {
  try {
    if (isSpeechAvailable) {
      Speech.stop();
    }
  } catch (error) {
    console.log("Error stopping speech:", error);
  }
}

// Pause ongoing speech
export function pauseSpeaking(): void {
  try {
    if (!isSpeechAvailable) return;
    
    // Not all platforms support pause, so we use a try-catch block
    if (Speech.pause) {
      Speech.pause();
    } else {
      // Fall back to stop if pause is not available
      Speech.stop();
    }
  } catch (error) {
    console.log("Error pausing speech:", error);
  }
}

// Resume paused speech
export function resumeSpeaking(): void {
  try {
    if (!isSpeechAvailable) return;
    
    // Not all platforms support resume, so we use a try-catch block
    if (Speech.resume) {
      Speech.resume();
    }
  } catch (error) {
    console.log("Error resuming speech:", error);
  }
}

// This is a placeholder for the full speech recording functionality
// In a real implementation, this would use expo-av to record audio
export interface SpeechRecognitionResult {
  text: string;
  confidence: number;
}

export let recording: Audio.Recording | null = null;

export async function startRecording(): Promise<{ uri: string }> {
  try {
    // Check if Audio module is available for recording
    if (!isAudioAvailable) {
      console.log('Audio module not available for recording');
      throw new Error('Audio recording not available');
    }
    
    // Request permissions
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Audio recording permission not granted');
    }
    
    // Configure audio mode for recording
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    });
    
    // Create and start recording
    recording = new Audio.Recording();
    
    const recordingOptions = {
      android: {
        extension: '.m4a',
        outputFormat: Audio.RECORDING_FORMAT_MPEG_4,
        audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
      },
      ios: {
        extension: '.m4a',
        outputFormat: Audio.RECORDING_FORMAT_MPEG_4,
        audioEncoder: Audio.RECORDING_OPTION_IOS_AUDIO_ENCODER_AAC,
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
      },
      web: {
        mimeType: 'audio/webm;codecs=opus',
        bitsPerSecond: 128000,
      },
    };
    
    await recording.prepareToRecordAsync(recordingOptions);
    await recording.startAsync();
    
    console.log('Recording started successfully');
    return { uri: recording.getURI() || '' };
    
  } catch (error) {
    console.error('Error starting recording:', error);
    throw error;
  }
}

export async function stopRecording(): Promise<{ uri: string; duration?: number }> {
  try {
    if (!recording) {
      throw new Error('No recording in progress');
    }
    
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    const status = await recording.getStatusAsync();
    
    // Reset recording instance
    recording = null;
    
    // Reset audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    });
    
    console.log('Recording stopped successfully:', uri);
    return { 
      uri: uri || '', 
      duration: status.isLoaded ? status.durationMillis : undefined 
    };
    
  } catch (error) {
    console.error('Error stopping recording:', error);
    recording = null;
    throw error;
  }
}

// Convert audio file to Base64 for API transmission
async function convertAudioToBase64(uri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error('Error converting audio to base64:', error);
    throw new Error('Failed to process audio file');
  }
}

// Process the recorded audio with our server-side Whisper API
export async function processRecording(
  recordingUri: string,
  languageCode: string
): Promise<string> {
  try {
    console.log('Processing recording:', recordingUri, 'Language:', languageCode);
    
    // Convert audio file to Base64
    const audioBase64 = await convertAudioToBase64(recordingUri);
    
    // Send to transcription API
    const transcription = await recognizeSpeech(audioBase64, languageCode);
    
    console.log('Transcription successful:', transcription);
    return transcription;
  } catch (error) {
    console.error('Error processing recording:', error);
    throw error;
  }
}

