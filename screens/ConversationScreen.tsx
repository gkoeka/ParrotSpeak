import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, I18nManager } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import VoiceInputControls from '../components/VoiceInputControls';
import { isRTLLanguage, rtlStyle, getWritingDirection } from '../utils/rtlSupport';

import LanguageSelector from '../components/LanguageSelectorMobile';

export default function ConversationScreen() {
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

  return (
    <View style={styles.container}>
      <Header />
      
      <LanguageSelector 
        sourceLanguage={sourceLanguage}
        targetLanguage={targetLanguage}
        onSourceLanguageChange={setSourceLanguage}
        onTargetLanguageChange={setTargetLanguage}
      />
      
      <ScrollView style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Start speaking to begin your conversation
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
});