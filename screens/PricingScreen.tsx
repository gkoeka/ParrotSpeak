import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  Animated,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import Header from '../components/Header';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

type PricingNavigationProp = StackNavigationProp<RootStackParamList, 'Pricing'>;

const { width } = Dimensions.get('window');

interface Plan {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  interval: 'month' | 'year' | 'lifetime';
  features: string[];
  popular?: boolean;
  savings?: string;
  description: string;
}

export default function PricingScreen() {
  const navigation = useNavigation<PricingNavigationProp>();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('yearly');
  const slideAnim = useRef(new Animated.Value(0)).current;

  const plans: Plan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: selectedBilling === 'monthly' ? 9.99 : 95.88,
      originalPrice: selectedBilling === 'monthly' ? undefined : 119.88,
      interval: selectedBilling === 'monthly' ? 'month' : 'year',
      description: 'Perfect for casual users',
      savings: selectedBilling === 'yearly' ? 'Save 20%' : undefined,
      features: [
        '100 translations per month',
        'Text translation only',
        'Basic language pairs',
        'Email support',
        'Translation history (7 days)'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: selectedBilling === 'monthly' ? 19.99 : 191.88,
      originalPrice: selectedBilling === 'monthly' ? undefined : 239.88,
      interval: selectedBilling === 'monthly' ? 'month' : 'year',
      description: 'Best for regular users',
      popular: true,
      savings: selectedBilling === 'yearly' ? 'Save 20%' : undefined,
      features: [
        'Unlimited translations',
        'Voice-to-voice translation',
        'All 65 language pairs',
        'Priority support',
        'Conversation history (30 days)',
        'Offline mode',
        'No ads'
      ]
    },
    {
      id: 'lifetime',
      name: 'Lifetime',
      price: 299.99,
      interval: 'lifetime',
      description: 'One-time purchase',
      savings: 'Best value',
      features: [
        'Everything in Pro',
        'Lifetime updates',
        'Priority processing',
        'Extended history (1 year)',
        'Early access to features',
        'Custom voice options',
        'API access'
      ]
    }
  ];

  const handleSelectPlan = (plan: Plan) => {
    navigation.navigate('Checkout', {
      plan: plan.id,
      amount: plan.price,
      interval: plan.interval
    });
  };

  const toggleBilling = (billing: 'monthly' | 'yearly') => {
    setSelectedBilling(billing);
    Animated.timing(slideAnim, {
      toValue: billing === 'yearly' ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <Header showBackButton={true} />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={[styles.title, isDarkMode && styles.titleDark]}>
            Choose Your Plan
          </Text>
          <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
            Unlock the full power of ParrotSpeak
          </Text>
        </View>

        {/* Billing Toggle */}
        <View style={styles.billingToggleContainer}>
          <View style={[styles.billingToggle, isDarkMode && styles.billingToggleDark]}>
            <Animated.View
              style={[
                styles.billingToggleSlider,
                {
                  transform: [{
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, width * 0.42],
                    })
                  }]
                }
              ]}
            />
            <TouchableOpacity
              style={styles.billingOption}
              onPress={() => toggleBilling('monthly')}
            >
              <Text style={[
                styles.billingOptionText,
                selectedBilling === 'monthly' && styles.billingOptionTextActive,
                isDarkMode && styles.billingOptionTextDark
              ]}>
                Monthly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.billingOption}
              onPress={() => toggleBilling('yearly')}
            >
              <Text style={[
                styles.billingOptionText,
                selectedBilling === 'yearly' && styles.billingOptionTextActive,
                isDarkMode && styles.billingOptionTextDark
              ]}>
                Yearly
              </Text>
              {selectedBilling === 'yearly' && (
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsBadgeText}>-20%</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Plans */}
        {plans.map((plan, index) => (
          <Animated.View
            key={plan.id}
            style={[
              styles.planCard,
              plan.popular && styles.popularPlanCard,
              isDarkMode && styles.planCardDark,
              {
                opacity: 1,
                transform: [{
                  scale: 1
                }]
              }
            ]}
          >
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
              </View>
            )}
            
            <View style={styles.planHeader}>
              <Text style={[styles.planName, isDarkMode && styles.planNameDark]}>
                {plan.name}
              </Text>
              <Text style={[styles.planDescription, isDarkMode && styles.planDescriptionDark]}>
                {plan.description}
              </Text>
            </View>

            <View style={styles.priceSection}>
              <View style={styles.priceContainer}>
                <Text style={[styles.currency, isDarkMode && styles.currencyDark]}>$</Text>
                <Text style={[styles.price, isDarkMode && styles.priceDark]}>
                  {Math.floor(plan.price)}
                </Text>
                <Text style={[styles.cents, isDarkMode && styles.centsDark]}>
                  .{(plan.price % 1).toFixed(2).substring(2)}
                </Text>
              </View>
              {plan.originalPrice && (
                <Text style={styles.originalPrice}>
                  ${plan.originalPrice.toFixed(2)}
                </Text>
              )}
              <Text style={[styles.interval, isDarkMode && styles.intervalDark]}>
                {plan.interval === 'lifetime' ? 'one-time' : `per ${plan.interval}`}
              </Text>
              {plan.savings && (
                <View style={[styles.savingsTag, plan.id === 'lifetime' && styles.savingsTagLifetime]}>
                  <Text style={styles.savingsTagText}>{plan.savings}</Text>
                </View>
              )}
            </View>

            <View style={styles.featuresContainer}>
              {plan.features.map((feature, featureIndex) => (
                <View key={featureIndex} style={styles.featureItem}>
                  <Ionicons 
                    name="checkmark-circle" 
                    size={20} 
                    color={plan.popular ? '#3366FF' : '#4CAF50'} 
                  />
                  <Text style={[styles.featureText, isDarkMode && styles.featureTextDark]}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.selectButton,
                plan.popular && styles.selectButtonPopular,
                plan.id === 'lifetime' && styles.selectButtonLifetime
              ]}
              onPress={() => handleSelectPlan(plan)}
            >
              <Text style={[
                styles.selectButtonText,
                (plan.popular || plan.id === 'lifetime') && styles.selectButtonTextWhite
              ]}>
                Get Started
              </Text>
              <Ionicons 
                name="arrow-forward" 
                size={20} 
                color={plan.popular || plan.id === 'lifetime' ? '#fff' : '#3366FF'} 
                style={{ marginLeft: 8 }}
              />
            </TouchableOpacity>
          </Animated.View>
        ))}

        {/* Current Plan Info */}
        {user && (
          <View style={[styles.currentPlanInfo, isDarkMode && styles.currentPlanInfoDark]}>
            <Ionicons name="information-circle-outline" size={20} color="#666" />
            <Text style={[styles.currentPlanText, isDarkMode && styles.currentPlanTextDark]}>
              You're currently on the Free plan
            </Text>
          </View>
        )}

        {/* Features Comparison */}
        <TouchableOpacity 
          style={[styles.compareButton, isDarkMode && styles.compareButtonDark]}
          onPress={() => navigation.navigate('CompareFeatures')}
        >
          <Ionicons name="analytics-outline" size={24} color="#3366FF" />
          <Text style={styles.compareButtonText}>Compare all features</Text>
          <Ionicons name="chevron-forward" size={20} color="#3366FF" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  titleDark: {
    color: '#fff',
  },
  subtitle: {
    fontSize: 17,
    color: '#666',
    lineHeight: 24,
  },
  subtitleDark: {
    color: '#999',
  },
  billingToggleContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: '#e9ecef',
    borderRadius: 12,
    padding: 4,
    position: 'relative',
  },
  billingToggleDark: {
    backgroundColor: '#2a2a2a',
  },
  billingToggleSlider: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: '48%',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  billingOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  billingOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  billingOptionTextActive: {
    color: '#1a1a1a',
  },
  billingOptionTextDark: {
    color: '#999',
  },
  savingsBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  savingsBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  planCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  planCardDark: {
    backgroundColor: '#2a2a2a',
  },
  popularPlanCard: {
    borderWidth: 2,
    borderColor: '#3366FF',
    transform: [{ scale: 1.02 }],
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#3366FF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  planHeader: {
    marginBottom: 20,
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  planNameDark: {
    color: '#fff',
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
  },
  planDescriptionDark: {
    color: '#999',
  },
  priceSection: {
    marginBottom: 24,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  currency: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 8,
  },
  currencyDark: {
    color: '#fff',
  },
  price: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 48,
  },
  priceDark: {
    color: '#fff',
  },
  cents: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 8,
  },
  centsDark: {
    color: '#fff',
  },
  originalPrice: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  interval: {
    fontSize: 16,
    color: '#666',
  },
  intervalDark: {
    color: '#999',
  },
  savingsTag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  savingsTagLifetime: {
    backgroundColor: '#FFF3E0',
  },
  savingsTagText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#444',
    marginLeft: 12,
    flex: 1,
  },
  featureTextDark: {
    color: '#ccc',
  },
  selectButton: {
    backgroundColor: '#f8f9ff',
    borderWidth: 2,
    borderColor: '#3366FF',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButtonPopular: {
    backgroundColor: '#3366FF',
    borderColor: '#3366FF',
  },
  selectButtonLifetime: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
  },
  selectButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#3366FF',
  },
  selectButtonTextWhite: {
    color: '#fff',
  },
  currentPlanInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  currentPlanInfoDark: {
    backgroundColor: '#2a2a2a',
  },
  currentPlanText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  currentPlanTextDark: {
    color: '#999',
  },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  compareButtonDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#3a3a3a',
  },
  compareButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3366FF',
    marginHorizontal: 12,
    flex: 1,
  },
});