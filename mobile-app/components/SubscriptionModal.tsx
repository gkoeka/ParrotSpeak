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

  const handleUpgrade = (planId: string) => {
    onClose();
    // Navigate to checkout with the selected plan
    navigation.navigate('Checkout', { 
      plan: planId, 
      amount: getPlanAmount(planId), 
      interval: getPlanInterval(planId) 
    });
  };

  const getPlanAmount = (planId: string) => {
    const plans: { [key: string]: number } = {
      '1week': 4.99,
      '1month': 14.99,
      '3months': 39.99,
      '6months': 69.99,
      '1year': 99.99,
      'lifetime': 299.99
    };
    return plans[planId] || 14.99;
  };

  const getPlanInterval = (planId: string) => {
    if (planId === 'lifetime') return 'lifetime';
    if (planId === '1year') return 'year';
    if (planId.includes('month')) return 'month';
    if (planId.includes('week')) return 'week';
    return 'month';
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
            
            {/* Plan Options */}
            <View style={styles.plansContainer}>
              <Text style={styles.plansTitle}>One-Time Purchase</Text>
              
              <TouchableOpacity
                style={styles.planButton}
                onPress={() => handleUpgrade('1week')}
                activeOpacity={0.8}
              >
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>1 Week</Text>
                  <Text style={styles.planDuration}>7 days access</Text>
                </View>
                <Text style={styles.planPrice}>$4.99</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.planButton}
                onPress={() => handleUpgrade('1month')}
                activeOpacity={0.8}
              >
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>1 Month</Text>
                  <Text style={styles.planDuration}>30 days access</Text>
                </View>
                <Text style={styles.planPrice}>$14.99</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.planButton}
                onPress={() => handleUpgrade('3months')}
                activeOpacity={0.8}
              >
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>3 Months</Text>
                  <Text style={styles.planDuration}>90 days access</Text>
                </View>
                <Text style={styles.planPrice}>$39.99</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.planButton}
                onPress={() => handleUpgrade('6months')}
                activeOpacity={0.8}
              >
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>6 Months</Text>
                  <Text style={styles.planDuration}>180 days access</Text>
                </View>
                <Text style={styles.planPrice}>$69.99</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.planButton}
                onPress={() => handleUpgrade('1year')}
                activeOpacity={0.8}
              >
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>1 Year</Text>
                  <Text style={styles.planDuration}>365 days access</Text>
                </View>
                <Text style={styles.planPrice}>$99.99</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.planButton, styles.lifetimeButton]}
                onPress={() => handleUpgrade('lifetime')}
                activeOpacity={0.8}
              >
                <View style={styles.planInfo}>
                  <Text style={[styles.planName, styles.lifetimeText]}>Lifetime</Text>
                  <Text style={[styles.planDuration, styles.lifetimeText]}>One-time purchase</Text>
                </View>
                <Text style={[styles.planPrice, styles.lifetimeText]}>$299.99</Text>
              </TouchableOpacity>
            </View>
            
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeButtonText}>Maybe later</Text>
            </TouchableOpacity>
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
  plansContainer: {
    width: '100%',
    marginBottom: 16,
  },
  plansTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  planButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lifetimeButton: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  planDuration: {
    fontSize: 12,
    color: '#6b7280',
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  lifetimeText: {
    color: '#92400e',
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
});