import { API_BASE_URL, ENDPOINTS, getHeaders } from './config';
import { getCurrentUser } from './authService';

// Define SubscriptionInfo interface locally for client-side use
export interface SubscriptionInfo {
  hasAccess: boolean;
  isExpired: boolean;
  tier: string | null;
  expiresAt: Date | null;
  daysRemaining: number | null;
}

// Define which features are protected by subscription
const PROTECTED_FEATURES = new Set(['translation', 'speech', 'visual', 'new_conversation']);

function isFeatureProtected(feature: string): boolean {
  return PROTECTED_FEATURES.has(feature);
}

// Client-side subscription access checker
function checkSubscriptionAccess(user: any): SubscriptionInfo {
  const now = new Date();
  
  if (!user || !user.subscriptionStatus || user.subscriptionStatus === 'free' || user.subscriptionStatus === 'cancelled') {
    return {
      hasAccess: false,
      isExpired: false,
      tier: 'free',
      expiresAt: null,
      daysRemaining: null
    };
  }
  
  if (user.subscriptionStatus === 'active' && !user.subscriptionExpiresAt) {
    return {
      hasAccess: true,
      isExpired: false,
      tier: user.subscriptionTier || 'premium',
      expiresAt: null,
      daysRemaining: null
    };
  }
  
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
  
  return {
    hasAccess: false,
    isExpired: true,
    tier: user.subscriptionTier || 'free',
    expiresAt: null,
    daysRemaining: 0
  };
}

export interface SubscriptionError {
  error: string;
  subscriptionInfo?: SubscriptionInfo;
  message?: string;
}

/**
 * Check if user has access to a specific feature
 */
export async function checkFeatureAccess(feature: 'translation' | 'speech' | 'visual' | 'new_conversation'): Promise<{
  hasAccess: boolean;
  subscriptionInfo: SubscriptionInfo;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    const subscriptionInfo = checkSubscriptionAccess(user);
    
    if (!isFeatureProtected(feature)) {
      return { hasAccess: true, subscriptionInfo };
    }
    
    if (!subscriptionInfo.hasAccess) {
      const error = subscriptionInfo.isExpired 
        ? 'Your subscription has expired. Please renew to continue using translation features.'
        : 'Please subscribe to access translation features.';
      
      return { hasAccess: false, subscriptionInfo, error };
    }
    
    return { hasAccess: true, subscriptionInfo };
  } catch (error) {
    console.error('Feature access check error:', error);
    return {
      hasAccess: false,
      subscriptionInfo: {
        hasAccess: false,
        isExpired: false,
        tier: null,
        expiresAt: null,
        daysRemaining: null,
      },
      error: 'Unable to verify subscription status'
    };
  }
}

/**
 * Make a protected API request that requires subscription
 */
export async function makeProtectedRequest<T>(
  url: string,
  options: RequestInit = {},
  feature: 'translation' | 'speech' | 'visual' | 'new_conversation'
): Promise<T> {
  // Check subscription access first
  const accessCheck = await checkFeatureAccess(feature);
  
  if (!accessCheck.hasAccess) {
    const error: SubscriptionError = {
      error: 'Active subscription required',
      subscriptionInfo: accessCheck.subscriptionInfo,
      message: accessCheck.error
    };
    throw error;
  }
  
  // Make the API request
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        ...getHeaders(),
        ...options.headers,
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      if (response.status === 403) {
        // Server-side subscription check failed
        const errorData = await response.json().catch(() => ({}));
        const error: SubscriptionError = {
          error: 'Active subscription required',
          subscriptionInfo: errorData.subscriptionInfo || accessCheck.subscriptionInfo,
          message: errorData.message || 'Server requires active subscription'
        };
        throw error;
      }
      
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error && typeof error === 'object' && 'error' in error) {
      // Already a SubscriptionError
      throw error;
    }
    
    console.error('Protected request error:', error);
    throw new Error(`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a new conversation with subscription check
 */
export async function createConversation(data: {
  sourceLanguage: string;
  targetLanguage: string;
  customName?: string;
}): Promise<any> {
  return makeProtectedRequest(
    ENDPOINTS.CONVERSATIONS.CREATE,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
    'new_conversation'
  );
}

/**
 * Translate text with subscription check
 */
export async function translateText(data: {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  conversationId?: string;
}): Promise<any> {
  return makeProtectedRequest(
    ENDPOINTS.TRANSLATION.TEXT,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
    'translation'
  );
}

/**
 * Transcribe speech with subscription check
 */
export async function transcribeSpeech(data: {
  audio: string;
  language?: string;
}): Promise<any> {
  return makeProtectedRequest(
    ENDPOINTS.TRANSLATION.SPEECH,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
    'speech'
  );
}

/* MVP LAUNCH: Visual translation API commented out for initial release
 * TODO: Re-enable when camera functionality is implemented
 * Last modified: August 1, 2025 - Disabled for MVP launch
 *
 * Original implementation preserved below:
 * 
 * export async function translateVisual(data: {
 *   imageBase64: string;
 *   sourceLanguage: string;
 *   targetLanguage: string;
 * }): Promise<any> {
 *   return makeProtectedRequest(
 *     ENDPOINTS.TRANSLATION.VISUAL,
 *     {
 *       method: 'POST',
 *       headers: {
 *         'Content-Type': 'application/json',
 *       },
 *       body: JSON.stringify(data),
 *     },
 *     'visual'
 *   );
 * }
 */

/**
 * Get subscription status for display
 */
export async function getSubscriptionStatus(): Promise<SubscriptionInfo> {
  try {
    const user = await getCurrentUser();
    return checkSubscriptionAccess(user);
  } catch (error) {
    console.error('Get subscription status error:', error);
    return {
      hasAccess: false,
      isExpired: false,
      tier: null,
      expiresAt: null,
      daysRemaining: null,
    };
  }
}