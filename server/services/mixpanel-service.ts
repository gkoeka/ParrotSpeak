import Mixpanel from 'mixpanel';
import { analyticsAnonymization, AnonymizedEvent } from './analytics-anonymization';

class MixpanelService {
  private mixpanel: Mixpanel.Mixpanel | null = null;

  constructor() {
    if (process.env.MIXPANEL_PROJECT_TOKEN) {
      this.mixpanel = Mixpanel.init(process.env.MIXPANEL_PROJECT_TOKEN);
      console.log('Mixpanel initialized successfully with token:', process.env.MIXPANEL_PROJECT_TOKEN?.substring(0, 8) + '...');
    } else {
      console.warn('Mixpanel token not found - analytics tracking disabled');
    }
  }

  /**
   * Send anonymized event to Mixpanel
   */
  async trackEvent(event: AnonymizedEvent): Promise<void> {
    if (!this.mixpanel) {
      console.warn('Mixpanel not initialized - skipping event tracking');
      return;
    }

    try {
      // Validate event safety before sending
      if (!analyticsAnonymization.validateEventSafety(event)) {
        console.warn('Event failed safety validation - not sending to Mixpanel');
        return;
      }

      // Track event with anonymized user ID
      this.mixpanel.track(event.event, {
        distinct_id: event.userId, // Already anonymized/hashed
        ...event.properties,
        timestamp: event.timestamp,
        session_id: event.sessionId, // Already anonymized/hashed
        source: 'parrotspeak_app'
      });

      console.log(`✓ Mixpanel event sent: ${event.event}`, {
        distinct_id: event.userId,
        properties: event.properties
      });
    } catch (error) {
      console.error('Error sending event to Mixpanel:', error);
      // Fail silently - analytics should never break the app
    }
  }

  /**
   * Set user profile properties (anonymized)
   */
  async setUserProfile(anonymizedUser: any): Promise<void> {
    if (!this.mixpanel) return;

    try {
      this.mixpanel.people.set(anonymizedUser.hashedId, {
        subscription_tier: anonymizedUser.subscriptionTier,
        account_age_days: anonymizedUser.accountAge,
        is_admin: anonymizedUser.isAdmin,
        last_seen: new Date().toISOString()
      });

      console.log('Mixpanel user profile updated');
    } catch (error) {
      console.error('Error updating Mixpanel user profile:', error);
    }
  }

  /**
   * Track user session
   */
  async trackSession(anonymizedUserId: string, sessionData: {
    duration: number;
    pageViews: number;
    translationCount?: number;
    languagePairs?: string[];
  }): Promise<void> {
    if (!this.mixpanel) return;

    try {
      this.mixpanel.track('session_completed', {
        distinct_id: anonymizedUserId,
        session_duration: sessionData.duration,
        page_views: sessionData.pageViews,
        translation_count: sessionData.translationCount || 0,
        unique_language_pairs: sessionData.languagePairs?.length || 0,
        timestamp: new Date()
      });

      console.log('Mixpanel session tracked');
    } catch (error) {
      console.error('Error tracking session in Mixpanel:', error);
    }
  }

  /**
   * Track conversion events (subscription, upgrades)
   */
  async trackConversion(anonymizedUserId: string, conversionType: string, value?: number): Promise<void> {
    if (!this.mixpanel) return;

    try {
      this.mixpanel.track('conversion', {
        distinct_id: anonymizedUserId,
        conversion_type: conversionType,
        value: value,
        timestamp: new Date()
      });

      // Also update user profile for conversions
      this.mixpanel.people.track_charge(anonymizedUserId, value || 0);

      console.log(`Mixpanel conversion tracked: ${conversionType}`);
    } catch (error) {
      console.error('Error tracking conversion in Mixpanel:', error);
    }
  }

  /**
   * Create funnel for user journey analysis
   */
  async trackFunnelStep(anonymizedUserId: string, funnelName: string, stepName: string): Promise<void> {
    if (!this.mixpanel) return;

    try {
      this.mixpanel.track(`${funnelName}_${stepName}`, {
        distinct_id: anonymizedUserId,
        funnel: funnelName,
        step: stepName,
        timestamp: new Date()
      });

      console.log(`Mixpanel funnel step tracked: ${funnelName} - ${stepName}`);
    } catch (error) {
      console.error('Error tracking funnel step in Mixpanel:', error);
    }
  }
}

export const mixpanelService = new MixpanelService();