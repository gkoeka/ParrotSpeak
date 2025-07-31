import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';

export default function PlaybackControls() {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // TODO: Implement actual audio playback
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.controlButton}
        onPress={handlePlayPause}
      >
        <Text style={styles.controlIcon}>
          {isPlaying ? '⏸️' : '▶️'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
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
  controlIcon: {
    fontSize: 20,
  },
});