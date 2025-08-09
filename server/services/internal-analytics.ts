import { db } from "@db";
import { 
  conversationMetrics, 
  sessionMetrics, 
  languagePairPerformance,
  userRetentionMetrics,
  dailySystemMetrics 
} from "@shared/internal-analytics-schema";
import { conversations, users, messages } from "@shared/schema";
import { eq, and, gte, lte, desc, count, avg, sql } from "drizzle-orm";

// Rate limiting for error logs (log once per minute max)
let lastErrorLogTime = 0;
const ERROR_LOG_INTERVAL = 60000; // 1 minute

export class InternalAnalyticsService {
  
  // Track when a conversation starts
  static async startConversationTracking(conversationId: string, userId?: number) {
    // Check if metrics are enabled
    if (process.env.METRICS_ENABLED !== 'true') {
      console.log('[Metrics] disabled');
      return;
    }

    try {
      await db.insert(conversationMetrics).values({
        conversationId,
        userId,
        totalMessages: 0,
        userMessages: 0,
        translatedMessages: 0,
        lastActivityAt: new Date()
      });
    } catch (error) {
      // Rate-limited error logging (once per minute max)
      const now = Date.now();
      if (now - lastErrorLogTime > ERROR_LOG_INTERVAL) {
        console.error('[Metrics] Error starting conversation tracking (silenced for 1 min):', error);
        lastErrorLogTime = now;
      }
      // Don't throw - analytics failures shouldn't break user functionality
    }
  }

  // Update conversation metrics when messages are added
  static async updateConversationMetrics(conversationId: string, messageData: {
    isUser: boolean;
    translationTime?: number;
    failed?: boolean;
    retried?: boolean;
  }) {
    // Check if metrics are enabled
    if (process.env.METRICS_ENABLED !== 'true') {
      console.log('[Metrics] disabled');
      return;
    }

    try {
      const existing = await db.query.conversationMetrics.findFirst({
        where: eq(conversationMetrics.conversationId, conversationId)
      });

      if (!existing) {
        // Create if doesn't exist
        await this.startConversationTracking(conversationId);
        return;
      }

      const updates: any = {
        totalMessages: (existing.totalMessages || 0) + 1,
        lastActivityAt: new Date(),
        updatedAt: new Date()
      };

      if (messageData.isUser) {
        updates.userMessages = (existing.userMessages || 0) + 1;
      } else {
        updates.translatedMessages = (existing.translatedMessages || 0) + 1;
        
        // Track if we're seeing back-and-forth conversation
        if ((existing.userMessages || 0) > 0 && (existing.translatedMessages || 0) > 0) {
          updates.hadBackAndForth = true;
        }
      }

      if (messageData.translationTime) {
        // Update rolling average translation time
        const currentAvg = existing.averageTranslationTime ? parseFloat(existing.averageTranslationTime) : 0;
        const newAvg = currentAvg === 0 ? messageData.translationTime : 
          (currentAvg + messageData.translationTime) / 2;
        updates.averageTranslationTime = newAvg.toString();
      }

      if (messageData.failed) {
        updates.failedTranslations = (existing.failedTranslations || 0) + 1;
      }

      if (messageData.retried) {
        updates.retriedTranslations = (existing.retriedTranslations || 0) + 1;
      }

      await db.update(conversationMetrics)
        .set(updates)
        .where(eq(conversationMetrics.conversationId, conversationId));

    } catch (error) {
      // Rate-limited error logging (once per minute max)
      const now = Date.now();
      if (now - lastErrorLogTime > ERROR_LOG_INTERVAL) {
        console.error('[Metrics] Error updating conversation metrics (silenced for 1 min):', error);
        lastErrorLogTime = now;
      }
      // Never throw - analytics failures shouldn't break user functionality
    }
  }

  // Mark conversation as completed
  static async markConversationCompleted(conversationId: string) {
    try {
      const existing = await db.query.conversationMetrics.findFirst({
        where: eq(conversationMetrics.conversationId, conversationId)
      });

      if (existing) {
        // Calculate duration
        const duration = existing.lastActivityAt ? 
          (new Date().getTime() - new Date(existing.lastActivityAt).getTime()) / (1000 * 60) : 0;

        await db.update(conversationMetrics)
          .set({
            wasCompleted: true,
            durationMinutes: duration.toString(),
            reachedConversationGoal: existing.hadBackAndForth && (existing.totalMessages || 0) >= 4,
            updatedAt: new Date()
          })
          .where(eq(conversationMetrics.conversationId, conversationId));
      }
    } catch (error) {
      console.error('Failed to mark conversation completed:', error);
    }
  }

  // Track user session
  static async startSession(userId: number, deviceType: string, platformType: string) {
    try {
      return await db.insert(sessionMetrics).values({
        userId,
        sessionStart: new Date(),
        deviceType,
        platformType,
        conversationsStarted: 0,
        totalTranslations: 0
      }).returning();
    } catch (error) {
      console.error('Failed to start session tracking:', error);
      return null;
    }
  }

