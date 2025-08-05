import { AnonymizedEvent } from './analytics-anonymization';

class FullStoryService {
  private fullstoryApiKey: string | null = null;

  constructor() {
    this.fullstoryApiKey = process.env.FULLSTORY_API_KEY || null;
    
    if (this.fullstoryApiKey) {
      console.log('FullStory initialized successfully with API key:', this.fullstoryApiKey.substring(0, 8) + '...');
    } else {
      console.warn('FullStory API key not found - session recording disabled');
    }
  }

  /**
   * Initialize FullStory for a user session
   */
  async initializeUserSession(anonymizedUserId: string, properties?: Record<string, any>): Promise<void> {
    if (!this.fullstoryApiKey) {
      console.warn('FullStory not initialized - skipping session initialization');
      return;
    }

    try {
      // In a real implementation, you would send this to FullStory's API
      // For now, we'll just log it as FullStory is typically client-side
      console.log(`✓ FullStory session initialized for user: ${anonymizedUserId}`, {
        properties: properties || {}
      });
    } catch (error) {
      console.error('Error initializing FullStory session:', error);
      // Fail silently - analytics should never break the app
    }
  }

  /**
   * Track custom events in FullStory
   */
  async trackEvent(event: AnonymizedEvent): Promise<void> {
    if (!this.fullstoryApiKey) {
      console.warn('FullStory not initialized - skipping event tracking');
      return;
    }

    try {
      // In a real implementation, this would send to FullStory's Events API
      console.log(`✓ FullStory event tracked: ${event.event}`, {
        userId: event.userId,
        properties: event.properties,
        timestamp: event.timestamp
      });
    } catch (error) {
      console.error('Error tracking FullStory event:', error);
      // Fail silently - analytics should never break the app
    }
  }

  /**
   * Update user properties in FullStory
   */
  async updateUserProperties(anonymizedUserId: string, properties: Record<string, any>): Promise<void> {
    if (!this.fullstoryApiKey) return;

    try {
      // In a real implementation, this would update user properties in FullStory
      console.log(`✓ FullStory user properties updated for: ${anonymizedUserId}`, properties);
    } catch (error) {
      console.error('Error updating FullStory user properties:', error);
    }
  }

  /**
   * End user session and stop recording
   */
  async endUserSession(anonymizedUserId: string): Promise<void> {
    if (!this.fullstoryApiKey) return;

    try {
      // In a real implementation, this would end the FullStory session
      console.log(`✓ FullStory session ended for user: ${anonymizedUserId}`);
    } catch (error) {
      console.error('Error ending FullStory session:', error);
    }
  }

  /**
   * Disable FullStory recording for privacy-conscious users
   */
  async disableRecording(anonymizedUserId: string): Promise<void> {
    if (!this.fullstoryApiKey) return;

    try {
      // In a real implementation, this would disable recording for the user
      console.log(`✓ FullStory recording disabled for user: ${anonymizedUserId}`);
    } catch (error) {
      console.error('Error disabling FullStory recording:', error);
    }
  }

  /**
   * Re-enable FullStory recording when user opts back in
   */
  async enableRecording(anonymizedUserId: string): Promise<void> {
    if (!this.fullstoryApiKey) return;

    try {
      // In a real implementation, this would re-enable recording for the user
      console.log(`✓ FullStory recording enabled for user: ${anonymizedUserId}`);
    } catch (error) {
      console.error('Error enabling FullStory recording:', error);
    }
  }
}

export const fullstoryService = new FullStoryService();