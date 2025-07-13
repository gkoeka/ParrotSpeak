import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { Language } from '../types';
import { getLanguages, translateText } from '../api/languageService';
import { sendMessage } from '../api/conversationService';
import { createConversation, checkFeatureAccess, type SubscriptionError } from '../api/subscriptionService';
import LanguageSelector from '../components/LanguageSelector';
import VoiceInputControls from '../components/VoiceInputControls';
import ConversationArea from '../components/ConversationArea';
import Header from '../components/Header';
import { SubscriptionModal } from '../components/SubscriptionModal';
import VisualTranslationCard from '../components/VisualTranslationCard';
import Icon from 'react-native-vector-icons/Feather';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [messages, setMessages] = useState([]);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [loadingLanguages, setLoadingLanguages] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [hasEverSubscribed, setHasEverSubscribed] = useState(false);
  
  // Default languages (will be replaced with loaded languages)
  const [sourceLanguage, setSourceLanguage] = useState<Language>({
    code: "en-US",
    name: "English",
    country: "United States",
    flag: "https://flagcdn.com/us.svg"
  });
  
  const [targetLanguage, setTargetLanguage] = useState<Language>({
    code: "es-ES",
    name: "Spanish",
    country: "Spain",
    flag: "https://flagcdn.com/es.svg"
  });
  
  // Load languages on component mount
  useEffect(() => {
    async function loadLanguages() {
      try {
        const languages = await getLanguages();
        if (languages && languages.length > 0) {
          // Find English and Spanish or set first two languages
          const english = languages.find(lang => lang.code === 'en-US') || languages[0];
          const spanish = languages.find(lang => lang.code === 'es-ES') || languages[1];
          
          setSourceLanguage(english);
          setTargetLanguage(spanish);
        }
      } catch (error) {
        console.error('Failed to load languages:', error);
      } finally {
        setLoadingLanguages(false);
      }
    }
    
    loadLanguages();
  }, []);
  
  const handleStartRecording = () => {
    setIsRecording(true);
    setSpeechError(null);
    // Animation for voice level
    const interval = setInterval(() => {
      setVoiceLevel(Math.floor(Math.random() * 100));
    }, 100);
    
    // Clean up on component unmount
    return () => clearInterval(interval);
  };
  
  const handleStopRecording = async () => {
    setIsRecording(false);
    setIsProcessing(true);
    
    try {
      // Simulate speech recognition result
      // In a real app, this would be actual speech recognition
      setTimeout(() => {
        const mockText = "Hello, how are you today?";
        handleTranslation(mockText);
      }, 1500);
      
      return null;
    } catch (error) {
      setSpeechError('Failed to recognize speech');
      setIsProcessing(false);
      return null;
    }
  };
  
  const handleTranslation = async (text: string) => {
    try {
      // Check subscription access first
      const accessCheck = await checkFeatureAccess('translation');
      if (!accessCheck.hasAccess) {
        setHasEverSubscribed(accessCheck.subscriptionInfo.tier !== null);
        setShowSubscriptionModal(true);
        setIsProcessing(false);
        return;
      }

      // If no conversation exists yet, create one
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        const newConversation = await createConversation({
          sourceLanguage: sourceLanguage.code,
          targetLanguage: targetLanguage.code
        });
        currentConversationId = newConversation.id;
        setConversationId(newConversation.id);
      }
      
      // Send message to server
      const result = await sendMessage(
        currentConversationId,
        text,
        sourceLanguage.code,
        targetLanguage.code
      );
      
      // Navigate to the conversation view
      navigation.navigate('Conversation', { id: currentConversationId });
      
    } catch (error: any) {
      console.error('Translation error:', error);
      
      // Check if it's a subscription error
      if (error.error === 'Active subscription required') {
        setHasEverSubscribed(error.subscriptionInfo?.tier !== null || false);
        setShowSubscriptionModal(true);
      } else {
        Alert.alert('Error', 'Failed to translate message');
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleSwapLanguages = () => {
    const temp = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(temp);
  };
  
  const handleViewConversations = () => {
    navigation.navigate('ConversationsList');
  };
  
  const handleViewSettings = () => {
    navigation.navigate('Settings');
  }
  
  const resetConversation = () => {
    // Reset conversation state
    setConversationId(null);
    setMessages([]);
    
    // Show a confirmation message
    Alert.alert(
      "New Conversation",
      "Started a new conversation",
      [{ text: "OK" }],
      { cancelable: true }
    );
  };
  
  if (loadingLanguages) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading languages...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <Header onNewConversation={resetConversation} />
      
      <LanguageSelector
        sourceLanguage={sourceLanguage}
        targetLanguage={targetLanguage}
        onSourceLanguageChange={setSourceLanguage}
        onTargetLanguageChange={setTargetLanguage}
        onSwapLanguages={handleSwapLanguages}
      />
      
      <View style={styles.emptyContainer}>
        <Icon name="message-circle" size={64} color="#e5e7eb" />
        <Text style={styles.emptyTitle}>Start Speaking</Text>
        <Text style={styles.emptyText}>
          Press and hold the microphone button to record your voice in {sourceLanguage.name}.
          It will be translated to {targetLanguage.name} instantly.
        </Text>
        
        <TouchableOpacity 
          style={styles.historyButton}
          onPress={handleViewConversations}
        >
          <Icon name="list" size={20} color="#4F46E5" />
          <Text style={styles.historyButtonText}>View Conversation History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={handleViewSettings}
        >
          <Icon name="settings" size={20} color="#4F46E5" />
          <Text style={styles.settingsButtonText}>Settings</Text>
        </TouchableOpacity>
      </View>

      <VisualTranslationCard
        sourceLanguage={sourceLanguage.name}
        targetLanguage={targetLanguage.name}
      />
      
      <VoiceInputControls
        isRecording={isRecording}
        isProcessing={isProcessing}
        voiceLevel={voiceLevel}
        language={sourceLanguage}
        speechError={speechError}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
      />

      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        hasEverSubscribed={hasEverSubscribed}
        feature="translation"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
    color: '#333',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    marginTop: 16,
  },
  historyButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '500',
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    marginTop: 12,
  },
  settingsButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '500',
  },
});
