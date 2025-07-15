import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Message, Language } from '../types';
import { VoiceProfile } from '../api/speechService';
import { 
  speakText, 
  isSpeaking, 
  stopSpeaking, 
  pauseSpeaking, 
  resumeSpeaking 
} from '../api/speechService';
import { markMessageAsSpoken } from '../api/conversationService';
import PlaybackControls from './PlaybackControls';

interface ConversationAreaProps {
  messages: Message[];
  isTyping: boolean;
  sourceLanguage: Language;
  targetLanguage: Language;
  selectedVoiceProfileId?: string;
  voiceProfiles?: VoiceProfile[];
}

export default function ConversationArea({
  messages,
  isTyping,
  sourceLanguage,
  targetLanguage,
  selectedVoiceProfileId,
  voiceProfiles = []
}: ConversationAreaProps) {
  const flatListRef = useRef<FlatList>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  
  // Track previous message count to detect new messages
  const lastMessageCountRef = useRef<number>(0);
  const initialLoadCompleteRef = useRef<boolean>(false);
  const baselineMessageCountRef = useRef<number>(0);
  
  // Initialize baseline on first render to prevent auto-playback of historical messages
  useEffect(() => {
    console.log(`[ConversationArea] Initial setup - messages.length: ${messages.length}`);
    
    // Always set baseline to current message count to prevent auto-playback of existing messages
    baselineMessageCountRef.current = messages.length;
    lastMessageCountRef.current = messages.length;
    
    // Mark initial load as complete immediately for empty conversations
    // For conversations with existing messages, add a longer delay to ensure they're historical
    if (messages.length === 0) {
      initialLoadCompleteRef.current = true;
      console.log(`[ConversationArea] Empty conversation - initial load complete`);
    } else {
      // Longer delay for conversations with existing messages to ensure they're treated as historical
      setTimeout(() => {
        initialLoadCompleteRef.current = true;
        console.log(`[ConversationArea] Historical conversation loaded - initial load complete`);
      }, 2000); // Increased to 2 seconds
    }
  }, []);
  
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
      
      // CRITICAL FIX: Only auto-play NEW real-time messages, not historical ones
      const currentMessageCount = messages.length;
      
      // STRICT: Only auto-play if this is genuinely a NEW real-time message
      const isNewRealTimeMessage = initialLoadCompleteRef.current && 
                                   currentMessageCount > baselineMessageCountRef.current &&
                                   currentMessageCount > lastMessageCountRef.current;
      
      if (isNewRealTimeMessage) {
        const latestMessage = messages[messages.length - 1];
        
        // Only auto-play if it's a translation (not user message) and hasn't been played before
        if (!latestMessage.isUser && !latestMessage.hasBeenSpoken) {
          console.log(`[ConversationArea] Auto-playing NEW REAL-TIME translation: ${latestMessage.id.slice(0, 6)}... (count: ${currentMessageCount} > baseline: ${baselineMessageCountRef.current})`);
          
          // Add a slight delay to ensure the UI has time to render
          setTimeout(() => {
            playAudio(latestMessage);
          }, 300);
        } else {
          console.log(`[ConversationArea] Skipping auto-playback - message is user message or already spoken`);
        }
      } else {
        if (!initialLoadCompleteRef.current) {
          console.log(`[ConversationArea] Skipping auto-playback - initial load not complete (${currentMessageCount} messages loading)`);
        } else {
          console.log(`[ConversationArea] Skipping auto-playback - not a new message (count: ${currentMessageCount}, baseline: ${baselineMessageCountRef.current}, last: ${lastMessageCountRef.current})`);
        }
      }
      
      // Update the reference value with current count
      lastMessageCountRef.current = currentMessageCount;
    }
  }, [messages, isTyping]);
  
  // Find the selected voice profile
  const getVoiceProfile = () => {
    if (!selectedVoiceProfileId || !voiceProfiles?.length) return null;
    return voiceProfiles.find(profile => profile.id === selectedVoiceProfileId) || null;
  };
  
  // Play audio with voice profile if available
  const playAudio = async (message: Message) => {
    try {
      const languageCode = message.isUser ? sourceLanguage.code : targetLanguage.code;
      const voiceProfile = getVoiceProfile();
      
      // Check if already speaking and stop it first
      if (await isSpeaking()) {
        stopSpeaking();
      }
      
      // Set the current playing message
      setPlayingMessageId(message.id);
      setIsPaused(false);
      
      // Mark message as spoken using API if not already marked
      if (!message.hasBeenSpoken) {
        try {
          console.log(`[ConversationArea] Marking message ${message.id.slice(0, 6)}... as spoken`);
          
          // Call the correct API endpoint
          markMessageAsSpoken(message.id)
            .then(() => {
              console.log(`[ConversationArea] Successfully marked message ${message.id.slice(0, 6)}... as spoken`);
              // Update local state to reflect change
              message.hasBeenSpoken = true;
            })
            .catch(err => {
              console.error('[ConversationArea] Error in markMessageAsSpoken API call:', err);
            });
        } catch (markError) {
          console.error('[ConversationArea] Error marking message as spoken:', markError);
        }
      }
      
      // Speak with voice profile if available
      await speakText(
        message.text, 
        languageCode, 
        voiceProfile,
        () => {
          // On speech complete
          // IMPORTANT: Do NOT clear playingMessageId here to keep controls visible!
          // Only reset the pause state
          setIsPaused(false);
          console.log(`[ConversationArea] Speech completed for message ${message.id.slice(0, 6)}... but keeping controls visible`);
        }
      );
    } catch (error) {
      console.error('Error playing audio:', error);
      setPlayingMessageId(null);
      setIsPaused(false);
    }
  };
  
  // Toggle pause/resume
  const togglePause = async () => {
    if (isPaused) {
      resumeSpeaking();
      setIsPaused(false);
    } else {
      pauseSpeaking();
      setIsPaused(true);
    }
  };
  
  // Stop playback
  const stopAudio = () => {
    stopSpeaking();
    // IMPORTANT: Don't clear playingMessageId to ensure controls remain visible
    // This is critical for the mobile experience
    // setPlayingMessageId(null); // Commented out intentionally
    
    // We intentionally keep the playingMessageId set to maintain the connection
    // between the message and its controls
    
    console.log(`[ConversationArea] Stop button clicked, but keeping controls visible with playingMessageId=${playingMessageId}`);
    
    // Make sure pause state is reset
    setIsPaused(false);
  };
  
  const renderMessageItem = ({ item }: { item: Message }) => {
    console.log(`[ConversationArea] Rendering message ${item.id.slice(0, 6)}... - isUser: ${item.isUser}, hasBeenSpoken: ${item.hasBeenSpoken}`);
    
    return (
      <View 
        style={[
          styles.messageContainer,
          item.isUser ? styles.userMessageContainer : styles.botMessageContainer
        ]}
      >
        <View style={[
          styles.messageBubble,
          item.isUser ? styles.userMessageBubble : styles.botMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            item.isUser ? styles.userMessageText : styles.botMessageText
          ]}>
            {item.text}
          </Text>
          
          {/* Use our dedicated PlaybackControls component for better state management 
              This is a critical fix to ensure controls remain visible during pause */}
          <PlaybackControls
            isTranslation={!item.isUser}
            messageId={item.id}
            text={item.text}
            language={item.isUser ? sourceLanguage.code : targetLanguage.code}
            onPlay={() => playAudio(item)}
            onPause={togglePause}
            onResume={togglePause} // Since our toggle function handles both cases
            onStop={stopAudio}
            isUser={item.isUser}
            isSpeaking={playingMessageId === item.id && !isPaused}
            isPaused={playingMessageId === item.id && isPaused}
            hasBeenSpoken={item.hasBeenSpoken} // Pass the database flag to the controls
          />
        </View>
        
        <View style={styles.messageInfo}>
          <Text style={styles.messageLanguage}>
          {item.isUser ? sourceLanguage.name : targetLanguage.name}
        </Text>
        <View style={styles.translationInfo}>
          <Icon 
            name={item.isUser ? "check-circle" : "globe"} 
            size={12} 
            color="#666" 
            style={styles.translationIcon} 
          />
          <Text style={styles.translationText}>
            {item.isUser 
              ? `Translated to ${targetLanguage.name}` 
              : `Translated from ${sourceLanguage.name}`}
          </Text>
        </View>
      </View>
    )
  };
    </View>
  );
  
  return (
    <View style={styles.container}>
      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="message-circle" size={48} color="#ccc" />
          <Text style={styles.emptyText}>Start a conversation</Text>
          <Text style={styles.emptySubtext}>Press and hold the microphone button to speak</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messagesList}
        />
      )}
      
      {isTyping && (
        <View style={styles.typingContainer}>
          <View style={styles.typingBubble}>
            <View style={styles.typingDots}>
              <View style={[styles.typingDot, styles.typingDot1]} />
              <View style={[styles.typingDot, styles.typingDot2]} />
              <View style={[styles.typingDot, styles.typingDot3]} />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 24,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  botMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    borderRadius: 20,
    maxWidth: '85%',
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  userMessageBubble: {
    backgroundColor: '#4F46E5',
    borderBottomRightRadius: 4,
  },
  botMessageBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  botMessageText: {
    color: '#333',
  },
  // Listen button styles
  listenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  listenButtonText: {
    fontSize: 12,
    marginLeft: 4,
  },
  userListenButtonText: {
    color: 'rgba(255,255,255,0.7)',
  },
  botListenButtonText: {
    color: 'rgba(0,0,0,0.5)',
  },
  // Audio control styles
  audioControlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  audioControlButton: {
    padding: 5,
    marginRight: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
  },
  messageInfo: {
    marginTop: 4,
  },
  messageLanguage: {
    fontSize: 12,
    color: '#666',
  },
  translationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  translationIcon: {
    marginRight: 4,
  },
  translationText: {
    fontSize: 11,
    color: '#999',
  },
  typingContainer: {
    padding: 16,
    alignItems: 'flex-start',
  },
  typingBubble: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  typingDots: {
    flexDirection: 'row',
    width: 40,
    justifyContent: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 2,
  },
  typingDot1: {
    opacity: 0.6,
    transform: [{ scale: 0.8 }],
  },
  typingDot2: {
    opacity: 0.8,
    transform: [{ scale: 0.9 }],
  },
  typingDot3: {
    opacity: 1,
    transform: [{ scale: 1 }],
  },
});
