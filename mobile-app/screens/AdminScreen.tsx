import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getCurrentUser } from '../api/authService';
import { getHeaders, buildUrl } from '../api/config';

interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  subscriptionStatus: string;
  subscriptionTier: string;
  createdAt: string;
  conversationCount: number;
}

interface PlatformAnalytics {
  totalUsers: number;
  totalConversations: number;
  totalMessages: number;
  recentSignups: number;
  totalFeedback: number;
}

interface AdminFeedback {
  id: number;
  category: string;
  feedback: string;
  email: string;
  createdAt: string;
  userId: number;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
}

const AdminScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userDetailsVisible, setUserDetailsVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Check if current user is admin
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
  });

  const isAdmin = currentUser?.id === 1; // Admin user ID is 1

  // Fetch platform analytics
  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery<PlatformAnalytics>({
    queryKey: ['admin', 'analytics'],
    queryFn: async () => {
      const response = await fetch(buildUrl('/api/admin/analytics'), {
        headers: getHeaders(true),
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    enabled: isAdmin,
  });

  // Fetch all users
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery<AdminUser[]>({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const response = await fetch(buildUrl('/api/admin/users'), {
        headers: getHeaders(true),
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    enabled: isAdmin,
  });

  // Fetch all feedback
  const { data: feedback, isLoading: feedbackLoading, refetch: refetchFeedback } = useQuery<AdminFeedback[]>({
    queryKey: ['admin', 'feedback'],
    queryFn: async () => {
      const response = await fetch(buildUrl('/api/admin/feedback'), {
        headers: getHeaders(true),
      });
      if (!response.ok) throw new Error('Failed to fetch feedback');
      return response.json();
    },
    enabled: isAdmin,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchAnalytics(), refetchUsers(), refetchFeedback()]);
    } catch (error) {
      console.error('Refresh failed:', error);
    }
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSubscriptionBadge = (status: string, tier: string) => {
    if (status === 'active') {
      return { text: tier || 'Basic', color: '#22c55e' };
    }
    return { text: 'Free', color: '#6b7280' };
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      bug: '#ef4444',
      feature: '#3b82f6',
      translation: '#8b5cf6',
      other: '#6b7280',
    } as const;
    return colors[category as keyof typeof colors] || '#6b7280';
  };

  const filteredUsers = users?.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.firstName || '').toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.accessDenied}>
          <Icon name="security" size={64} color="#ef4444" />
          <Text style={styles.accessDeniedTitle}>Access Denied</Text>
          <Text style={styles.accessDeniedText}>
            You don't have permission to access the admin panel.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderOverviewTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Icon name="people" size={24} color="#3b82f6" />
          <Text style={styles.statNumber}>
            {analyticsLoading ? '...' : analytics?.totalUsers || 0}
          </Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>

        <View style={styles.statCard}>
          <Icon name="chat" size={24} color="#10b981" />
          <Text style={styles.statNumber}>
            {analyticsLoading ? '...' : analytics?.totalConversations || 0}
          </Text>
          <Text style={styles.statLabel}>Conversations</Text>
        </View>

        <View style={styles.statCard}>
          <Icon name="message" size={24} color="#f59e0b" />
          <Text style={styles.statNumber}>
            {analyticsLoading ? '...' : analytics?.totalMessages || 0}
          </Text>
          <Text style={styles.statLabel}>Messages</Text>
        </View>

        <View style={styles.statCard}>
          <Icon name="trending-up" size={24} color="#8b5cf6" />
          <Text style={styles.statNumber}>
            {analyticsLoading ? '...' : analytics?.recentSignups || 0}
          </Text>
          <Text style={styles.statLabel}>Recent Signups</Text>
          <Text style={styles.statSubLabel}>Last 7 days</Text>
        </View>

        <View style={styles.statCard}>
          <Icon name="feedback" size={24} color="#ef4444" />
          <Text style={styles.statNumber}>
            {analyticsLoading ? '...' : analytics?.totalFeedback || 0}
          </Text>
          <Text style={styles.statLabel}>Feedback</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderUsersTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#6b7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {usersLoading ? (
        <Text style={styles.loadingText}>Loading users...</Text>
      ) : (
        filteredUsers.map((user) => (
          <TouchableOpacity
            key={user.id}
            style={styles.userCard}
            onPress={() => {
              setSelectedUser(user);
              setUserDetailsVisible(true);
            }}
          >
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user.firstName || user.email}
              </Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.userMeta}>
                <View
                  style={[
                    styles.subscriptionBadge,
                    { backgroundColor: getSubscriptionBadge(user.subscriptionStatus, user.subscriptionTier).color },
                  ]}
                >
                  <Text style={styles.subscriptionText}>
                    {getSubscriptionBadge(user.subscriptionStatus, user.subscriptionTier).text}
                  </Text>
                </View>
                <Text style={styles.conversationCount}>
                  {user.conversationCount} conversations
                </Text>
              </View>
            </View>
            <Icon name="chevron-right" size={24} color="#6b7280" />
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );

  const renderFeedbackTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {feedbackLoading ? (
        <Text style={styles.loadingText}>Loading feedback...</Text>
      ) : (
        feedback?.map((item) => (
          <View key={item.id} style={styles.feedbackCard}>
            <View style={styles.feedbackHeader}>
              <Text style={styles.feedbackUser}>
                {item.userFirstName || item.userEmail || item.email}
              </Text>
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: getCategoryColor(item.category) },
                ]}
              >
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            </View>
            <Text style={styles.feedbackText}>{item.feedback}</Text>
            <Text style={styles.feedbackDate}>{formatDate(item.createdAt)}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Icon name="security" size={24} color="#3b82f6" />
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
            Users
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'feedback' && styles.activeTab]}
          onPress={() => setActiveTab('feedback')}
        >
          <Text style={[styles.tabText, activeTab === 'feedback' && styles.activeTabText]}>
            Feedback
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'users' && renderUsersTab()}
      {activeTab === 'feedback' && renderFeedbackTab()}

      <Modal
        visible={userDetailsVisible}
        animationType="slide"
        onRequestClose={() => setUserDetailsVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>User Details</Text>
            <TouchableOpacity onPress={() => setUserDetailsVisible(false)}>
              <Icon name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {selectedUser && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>User Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>ID:</Text>
                  <Text style={styles.detailValue}>{selectedUser.id}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedUser.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Username:</Text>
                  <Text style={styles.detailValue}>{selectedUser.firstName ? `${selectedUser.firstName} ${selectedUser.lastName || ''}`.trim() : 'Not set'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>
                    {selectedUser.firstName} {selectedUser.lastName}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Conversations:</Text>
                  <Text style={styles.detailValue}>{selectedUser.conversationCount}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Joined:</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedUser.createdAt)}</Text>
                </View>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ef4444',
    marginTop: 16,
    marginBottom: 8,
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#111827',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 16,
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statSubLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 8,
    fontSize: 16,
  },
  loadingText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    marginTop: 20,
  },
  userCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  subscriptionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  subscriptionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  conversationCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  feedbackCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedbackUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  feedbackText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  feedbackDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
  },
});

export default AdminScreen;