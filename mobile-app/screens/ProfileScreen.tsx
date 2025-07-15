import React, { useState } from 'react';
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
import { SubscriptionModal } from '../components/SubscriptionModal';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, logout, isLoading } = useAuth();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

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
          
          {user?.firstName && (
            <View style={styles.userInfoContainer}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{user.firstName}</Text>
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
                  <Text style={styles.infoValue}>{user.subscriptionTier.charAt(0).toUpperCase() + user.subscriptionTier.slice(1)}</Text>
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
        
        {/* Show Current Plan section for users with any subscription interaction */}
        {(user?.subscriptionTier || user?.subscriptionStatus) && (
          <View style={styles.upgradeBanner}>
            <Text style={styles.upgradeText}>
              Upgrade to enjoy full features of ParrotSpeak
            </Text>
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={() => setShowSubscriptionModal(true)}
            >
              <Text style={styles.upgradeButtonText}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.logoutButtonText}>Sign Out</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        hasEverSubscribed={!!user?.subscriptionTier || user?.subscriptionStatus === 'expired'}
        feature="profile_upgrade"
      />
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
    backgroundColor: '#E53935',
    borderRadius: 5,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;