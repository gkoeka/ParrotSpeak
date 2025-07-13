import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  TextInput,
  Keyboard,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Language } from '../types';
import { SubscriptionModal } from './SubscriptionModal';
import { checkFeatureAccess } from '../api/subscriptionService';

interface VoiceInputControlsProps {
  isRecording: boolean;
  isProcessing?: boolean;
  voiceLevel: number;
  language: Language;
  speechError: string | null;
  onStartRecording: () => void;
  onStopRecording: () => Promise<string | null>;
  onTextSubmit?: (text: string) => void;
}

export default function VoiceInputControls({
  isRecording,
  isProcessing = false,
  voiceLevel,
  language,
  speechError,
  onStartRecording,
  onStopRecording,
  onTextSubmit
}: VoiceInputControlsProps) {
  const [showTextInput, setShowTextInput] = useState(false);
  const [text, setText] = useState('');
  const [pulseAnim] = useState(new Animated.Value(1));
  const [waveAnim] = useState(new Animated.Value(0));
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [hasEverSubscribed, setHasEverSubscribed] = useState(false);
  
  // Animation for the recording button
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      ).start();
      
      // Wave animation
      Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true
        })
      ).start();
    } else {
      pulseAnim.setValue(1);
      waveAnim.setValue(0);
    }
  }, [isRecording]);
  
  // Animation for voice level indicator
  const voiceLevelScale = voiceLevel * 0.01 + 1; // Scale based on voice level
  
  const handleTextSubmit = () => {
    if (text.trim() && onTextSubmit) {
      onTextSubmit(text);
      setText('');
      setShowTextInput(false);
      Keyboard.dismiss();
    }
  };
  
  const handleRecordPress = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };
  
  const handleLongPressStart = () => {
    onStartRecording();
  };
  
  const handleLongPressEnd = () => {
    if (isRecording) {
      onStopRecording();
    }
  };
  
  return (
    <View style={styles.container}>
      {showTextInput ? (
        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder={`Type in ${language.name}...`}
            value={text}
            onChangeText={setText}
            onSubmitEditing={handleTextSubmit}
            autoFocus
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleTextSubmit}
            disabled={!text.trim()}
          >
            <Icon 
              name="send" 
              size={20} 
              color={text.trim() ? '#4F46E5' : '#ccc'} 
            />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={styles.textModeButton}
            onPress={() => setShowTextInput(true)}
          >
            <Icon name="type" size={20} color="#4F46E5" />
          </TouchableOpacity>
          
          <View style={styles.micButtonContainer}>
            {isRecording && (
              <Animated.View 
                style={[
                  styles.voiceWave,
                  {
                    transform: [
                      { scale: Animated.multiply(pulseAnim, voiceLevelScale) },
                      {
                        translateY: waveAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0, -10, 0]
                        })
                      }
                    ],
                    opacity: waveAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 0.3, 0]
                    })
                  }
                ]}
              />
            )}
            
            <TouchableOpacity
              style={[
                styles.micButton,
                isRecording && styles.recordingMicButton,
                isProcessing && styles.processingMicButton
              ]}
              onPress={handleRecordPress}
              onLongPress={handleLongPressStart}
              onPressOut={handleLongPressEnd}
              delayLongPress={500}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Icon name="loader" size={28} color="#fff" />
              ) : (
                <Icon 
                  name={isRecording ? "mic-off" : "mic"} 
                  size={28} 
                  color="#fff" 
                />
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.languageIndicator}>
            <Text style={styles.languageText}>{language.name}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  micButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  voiceWave: {
    position: 'absolute',
    width: 120, // Increased to match the larger mic button
    height: 120, // Increased to match the larger mic button
    borderRadius: 60, // Half of width/height for a perfect circle
    backgroundColor: '#4F46E5',
    opacity: 0.2,
  },
  micButton: {
    width: 76.8, // Increased by 20% from 64px
    height: 76.8, // Increased by 20% from 64px
    borderRadius: 38.4, // Half of width/height for a perfect circle
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 2,
  },
  recordingMicButton: {
    backgroundColor: '#ef4444',
  },
  processingMicButton: {
    backgroundColor: '#9ca3af',
  },
  textModeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageIndicator: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  languageText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 24,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
