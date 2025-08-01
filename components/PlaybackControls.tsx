import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';

interface PlaybackControlsProps {
  isTranslation: boolean;
  messageId: string;
  text: string;
  language: string;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  isUser: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  hasBeenSpoken: boolean;
}

export default function PlaybackControls({
  isTranslation,
  messageId,
  text,
  language,
  onPlay,
  onPause,
  onResume,
  onStop,
  isUser,
  isSpeaking,
  isPaused,
  hasBeenSpoken
}: PlaybackControlsProps) {

  const handlePlayPause = () => {
    if (isSpeaking) {
      if (isPaused) {
        onResume();
      } else {
        onPause();
      }
    } else {
      onPlay();
    }
  };

  const handleStop = () => {
    onStop();
  };

  const getPlayPauseIcon = () => {
    if (isSpeaking && !isPaused) {
      return '⏸️'; // Pause icon when speaking
    } else if (isPaused) {
      return '▶️'; // Play icon when paused
    } else {
      return '▶️'; // Play icon when not speaking
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.controlButton}
        onPress={handlePlayPause}
      >
        <Text style={styles.controlIcon}>
          {getPlayPauseIcon()}
        </Text>
      </TouchableOpacity>
      
      {(isSpeaking || isPaused) && (
        <TouchableOpacity 
          style={[styles.controlButton, styles.stopButton]}
          onPress={handleStop}
        >
          <Text style={styles.controlIcon}>
            ⏹️
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  stopButton: {
    backgroundColor: '#ffe6e6',
    borderColor: '#ffcccc',
  },
  controlIcon: {
    fontSize: 20,
  },
});