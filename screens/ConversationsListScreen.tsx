import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import Header from '../components/Header';

type ConversationsListNavigationProp = StackNavigationProp<RootStackParamList, 'ConversationsList'>;

export default function ConversationsListScreen() {
  const navigation = useNavigation<ConversationsListNavigationProp>();

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
      style={styles.conversationCard}
      onPress={() => navigation.navigate('Conversation', { id: item.id })}
    >
      <View style={styles.conversationHeader}>
        <Text style={styles.conversationTitle}>{item.title}</Text>
        <Text style={styles.lastActivity}>{item.lastActivity}</Text>
      </View>
      <Text style={styles.languages}>{item.languages}</Text>
      <Text style={styles.messageCount}>{item.messageCount} messages</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header />
      
      <View style={styles.content}>
        <Text style={styles.title}>My Conversations</Text>
        
        {conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No conversations yet. Start a new conversation to get started!
            </Text>
            <TouchableOpacity 
              style={styles.startButton}
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
  startButton: {
    backgroundColor: '#3366FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
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
  lastActivity: {
    fontSize: 12,
    color: '#666',
  },
  languages: {
    fontSize: 14,
    color: '#3366FF',
    marginBottom: 4,
  },
  messageCount: {
    fontSize: 12,
    color: '#666',
  },
});