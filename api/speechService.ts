import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system';
import { recognizeSpeech } from './languageService';
import { Platform } from 'react-native';
import { addAppStateListener, getCurrentAppState, isAppInForeground } from '../utils/safeAppState';

// Mobile-only speech service with module availability checks
const isSpeechAvailable = !!Speech;
const isAudioAvailable = !!Audio;
const isFileSystemAvailable = !!FileSystem;

// FOREGROUND-ONLY: All recording stops when app backgrounds
const FOREGROUND_ONLY = true; // Enforces recording only when app is in foreground (docs: privacy protection)

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
  return new Promise(async (resolve, reject) => {
    try {
      // Check if speech module is available
      if (!isSpeechAvailable) {
        console.log('Speech module not available:', text);
        if (onDone) onDone();
        resolve();
        return;
      }

      // Map language codes to proper locale codes for speech synthesis
      const speechLanguageMap: { [key: string]: string } = {
        'sl': 'sl-SI',  // Slovenian
        'is': 'is-IS',  // Icelandic
        'fil': 'fil-PH', // Filipino
        'yue': 'yue-HK', // Cantonese
        'en': 'en-US',
        'es': 'es-ES',
        'es-ES': 'es-ES',
        'es-419': 'es-MX',
        'fr': 'fr-FR',
        'de': 'de-DE',
        'it': 'it-IT',
        'pt-BR': 'pt-BR',
        'ja': 'ja-JP',
        'zh': 'zh-CN',
        'ru': 'ru-RU',
        'ko': 'ko-KR',
        'ar': 'ar-SA',
        'hi': 'hi-IN',
        'cs': 'cs-CZ',
        'pl': 'pl-PL',
        'nl': 'nl-NL',
        'sv': 'sv-SE',
        'no': 'nb-NO',
        'da': 'da-DK',
        'fi': 'fi-FI',
        'tr': 'tr-TR',
        'he': 'he-IL',
        'th': 'th-TH',
        'vi': 'vi-VN',
        'uk': 'uk-UA',
        'ro': 'ro-RO',
        'hu': 'hu-HU',
        'el': 'el-GR',
        'id': 'id-ID',
        'ms': 'ms-MY',
        'ca': 'ca-ES',
        'hr': 'hr-HR',
        'sk': 'sk-SK',
        'bg': 'bg-BG',
        'sr': 'sr-RS',
        'lt': 'lt-LT',
        'lv': 'lv-LV',
        'et': 'et-EE',
        'bn': 'bn-BD',
        'ta': 'ta-IN',
        'te': 'te-IN',
        'ml': 'ml-IN',
        'kn': 'kn-IN',
        'mr': 'mr-IN',
        'gu': 'gu-IN',
        'ur': 'ur-PK',
        'fa': 'fa-IR',
        'sw': 'sw-KE',
        'mk': 'mk-MK',
        'ga': 'ga-IE',
        'eu': 'eu-ES',
        'gl': 'gl-ES',
        'cy': 'cy-GB'
      };
      
      // Use mapped language code or fallback to provided code
      const mappedLanguageCode = speechLanguageMap[languageCode] || languageCode;
      
      // Use voice profile settings if provided, otherwise use defaults
      const options = {
        language: mappedLanguageCode,
        pitch: voiceProfile?.pitch ?? 1.0,
        rate: voiceProfile?.rate ?? 0.9,
        onDone: () => {
          if (onDone) onDone();
          resolve();
        },
        onError: (error: any) => {
          console.error(`Speech synthesis error for language ${mappedLanguageCode}:`, error);
          // Ignore interruption errors as they are expected when stopping speech
          if (error && error.toString().includes('interrupted')) {
            resolve();
          } else {
            reject(error);
          }
        }
      };
      
      // Check if the device supports the language
      const voices = await Speech.getAvailableVoicesAsync();
      const supportedVoice = voices.find(voice => 
        voice.language.toLowerCase().startsWith(mappedLanguageCode.toLowerCase().split('-')[0])
      );
      
      if (!supportedVoice && languageCode !== 'en') {
        console.warn(`Language ${mappedLanguageCode} not supported by device, falling back to English`);
        options.language = 'en-US';
      }
      
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

// Legacy recording variable for OFF mode only
let legacyRecording: Audio.Recording | null = null;
let legacyRecordingActive: boolean = false;

// AppState listener for legacy mode
let appStateSubscription: any = null;

// Initialize AppState listener for legacy mode
function initializeLegacyAppStateListener() {
  if (appStateSubscription) return; // Already initialized
  
  appStateSubscription = addAppStateListener((nextAppState) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      if (legacyRecordingActive && legacyRecording) {
        console.log('📱 [Legacy] App backgrounded → stopping recording');
        // Force stop recording when app goes to background
        legacyStopRecording({ reason: 'background' });
      }
    }
  });
  console.log('✅ [Legacy] AppState listener initialized for foreground-only recording');
}

// Low-bitrate mono M4A optimized for Whisper (16kHz, 24kbps)
const LOW_M4A: Audio.RecordingOptions = {
  android: { 
    extension: '.m4a', 
    outputFormat: Audio.AndroidOutputFormat.MPEG_4, 
    audioEncoder: Audio.AndroidAudioEncoder.AAC, 
    sampleRate: 16000, 
    numberOfChannels: 1, 
    bitRate: 24000 
  },
  ios: { 
    extension: '.m4a', 
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC, 
    audioQuality: Audio.IOSAudioQuality.LOW, 
    sampleRate: 16000, 
    numberOfChannels: 1, 
    bitRate: 24000 
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 24000,
  },
  isMeteringEnabled: true
};

/**
 * Legacy recording start for OFF mode (standard single-tap recording)
 * Used when Conversation Mode is disabled
 */
export async function legacyStartRecording(): Promise<void> {
  try {
    console.log('🎤 [Legacy] Starting legacy recording (CM OFF mode)...');
    
    // Platform guard
    if (!isAudioAvailable) {
      throw new Error('Audio module not available on this platform');
    }
    
    // Check if app is in foreground (FOREGROUND-ONLY enforcement)
    if (!isAppInForeground()) {
      console.warn('⚠️ [Legacy Start] blocked: app not foreground');
      throw new Error('Cannot start recording when app is not in foreground');
    }
    
    // Prevent multiple recordings
    if (legacyRecordingActive || legacyRecording) {
      console.warn('⚠️ [Legacy] Recording already in progress');
      return;
    }
    
    // Initialize AppState listener if not already done
    initializeLegacyAppStateListener();
    
    // Configure audio mode - FOREGROUND-ONLY configuration with optimized settings
    await Audio.setAudioModeAsync({ 
      allowsRecordingIOS: true, 
      playsInSilentModeIOS: true, 
      staysActiveInBackground: false, // Enforces foreground-only recording
      interruptionModeIOS: Audio.InterruptionModeIOS.DoNotMix, 
      interruptionModeAndroid: Audio.InterruptionModeAndroid.DoNotMix, 
      shouldDuckAndroid: true 
    });
    
    // Request permissions
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Microphone permission denied');
    }
    
    // Create and start recording with error handling
    console.log('📱 [Legacy] Creating recording with createAsync...');
    try {
      const { recording } = await Audio.Recording.createAsync(LOW_M4A);
      legacyRecording = recording;
      legacyRecordingActive = true;
      console.log('✅ [Legacy] Recording started successfully');
    } catch (createError: any) {
      // Handle specific error types with user-friendly messages
      if (createError.message?.includes('permission')) {
        throw new Error('Microphone permission required. Please enable it in settings.');
      } else if (createError.message?.includes('audio mode')) {
        throw new Error('Audio system busy. Please try again.');
      } else {
        throw createError; // Re-throw unexpected errors
      }
    }
  } catch (error) {
    console.error('❌ [Legacy] Failed to start recording:', error);
    legacyRecording = null;
    legacyRecordingActive = false;
    throw error;
  }
}

