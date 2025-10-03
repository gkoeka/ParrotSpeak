import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../App';
import { API_BASE_URL } from '../api/config';

type ProfileNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const navigation = useNavigation<ProfileNavigationProp>();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

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

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              navigation.navigate('Login' as never);
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          style: 'destructive',
          onPress: async () => {
            setDeleteLoading(true);
            try {
              const response = await fetch(`${API_BASE_URL}/api/user/delete`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
              });

              if (response.ok) {
                Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
                await logout();
                navigation.navigate('Login' as never);
              } else {
                throw new Error('Failed to delete account');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account. Please try again later.');
            } finally {
              setDeleteLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        Alert.alert(
          'Data Export Requested',
          'Your data export has been requested. You will receive an email with your data within 24 hours.'
        );
      } else {
        throw new Error('Failed to request data export');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request data export. Please try again later.');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <Header />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
            <Text style={[styles.infoValue, isDarkMode && styles.infoValueDark]}>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'January 2025'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, isDarkMode && styles.infoLabelDark]}>Account type</Text>
            <Text style={[styles.infoValue, isDarkMode && styles.infoValueDark]}>
              {user?.subscriptionStatus || 'Free'}
            </Text>
          </View>
        </View>

        {/* Manage My Account Section */}
        <View style={[styles.manageAccountSection, isDarkMode && styles.manageAccountSectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
            Manage My Account
          </Text>

          <TouchableOpacity 
            style={[styles.actionButton, isDarkMode && styles.actionButtonDark]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={24} color="#3366FF" />
            <Text style={[styles.actionButtonText, isDarkMode && styles.actionButtonTextDark]}>
              Sign Out
            </Text>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#666' : '#999'} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, isDarkMode && styles.actionButtonDark]}
            onPress={handleExportData}
            disabled={exportLoading}
          >
            <Ionicons name="download-outline" size={24} color="#3366FF" />
            <View style={styles.actionButtonContent}>
              <Text style={[styles.actionButtonText, isDarkMode && styles.actionButtonTextDark]}>
                Give Me My Data
              </Text>
              <Text style={[styles.actionButtonSubtext, isDarkMode && styles.actionButtonSubtextDark]}>
                Export all your data (GDPR)
              </Text>
            </View>
            {exportLoading ? (
              <ActivityIndicator size="small" color="#3366FF" />
            ) : (
              <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#666' : '#999'} />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.actionButtonDanger, isDarkMode && styles.actionButtonDangerDark]}
            onPress={handleDeleteAccount}
            disabled={deleteLoading}
          >
            <Ionicons name="trash-outline" size={24} color="#FF3366" />
            <View style={styles.actionButtonContent}>
              <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
                Delete Account
              </Text>
              <Text style={[styles.actionButtonSubtext, styles.actionButtonSubtextDanger, isDarkMode && styles.actionButtonSubtextDark]}>
                Permanently remove all data
              </Text>
            </View>
            {deleteLoading ? (
              <ActivityIndicator size="small" color="#FF3366" />
            ) : (
              <Ionicons name="chevron-forward" size={20} color="#FF3366" />
            )}
          </TouchableOpacity>
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
  manageAccountSection: {
    marginTop: 32,
    marginBottom: 32,
  },
  manageAccountSectionDark: {
    // Dark mode styling handled by child elements
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  sectionTitleDark: {
    color: '#fff',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionButtonDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#333',
  },
  actionButtonContent: {
    flex: 1,
    marginLeft: 16,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  actionButtonTextDark: {
    color: '#fff',
  },
  actionButtonSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  actionButtonSubtextDark: {
    color: '#999',
  },
  actionButtonDanger: {
    borderColor: '#ffebee',
    backgroundColor: '#ffebee',
  },
  actionButtonDangerDark: {
    backgroundColor: 'rgba(255, 51, 102, 0.1)',
    borderColor: 'rgba(255, 51, 102, 0.3)',
  },
  actionButtonTextDanger: {
    color: '#FF3366',
  },
  actionButtonSubtextDanger: {
    color: '#FF3366',
    opacity: 0.8,
  },
});