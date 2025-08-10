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

// Track which languages have already logged fallback (once per app launch)
const loggedFallbacks = new Set<string>();

// Track if we've shown the long recording banner this session
let longRecordingBannerShown = false;

// Initialize audio route change monitoring
let audioRouteListener: any = null;

// Interface for voice profile
export interface VoiceProfile {
  id: string;
  name: string;
  languageCode: string;
  pitch: number;
  rate: number;
  isDefault?: boolean;
}

// Voice selection result
interface VoiceSelectionResult {
  requested: string;
  chosen: string;
  fallbackLevel: 'none' | 'base' | 'default';
}

// Pick preferred voice with fallback logic
export async function pickPreferredVoice(langCodeFull: string): Promise<VoiceSelectionResult> {
  try {
    // Check if speech module is available
    if (!isSpeechAvailable) {
      return {
        requested: langCodeFull,
        chosen: 'system',
        fallbackLevel: 'default'
      };
    }

    // Get available voices
    const voices = await Speech.getAvailableVoicesAsync();
    
    // 1. Try exact match (e.g., "pt-BR", "en-AU")
    const exactMatch = voices.find(voice => 
      voice.language.toLowerCase() === langCodeFull.toLowerCase()
    );
    
    if (exactMatch) {
      return {
        requested: langCodeFull,
        chosen: exactMatch.identifier || exactMatch.language,
        fallbackLevel: 'none'
      };
    }
    
    // 2. Try base language match (e.g., "pt" for "pt-BR")
    const baseLang = langCodeFull.split('-')[0].toLowerCase();
    const baseMatch = voices.find(voice => 
      voice.language.toLowerCase().startsWith(baseLang)
    );
    
    if (baseMatch) {
      // Log fallback once per language per app launch
      const fallbackKey = `${langCodeFull}_base`;
      if (!loggedFallbacks.has(fallbackKey)) {
        console.log(`[TTS] fallback {requested=${langCodeFull}, chosen=${baseMatch.identifier || baseMatch.language}, level=base}`);
        loggedFallbacks.add(fallbackKey);
      }
      
      return {
        requested: langCodeFull,
        chosen: baseMatch.identifier || baseMatch.language,
        fallbackLevel: 'base'
      };
    }
    
    // 3. Use system default (usually English)
    const defaultVoice = voices.find(voice => 
      voice.language.toLowerCase().startsWith('en')
    ) || voices[0]; // Fallback to first available voice
    
    // Log fallback once per language per app launch
    const fallbackKey = `${langCodeFull}_default`;
    if (!loggedFallbacks.has(fallbackKey)) {
      console.log(`[TTS] fallback {requested=${langCodeFull}, chosen=${defaultVoice?.identifier || 'system'}, level=default}`);
      loggedFallbacks.add(fallbackKey);
    }
    
    return {
      requested: langCodeFull,
      chosen: defaultVoice?.identifier || 'en-US',
      fallbackLevel: 'default'
    };
    
  } catch (error) {
    console.error('Error selecting voice:', error);
    return {
      requested: langCodeFull,
      chosen: 'en-US',
      fallbackLevel: 'default'
    };
  }
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
        'en-AU': 'en-AU',  // Australian English
        'en-GB': 'en-GB',  // British English
        'es': 'es-ES',
        'es-ES': 'es-ES',
        'es-419': 'es-MX',
        'fr': 'fr-FR',
        'de': 'de-DE',
        'it': 'it-IT',
        'pt': 'pt-BR',      // Default Portuguese to Brazilian
        'pt-BR': 'pt-BR',   // Brazilian Portuguese
        'pt-PT': 'pt-PT',   // European Portuguese
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
      
      // Use pickPreferredVoice to select best available voice
      const voiceSelection = await pickPreferredVoice(mappedLanguageCode);
      
      // Log voice selection (always log for debugging, but fallbacks are logged once)
      if (voiceSelection.fallbackLevel === 'none') {
        console.log(`[TTS] voice {requested=${mappedLanguageCode}, chosen=${voiceSelection.chosen}, level=none}`);
      }
      
      // Use voice profile settings if provided, otherwise use defaults
      const options = {
        language: voiceSelection.fallbackLevel === 'default' ? 'en-US' : mappedLanguageCode,
        pitch: voiceProfile?.pitch ?? 1.0,
        rate: voiceProfile?.rate ?? 0.9,
        voice: voiceSelection.chosen, // Track which voice was used
        onDone: () => {
          // Log audio route when TTS completes
          logAudioRouteStatus('TTS complete');
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
        },
        onStart: () => {
          // Log audio route when TTS starts
          logAudioRouteStatus('TTS start');
        }
      };
      
      // Start speaking with the given options
      try {
        Speech.speak(text, options);
      } catch (ttsError) {
        console.error('❌ TTS API error:', ttsError);
        // Don't throw - TTS failure shouldn't break the pipeline
        console.warn('⚠️ TTS failed but continuing pipeline');
        if (onDone) onDone();
        resolve();
      }
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
let isStoppingRecording: boolean = false; // Guard flag to prevent overlapping stops

// AppState listener for legacy mode
let appStateSubscription: any = null;

// Silence timer for auto-stop (2 seconds) - single timer per recording
let silenceTimer: NodeJS.Timeout | null = null;
let lastSpeechTime: number = Date.now();

/**
 * Helper to resolve interruption mode constants safely across Expo AV versions
 * Some SDK versions may not have all constants defined
 */
function resolveInterruptionModes(Audio: any) {
  // Legacy constants present in most SDKs
  const IOS = Audio?.InterruptionModeIOS?.DoNotMix
    ?? Audio?.INTERRUPTION_MODE_IOS_DO_NOT_MIX
    ?? Audio?.InterruptionModeIOS?.MixWithOthers
    ?? Audio?.INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS
    ?? 0; // fallback to numeric value
    
  const ANDROID = Audio?.InterruptionModeAndroid?.DoNotMix
    ?? Audio?.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX
    ?? Audio?.InterruptionModeAndroid?.DuckOthers
    ?? Audio?.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS
    ?? 1; // fallback to numeric value
    
  return { IOS, ANDROID };
}

// Initialize audio route monitoring on first use
async function initializeAudioRouteMonitoring() {
  if (audioRouteListener || !isAudioAvailable) return;
  
  try {
    // Set up audio route change detection if available
    // Note: Expo AV doesn't directly expose route change events,
    // but we can detect them through recording status changes
    console.log('🎧 [AudioRoute] Monitoring initialized');
    
    // Mark as initialized
    audioRouteListener = true;
  } catch (error) {
    console.log('🎧 [AudioRoute] Could not initialize monitoring:', error);
  }
}

// Log audio route changes (called during recording state changes)
async function logAudioRouteStatus(context: string) {
  if (!isAudioAvailable) return;
  
  try {
    // Log context for route changes
    console.log(`🎧 [AudioRoute] Status during ${context}`);
    
    // If recording is active, check its status
    if (legacyRecording) {
      const status = await legacyRecording.getStatusAsync();
      if (status.isRecording) {
        console.log('🎧 [AudioRoute] Recording still active after route change');
      }
    }
  } catch (error) {
    // Silent fail - route logging is non-critical
  }
}

// Initialize AppState listener for legacy mode with interruption handling
function initializeLegacyAppStateListener() {
  if (appStateSubscription) return; // Already initialized
  
  appStateSubscription = addAppStateListener((nextAppState) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      // Clear timer when app backgrounds
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
        console.log('[SilenceTimer] cleared (app background)');
      }
      
      if (legacyRecordingActive && legacyRecording) {
        console.log('📱 [Legacy] App backgrounded/interrupted → stopping recording');
        console.log('🔄 [Interruption] System interruption detected - ending recording safely');
        // Force stop recording when app goes to background or is interrupted
        legacyStopRecording({ reason: 'background' }).then(() => {
          console.log('✅ [Interruption] Recording ended safely due to interruption');
        }).catch((error) => {
          console.log('⚠️ [Interruption] Error stopping recording:', error);
        });
      }
    } else if (nextAppState === 'active') {
      // App returned to foreground
      if (!legacyRecordingActive && !legacyRecording) {
        console.log('📱 [Interruption] App active - ready for new recording');
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
      if (silenceTimer) {
        console.log('[SilenceTimer] start ignored (already armed)');
      }
      return;
    }
    
    // Initialize AppState listener if not already done
    initializeLegacyAppStateListener();
    
    // Log that we're monitoring for interruptions
    console.log('🔄 [Interruption] Monitoring for system interruptions');
    
    // Initialize audio route monitoring
    await initializeAudioRouteMonitoring();
    
    // Configure audio mode - FOREGROUND-ONLY configuration with optimized settings
    if (!Audio || !Audio.setAudioModeAsync) {
      console.warn('[AudioMode] Audio module unavailable; skipping setAudioModeAsync');
    } else {
      const { IOS, ANDROID } = resolveInterruptionModes(Audio);
      console.log('[AudioMode] Using interruption modes', { IOS, ANDROID });
      
      await Audio.setAudioModeAsync({ 
        allowsRecordingIOS: true, 
        playsInSilentModeIOS: true, 
        staysActiveInBackground: false, // Enforces foreground-only recording
        interruptionModeIOS: IOS, 
        interruptionModeAndroid: ANDROID, 
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false
      });
    }
    
    // Check and request permissions every time
    console.log('🎤 [Perms] Checking microphone permission...');
    const permissionResponse = await Audio.getPermissionsAsync();
    
    if (permissionResponse.status !== 'granted') {
      console.log('⚠️ [Perms] Permission not granted, requesting...');
      const { status } = await Audio.requestPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('❌ [Perms] Permission denied → prompting user to enable in settings');
        throw new Error('Microphone permission denied. Please enable it in settings.');
      } else {
        console.log('✅ [Perms] Permission granted after prompt');
      }
    } else {
      console.log('✅ [Perms] Permission already granted');
    }
    
    // Create and start recording with error handling
    console.log('📱 [Legacy] Creating recording with createAsync...');
    try {
      const { recording } = await Audio.Recording.createAsync(LOW_M4A);
      legacyRecording = recording;
      legacyRecordingActive = true;
      console.log('✅ [Legacy] Recording started successfully');
      
      // Log initial audio route
      await logAudioRouteStatus('recording start');
      
      // Clear any existing timer before arming new one (defensive)
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }
      
      // Set up silence detection with status updates
      console.log('[SilenceTimer] armed (2000ms)');
      lastSpeechTime = Date.now();
      
      // Start monitoring for silence
      recording.setOnRecordingStatusUpdate((status) => {
        if (!legacyRecordingActive || isStoppingRecording) return; // Skip if not recording or already stopping
        
        // Check if metering is available
        if (status.metering != null && status.metering !== undefined) {
          // Metering available: use -35 dB threshold
          if (status.metering > -35) {
            // Speech detected
            console.log('[SilenceTimer] reset (speech)');
            lastSpeechTime = Date.now();
            
            // Clear and reset the timer
            if (silenceTimer) {
              clearTimeout(silenceTimer);
              silenceTimer = null;
            }
            silenceTimer = setTimeout(() => {
              if (legacyRecordingActive && !isStoppingRecording) {
                console.log('[SilenceTimer] elapsed → auto-stop');
                legacyStopRecording({ reason: 'silence' });
              }
            }, 2000);
          }
        } else if (status.durationMillis && status.durationMillis > 0) {
          // Fallback: reset timer when duration increases
          const now = Date.now();
          if (now - lastSpeechTime > 500) { // Only reset if significant time passed
            console.log('[SilenceTimer] reset (fallback)');
            lastSpeechTime = now;
            
            // Clear and reset the timer
            if (silenceTimer) {
              clearTimeout(silenceTimer);
              silenceTimer = null;
            }
            silenceTimer = setTimeout(() => {
              if (legacyRecordingActive && !isStoppingRecording) {
                console.log('[SilenceTimer] elapsed → auto-stop');
                legacyStopRecording({ reason: 'silence' });
              }
            }, 2000);
          }
        }
      });
      
      // Start the initial silence timer
      silenceTimer = setTimeout(() => {
        if (legacyRecordingActive && !isStoppingRecording) {
          console.log('[SilenceTimer] elapsed → auto-stop');
          legacyStopRecording({ reason: 'silence' });
        }
      }, 2000);
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
    // Clean up on error
    legacyRecording = null;
    legacyRecordingActive = false;
    isStoppingRecording = false;
    // Clear timer on error
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
      console.log('[SilenceTimer] cleared (start error)');
    }
    throw error;
  }
}

