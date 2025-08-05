import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';

interface PreviewExpiryWarningProps {
  hoursRemaining: number;
  onDismiss: () => void;
}

export default function PreviewExpiryWarning({ hoursRemaining, onDismiss }: PreviewExpiryWarningProps) {
  const { isDarkMode } = useTheme();
  const navigation = useNavigation();

  const handleSubscribe = () => {
    navigation.navigate('Pricing' as never);
    onDismiss();
  };

  const handleMaybeLater = () => {
    onDismiss();
  };

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: isDarkMode ? '#2D2D2D' : '#FFF3CD',
        borderColor: isDarkMode ? '#4A4A4A' : '#FFEAA7',
      }
    ]}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name="time-outline" 
            size={24} 
            color={isDarkMode ? '#FFD93D' : '#856404'} 
          />
        </View>
        <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
          <Ionicons 
            name="close" 
            size={20} 
            color={isDarkMode ? '#CCCCCC' : '#856404'} 
          />
        </TouchableOpacity>
      </View>
      
      <Text style={[
        styles.title,
        { color: isDarkMode ? '#FFFFFF' : '#856404' }
      ]}>
        Preview Ending Soon
      </Text>
      
      <Text style={[
        styles.message,
        { color: isDarkMode ? '#CCCCCC' : '#856404' }
      ]}>
        Your preview access expires in {hoursRemaining < 24 ? `${hoursRemaining} hours` : '1 day'}. 
        Subscribe now to continue enjoying unlimited translation features.
      </Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[
            styles.subscribeButton,
            { backgroundColor: isDarkMode ? '#007AFF' : '#007AFF' }
          ]}
          onPress={handleSubscribe}
        >
          <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.laterButton}
          onPress={handleMaybeLater}
        >
          <Text style={[
            styles.laterButtonText,
            { color: isDarkMode ? '#CCCCCC' : '#856404' }
          ]}>
            Maybe Later
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  subscribeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  laterButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});