import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { Language, Message } from '../types';
import { fetchConversation } from '../api/conversationService';
import { fetchVoiceProfiles } from '../api/voiceProfileService';
import { VoiceProfile } from '../api/speechService';
import { checkFeatureAccess, translateText, transcribeSpeech, type SubscriptionError } from '../api/subscriptionService';
import { webSocketService, sendTranslationRequest, type WebSocketMessage } from '../api/websocketService';
import Icon from 'react-native-vector-icons/Feather';
import ConversationArea from '../components/ConversationArea';
import VoiceInputControls from '../components/VoiceInputControls';
import LanguageSelector from '../components/LanguageSelector';
import { SubscriptionModal } from '../components/SubscriptionModal';

type ConversationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Conversation'>;
type ConversationScreenRouteProp = RouteProp<RootStackParamList, 'Conversation'>;

export default function ConversationScreen() {
  const navigation = useNavigation<ConversationScreenNavigationProp>();
  const route = useRoute<ConversationScreenRouteProp>();
  const { id } = route.params || {};
  
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [title, setTitle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  
  // Voice profile state
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([]);
  const [selectedVoiceProfileId, setSelectedVoiceProfileId] = useState<string | undefined>(undefined);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  
  // Subscription protection state
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [hasEverSubscribed, setHasEverSubscribed] = useState(false);
  
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
  
  // Load conversation and voice profiles when component mounts
  useEffect(() => {
    if (id) {
      loadConversation();
    }
    
    // Load voice profiles
    loadVoiceProfiles();
  }, [id]);
  
  // Load voice profiles
  const loadVoiceProfiles = async () => {
    try {
      setIsLoadingProfiles(true);
      const profiles = await fetchVoiceProfiles();
      if (profiles && profiles.length > 0) {
        setVoiceProfiles(profiles);
        
        // Set default profile if available
        const defaultProfile = profiles.find(p => p.isDefault);
        if (defaultProfile) {
          setSelectedVoiceProfileId(defaultProfile.id);
        } else if (profiles.length > 0) {
          // Otherwise use the first profile
          setSelectedVoiceProfileId(profiles[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load voice profiles:', error);
    } finally {
      setIsLoadingProfiles(false);
    }
  };
  
  const loadConversation = async () => {
    try {
      setIsLoading(true);
      const data = await fetchConversation(id!);
      
      if (data) {
        setMessages(data.messages || []);
        setTitle(data.customName || data.title);
        
        // Find or create language objects
        const languages = await import('../constants/languages');
        
        const sourceLang = languages.default.find(
          (lang: Language) => lang.code === data.sourceLanguage
        ) || sourceLanguage;
        
        const targetLang = languages.default.find(
          (lang: Language) => lang.code === data.targetLanguage
        ) || targetLanguage;
        
        setSourceLanguage(sourceLang);
        setTargetLanguage(targetLang);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      Alert.alert('Error', 'Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleStartRecording = () => {
    setIsRecording(true);
    // Implement voice recording logic
  };
  
  const handleStopRecording = async () => {
    setIsRecording(false);
    setIsProcessing(true);
    
    try {
      // Check subscription access first
      const accessCheck = await checkFeatureAccess('translation');
      if (!accessCheck.hasAccess) {
        setHasEverSubscribed(accessCheck.subscriptionInfo.tier !== null);
        setShowSubscriptionModal(true);
        setIsProcessing(false);
        return null;
      }

      // Implement actual speech recognition and translation
      const mockText = "Hello, this is a test translation";
      const result = await translateText(mockText, sourceLanguage.code, targetLanguage.code);
      
      // Add the translated message to the conversation
      const newMessage: Message = {
        id: Date.now().toString(),
        text: mockText,
        translation: result.translation,
        sourceLanguage: sourceLanguage.code,
        targetLanguage: targetLanguage.code,
        timestamp: new Date(),
        isSpoken: false
      };
      
      setMessages(prev => [...prev, newMessage]);
      
    } catch (error: any) {
      console.error('Translation error:', error);
      
      // Check if it's a subscription error
      if (error.error === 'Active subscription required') {
        setHasEverSubscribed(error.subscriptionInfo?.tier !== null || false);
        setShowSubscriptionModal(true);
      } else {
        Alert.alert('Error', 'Failed to process voice recording');
      }
    } finally {
      setIsProcessing(false);
    }
    
    return null;
  };
  
  const handleSwapLanguages = () => {
    const temp = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(temp);
  };
  
  const handleNewConversation = () => {
    // Navigate to Home screen which starts a new conversation
    navigation.navigate('Home');
    
    // Show a confirmation message
    Alert.alert(
      "New Conversation",
      "Started a new conversation",
      [{ text: "OK" }],
      { cancelable: true }
    );
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading conversation...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.newConversationButton}
          onPress={handleNewConversation}
          accessibilityLabel="New conversation"
        >
          <Icon name="message-square" size={22} color="#4F46E5" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Icon name="more-vertical" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      
      <LanguageSelector
        sourceLanguage={sourceLanguage}
        targetLanguage={targetLanguage}
        onSourceLanguageChange={setSourceLanguage}
        onTargetLanguageChange={setTargetLanguage}
        onSwapLanguages={handleSwapLanguages}
      />
      
      <ConversationArea
        messages={messages}
        isTyping={isProcessing}
        sourceLanguage={sourceLanguage}
        targetLanguage={targetLanguage}
        selectedVoiceProfileId={selectedVoiceProfileId}
        voiceProfiles={voiceProfiles}
      />
      
      <VoiceInputControls
        isRecording={isRecording}
        isProcessing={isProcessing}
        voiceLevel={voiceLevel}
        language={sourceLanguage}
        speechError={null}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: 50, // Adjust for status bar
  },
  backButton: {
    marginRight: 12,
  },
  newConversationButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuButton: {
    marginLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});
