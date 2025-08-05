import { API_BASE_URL, ENDPOINTS, getHeaders } from './config';
import { authenticatedFetch } from '../utils/apiHelpers';

/**
 * Submit user feedback
 * @param feedback The feedback content
 * @param category The feedback category (bug, feature, translation, other)
 * @param email Optional email for follow-up (if different from logged in user)
 * @returns Success status
 */
export async function submitFeedback(
  feedback: string,
  category: 'bug' | 'feature' | 'translation' | 'other',
  email?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}${ENDPOINTS.FEEDBACK}`, {
      method: 'POST',
      body: JSON.stringify({
        feedback,
        category,
        email
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit feedback');
    }
    
    return {
      success: true,
      message: 'Thank you for your feedback!'
    };
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to submit feedback'
    };
  }
}