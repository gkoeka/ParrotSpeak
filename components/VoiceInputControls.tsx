import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { legacyStartRecording, legacyStopRecording, processRecording, speakText, deleteRecordingFile } from '../api/speechService';
import { translateText } from '../api/languageService';
import { getLanguageByCode } from '../constants/languageConfiguration';
import { useTheme } from '../contexts/ThemeContext';
import { useParticipants } from '../contexts/ParticipantsContext';
import { determineSpeaker, getTargetLanguage } from '../utils/languageDetection';
import { PipelineStatus } from './StatusPill';

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

  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  
  // Track if long recording banner has been shown this session
  const [longRecordingBannerShown, setLongRecordingBannerShown] = useState(false);

  // Check if source or target language supports speech
  const normalizeLanguageCode = (code: string) => {
    if (code.includes('-') && code.length > 3) {
      const baseCode = code.split('-')[0];
      const specificLang = getLanguageByCode(code);
      if (specificLang) return specificLang;
      return getLanguageByCode(baseCode);
    }
    return getLanguageByCode(code);
  };
  
  const sourceLanguageConfig = normalizeLanguageCode(sourceLanguage);
  const targetLanguageConfig = normalizeLanguageCode(targetLanguage);
  const isSourceSpeechSupported = sourceLanguageConfig?.speechSupported ?? true;
  const isTargetSpeechSupported = targetLanguageConfig?.speechSupported ?? true;

  // Simple start recording - legacy mode only
  const handleStartRecording = async () => {
    try {
      console.log('🎤 Starting recording...');
      console.log('[UX] haptics=start');
      
      // Light haptic on start
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      setIsRecording(true);
      setError(null);
      
      await legacyStartRecording();
      console.log('✅ Recording started - tap again to stop');
      
    } catch (error: any) {
      console.error('❌ Failed to start recording:', error);
      setIsRecording(false);
      
      if (error.message?.includes('permission')) {
        Alert.alert('Error', 'Microphone permission denied. Please enable it in settings.');
      } else if (error.message?.includes('Audio module not available')) {
        Alert.alert('Error', 'Audio recording is not supported on this device.');
      } else {
        setError(error.message || 'Failed to start recording');
      }
    }
  };

  // Simple stop recording and process
  const handleStopRecording = async () => {
    try {
      console.log('🛑 Stopping recording...');
      console.log('[UX] haptics=stop');
      
      // Light haptic on stop
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      setIsRecording(false);
      
      const { uri, duration } = await legacyStopRecording();
      
      if (uri && duration > 500) {
        console.log(`✅ Recording stopped. Duration: ${duration}ms`);
        
        // Check for long recording and show banner if needed
        if (duration > 60000 && !longRecordingBannerShown) {
          setError('Let\'s try shorter turns (≤60s) for better results');
          setTimeout(() => setError(null), 5000); // Show for 5 seconds
          setLongRecordingBannerShown(true);
        }
        
        console.log('🔄 Processing audio for translation...');
        setIsProcessing(true);
        
        // Process the recording through the translation pipeline
        await processAudio(uri);
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
  const processAudio = async (uri: string) => {
    try {
      // Step 1: Upload/Transcribe with language detection
      console.log('[UI] status=uploading');
      onStatusChange?.('uploading');
      
      // Small delay to show uploading state
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('[UI] status=transcribing');
      onStatusChange?.('transcribing');
      console.log('📝 Transcribing audio...');
      const transcriptionResult = await processRecording(uri, sourceLanguage);
      
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
        console.log('Detected language:', detectedLang);
      }
      
      if (!transcription || transcription.trim() === '') {
        console.log('⚠️ No transcription received');
        return;
      }
      
      // Step 2: Determine speaker and target language
      let actualSourceLang = sourceLanguage;
      let actualTargetLang = targetLanguage;
      let speaker: 'A' | 'B' | undefined;
      
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
        // Manual mode: use provided source/target
        actualSourceLang = sourceLanguage;
        actualTargetLang = targetLanguage;
        console.log(`📍 Manual mode: ${actualSourceLang} → ${actualTargetLang}`);
      }
      
      // Step 3: Translate
      console.log('[UI] status=translating');
      onStatusChange?.('translating');
      console.log('🌐 Translating text...');
      const translationResult = await translateText(
        transcription,
        actualSourceLang,
        actualTargetLang
      );
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
      const targetLangConfig = normalizeLanguageCode(actualTargetLang);
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
        await speakText(translationResult.translation, actualTargetLang);
        console.log('[UI] status=idle (tts started)');
        onStatusChange?.('idle');
      } else {
        // Set idle if no TTS
        console.log('[UI] status=idle (no tts)');
        onStatusChange?.('idle');
      }
      
      console.log('✅ Pipeline complete');
      
      // Step 7: Delete recording file to save storage
      await deleteRecordingFile(uri);
      
    } catch (error) {
      console.error('❌ Error processing audio:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to process audio';
      setError(errorMsg);
      
      // Show error status briefly
      onStatusChange?.('error');
      setTimeout(() => {
        onStatusChange?.('idle');
      }, 3000);
      
      // Still try to delete file even on error
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
      {/* Participants display and controls */}
      <View style={styles.participantsContainer}>
        <View style={styles.participantInfo}>
          <Text style={styles.participantLabel}>A: {participants.A.lang}</Text>
          <Text style={styles.directionArrow}>→</Text>
          <Text style={styles.participantLabel}>B: {participants.B.lang}</Text>
        </View>
        
        <View style={styles.controlsRow}>
          <TouchableOpacity 
            style={styles.swapButton}
            onPress={swapParticipants}
          >
            <Ionicons name="swap-horizontal" size={20} color="#007AFF" />
            <Text style={styles.swapButtonText}>Swap</Text>
          </TouchableOpacity>
          
          <View style={styles.autoDetectContainer}>
            <Text style={styles.autoDetectLabel}>
              {participants.autoDetectSpeakers ? '🟢 Auto' : '🔴 Manual'}
            </Text>
          </View>
        </View>
      </View>

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
      
      {/* Voice controls - simple tap to start/stop */}
      <TouchableOpacity
        style={[
          styles.recordButton,
          isRecording && styles.recordButtonActive,
          isProcessing && styles.recordButtonProcessing,
          !isSourceSpeechSupported && styles.recordButtonDisabled,
          isDarkMode && styles.recordButtonDark,
          isRecording && isDarkMode && styles.recordButtonActiveDark,
          isProcessing && isDarkMode && styles.recordButtonProcessingDark
        ]}
        onPress={isRecording ? handleStopRecording : handleStartRecording}
        accessibilityLabel={
          isProcessing ? "Processing" : 
          isRecording ? "Stop recording" : 
          "Record"
        }
        accessibilityRole="button"
        disabled={isProcessing || !isSourceSpeechSupported}
      >
        <Text style={styles.recordIcon}>
          {!isSourceSpeechSupported ? '🚫' : isProcessing ? '⏳' : isRecording ? '⏹️' : '🎤'}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.instructionText}>
        {!isSourceSpeechSupported
          ? 'Voice input not available for this language'
          : isProcessing 
          ? 'Processing...' 
          : isRecording 
            ? 'Tap to stop recording' 
            : 'Tap to start speaking'
        }
      </Text>
      
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
    padding: 20,
    backgroundColor: 'transparent',
  },
  participantsContainer: {
    width: '100%',
    marginBottom: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    padding: 10,
  },
  participantInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  participantLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  directionArrow: {
    fontSize: 18,
    marginHorizontal: 10,
    color: '#666',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  swapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  swapButtonText: {
    color: '#007AFF',
    marginLeft: 5,
    fontSize: 14,
  },
  autoDetectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  autoDetectLabel: {
    fontSize: 14,
    color: '#666',
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
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  recordButtonDark: {
    backgroundColor: '#0051D5',
  },
  recordButtonActive: {
    backgroundColor: '#ff4444',
    borderColor: '#ff6666',
  },
  recordButtonActiveDark: {
    backgroundColor: '#cc0000',
    borderColor: '#ff4444',
  },
  recordButtonProcessing: {
    backgroundColor: '#FFA500',
    borderColor: '#FFB733',
    opacity: 0.8,
  },
  recordButtonProcessingDark: {
    backgroundColor: '#CC8400',
    borderColor: '#FFA500',
  },
  recordButtonDisabled: {
    backgroundColor: '#cccccc',
    opacity: 0.5,
  },
  recordIcon: {
    fontSize: 32,
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
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
});