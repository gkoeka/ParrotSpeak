/**
 * In-App Purchase (IAP) Routes
 * Handles Google Play Store and App Store receipt validation
 */

import { Router } from 'express';
import { requireAuth } from '../auth';
import { db } from '../../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * Validate receipt from Google Play Store or App Store
 */
router.post('/validate', requireAuth, async (req, res) => {
  try {
    const { receipt, productId, platform, purchaseToken } = req.body;
    const userId = req.user!.id;

    if (!receipt || !productId || !platform) {
      return res.status(400).json({ 
        error: 'Missing required fields: receipt, productId, platform' 
      });
    }

    console.log('Validating IAP receipt:', { productId, platform, userId });

    let validationResult;
    
    if (platform === 'android') {
      validationResult = await validateGooglePlayReceipt(receipt, productId, purchaseToken);
    } else if (platform === 'ios') {
      validationResult = await validateAppStoreReceipt(receipt, productId);
    } else {
      return res.status(400).json({ error: 'Invalid platform' });
    }

    if (validationResult.valid && validationResult.expiresAt) {
      // Update user subscription in database
      await updateUserSubscription(userId, productId, validationResult.expiresAt);
      
      res.json({
        valid: true,
        subscription: {
          productId,
          expiresAt: validationResult.expiresAt,
          platform
        }
      });
    } else {
      res.status(400).json({
        valid: false,
        error: validationResult.error
      });
    }
  } catch (error) {
    console.error('Receipt validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Validate Google Play Store receipt
 */
async function validateGooglePlayReceipt(receipt: string, productId: string, purchaseToken: string): Promise<{
  valid: boolean;
  expiresAt?: Date;
  error?: string;
}> {
  try {
    console.log('Validating Google Play receipt:', { productId, purchaseToken: purchaseToken?.substring(0, 10) + '...' });
    
    // Check if we have Google Play credentials configured
    const serviceAccountKey = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY;
    const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME || 'com.parrotspeak.app';
    
    if (!serviceAccountKey) {
      console.log('Google Play credentials not configured, using development mode');
      // For development/testing before app store setup
      return createMockValidation('google');
    }

    // Real Google Play validation using Google Play Developer API
    const { google } = await import('googleapis');
    
    // Parse service account credentials
    const credentials = JSON.parse(serviceAccountKey);
    
    // Create authenticated client
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/androidpublisher']
    });
    
    const androidpublisher = google.androidpublisher({
      version: 'v3',
      auth
    });

    // Validate the purchase with Google Play
    const response = await androidpublisher.purchases.subscriptions.get({
      packageName,
      subscriptionId: productId,
      token: purchaseToken,
    });

    const purchase = response.data;
    
    if (!purchase) {
      return {
        valid: false,
        error: 'Invalid receipt from Google Play'
      };
    }

    // Check if subscription is valid
    const expiryTime = purchase.expiryTimeMillis ? parseInt(purchase.expiryTimeMillis) : 0;
    const currentTime = Date.now();
    
    const isValid = purchase.paymentState === 1 && // Payment received
                   purchase.cancelReason === undefined && // Not cancelled
                   expiryTime > currentTime; // Not expired

    return {
      valid: isValid,
      expiresAt: new Date(expiryTime),
      error: isValid ? undefined : 'Subscription expired or cancelled'
    };

  } catch (error) {
    console.error('Google Play validation error:', error);
    
    // If credentials not set up yet, fall back to development mode
    if (error instanceof Error && (error.message?.includes('credentials') || error.message?.includes('auth'))) {
      console.log('Falling back to development mode - set up Google Play credentials for production');
      return createMockValidation('google');
    }
    
    return {
      valid: false,
      error: 'Failed to validate Google Play receipt'
    };
  }
}

/**
 * Validate App Store receipt
 */
async function validateAppStoreReceipt(receipt: string, productId: string): Promise<{
  valid: boolean;
  expiresAt?: Date;
  error?: string;
}> {
  try {
    console.log('Validating App Store receipt for product:', productId);
    
    // Check if we have App Store credentials configured
    const appStorePassword = process.env.APP_STORE_SHARED_SECRET;
    
    if (!appStorePassword) {
      console.log('App Store credentials not configured, using development mode');
      // For development/testing before app store setup
      return createMockValidation('apple');
    }

    // Real App Store validation using Apple's receipt validation API
    const validationUrl = process.env.NODE_ENV === 'production' 
      ? 'https://buy.itunes.apple.com/verifyReceipt'
      : 'https://sandbox.itunes.apple.com/verifyReceipt';

    const validationPayload = {
      'receipt-data': receipt,
      'password': appStorePassword,
      'exclude-old-transactions': true
    };

    const response = await fetch(validationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validationPayload),
    });

    if (!response.ok) {
      throw new Error(`App Store validation failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Check response status
    if (data.status !== 0) {
      // Handle sandbox fallback for production receipts
      if (data.status === 21007 && process.env.NODE_ENV === 'production') {
        console.log('Retrying with sandbox URL...');
        return validateAppStoreReceiptWithUrl(receipt, productId, 'https://sandbox.itunes.apple.com/verifyReceipt');
      }
      
      return {
        valid: false,
        error: `App Store validation failed with status: ${data.status}`
      };
    }

    // Find the subscription in the receipt
    const latestReceiptInfo = data.latest_receipt_info || [];
    const subscription = latestReceiptInfo.find((item: any) => item.product_id === productId);

    if (!subscription) {
      return {
        valid: false,
        error: 'Product not found in receipt'
      };
    }

    // Check if subscription is valid
    const expiresDate = new Date(parseInt(subscription.expires_date_ms));
    const currentDate = new Date();
    
    const isValid = expiresDate > currentDate && 
                   !subscription.cancellation_date &&
                   !subscription.is_in_intro_offer_period;

    return {
      valid: isValid,
      expiresAt: expiresDate,
      error: isValid ? undefined : 'Subscription expired or cancelled'
    };

  } catch (error) {
    console.error('App Store validation error:', error);
    
    // If credentials not set up yet, fall back to development mode
    if (error instanceof Error && (error.message?.includes('password') || error.message?.includes('secret'))) {
      console.log('Falling back to development mode - set up App Store shared secret for production');
      return createMockValidation('apple');
    }
    
    return {
      valid: false,
      error: 'Failed to validate App Store receipt'
    };
  }
}

/**
 * Helper function to validate with specific Apple URL
 */
async function validateAppStoreReceiptWithUrl(receipt: string, productId: string, url: string) {
  const validationPayload = {
    'receipt-data': receipt,
    'password': process.env.APP_STORE_SHARED_SECRET,
    'exclude-old-transactions': true
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(validationPayload),
  });

  const data = await response.json();
  
  if (data.status !== 0) {
    return {
      valid: false,
      error: `App Store validation failed with status: ${data.status}`
    };
  }

  const latestReceiptInfo = data.latest_receipt_info || [];
  const subscription = latestReceiptInfo.find((item: any) => item.product_id === productId);

  if (!subscription) {
    return {
      valid: false,
      error: 'Product not found in receipt'
    };
  }

  const expiresDate = new Date(parseInt(subscription.expires_date_ms));
  const isValid = expiresDate > new Date() && !subscription.cancellation_date;

  return {
    valid: isValid,
    expiresAt: expiresDate,
    error: isValid ? undefined : 'Subscription expired or cancelled'
  };
}

/**
 * Update user subscription in database
 */
async function updateUserSubscription(userId: number, productId: string, expiresAt: Date): Promise<void> {
  try {
    // Map product ID to subscription tier
    const subscriptionTier = getSubscriptionTier(productId);
    
    await db.update(users)
      .set({
        subscriptionStatus: 'active',
        subscriptionTier,
        subscriptionExpiresAt: expiresAt,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
      
    console.log(`Updated user ${userId} subscription: ${subscriptionTier} until ${expiresAt}`);
  } catch (error) {
    console.error('Failed to update user subscription:', error);
    throw error;
  }
}

/**
 * Map product ID to subscription tier
 */
function getSubscriptionTier(productId: string): string {
  if (productId.includes('weekly')) return 'weekly';
  if (productId.includes('monthly')) return 'monthly';
  if (productId.includes('3month')) return '3month';
  if (productId.includes('6month')) return '6month';
  if (productId.includes('annual')) return 'annual';
  return 'monthly'; // default
}

/**
 * Get user's subscription status
 */
router.get('/subscription', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        subscriptionStatus: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const now = new Date();
    const isActive = user.subscriptionStatus === 'active' && 
                    user.subscriptionExpiresAt && 
                    new Date(user.subscriptionExpiresAt) > now;
    
    res.json({
      status: isActive ? 'active' : 'inactive',
      tier: user.subscriptionTier,
      expiresAt: user.subscriptionExpiresAt
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Create mock validation for development/testing
 */
function createMockValidation(platform: 'google' | 'apple') {
  console.log(`Creating mock validation for ${platform} (development mode)`);
  
  const mockExpiresAt = new Date();
  mockExpiresAt.setMonth(mockExpiresAt.getMonth() + 1); // 1 month from now
  
  return {
    valid: true,
    expiresAt: mockExpiresAt,
    error: undefined
  };
}

export default router;