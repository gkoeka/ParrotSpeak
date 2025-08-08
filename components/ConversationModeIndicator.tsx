/**
 * ConversationModeIndicator.tsx
 * 
 * Purpose: Visual indicator for Conversation Mode session state
 * Shows "Live" pill when armed, Stop button, and clear session status
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SessionState } from '../services/ConversationSessionService';
import { useConversation } from '../contexts/ConversationContext';
import { useTheme } from '../contexts/ThemeContext';

export default function ConversationModeIndicator() {
  const { isDarkMode } = useTheme();
  const { state, actions } = useConversation();
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  
  // Pulse animation for live indicator
  React.useEffect(() => {
    if (state.sessionState !== SessionState.DISARMED) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [state.sessionState, pulseAnim]);
  
  // Don't show if Conversation Mode is disabled in settings
  if (!state.conversationModeEnabled) {
    return null;
  }
  
  // Session state UI
  const renderSessionState = () => {
    switch (state.sessionState) {
      case SessionState.DISARMED:
        return (
          <View style={[styles.hintContainer, isDarkMode && styles.hintContainerDark]}>
            <Ionicons 
              name="mic-outline" 
              size={16} 
              color={isDarkMode ? '#999' : '#666'} 
            />
            <Text style={[styles.hintText, isDarkMode && styles.hintTextDark]}>
              Tap mic to start Conversation Mode
            </Text>
          </View>
        );
        
      case SessionState.ARMED_IDLE:
        return (
          <View style={styles.liveContainer}>
            <View style={[styles.livePill, isDarkMode && styles.livePillDark]}>
              <Animated.View 
                style={[
                  styles.liveDot,
                  { transform: [{ scale: pulseAnim }] }
                ]} 
              />
              <Text style={styles.liveText}>Conversation Mode • Live</Text>
            </View>
            <TouchableOpacity
              style={[styles.stopButton, isDarkMode && styles.stopButtonDark]}
              onPress={() => actions.endConversationSession('user')}
            >
              <Ionicons name="stop-circle" size={24} color="#FF4444" />
              <Text style={styles.stopText}>Stop</Text>
            </TouchableOpacity>
          </View>
        );
        
      case SessionState.RECORDING:
        return (
          <View style={styles.liveContainer}>
            <View style={[styles.livePill, styles.recordingPill]}>
              <Animated.View 
                style={[
                  styles.recordingDot,
                  { transform: [{ scale: pulseAnim }] }
                ]} 
              />
              <Text style={styles.liveText}>Recording...</Text>
            </View>
            <TouchableOpacity
              style={[styles.stopButton, isDarkMode && styles.stopButtonDark]}
              onPress={() => actions.endConversationSession('user')}
            >
              <Ionicons name="stop-circle" size={24} color="#FF4444" />
              <Text style={styles.stopText}>Stop</Text>
            </TouchableOpacity>
          </View>
        );
        
      case SessionState.PROCESSING:
        return (
          <View style={styles.liveContainer}>
            <View style={[styles.livePill, styles.processingPill]}>
              <Ionicons name="sync" size={16} color="#FFF" />
              <Text style={styles.liveText}>Processing...</Text>
            </View>
          </View>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      {renderSessionState()}
      
      {/* Session stats */}
      {state.sessionState !== SessionState.DISARMED && state.sessionStartTime && (
        <View style={[styles.statsContainer, isDarkMode && styles.statsContainerDark]}>
          <Text style={[styles.statsText, isDarkMode && styles.statsTextDark]}>
            {state.sessionUtteranceCount} utterance{state.sessionUtteranceCount !== 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
  },
  containerDark: {
    backgroundColor: '#1A1A1A',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  hintContainerDark: {
    opacity: 0.8,
  },
  hintText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  hintTextDark: {
    color: '#999',
  },
  liveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  livePillDark: {
    backgroundColor: '#2E7D32',
  },
  recordingPill: {
    backgroundColor: '#FF5722',
  },
  processingPill: {
    backgroundColor: '#2196F3',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
    marginRight: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
    marginRight: 8,
  },
  liveText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  stopButtonDark: {
    backgroundColor: '#2A2A2A',
  },
  stopText: {
    marginLeft: 4,
    color: '#FF4444',
    fontWeight: '600',
    fontSize: 14,
  },
  statsContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  statsContainerDark: {
    opacity: 0.8,
  },
  statsText: {
    fontSize: 12,
    color: '#666',
  },
  statsTextDark: {
    color: '#999',
  },
});