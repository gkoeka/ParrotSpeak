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

// CRITICAL FIX 2: Recording is now centralized in ConversationSessionService
// This export is kept for backward compatibility but should not be used
export let recording: Audio.Recording | null = null;

/**
 * @deprecated Recording is now managed by ConversationSessionService
 * This function is disabled to prevent multiple Recording instances
 */
export async function startRecording(): Promise<{ uri: string }> {
  // FIX 2: Disable recording creation here - all recording control is in ConversationSessionService
  console.warn('⚠️ [speechService] startRecording is DISABLED - use ConversationSessionService');
  throw new Error('Recording is managed by ConversationSessionService. Do not call speechService.startRecording()');
}

/**
 * @deprecated Recording is now managed by ConversationSessionService
 * This function is disabled to prevent multiple Recording instances
 */
export async function stopRecording(): Promise<{ uri: string; duration?: number }> {
  // FIX 2: Disable recording stop here - all recording control is in ConversationSessionService
  console.warn('⚠️ [speechService] stopRecording is DISABLED - use ConversationSessionService');
  throw new Error('Recording is managed by ConversationSessionService. Do not call speechService.stopRecording()');
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

