import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export type PipelineStatus = 'idle' | 'uploading' | 'transcribing' | 'translating' | 'preparingAudio' | 'error';

interface StatusPillProps {
  status: PipelineStatus;
  errorMessage?: string;
}

export default function StatusPill({ status, errorMessage }: StatusPillProps) {
  const { isDarkMode } = useTheme();
  
  // Don't show pill when idle
  if (status === 'idle') {
    return null;
  }
  
  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return 'Uploading audio...';
      case 'transcribing':
        return 'Transcribing...';
      case 'translating':
        return 'Translating...';
      case 'preparingAudio':
        return 'Preparing audio...';
      case 'error':
        return errorMessage || 'Error occurred';
      default:
        return '';
    }
  };
  
  const getStatusColor = () => {
    if (status === 'error') {
      return isDarkMode ? '#ff6b6b' : '#dc3545';
    }
    return isDarkMode ? '#5c8cff' : '#007AFF';
  };
  
  return (
    <View style={[
      styles.container,
      isDarkMode && styles.containerDark,
      status === 'error' && styles.errorContainer
    ]}>
      {status !== 'error' && (
        <ActivityIndicator 
          size="small" 
          color={getStatusColor()} 
          style={styles.spinner}
        />
      )}
      <Text style={[
        styles.text,
        isDarkMode && styles.textDark,
        status === 'error' && styles.errorText
      ]}>
        {getStatusText()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
  },
  containerDark: {
    backgroundColor: '#1e3a5f',
  },
  errorContainer: {
    backgroundColor: '#ffe0e0',
  },
  spinner: {
    marginRight: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  textDark: {
    color: '#5c8cff',
  },
  errorText: {
    color: '#dc3545',
  },
});