/**
 * In-App Purchase Service
 * Handles Apple and Google IAP integration
 */

import { Platform, Alert } from 'react-native';
import * as IAP from 'react-native-iap';

// Product IDs for different subscription types
export const PRODUCT_IDS = {
  // Subscription products
  MONTHLY: Platform.select({
    ios: 'com.parrotspeak.monthly',
    android: 'com.parrotspeak.monthly',
    default: 'com.parrotspeak.monthly'
  }),
  YEARLY: Platform.select({
    ios: 'com.parrotspeak.yearly',
    android: 'com.parrotspeak.yearly',
    default: 'com.parrotspeak.yearly'
  }),
  // Traveler passes (consumable)
  WEEK_PASS: Platform.select({
    ios: 'com.parrotspeak.week_pass',
    android: 'com.parrotspeak.week_pass',
    default: 'com.parrotspeak.week_pass'
  }),
  MONTH_PASS: Platform.select({
    ios: 'com.parrotspeak.month_pass',
    android: 'com.parrotspeak.month_pass',
    default: 'com.parrotspeak.month_pass'
  }),
  THREE_MONTH_PASS: Platform.select({
    ios: 'com.parrotspeak.three_month_pass',
    android: 'com.parrotspeak.three_month_pass',
    default: 'com.parrotspeak.three_month_pass'
  }),
  SIX_MONTH_PASS: Platform.select({
    ios: 'com.parrotspeak.six_month_pass',
    android: 'com.parrotspeak.six_month_pass',
    default: 'com.parrotspeak.six_month_pass'
  })
};

export class InAppPurchaseService {
  private static instance: InAppPurchaseService;
  private purchaseUpdateSubscription: any;
  private purchaseErrorSubscription: any;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): InAppPurchaseService {
    if (!InAppPurchaseService.instance) {
      InAppPurchaseService.instance = new InAppPurchaseService();
    }
    return InAppPurchaseService.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      await IAP.initConnection();
      
      // Get all product IDs
      const productIds = Object.values(PRODUCT_IDS);
      
      // Get products
      if (Platform.OS === 'ios') {
        await IAP.getSubscriptions({ skus: [PRODUCT_IDS.MONTHLY!, PRODUCT_IDS.YEARLY!] });
        await IAP.getProducts({ skus: [
          PRODUCT_IDS.WEEK_PASS!,
          PRODUCT_IDS.MONTH_PASS!,
          PRODUCT_IDS.THREE_MONTH_PASS!,
          PRODUCT_IDS.SIX_MONTH_PASS!
        ] });
      } else {
        // Android
        await IAP.getSubscriptions({ skus: [PRODUCT_IDS.MONTHLY!, PRODUCT_IDS.YEARLY!] });
        await IAP.getProducts({ skus: [
          PRODUCT_IDS.WEEK_PASS!,
          PRODUCT_IDS.MONTH_PASS!,
          PRODUCT_IDS.THREE_MONTH_PASS!,
          PRODUCT_IDS.SIX_MONTH_PASS!
        ] });
      }

      this.setupPurchaseListeners();
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('IAP initialization error:', error);
      return false;
    }
  }

  private setupPurchaseListeners() {
    // Listen for purchase updates
    this.purchaseUpdateSubscription = IAP.purchaseUpdatedListener(async (purchase) => {
      console.log('Purchase updated:', purchase);
      
      try {
        // Acknowledge the purchase
        if (Platform.OS === 'ios') {
          await IAP.finishTransactionIOS(purchase.transactionId);
        } else {
          await IAP.acknowledgePurchaseAndroid({
            purchaseToken: purchase.purchaseToken!,
            developerPayload: purchase.developerPayloadAndroid
          });
        }

        // Validate purchase with backend
        await this.validatePurchase(purchase);
        
      } catch (error) {
        console.error('Purchase acknowledgement error:', error);
      }
    });

    // Listen for purchase errors
    this.purchaseErrorSubscription = IAP.purchaseErrorListener((error) => {
      console.error('Purchase error:', error);
      Alert.alert('Purchase Error', error.message || 'Something went wrong with your purchase');
    });
  }

  async purchaseSubscription(productId: string): Promise<void> {
    try {
      await IAP.requestSubscription({ sku: productId });
    } catch (error: any) {
      if (error.code === 'E_USER_CANCELLED') {
        // User cancelled, don't show error
        return;
      }
      throw error;
    }
  }

  async purchaseProduct(productId: string): Promise<void> {
    try {
      await IAP.requestPurchase({ sku: productId });
    } catch (error: any) {
      if (error.code === 'E_USER_CANCELLED') {
        // User cancelled, don't show error
        return;
      }
      throw error;
    }
  }

  async restorePurchases(): Promise<boolean> {
    try {
      const purchases = await IAP.getAvailablePurchases();
      
      if (purchases && purchases.length > 0) {
        // Validate restored purchases with backend
        for (const purchase of purchases) {
          await this.validatePurchase(purchase);
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Restore purchases error:', error);
      return false;
    }
  }

  private async validatePurchase(purchase: any): Promise<void> {
    try {
      const { API_BASE_URL } = await import('../config/api');
      const response = await fetch(`${API_BASE_URL}/api/validate-purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          platform: Platform.OS,
          productId: purchase.productId,
          purchaseToken: purchase.purchaseToken || purchase.transactionReceipt,
          transactionId: purchase.transactionId,
          transactionDate: purchase.transactionDate,
        }),
      });

      if (!response.ok) {
        throw new Error('Purchase validation failed');
      }

      const result = await response.json();
      console.log('Purchase validated:', result);
      
      // Refresh user data to get updated subscription status
      // This will be handled by the Auth context
      
    } catch (error) {
      console.error('Purchase validation error:', error);
      Alert.alert('Validation Error', 'Unable to validate your purchase. Please contact support.');
    }
  }

  cleanup() {
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
    }
    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
    }
    IAP.endConnection();
    this.isInitialized = false;
  }
}

export const iapService = InAppPurchaseService.getInstance();