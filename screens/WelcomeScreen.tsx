import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';

const { width } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen() {
  const { isDarkMode } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const handleGetStarted = () => {
    navigation.navigate('Auth', { defaultToSignUp: true });
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Title and Tagline */}
        <Text style={[styles.title, isDarkMode && styles.titleDark]}>
          Welcome to ParrotSpeak
        </Text>
        <Text style={[styles.tagline, isDarkMode && styles.taglineDark]}>
          Connect Across Languages
        </Text>

        {/* Benefits */}
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitItem}>
            <Text style={[styles.benefitIcon, isDarkMode && styles.textDark]}>🌍</Text>
            <Text style={[styles.benefitText, isDarkMode && styles.textDark]}>
              Real-time voice translation
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={[styles.benefitIcon, isDarkMode && styles.textDark]}>💬</Text>
            <Text style={[styles.benefitText, isDarkMode && styles.textDark]}>
              Natural conversations in any language
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={[styles.benefitIcon, isDarkMode && styles.textDark]}>🎯</Text>
            <Text style={[styles.benefitText, isDarkMode && styles.textDark]}>
              AI-powered accuracy
            </Text>
          </View>
        </View>

        {/* Get Started Button */}
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={handleGetStarted}
          activeOpacity={0.8}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
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
    marginBottom: 60,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  benefitIcon: {
    fontSize: 24,
    marginRight: 15,
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
});