import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { Conversation } from '../types';
import { fetchConversations, updateConversation, deleteConversation } from '../api/conversationService';
import Icon from 'react-native-vector-icons/Feather';
import { formatConversationTime } from '../utils/date-utils';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { SubscriptionModal } from '../components/SubscriptionModal';

type ConversationsListNavigationProp = StackNavigationProp<RootStackParamList, 'ConversationsList'>;

export default function ConversationsListScreen() {
  const navigation = useNavigation<ConversationsListNavigationProp>();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  // Function to load conversations
  const loadConversations = async () => {
    try {
      const data = await fetchConversations();
      setConversations(data.sort((a, b) => {
        // Sort by favorite first, then by date
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }));
    } catch (error) {
      console.error('Error loading conversations:', error);
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Load conversations on initial mount
  useEffect(() => {
    loadConversations();
  }, []);
  
  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [])
  );
  
  // Pull to refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };
  
  // Get a display name for the conversation
  const getDisplayName = (conversation: Conversation) => {
    if (conversation.customName) return conversation.customName;
    return conversation.title;
  };
  
  // Format the date for display using timezone-aware utilities
  const formatDate = (dateString: string) => {
    return formatConversationTime(dateString);
  };
  
  // Handle favorite toggle
  const toggleFavorite = async (conversation: Conversation) => {
    try {
      const updatedConversation = await updateConversation(conversation.id, {
        isFavorite: !conversation.isFavorite
      });
      
      // Update the local state
      setConversations(prev => prev.map(c => 
        c.id === updatedConversation.id ? updatedConversation : c
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };
  
  // Handle conversation delete
  const handleDelete = (conversation: Conversation) => {
    Alert.alert(
      'Delete Conversation',
      `Are you sure you want to delete "${getDisplayName(conversation)}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteConversation(conversation.id);
              // Remove from local state
              setConversations(prev => prev.filter(c => c.id !== conversation.id));
            } catch (error) {
              console.error('Error deleting conversation:', error);
              Alert.alert('Error', 'Failed to delete conversation');
            }
          }
        }
      ]
    );
  };
  
  // Render each conversation item
  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => navigation.navigate('Conversation', { id: item.id })}
    >
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationTitle} numberOfLines={1}>
            {getDisplayName(item)}
          </Text>
          <Text style={styles.conversationDate}>
            {formatDate(item.updatedAt)}
          </Text>
        </View>
        
        <View style={styles.languageInfo}>
          <Text style={styles.languageText}>
            {item.sourceLanguage} ↔ {item.targetLanguage}
          </Text>
          {item.messages.length > 0 && (
            <Text style={styles.messageCount}>
              {item.messages.length} messages
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.conversationActions}>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(item)}
        >
          <Icon 
            name={item.isFavorite ? "star" : "star"} 
            size={20} 
            color={item.isFavorite ? "#FFD700" : "#ccc"} 
            solid={item.isFavorite}
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
        >
          <Icon name="trash-2" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
  
  // Check if user has ever had a subscription
  const hasEverSubscribed = !!(user?.subscriptionTier || 
    user?.subscriptionStatus === 'expired' || 
    user?.subscriptionStatus === 'active');

  // Empty state when no conversations
  const renderEmptyState = () => {
    if (hasEverSubscribed) {
      // Expired/returning customer - show personalized message
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.expiredIconContainer}>
            <Icon name="clock" size={48} color="#f59e0b" />
          </View>
          <Text style={styles.expiredTitle}>Welcome Back!</Text>
          <Text style={styles.expiredText}>
            Your conversation history is temporarily hidden. Renew your subscription to restore access to all your past conversations and continue connecting with the world.
          </Text>
          <TouchableOpacity
            style={styles.renewButton}
            onPress={() => setShowSubscriptionModal(true)}
          >
            <Icon name="refresh-cw" size={20} color="#fff" />
            <Text style={styles.renewButtonText}>Renew Subscription</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.newChatButtonText}>Start New Conversation</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      // New user - show original message
      return (
        <View style={styles.emptyContainer}>
          <Icon name="message-square" size={48} color="#ccc" />
          <Text style={styles.emptyTitle}>Ready to break down language barriers?</Text>
          <Text style={styles.emptyText}>Start your first conversation and connect with the world!</Text>
          <TouchableOpacity
            style={styles.newButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Icon name="plus" size={24} color="#fff" />
            <Text style={styles.newButtonText}>Start Your First Chat</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };
  
  return (
    <View style={styles.container}>
      <Header />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversationItem}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4F46E5']}
            />
          }
        />
      )}

      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        hasEverSubscribed={hasEverSubscribed}
        feature="conversation_history"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50, // account for status bar
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  messageButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  newConversationButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  conversationDate: {
    fontSize: 12,
    color: '#666',
  },
  languageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  languageText: {
    fontSize: 14,
    color: '#4F46E5',
  },
  messageCount: {
    fontSize: 12,
    color: '#999',
  },
  conversationActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  newButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  expiredIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#fef3c7',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  expiredTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    color: '#333',
    textAlign: 'center',
  },
  expiredText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  renewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 25,
    marginBottom: 12,
  },
  renewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  newChatButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  newChatButtonText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '500',
  },
});
