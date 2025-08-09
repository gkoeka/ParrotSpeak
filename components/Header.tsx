import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import ParrotSpeakLogo from './ParrotSpeakLogo';
import PreviewStatusPill from './PreviewStatusPill';
import { Ionicons } from '@expo/vector-icons';
import { TabParamList } from '../navigation/MainTabNavigator';

export default function Header() {
  const navigation = useNavigation<NavigationProp<TabParamList>>();
  const { isDarkMode } = useTheme();

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={styles.content}>
        {/* Left section with logo */}
        <View style={styles.leftSection}>
          <TouchableOpacity onPress={() => navigation.navigate('ChatTab', { screen: 'Home' })}>
            <ParrotSpeakLogo showText={false} />
          </TouchableOpacity>
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
    paddingTop: 44, // For status bar
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