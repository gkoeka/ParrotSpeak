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

    if (validationResult.valid) {
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
    // TODO: Implement Google Play Store receipt validation
    // This requires Google Play Developer API credentials
    // For now, return a mock validation for development
    
    console.log('Validating Google Play receipt...');
    
    // In production, you would:
    // 1. Use Google Play Developer API to validate the receipt
    // 2. Check if the purchase is valid and not refunded
    // 3. Get the expiration date for subscriptions
    
    // Mock validation for development
    const mockExpiresAt = new Date();
    mockExpiresAt.setMonth(mockExpiresAt.getMonth() + 1); // 1 month from now
    
    return {
      valid: true,
      expiresAt: mockExpiresAt
    };
  } catch (error) {
    console.error('Google Play validation error:', error);
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
    // TODO: Implement App Store receipt validation
    // This requires App Store Connect API or receipt validation service
    // For now, return a mock validation for development
    
    console.log('Validating App Store receipt...');
    
    // In production, you would:
    // 1. Send receipt to Apple's validation servers
    // 2. Verify the receipt signature
    // 3. Check subscription status and expiration
    
    // Mock validation for development
    const mockExpiresAt = new Date();
    mockExpiresAt.setMonth(mockExpiresAt.getMonth() + 1); // 1 month from now
    
    return {
      valid: true,
      expiresAt: mockExpiresAt
    };
  } catch (error) {
    console.error('App Store validation error:', error);
    return {
      valid: false,
      error: 'Failed to validate App Store receipt'
    };
  }
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

export default router;