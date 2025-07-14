/**
 * App Store Integration Service
 * Handles App Store specific functionality for ParrotSpeak
 */

import { Platform } from 'react-native';

export interface AppStoreProduct {
  identifier: string;
  price: string;
  currency: string;
  title: string;
  description: string;
  localizedPrice: string;
}

export interface AppStorePurchase {
  productIdentifier: string;
  transactionId: string;
  transactionDate: string;
  transactionReceipt: string;
  purchaseToken?: string;
}

/**
 * App Store product IDs for ParrotSpeak subscriptions
 */
export const APP_STORE_PRODUCT_IDS = {
  weekly: 'com.parrotspeak.subscription.weekly',
  monthly: 'com.parrotspeak.subscription.monthly',
  quarterly: 'com.parrotspeak.subscription.3month',
  biannual: 'com.parrotspeak.subscription.6month',
  annual: 'com.parrotspeak.subscription.annual',
} as const;

/**
 * Get platform-specific product ID
 */
export function getProductId(planType: keyof typeof APP_STORE_PRODUCT_IDS): string {
  if (Platform.OS === 'ios') {
    return APP_STORE_PRODUCT_IDS[planType];
  }
  
  // For Android, use Google Play product IDs
  const googlePlayIds = {
    weekly: 'parrotspeak_weekly',
    monthly: 'parrotspeak_monthly',
    quarterly: 'parrotspeak_3month',
    biannual: 'parrotspeak_6month',
    annual: 'parrotspeak_annual',
  };
  
  return googlePlayIds[planType];
}

/**
 * Map subscription tiers to App Store product IDs
 */
export function mapTierToProductId(tier: string): string {
  switch (tier) {
    case 'weekly':
      return getProductId('weekly');
    case 'monthly':
      return getProductId('monthly');
    case '3month':
      return getProductId('quarterly');
    case '6month':
      return getProductId('biannual');
    case 'annual':
      return getProductId('annual');
    default:
      return getProductId('monthly');
  }
}

/**
 * Get localized pricing for display
 */
export function formatPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(price);
}

/**
 * App Store Connect API configuration (for server-side validation)
 */
export const APP_STORE_CONFIG = {
  // These will be set via environment variables in production
  SHARED_SECRET: process.env.APP_STORE_SHARED_SECRET || '',
  BUNDLE_ID: 'com.parrotspeak.app',
  
  // App Store Connect API endpoints
  VALIDATION_URL_SANDBOX: 'https://sandbox.itunes.apple.com/verifyReceipt',
  VALIDATION_URL_PRODUCTION: 'https://buy.itunes.apple.com/verifyReceipt',
  
  // App Store product configuration
  SUBSCRIPTION_GROUP_ID: 'com.parrotspeak.subscriptions',
} as const;

/**
 * Helper to determine if we're in sandbox mode
 */
export function isSandboxMode(): boolean {
  return __DEV__ || process.env.NODE_ENV !== 'production';
}

/**
 * Get the appropriate App Store validation URL
 */
export function getValidationUrl(): string {
  return isSandboxMode() 
    ? APP_STORE_CONFIG.VALIDATION_URL_SANDBOX 
    : APP_STORE_CONFIG.VALIDATION_URL_PRODUCTION;
}