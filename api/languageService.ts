import { Language } from '../types';
import { API_BASE_URL } from '../api/config';
import { mobileFetch } from '../utils/networkUtils';
import { translationCache } from '../utils/translationCache';
import { getAuthToken } from './authToken';
import { FALLBACK_LANGUAGES } from '../shared/fallbackLanguages';

// Headers for mobile API requests
const requestHeaders = {
  'Content-Type': 'application/json'
};

// Common headers for JSON requests
const jsonHeaders = {
  'Content-Type': 'application/json'
};

// Headers for endpoints that require Clerk auth (transcribe, translate)
async function getAuthedHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// Comprehensive language service using the server API endpoint
export async function getLanguages(): Promise<Language[]> {
  try {
    const response = await mobileFetch(`${API_BASE_URL}/api/languages`, {
      method: 'GET',
      headers: requestHeaders
    });
    
    if (!response.ok) {
      throw new Error(`Languages API failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Convert server format to client format for compatibility
    const languages = data.languages.map((lang: any) => ({
      code: lang.code,
      name: lang.name,
      country: lang.country || 'Unknown',
      flag: lang.flag || '',
      nativeName: lang.nativeName || lang.name,
      speechSupported: lang.speechSupported || false,
      speechToTextSupported: lang.speechToTextSupported || false,
      textToSpeechSupported: lang.textToSpeechSupported || false,
      translationQuality: lang.translationQuality || 'medium',
      popularity: lang.popularity || 1
    }));
    
    console.log(`✅ Loaded ${languages.length} languages (${data.meta.withSpeechSupport} with speech support)`);
    return languages;
    
  } catch (error) {
    console.error('Error fetching languages from API:', error);
    
    // Fallback to the shared minimal language list if the API is unreachable
    return FALLBACK_LANGUAGES;
  }
}

// Get languages with speech synthesis support only
export async function getLanguagesWithSpeechSupport(): Promise<Language[]> {
  try {
    const response = await mobileFetch(`${API_BASE_URL}/api/languages?speechOnly=true`, {
      method: 'GET',
      headers: requestHeaders
    });
    
    if (!response.ok) {
      throw new Error(`Speech languages API failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.languages.map((lang: any) => ({
      code: lang.code,
      name: lang.name,
      country: lang.country || 'Unknown',
      flag: lang.flag || '',
      nativeName: lang.nativeName || lang.name,
      speechSupported: true,
      speechToTextSupported: lang.speechToTextSupported || false,
      textToSpeechSupported: lang.textToSpeechSupported || false,
      translationQuality: lang.translationQuality || 'medium',
      popularity: lang.popularity || 1
    }));
    
  } catch (error) {
    console.error('Error fetching speech-supported languages:', error);
    
    // Fallback to the shared minimal language list (all entries have speech support)
    return FALLBACK_LANGUAGES;
  }
}

// Speech recognition function using the server API
export async function recognizeSpeech(
  audioBase64: string,
  languageHints?: string[],
  autoDetectEnabled?: boolean,
  expectedLanguage?: string
): Promise<any> {
  try {
    // Add timeout for Whisper API calls
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await mobileFetch(`${API_BASE_URL}/api/transcribe`, {
      method: 'POST',
      headers: await getAuthedHeaders(),
      body: JSON.stringify({
        audio: audioBase64,
        languages: languageHints,
        autoDetectEnabled,
        expectedLanguage
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorMsg = `Whisper API error: ${response.status} ${response.statusText}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    const data = await response.json();
    
    // Check if translation should be prevented (manual mode mismatch)
    if (data.shouldPreventTranslation) {
      console.log('[Manual Mode] Translation prevented by server:', data.wrongLanguageError);
      throw new Error(data.wrongLanguageError || 'Wrong language detected');
    }
    
    // Return full response object for language detection
    return data;
  } catch (error: any) {
    // Enhanced error logging
    if (error.name === 'AbortError') {
      console.error('❌ Whisper API timeout after 30 seconds');
      throw new Error('Speech recognition timed out. Please try again.');
    } else if (error.message?.includes('fetch')) {
      console.error('❌ Whisper API network error:', error.message);
      throw new Error('Network error during speech recognition. Please check your connection.');
    } else {
      console.error('❌ Whisper API error:', error);
      throw error; // Pass through the error as-is
    }
  }
}

// Translate text function
export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<{ translation: string; originalText: string }> {
  const startTime = Date.now();
  
  try {
    // Check cache first
    const cacheKey = { text, sourceLanguage, targetLanguage };
    const cachedTranslation = await translationCache.get(cacheKey);
    
    if (cachedTranslation) {
      const cacheTime = Date.now() - startTime;
      console.log(`⚡ Translation from cache in ${cacheTime}ms (${text.length} chars)`);
      return {
        translation: cachedTranslation,
        originalText: text,
      };
    }
    
    console.log(`🌍 Translating ${text.length} chars from ${sourceLanguage} to ${targetLanguage}`);
    
    // Add timeout for Translation API calls
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
    
    const response = await mobileFetch(`${API_BASE_URL}/api/translate`, {
      method: 'POST',
      headers: await getAuthedHeaders(),
      body: JSON.stringify({
        text,
        sourceLanguage,
        targetLanguage
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorMsg = `Translation API error: ${response.status} ${response.statusText}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    const data = await response.json();
    const totalTime = Date.now() - startTime;
    console.log(`✅ Translation successful in ${totalTime}ms (${data.translation.length} chars)`);
    
    // Cache the translation
    await translationCache.set(cacheKey, data.translation);
    
    return data;
  } catch (error: any) {
    // Enhanced error logging
    if (error.name === 'AbortError') {
      console.error('❌ Translation API timeout after 20 seconds');
      throw new Error('Translation timed out. Please try again.');
    } else if (error.message?.includes('fetch')) {
      console.error('❌ Translation API network error:', error.message);
      throw new Error('Network error during translation. Please check your connection.');
    } else {
      console.error('❌ Translation API error:', error);
      throw new Error(error.message || 'Translation failed. Please try again.');
    }
  }
}
