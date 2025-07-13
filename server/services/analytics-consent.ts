import { db } from "@db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface UserAnalyticsConsent {
  userId: number;
  analyticsEnabled: boolean;
  consentDate: Date;
  lastUpdated: Date;
}

class AnalyticsConsentService {
  /**
   * Check if user has opted into analytics
   */
  async hasUserConsent(userId: number): Promise<boolean> {
    try {
      const [user] = await db
        .select({ analyticsEnabled: users.analyticsEnabled })
        .from(users)
        .where(eq(users.id, userId));

      // Default to true if user not found or hasn't set preference
      return user?.analyticsEnabled ?? true;
    } catch (error) {
      console.error('Error checking analytics consent:', error);
      return false; // Fail safely - no tracking if error
    }
  }

  /**
   * Update user's analytics consent preference
   */
  async updateUserConsent(userId: number, enabled: boolean): Promise<void> {
    try {
      await db
        .update(users)
        .set({
          analyticsEnabled: enabled,
          analyticsConsentDate: enabled ? new Date() : null,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      console.log(`Analytics consent updated for user ${userId}: ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating analytics consent:', error);
      throw new Error('Failed to update analytics preferences');
    }
  }

  /**
   * Get user's current analytics preferences
   */
  async getUserConsentStatus(userId: number): Promise<UserAnalyticsConsent | null> {
    try {
      const [user] = await db
        .select({
          analyticsEnabled: users.analyticsEnabled,
          analyticsConsentDate: users.analyticsConsentDate,
          updatedAt: users.updatedAt
        })
        .from(users)
        .where(eq(users.id, userId));

      if (!user) return null;

      return {
        userId,
        analyticsEnabled: user.analyticsEnabled ?? false,
        consentDate: user.analyticsConsentDate || user.updatedAt,
        lastUpdated: user.updatedAt
      };
    } catch (error) {
      console.error('Error getting analytics consent status:', error);
      return null;
    }
  }

  /**
   * Bulk check consent for multiple users (admin function)
   */
  async getBulkConsentStatus(): Promise<{
    totalUsers: number;
    consentedUsers: number;
    optOutUsers: number;
    noPreferenceUsers: number;
  }> {
    try {
      const allUsers = await db
        .select({ analyticsEnabled: users.analyticsEnabled })
        .from(users);

      const stats = {
        totalUsers: allUsers.length,
        consentedUsers: 0,
        optOutUsers: 0,
        noPreferenceUsers: 0
      };

      allUsers.forEach(user => {
        if (user.analyticsEnabled === true) {
          stats.consentedUsers++;
        } else if (user.analyticsEnabled === false) {
          stats.optOutUsers++;
        } else {
          stats.noPreferenceUsers++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting bulk consent status:', error);
      throw new Error('Failed to retrieve consent statistics');
    }
  }

  /**
   * Set default analytics preference for new users
   */
  async setDefaultConsentForNewUser(userId: number): Promise<void> {
    try {
      // Default to true (opt-out model) - users can disable if they prefer
      await db
        .update(users)
        .set({
          analyticsEnabled: true, // Opt-out default
          analyticsConsentDate: new Date()
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error setting default analytics consent:', error);
      // Don't throw here as this shouldn't block user registration
    }
  }
}

export const analyticsConsent = new AnalyticsConsentService();