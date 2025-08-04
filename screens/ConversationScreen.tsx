import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, I18nManager, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import Header from '../components/Header';
import VoiceInputControls from '../components/VoiceInputControls';
import { isRTLLanguage, rtlStyle, getWritingDirection } from '../utils/rtlSupport';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/api';

import LanguageSelector from '../components/LanguageSelectorMobile';
import PerformanceIndicator from '../components/PerformanceMonitor';

type ConversationNavigationProp = StackNavigationProp<RootStackParamList, 'Conversation'>;

export default function ConversationScreen() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<ConversationNavigationProp>();
  const route = useRoute<any>();
  const conversationId = route.params?.id;
  
  const [messages, setMessages] = useState<Array<{
    id: string;
    text: string;
    translation: string;
    fromLanguage: string;
    toLanguage: string;
    timestamp: Date;
  }>>([]);
  
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check subscription status
  const hasActiveSubscription = user?.subscriptionStatus === 'active' || user?.subscriptionTier === 'lifetime';

  // Load conversation data if viewing from history
  useEffect(() => {
    if (conversationId && hasActiveSubscription) {
      loadConversation();
    }
  }, [conversationId, hasActiveSubscription]);

  const loadConversation = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load conversation');
      }

      const data = await response.json();
      
      // Set the conversation messages
      if (data.messages && Array.isArray(data.messages)) {
        setMessages(data.messages.map((msg: any) => ({
          id: msg.id,
          text: msg.originalText,
          translation: msg.translatedText,
          fromLanguage: msg.fromLanguage,
          toLanguage: msg.toLanguage,
          timestamp: new Date(msg.createdAt),
        })));
      }

      // Set the language pair from the first message
      if (data.messages && data.messages.length > 0) {
        setSourceLanguage(data.messages[0].fromLanguage);
        setTargetLanguage(data.messages[0].toLanguage);
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Failed to load conversation history');
    } finally {
      setIsLoading(false);
    }
  };

  // Show subscription required screen for non-subscribers
  if (!hasActiveSubscription) {
    return (
      <View style={[styles.container, isDarkMode && styles.containerDark]}>
        <Header />
        
        <View style={styles.subscriptionRequiredContainer}>
          <Ionicons 
            name="lock-closed" 
            size={64} 
            color={isDarkMode ? '#5c8cff' : '#3366FF'} 
          />
          <Text style={[styles.subscriptionTitle, isDarkMode && styles.subscriptionTitleDark]}>
            Subscription Required
          </Text>
          <Text style={[styles.subscriptionMessage, isDarkMode && styles.subscriptionMessageDark]}>
            Voice-to-voice translation is available to active subscribers only.
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
      
      <LanguageSelector 
        sourceLanguage={sourceLanguage}
        targetLanguage={targetLanguage}
        onSourceLanguageChange={setSourceLanguage}
        onTargetLanguageChange={setTargetLanguage}
      />
      
      <PerformanceIndicator showDetails={false} />
      
      <ScrollView style={styles.messagesContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={isDarkMode ? '#5c8cff' : '#3366FF'} />
            <Text style={[styles.loadingText, isDarkMode && styles.loadingTextDark]}>
              Loading conversation...
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
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, isDarkMode && styles.emptyStateTextDark]}>
              {conversationId ? 'No messages in this conversation' : 'Start speaking to begin your conversation'}
            </Text>
          </View>
        ) : (
          messages.map((message) => {
            const isSourceRTL = isRTLLanguage(message.fromLanguage);
            const isTargetRTL = isRTLLanguage(message.toLanguage);
            
            return (
              <View key={message.id} style={styles.messageCard}>
                <View style={[
                  styles.originalSection,
                  isSourceRTL && styles.rtlSection
                ]}>
                  <Text style={styles.languageLabel}>Original</Text>
                  <Text style={[
                    styles.originalText,
                    isSourceRTL && styles.rtlText
                  ]}>{message.text}</Text>
                </View>
                <View style={styles.divider} />
                <View style={[
                  styles.translationSection,
                  isTargetRTL && styles.rtlSection
                ]}>
                  <Text style={styles.languageLabel}>Translation</Text>
                  <Text style={[
                    styles.translatedText,
                    isTargetRTL && styles.rtlText
                  ]}>{message.translation}</Text>
                </View>
                <Text style={styles.languagePair}>
                  {message.fromLanguage} → {message.toLanguage}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>
      
      <View style={styles.controlsContainer}>
        <VoiceInputControls 
          onMessage={(message) => setMessages(prev => [...prev, message])}
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
        />
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
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptyStateTextDark: {
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
  messageCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  originalSection: {
    marginBottom: 12,
  },
  translationSection: {
    marginBottom: 12,
  },
  languageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  originalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    lineHeight: 22,
  },
  translatedText: {
    fontSize: 16,
    color: '#3366FF',
    lineHeight: 22,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  languagePair: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'right',
  },
  controlsContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  rtlSection: {
    alignItems: 'flex-end',
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
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