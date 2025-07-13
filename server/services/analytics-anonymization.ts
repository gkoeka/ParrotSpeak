import crypto from 'crypto';

export interface AnonymizedUser {
  hashedId: string;
  subscriptionTier?: string;
  accountAge: number; // days since registration
  isAdmin: boolean;
}

export interface AnonymizedEvent {
  event: string;
  userId: string; // hashed
  timestamp: Date;
  properties: Record<string, any>;
  sessionId: string; // hashed
}

export interface AnalyticsConsent {
  userId: number;
  analyticsEnabled: boolean;
  consentDate: Date;
  ipHash?: string;
}

class AnalyticsAnonymizationService {
  private saltKey: string;

  constructor() {
    // Use encryption master key for consistent hashing
    this.saltKey = process.env.ENCRYPTION_MASTER_KEY || 'fallback-salt-key';
  }

  /**
   * Hash user ID for anonymous tracking
   */
  hashUserId(userId: number): string {
    return crypto
      .createHash('sha256')
      .update(`${userId}:${this.saltKey}`)
      .digest('hex')
      .substring(0, 16); // Shortened for analytics
  }

  /**
   * Hash session ID for anonymous session tracking
   */
  hashSessionId(sessionId: string): string {
    return crypto
      .createHash('sha256')
      .update(`${sessionId}:${this.saltKey}`)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Hash IP address for privacy
   */
  hashIpAddress(ipAddress: string): string {
    return crypto
      .createHash('sha256')
      .update(`${ipAddress}:${this.saltKey}`)
      .digest('hex')
      .substring(0, 12);
  }

  /**
   * Anonymize user data for analytics
   */
  anonymizeUser(user: any): AnonymizedUser {
    const accountAge = Math.floor(
      (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      hashedId: this.hashUserId(user.id),
      subscriptionTier: user.subscriptionTier || 'free',
      accountAge,
      isAdmin: user.email === process.env.ADMIN_EMAIL || false
    };
  }

  /**
   * Create anonymized event for tracking
   */
  createAnonymizedEvent(
    eventName: string,
    userId: number,
    sessionId: string,
    properties: Record<string, any> = {}
  ): AnonymizedEvent {
    // Remove any potentially sensitive data from properties
    const sanitizedProperties = this.sanitizeProperties(properties);

    return {
      event: eventName,
      userId: this.hashUserId(userId),
      timestamp: new Date(),
      properties: sanitizedProperties,
      sessionId: this.hashSessionId(sessionId)
    };
  }

  /**
   * Sanitize event properties to remove sensitive data
   */
  private sanitizeProperties(properties: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    // Whitelist of safe properties to track
    const safeProperties = [
      'language_pair',
      'source_language',
      'target_language',
      'feature_used',
      'session_duration',
      'translation_count',
      'subscription_plan',
      'device_type',
      'browser_type',
      'page_path',
      'button_clicked',
      'error_type',
      'success_rate',
      'response_time_ms'
    ];

    // Only include safe properties
    for (const [key, value] of Object.entries(properties)) {
      if (safeProperties.includes(key)) {
        // Additional sanitization for specific types
        if (typeof value === 'string') {
          // Remove any potential PII from strings
          sanitized[key] = this.sanitizeString(value);
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          sanitized[key] = value;
        }
      }
    }

    return sanitized;
  }

  /**
   * Sanitize string values to remove potential PII
   */
  private sanitizeString(value: string): string {
    // Remove email-like patterns
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    let sanitized = value.replace(emailPattern, '[EMAIL_REMOVED]');

    // Remove phone number patterns
    const phonePattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    sanitized = sanitized.replace(phonePattern, '[PHONE_REMOVED]');

    // Remove potential names (basic pattern)
    const namePattern = /\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}\b/g;
    sanitized = sanitized.replace(namePattern, '[NAME_REMOVED]');

    return sanitized;
  }

  /**
   * Language pair tracking (safe to track)
   */
  getLanguagePairIdentifier(sourceLanguage: string, targetLanguage: string): string {
    return `${sourceLanguage}_to_${targetLanguage}`;
  }

  /**
   * Validate that event is safe to send to external analytics
   */
  validateEventSafety(event: AnonymizedEvent): boolean {
    // Check that no sensitive data patterns exist
    const eventString = JSON.stringify(event);
    
    // Basic PII detection patterns
    const piiPatterns = [
      /@/, // Email indicator
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, // Credit card pattern
    ];

    for (const pattern of piiPatterns) {
      if (pattern.test(eventString)) {
        console.warn('Potentially sensitive data detected in analytics event:', eventString);
        return false;
      }
    }

    return true;
  }
}

export const analyticsAnonymization = new AnalyticsAnonymizationService();