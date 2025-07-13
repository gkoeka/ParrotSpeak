import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Text,
  Clipboard
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

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
  hasBeenSpoken?: boolean;
}

/**
 * Mobile-friendly playback controls for individual messages
 * Provides play/pause/stop functionality with consistent mobile UI
 */
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
  hasBeenSpoken = false
}: PlaybackControlsProps) {
  const [hasEverPlayed, setHasEverPlayed] = useState(hasBeenSpoken);

  // Track if this message has ever been played
  useEffect(() => {
    if (isSpeaking || hasBeenSpoken) {
      setHasEverPlayed(true);
    }
  }, [isSpeaking, hasBeenSpoken]);

  // Handle play button click
  const handlePlay = () => {
    setHasEverPlayed(true);
    if (isPaused) {
      onResume();
    } else {
      onPlay();
    }
  };

  // Handle pause button click
  const handlePause = () => {
    onPause();
  };

  // Handle stop button click
  const handleStop = () => {
    onStop();
  };

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await Clipboard.setString(text);
      Alert.alert('Copied', 'Text copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Error', 'Failed to copy text');
    }
  };

  // Debug logging to track visibility
  console.log(`[PlaybackControls] Message ${messageId.slice(0, 6)}... - isTranslation: ${isTranslation}, hasEverPlayed: ${hasEverPlayed}, hasBeenSpoken: ${hasBeenSpoken}`);
  
  // Only show controls for translation messages or messages that have been played
  if (!isTranslation && !hasEverPlayed) {
    console.log(`[PlaybackControls] Message ${messageId.slice(0, 6)}... - HIDDEN (not translation and never played)`);
    return null;
  }
  
  console.log(`[PlaybackControls] Message ${messageId.slice(0, 6)}... - SHOWING controls`);

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        {/* Play/Pause Button */}
        <TouchableOpacity 
          style={[styles.button, styles.playButton]}
          onPress={isSpeaking && !isPaused ? handlePause : handlePlay}
        >
          <Icon 
            name={isSpeaking && !isPaused ? 'pause' : 'play'} 
            size={16} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>

        {/* Stop Button - only show when playing */}
        {(isSpeaking || isPaused) && (
          <TouchableOpacity 
            style={[styles.button, styles.stopButton]}
            onPress={handleStop}
          >
            <Icon name="square" size={14} color="#666666" />
          </TouchableOpacity>
        )}

        {/* Copy Button */}
        <TouchableOpacity 
          style={[styles.button, styles.copyButton]}
          onPress={handleCopy}
        >
          <Icon name="copy" size={14} color="#666666" />
        </TouchableOpacity>

        {/* Volume indicator for translations */}
        {isTranslation && (
          <View style={styles.volumeIndicator}>
            <Icon name="volume-2" size={12} color="#4F46E5" />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    // gap: 6, // Removed gap for compatibility - using marginRight instead
  },
  button: {
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 28,
    minHeight: 28,
    marginRight: 6, // Add spacing between buttons
  },
  playButton: {
    backgroundColor: '#4F46E5',
  },
  stopButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  copyButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  volumeIndicator: {
    marginLeft: 4,
    opacity: 0.6,
  },
});