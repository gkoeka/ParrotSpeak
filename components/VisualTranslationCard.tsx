/* 
 * MVP LAUNCH: Camera functionality disabled for initial release
 * 
 * This component provides visual translation capabilities using camera and image picker.
 * It has been commented out for the MVP launch to focus on core voice translation features.
 * 
 * TODO: Re-enable this component in future version when ready to implement camera features
 * Required dependencies: expo-camera, expo-image-picker, camera permissions
 * 
 * Last modified: August 1, 2025 - Disabled for MVP launch
 */

/*
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { checkFeatureAccess } from '../api/subscriptionService';
import { SubscriptionModal } from './SubscriptionModal';
import Icon from 'react-native-vector-icons/Feather';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface VisualTranslationCardProps {
  sourceLanguage: string;
  targetLanguage: string;
}

export default function VisualTranslationCard({ 
  sourceLanguage, 
  targetLanguage 
}: VisualTranslationCardProps) {
  const navigation = useNavigation<NavigationProp>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [hasEverSubscribed, setHasEverSubscribed] = useState(false);

  const handleCameraCapture = async () => {
    try {
      // Check subscription access first
      const accessCheck = await checkFeatureAccess('visual');
      if (!accessCheck.hasAccess) {
        setHasEverSubscribed(accessCheck.subscriptionInfo.tier !== null);
        setShowSubscriptionModal(true);
        return;
      }

      setIsProcessing(true);
      
      // In a real implementation, this would use expo-camera or react-native-image-picker
      Alert.alert(
        'Camera Feature',
        'Camera integration requires device testing. This feature will work on real devices with proper camera permissions.',
        [{ text: 'OK' }]
      );
      
    } catch (error: any) {
      console.error('Visual translation error:', error);
      
      if (error.error === 'Active subscription required') {
        setHasEverSubscribed(error.subscriptionInfo?.tier !== null || false);
        setShowSubscriptionModal(true);
      } else {
        Alert.alert('Error', 'Failed to access camera');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      // Check subscription access first
      const accessCheck = await checkFeatureAccess('visual');
      if (!accessCheck.hasAccess) {
        setHasEverSubscribed(accessCheck.subscriptionInfo.tier !== null);
        setShowSubscriptionModal(true);
        return;
      }

      setIsProcessing(true);
      
      // In a real implementation, this would use expo-image-picker
      Alert.alert(
        'Image Picker Feature',
        'Image picker integration requires device testing. This feature will work on real devices with proper gallery permissions.',
        [{ text: 'OK' }]
      );
      
    } catch (error: any) {
      console.error('Visual translation error:', error);
      
      if (error.error === 'Active subscription required') {
        setHasEverSubscribed(error.subscriptionInfo?.tier !== null || false);
        setShowSubscriptionModal(true);
      } else {
        Alert.alert('Error', 'Failed to access image gallery');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="image" size={24} color="#4F46E5" />
        <Text style={styles.title}>Visual Translation</Text>
      </View>
      
      <Text style={styles.description}>
        Take a photo or select an image to translate text from {sourceLanguage} to {targetLanguage}
      </Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.cameraButton]}
          onPress={handleCameraCapture}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="camera" size={20} color="#fff" />
              <Text style={styles.buttonText}>Take Photo</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.galleryButton]}
          onPress={handleImagePicker}
          disabled={isProcessing}
        >
          <Icon name="image" size={20} color="#4F46E5" />
          <Text style={[styles.buttonText, styles.galleryButtonText]}>Choose Image</Text>
        </TouchableOpacity>
      </View>

      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        hasEverSubscribed={hasEverSubscribed}
        feature="visual"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  cameraButton: {
    backgroundColor: '#4F46E5',
  },
  galleryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  galleryButtonText: {
    color: '#4F46E5',
  },
});
*/

// MVP LAUNCH: Placeholder component for future camera implementation
export default function VisualTranslationCard() {
  return null; // Component disabled for MVP launch
}