import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

type ConversationsListNavigationProp = StackNavigationProp<RootStackParamList, 'ConversationsList'>;

export default function ConversationsListScreen() {
  const navigation = useNavigation<ConversationsListNavigationProp>();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  
  // Check subscription status
  const hasActiveSubscription = user?.subscriptionStatus === 'active' || user?.subscriptionTier === 'lifetime';

  // Mock data for now
  const conversations = [
    {
      id: '1',
      title: 'Business Meeting',
      languages: 'English ↔ Spanish',
      lastActivity: '2 hours ago',
      messageCount: 15,
    },
    {
      id: '2',
      title: 'Travel Conversation',
      languages: 'English ↔ French',
      lastActivity: '1 day ago',
      messageCount: 8,
    },
  ];

  const renderConversation = ({ item }: { item: typeof conversations[0] }) => (
    <TouchableOpacity 
      style={[styles.conversationCard, isDarkMode && styles.conversationCardDark]}
      onPress={() => navigation.navigate('Conversation', { id: item.id })}
    >
      <View style={styles.conversationHeader}>
        <Text style={[styles.conversationTitle, isDarkMode && styles.conversationTitleDark]}>{item.title}</Text>
        <Text style={[styles.lastActivity, isDarkMode && styles.lastActivityDark]}>{item.lastActivity}</Text>
      </View>
      <Text style={[styles.languages, isDarkMode && styles.languagesDark]}>{item.languages}</Text>
      <Text style={[styles.messageCount, isDarkMode && styles.messageCountDark]}>{item.messageCount} messages</Text>
    </TouchableOpacity>
  );

  // Show subscription required screen for non-subscribers
  if (!hasActiveSubscription) {
    return (
      <View style={[styles.container, isDarkMode && styles.containerDark]}>
        <Header />
        
        <View style={styles.subscriptionRequiredContainer}>
          <Ionicons 
            name="folder-open" 
            size={64} 
            color={isDarkMode ? '#5c8cff' : '#3366FF'} 
          />
          <Text style={[styles.subscriptionTitle, isDarkMode && styles.subscriptionTitleDark]}>
            Subscription Required
          </Text>
          <Text style={[styles.subscriptionMessage, isDarkMode && styles.subscriptionMessageDark]}>
            Access to conversation history is available to active subscribers only.
          </Text>
          <TouchableOpacity 
            style={[styles.subscribeButton, isDarkMode && styles.subscribeButtonDark]}
            onPress={() => navigation.navigate('Pricing')}
          >
            <Text style={styles.subscribeButtonText}>Choose a Plan</Text>
          </TouchableOpacity>
          
          <Text style={[styles.accessInfo, isDarkMode && styles.accessInfoDark]}>
            As a free user, you can access:
          </Text>
          <View style={styles.accessList}>
            <Text style={[styles.accessItem, isDarkMode && styles.accessItemDark]}>• Profile Settings</Text>
            <Text style={[styles.accessItem, isDarkMode && styles.accessItemDark]}>• Help Center</Text>
            <Text style={[styles.accessItem, isDarkMode && styles.accessItemDark]}>• Manage Plan</Text>
            <Text style={[styles.accessItem, isDarkMode && styles.accessItemDark]}>• Account Settings</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <Header />
      
      <View style={styles.content}>
        <Text style={[styles.title, isDarkMode && styles.titleDark]}>My Conversations</Text>
        
        {conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, isDarkMode && styles.emptyStateTextDark]}>
              No conversations yet. Start a new conversation to get started!
            </Text>
            <TouchableOpacity 
              style={[styles.startButton, isDarkMode && styles.startButtonDark]}
              onPress={() => navigation.navigate('Conversation')}
            >
              <Text style={styles.startButtonText}>Start New Conversation</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={conversations}
            renderItem={renderConversation}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        )}
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
    marginBottom: 20,
    color: '#1a1a1a',
  },
  titleDark: {
    color: '#fff',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateTextDark: {
    color: '#999',
  },
  startButton: {
    backgroundColor: '#3366FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  startButtonDark: {
    backgroundColor: '#5c8cff',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  conversationCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  conversationCardDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#333',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  conversationTitleDark: {
    color: '#fff',
  },
  lastActivity: {
    fontSize: 12,
    color: '#666',
  },
  lastActivityDark: {
    color: '#999',
  },
  languages: {
    fontSize: 14,
    color: '#3366FF',
    marginBottom: 4,
  },
  languagesDark: {
    color: '#5c8cff',
  },
  messageCount: {
    fontSize: 12,
    color: '#666',
  },
  messageCountDark: {
    color: '#999',
  },
  // Subscription required styles
  subscriptionRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  subscriptionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 24,
    marginBottom: 12,
  },
  subscriptionTitleDark: {
    color: '#fff',
  },
  subscriptionMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  subscriptionMessageDark: {
    color: '#ccc',
  },
  subscribeButton: {
    backgroundColor: '#3366FF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  subscribeButtonDark: {
    backgroundColor: '#5c8cff',
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  accessInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  accessInfoDark: {
    color: '#999',
  },
  accessList: {
    alignItems: 'flex-start',
  },
  accessItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  accessItemDark: {
    color: '#999',
  },
});