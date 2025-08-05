import { API_BASE_URL } from '../api/config';
import { authenticatedFetch } from '../utils/apiHelpers';

/**
 * Submit translation quality feedback
 * @param messageId ID of the message that was translated
 * @param qualityScore Score from 0-5 rating the translation quality
 * @param feedbackType Type of feedback (accurate, inaccurate, contextual_error, etc.)
 * @param userFeedback Optional user comment about the translation
 */
export async function submitTranslationFeedback(
  messageId: string,
  qualityScore: number,
  feedbackType: string,
  userFeedback?: string
): Promise<any> {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/analytics/translation-feedback`, {
      method: 'POST',
      body: JSON.stringify({
        messageId,
        qualityScore,
        feedbackType,
        userFeedback,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error submitting feedback: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Failed to submit translation feedback:', error);
    throw error;
  }
}

/**
 * Get average translation quality metrics
 */
export async function getTranslationQualityMetrics(): Promise<{
  averageScore: number;
  totalFeedback: number;
  feedbackByType: Record<string, number>;
}> {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/analytics/translation-quality`);

    if (!response.ok) {
      throw new Error(`Error fetching translation quality: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Failed to fetch translation quality metrics:', error);
    throw error;
  }
}

/**
 * Get usage statistics for a date range
 * @param startDate Start date in YYYY-MM-DD format (optional, defaults to 30 days ago)
 * @param endDate End date in YYYY-MM-DD format (optional, defaults to today)
 */
export async function getUsageStatistics(
  startDate?: string,
  endDate?: string
): Promise<any> {
  try {
    let url = `${API_BASE_URL}/api/analytics/usage`;
    
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }

    const response = await authenticatedFetch(url);

    if (!response.ok) {
      throw new Error(`Error fetching usage statistics: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Failed to fetch usage statistics:', error);
    throw error;
  }
}

/**
 * Get most frequently used language pairs
 * @param limit Maximum number of language pairs to return (default: 5)
 */
export async function getTopLanguagePairs(limit?: number): Promise<any[]> {
  try {
    const url = `${API_BASE_URL}/api/analytics/top-languages${limit ? `?limit=${limit}` : ''}`;
    const response = await authenticatedFetch(url);

    if (!response.ok) {
      throw new Error(`Error fetching top language pairs: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Failed to fetch top language pairs:', error);
    throw error;
  }
}

/**
 * Get conversation patterns for a specific conversation
 * @param conversationId ID of the conversation
 */
export async function getConversationPatterns(conversationId: string): Promise<any[]> {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/analytics/conversation-patterns/${conversationId}`);

    if (!response.ok) {
      throw new Error(`Error fetching conversation patterns: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Failed to fetch conversation patterns:', error);
    throw error;
  }
}

/**
 * Record a conversation pattern
 * @param conversationId ID of the conversation
 * @param patternType Type of pattern (topic_shift, sentiment_change, etc.)
 * @param patternData Additional data about the pattern (optional)
 * @param startMessageId ID of message where pattern begins (optional)
 * @param endMessageId ID of message where pattern ends (optional)
 */
export async function recordConversationPattern(
  conversationId: string,
  patternType: string,
  patternData?: any,
  startMessageId?: string,
  endMessageId?: string
): Promise<any> {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/analytics/conversation-patterns`, {
      method: 'POST',
      body: JSON.stringify({
        conversationId,
        patternType,
        patternData,
        startMessageId,
        endMessageId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error recording conversation pattern: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Failed to record conversation pattern:', error);
    throw error;
  }
}