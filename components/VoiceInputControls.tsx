import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { startRecording, stopRecording, processRecording, speakText } from '../api/speechService';
import { translateText } from '../api/languageService';
import { getLanguageByCode } from '../constants/languageConfiguration';
import { performanceMonitor } from '../utils/performanceMonitor';
import AlwaysListeningToggle from './AlwaysListeningToggle';
import VoiceActivityService, { VoiceActivityCallbacks, AudioChunk } from '../services/VoiceActivityService';
import { useConversation } from '../contexts/ConversationContext';
import { useTheme } from '../contexts/ThemeContext';

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
  // TODO: Phase 2 - Add always listening props
  showAlwaysListeningToggle?: boolean;
  onAlwaysListeningToggle?: (enabled: boolean) => void;
}

export default function VoiceInputControls({ 
  onMessage, 
  sourceLanguage = 'en-US',
  targetLanguage = 'es-ES',
  showAlwaysListeningToggle = false,
  onAlwaysListeningToggle
}: VoiceInputControlsProps) {
  const { isDarkMode } = useTheme();
  const { state, actions } = useConversation();
  
  // Legacy recording state (for manual recording)
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  
  // Phase 1: VoiceActivityService integration
  const voiceActivityServiceRef = useRef<VoiceActivityService | null>(null);
  const [vadInitialized, setVadInitialized] = useState(false);
  
  // Check if source or target language supports speech
  // Handle language codes that might be passed with regional variants
  const normalizeLanguageCode = (code: string) => {
    // For language codes like 'en-US', 'es-ES', use the base code for lookup
    if (code.includes('-') && code.length > 3) {
      const baseCode = code.split('-')[0];
      // Check if we have a specific regional variant first
      const specificLang = getLanguageByCode(code);
      if (specificLang) return specificLang;
      // Otherwise try the base code
      return getLanguageByCode(baseCode);
    }
    return getLanguageByCode(code);
  };
  
  const sourceLanguageConfig = normalizeLanguageCode(sourceLanguage);
  const targetLanguageConfig = normalizeLanguageCode(targetLanguage);
  const isSourceSpeechSupported = sourceLanguageConfig?.speechSupported ?? true;
  const isTargetSpeechSupported = targetLanguageConfig?.speechSupported ?? true;

  // Phase 1: Initialize VoiceActivityService on mount
  useEffect(() => {
    const initializeVAD = async () => {
      try {
        console.log('🎤 VoiceInputControls: Initializing VoiceActivityService...');
        
        const vadService = new VoiceActivityService();
        voiceActivityServiceRef.current = vadService;
        
        // Set up callbacks for VAD events
        const callbacks: VoiceActivityCallbacks = {
          onSpeechStart: () => {
            console.log('🗣️ VoiceInputControls: Speech start detected');
            actions.setMicrophoneActive(true);
          },
          onSpeechEnd: (chunk: AudioChunk) => {
            console.log('🔇 VoiceInputControls: Speech end detected, chunk:', chunk);
            actions.setMicrophoneActive(false);
            // TODO: Phase 2 - Process chunk for translation
          },
          onSilenceDetected: (duration: number) => {
            console.log(`⏰ VoiceInputControls: Silence detected (${duration}ms)`);
            // TODO: Phase 2 - Handle speaker switching
          },
          onError: (error: Error) => {
            console.error('❌ VoiceInputControls: VAD error:', error);
            actions.setError(error.message);
          },
        };
        
        await vadService.initialize(callbacks);
        actions.setMicPermission(true);
        setVadInitialized(true);
        console.log('✅ VoiceInputControls: VoiceActivityService initialized');
        
      } catch (error) {
        console.error('❌ VoiceInputControls: Failed to initialize VAD:', error);
        actions.setError(error instanceof Error ? error.message : 'Failed to initialize voice detection');
        actions.setMicPermission(false);
      }
    };

    initializeVAD();

    // Cleanup on unmount
    return () => {
      if (voiceActivityServiceRef.current) {
        voiceActivityServiceRef.current.dispose();
        voiceActivityServiceRef.current = null;
      }
    };
  }, []);

  // Phase 1: Handle VoiceActivityService start/stop
  const handleVADToggle = async () => {
    if (!voiceActivityServiceRef.current || !vadInitialized) {
      Alert.alert('Error', 'Voice detection not initialized');
      return;
    }

    try {
      if (state.isListening) {
        console.log('🛑 VoiceInputControls: Stopping VAD...');
        await voiceActivityServiceRef.current.stopListening();
        actions.setListening(false);
      } else {
        console.log('🎤 VoiceInputControls: Starting VAD...');
        await voiceActivityServiceRef.current.startListening();
        actions.setListening(true);
      }
    } catch (error) {
      console.error('❌ VoiceInputControls: VAD toggle failed:', error);
      actions.setError(error instanceof Error ? error.message : 'Failed to toggle voice detection');
    }
  };

  const handleStartRecording = async () => {
    try {
      setIsRecording(true);
      console.log('Starting recording...');
      
      const result = await startRecording();
      setRecordingUri(result.uri);
      console.log('Recording started:', result.uri);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      Alert.alert('Error', 'Failed to start recording. Please check microphone permissions.');
    }
  };

  const handleStopRecording = async () => {
    try {
      setIsRecording(false);
      setIsProcessing(true);
      console.log('Stopping recording...');
      
      const result = await stopRecording();
      console.log('Recording stopped:', result.uri);
      
      // Process the recording
      await processAudio(result.uri);
      
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to process recording');
    }
  };

  const processAudio = async (uri: string) => {
    try {
      // Performance timing
      const startTime = Date.now();
      const timings: Record<string, number> = {};
      
      console.log('Processing audio...', uri);
      
      // Step 1: Transcribe audio to text
      const transcribeStart = Date.now();
      const transcription = await processRecording(uri, sourceLanguage);
      timings.transcription = Date.now() - transcribeStart;
      console.log(`Transcription (${timings.transcription}ms):`, transcription);
      
      // Step 2: Translate the text
      const translateStart = Date.now();
      const translationResult = await translateText(
        transcription,
        sourceLanguage,
        targetLanguage
      );
      timings.translation = Date.now() - translateStart;
      console.log(`Translation (${timings.translation}ms):`, translationResult);
      
      // Step 3: Speak the translation (non-blocking)
      const speakStart = Date.now();
      // Don't await speech synthesis to reduce total time
      speakTranslation(translationResult.translation, targetLanguage)
        .then(() => {
          console.log(`Speech synthesis completed (${Date.now() - speakStart}ms)`);
        })
        .catch(err => {
          console.error('Speech synthesis failed:', err);
        });
      
      // Step 4: Add to conversation
      const message = {
        id: Date.now().toString(),
        text: transcription,
        translation: translationResult.translation,
        fromLanguage: sourceLanguage,
        toLanguage: targetLanguage,
        timestamp: new Date()
      };
      
      onMessage(message);
      setIsProcessing(false);
      
      // Log total time
      timings.total = Date.now() - startTime;
      console.log('⏱️ Translation Performance:', {
        transcription: `${timings.transcription}ms`,
        translation: `${timings.translation}ms`,
        total: `${timings.total}ms`,
        target: '1500ms'
      });
      
      // Track performance metrics
      performanceMonitor.addMetric({
        transcriptionTime: timings.transcription,
        translationTime: timings.translation,
        totalTime: timings.total,
        audioSize: uri.length, // Approximate from URI length
        textLength: transcription.length,
        timestamp: new Date(),
        sourceLanguage,
        targetLanguage
      });
      
      // Log performance stats periodically
      if (Math.random() < 0.1) { // 10% of requests
        const stats = performanceMonitor.getStats();
        console.log('📊 Performance Stats:', stats);
        const suggestions = performanceMonitor.getOptimizationSuggestions();
        if (suggestions.length > 0) {
          console.log('💡 Optimization suggestions:', suggestions);
        }
      }
      
    } catch (error) {
      console.error('Error processing audio:', error);
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to process your voice. Please try again.');
    }
  };

  const speakTranslation = async (text: string, languageCode: string) => {
    try {
      // Only speak if target language supports speech
      if (isTargetSpeechSupported) {
        await speakText(text, languageCode);
      }
    } catch (error) {
      console.error('Error speaking translation:', error);
      // Don't show error to user for speech synthesis failures
    }
  };
  
  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    
    setIsProcessing(true);
    try {
      // Translate the text
      const translationResult = await translateText(
        textInput,
        sourceLanguage,
        targetLanguage
      );
      
      // Speak if supported
      await speakTranslation(translationResult.translation, targetLanguage);
      
      // Add to conversation
      const message = {
        id: Date.now().toString(),
        text: textInput,
        translation: translationResult.translation,
        fromLanguage: sourceLanguage,
        toLanguage: targetLanguage,
        timestamp: new Date()
      };
      
      onMessage(message);
      setTextInput('');
      setShowTextInput(false);
    } catch (error) {
      console.error('Error translating text:', error);
      Alert.alert('Error', 'Failed to translate text. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate dynamic message based on which language is text-only
  const getTextOnlyMessage = () => {
    if (!sourceLanguageConfig || !targetLanguageConfig) return '';
    
    if (!isSourceSpeechSupported && !isTargetSpeechSupported) {
      // Both are text-only
      return `Text-only support: Both ${sourceLanguageConfig.name} and ${targetLanguageConfig.name} are only available as text in this app.`;
    } else if (!isSourceSpeechSupported) {
      // Only source is text-only
      return `Text-only support: You can speak and hear in ${targetLanguageConfig.name}, but ${sourceLanguageConfig.name} is only available as text in this app.`;
    } else if (!isTargetSpeechSupported) {
      // Only target is text-only
      return `Text-only support: You can speak and hear in ${sourceLanguageConfig.name}, but ${targetLanguageConfig.name} is only available as text in this app.`;
    }
    return '';
  };

  return (
    <View style={styles.container}>
      {/* Always Listening Toggle - TODO: Phase 2 - Wire up to conversation context */}
      {showAlwaysListeningToggle && (
        <View style={styles.alwaysListeningContainer}>
          <AlwaysListeningToggle
            variant="switch"
            size="medium"
            showStatus={true}
            onToggle={onAlwaysListeningToggle}
          />
        </View>
      )}

      {/* Phase 1: Voice Activity Detection Controls */}
      <View style={styles.vadContainer}>
        <Text style={[styles.vadTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
          Voice Activity Detection (Phase 1)
        </Text>
        
        <TouchableOpacity
          style={[
            styles.vadButton,
            state.isListening && styles.vadButtonActive,
            !vadInitialized && styles.vadButtonDisabled,
            { backgroundColor: state.isListening ? '#ff4444' : '#3366FF' }
          ]}
          onPress={handleVADToggle}
          disabled={!vadInitialized}
        >
          <Ionicons 
            name={state.isListening ? 'stop' : 'mic'} 
            size={24} 
            color="#ffffff" 
          />
          <Text style={styles.vadButtonText}>
            {!vadInitialized ? 'Initializing...' : state.isListening ? 'Stop Listening' : 'Start Listening'}
          </Text>
        </TouchableOpacity>

        {/* Mic activity indicator */}
        {state.isListening && (
          <View style={[
            styles.micIndicator,
            state.isMicrophoneActive && styles.micIndicatorActive
          ]}>
            <Ionicons 
              name={state.isMicrophoneActive ? 'mic' : 'mic-outline'} 
              size={16} 
              color={state.isMicrophoneActive ? '#00ff00' : '#666666'} 
            />
            <Text style={[
              styles.micIndicatorText,
              { color: state.isMicrophoneActive ? '#00ff00' : '#666666' }
            ]}>
              {state.isMicrophoneActive ? 'Speech Detected' : 'Listening...'}
            </Text>
          </View>
        )}

        {/* Permission status */}
        <View style={styles.permissionStatus}>
          <Ionicons 
            name={state.micPermissionGranted ? 'checkmark-circle' : 'close-circle'} 
            size={16} 
            color={state.micPermissionGranted ? '#00ff00' : '#ff4444'} 
          />
          <Text style={[
            styles.permissionText,
            { color: state.micPermissionGranted ? '#00ff00' : '#ff4444' }
          ]}>
            Microphone {state.micPermissionGranted ? 'Granted' : 'Denied'}
          </Text>
        </View>

        {/* Error display */}
        {state.error && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={16} color="#ff4444" />
            <Text style={styles.errorText}>{state.error}</Text>
            <TouchableOpacity onPress={actions.clearError}>
              <Ionicons name="close" size={16} color="#ff4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* Text-only warning if either language doesn't support speech */}
      {(!isSourceSpeechSupported || !isTargetSpeechSupported) && (
        <View style={styles.textOnlyWarning}>
          <Text style={styles.textOnlyWarningText}>
            {getTextOnlyMessage()}
          </Text>
        </View>
      )}
      
      {/* Voice controls - disabled if source doesn't support speech */}
      <TouchableOpacity
        style={[
          styles.recordButton,
          isRecording && styles.recordButtonActive,
          isProcessing && styles.recordButtonProcessing,
          !isSourceSpeechSupported && styles.recordButtonDisabled
        ]}
        onPress={isRecording ? handleStopRecording : handleStartRecording}
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
                style={[styles.sendButton, isProcessing && styles.sendButtonDisabled]}
                onPress={handleTextSubmit}
                disabled={isProcessing || !textInput.trim()}
              >
                <Text style={styles.sendButtonText}>Send →</Text>
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
    paddingVertical: 20,
  },
  // TODO: Phase 2 - Style always listening integration
  alwaysListeningContainer: {
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  
  // Phase 1: VAD Controls Styling
  vadContainer: {
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  vadTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  vadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    minWidth: 160,
  },
  vadButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  vadButtonDisabled: {
    opacity: 0.5,
  },
  vadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  micIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  micIndicatorActive: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
  },
  micIndicatorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  permissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  permissionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 8,
    maxWidth: '100%',
  },
  errorText: {
    flex: 1,
    color: '#ff4444',
    fontSize: 12,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3366FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recordButtonActive: {
    backgroundColor: '#ff4757',
    transform: [{ scale: 1.1 }],
  },
  recordButtonProcessing: {
    backgroundColor: '#ffa502',
  },
  recordIcon: {
    fontSize: 32,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  recordButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  textOnlyWarning: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    marginHorizontal: 20,
  },
  textOnlyWarningText: {
    color: '#856404',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  textInputButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  textInputButtonText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '600',
  },
  textInputContainer: {
    marginTop: 16,
    paddingHorizontal: 20,
    width: '100%',
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#3366FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});