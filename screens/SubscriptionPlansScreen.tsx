import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import Header from '../components/Header';

type SubscriptionNavigationProp = StackNavigationProp<RootStackParamList, 'SubscriptionPlans'>;

export default function SubscriptionPlansScreen() {
  const navigation = useNavigation<SubscriptionNavigationProp>();

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 9.99,
      interval: 'month',
      features: [
        '100 translations per month',
        'Basic voice recognition',
        'Email support',
        '5 language pairs'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 19.99,
      interval: 'month',
      features: [
        'Unlimited translations',
        'Advanced voice recognition',
        'Priority support',
        'All language pairs',
        'Conversation history',
        'Analytics dashboard'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 49.99,
      interval: 'month',
      features: [
        'Everything in Premium',
        'Team collaboration',
        'Custom integrations',
        'Dedicated support',
        'Advanced analytics',
        'Priority processing'
      ]
    }
  ];

  const handleSelectPlan = (plan: typeof plans[0]) => {
    navigation.navigate('Checkout', {
      plan: plan.id,
      amount: plan.price,
      interval: plan.interval
    });
  };

  return (
    <View style={styles.container}>
      <Header />
      
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Choose Your Plan</Text>
        <Text style={styles.subtitle}>
          Unlock the full potential of ParrotSpeak with our subscription plans
        </Text>
        
        {plans.map((plan) => (
          <View key={plan.id} style={[styles.planCard, plan.popular && styles.popularPlan]}>
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>Most Popular</Text>
              </View>
            )}
            
            <Text style={styles.planName}>{plan.name}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>${plan.price}</Text>
              <Text style={styles.interval}>/{plan.interval}</Text>
            </View>
            
            <View style={styles.features}>
              {plan.features.map((feature, index) => (
                <Text key={index} style={styles.feature}>• {feature}</Text>
              ))}
            </View>
            
            <TouchableOpacity 
              style={[styles.selectButton, plan.popular && styles.selectButtonPopular]}
              onPress={() => handleSelectPlan(plan)}
            >
              <Text style={[styles.selectButtonText, plan.popular && styles.selectButtonTextPopular]}>
                Select Plan
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
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
    textAlign: 'center',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 32,
  },
  planCard: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    position: 'relative',
  },
  popularPlan: {
    borderColor: '#3366FF',
    backgroundColor: '#f8f9ff',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#3366FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginBottom: 24,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3366FF',
  },
  interval: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  features: {
    marginBottom: 24,
  },
  feature: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  selectButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3366FF',
    paddingVertical: 12,
    borderRadius: 8,
  },
  selectButtonPopular: {
    backgroundColor: '#3366FF',
  },
  selectButtonText: {
    color: '#3366FF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectButtonTextPopular: {
    color: '#fff',
  },
});