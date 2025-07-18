import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import ParrotSpeakLogo from './ParrotSpeakLogo';

interface HeaderProps {
  onNewConversation?: () => void;
  showNewButton?: boolean;
  showSettingsButton?: boolean;
}

export default function Header({ 
  onNewConversation, 
  showNewButton = true, 
  showSettingsButton = true 
}: HeaderProps) {
  const navigation = useNavigation();
  const { user } = useAuth();

  const handleNewConversation = () => {
    if (onNewConversation) {
      onNewConversation();
    } else {
      // Navigate to home screen which starts a new conversation
      navigation.navigate('Home');
    }
  };
  
  return (
    <View style={styles.header}>
      {/* Logo on the left side */}
      <TouchableOpacity 
        style={styles.logoButton}
        onPress={handleNewConversation}
        accessibilityLabel="New conversation"
      >
        <ParrotSpeakLogo width={35} height={35} />
      </TouchableOpacity>
      
      <Text style={styles.title}>ParrotSpeak</Text>
      
      <View style={styles.rightButtons}>
        {user && (
          <>
            <TouchableOpacity 
              style={styles.feedbackButton}
              onPress={() => navigation.navigate('Feedback')}
              accessibilityLabel="Feedback"
            >
              <Icon name="help-circle" size={18} color="#4F46E5" />
              <Text style={styles.feedbackText}>Feedback</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.navigate('Profile')}
              accessibilityLabel="Profile"
            >
              <Icon name="user" size={22} color="#4F46E5" />
            </TouchableOpacity>
          </>
        )}
        
        {!user && (
          <TouchableOpacity 
            style={styles.feedbackButton}
            onPress={() => navigation.navigate('Feedback')}
            accessibilityLabel="Feedback"
          >
            <Icon name="lightbulb" size={18} color="#4F46E5" />
            <Text style={styles.feedbackText}>Feedback</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50, // accommodate for status bar
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F46E5',
    textAlign: 'center',
    flex: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    marginHorizontal: 4,
  },
  rightButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    minWidth: 40,
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    marginHorizontal: 4,
  },
  feedbackText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '600',
    marginLeft: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 40,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  logoButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 4,
    overflow: 'hidden',
  },

});
