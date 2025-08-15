import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import ParrotSpeakLogo from './ParrotSpeakLogo';
import PreviewStatusPill from './PreviewStatusPill';

export default function Header() {
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.container, 
      isDarkMode && styles.containerDark,
      { paddingTop: insets.top }
    ]}>
      <View style={styles.content}>
        {/* Left section with logo */}
        <View style={styles.leftSection}>
          <ParrotSpeakLogo showText={false} />
        </View>
        
        {/* Centered brand name */}
        <View style={styles.centerSection}>
          <Text style={[styles.brandName, isDarkMode && styles.brandNameDark]}>
            ParrotSpeak
          </Text>
        </View>
        
        {/* Right section with preview status */}
        <View style={styles.rightSection}>
          <PreviewStatusPill />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
    borderBottomColor: '#333',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftSection: {
    flex: 1,
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 20,
  },
  brandName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3366FF',
  },
  brandNameDark: {
    color: '#5B8FFF',
  },
});