/**
 * Legacy recording stop for OFF mode (standard single-tap recording)
 * Used when Conversation Mode is disabled
 */
export async function legacyStopRecording(options?: { reason?: string }): Promise<{ uri: string; duration: number }> {
  try {
    const reason = options?.reason || 'manual';
    console.log(`🛑 [Legacy] Stopping legacy recording (reason: ${reason})...`);
    
    if (!legacyRecording || !legacyRecordingActive) {
      console.warn('⚠️ [Legacy] No active recording to stop - ignoring');
      return { uri: '', duration: 0 };
    }
    
    // Mark as inactive immediately to prevent double-stop
    legacyRecordingActive = false;
    
    // Stop and unload the recording with try/catch guard
    let uri = '';
    let duration = 0;
    
    try {
      await legacyRecording.stopAndUnloadAsync();
      uri = legacyRecording.getURI() || '';
      const status = await legacyRecording.getStatusAsync();
      duration = status.durationMillis || 0;
      
      // Log file size for optimization tracking
      if (uri && isFileSystemAvailable) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(uri);
          const fileSizeMB = fileInfo.exists ? (fileInfo.size || 0) / (1024 * 1024) : 0;
          console.log(`📊 [Legacy] Recording file size: ${fileSizeMB.toFixed(2)}MB`);
        } catch (e) {
          // Non-critical - just log size check failure
          console.log('📊 [Legacy] Could not check file size');
        }
      }
    } catch (stopError) {
      console.warn('⚠️ [Legacy] Error during stopAndUnload (continuing):', stopError);
    }
    
    // Clean up
    legacyRecording = null;
    
    console.log(`✅ [Legacy] Recording stopped. Duration: ${duration}ms, URI: ${uri ? uri.substring(uri.length - 30) : 'none'}`);
    
    return { uri, duration };
  } catch (error) {
    console.error('❌ [Legacy] Error during stop (non-fatal):', error);
    // Clean up regardless of error
    legacyRecording = null;
    legacyRecordingActive = false;
    // Return empty result instead of throwing - prevents UI errors
    return { uri: '', duration: 0 };
  }
}

/**
 * Check if legacy recording is currently active
 */
export function isLegacyRecordingActive(): boolean {
  return legacyRecordingActive;
}

// Keep deprecated exports for backward compatibility but disabled for CM mode
export let recording: Audio.Recording | null = null;

/**
 * Start recording audio - alias for legacy recording
 */
export async function startRecording(): Promise<{ uri: string }> {
  await legacyStartRecording();
  return { uri: '' }; // URI is returned by stopRecording
}

/**
 * Stop recording and return the audio file URI - alias for legacy recording
 */
export async function stopRecording(): Promise<{ uri: string; duration?: number }> {
  return legacyStopRecording();
}

/**
 * Delete recording file after processing to save storage
 */
export async function deleteRecordingFile(uri: string): Promise<void> {
  if (!uri || !isFileSystemAvailable) return;
  
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
      console.log('🗑️ [Legacy] Recording file deleted:', uri.substring(uri.length - 30));
    }
  } catch (error) {
    console.warn('⚠️ [Legacy] Could not delete recording file:', error);
    // Non-critical - continue without throwing
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

