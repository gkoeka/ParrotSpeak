import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { legacyStartRecording, legacyStopRecording, processRecording, speakText } from '../api/speechService';
import { translateText } from '../api/languageService';
import { getLanguageByCode } from '../constants/languageConfiguration';
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
  showAlwaysListeningToggle?: boolean;
  onAlwaysListeningToggle?: (enabled: boolean) => void;
}

export default function VoiceInputControls({ 
  onMessage, 
  sourceLanguage = 'en-US',
  targetLanguage = 'es-ES'
}: VoiceInputControlsProps) {
  const { isDarkMode } = useTheme();
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);

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
      setIsRecording(false);
      
      const { uri, duration } = await legacyStopRecording();
      
      if (uri && duration > 500) {
        console.log(`✅ Recording stopped. Duration: ${duration}ms`);
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
      // Step 1: Transcribe
      console.log('📝 Transcribing audio...');
      const transcription = await processRecording(uri, sourceLanguage);
      console.log('Transcription:', transcription);
      
      if (!transcription || transcription.trim() === '') {
        console.log('⚠️ No transcription received');
        return;
      }
      
      // Step 2: Translate
      console.log('🌐 Translating text...');
      const translationResult = await translateText(
        transcription,
        sourceLanguage,
        targetLanguage
      );
      console.log('Translation:', translationResult.translation);
      
      // Step 3: Create message
      const message = {
        id: Date.now().toString(),
        text: transcription,
        translation: translationResult.translation,
        fromLanguage: sourceLanguage,
        toLanguage: targetLanguage,
        timestamp: new Date()
      };
      
      // Step 4: Add to conversation
      onMessage(message);
      
      // Step 5: TTS for translation
      if (isTargetSpeechSupported && translationResult.translation) {
        console.log('🔊 Speaking translation...');
        await speakText(translationResult.translation, targetLanguage);
      }
      
      console.log('✅ Pipeline complete');
      
    } catch (error) {
      console.error('❌ Error processing audio:', error);
      setError(error instanceof Error ? error.message : 'Failed to process audio');
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
      
      {/* Voice controls - simple tap to start/stop */}
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
  },
  recordButtonActive: {
    backgroundColor: '#ff4444',
  },
  recordButtonProcessing: {
    backgroundColor: '#FFA500',
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