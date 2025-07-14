/**
 * In-App Purchase Service for Google Play Store and App Store
 * Handles subscription management, receipt validation, and purchase flows
 */

// TODO: Import when react-native-iap is installed
// import {
//   initConnection,
//   getSubscriptions,
//   requestSubscription,
//   getAvailablePurchases,
//   finishTransaction,
//   purchaseErrorListener,
//   purchaseUpdatedListener,
//   Product,
//   Purchase,
//   PurchaseError,
//   SubscriptionPurchase,
// } from 'react-native-iap';

import { Platform } from 'react-native';

// Subscription product IDs for each platform
export const SUBSCRIPTION_PRODUCTS = {
  android: {
    monthly: 'parrotspeak_monthly',
    annual: 'parrotspeak_annual',
    weekly: 'parrotspeak_weekly',
    threeMonth: 'parrotspeak_3month',
    sixMonth: 'parrotspeak_6month',
  },
  ios: {
    monthly: 'parrotspeak_monthly',
    annual: 'parrotspeak_annual', 
    weekly: 'parrotspeak_weekly',
    threeMonth: 'parrotspeak_3month',
    sixMonth: 'parrotspeak_6month',
  }
};

// Get platform-specific product IDs
export const getProductIds = () => {
  const products = Platform.OS === 'android' ? SUBSCRIPTION_PRODUCTS.android : SUBSCRIPTION_PRODUCTS.ios;
  return Object.values(products);
};

// Subscription plan details
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: string;
  productId: string;
  popular?: boolean;
}

export const getSubscriptionPlans = (): SubscriptionPlan[] => {
  const productIds = Platform.OS === 'android' ? SUBSCRIPTION_PRODUCTS.android : SUBSCRIPTION_PRODUCTS.ios;
  
  return [
    {
      id: 'weekly',
      name: 'Weekly',
      description: 'Perfect for short-term needs',
      price: '$4.99',
      duration: '1 week',
      productId: productIds.weekly,
    },
    {
      id: 'monthly',
      name: 'Monthly',
      description: 'Most popular choice',
      price: '$14.99',
      duration: '1 month',
      productId: productIds.monthly,
      popular: true,
    },
    {
      id: 'threeMonth',
      name: '3 Months',
      description: 'Great value package',
      price: '$39.99',
      duration: '3 months',
      productId: productIds.threeMonth,
    },
    {
      id: 'sixMonth',
      name: '6 Months',
      description: 'Best value for extended use',
      price: '$69.99',
      duration: '6 months',
      productId: productIds.sixMonth,
    },
    {
      id: 'annual',
      name: 'Annual',
      description: 'Maximum savings',
      price: '$149.99',
      duration: '1 year',
      productId: productIds.annual,
    },
  ];
};

export class IAPService {
  private static instance: IAPService;
  private isInitialized = false;
  private availableProducts: any[] = [];
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;

  public static getInstance(): IAPService {
    if (!IAPService.instance) {
      IAPService.instance = new IAPService();
    }
    return IAPService.instance;
  }

  /**
   * Initialize IAP connection and setup listeners
   */
  public async initialize(): Promise<void> {
    try {
      console.log('Initializing IAP service...');
      
      // TODO: Uncomment when react-native-iap is installed
      // await initConnection();
      
      // Set up purchase listeners
      // this.purchaseUpdateSubscription = purchaseUpdatedListener(
      //   this.handlePurchaseUpdate.bind(this)
      // );
      // 
      // this.purchaseErrorSubscription = purchaseErrorListener(
      //   this.handlePurchaseError.bind(this)
      // );

      await this.loadProducts();
      this.isInitialized = true;
      console.log('IAP service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize IAP service:', error);
      throw error;
    }
  }

  /**
   * Load available subscription products
   */
  private async loadProducts(): Promise<void> {
    try {
      const productIds = getProductIds();
      console.log('Loading products:', productIds);
      
      // TODO: Uncomment when react-native-iap is installed
      // this.availableProducts = await getSubscriptions(productIds);
      // console.log('Available products:', this.availableProducts);
    } catch (error) {
      console.error('Failed to load products:', error);
      throw error;
    }
  }

  /**
   * Get available subscription products
   */
  public getAvailableProducts(): any[] {
    return this.availableProducts;
  }

  /**
   * Purchase a subscription
   */
  public async purchaseSubscription(productId: string): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('Purchasing subscription:', productId);
      
      // TODO: Uncomment when react-native-iap is installed
      // await requestSubscription(productId);
      
      // For now, simulate purchase for testing
      console.log('Simulating purchase for:', productId);
      
    } catch (error) {
      console.error('Failed to purchase subscription:', error);
      throw error;
    }
  }

  /**
   * Handle purchase updates
   */
  private async handlePurchaseUpdate(purchase: any): Promise<void> {
    try {
      console.log('Purchase update received:', purchase);
      
      // Verify receipt with backend
      const isValid = await this.validateReceipt(purchase);
      
      if (isValid) {
        // TODO: Uncomment when react-native-iap is installed
        // await finishTransaction(purchase);
        console.log('Purchase completed successfully');
      } else {
        console.error('Receipt validation failed');
      }
    } catch (error) {
      console.error('Failed to handle purchase update:', error);
    }
  }

  /**
   * Handle purchase errors
   */
  private handlePurchaseError(error: any): void {
    console.error('Purchase error:', error);
  }

  /**
   * Validate purchase receipt with backend
   */
  private async validateReceipt(purchase: any): Promise<boolean> {
    try {
      console.log('Validating receipt with backend...');
      
      const response = await fetch('/api/iap/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receipt: purchase.transactionReceipt,
          productId: purchase.productId,
          platform: Platform.OS,
          purchaseToken: purchase.purchaseToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Receipt validation failed');
      }

      const result = await response.json();
      return result.valid;
    } catch (error) {
      console.error('Receipt validation error:', error);
      return false;
    }
  }

  /**
   * Restore purchases
   */
  public async restorePurchases(): Promise<void> {
    try {
      console.log('Restoring purchases...');
      
      // TODO: Uncomment when react-native-iap is installed
      // const purchases = await getAvailablePurchases();
      // console.log('Available purchases:', purchases);
      
      // Validate each purchase with backend
      // for (const purchase of purchases) {
      //   await this.validateReceipt(purchase);
      // }
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw error;
    }
  }

  /**
   * Cleanup IAP service
   */
  public cleanup(): void {
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
      this.purchaseUpdateSubscription = null;
    }
    
    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
      this.purchaseErrorSubscription = null;
    }
  }
}

export default IAPService;