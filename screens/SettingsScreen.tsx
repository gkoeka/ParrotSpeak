import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';

type SettingsNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsNavigationProp>();
  const { logout } = useAuth();

  const settingsOptions = [
    { title: 'Profile', screen: 'Profile' as keyof RootStackParamList },
    { title: 'Subscription Plans', screen: 'SubscriptionPlans' as keyof RootStackParamList },
    { title: 'Analytics', screen: 'Analytics' as keyof RootStackParamList },
    { title: 'Feedback', screen: 'Feedback' as keyof RootStackParamList },
  ];

  return (
    <View style={styles.container}>
      <Header />
      
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Settings</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {settingsOptions.map((option) => (
            <TouchableOpacity
              key={option.title}
              style={styles.optionItem}
              onPress={() => navigation.navigate(option.screen)}
            >
              <Text style={styles.optionText}>{option.title}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <View style={styles.optionItem}>
            <Text style={styles.optionText}>App Version</Text>
            <Text style={styles.optionValue}>1.0.0</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#1a1a1a',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  optionValue: {
    fontSize: 16,
    color: '#666',
  },
  chevron: {
    fontSize: 18,
    color: '#ccc',
  },
  logoutButton: {
    backgroundColor: '#ff4757',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 32,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});