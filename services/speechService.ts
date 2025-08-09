/**
 * speechService.ts
 * 
 * Purpose: Integrates with OpenAI Whisper API for speech-to-text transcription,
 * manages language detection, and coordinates with translation services.
 * Phase 3 implementation for Always Listening feature.
 */

import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { performanceMonitor } from '../utils/performanceMonitor';
import { translationCache } from '../utils/translationCache';
import { API_BASE_URL } from '../config/api';
import { translateText } from '../api/languageService';

export interface TranscriptionResult {
  text: string;
  language: string;
  confidence: number;
  duration: number;
}

export interface TranslationResult {
  text: string;
  fromLanguage: string;
  toLanguage: string;
  duration: number;
}

export class SpeechService {
  private openaiApiKey: string | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize the speech service with OpenAI API key
   */
  public async initialize(): Promise<void> {
    try {
      // Get API key from secure storage
      const storedKey = await AsyncStorage.getItem('OPENAI_API_KEY');
      this.openaiApiKey = storedKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY || null;
      
      if (!this.openaiApiKey) {
        throw new Error('OpenAI API key not configured. Please add your OpenAI API key in settings.');
      }

      this.isInitialized = true;
      console.log('✅ SpeechService: Initialized successfully');
    } catch (error) {
      console.error('❌ SpeechService: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio using OpenAI Whisper API
   * @param audioUri URI of the audio file to transcribe
   * @param languageHint Optional language hint for better accuracy
   * @returns Transcription result with detected language
   */
  public async transcribeAudio(
    audioUri: string,
    languageHint?: string
  ): Promise<TranscriptionResult> {
    if (!this.isInitialized || !this.openaiApiKey) {
      throw new Error('SpeechService not initialized');
    }

    const startTime = Date.now();
    console.log('🧠 SpeechService: Sending to Whisper...', {
      audioUri,
      languageHint
    });

    try {
      // Read the audio file
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        console.error('❌ SpeechService: Audio file not found:', audioUri);
        throw new Error('Audio file not found');
      }

      // Validate file size (Whisper API limit is 25MB)
      if (fileInfo.size && fileInfo.size > 25 * 1024 * 1024) {
        console.error('❌ SpeechService: Audio file too large:', fileInfo.size);
        throw new Error('Audio file exceeds 25MB limit');
      }

      console.log('📁 SpeechService: Audio file validated:', {
        size: fileInfo.size,
        uri: audioUri
      });

      // Create form data for multipart upload
      const formData = new FormData();
      
      // Convert audio file to blob
      const audioResponse = await fetch(audioUri);
      const audioBlob = await audioResponse.blob();
      
      // Append file to form data
      formData.append('file', audioBlob, 'audio.m4a');
      formData.append('model', 'whisper-1');
      
      // Add language hint if provided
      if (languageHint) {
        formData.append('language', languageHint);
        console.log('🌐 SpeechService: Using language hint:', languageHint);
      }

      // Add response format to get detailed output
      formData.append('response_format', 'verbose_json');

      // Make API request to Whisper
      console.log('📡 SpeechService: Calling Whisper API...');
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ SpeechService: Whisper API error:', {
          status: response.status,
          error
        });
        
        if (response.status === 401) {
          throw new Error('OpenAI API key is invalid or missing');
        }
        throw new Error(`Whisper API error: ${error}`);
      }

      const result = await response.json();
      const duration = Date.now() - startTime;

      // Handle empty transcription
      if (!result.text || result.text.trim().length === 0) {
        console.warn('⚠️ SpeechService: Empty transcription received');
        return {
          text: '',
          language: result.language || languageHint || 'en',
          confidence: 0.1,
          duration,
        };
      }

      console.log(`📝 SpeechService: Transcription: "${result.text.substring(0, 50)}..." (${result.language}, ${duration}ms)`);

      // Calculate confidence based on response (Whisper doesn't provide confidence directly)
      const confidence = this.estimateConfidence(result);
      
      // Log language detection results
      console.log('🌍 SpeechService: Language detection:', {
        detected: result.language,
        expected: languageHint,
        confidence,
        match: result.language === languageHint
      });

      // Check if confidence is too low
      if (confidence < 0.5) {
        console.warn('⚠️ SpeechService: Low confidence transcription:', confidence);
        // Use last known language or default if confidence is too low
        result.language = result.language || languageHint || 'en';
      }

      // Track performance
      performanceMonitor.addMetric({
        transcriptionTime: duration,
        translationTime: 0,
        totalTime: duration,
        audioSize: fileInfo.size || 0,
        textLength: result.text.length,
        timestamp: new Date(),
        sourceLanguage: result.language,
        targetLanguage: '',
      });

      return {
        text: result.text.trim(),
        language: result.language,
        confidence,
        duration,
      };
    } catch (error) {
      console.error('❌ SpeechService: Transcription failed:', error);
      throw error;
    }
  }

  /**
   * Translate text to target language
   * @param text Text to translate
   * @param fromLanguage Source language code
   * @param toLanguage Target language code
   * @returns Translation result
   */
  public async translateText(
    text: string,
    fromLanguage: string,
    toLanguage: string
  ): Promise<TranslationResult> {
    const startTime = Date.now();
    console.log(`🌍 SpeechService: Translating from ${fromLanguage} to ${toLanguage}...`);

    try {
      // Handle empty text
      if (!text || text.trim().length === 0) {
        console.warn('⚠️ SpeechService: Empty text provided for translation');
        return {
          text: '(Translation unavailable)',
          fromLanguage,
          toLanguage,
          duration: 0,
        };
      }

      // Check cache first
      const cacheKey = { text, sourceLanguage: fromLanguage, targetLanguage: toLanguage };
      const cachedTranslation = await translationCache.get(cacheKey);
      
      if (cachedTranslation) {
        const duration = Date.now() - startTime;
        console.log(`💾 SpeechService: Using cached translation (${duration}ms)`);
        return {
          text: cachedTranslation,
          fromLanguage,
          toLanguage,
          duration,
        };
      }

      // Use existing translation service
      const translatedText = await translateText(text, fromLanguage, toLanguage);
      const duration = Date.now() - startTime;

      console.log(`🔤 SpeechService: Translation: "${translatedText}" (${duration}ms)`);

      // Cache the translation
      await translationCache.set(cacheKey, translatedText);

      // Track performance
      performanceMonitor.addMetric({
        transcriptionTime: 0,
        translationTime: duration,
        totalTime: duration,
        audioSize: 0,
        textLength: text.length,
        timestamp: new Date(),
        sourceLanguage: fromLanguage,
        targetLanguage: toLanguage,
      });

      return {
        text: translatedText,
        fromLanguage,
        toLanguage,
        duration,
      };
    } catch (error) {
      console.error('❌ SpeechService: Translation failed:', error);
      
      // Handle translation errors gracefully
      if (error instanceof Error && error.message.includes('Unsupported language')) {
        console.warn('⚠️ SpeechService: Unsupported language, returning placeholder');
        return {
          text: '(Translation unavailable)',
          fromLanguage,
          toLanguage,
          duration: Date.now() - startTime,
        };
      }
      
      throw error;
    }
  }

  /**
   * Process audio chunk through the full pipeline
   * @param audioUri URI of the audio chunk
   * @param sourceLanguage Expected source language
   * @param targetLanguage Target language for translation
   * @returns Complete transcription and translation results
   */
  public async processAudioChunk(
    audioUri: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<{
    transcription: TranscriptionResult;
    translation: TranslationResult;
    totalDuration: number;
  }> {
    const startTime = Date.now();
    console.log('📦 SpeechService: Processing audio chunk...');

    try {
      // Step 1: Transcribe audio
      const transcription = await this.transcribeAudio(audioUri, sourceLanguage);

      // Step 2: Translate if languages are different
      let translation: TranslationResult;
      
      if (transcription.language === targetLanguage) {
        // No translation needed
        translation = {
          text: transcription.text,
          fromLanguage: transcription.language,
          toLanguage: targetLanguage,
          duration: 0,
        };
      } else {
        // Translate to target language
        translation = await this.translateText(
          transcription.text,
          transcription.language,
          targetLanguage
        );
      }

      const totalDuration = Date.now() - startTime;

      // Track combined performance
      performanceMonitor.addMetric({
        transcriptionTime: transcription.duration,
        translationTime: translation.duration,
        totalTime: totalDuration,
        audioSize: 0, // Will be set by caller
        textLength: transcription.text.length,
        timestamp: new Date(),
        sourceLanguage: transcription.language,
        targetLanguage: targetLanguage,
      });

      console.log(`✅ SpeechService: Pipeline complete (${totalDuration}ms)`);

      return {
        transcription,
        translation,
        totalDuration,
      };
    } catch (error) {
      console.error('❌ SpeechService: Pipeline failed:', error);
      throw error;
    }
  }

  /**
   * Estimate confidence based on Whisper response
   * Whisper doesn't provide direct confidence scores, so we estimate
   */
  private estimateConfidence(whisperResult: any): number {
    // Base confidence on response characteristics
    let confidence = 0.8; // Default confidence

    // Adjust based on detected language matching expected
    if (whisperResult.language && whisperResult.text) {
      // Longer transcriptions typically have higher confidence
      if (whisperResult.text.length > 50) {
        confidence += 0.1;
      }

      // Check for common low-confidence indicators
      if (whisperResult.text.includes('[inaudible]') || 
          whisperResult.text.includes('[unclear]')) {
        confidence -= 0.3;
      }

      // If segments are available, use them for confidence
      if (whisperResult.segments && Array.isArray(whisperResult.segments)) {
        const avgLogprob = whisperResult.segments.reduce((sum: number, seg: any) => 
          sum + (seg.avg_logprob || -1), 0) / whisperResult.segments.length;
        
        // Convert log probability to confidence (rough approximation)
        // Whisper logprobs typically range from -2 (low) to 0 (high)
        confidence = Math.max(0.1, Math.min(1.0, 1 + (avgLogprob / 2)));
      }
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Check if service is ready
   */
  public isReady(): boolean {
    return this.isInitialized && !!this.openaiApiKey;
  }
}

// Singleton instance
export const speechService = new SpeechService();