  // End user session
  static async endSession(sessionId: string, sessionData: {
    conversationsStarted?: number;
    conversationsCompleted?: number;
    totalTranslations?: number;
    usedCamera?: boolean;
    usedVoiceInput?: boolean;
    changedLanguages?: number;
  }) {
    try {
      const session = await db.query.sessionMetrics.findFirst({
        where: eq(sessionMetrics.id, sessionId)
      });

      if (session) {
        const duration = (new Date().getTime() - new Date(session.sessionStart).getTime()) / (1000 * 60);
        
        await db.update(sessionMetrics)
          .set({
            sessionEnd: new Date(),
            durationMinutes: duration.toString(),
            ...sessionData
          })
          .where(eq(sessionMetrics.id, sessionId));
      }
    } catch (error) {
      console.error('Failed to end session tracking:', error);
    }
  }

  // Update language pair performance (call this daily via cron)
  static async updateLanguagePairPerformance(date: Date) {
    try {
      // Get all language pairs used today
      const today = new Date(date);
      const tomorrow = new Date(date);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dailyMessages = await db.query.messages.findMany({
        where: and(
          gte(messages.createdAt, today.toISOString()),
          lte(messages.createdAt, tomorrow.toISOString())
        )
      });

      // Group by language pair
      const pairStats: Record<string, any> = {};
      
      dailyMessages.forEach(msg => {
        const pairKey = `${msg.sourceLanguage}-${msg.targetLanguage}`;
        if (!pairStats[pairKey]) {
          pairStats[pairKey] = {
            sourceLanguage: msg.sourceLanguage,
            targetLanguage: msg.targetLanguage,
            totalAttempts: 0,
            successfulTranslations: 0,
            failedTranslations: 0,
            users: new Set()
          };
        }
        
        pairStats[pairKey].totalAttempts++;
        if (!msg.isUser) {
          pairStats[pairKey].successfulTranslations++;
        }
        
        // Track unique users
        const conversationData = dailyMessages.find(m => m.conversationId === msg.conversationId);
        if (conversationData) {
          pairStats[pairKey].users.add(msg.conversationId); // Use conversation as proxy for user
        }
      });

      // Insert or update language pair performance
      for (const [pairKey, stats] of Object.entries(pairStats)) {
        await db.insert(languagePairPerformance).values({
          sourceLanguage: stats.sourceLanguage,
          targetLanguage: stats.targetLanguage,
          date: today,
          totalAttempts: stats.totalAttempts,
          successfulTranslations: stats.successfulTranslations,
          failedTranslations: stats.totalAttempts - stats.successfulTranslations,
          totalUsers: stats.users.size
        }).onConflictDoNothing();
      }

    } catch (error) {
      console.error('Failed to update language pair performance:', error);
    }
  }

  // Generate daily system metrics (call this daily via cron)
  static async generateDailySystemMetrics(date: Date) {
    try {
      const today = new Date(date);
      const tomorrow = new Date(date);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get various metrics for the day
      const [
        totalUsersResult,
        activeUsersResult,
        newUsersResult,
        conversationMetricsResult,
        messageMetricsResult
      ] = await Promise.all([
        db.select({ count: count() }).from(users),
        db.select({ count: count() }).from(sessionMetrics).where(
          and(
            gte(sessionMetrics.sessionStart, today),
            lte(sessionMetrics.sessionStart, tomorrow)
          )
        ),
        db.select({ count: count() }).from(users).where(
          and(
            gte(users.createdAt, today),
            lte(users.createdAt, tomorrow)
          )
        ),
        db.select({
          total: count(),
          completed: sql<number>`count(case when ${conversationMetrics.wasCompleted} then 1 end)`
        }).from(conversationMetrics).where(
          and(
            gte(conversationMetrics.createdAt, today),
            lte(conversationMetrics.createdAt, tomorrow)
          )
        ),
        db.select({
          total: count()
        }).from(messages).where(
          and(
            gte(messages.createdAt, today.toISOString()),
            lte(messages.createdAt, tomorrow.toISOString()),
            eq(messages.isUser, false)
          )
        )
      ]);

      await db.insert(dailySystemMetrics).values({
        date: today,
        totalUsers: totalUsersResult[0]?.count || 0,
        activeUsers: activeUsersResult[0]?.count || 0,
        newUsers: newUsersResult[0]?.count || 0,
        totalConversations: conversationMetricsResult[0]?.total || 0,
        completedConversations: conversationMetricsResult[0]?.completed || 0,
        totalTranslations: messageMetricsResult[0]?.total || 0
      }).onConflictDoNothing();

    } catch (error) {
      console.error('Failed to generate daily system metrics:', error);
    }
  }

  // Admin endpoints for backend analytics
  static async getSystemOverview(days: number = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const metrics = await db.query.dailySystemMetrics.findMany({
        where: and(
          gte(dailySystemMetrics.date, startDate),
          lte(dailySystemMetrics.date, endDate)
        ),
        orderBy: desc(dailySystemMetrics.date)
      });

      return {
        dailyMetrics: metrics,
        summary: {
          totalUsers: metrics[0]?.totalUsers || 0,
          totalTranslations: metrics.reduce((sum, day) => sum + (day.totalTranslations || 0), 0),
          totalConversations: metrics.reduce((sum, day) => sum + (day.totalConversations || 0), 0),
          averageCompletionRate: metrics.length > 0 ? 
            metrics.reduce((sum, day) => {
              const rate = (day.totalConversations && day.totalConversations > 0 && day.completedConversations) ? 
                (day.completedConversations / day.totalConversations) * 100 : 0;
              return sum + rate;
            }, 0) / metrics.length : 0
        }
      };
    } catch (error) {
      console.error('Failed to get system overview:', error);
      return null;
    }
  }
}