/**
 * Legacy recording stop for OFF mode (standard single-tap recording)
 * Used when Conversation Mode is disabled
 */
// Export function to check if legacy recording is active
export function isLegacyRecordingActive(): boolean {
  return legacyRecordingActive;
}

export async function legacyStopRecording(options?: { reason?: string }): Promise<{ uri: string; duration: number }> {
  try {
    const reason = options?.reason || 'manual';
    
    // Make stop idempotent - check if already stopping
    if (isStoppingRecording) {
      console.log('[SilenceTimer] stop ignored (already stopped)');
      return { uri: '', duration: 0 };
    }
    
    // Clear silence timer on any stop (even if recording is already stopped)
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
      console.log('[SilenceTimer] cleared');
    }
    
    // Check if there's anything to stop
    if (!legacyRecording || !legacyRecordingActive) {
      console.warn('⚠️ [Legacy] No active recording to stop - ignoring');
      return { uri: '', duration: 0 };
    }
    
    console.log(`🛑 [Legacy] Stopping legacy recording (reason: ${reason})...`);
    
    // Set guard flag to prevent overlapping stops
    isStoppingRecording = true;
    
    // Handle interruption-specific cleanup
    if (reason === 'background') {
      console.log('🔄 [Interruption] Handling background/interruption cleanup');
    }
    
    // Mark as inactive immediately to prevent double-stop
    legacyRecordingActive = false;
    
    // Log audio route at stop
    await logAudioRouteStatus('recording stop');
    
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
    isStoppingRecording = false; // Reset guard flag
    
    console.log(`✅ [Legacy] Recording stopped. Duration: ${duration}ms, URI: ${uri ? uri.substring(uri.length - 30) : 'none'}`);
    
    // Check for long recording (> 60 seconds)
    if (duration > 60000) {
      console.log(`📊 [Metrics] Long recording detected: ${duration}ms`);
      
      // Show banner once per session
      if (!longRecordingBannerShown) {
        console.log('📢 [Banner] Showing long recording suggestion: "Let\'s try shorter turns (≤60s)"');
        longRecordingBannerShown = true;
      }
      
      // Record metric
      console.log(`📈 [Metric] Recording turn: {durationMs: ${duration}}`);
    } else {
      // Still record metric for all turns
      console.log(`📈 [Metric] Recording turn: {durationMs: ${duration}}`);
    }
    
    return { uri, duration };
  } catch (error) {
    console.error('❌ [Legacy] Error during stop (non-fatal):', error);
    // Clean up regardless of error
    legacyRecording = null;
    legacyRecordingActive = false;
    isStoppingRecording = false; // Reset guard flag
    // Clear timer on error
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
      console.log('[SilenceTimer] cleared (stop error)');
    }
    // Return empty result instead of throwing - prevents UI errors
    return { uri: '', duration: 0 };
  }
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
  if (!uri || !isFileSystemAvailable) {
    console.log('📁 [File] No URI or filesystem - skip delete');
    return;
  }
  
  console.log('📁 [File] Delete queued for:', uri.substring(uri.length - 30));
  
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
      console.log('✅ [File] Deleted:', uri.substring(uri.length - 30));
    } else {
      console.log('📁 [File] Already gone (ok):', uri.substring(uri.length - 30));
    }
  } catch (error) {
    console.warn('⚠️ [File] Delete failed (non-critical):', error);
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
  languageCode: string,
  autoDetectEnabled?: boolean,
  expectedLanguage?: string
): Promise<any> {
  try {
    console.log('Processing recording:', recordingUri, 'Language:', languageCode);
    
    // Convert audio file to Base64
    const audioBase64 = await convertAudioToBase64(recordingUri);
    
    // Send to transcription API with auto-detect state
    const transcriptionResult = await recognizeSpeech(audioBase64, languageCode, autoDetectEnabled, expectedLanguage);
    
    console.log('Transcription successful:', transcriptionResult);
    return transcriptionResult;
  } catch (error) {
    console.error('Error processing recording:', error);
    throw error;
  }
}

