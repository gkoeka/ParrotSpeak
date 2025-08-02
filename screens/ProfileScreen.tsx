import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function ProfileScreen() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Implement profile update API call
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <Header />
      
      <View style={styles.content}>
        <Text style={[styles.title, isDarkMode && styles.titleDark]}>Profile</Text>
        
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDarkMode && styles.labelDark]}>Name</Text>
            <TextInput
              style={[styles.input, isDarkMode && styles.inputDark]}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={isDarkMode ? '#999' : '#666'}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDarkMode && styles.labelDark]}>Email</Text>
            <TextInput
              style={[styles.input, isDarkMode && styles.inputDark]}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={isDarkMode ? '#999' : '#666'}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.saveButton, isDarkMode && styles.saveButtonDark, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={[styles.accountInfo, isDarkMode && styles.accountInfoDark]}>
          <Text style={[styles.accountInfoTitle, isDarkMode && styles.accountInfoTitleDark]}>Account Information</Text>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, isDarkMode && styles.infoLabelDark]}>Member since</Text>
            <Text style={[styles.infoValue, isDarkMode && styles.infoValueDark]}>January 2025</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, isDarkMode && styles.infoLabelDark]}>Account type</Text>
            <Text style={[styles.infoValue, isDarkMode && styles.infoValueDark]}>Premium</Text>
          </View>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#1a1a1a',
  },
  titleDark: {
    color: '#fff',
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  labelDark: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    color: '#1a1a1a',
  },
  inputDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#333',
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#3366FF',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  saveButtonDark: {
    backgroundColor: '#5c8cff',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  accountInfo: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  accountInfoDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#333',
  },
  accountInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  accountInfoTitleDark: {
    color: '#fff',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoLabelDark: {
    color: '#999',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  infoValueDark: {
    color: '#fff',
  },
});