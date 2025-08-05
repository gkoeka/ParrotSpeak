import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../api/config';
import { getFlagEmoji } from '../constants/languageConfiguration';

type ConversationsListNavigationProp = StackNavigationProp<RootStackParamList, 'ConversationsList'>;

export default function ConversationsListScreen() {
  const navigation = useNavigation<ConversationsListNavigationProp>();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  
  // Check subscription status
  const hasActiveSubscription = user?.subscriptionStatus === 'active' || user?.subscriptionTier === 'lifetime';

  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hasActiveSubscription) {
      loadConversations();
    }
  }, [hasActiveSubscription]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Import SecureStorage to get the auth token
      const { SecureStorage } = await import('../utils/secureStorage');
      const token = await SecureStorage.getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/conversations`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load conversations');
      }

      const data = await response.json();
      
      // Transform the data to match the expected format
      const formattedConversations = data.map((conv: any) => {
        const sourceCode = conv.sourceLanguage || 'en';
        const targetCode = conv.targetLanguage || 'es';
        
        // Extract base language names from codes (e.g., 'en-US' -> 'English')
        const getLanguageName = (code: string) => {
          const baseCode = code.split('-')[0].toLowerCase();
          const languageNames: { [key: string]: string } = {
            'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
            'it': 'Italian', 'pt': 'Portuguese', 'ru': 'Russian', 'zh': 'Chinese',
            'ja': 'Japanese', 'ko': 'Korean', 'ar': 'Arabic', 'hi': 'Hindi',
            'nl': 'Dutch', 'sv': 'Swedish', 'no': 'Norwegian', 'da': 'Danish',
            'fi': 'Finnish', 'pl': 'Polish', 'tr': 'Turkish', 'he': 'Hebrew',
            'th': 'Thai', 'vi': 'Vietnamese', 'uk': 'Ukrainian', 'cs': 'Czech',
            'sk': 'Slovak', 'hu': 'Hungarian', 'ro': 'Romanian', 'bg': 'Bulgarian',
            'hr': 'Croatian', 'sr': 'Serbian', 'sl': 'Slovenian', 'et': 'Estonian',
            'lv': 'Latvian', 'lt': 'Lithuanian', 'mt': 'Maltese', 'ga': 'Irish',
            'cy': 'Welsh', 'is': 'Icelandic', 'mk': 'Macedonian', 'sq': 'Albanian',
            'eu': 'Basque', 'ca': 'Catalan', 'gl': 'Galician', 'af': 'Afrikaans',
            'sw': 'Swahili', 'zu': 'Zulu', 'xh': 'Xhosa', 'yo': 'Yoruba',
            'ig': 'Igbo', 'ha': 'Hausa', 'am': 'Amharic', 'or': 'Odia',
            'as': 'Assamese', 'bn': 'Bengali', 'gu': 'Gujarati', 'kn': 'Kannada',
            'ml': 'Malayalam', 'mr': 'Marathi', 'ne': 'Nepali', 'pa': 'Punjabi',
            'si': 'Sinhala', 'ta': 'Tamil', 'te': 'Telugu', 'ur': 'Urdu'
          };
          return languageNames[baseCode] || code;
        };
        
        return {
          id: conv.id,
          title: conv.title || `Conversation ${conv.id.slice(0, 8)}`,
          sourceLanguage: sourceCode,
          targetLanguage: targetCode,
          languages: `${getFlagEmoji(sourceCode)} ${getLanguageName(sourceCode)} → ${getFlagEmoji(targetCode)} ${getLanguageName(targetCode)}`,
          lastActivity: formatTimeAgo(new Date(conv.updatedAt || conv.createdAt)),
          messageCount: conv.messageCount || 0,
        };
      });
      
      setConversations(formattedConversations);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

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
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={isDarkMode ? '#5c8cff' : '#3366FF'} />
            <Text style={[styles.loadingText, isDarkMode && styles.loadingTextDark]}>
              Loading conversations...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons 
              name="alert-circle" 
              size={48} 
              color={isDarkMode ? '#ff6b6b' : '#dc3545'} 
            />
            <Text style={[styles.errorText, isDarkMode && styles.errorTextDark]}>
              {error}
            </Text>
            <TouchableOpacity 
              style={[styles.retryButton, isDarkMode && styles.retryButtonDark]}
              onPress={loadConversations}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : conversations.length === 0 ? (
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  loadingTextDark: {
    color: '#999',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
  },
  errorTextDark: {
    color: '#ff6b6b',
  },
  retryButton: {
    backgroundColor: '#3366FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonDark: {
    backgroundColor: '#5c8cff',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});