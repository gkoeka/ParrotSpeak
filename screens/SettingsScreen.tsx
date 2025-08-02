import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

type SettingsNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsNavigationProp>();
  const { logout, user } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  const accountOptions = [
    { 
      title: 'Profile', 
      screen: 'Profile' as keyof RootStackParamList,
      icon: 'person-outline',
      subtitle: user?.email || 'Manage your profile'
    },
    { 
      title: 'Subscription', 
      screen: 'Pricing' as keyof RootStackParamList,
      icon: 'card-outline',
      subtitle: 'Manage your plan'
    },
    { 
      title: 'Analytics', 
      screen: 'Analytics' as keyof RootStackParamList,
      icon: 'stats-chart-outline',
      subtitle: 'View your usage stats'
    },
  ];

  const preferenceOptions = [
    {
      title: 'Dark Mode',
      icon: 'moon-outline',
      value: isDarkMode,
      onValueChange: toggleDarkMode,
    },
    {
      title: 'Push Notifications',
      icon: 'notifications-outline',
      value: notificationsEnabled,
      onValueChange: setNotificationsEnabled,
    },
    {
      title: 'Auto-play Translations',
      icon: 'play-circle-outline',
      value: autoPlayEnabled,
      onValueChange: setAutoPlayEnabled,
    },
    {
      title: 'Usage Analytics',
      icon: 'analytics-outline',
      value: analyticsEnabled,
      onValueChange: setAnalyticsEnabled,
    },
  ];

  const supportOptions = [
    { 
      title: 'Help Center', 
      screen: 'HelpCenter' as keyof RootStackParamList,
      icon: 'help-circle-outline',
      subtitle: 'Get help and support'
    },
    { 
      title: 'Send Feedback', 
      screen: 'Feedback' as keyof RootStackParamList,
      icon: 'chatbubble-outline',
      subtitle: 'Share your thoughts'
    },
    { 
      title: 'Privacy Policy', 
      screen: 'PrivacyPolicy' as keyof RootStackParamList,
      icon: 'shield-checkmark-outline',
      subtitle: 'View our privacy policy'
    },
  ];

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <Header showBackButton={true} />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, isDarkMode && styles.titleDark]}>Settings</Text>
        
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>ACCOUNT</Text>
          <View style={[styles.sectionContent, isDarkMode && styles.sectionContentDark]}>
            {accountOptions.map((option, index) => (
              <TouchableOpacity
                key={option.title}
                style={[
                  styles.optionItem,
                  index === accountOptions.length - 1 && styles.lastOptionItem
                ]}
                onPress={() => navigation.navigate(option.screen)}
              >
                <View style={styles.optionLeft}>
                  <View style={[styles.iconContainer, isDarkMode && styles.iconContainerDark]}>
                    <Ionicons name={option.icon as any} size={24} color={isDarkMode ? '#fff' : '#3366FF'} />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={[styles.optionText, isDarkMode && styles.optionTextDark]}>{option.title}</Text>
                    <Text style={[styles.optionSubtitle, isDarkMode && styles.optionSubtitleDark]}>{option.subtitle}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#666' : '#ccc'} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>PREFERENCES</Text>
          <View style={[styles.sectionContent, isDarkMode && styles.sectionContentDark]}>
            {preferenceOptions.map((option, index) => (
              <View
                key={option.title}
                style={[
                  styles.optionItem,
                  index === preferenceOptions.length - 1 && styles.lastOptionItem
                ]}
              >
                <View style={styles.optionLeft}>
                  <View style={[styles.iconContainer, isDarkMode && styles.iconContainerDark]}>
                    <Ionicons name={option.icon as any} size={24} color={isDarkMode ? '#fff' : '#3366FF'} />
                  </View>
                  <Text style={[styles.optionText, isDarkMode && styles.optionTextDark]}>{option.title}</Text>
                </View>
                <Switch
                  value={option.value}
                  onValueChange={option.onValueChange}
                  trackColor={{ false: '#e0e0e0', true: '#3366FF' }}
                  thumbColor={option.value ? '#fff' : '#f4f3f4'}
                  ios_backgroundColor="#e0e0e0"
                />
              </View>
            ))}
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>SUPPORT</Text>
          <View style={[styles.sectionContent, isDarkMode && styles.sectionContentDark]}>
            {supportOptions.map((option, index) => (
              <TouchableOpacity
                key={option.title}
                style={[
                  styles.optionItem,
                  index === supportOptions.length - 1 && styles.lastOptionItem
                ]}
                onPress={() => navigation.navigate(option.screen)}
              >
                <View style={styles.optionLeft}>
                  <View style={[styles.iconContainer, isDarkMode && styles.iconContainerDark]}>
                    <Ionicons name={option.icon as any} size={24} color={isDarkMode ? '#fff' : '#3366FF'} />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={[styles.optionText, isDarkMode && styles.optionTextDark]}>{option.title}</Text>
                    <Text style={[styles.optionSubtitle, isDarkMode && styles.optionSubtitleDark]}>{option.subtitle}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#666' : '#ccc'} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>APP INFO</Text>
          <View style={[styles.sectionContent, isDarkMode && styles.sectionContentDark]}>
            <View style={styles.appInfoItem}>
              <Text style={[styles.optionText, isDarkMode && styles.optionTextDark]}>Version</Text>
              <Text style={[styles.optionValue, isDarkMode && styles.optionValueDark]}>1.0.0 (Build 100)</Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={24} color="#fff" style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 32,
    marginHorizontal: 20,
    color: '#1a1a1a',
  },
  titleDark: {
    color: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginHorizontal: 20,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitleDark: {
    color: '#999',
  },
  sectionContent: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionContentDark: {
    backgroundColor: '#2a2a2a',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lastOptionItem: {
    borderBottomWidth: 0,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6ecff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainerDark: {
    backgroundColor: '#3a3a3a',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  optionTextDark: {
    color: '#fff',
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  optionSubtitleDark: {
    color: '#999',
  },
  optionValue: {
    fontSize: 16,
    color: '#666',
  },
  optionValueDark: {
    color: '#999',
  },
  appInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  logoutButton: {
    backgroundColor: '#ff4757',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 32,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff4757',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});