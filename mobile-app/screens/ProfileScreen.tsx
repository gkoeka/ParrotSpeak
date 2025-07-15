import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation will be handled by AuthNavigator in App.tsx
    } catch (error) {
      Alert.alert(
        'Logout Failed',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header showNewButton={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3366FF" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header showNewButton={false} />
      <ScrollView style={styles.contentContainer}>
        <View style={styles.profileCard}>
          <Text style={styles.pageTitle}>Your Profile</Text>
          
          <View style={styles.userInfoContainer}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user?.email || 'Not available'}</Text>
          </View>
          
          {user?.username && (
            <View style={styles.userInfoContainer}>
              <Text style={styles.infoLabel}>Username:</Text>
              <Text style={styles.infoValue}>{user.username}</Text>
            </View>
          )}
          
          {user?.subscriptionStatus && (
            <>
              <View style={styles.userInfoContainer}>
                <Text style={styles.infoLabel}>Subscription Status:</Text>
                <Text style={[
                  styles.infoValue, 
                  { color: user.subscriptionStatus === 'active' ? '#4CAF50' : '#F44336' }
                ]}>
                  {user.subscriptionStatus.charAt(0).toUpperCase() + user.subscriptionStatus.slice(1)}
                </Text>
              </View>
              
              {user.subscriptionTier && (
                <View style={styles.userInfoContainer}>
                  <Text style={styles.infoLabel}>Plan:</Text>
                  <Text style={styles.infoValue}>{user.subscriptionTier}</Text>
                </View>
              )}
              
              {user.subscriptionExpiresAt && (
                <View style={styles.userInfoContainer}>
                  <Text style={styles.infoLabel}>Expires:</Text>
                  <Text style={styles.infoValue}>{formatDate(user.subscriptionExpiresAt)}</Text>
                </View>
              )}
            </>
          )}
        </View>
        
        {(!user?.subscriptionStatus || user.subscriptionStatus !== 'active') && (
          <>
            <View style={styles.upgradeBanner}>
              <Text style={styles.upgradeText}>
                Upgrade to enjoy full features of ParrotSpeak
              </Text>
              <TouchableOpacity 
                style={styles.upgradeButton}
                onPress={() => Alert.alert(
                  'Subscription Options',
                  'Would you like to view our subscription plans?',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel'
                    },
                    {
                      text: 'View Plans',
                      onPress: () => navigation.navigate('SubscriptionPlans')
                    }
                  ]
                )}
              >
                <Text style={styles.upgradeButtonText}>View Plans</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        
        {/* Analytics & Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analytics & Data</Text>
          
          <TouchableOpacity 
            style={styles.navigationButton}
            onPress={() => navigation.navigate('Analytics')}
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
        
        {/* Help & Feedback Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & Feedback</Text>
          
          <TouchableOpacity 
            style={styles.feedbackButton}
            onPress={() => navigation.navigate('Feedback')}
          >
            <View style={styles.navigationButtonContent}>
              <Icon name="message-circle" size={20} color="#fff" />
              <Text style={styles.feedbackButtonText}>Send Feedback</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.settingDescription}>
            We'd love to hear your thoughts and suggestions to improve the app
          </Text>
        </View>
        
        {/* Privacy & Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Data</Text>
          
          <TouchableOpacity 
            style={styles.gdprButton}
            onPress={() => Alert.alert(
              'GDPR Data Rights',
              'Under GDPR, you have rights to access, rectify, erase, restrict processing, and data portability. Contact support for data requests.',
              [
                { text: 'Contact Support', onPress: () => navigation.navigate('Feedback') },
                { text: 'OK', style: 'default' }
              ]
            )}
          >
            <View style={styles.navigationButtonContent}>
              <Icon name="shield" size={20} color="#059669" />
              <Text style={styles.gdprButtonText}>GDPR Data Rights</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#9ca3af" />
          </TouchableOpacity>
          
          <Text style={styles.settingDescription}>
            Manage your data privacy rights and preferences
          </Text>
        </View>
        
        {/* Account Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => Alert.alert(
              'Delete Account',
              'This will permanently delete your account and all data. This action cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete Account', style: 'destructive', onPress: () => {
                  Alert.alert('Account Deletion', 'Please contact support to delete your account. We will process your request within 30 days.');
                }}
              ]
            )}
          >
            <View style={styles.navigationButtonContent}>
              <Icon name="trash-2" size={20} color="#ef4444" />
              <Text style={styles.deleteButtonText}>Delete My Account</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#ef4444" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={isLoading}
          >
            <View style={styles.navigationButtonContent}>
              <Icon name="log-out" size={20} color="#ef4444" />
              {isLoading ? (
                <ActivityIndicator color="#ef4444" />
              ) : (
                <Text style={styles.logoutButtonText}>Sign Out</Text>
              )}
            </View>
            <Icon name="chevron-right" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfoContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  infoLabel: {
    flex: 0.4,
    fontWeight: '600',
    color: '#555',
    fontSize: 16,
  },
  infoValue: {
    flex: 0.6,
    fontSize: 16,
    color: '#333',
  },
  upgradeBanner: {
    backgroundColor: '#3366FF',
    borderRadius: 10,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  upgradeText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  upgradeButton: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  upgradeButtonText: {
    color: '#3366FF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionContainer: {
    marginVertical: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    marginBottom: 12,
  },
  logoutButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 12,
  },
  navigationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navigationButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 12,
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    marginBottom: 12,
  },
  feedbackButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginLeft: 12,
  },
  gdprButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    marginBottom: 12,
  },
  gdprButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#059669',
    marginLeft: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    marginBottom: 12,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ef4444',
    marginLeft: 12,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 8,
  },
});

export default ProfileScreen;