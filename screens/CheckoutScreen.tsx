import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';

type CheckoutRouteProp = RouteProp<RootStackParamList, 'Checkout'>;

export default function CheckoutScreen() {
  const route = useRoute<CheckoutRouteProp>();
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  
  const { plan, amount, interval } = route.params;

  const handlePurchase = async () => {
    setLoading(true);
    try {
      // TODO: Implement actual payment processing
      Alert.alert(
        'Success',
        'Subscription activated successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <Header />
      
      <View style={styles.content}>
        <Text style={[styles.title, isDarkMode && styles.titleDark]}>Complete Purchase</Text>
        
        <View style={styles.orderSummary}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          
          <View style={styles.planDetails}>
            <Text style={styles.planName}>{plan.charAt(0).toUpperCase() + plan.slice(1)} Plan</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Monthly subscription</Text>
              <Text style={styles.priceAmount}>${amount.toFixed(2)}</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>${amount.toFixed(2)}/{interval}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentMethod}>
            <Text style={styles.paymentText}>Mobile App Store Purchase</Text>
            <Text style={styles.paymentDescription}>
              Secure payment through {Platform.OS === 'ios' ? 'Apple App Store' : 'Google Play Store'}
            </Text>
          </View>
        </View>
        
        <View style={styles.benefits}>
          <Text style={styles.benefitsTitle}>What you get:</Text>
          <Text style={styles.benefit}>✓ Unlimited voice translations</Text>
          <Text style={styles.benefit}>✓ Advanced voice recognition</Text>
          <Text style={styles.benefit}>✓ All language pairs</Text>
          <Text style={styles.benefit}>✓ Conversation history</Text>
          <Text style={styles.benefit}>✓ Cancel anytime</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.purchaseButton, loading && styles.purchaseButtonDisabled]}
          onPress={handlePurchase}
          disabled={loading}
        >
          <Text style={styles.purchaseButtonText}>
            {loading ? 'Processing...' : `Subscribe for $${amount.toFixed(2)}/${interval}`}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.disclaimer}>
          Subscription automatically renews unless cancelled. Cancel anytime in account settings.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#1a1a1a',
  },
  titleDark: {
    color: '#fff',
  },
  orderSummary: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  planDetails: {
    gap: 12,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3366FF',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceAmount: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  separator: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3366FF',
  },
  paymentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1a1a1a',
  },
  paymentMethod: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  paymentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  paymentDescription: {
    fontSize: 12,
    color: '#666',
  },
  benefits: {
    marginBottom: 32,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1a1a1a',
  },
  benefit: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  purchaseButton: {
    backgroundColor: '#3366FF',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
});