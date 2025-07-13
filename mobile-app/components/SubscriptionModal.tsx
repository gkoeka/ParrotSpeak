import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  hasEverSubscribed?: boolean;
  feature?: string;
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export function SubscriptionModal({
  visible,
  onClose,
  hasEverSubscribed = false,
  feature = 'translation'
}: SubscriptionModalProps) {
  const navigation = useNavigation<NavigationProp>();

  const title = hasEverSubscribed ? "Keep the Conversation Going" : "Stay Connected";
  const description = hasEverSubscribed 
    ? "Renew to stay connected and grow your global network"
    : "Please subscribe to keep making meaningful connections worldwide";
  const buttonText = hasEverSubscribed ? "Renew" : "Subscribe";

  const handleUpgrade = () => {
    onClose();
    navigation.navigate('Profile');
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Crown Icon */}
            <View style={styles.iconContainer}>
              <Text style={styles.crownIcon}>👑</Text>
            </View>
            
            {/* Title */}
            <Text style={styles.title}>{title}</Text>
            
            {/* Description */}
            <Text style={styles.description}>{description}</Text>
            
            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleUpgrade}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>{buttonText}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Maybe later</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 25,
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#dbeafe',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  crownIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
});