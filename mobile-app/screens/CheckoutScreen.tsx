import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
  ScrollView
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import Icon from 'react-native-vector-icons/Feather';
import Header from '../components/Header';
import { API_BASE_URL } from '../constants/api';
import IAPService, { getSubscriptionPlans, SUBSCRIPTION_PRODUCTS } from '../services/iap';
import { Platform } from 'react-native';

type CheckoutScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Checkout'>;
type CheckoutScreenRouteProp = {
  params: {
    plan: string;
    amount: number;
    interval: string;
  };
};

export default function CheckoutScreen() {
  const navigation = useNavigation<CheckoutScreenNavigationProp>();
  const route = useRoute<CheckoutScreenRouteProp>();
  const { plan, amount, interval } = route.params;
  
  const [isLoading, setIsLoading] = useState(false);
  const [iapService] = useState(() => IAPService.getInstance());
  const [subscriptionPlans] = useState(() => getSubscriptionPlans());

  const formatAmount = (amount: number) => {
    return (amount / 100).toFixed(2);
  };

  const getCurrentPlan = () => {
    return subscriptionPlans.find(p => p.id === plan);
  };

  const initializeIAP = async () => {
    try {
      setIsLoading(true);
      await iapService.initialize();
    } catch (error) {
      console.error('Error initializing IAP:', error);
      Alert.alert('Error', 'Failed to initialize payment system. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeIAP();
  }, []);

  const handlePurchaseSubscription = async () => {
    try {
      setIsLoading(true);
      
      const currentPlan = getCurrentPlan();
      if (!currentPlan) {
        throw new Error('Invalid subscription plan');
      }

      await iapService.purchaseSubscription(currentPlan.productId);
      
      // Success handled by IAP service callback
      Alert.alert(
        'Success',
        'Subscription purchased successfully! You now have access to all premium features.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home')
          }
        ]
      );
    } catch (error) {
      console.error('Error purchasing subscription:', error);
      Alert.alert('Error', 'Failed to purchase subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setIsLoading(true);
      await iapService.restorePurchases();
      Alert.alert('Success', 'Purchases restored successfully!');
    } catch (error) {
      console.error('Error restoring purchases:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentPlanPrice = () => {
    const currentPlan = getCurrentPlan();
    return currentPlan ? currentPlan.price : `$${formatAmount(amount)}`;
  };

  const currentPlan = getCurrentPlan() || { 
    name: plan, 
    description: 'Subscription plan',
    price: `$${formatAmount(amount)}`,
    duration: interval
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <Header showNewButton={false} />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#4F46E5" />
          </TouchableOpacity>
          <Text style={styles.title}>Complete Purchase</Text>
        </View>

        {/* Plan Summary */}
        <View style={styles.planSummary}>
          <Text style={styles.planName}>{getCurrentPlan()?.name || plan}</Text>
          <Text style={styles.planDescription}>{getCurrentPlan()?.description || 'Subscription plan'}</Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{getCurrentPlanPrice()}</Text>
            <Text style={styles.interval}>/{getCurrentPlan()?.duration || interval}</Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>What's included:</Text>
          
          <View style={styles.feature}>
            <Icon name="check" size={20} color="#10b981" />
            <Text style={styles.featureText}>Unlimited voice translations</Text>
          </View>
          
          <View style={styles.feature}>
            <Icon name="check" size={20} color="#10b981" />
            <Text style={styles.featureText}>Real-time conversation streaming</Text>
          </View>
          
          <View style={styles.feature}>
            <Icon name="check" size={20} color="#10b981" />
            <Text style={styles.featureText}>Visual translation (camera & images)</Text>
          </View>
          
          <View style={styles.feature}>
            <Icon name="check" size={20} color="#10b981" />
            <Text style={styles.featureText}>50+ supported languages</Text>
          </View>
          
          <View style={styles.feature}>
            <Icon name="check" size={20} color="#10b981" />
            <Text style={styles.featureText}>Advanced analytics & insights</Text>
          </View>
          
          <View style={styles.feature}>
            <Icon name="check" size={20} color="#10b981" />
            <Text style={styles.featureText}>Priority customer support</Text>
          </View>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Icon name="shield" size={24} color="#4F46E5" />
          <View style={styles.securityText}>
            <Text style={styles.securityTitle}>Secure Payment</Text>
            <Text style={styles.securityDescription}>
              Your payment is processed securely through {Platform.OS === 'ios' ? 'Apple App Store' : 'Google Play Store'}. We never store your payment information.
            </Text>
          </View>
        </View>

        {/* IAP Purchase Button */}
        <TouchableOpacity 
          style={[styles.paymentButton, isLoading && styles.paymentButtonDisabled]}
          onPress={handlePurchaseSubscription}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="shopping-cart" size={20} color="#fff" />
              <Text style={styles.paymentButtonText}>Subscribe {getCurrentPlanPrice()}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Restore Purchases Button */}
        <TouchableOpacity 
          style={[styles.restoreButton, isLoading && styles.restoreButtonDisabled]}
          onPress={handleRestorePurchases}
          disabled={isLoading}
        >
          <Icon name="refresh-cw" size={16} color="#4F46E5" />
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>

        {/* Terms */}
        <Text style={styles.terms}>
          By continuing, you agree to our Terms of Service and Privacy Policy. 
          Your subscription will renew automatically unless cancelled through {Platform.OS === 'ios' ? 'App Store' : 'Google Play'}.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  planSummary: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  interval: {
    fontSize: 18,
    color: '#666',
    marginLeft: 4,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  securityNotice: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  securityText: {
    flex: 1,
    marginLeft: 12,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  securityDescription: {
    fontSize: 14,
    color: '#3730a3',
  },
  paymentButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  paymentButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  restoreButton: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  restoreButtonDisabled: {
    borderColor: '#9ca3af',
  },
  restoreButtonText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 6,
  },
  terms: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
});