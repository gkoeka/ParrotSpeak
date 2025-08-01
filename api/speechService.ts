import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { recognizeSpeech } from './languageService';

// Platform-safe speech service with fallbacks
const isSpeechAvailable = Platform.OS !== 'web' && Speech;
const isAudioAvailable = Platform.OS !== 'web' && Audio;
const isFileSystemAvailable = Platform.OS !== 'web' && FileSystem;

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
      // Check if speech is available on this platform
      if (!isSpeechAvailable) {
        console.log('Speech not available on this platform:', text);
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

export async function startRecording(): Promise<{ uri: string }> {
  // Platform check for future Audio.Recording implementation
  if (!isAudioAvailable) {
    console.log('Audio recording not available on this platform');
    return { uri: 'mock-recording-uri' };
  }
  
  // This is a mock implementation
  // In a real app, we would use Audio.Recording from expo-av
  console.log('Starting recording...');
  return { uri: 'mock-recording-uri' };
}

export async function stopRecording(): Promise<{ uri: string }> {
  // This is a mock implementation
  console.log('Stopping recording...');
  return { uri: 'mock-recording-uri' };
}

// Process the recorded audio with our server-side Whisper API
export async function processRecording(
  recordingUri: string,
  languageCode: string
): Promise<string> {
  // Platform check for future FileSystem usage
  if (!isFileSystemAvailable) {
    console.log('FileSystem not available on this platform');
    return 'Mock transcription - FileSystem unavailable';
  }
  
  // In a real implementation, we would:
  // 1. Read the audio file as base64
  // 2. Send it to our server API for processing with Whisper
  // 3. Return the transcribed text
  
  // Mock implementation for now
  console.log('Processing recording with language:', languageCode);
  return 'This is a mock transcription result';
}
