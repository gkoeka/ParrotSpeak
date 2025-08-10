import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';

import { legacyStartRecording, legacyStopRecording, processRecording, speakText, deleteRecordingFile, isLegacyRecordingActive } from '../api/speechService';
import { translateText } from '../api/languageService';
import { getLanguageByCode } from '../constants/languageConfiguration';
import { useTheme } from '../contexts/ThemeContext';
import { useParticipants } from '../contexts/ParticipantsContext';
import { determineSpeaker, getTargetLanguage } from '../utils/languageDetection';
import { PipelineStatus } from './StatusPill';
import { metricsTracker } from '../utils/metricsTracker';
import { normalizeLanguageCode } from '../utils/languageNormalization';

interface VoiceInputControlsProps {
  onMessage: (message: {
    id: string;
    text: string;
    translation: string;
    fromLanguage: string;
    toLanguage: string;
    timestamp: Date;
  }) => void;
  sourceLanguage?: string;
  targetLanguage?: string;
  showAlwaysListeningToggle?: boolean;
  onAlwaysListeningToggle?: (enabled: boolean) => void;
  onStatusChange?: (status: PipelineStatus) => void;
}

export default function VoiceInputControls({ 
  onMessage, 
  sourceLanguage = 'en-US',
  targetLanguage = 'es-ES',
  onStatusChange
}: VoiceInputControlsProps) {
  const { isDarkMode } = useTheme();
  const { participants, setLastTurnSpeaker, swapParticipants } = useParticipants();
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const checkInterval = useRef<NodeJS.Timeout | null>(null);

  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  
  // Track if long recording banner has been shown this session
  const [longRecordingBannerShown, setLongRecordingBannerShown] = useState(false);

  // Check if source or target language supports speech
  const getLanguageConfig = (code: string) => {
    if (code.includes('-') && code.length > 3) {
      const baseCode = code.split('-')[0];
      const specificLang = getLanguageByCode(code);
      if (specificLang) return specificLang;
      return getLanguageByCode(baseCode);
    }
    return getLanguageByCode(code);
  };
  
  const sourceLanguageConfig = getLanguageConfig(sourceLanguage);
  const targetLanguageConfig = getLanguageConfig(targetLanguage);
  const isSourceSpeechSupported = sourceLanguageConfig?.speechSupported ?? true;
  const isTargetSpeechSupported = targetLanguageConfig?.speechSupported ?? true;

  // Check for auto-stop from silence timer
  useEffect(() => {
    if (isRecording && !isProcessing) {
      // Poll every 100ms to check if recording was auto-stopped
      checkInterval.current = setInterval(() => {
        if (!isLegacyRecordingActive()) {
          // Clear interval immediately to prevent multiple triggers
          if (checkInterval.current) {
            clearInterval(checkInterval.current);
            checkInterval.current = null;
          }
          
          // Recording was stopped by silence timer - just trigger the stop handler
          console.log('🔄 Auto-stop detected from silence timer');
          handleStopRecording('silence-detected');
        }
      }, 100);
    } else {
      // Clear interval when not recording or processing
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
        checkInterval.current = null;
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
        checkInterval.current = null;
      }
    };
  }, [isRecording, isProcessing]);

  // Simple start recording - legacy mode only
  const handleStartRecording = async () => {
    try {
      console.log('🎤 [VoiceInputControls] handleStartRecording called');
      console.log('[VoiceInputControls] Platform:', Platform.OS);
      console.log('[UX] haptics=start');
      
      // Light haptic on start
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      setIsRecording(true);
      setError(null);
      
      console.log('[VoiceInputControls] Calling legacyStartRecording...');
      await legacyStartRecording();
      console.log('✅ Recording started - tap again to stop or wait for 2s silence');
      
    } catch (error: any) {
      console.error('❌ [VoiceInputControls] Failed to start recording:', error);
      console.error('[VoiceInputControls] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setIsRecording(false);
      
      if (error.message?.includes('permission')) {
        Alert.alert(
          'Microphone Permission Required',
          'Please enable microphone access in your device settings to use voice recording.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              // On iOS, this will open the app settings
              // On Android, user needs to navigate to permissions manually
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            }}
          ]
        );
      } else if (error.message?.includes('Audio module not available')) {
        Alert.alert('Error', 'Audio recording is not supported on this device.');
      } else {
        setError(error.message || 'Failed to start recording');
      }
    }
  };

  // Simple stop recording and process (supports auto-stop from silence timer)
  const handleStopRecording = async (reason?: string) => {
    try {
      console.log(`🛑 Stopping recording... (reason: ${reason || 'manual'})`);
      console.log('[UX] haptics=stop');
      
      // Light haptic on stop
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      setIsRecording(false);
      
      const { uri, duration } = await legacyStopRecording({ reason });
      
      if (uri && duration > 500) {
        console.log(`✅ Recording stopped. Duration: ${duration}ms`);
        
        // Check for long recording and show banner if needed
        if (duration > 60000 && !longRecordingBannerShown) {
          setError('Let\'s try shorter turns (≤60s) for better results');
          // User must manually close - no auto-dismiss
          setLongRecordingBannerShown(true);
        }
        
        console.log('🔄 Processing audio for translation...');
        setIsProcessing(true);
        
        // Process the recording through the translation pipeline with duration
        await processAudio(uri, duration);
      } else {
        console.log('⚠️ Recording too short or no URI');
      }
    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
      setError(error instanceof Error ? error.message : 'Failed to stop recording');
    } finally {
      setIsProcessing(false);
    }
  };

  // Process audio through transcription → translation → TTS pipeline
  const processAudio = async (uri: string, recordingDuration?: number) => {
    // Start metrics collection for this turn
    const metricsCollector = metricsTracker.startTurn();
    
    // Set recording duration if provided
    if (recordingDuration) {
      metricsCollector.setRecordingDuration(recordingDuration);
    }
    
    try {
      // Get file size for metrics
      try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (fileInfo.exists && fileInfo.size) {
          metricsCollector.setFileSize(fileInfo.size);
        }
      } catch (e) {
        // Non-critical - ignore file size errors
      }
      
      // Step 1: Upload/Transcribe with language detection
      console.log('[UI] status=uploading');
      onStatusChange?.('uploading');
      
      // Small delay to show uploading state
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('[UI] status=transcribing');
      onStatusChange?.('transcribing');
      console.log('📝 Transcribing audio...');
      
      metricsCollector.startTimer('whisper');
      // Don't pass language hint to allow Whisper to auto-detect the spoken language
      // Pass auto-detect state and expected language for server-side validation
      const transcriptionResult = await processRecording(
        uri, 
        '', 
        participants.autoDetectSpeakers,
        sourceLanguage // Expected language when auto-detect is OFF
      );
      metricsCollector.endTimer('whisper');
      
      // Handle both string and object responses
      let transcription: string;
      let detectedLang: string | undefined;
      
      if (typeof transcriptionResult === 'object' && transcriptionResult !== null) {
        transcription = (transcriptionResult as any).text || '';
        detectedLang = (transcriptionResult as any).language;
      } else {
        transcription = transcriptionResult;
      }
      
      console.log('Transcription:', transcription);
      if (detectedLang) {
        console.log('Raw detected language:', detectedLang);
        // Normalize the language code (e.g., "german" → "de")
        const normalizedLang = normalizeLanguageCode(detectedLang);
        detectedLang = normalizedLang;
        console.log('Normalized language:', detectedLang);
        if (normalizedLang) {
          metricsCollector.setDetectedLanguage(normalizedLang);
        }
      }
      
      if (!transcription || transcription.trim() === '') {
        console.log('⚠️ No transcription received');
        return;
      }
      
      // Step 2: Determine speaker and target language
      let actualSourceLang = sourceLanguage;
      let actualTargetLang = targetLanguage;
      let speaker: 'A' | 'B' | undefined;
      
      console.log(`[AutoDetect] enabled=${participants.autoDetectSpeakers}, detectedLang=${detectedLang}`);
      
      if (participants.autoDetectSpeakers && detectedLang) {
        speaker = determineSpeaker(
          detectedLang,
          participants.A,
          participants.B,
          participants.lastTurnSpeaker
        );
        
        actualSourceLang = speaker === 'A' ? participants.A.lang : participants.B.lang;
        actualTargetLang = getTargetLanguage(speaker, participants.A, participants.B);
        
        console.log(`🎯 Speaker detected: ${speaker}`);
        console.log(`    targetLang: ${actualTargetLang}`);
        console.log(`    Route: ${actualSourceLang} → ${actualTargetLang}`);
        setLastTurnSpeaker(speaker);
      } else {
        // Manual mode: force A→B (or B→A if swapped) regardless of detected language
        console.log(`📍 Manual mode activated`);
        actualSourceLang = sourceLanguage;
        actualTargetLang = targetLanguage;
        console.log(`    Source: ${actualSourceLang}, Target: ${actualTargetLang}`);
        
        // Determine speaker based on configured source
        if (sourceLanguage === participants.A.lang) {
          speaker = 'A';
        } else if (sourceLanguage === participants.B.lang) {
          speaker = 'B';
        }
        
        // Check if detected language doesn't match expected source
        if (detectedLang && detectedLang !== actualSourceLang) {
          console.log(`📍 Manual mode: Detected ${detectedLang} but expecting ${actualSourceLang}`);
          
          // If they spoke the target language, suggest enabling auto-detect
          if (detectedLang === actualTargetLang) {
            console.log(`💡 User spoke target language (${detectedLang}). Consider enabling auto-detect for better results.`);
            // Show a helpful message to the user (user must manually close)
            setError('Wrong language! Enable "Auto-detect speakers" in Settings for automatic language switching');
            // No auto-dismiss - user controls when to close the tip
            
            // Don't proceed with translation - just show the tip
            onStatusChange?.('error');
            return;
          }
          // For other language mismatches, still show a warning but proceed
          console.log(`⚠️ Language mismatch but proceeding: ${actualSourceLang} → ${actualTargetLang}`);
        } else {
          console.log(`📍 Manual mode: ${actualSourceLang} → ${actualTargetLang}`);
        }
      }
      
      // Set target language for metrics
      metricsCollector.setTargetLanguage(actualTargetLang);
      
      // Step 3: Translate
      console.log('[UI] status=translating');
      onStatusChange?.('translating');
      console.log('🌐 Translating text...');
      
      // Check if source and target are the same (edge case)
      let translationResult: { translation: string };
      
      if (actualSourceLang === actualTargetLang) {
        console.log(`⚠️ Source and target are the same (${actualSourceLang}), skipping translation`);
        // Still create a "translation" that's the same as the original
        translationResult = { translation: transcription };
        metricsCollector.startTimer('translate');
        metricsCollector.endTimer('translate');
      } else {
        metricsCollector.startTimer('translate');
        translationResult = await translateText(
          transcription,
          actualSourceLang,
          actualTargetLang
        );
        metricsCollector.endTimer('translate');
      }
      
      console.log('Translation:', translationResult.translation);
      
      // Step 4: Create message with speaker info
      const message = {
        id: Date.now().toString(),
        text: transcription,
        translation: translationResult.translation,
        fromLanguage: actualSourceLang,
        toLanguage: actualTargetLang,
        timestamp: new Date(),
        speaker: speaker // Add speaker info
      };
      
      // Step 5: Add to conversation
      onMessage(message);
      
      // Step 6: TTS for translation
      const targetLangConfig = getLanguageConfig(actualTargetLang);
      const isTargetSupported = targetLangConfig?.speechSupported ?? true;
      
      if (isTargetSupported && translationResult.translation) {
        console.log('[UI] status=preparingAudio');
        onStatusChange?.('preparingAudio');
        
        // Log TTS voice selection (speakText now handles voice selection and logging)
        console.log(`🔊 TTS preparing for language: ${actualTargetLang}`);
        
        // Subtle haptic when TTS begins
        console.log('[UX] haptics=tts');
        if (Platform.OS !== 'web') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        // Set idle when TTS starts
        metricsCollector.startTimer('tts');
        await speakText(translationResult.translation, actualTargetLang);
        metricsCollector.endTimer('tts');
        console.log('[UI] status=idle (tts started)');
        onStatusChange?.('idle');
      } else {
        // Set idle if no TTS
        console.log('[UI] status=idle (no tts)');
        onStatusChange?.('idle');
      }
      
      console.log('✅ Pipeline complete');
      
      // Complete metrics collection for this turn
      metricsCollector.complete();
      
      // Step 7: Delete recording file to save storage (after TTS starts)
      console.log('🧹 [File] Scheduling delete after TTS started');
      await deleteRecordingFile(uri);
      
    } catch (error) {
      console.error('❌ Error processing audio:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to process audio';
      setError(errorMsg);
      
      // Complete metrics even on error
      metricsCollector.complete();
      
      // Show error status briefly
      onStatusChange?.('error');
      setTimeout(() => {
        onStatusChange?.('idle');
      }, 3000);
      
      // Still try to delete file even on error
      console.log('🧹 [File] Scheduling delete after error');
      await deleteRecordingFile(uri);
    }
  };

  // Handle text input submission
  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    
    try {
      setIsProcessing(true);
      
      const translationResult = await translateText(
        textInput,
        sourceLanguage,
        targetLanguage
      );
      
      const message = {
        id: Date.now().toString(),
        text: textInput,
        translation: translationResult.translation,
        fromLanguage: sourceLanguage,
        toLanguage: targetLanguage,
        timestamp: new Date()
      };
      
      onMessage(message);
      
      if (isTargetSpeechSupported && translationResult.translation) {
        await speakText(translationResult.translation, targetLanguage);
      }
      
      setTextInput('');
      setShowTextInput(false);
    } catch (error) {
      console.error('Error translating text:', error);
      setError(error instanceof Error ? error.message : 'Failed to translate text');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearError = () => setError(null);

  const getTextOnlyMessage = () => {
    if (!isSourceSpeechSupported && !isTargetSpeechSupported) {
      return 'Text-only mode: Neither language supports speech';
    } else if (!isSourceSpeechSupported) {
      return `Text-only input: ${sourceLanguageConfig?.name || sourceLanguage} doesn't support speech recognition`;
    } else {
      return `Text-only output: ${targetLanguageConfig?.name || targetLanguage} doesn't support speech synthesis`;
    }
  };

  return (
    <View style={styles.container}>
      {/* Error display */}
      {error && (
        <View style={styles.errorContainer}>
          <View style={styles.errorContent}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError}>
              <Ionicons name="close" size={16} color="#ff4444" />
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Text-only warning if either language doesn't support speech */}
      {(!isSourceSpeechSupported || !isTargetSpeechSupported) && (
        <View style={styles.textOnlyWarning}>
          <Text style={styles.textOnlyWarningText}>
            {getTextOnlyMessage()}
          </Text>
        </View>
      )}
      
      {/* Voice controls - compact button with integrated text */}
      <TouchableOpacity
        style={[
          styles.recordButtonCompact,
          isRecording && styles.recordButtonCompactActive,
          isProcessing && styles.recordButtonCompactProcessing,
          !isSourceSpeechSupported && styles.recordButtonCompactDisabled,
          isDarkMode && styles.recordButtonCompactDark,
          isRecording && isDarkMode && styles.recordButtonCompactActiveDark,
          isProcessing && isDarkMode && styles.recordButtonCompactProcessingDark
        ]}
        onPress={isRecording ? () => handleStopRecording() : handleStartRecording}
        accessibilityLabel={
          isProcessing ? "Processing" : 
          isRecording ? "Stop recording" : 
          "Record"
        }
        accessibilityRole="button"
        disabled={isProcessing || !isSourceSpeechSupported}
      >
        <View style={styles.recordButtonContent}>
          <Text style={[styles.recordIconCompact, isRecording && styles.recordIconCompactActive]}>
            {!isSourceSpeechSupported ? '🚫' : isProcessing ? '⏳' : isRecording ? '⏹️' : '🎤'}
          </Text>
          <Text style={[styles.recordButtonText, isRecording && styles.recordButtonTextActive, isDarkMode && styles.recordButtonTextDark]}>
            {!isSourceSpeechSupported
              ? 'Voice unavailable'
              : isProcessing 
              ? 'Processing...' 
              : isRecording 
                ? 'Tap to stop' 
                : 'Tap to speak'
            }
          </Text>
        </View>
      </TouchableOpacity>
      
      {/* Text input option for text-only languages */}
      {!isSourceSpeechSupported && (
        <>
          <TouchableOpacity
            style={styles.textInputButton}
            onPress={() => setShowTextInput(!showTextInput)}
          >
            <Text style={styles.textInputButtonText}>Type instead ⌨️</Text>
          </TouchableOpacity>
          
          {showTextInput && (
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Type your message here..."
                value={textInput}
                onChangeText={setTextInput}
                multiline
                onSubmitEditing={handleTextSubmit}
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleTextSubmit}
                disabled={!textInput.trim() || isProcessing}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: 'transparent',
  },

  errorContainer: {
    marginBottom: 15,
    backgroundColor: '#ffeeee',
    borderRadius: 8,
    padding: 10,
    width: '100%',
  },
  errorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    flex: 1,
  },
  textOnlyWarning: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    width: '100%',
  },
  textOnlyWarningText: {
    color: '#856404',
    fontSize: 14,
    textAlign: 'center',
  },
  // Compact record button styles
  recordButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 160,
    justifyContent: 'center',
  },
  recordButtonCompactDark: {
    backgroundColor: '#0051D5',
  },
  recordButtonCompactActive: {
    backgroundColor: '#ff4444',
  },
  recordButtonCompactActiveDark: {
    backgroundColor: '#cc0000',
  },
  recordButtonCompactProcessing: {
    backgroundColor: '#FFA500',
    opacity: 0.8,
  },
  recordButtonCompactProcessingDark: {
    backgroundColor: '#CC8400',
  },
  recordButtonCompactDisabled: {
    backgroundColor: '#cccccc',
    opacity: 0.5,
  },
  recordButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordIconCompact: {
    fontSize: 24,
    marginRight: 8,
  },
  recordIconCompactActive: {
    marginRight: 8,
  },
  recordButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  recordButtonTextActive: {
    color: '#ffffff',
  },
  recordButtonTextDark: {
    color: '#ffffff',
  },
  textInputButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  textInputButtonText: {
    color: 'white',
    fontSize: 16,
  },
  textInputContainer: {
    width: '100%',
    marginTop: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  textInput: {
    minHeight: 60,
    maxHeight: 120,
    padding: 10,
    fontSize: 16,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});// Cache bust: 1754791991
