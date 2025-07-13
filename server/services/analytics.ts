import { analyticsAnonymization, AnonymizedEvent } from './analytics-anonymization';
import { analyticsConsent } from './analytics-consent';
import { mixpanelService } from './mixpanel-service';

export interface AnalyticsEvent {
  eventName: string;
  userId: number;
  sessionId: string;
  properties?: Record<string, any>;
}

class AnalyticsService {
  /**
   * Track an event for analytics (only if user has consented)
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // Check if user has consented to analytics
      const hasConsent = await analyticsConsent.hasUserConsent(event.userId);
      
      if (!hasConsent) {
        // User has opted out - don't track anything
        return;
      }

      // Create anonymized event
      const anonymizedEvent = analyticsAnonymization.createAnonymizedEvent(
        event.eventName,
        event.userId,
        event.sessionId,
        event.properties
      );

      // Validate event safety before sending
      if (!analyticsAnonymization.validateEventSafety(anonymizedEvent)) {
        console.warn('Event failed safety validation, not tracking');
        return;
      }

      // Send to Mixpanel
      await mixpanelService.trackEvent(anonymizedEvent);

      // Log for debugging
      console.log('Analytics event tracked:', {
        event: anonymizedEvent.event,
        userId: anonymizedEvent.userId,
        timestamp: anonymizedEvent.timestamp,
        properties: anonymizedEvent.properties
      });

    } catch (error) {
      console.error('Error tracking analytics event:', error);
      // Fail silently - analytics should never break the app
    }
  }

  /**
   * Track translation event
   */
  async trackTranslation(
    userId: number,
    sessionId: string,
    sourceLanguage: string,
    targetLanguage: string,
    responseTime: number,
    success: boolean
  ): Promise<void> {
    await this.trackEvent({
      eventName: 'translation_completed',
      userId,
      sessionId,
      properties: {
        language_pair: analyticsAnonymization.getLanguagePairIdentifier(sourceLanguage, targetLanguage),
        source_language: sourceLanguage,
        target_language: targetLanguage,
        response_time_ms: responseTime,
        success_rate: success ? 1 : 0
      }
    });
  }

  /**
   * Track feature usage
   */
  async trackFeatureUsage(
    userId: number,
    sessionId: string,
    featureName: string,
    additionalProps?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent({
      eventName: 'feature_used',
      userId,
      sessionId,
      properties: {
        feature_used: featureName,
        ...additionalProps
      }
    });
  }

  /**
   * Track user session
   */
  async trackSession(
    userId: number,
    sessionId: string,
    duration: number,
    pageViews: number
  ): Promise<void> {
    await this.trackEvent({
      eventName: 'session_completed',
      userId,
      sessionId,
      properties: {
        session_duration: duration,
        page_views: pageViews
      }
    });
  }

  /**
   * Track subscription events
   */
  async trackSubscription(
    userId: number,
    sessionId: string,
    action: 'started' | 'completed' | 'cancelled',
    plan?: string
  ): Promise<void> {
    await this.trackEvent({
      eventName: `subscription_${action}`,
      userId,
      sessionId,
      properties: {
        subscription_plan: plan
      }
    });
  }

  /**
   * Track error events
   */
  async trackError(
    userId: number,
    sessionId: string,
    errorType: string,
    errorCode?: string
  ): Promise<void> {
    await this.trackEvent({
      eventName: 'error_occurred',
      userId,
      sessionId,
      properties: {
        error_type: errorType,
        error_code: errorCode
      }
    });
  }

  /**
   * Track billing events
   */
  async trackBilling(
    userId: number,
    sessionId: string,
    action: 'payment_initiated' | 'payment_completed' | 'payment_failed' | 'subscription_cancelled',
    planType?: string,
    amount?: number
  ): Promise<void> {
    await this.trackEvent({
      eventName: 'billing_event',
      userId,
      sessionId,
      properties: {
        action,
        plan_type: planType,
        amount
      }
    });
  }

  /**
   * Track sign up events
   */
  async trackSignUp(
    userId: number,
    sessionId: string,
    method: 'email' | 'google' | 'apple',
    success: boolean
  ): Promise<void> {
    await this.trackEvent({
      eventName: 'sign_up_event',
      userId,
      sessionId,
      properties: {
        method,
        success
      }
    });
  }

  /**
   * Track settings changes
   */
  async trackSettings(
    userId: number,
    sessionId: string,
    settingType: 'voice_profile' | 'language_preference' | 'accessibility' | 'privacy',
    action: 'changed' | 'viewed',
    details?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent({
      eventName: 'settings_event',
      userId,
      sessionId,
      properties: {
        setting_type: settingType,
        action,
        ...details
      }
    });
  }

  /**
   * Track language pairing events
   */
  async trackLanguagePairing(
    userId: number,
    sessionId: string,
    sourceLanguage: string,
    targetLanguage: string,
    action: 'selected' | 'switched'
  ): Promise<void> {
    await this.trackEvent({
      eventName: 'language_pairing_event',
      userId,
      sessionId,
      properties: {
        source_language: sourceLanguage,
        target_language: targetLanguage,
        language_pair: `${sourceLanguage}_to_${targetLanguage}`,
        action
      }
    });
  }

  /**
   * Track conversation creation
   */
  async trackConversationCreation(
    userId: number,
    sessionId: string,
    sourceLanguage: string,
    targetLanguage: string,
    method: 'new_button' | 'language_change'
  ): Promise<void> {
    await this.trackEvent({
      eventName: 'create_conversation_event',
      userId,
      sessionId,
      properties: {
        source_language: sourceLanguage,
        target_language: targetLanguage,
        language_pair: `${sourceLanguage}_to_${targetLanguage}`,
        creation_method: method
      }
    });
  }

  /**
   * Get analytics consent statistics (admin only)
   */
  async getConsentStatistics(): Promise<any> {
    return await analyticsConsent.getBulkConsentStatus();
  }
}

export const analytics = new AnalyticsService();