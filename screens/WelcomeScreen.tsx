import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';

const { width } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen() {
  const { isDarkMode } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleGetStarted = () => {
    setIsNavigating(true);
    // Add 1.6 second delay before navigating
    setTimeout(() => {
      navigation.navigate('Auth', { defaultToSignUp: true });
    }, 1600);
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/parrotspeak-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Title and Tagline */}
        <Text style={[styles.title, isDarkMode && styles.titleDark]}>
          Welcome to ParrotSpeak
        </Text>
        <Text style={[styles.tagline, isDarkMode && styles.taglineDark]}>
          Connect Across Languages with Voice-to-Voice translation
        </Text>

        {/* Benefits */}
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitItem}>
            <Text style={[styles.benefitIcon, isDarkMode && styles.textDark]}>🌍</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={[styles.benefitIcon, isDarkMode && styles.textDark]}>💬</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={[styles.benefitIcon, isDarkMode && styles.textDark]}>🎯</Text>
          </View>
        </View>

        {/* Get Started Button */}
        <TouchableOpacity
          style={[styles.getStartedButton, isNavigating && styles.getStartedButtonDisabled]}
          onPress={handleGetStarted}
          activeOpacity={0.8}
          disabled={isNavigating}
        >
          {isNavigating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.getStartedText}>Get Started</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  titleDark: {
    color: '#fff',
  },
  tagline: {
    fontSize: 18,
    color: '#666',
    marginBottom: 50,
    textAlign: 'center',
  },
  taglineDark: {
    color: '#aaa',
  },
  benefitsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 60,
    paddingHorizontal: 20,
  },
  benefitItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitIcon: {
    fontSize: 40,
  },
  benefitText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  textDark: {
    color: '#ddd',
  },
  getStartedButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 60,
    paddingVertical: 16,
    borderRadius: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  getStartedText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  getStartedButtonDisabled: {
    opacity: 0.8,
  },
});