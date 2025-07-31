import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

interface VoiceInputControlsProps {
  onMessage: (message: {
    id: string;
    text: string;
    translation: string;
    fromLanguage: string;
    toLanguage: string;
    timestamp: Date;
  }) => void;
}

export default function VoiceInputControls({ onMessage }: VoiceInputControlsProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartRecording = async () => {
    try {
      setIsRecording(true);
      // TODO: Implement actual voice recording
      setTimeout(() => {
        setIsRecording(false);
        setIsProcessing(true);
        
        // Simulate processing and translation
        setTimeout(() => {
          setIsProcessing(false);
          onMessage({
            id: Date.now().toString(),
            text: "Hello, how are you?",
            translation: "Hola, ¿cómo estás?",
            fromLanguage: "English",
            toLanguage: "Spanish",
            timestamp: new Date()
          });
        }, 2000);
      }, 3000);
    } catch (error) {
      setIsRecording(false);
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
    }, 2000);
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