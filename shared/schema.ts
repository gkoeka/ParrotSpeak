import { pgTable, text, serial, boolean, timestamp, numeric, decimal, integer, json, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session table for authentication
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire").notNull(),
}, (table) => ({
  expireIdx: index("IDX_session_expire").on(table.expire),
}));

// Users table for authentication with expanded fields for modern auth
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique(),
  password: text("password"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  googleId: text("google_id").unique(),
  appleId: text("apple_id").unique(),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  emailVerified: boolean("email_verified").default(false),
  // Admin access authorization for encrypted data
  adminAccessAuthorized: boolean("admin_access_authorized").default(false),
  adminAccessRequestedAt: timestamp("admin_access_requested_at"),
  adminAccessAuthorizedAt: timestamp("admin_access_authorized_at"),
  adminAccessReason: text("admin_access_reason"), // Support ticket ID, reason for access
  adminAccessExpiresAt: timestamp("admin_access_expires_at"), // Time-limited access
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  subscriptionStatus: text("subscription_status"),
  subscriptionTier: text("subscription_tier"),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  // MFA fields for admin accounts
  mfaSecret: text("mfa_secret"), // TOTP secret
  mfaEnabled: boolean("mfa_enabled").default(false),
  mfaBackupCodes: text("mfa_backup_codes"), // JSON array of backup codes
  isAdmin: boolean("is_admin").default(false),
  // Analytics consent fields
  analyticsEnabled: boolean("analytics_enabled").default(true),
  analyticsConsentDate: timestamp("analytics_consent_date"),
  // Preview access fields
  previewExpiresAt: timestamp("preview_expires_at"),
  hasUsedPreview: boolean("has_used_preview").default(false),
  previewStartedAt: timestamp("preview_started_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relationships between users and other tables
export const usersRelations = relations(users, ({ many }) => ({
  conversations: many(conversations),
  voiceProfiles: many(voiceProfiles),
}));

// Schema for user registration with email/password
export const registerUserSchema = createInsertSchema(users, {
  email: (schema) => schema.email("Please enter a valid email").min(1, "Email is required"),
  firstName: (schema) => schema.min(1, "First name is required"),
  password: (schema) => schema
    .min(8, "Password must be at least 8 characters")
    .max(64, "Password must be no more than 64 characters")
    .refine(password => /[A-Z]/.test(password), {
      message: "Password must contain at least one uppercase letter"
    })
    .refine(password => /[a-z]/.test(password), {
      message: "Password must contain at least one lowercase letter"
    })
    .refine(password => /\d/.test(password), {
      message: "Password must contain at least one number"
    })
    .refine(password => /[!@#$%^&*(),.?":{}|<>]/.test(password), {
      message: "Password must contain at least one special character"
    }),
}).pick({
  email: true,
  password: true,
  firstName: true, 
  lastName: true
});

// Schema for logging in with email/password
export const loginUserSchema = z.object({
  email: z.string().email("Please enter a valid email").min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

// Schema for updating user profile
export const updateUserSchema = createInsertSchema(users).partial().omit({
  id: true,
  password: true,
  createdAt: true,
  googleId: true,
  appleId: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  resetToken: true,
  resetTokenExpiry: true
});

export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type User = typeof users.$inferSelect;

// Conversations table
export const conversations = pgTable("conversations", {
  id: text("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  customName: text("custom_name"),  // Custom name provided by the user
  // Encrypted versions of sensitive conversation data
  encryptedTitle: json("encrypted_title"), // Stores EncryptedData object for title
  encryptedCustomName: json("encrypted_custom_name"), // Stores EncryptedData object for custom name
  sourceLanguage: text("source_language").notNull(),
  targetLanguage: text("target_language").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  isFavorite: boolean("is_favorite").default(false),  // Add favorite flag for quick access
  category: text("category"),  // Allow categorization (e.g., travel, business, personal)
  tags: text("tags"),  // Comma-separated tags for filtering and organization
  isEncrypted: boolean("is_encrypted").default(false), // Flag to track if conversation is encrypted
});

export const conversationsRelations = relations(conversations, ({ many, one }) => ({
  messages: many(messages),
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id]
  })
}));

export const insertConversationSchema = createInsertSchema(conversations, {
  title: (schema) => schema.min(1, "Title is required"),
  customName: (schema) => schema.optional(),
  sourceLanguage: (schema) => schema.min(1, "Source language is required"),
  targetLanguage: (schema) => schema.min(1, "Target language is required"),
  isFavorite: (schema) => schema.optional(),
  category: (schema) => schema.optional(),
  tags: (schema) => schema.optional()
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

// Messages table
export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull().references(() => conversations.id),
  text: text("text").notNull(),
  // Encrypted versions of sensitive text data
  encryptedText: json("encrypted_text"), // Stores EncryptedData object for original text
  encryptedTranslatedText: json("encrypted_translated_text"), // Stores EncryptedData object for translation
  isUser: boolean("is_user").notNull(), // true if sent by user, false if response
  sourceLanguage: text("source_language").notNull(),
  targetLanguage: text("target_language").notNull(),
  createdAt: text("created_at").notNull(),
  hasBeenSpoken: boolean("has_been_spoken").default(false), // Track if translation has been spoken
  isEncrypted: boolean("is_encrypted").default(false), // Flag to track if message is encrypted
});

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const insertMessageSchema = createInsertSchema(messages, {
  text: (schema) => schema.min(1, "Message text is required"),
  conversationId: (schema) => schema.min(1, "Conversation ID is required"),
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Voice Profile table for speech customization
export const voiceProfiles = pgTable("voice_profiles", {
  id: text("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  languageCode: text("language_code").notNull(),
  pitch: decimal("pitch", { precision: 4, scale: 2 }).notNull().default("1.0"),
  rate: decimal("rate", { precision: 4, scale: 2 }).notNull().default("1.0"),
  voiceType: text("voice_type"),
  isDefault: boolean("is_default").default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const insertVoiceProfileSchema = createInsertSchema(voiceProfiles, {
  name: (schema) => schema.min(1, "Profile name is required"),
  languageCode: (schema) => schema.min(1, "Language code is required"),
  pitch: (schema) => schema.optional(),
  rate: (schema) => schema.optional(),
  voiceType: (schema) => schema.optional(),
  isDefault: (schema) => schema.optional(),
});

export type InsertVoiceProfile = z.infer<typeof insertVoiceProfileSchema>;
export type VoiceProfile = typeof voiceProfiles.$inferSelect;

// Speech Settings table for user preferences
export const speechSettings = pgTable("speech_settings", {
  id: text("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  autoPlay: boolean("auto_play").default(true),
  useProfileForLanguage: boolean("use_profile_for_language").default(true),
  defaultProfileId: text("default_profile_id").references(() => voiceProfiles.id),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const insertSpeechSettingsSchema = createInsertSchema(speechSettings, {
  autoPlay: (schema) => schema.optional(),
  useProfileForLanguage: (schema) => schema.optional(),
  defaultProfileId: (schema) => schema.optional(),
});

export type InsertSpeechSettings = z.infer<typeof insertSpeechSettingsSchema>;
export type SpeechSettings = typeof speechSettings.$inferSelect;

// Removed flawed translation quality rating system
// Users can't judge translation quality in languages they don't speak

// Usage Statistics table
export const usageStatistics = pgTable("usage_statistics", {
  id: text("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD format
  languagePair: text("language_pair").notNull(), // e.g., "en-US:es-ES"
  messageCount: integer("message_count").notNull().default(0),
  characterCount: integer("character_count").notNull().default(0),
  averageResponseTime: decimal("average_response_time", { precision: 8, scale: 2 }), // in milliseconds
  uniqueConversations: integer("unique_conversations").notNull().default(0),
});

export const insertUsageStatisticsSchema = createInsertSchema(usageStatistics, {
  date: (schema) => schema.min(1, "Date is required"),
  languagePair: (schema) => schema.min(1, "Language pair is required"),
  messageCount: (schema) => schema.optional(),
  characterCount: (schema) => schema.optional(),
  averageResponseTime: (schema) => schema.optional(),
  uniqueConversations: (schema) => schema.optional(),
});

export type InsertUsageStatistics = z.infer<typeof insertUsageStatisticsSchema>;
export type UsageStatistics = typeof usageStatistics.$inferSelect;

// Conversation Patterns Analytics
export const conversationPatterns = pgTable("conversation_patterns", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull().references(() => conversations.id),
  patternType: text("pattern_type").notNull(), // "topic_shift", "sentiment_change", "question_answer", etc.
  patternData: json("pattern_data"), // Structured data about the pattern
  startMessageId: text("start_message_id").references(() => messages.id),
  endMessageId: text("end_message_id").references(() => messages.id),
  detectedAt: text("detected_at").notNull(),
});

export const conversationPatternsRelations = relations(conversationPatterns, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversationPatterns.conversationId],
    references: [conversations.id],
  }),
  startMessage: one(messages, {
    fields: [conversationPatterns.startMessageId],
    references: [messages.id],
  }),
  endMessage: one(messages, {
    fields: [conversationPatterns.endMessageId],
    references: [messages.id],
  }),
}));

export const insertConversationPatternsSchema = createInsertSchema(conversationPatterns, {
  conversationId: (schema) => schema.min(1, "Conversation ID is required"),
  patternType: (schema) => schema.min(1, "Pattern type is required"),
  patternData: (schema) => schema.optional(),
  startMessageId: (schema) => schema.optional(),
  endMessageId: (schema) => schema.optional(),
});

export type InsertConversationPattern = z.infer<typeof insertConversationPatternsSchema>;
export type ConversationPattern = typeof conversationPatterns.$inferSelect;

// Feedback category enum
export const feedbackCategoryEnum = z.enum(['bug', 'feature', 'translation', 'other']);

// Feedback table for storing user feedback
export const userFeedback = pgTable("user_feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  category: text("category").notNull(),
  feedback: text("feedback").notNull(),
  email: text("email"),
  status: text("status").default("new").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Feedback relationships
export const userFeedbackRelations = relations(userFeedback, ({ one }) => ({
  user: one(users, {
    fields: [userFeedback.userId],
    references: [users.id]
  })
}));

// Feedback insert schema with validation
export const insertUserFeedbackSchema = createInsertSchema(userFeedback);

export type InsertUserFeedback = z.infer<typeof insertUserFeedbackSchema>;
export type UserFeedback = typeof userFeedback.$inferSelect;

// Admin authorization tokens table for secure access requests
export const adminAuthTokens = pgTable("admin_auth_tokens", {
  id: varchar("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  adminId: integer("admin_id").references(() => users.id).notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  reason: text("reason").notNull(),
  durationHours: integer("duration_hours").default(24).notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const adminAuthTokensRelations = relations(adminAuthTokens, ({ one }) => ({
  user: one(users, { fields: [adminAuthTokens.userId], references: [users.id] }),
  admin: one(users, { fields: [adminAuthTokens.adminId], references: [users.id] }),
}));

export const insertAdminAuthTokenSchema = createInsertSchema(adminAuthTokens);
export type InsertAdminAuthToken = z.infer<typeof insertAdminAuthTokenSchema>;
export type AdminAuthToken = typeof adminAuthTokens.$inferSelect;
