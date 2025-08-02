import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  Animated,
  Platform,
  Switch
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
  interval: 'month' | 'year' | 'week' | 'one-time';
  features: string[];
  popular?: boolean;
  savings?: string;
  description: string;
  duration?: string;
  type: 'subscription' | 'traveler';
}

export default function PricingScreen() {
  const navigation = useNavigation<PricingNavigationProp>();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('yearly');
  const [selectedTab, setSelectedTab] = useState<'subscription' | 'traveler'>('subscription');
  const slideAnim = useRef(new Animated.Value(0)).current;
  const priceOpacity = useRef(new Animated.Value(1)).current;

  const monthlyPrice = 9.99;
  const yearlyPrice = 99;
  const yearlyMonthlyEquivalent = monthlyPrice * 12; // $119.88
  const yearlySavings = yearlyMonthlyEquivalent - yearlyPrice; // $20.88
  const yearlySavingsPercentage = Math.round((yearlySavings / yearlyMonthlyEquivalent) * 100); // 17%

  const subscriptionPlan: Plan = {
    id: 'premium',
    name: 'Premium Access',
    price: selectedBilling === 'monthly' ? monthlyPrice : yearlyPrice,
    originalPrice: selectedBilling === 'monthly' ? undefined : yearlyMonthlyEquivalent,
    interval: selectedBilling === 'monthly' ? 'month' : 'year',
    description: selectedBilling === 'monthly' 
      ? '12 month minimum commitment' 
      : `Best value - save $${yearlySavings.toFixed(2)} (${yearlySavingsPercentage}% off)`,
    popular: true,
    savings: selectedBilling === 'yearly' ? `Save $${yearlySavings.toFixed(2)}` : undefined,
    type: 'subscription',
    features: [
      'Unlimited voice-to-voice translations',
      'All 65 supported languages',
      'Real-time conversation mode',
      'Conversation history'
    ]
  };

  const travelerPackages: Plan[] = [
    {
      id: 'week',
      name: '1 Week Pass',
      price: 4.99,
      interval: 'one-time',
      duration: '7 days',
      description: 'Perfect for short trips',
      type: 'traveler',
      features: [
        '7 days of full access',
        'All 65 supported languages'
      ]
    },
    {
      id: 'month',
      name: '1 Month Pass',
      price: 14.99,
      interval: 'one-time',
      duration: '30 days',
      description: 'Ideal for extended travel',
      popular: true,
      type: 'traveler',
      features: [
        '30 days of full access',
        'All 65 supported languages'
      ]
    },
    {
      id: 'three-months',
      name: '3 Month Pass',
      price: 39.99,
      interval: 'one-time',
      duration: '90 days',
      description: 'For digital nomads',
      savings: 'Save $4.98',
      type: 'traveler',
      features: [
        '90 days of full access',
        'All 65 supported languages'
      ]
    },
    {
      id: 'six-months',
      name: '6 Month Pass',
      price: 69.99,
      interval: 'one-time',
      duration: '180 days',
      description: 'Extended stays abroad',
      savings: 'Save $19.95',
      type: 'traveler',
      features: [
        '180 days of full access',
        'All 65 supported languages'
      ]
    }
  ];

  const plans = selectedTab === 'subscription' ? [subscriptionPlan] : travelerPackages;

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

        {/* Plan Type Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[
              styles.tab,
              selectedTab === 'subscription' && styles.activeTab,
              isDarkMode && styles.tabDark
            ]}
            onPress={() => setSelectedTab('subscription')}
          >
            <Ionicons 
              name="sync-circle" 
              size={20} 
              color={selectedTab === 'subscription' ? '#3366FF' : isDarkMode ? '#999' : '#666'} 
            />
            <Text style={[
              styles.tabText,
              selectedTab === 'subscription' && styles.activeTabText,
              isDarkMode && styles.tabTextDark
            ]}>Subscription</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.tab,
              selectedTab === 'traveler' && styles.activeTab,
              isDarkMode && styles.tabDark
            ]}
            onPress={() => setSelectedTab('traveler')}
          >
            <Ionicons 
              name="airplane" 
              size={20} 
              color={selectedTab === 'traveler' ? '#3366FF' : isDarkMode ? '#999' : '#666'} 
            />
            <Text style={[
              styles.tabText,
              selectedTab === 'traveler' && styles.activeTabText,
              isDarkMode && styles.tabTextDark
            ]}>Traveler Passes</Text>
          </TouchableOpacity>
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

            <Animated.View style={[styles.priceSection, { opacity: plan.type === 'subscription' ? priceOpacity : 1 }]}>
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
                {plan.type === 'subscription' 
                  ? `per ${plan.interval}` 
                  : plan.duration || 'one-time'}
              </Text>
              {plan.savings && (
                <View style={[styles.savingsTag, plan.id === 'lifetime' && styles.savingsTagLifetime]}>
                  <Text style={styles.savingsTagText}>{plan.savings}</Text>
                </View>
              )}
            </Animated.View>

            {/* Billing Toggle for Subscription Plan */}
            {plan.type === 'subscription' && (
              <View style={[styles.billingToggleContainer, isDarkMode && styles.billingToggleContainerDark]}>
                <View style={styles.billingToggleRow}>
                  <View style={styles.billingToggleLabels}>
                    <Text style={[
                      styles.billingToggleLabel, 
                      selectedBilling === 'monthly' && styles.billingToggleLabelActive,
                      isDarkMode && styles.billingToggleLabelDark
                    ]}>
                      Monthly
                    </Text>
                    <Switch
                      value={selectedBilling === 'yearly'}
                      onValueChange={(value) => {
                        // Animate price change
                        Animated.sequence([
                          Animated.timing(priceOpacity, {
                            toValue: 0,
                            duration: 150,
                            useNativeDriver: true,
                          }),
                          Animated.timing(priceOpacity, {
                            toValue: 1,
                            duration: 150,
                            useNativeDriver: true,
                          }),
                        ]).start();
                        
                        try {
                          setSelectedBilling(value ? 'yearly' : 'monthly');
                        } catch (error) {
                          // Fallback to yearly if toggle fails
                          console.error('Billing toggle error:', error);
                          setSelectedBilling('yearly');
                        }
                      }}
                      trackColor={{ 
                        false: isDarkMode ? '#4a4a4a' : '#e0e0e0', 
                        true: '#3366FF' 
                      }}
                      thumbColor={Platform.OS === 'ios' ? '#fff' : selectedBilling === 'yearly' ? '#fff' : '#f4f3f4'}
                      ios_backgroundColor={isDarkMode ? '#4a4a4a' : '#e0e0e0'}
                      style={styles.billingToggleSwitch}
                    />
                    <Text style={[
                      styles.billingToggleLabel, 
                      selectedBilling === 'yearly' && styles.billingToggleLabelActive,
                      isDarkMode && styles.billingToggleLabelDark
                    ]}>
                      Annually
                    </Text>
                  </View>
                  {selectedBilling === 'yearly' && (
                    <View style={styles.savingsIndicator}>
                      <Text style={styles.savingsIndicatorText}>Save 17%</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f1f3f5',
    borderRadius: 12,
    gap: 8,
  },
  tabDark: {
    backgroundColor: '#2a2a2a',
  },
  activeTab: {
    backgroundColor: '#e8f0ff',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  tabTextDark: {
    color: '#999',
  },
  activeTabText: {
    color: '#3366FF',
    fontWeight: '600',
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
  billingToggleContainer: {
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e8ecff',
  },
  billingToggleContainerDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#404040',
  },
  billingToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  billingToggleLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  billingToggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  billingToggleLabelDark: {
    color: '#999',
  },
  billingToggleLabelActive: {
    color: '#3366FF',
    fontWeight: '600',
  },
  billingToggleSwitch: {
    marginHorizontal: 12,
  },
  savingsIndicator: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
  },
  savingsIndicatorText: {
    color: '#fff',
    fontSize: 12,
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