import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';

type ConversationsListNavigationProp = StackNavigationProp<RootStackParamList, 'ConversationsList'>;

export default function ConversationsListScreen() {
  const navigation = useNavigation<ConversationsListNavigationProp>();
  const { isDarkMode } = useTheme();

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
});