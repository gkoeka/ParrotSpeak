import { User } from '@shared/schema';

export interface SubscriptionInfo {
  hasAccess: boolean;
  isExpired: boolean;
  tier: string | null;
  expiresAt: Date | null;
  daysRemaining: number | null;
}

/**
 * Check if user has valid subscription access
 */
export function checkSubscriptionAccess(user: User): SubscriptionInfo {
  const now = new Date();
  
  // Check if user has valid preview access first
  if (user.previewExpiresAt && user.hasUsedPreview && new Date(user.previewExpiresAt) > now) {
    const previewExpiresAt = new Date(user.previewExpiresAt);
    const daysRemaining = Math.ceil((previewExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      hasAccess: true,
      isExpired: false,
      tier: 'preview',
      expiresAt: previewExpiresAt,
      daysRemaining
    };
  }
  
  // If user has no subscription status, they're on free tier (no access)
  if (!user.subscriptionStatus || user.subscriptionStatus === 'free' || user.subscriptionStatus === 'cancelled') {
    return {
      hasAccess: false,
      isExpired: false,
      tier: 'free',
      expiresAt: null,
      daysRemaining: null
    };
  }
  
  // If user has active subscription but no expiry date, assume active
  if (user.subscriptionStatus === 'active' && !user.subscriptionExpiresAt) {
    return {
      hasAccess: true,
      isExpired: false,
      tier: user.subscriptionTier || 'premium',
      expiresAt: null,
      daysRemaining: null
    };
  }
  
  // Check if subscription has expired
  if (user.subscriptionExpiresAt) {
    const expiresAt = new Date(user.subscriptionExpiresAt);
    const isExpired = now > expiresAt;
    const daysRemaining = isExpired ? 0 : Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      hasAccess: !isExpired && user.subscriptionStatus === 'active',
      isExpired,
      tier: user.subscriptionTier || 'premium',
      expiresAt,
      daysRemaining: isExpired ? 0 : daysRemaining
    };
  }
  
  // Default to no access if we can't determine status
  return {
    hasAccess: false,
    isExpired: true,
    tier: user.subscriptionTier || 'free',
    expiresAt: null,
    daysRemaining: 0
  };
}

/**
 * Middleware to require valid subscription for protected routes
 */
export function requireSubscription(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const subscriptionInfo = checkSubscriptionAccess(req.user);
  
  if (!subscriptionInfo.hasAccess) {
    return res.status(403).json({ 
      error: 'Active subscription required',
      subscriptionInfo,
      message: subscriptionInfo.isExpired 
        ? 'Your subscription has expired. Please renew to continue using translation features.'
        : 'Please subscribe to access translation features.'
    });
  }
  
  // Add subscription info to request for later use
  req.subscriptionInfo = subscriptionInfo;
  next();
}

/**
 * Get subscription status for user (non-blocking, for UI display)
 */
export function getSubscriptionStatus(user: User) {
  return checkSubscriptionAccess(user);
}