import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface ParrotSpeakLogoProps {
  showText?: boolean;
}

export default function ParrotSpeakLogo({ showText = true }: ParrotSpeakLogoProps) {
  const { isDarkMode } = useTheme();
  
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Image
          source={require('../assets/parrotspeak-logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
      {showText && (
        <Text style={[styles.text, isDarkMode && styles.textDark]}>ParrotSpeak</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  logoImage: {
    width: 32,
    height: 32,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3366FF',
  },
  textDark: {
    color: '#5B8FFF',
  },
});