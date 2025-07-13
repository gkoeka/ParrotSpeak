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
  const [paymentIntent, setPaymentIntent] = useState<string | null>(null);

  const formatAmount = (amount: number) => {
    return (amount / 100).toFixed(2);
  };

  const createPaymentIntent = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          plan,
          amount,
          interval
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      setPaymentIntent(data.clientSecret);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      Alert.alert('Error', 'Failed to initialize payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    createPaymentIntent();
  }, []);

  const handleContinueToPayment = () => {
    // For mobile implementation, we'll redirect to web checkout
    // This ensures secure payment processing using the existing web flow
    Alert.alert(
      'Continue to Payment',
      'You will be redirected to complete your payment securely in your browser.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => {
            // This would open the web checkout in a secure browser
            // For now, we'll navigate back with a message
            Alert.alert(
              'Payment Required',
              'Please use the web version to complete your subscription payment. Your account will be updated automatically.',
              [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]
            );
          }
        }
      ]
    );
  };

  const planDetails = {
    premium_monthly: { name: 'Premium Monthly', description: 'Unlimited translations, premium features' },
    premium_yearly: { name: 'Premium Yearly', description: 'Unlimited translations, premium features, best value' },
    pro_monthly: { name: 'Pro Monthly', description: 'Advanced features for power users' },
    pro_yearly: { name: 'Pro Yearly', description: 'Advanced features for power users, best value' }
  };

  const currentPlan = planDetails[plan as keyof typeof planDetails] || { name: plan, description: 'Subscription plan' };

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
          <Text style={styles.planName}>{currentPlan.name}</Text>
          <Text style={styles.planDescription}>{currentPlan.description}</Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.price}>${formatAmount(amount)}</Text>
            <Text style={styles.interval}>/{interval}</Text>
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
              Your payment is processed securely through Stripe. We never store your payment information.
            </Text>
          </View>
        </View>

        {/* Payment Button */}
        <TouchableOpacity 
          style={[styles.paymentButton, isLoading && styles.paymentButtonDisabled]}
          onPress={handleContinueToPayment}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="credit-card" size={20} color="#fff" />
              <Text style={styles.paymentButtonText}>Continue to Payment</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Terms */}
        <Text style={styles.terms}>
          By continuing, you agree to our Terms of Service and Privacy Policy. 
          Your subscription will renew automatically unless cancelled.
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
  terms: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
});