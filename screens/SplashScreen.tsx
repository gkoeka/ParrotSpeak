import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function SplashScreen() {
  const { isDarkMode } = useTheme();

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <Text style={[styles.logo, isDarkMode && styles.darkText]}>🦜</Text>
      <Text style={[styles.title, isDarkMode && styles.darkText]}>ParrotSpeak</Text>
      <ActivityIndicator size="large" color={isDarkMode ? '#2196F3' : '#1976D2'} style={styles.spinner} />
      <Text style={[styles.loadingText, isDarkMode && styles.darkText]}>Loading your conversations...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  logo: {
    fontSize: 72,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 48,
  },
  darkText: {
    color: '#ffffff',
  },
  spinner: {
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});