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
      'monthly': 9.99,
      'annual': 99.00
    };
    return plans[planId] || 14.99;
  };

  const getPlanInterval = (planId: string) => {
    if (planId === 'annual') return 'year';
    if (planId === 'monthly') return 'month';
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
            
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeX}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeXText}>✕</Text>
            </TouchableOpacity>
            
            {/* Title */}
            <Text style={styles.title}>{title}</Text>
            
            {/* Description */}
            <Text style={styles.description}>{description}</Text>
            
            {/* One-Time Purchase Plans */}
            <View style={styles.plansContainer}>
              <Text style={styles.sectionTitle}>One-Time Purchase</Text>
              
              <TouchableOpacity
                style={[styles.planButton, styles.highlightedPlan]}
                onPress={() => handleUpgrade('1week')}
                activeOpacity={0.8}
              >
                <View style={styles.planInfo}>
                  <Text style={[styles.planName, styles.highlightedText]}>1 Week</Text>
                  <Text style={[styles.planDuration, styles.highlightedSubtext]}>7 days access</Text>
                </View>
                <Text style={[styles.planPrice, styles.highlightedText]}>$4.99</Text>
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
            </View>
            
            {/* Recurring Plans */}
            <View style={styles.plansContainer}>
              <Text style={styles.sectionTitle}>Recurring Plans</Text>
              
              <TouchableOpacity
                style={[styles.planButton, styles.popularPlan]}
                onPress={() => handleUpgrade('monthly')}
                activeOpacity={0.8}
              >
                <View style={styles.planInfo}>
                  <View style={styles.planHeader}>
                    <Text style={[styles.planName, styles.popularText]}>Monthly</Text>
                    <View style={styles.popularBadge}>
                      <Text style={styles.badgeText}>Popular</Text>
                    </View>
                  </View>
                  <Text style={[styles.planDuration, styles.popularSubtext]}>Renewed monthly</Text>
                </View>
                <Text style={[styles.planPrice, styles.popularText]}>$9.99</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.planButton, styles.bestValuePlan]}
                onPress={() => handleUpgrade('annual')}
                activeOpacity={0.8}
              >
                <View style={styles.planInfo}>
                  <View style={styles.planHeader}>
                    <Text style={[styles.planName, styles.bestValueText]}>Annual</Text>
                    <View style={styles.bestValueBadge}>
                      <Text style={styles.badgeText}>Best Value</Text>
                    </View>
                  </View>
                  <Text style={[styles.planDuration, styles.bestValueSubtext]}>Renewed yearly</Text>
                </View>
                <Text style={[styles.planPrice, styles.bestValueText]}>$99.00</Text>
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
    backgroundColor: '#1f2937',
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
    backgroundColor: '#3b82f6',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  crownIcon: {
    fontSize: 32,
    color: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  plansContainer: {
    width: '100%',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9ca3af',
    marginBottom: 12,
  },
  planButton: {
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#374151',
  },
  highlightedPlan: {
    borderColor: '#3b82f6',
    borderWidth: 2,
  },
  popularPlan: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  bestValuePlan: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  planInfo: {
    flex: 1,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  planName: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    marginRight: 8,
  },
  planDuration: {
    fontSize: 12,
    color: '#9ca3af',
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  highlightedText: {
    color: '#3b82f6',
  },
  highlightedSubtext: {
    color: '#93c5fd',
  },
  popularText: {
    color: 'white',
  },
  popularSubtext: {
    color: '#dbeafe',
  },
  bestValueText: {
    color: 'white',
  },
  bestValueSubtext: {
    color: '#d1fae5',
  },
  popularBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  bestValueBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'white',
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '500',
  },
  closeX: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeXText: {
    color: '#9ca3af',
    fontSize: 18,
    fontWeight: '500',
  },
});