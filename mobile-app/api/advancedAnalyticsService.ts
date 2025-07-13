import { API_BASE_URL } from '../constants/api';
import { makeProtectedRequest } from './subscriptionService';

// Common options that include credentials for all API requests
const credentialsOption = {
  credentials: 'include' as RequestCredentials
};

// Common headers for JSON requests
const jsonHeaders = {
  'Content-Type': 'application/json'
};

/**
 * Get comprehensive usage analytics for the current user
 */
export async function getUserAnalytics(timeframe: '7d' | '30d' | '90d' = '30d') {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analytics/user?timeframe=${timeframe}`, credentialsOption);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user analytics: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    throw error;
  }
}

/**
 * Get translation quality metrics for user's translations
 */
export async function getTranslationQualityMetrics() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analytics/translation-quality`, credentialsOption);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch translation quality metrics: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching translation quality metrics:', error);
    throw error;
  }
}

/**
 * Get language usage patterns and preferences
 */
export async function getLanguageUsagePatterns() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analytics/language-usage`, credentialsOption);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch language usage patterns: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching language usage patterns:', error);
    throw error;
  }
}

/**
 * Get conversation patterns and insights
 */
export async function getConversationInsights(conversationId?: string) {
  try {
    const url = conversationId 
      ? `${API_BASE_URL}/api/analytics/conversation-insights?conversationId=${conversationId}`
      : `${API_BASE_URL}/api/analytics/conversation-insights`;
      
    const response = await fetch(url, credentialsOption);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch conversation insights: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching conversation insights:', error);
    throw error;
  }
}

/**
 * Submit translation quality feedback with enhanced analytics
 */
export async function submitTranslationFeedback(
  messageId: string,
  qualityScore: number,
  feedbackType: 'accurate' | 'inaccurate' | 'contextual_error' | 'grammar_error' | 'cultural_sensitivity',
  userFeedback?: string,
  suggestedImprovement?: string
) {
  return makeProtectedRequest(
    '/api/analytics/translation-feedback',
    {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        messageId,
        qualityScore,
        feedbackType,
        userFeedback,
        suggestedImprovement
      }),
    },
    'translation'
  );
}

/**
 * Track feature usage for analytics
 */
export async function trackFeatureUsage(
  feature: 'voice_translation' | 'text_translation' | 'visual_translation' | 'conversation_creation',
  metadata?: Record<string, any>
) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analytics/feature-usage`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        feature,
        metadata,
        timestamp: new Date().toISOString()
      }),
      ...credentialsOption
    });
    
    if (!response.ok) {
      throw new Error(`Failed to track feature usage: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error tracking feature usage:', error);
    // Don't throw error for analytics tracking to avoid breaking user experience
    return null;
  }
}

/**
 * Get performance metrics for translation speed and accuracy
 */
export async function getPerformanceMetrics(timeframe: '24h' | '7d' | '30d' = '7d') {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analytics/performance?timeframe=${timeframe}`, credentialsOption);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch performance metrics: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    throw error;
  }
}

/**
 * Get user engagement metrics
 */
export async function getEngagementMetrics() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analytics/engagement`, credentialsOption);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch engagement metrics: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching engagement metrics:', error);
    throw error;
  }
}

/**
 * Export user data for analytics purposes
 */
export async function exportAnalyticsData(format: 'csv' | 'json' = 'json') {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analytics/export?format=${format}`, credentialsOption);
    
    if (!response.ok) {
      throw new Error(`Failed to export analytics data: ${response.statusText}`);
    }
    
    if (format === 'csv') {
      return await response.text();
    } else {
      return await response.json();
    }
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    throw error;
  }
}