import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

import { startRecording, stopRecording, processRecording, speakText } from '../api/speechService';
import { translateText } from '../api/languageService';

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
      console.log('Processing audio...', uri);
      
      // Step 1: Transcribe audio to text
      const transcription = await processRecording(uri, sourceLanguage);
      console.log('Transcription:', transcription);
      
      // Step 2: Translate the text
      const translationResult = await translateText(
        transcription,
        sourceLanguage,
        targetLanguage
      );
      console.log('Translation:', translationResult);
      
      // Step 3: Speak the translation
      await speakTranslation(translationResult.translation, targetLanguage);
      
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
      
    } catch (error) {
      console.error('Error processing audio:', error);
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to process your voice. Please try again.');
    }
  };

  const speakTranslation = async (text: string, languageCode: string) => {
    try {
      await speakText(text, languageCode);
    } catch (error) {
      console.error('Error speaking translation:', error);
      // Don't show error to user for speech synthesis failures
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.recordButton,
          isRecording && styles.recordButtonActive,
          isProcessing && styles.recordButtonProcessing
        ]}
        onPress={isRecording ? handleStopRecording : handleStartRecording}
        disabled={isProcessing}
      >
        <Text style={styles.recordIcon}>
          {isProcessing ? '⏳' : isRecording ? '⏹️' : '🎤'}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.instructionText}>
        {isProcessing 
          ? 'Processing...' 
          : isRecording 
            ? 'Tap to stop recording' 
            : 'Tap to start speaking'
        }
      </Text>
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
});