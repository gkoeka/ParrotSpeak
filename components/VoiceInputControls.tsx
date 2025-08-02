import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';

import { startRecording, stopRecording, processRecording, speakText } from '../api/speechService';
import { translateText } from '../api/languageService';
import { getLanguageByCode } from '../constants/languageConfiguration';
import { performanceMonitor } from '../utils/performanceMonitor';

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
}

export default function VoiceInputControls({ 
  onMessage, 
  sourceLanguage = 'en-US',
  targetLanguage = 'es-ES'
}: VoiceInputControlsProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  
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