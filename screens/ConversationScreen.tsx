import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import Header from '../components/Header';
import VoiceInputControls from '../components/VoiceInputControls';
import { isRTLLanguage } from '../utils/rtlSupport';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useParticipants } from '../contexts/ParticipantsContext';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../api/config';
import { getSupportedLanguages } from '../constants/languageConfiguration';
import { LanguagePreferencesStorage } from '../utils/languagePreferences';
import { configureNavigationBar } from '../utils/navigationBarConfig';

import LanguageSelector from '../components/LanguageSelectorMobile';
import PerformanceIndicator from '../components/PerformanceMonitor';
import StatusPill, { PipelineStatus } from '../components/StatusPill';

type ConversationNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Conversation'
>;

export default function ConversationScreen() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const { setParticipantLanguage } = useParticipants();
  const navigation = useNavigation<ConversationNavigationProp>();
  const route = useRoute<any>();
  const conversationId = route.params?.id;
  const insets = useSafeAreaInsets();

  // Space for the voice control button area + tab bar
  const SPEAK_BUTTON_BLOCK = 88;
  // Tab bar height matches MainTabNavigator configuration
  const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 49 : 56;

  // Configure Android navigation bar for this screen
  useEffect(() => {
    configureNavigationBar(isDarkMode);
  }, [isDarkMode]);

  const [messages, setMessages] = useState<
    Array<{
      id: string;
      text: string;
      translation: string;
      fromLanguage: string;
      toLanguage: string;
      timestamp: Date;
    }>
  >([]);

  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | undefined
  >(conversationId);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>('idle');

  const hasActiveSubscription =
    user?.subscriptionStatus === 'active' || user?.subscriptionTier === 'lifetime';

  const allLanguages = getSupportedLanguages();

  const getFlagEmoji = (code: string) => {
    const flagMap: { [key: string]: string } = {
      en: '🇺🇸',
      'es-ES': '🇪🇸',
      'es-419': '🇲🇽',
      fr: '🇫🇷',
      de: '🇩🇪',
      it: '🇮🇹',
      'pt-BR': '🇧🇷',
      pt: '🇵🇹',
      ru: '🇷🇺',
      zh: '🇨🇳',
      ja: '🇯🇵',
      ko: '🇰🇷',
      ar: '🇸🇦',
      hi: '🇮🇳',
      nl: '🇳🇱',
      sv: '🇸🇪',
      no: '🇳🇴',
      da: '🇩🇰',
      fi: '🇫🇮',
      pl: '🇵🇱',
      tr: '🇹🇷',
      he: '🇮🇱',
      th: '🇹🇭',
      vi: '🇻🇳',
      uk: '🇺🇦',
      cs: '🇨🇿',
      sk: '🇸🇰',
      hu: '🇭🇺',
      ro: '🇷🇴',
      bg: '🇧🇬',
      hr: '🇭🇷',
      sr: '🇷🇸',
      sl: '🇸🇮',
      et: '🇪🇪',
      lv: '🇱🇻',
      lt: '🇱🇹',
      mt: '🇲🇹',
      ga: '🇮🇪',
      cy: '🏴󞁿',
      is: '🇮🇸',
      mk: '🇲🇰',
      sq: '🇦🇱',
      eu: '🏴󞁿',
      ca: '🏴󞁿',
      gl: '🏴󞁿',
      af: '🇿🇦',
      sw: '🇰🇪',
      zu: '🇿🇦',
      xh: '🇿🇦',
      yo: '🇳🇬',
      ig: '🇳🇬',
      ha: '🇳🇬',
      am: '🇪🇹',
      or: '🇮🇳',
      as: '🇮🇳',
      bn: '🇧🇩',
      gu: '🇮🇳',
      kn: '🇮🇳',
      ml: '🇮🇳',
      mr: '🇮🇳',
      ne: '🇳🇵',
      pa: '🇮🇳',
      si: '🇱🇰',
      ta: '🇮🇳',
      te: '🇮🇳',
      ur: '🇵🇰',
      sher: '🇳🇵',
      dz: '🇧🇹',
    };

    if (code === 'es') return '🇲🇽';
    return flagMap[code] || '🌍';
  };

  useEffect(() => {
    const loadLanguagePreferences = async () => {
      if (!conversationId && !preferencesLoaded) {
        const preferences =
          await LanguagePreferencesStorage.getLanguagePreferences();
        if (preferences) {
          setSourceLanguage(preferences.sourceLanguage);
          setTargetLanguage(preferences.targetLanguage);
        } else {
          const defaults = LanguagePreferencesStorage.getDefaultLanguages();
          setSourceLanguage(defaults.sourceLanguage);
          setTargetLanguage(defaults.targetLanguage);
        }
        setPreferencesLoaded(true);
      }
    };

    loadLanguagePreferences();
  }, [conversationId, preferencesLoaded]);

  useEffect(() => {
    const savePreferences = async () => {
      if (!conversationId && preferencesLoaded) {
        await LanguagePreferencesStorage.saveLanguagePreferences(
          sourceLanguage,
          targetLanguage
        );
      }
    };

    savePreferences();
  }, [sourceLanguage, targetLanguage, conversationId, preferencesLoaded]);

  useEffect(() => {
    if (preferencesLoaded && sourceLanguage) {
      setParticipantLanguage('A', sourceLanguage);
    }
  }, [sourceLanguage, preferencesLoaded, setParticipantLanguage]);

  useEffect(() => {
    if (preferencesLoaded && targetLanguage) {
      setParticipantLanguage('B', targetLanguage);
    }
  }, [targetLanguage, preferencesLoaded, setParticipantLanguage]);

  useEffect(() => {
    if (conversationId && hasActiveSubscription) {
      loadConversation();
    }
  }, [conversationId, hasActiveSubscription]);

  const loadConversation = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/api/conversations/${conversationId}`,
        {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) throw new Error('Failed to load conversation');

      const data = await response.json();

      if (data.messages && Array.isArray(data.messages)) {
        setMessages(
          data.messages.map((msg: any) => ({
            id: msg.id,
            text: msg.originalText,
            translation: msg.translatedText,
            fromLanguage: msg.fromLanguage,
            toLanguage: msg.toLanguage,
            timestamp: new Date(msg.createdAt),
          }))
        );
      }

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

  if (!hasActiveSubscription) {
    return (
      <SafeAreaView
        edges={['bottom']}
        style={[styles.container, isDarkMode && styles.containerDark]}
      >
        <Header />

        <View style={styles.subscriptionRequiredContainer}>
          <Ionicons
            name="lock-closed"
            size={64}
            color={isDarkMode ? '#5c8cff' : '#3366FF'}
          />
          <Text
            style={[
              styles.subscriptionTitle,
              isDarkMode && styles.subscriptionTitleDark,
            ]}
          >
            Subscription Required
          </Text>
          <Text
            style={[
              styles.subscriptionMessage,
              isDarkMode && styles.subscriptionMessageDark,
            ]}
          >
            Voice-to-voice translation is available to active subscribers only.
          </Text>
          <TouchableOpacity
            style={[
              styles.subscribeButton,
              isDarkMode && styles.subscribeButtonDark,
            ]}
            onPress={() => navigation.navigate('Pricing')}
          >
            <Text style={styles.subscribeButtonText}>Choose a Plan</Text>
          </TouchableOpacity>

          <Text
            style={[styles.accessInfo, isDarkMode && styles.accessInfoDark]}
          >
            As a free user, you can access:
          </Text>
          <View style={styles.accessList}>
            <Text
              style={[styles.accessItem, isDarkMode && styles.accessItemDark]}
            >
              • Profile Settings
            </Text>
            <Text
              style={[styles.accessItem, isDarkMode && styles.accessItemDark]}
            >
              • Help Center
            </Text>
            <Text
              style={[styles.accessItem, isDarkMode && styles.accessItemDark]}
            >
              • Manage Plan
            </Text>
            <Text
              style={[styles.accessItem, isDarkMode && styles.accessItemDark]}
            >
              • Account Settings
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.container, isDarkMode && styles.containerDark]}
    >
      <Header />

      <StatusPill status={pipelineStatus} />

      <LanguageSelector
        sourceLanguage={sourceLanguage}
        targetLanguage={targetLanguage}
        onSourceLanguageChange={setSourceLanguage}
        onTargetLanguageChange={setTargetLanguage}
      />

      <PerformanceIndicator showDetails={false} />

      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={{ 
          paddingBottom: SPEAK_BUTTON_BLOCK + TAB_BAR_HEIGHT + insets.bottom + 12 
        }}
        // Avoid keyboard / nav issues a bit on Android
        keyboardShouldPersistTaps="handled"
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={isDarkMode ? '#5c8cff' : '#3366FF'}
            />
            <Text
              style={[
                styles.loadingText,
                isDarkMode && styles.loadingTextDark,
              ]}
            >
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
            <Text
              style={[styles.errorText, isDarkMode && styles.errorTextDark]}
            >
              {error}
            </Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="globe-outline"
              size={48}
              color={isDarkMode ? '#666' : '#ccc'}
            />
            <Text
              style={[
                styles.emptyStateText,
                isDarkMode && styles.emptyStateTextDark,
              ]}
            >
              {conversationId
                ? 'No messages in this conversation'
                : 'Welcome! Your translations will appear here'}
            </Text>
          </View>
        ) : (
          messages.map((message) => {
            const isSourceRTL = isRTLLanguage(message.fromLanguage);
            const isTargetRTL = isRTLLanguage(message.toLanguage);

            return (
              <View
                key={message.id}
                style={[styles.messageCard, isDarkMode && styles.messageCardDark]}
              >
                <View
                  style={[styles.originalSection, isSourceRTL && styles.rtlSection]}
                >
                  <Text
                    style={[
                      styles.languageLabel,
                      isDarkMode && styles.languageLabelDark,
                    ]}
                  >
                    Original
                  </Text>
                  <Text
                    style={[
                      styles.originalText,
                      isDarkMode && styles.originalTextDark,
                      isSourceRTL && styles.rtlText,
                    ]}
                  >
                    {message.text}
                  </Text>
                </View>
                <View style={[styles.divider, isDarkMode && styles.dividerDark]} />
                <View
                  style={[
                    styles.translationSection,
                    isTargetRTL && styles.rtlSection,
                  ]}
                >
                  <Text
                    style={[
                      styles.languageLabel,
                      isDarkMode && styles.languageLabelDark,
                    ]}
                  >
                    Translation
                  </Text>
                  <Text
                    style={[
                      styles.translatedText,
                      isDarkMode && styles.translatedTextDark,
                      isTargetRTL && styles.rtlText,
                    ]}
                  >
                    {message.translation}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.languagePair,
                    isDarkMode && styles.languagePairDark,
                  ]}
                >
                  {getFlagEmoji(message.fromLanguage)} {message.fromLanguage} →{' '}
                  {getFlagEmoji(message.toLanguage)} {message.toLanguage}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>

      <View
        style={[
          styles.controlsContainer,
          isDarkMode && styles.controlsContainerDark,
          {
            // Account for tab bar height + system navigation bar
            // Tab bar is 56px on Android, and we add safe area bottom inset
            // This ensures voice controls are visible above the tab bar
            paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 8,
          },
        ]}
      >
        <VoiceInputControls
          onStatusChange={setPipelineStatus}
          onMessage={async (message) => {
            if (!currentConversationId && hasActiveSubscription) {
              try {
                const response = await fetch(`${API_BASE_URL}/api/conversations`, {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    sourceLanguage: message.fromLanguage,
                    targetLanguage: message.toLanguage,
                    title: `${getFlagEmoji(message.fromLanguage)} ${
                      message.fromLanguage
                    } → ${getFlagEmoji(message.toLanguage)} ${
                      message.toLanguage
                    }`,
                  }),
                });

                if (response.ok) {
                  const newConversation = await response.json();
                  setCurrentConversationId(newConversation.id);

                  await fetch(
                    `${API_BASE_URL}/api/conversations/${newConversation.id}/messages`,
                    {
                      method: 'POST',
                      credentials: 'include',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        text: message.text,
                        sourceLanguage: message.fromLanguage,
                        targetLanguage: message.toLanguage,
                      }),
                    }
                  );
                }
              } catch (error) {
                console.error('Error creating conversation:', error);
              }
            } else if (currentConversationId && hasActiveSubscription) {
              try {
                await fetch(
                  `${API_BASE_URL}/api/conversations/${currentConversationId}/messages`,
                  {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      text: message.text,
                      sourceLanguage: message.fromLanguage,
                      targetLanguage: message.toLanguage,
                    }),
                  }
                );
              } catch (error) {
                console.error('Error saving message:', error);
              }
            }

            setMessages((prev) => [...prev, message]);
          }}
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  containerDark: { backgroundColor: '#1a1a1a' },

  messagesContainer: { flex: 1, paddingHorizontal: 16 },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
  },
  emptyStateTextDark: { color: '#666' },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  loadingTextDark: { color: '#999' },

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
  errorTextDark: { color: '#ff6b6b' },

  messageCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  messageCardDark: { backgroundColor: '#2a2a2a', borderColor: '#3a3a3a' },

  originalSection: { marginBottom: 12 },
  translationSection: { marginBottom: 12 },

  languageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  languageLabelDark: { color: '#999' },

  originalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    lineHeight: 22,
  },
  originalTextDark: { color: '#fff' },

  translatedText: {
    fontSize: 16,
    color: '#3366FF',
    lineHeight: 22,
    fontWeight: '500',
  },
  translatedTextDark: { color: '#5c8cff' },

  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 },
  dividerDark: { backgroundColor: '#3a3a3a' },

  languagePair: { fontSize: 12, color: '#666', fontWeight: '500', textAlign: 'right' },
  languagePairDark: { color: '#999' },

  controlsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    backgroundColor: '#ffffff',
  },
  controlsContainerDark: {
    borderTopColor: '#3a3a3a',
    backgroundColor: '#1a1a1a',
  },

  rtlSection: { alignItems: 'flex-end' },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },

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
  subscriptionTitleDark: { color: '#fff' },
  subscriptionMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  subscriptionMessageDark: { color: '#ccc' },
  subscribeButton: {
    backgroundColor: '#3366FF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  subscribeButtonDark: { backgroundColor: '#5c8cff' },
  subscribeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  accessInfo: { fontSize: 14, color: '#666', marginBottom: 16 },
  accessInfoDark: { color: '#999' },
  accessList: { alignItems: 'flex-start' },
  accessItem: { fontSize: 14, color: '#666', marginBottom: 8, lineHeight: 20 },
  accessItemDark: { color: '#999' },
});