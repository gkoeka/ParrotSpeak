import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import Header from '../components/Header';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { iapService, PRODUCT_IDS } from '../services/iapService';

type CheckoutNavigationProp = StackNavigationProp<RootStackParamList, 'Checkout'>;
type CheckoutRouteProp = {
  params: {
    plan: string;
    amount: number;
    interval: string;
  };
};

export default function CheckoutScreen() {
  const navigation = useNavigation<CheckoutNavigationProp>();
  const route = useRoute<CheckoutRouteProp>();
  const { isDarkMode } = useTheme();
  const { user, refreshUserData } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const { plan, amount, interval } = route.params;

  useEffect(() => {
    initializeIAP();
    
    return () => {
      // Cleanup IAP on unmount
      iapService.cleanup();
    };
  }, []);

  const initializeIAP = async () => {
    try {
      const initialized = await iapService.initialize();
      if (!initialized) {
        Alert.alert(
          'Store Not Available',
          'In-app purchases are not available on this device.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('IAP initialization error:', error);
      Alert.alert(
        'Initialization Error',
        'Unable to connect to the app store. Please try again later.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setIsInitializing(false);
    }
  };

  const getProductId = (): string | null => {
    switch (plan) {
      case 'premium':
        return interval === 'month' ? PRODUCT_IDS.MONTHLY : PRODUCT_IDS.YEARLY;
      case 'week':
        return PRODUCT_IDS.WEEK_PASS;
      case 'month':
        return PRODUCT_IDS.MONTH_PASS;
      case 'three-months':
        return PRODUCT_IDS.THREE_MONTH_PASS;
      case 'six-months':
        return PRODUCT_IDS.SIX_MONTH_PASS;
      default:
        return null;
    }
  };

  const getPlanName = (): string => {
    if (plan === 'premium') {
      return interval === 'month' ? 'Premium Monthly' : 'Premium Annual';
    }
    
    const planNames: Record<string, string> = {
      'week': '1 Week Pass',
      'month': '1 Month Pass',
      'three-months': '3 Month Pass',
      'six-months': '6 Month Pass'
    };
    
    return planNames[plan] || 'Unknown Plan';
  };

  const handlePurchase = async () => {
    const productId = getProductId();
    
    if (!productId) {
      Alert.alert('Error', 'Invalid plan selected');
      return;
    }

    setIsProcessing(true);

    try {
      // Initiate purchase based on type
      if (plan === 'premium') {
        await iapService.purchaseSubscription(productId);
      } else {
        await iapService.purchaseProduct(productId);
      }
      
      // Purchase validation happens in the IAP service listener
      // After successful validation, refresh user data
      await refreshUserData();
      
      // Navigate to success screen or home
      Alert.alert(
        'Success!',
        'Your purchase was successful. Enjoy ParrotSpeak!',
        [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
      );
      
    } catch (error: any) {
      console.error('Purchase error:', error);
      if (error.code !== 'E_USER_CANCELLED') {
        Alert.alert(
          'Purchase Failed',
          error.message || 'Something went wrong with your purchase. Please try again.'
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestorePurchases = async () => {
    setIsProcessing(true);
    
    try {
      const restored = await iapService.restorePurchases();
      
      if (restored) {
        await refreshUserData();
        Alert.alert(
          'Success!',
          'Your purchases have been restored.',
          [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'No previous purchases were found for your account.'
        );
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert(
        'Restore Failed',
        'Unable to restore purchases. Please try again later.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (isInitializing) {
    return (
      <View style={[styles.container, isDarkMode && styles.containerDark]}>
        <Header showBackButton={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDarkMode ? '#4169E1' : '#4169E1'} />
          <Text style={[styles.loadingText, isDarkMode && styles.loadingTextDark]}>
            Connecting to store...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <Header showBackButton={true} />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.orderSummary}>
          <Text style={[styles.title, isDarkMode && styles.titleDark]}>
            Order Summary
          </Text>
          
          <View style={[styles.summaryCard, isDarkMode && styles.summaryCardDark]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, isDarkMode && styles.summaryLabelDark]}>
                Plan
              </Text>
              <Text style={[styles.summaryValue, isDarkMode && styles.summaryValueDark]}>
                {getPlanName()}
              </Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, isDarkMode && styles.summaryLabelDark]}>
                Price
              </Text>
              <Text style={[styles.summaryPrice, isDarkMode && styles.summaryPriceDark]}>
                ${amount.toFixed(2)}
              </Text>
            </View>
            
            {plan === 'premium' && interval === 'month' && (
              <Text style={[styles.commitment, isDarkMode && styles.commitmentDark]}>
                12 month minimum commitment
              </Text>
            )}
          </View>
          
          <View style={styles.features}>
            <Text style={[styles.featuresTitle, isDarkMode && styles.featuresTitleDark]}>
              What's included:
            </Text>
            <View style={styles.featureList}>
              <View style={styles.featureRow}>
                <Ionicons 
                  name="checkmark-circle" 
                  size={20} 
                  color="#4169E1" 
                />
                <Text style={[styles.featureText, isDarkMode && styles.featureTextDark]}>
                  Unlimited voice-to-voice translations
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons 
                  name="checkmark-circle" 
                  size={20} 
                  color="#4169E1" 
                />
                <Text style={[styles.featureText, isDarkMode && styles.featureTextDark]}>
                  All 65 supported languages
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons 
                  name="checkmark-circle" 
                  size={20} 
                  color="#4169E1" 
                />
                <Text style={[styles.featureText, isDarkMode && styles.featureTextDark]}>
                  Real-time conversation mode
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons 
                  name="checkmark-circle" 
                  size={20} 
                  color="#4169E1" 
                />
                <Text style={[styles.featureText, isDarkMode && styles.featureTextDark]}>
                  Conversation history
                </Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.purchaseButton, isProcessing && styles.buttonDisabled]}
            onPress={handlePurchase}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
                <Text style={styles.purchaseButtonText}>
                  {Platform.OS === 'ios' ? 'Pay with Apple' : 'Complete Purchase'}
                </Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
            disabled={isProcessing}
          >
            <Text style={[styles.restoreButtonText, isDarkMode && styles.restoreButtonTextDark]}>
              Restore Purchases
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.disclaimer, isDarkMode && styles.disclaimerDark]}>
            {Platform.OS === 'ios' 
              ? 'Payment will be charged to your Apple ID account at confirmation of purchase.'
              : 'Payment will be charged to your Google Play account at confirmation of purchase.'
            }
            {plan === 'premium' && '\n\nSubscription automatically renews unless auto-renew is turned off at least 24-hours before the end of the current period.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  containerDark: {
    backgroundColor: '#1A1A1A',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  loadingTextDark: {
    color: '#AAAAAA',
  },
  orderSummary: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 20,
  },
  titleDark: {
    color: '#FFFFFF',
  },
  summaryCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  summaryCardDark: {
    backgroundColor: '#2A2A2A',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666666',
  },
  summaryLabelDark: {
    color: '#AAAAAA',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  summaryValueDark: {
    color: '#FFFFFF',
  },
  summaryPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4169E1',
  },
  summaryPriceDark: {
    color: '#6495ED',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  commitment: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  commitmentDark: {
    color: '#AAAAAA',
  },
  features: {
    marginBottom: 30,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 15,
  },
  featuresTitleDark: {
    color: '#FFFFFF',
  },
  featureList: {
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  featureTextDark: {
    color: '#CCCCCC',
  },
  purchaseButton: {
    backgroundColor: '#4169E1',
    borderRadius: 25,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  restoreButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  restoreButtonText: {
    color: '#4169E1',
    fontSize: 16,
  },
  restoreButtonTextDark: {
    color: '#6495ED',
  },
  disclaimer: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
  },
  disclaimerDark: {
    color: '#AAAAAA',
  },
});