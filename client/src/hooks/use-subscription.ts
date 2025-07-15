import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

export interface SubscriptionInfo {
  hasAccess: boolean;
  isExpired: boolean;
  tier: string | null;
  expiresAt: Date | null;
  daysRemaining: number | null;
}

export function checkSubscriptionAccess(user: any): SubscriptionInfo {
  if (!user) {
    return {
      hasAccess: false,
      isExpired: false,
      tier: null,
      expiresAt: null,
      daysRemaining: null,
    };
  }

  // Check if user has active subscription
  const subscriptionStatus = user.subscriptionStatus;
  const subscriptionExpiresAt = user.subscriptionExpiresAt;

  if (subscriptionStatus !== 'active' && subscriptionStatus !== 'trialing') {
    return {
      hasAccess: false,
      isExpired: subscriptionStatus === 'expired',
      tier: user.subscriptionTier || null,
      expiresAt: subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null,
      daysRemaining: null,
    };
  }

  // Check if subscription is expired
  if (subscriptionExpiresAt) {
    const expiresAt = new Date(subscriptionExpiresAt);
    const now = new Date();
    const isExpired = expiresAt < now;

    if (isExpired) {
      return {
        hasAccess: false,
        isExpired: true,
        tier: user.subscriptionTier || null,
        expiresAt,
        daysRemaining: 0,
      };
    }

    // Calculate days remaining
    const timeDiff = expiresAt.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return {
      hasAccess: true,
      isExpired: false,
      tier: user.subscriptionTier || null,
      expiresAt,
      daysRemaining,
    };
  }

  // Default to access if no expiry date
  return {
    hasAccess: true,
    isExpired: false,
    tier: user.subscriptionTier || null,
    expiresAt: null,
    daysRemaining: null,
  };
}

export function useSubscription() {
  const { user } = useAuth();
  
  const subscriptionInfo = checkSubscriptionAccess(user);
  
  return {
    ...subscriptionInfo,
    isLoading: false,
    error: null,
  };
}

export function isFeatureProtected(feature: 'translation' | 'speech' | 'visual' | 'new_conversation'): boolean {
  const protectedFeatures = ['translation', 'speech', 'visual', 'new_conversation'];
  return protectedFeatures.includes(feature);
}

export function useFeatureAccess(feature: 'translation' | 'speech' | 'visual' | 'new_conversation') {
  const { user } = useAuth();
  const subscription = checkSubscriptionAccess(user);
  
  if (!isFeatureProtected(feature)) {
    return { ...subscription, hasAccess: true };
  }
  
  return subscription;
}