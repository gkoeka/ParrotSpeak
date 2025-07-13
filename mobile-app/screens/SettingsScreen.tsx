import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import Icon from 'react-native-vector-icons/Feather';
import Header from '../components/Header';
import { fetchSpeechSettings, updateSpeechSettings, fetchVoiceProfiles } from '../api/voiceProfileService';
import { logout } from '../api/authService';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [voiceProfiles, setVoiceProfiles] = useState<any[]>([]);
  
  // Local state for settings
  const [autoPlay, setAutoPlay] = useState(true);
  const [useProfileForLanguage, setUseProfileForLanguage] = useState(true);
  
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const speechSettings = await fetchSpeechSettings();
        const profiles = await fetchVoiceProfiles();
        
        setSettings(speechSettings);
        setVoiceProfiles(profiles);
        
        // Initialize local state
        setAutoPlay(speechSettings.autoPlay);
        setUseProfileForLanguage(speechSettings.useProfileForLanguage);
      } catch (error) {
        console.error('Failed to load settings:', error);
        Alert.alert('Error', 'Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, []);
  
  const handleViewAnalytics = () => {
    navigation.navigate('Analytics');
  };
  
  const handleSubmitFeedback = () => {
    navigation.navigate('Feedback');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              navigation.navigate('Auth');
            } catch (error) {
              console.error('Logout failed:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };
  
  const handleUpdateSetting = async (setting: string, value: any) => {
    try {
      // Update local state immediately for responsive UI
      if (setting === 'autoPlay') {
        setAutoPlay(value);
      } else if (setting === 'useProfileForLanguage') {
        setUseProfileForLanguage(value);
      }
      
      // Send update to server
      await updateSpeechSettings({ [setting]: value });
      
      // Show success message
      Alert.alert('Settings Updated', 'Your settings have been saved');
    } catch (error) {
      console.error('Failed to update settings:', error);
      Alert.alert('Error', 'Failed to update settings');
      
      // Revert local state on error
      if (setting === 'autoPlay') {
        setAutoPlay(!value);
      } else if (setting === 'useProfileForLanguage') {
        setUseProfileForLanguage(!value);
      }
    }
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <Header showNewButton={false} />
      
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Settings</Text>
        
        {/* Voice & Speech Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice & Speech</Text>
          
          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingLabel}>Auto-play translations</Text>
              <Text style={styles.settingDescription}>
                Automatically play translated messages when received
              </Text>
            </View>
            <Switch
              value={autoPlay}
              onValueChange={(value) => handleUpdateSetting('autoPlay', value)}
              trackColor={{ false: '#d1d5db', true: '#818cf8' }}
              thumbColor={autoPlay ? '#4F46E5' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingLabel}>Use language-specific profiles</Text>
              <Text style={styles.settingDescription}>
                Automatically select voice profiles based on language
              </Text>
            </View>
            <Switch
              value={useProfileForLanguage}
              onValueChange={(value) => handleUpdateSetting('useProfileForLanguage', value)}
              trackColor={{ false: '#d1d5db', true: '#818cf8' }}
              thumbColor={useProfileForLanguage ? '#4F46E5' : '#f4f3f4'}
            />
          </View>
        </View>
        
        {/* Analytics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analytics & Data</Text>
          
          <TouchableOpacity 
            style={styles.navigationButton}
            onPress={handleViewAnalytics}
          >
            <View style={styles.navigationButtonContent}>
              <Icon name="bar-chart-2" size={20} color="#4F46E5" />
              <Text style={styles.navigationButtonText}>View Translation Analytics</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#9ca3af" />
          </TouchableOpacity>
          
          <Text style={styles.settingDescription}>
            View translation quality metrics, usage statistics, and language pair analysis
          </Text>
        </View>
        
        {/* Display Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display</Text>
          
          {/* Placeholder for future settings */}
          <Text style={styles.settingDescription}>
            Display settings will be available in future updates
          </Text>
        </View>
        
        {/* Feedback Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & Feedback</Text>
          
          <TouchableOpacity 
            style={[styles.navigationButton, styles.feedbackButton]}
            onPress={handleSubmitFeedback}
          >
            <View style={styles.navigationButtonContent}>
              <Icon name="message-circle" size={20} color="#fff" />
              <Text style={[styles.navigationButtonText, styles.feedbackButtonText]}>Send Feedback</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.settingDescription}>
            We'd love to hear your thoughts and suggestions to improve the app
          </Text>
        </View>
        
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity 
            style={[styles.navigationButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <View style={styles.navigationButtonContent}>
              <Icon name="log-out" size={20} color="#ef4444" />
              <Text style={[styles.navigationButtonText, styles.logoutButtonText]}>Logout</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#ef4444" />
          </TouchableOpacity>
          
          <Text style={styles.settingDescription}>
            Sign out of your account for testing purposes
          </Text>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.settingDescription}>
            ParrotSpeak v1.0.0
          </Text>
          <Text style={styles.settingDescription}>
            A voice-to-voice translation app for seamless cross-cultural communication
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  feedbackButton: {
    backgroundColor: '#4F46E5',
    borderWidth: 0,
    marginVertical: 10,
  },
  feedbackButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fecaca',
    marginVertical: 10,
  },
  logoutButtonText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  section: {
    marginBottom: 32,
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    maxWidth: '80%',
    marginTop: 4,
    marginBottom: 8,
  },
  navigationButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  navigationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navigationButtonText: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '500',
    marginLeft: 8,
  },
});