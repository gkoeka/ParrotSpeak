import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { TabParamList } from '../navigation/MainTabNavigator';
import { HomeStackParamList } from '../navigation/MainTabNavigator';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';

type HomeScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<HomeStackParamList, 'Home'>,
  BottomTabNavigationProp<TabParamList>
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { isDarkMode } = useTheme();

  const navigateToConversation = () => {
    navigation.navigate('Conversation');
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <Header />
      
      <View style={styles.content}>
        <Text style={[styles.title, isDarkMode && styles.titleDark]}>Welcome to ParrotSpeak</Text>
        <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
          Connect with others across language barriers through AI-powered voice translation
        </Text>
        
        <TouchableOpacity 
          style={styles.startButton}
          onPress={navigateToConversation}
        >
          <Text style={styles.startButtonText}>Start New Conversation</Text>
        </TouchableOpacity>
        
        <View style={styles.featuresGrid}>
          <TouchableOpacity 
            style={[styles.featureCard, isDarkMode && styles.featureCardDark]}
            onPress={() => navigation.navigate('ConversationsTab')}
          >
            <Text style={[styles.featureTitle, isDarkMode && styles.featureTitleDark]}>My Conversations</Text>
            <Text style={[styles.featureDescription, isDarkMode && styles.featureDescriptionDark]}>View past conversations</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => navigation.navigate('Analytics')}
          >
            <Text style={styles.featureTitle}>Analytics</Text>
            <Text style={styles.featureDescription}>Usage insights</Text>
          </TouchableOpacity>
        </View>
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
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  titleDark: {
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
    lineHeight: 24,
  },
  subtitleDark: {
    color: '#999',
  },
  startButton: {
    backgroundColor: '#3366FF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 40,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  featureCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  featureCardDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#3a3a3a',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  featureTitleDark: {
    color: '#fff',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
  },
  featureDescriptionDark: {
    color: '#999',
  },
});