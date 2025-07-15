import { pgTable, text, integer, timestamp, decimal, boolean, uuid } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { conversations, users } from './schema';

// Internal success metrics - not exposed to users
export const conversationMetrics = pgTable("conversation_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: text("conversation_id").notNull().references(() => conversations.id),
  userId: integer("user_id").references(() => users.id),
  
  // Completion tracking
  wasCompleted: boolean("was_completed").default(false),
  totalMessages: integer("total_messages").default(0),
  userMessages: integer("user_messages").default(0),
  translatedMessages: integer("translated_messages").default(0),
  
  // Duration and engagement
  durationMinutes: decimal("duration_minutes", { precision: 10, scale: 2 }),
  lastActivityAt: timestamp("last_activity_at"),
  
  // Success indicators
  hadBackAndForth: boolean("had_back_and_forth").default(false), // Multiple exchanges
  reachedConversationGoal: boolean("reached_conversation_goal").default(false),
  
  // Technical performance
  averageTranslationTime: decimal("avg_translation_time_ms", { precision: 10, scale: 2 }),
  failedTranslations: integer("failed_translations").default(0),
  retriedTranslations: integer("retried_translations").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const sessionMetrics = pgTable("session_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").references(() => users.id),
  
  // Session tracking
  sessionStart: timestamp("session_start").notNull(),
  sessionEnd: timestamp("session_end"),
  durationMinutes: decimal("duration_minutes", { precision: 10, scale: 2 }),
  
  // Activity during session
  conversationsStarted: integer("conversations_started").default(0),
  conversationsCompleted: integer("conversations_completed").default(0),
  totalTranslations: integer("total_translations").default(0),
  
  // Feature usage
  usedCamera: boolean("used_camera").default(false),
  usedVoiceInput: boolean("used_voice_input").default(false),
  changedLanguages: integer("changed_languages").default(0),
  
  // Device and context
  deviceType: text("device_type"), // mobile, desktop, tablet
  platformType: text("platform_type"), // web, mobile_app
  
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const languagePairPerformance = pgTable("language_pair_performance", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Language pair
  sourceLanguage: text("source_language").notNull(),
  targetLanguage: text("target_language").notNull(),
  
  // Performance metrics (aggregated daily)
  date: timestamp("date").notNull(),
  totalAttempts: integer("total_attempts").default(0),
  successfulTranslations: integer("successful_translations").default(0),
  failedTranslations: integer("failed_translations").default(0),
  averageResponseTime: decimal("avg_response_time_ms", { precision: 10, scale: 2 }),
  
  // Usage patterns
  peakUsageHour: integer("peak_usage_hour"), // 0-23
  totalUsers: integer("total_users").default(0),
  returningUsers: integer("returning_users").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const userRetentionMetrics = pgTable("user_retention_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").notNull().references(() => users.id),
  
  // Retention tracking
  firstSessionDate: timestamp("first_session_date").notNull(),
  lastSessionDate: timestamp("last_session_date").notNull(),
  totalSessions: integer("total_sessions").default(0),
  
  // Engagement levels
  totalTranslations: integer("total_translations").default(0),
  totalConversations: integer("total_conversations").default(0),
  averageSessionDuration: decimal("avg_session_duration_minutes", { precision: 10, scale: 2 }),
  
  // Subscription correlation
  isSubscriber: boolean("is_subscriber").default(false),
  subscriptionTier: text("subscription_tier"),
  
  // Calculated metrics
  daysSinceFirstUse: integer("days_since_first_use").default(0),
  daysSinceLastUse: integer("days_since_last_use").default(0),
  isActive7Day: boolean("is_active_7_day").default(false),
  isActive30Day: boolean("is_active_30_day").default(false),
  
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Admin-only analytics aggregation tables
export const dailySystemMetrics = pgTable("daily_system_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: timestamp("date").notNull(),
  
  // System-wide performance
  totalUsers: integer("total_users").default(0),
  activeUsers: integer("active_users").default(0),
  newUsers: integer("new_users").default(0),
  
  // Translation metrics
  totalTranslations: integer("total_translations").default(0),
  averageTranslationTime: decimal("avg_translation_time_ms", { precision: 10, scale: 2 }),
  translationSuccessRate: decimal("translation_success_rate", { precision: 5, scale: 2 }), // percentage
  
  // Conversation metrics
  totalConversations: integer("total_conversations").default(0),
  completedConversations: integer("completed_conversations").default(0),
  averageConversationLength: decimal("avg_conversation_length_minutes", { precision: 10, scale: 2 }),
  
  // Revenue and subscriptions
  newSubscriptions: integer("new_subscriptions").default(0),
  activeSubscriptions: integer("active_subscriptions").default(0),
  churnedSubscriptions: integer("churned_subscriptions").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Relations
export const conversationMetricsRelations = relations(conversationMetrics, ({ one }) => ({
  conversation: one(conversations, { fields: [conversationMetrics.conversationId], references: [conversations.id] }),
  user: one(users, { fields: [conversationMetrics.userId], references: [users.id] })
}));

export const sessionMetricsRelations = relations(sessionMetrics, ({ one }) => ({
  user: one(users, { fields: [sessionMetrics.userId], references: [users.id] })
}));

export const userRetentionMetricsRelations = relations(userRetentionMetrics, ({ one }) => ({
  user: one(users, { fields: [userRetentionMetrics.userId], references: [users.id] })
}));

// Insert schemas
export const insertConversationMetricsSchema = createInsertSchema(conversationMetrics);
export const insertSessionMetricsSchema = createInsertSchema(sessionMetrics);
export const insertLanguagePairPerformanceSchema = createInsertSchema(languagePairPerformance);
export const insertUserRetentionMetricsSchema = createInsertSchema(userRetentionMetrics);
export const insertDailySystemMetricsSchema = createInsertSchema(dailySystemMetrics);

// Types
export type ConversationMetrics = typeof conversationMetrics.$inferSelect;
export type SessionMetrics = typeof sessionMetrics.$inferSelect;
export type LanguagePairPerformance = typeof languagePairPerformance.$inferSelect;
export type UserRetentionMetrics = typeof userRetentionMetrics.$inferSelect;
export type DailySystemMetrics = typeof dailySystemMetrics.$inferSelect;