import { db } from "@db";
import { conversations, messages, voiceProfiles, speechSettings, users } from "@shared/schema";
import { CreateVoiceProfileInput, UpdateVoiceProfileInput } from "@shared/types/speech";
import { eq, desc, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { encryptUserData, decryptUserData } from "./services/encryption";

// Helper function to get a human-readable language name from code
function getLanguageName(languageCode: string): string {
  const codeMap: Record<string, string> = {
    // Original languages
    "en-US": "English",
    "en-GB": "British English",
    "es-ES": "Spanish",
    "fr-FR": "French",
    "de-DE": "German",
    "it-IT": "Italian",
    "pt-BR": "Portuguese (Brazil)",
    "ja-JP": "Japanese",
    "zh-CN": "Chinese (Mandarin)",
    "ru-RU": "Russian",
    "ar-SA": "Arabic",
    "hi-IN": "Hindi",
    "ko-KR": "Korean",
    "cs-CZ": "Czech",
    
    // Previously added languages
    "bn-BD": "Bengali",
    "id-ID": "Indonesian",
    "tr-TR": "Turkish",
    "vi-VN": "Vietnamese",
    "th-TH": "Thai",
    "el-GR": "Greek",
    "ms-MY": "Malay",
    "ne-NP": "Nepali",
    "tl-PH": "Filipino",
    "es-CR": "Spanish (Costa Rica)",
    
    // Special languages
    "xsr-NP": "Sherpa",
    "yue-HK": "Chinese (Cantonese)",
    
    // Indian languages
    "ta-IN": "Tamil",
    "te-IN": "Telugu",
    "mr-IN": "Marathi",
    "gu-IN": "Gujarati",
    
    // Eastern Europe
    "pl-PL": "Polish",
    "uk-UA": "Ukrainian",
    "ro-RO": "Romanian",
    "hu-HU": "Hungarian",
    
    // African Languages
    "sw-KE": "Swahili",
    "am-ET": "Amharic",
    "ar-EG": "Arabic (Egyptian)",
    "ar-MA": "Arabic (Moroccan)",
    
    // South/Central America
    "pt-PT": "Portuguese (European)",
    "qu-PE": "Quechua",
    
    // Middle East
    "fa-IR": "Persian",
    "he-IL": "Hebrew",
    
    // Scandinavia
    "sv-SE": "Swedish",
    "no-NO": "Norwegian",
    "da-DK": "Danish",
    
    // Southeast Asia Additional
    "km-KH": "Khmer",
    "my-MM": "Burmese",
    "lo-LA": "Lao",
    
    // Pacific Islands
    "haw-US": "Hawaiian",
    "fj-FJ": "Fijian",
    
    // Central Asia
    "uz-UZ": "Uzbek",
    "kk-KZ": "Kazakh"
  };

  return codeMap[languageCode] || languageCode;
}

// Generate a more user-friendly title for conversations
function generateDefaultTitle(sourceLanguage: string, targetLanguage: string, customTitle?: string): string {
  // If a custom title is provided (from client with local time), use it
  if (customTitle) {
    return customTitle;
  }
  
  // Fallback: simple title without time (since server doesn't know user's timezone)
  const sourceName = getLanguageName(sourceLanguage);
  const targetName = getLanguageName(targetLanguage);
  
  return `Chat: ${sourceName}↔${targetName}`;
}

export const storage = {
  async createConversation(sourceLanguage: string, targetLanguage: string, customName?: string, userId?: number, clientTitle?: string) {
    const title = generateDefaultTitle(sourceLanguage, targetLanguage, clientTitle);
    
    // Create conversation with encryption for new conversations
    const conversationData: any = {
      id: uuidv4(),
      title,
      customName: customName || null,
      sourceLanguage,
      targetLanguage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isFavorite: false,
      category: null,
      tags: null,
      userId: userId || null,
      isEncrypted: !!userId
    };

    // Always encrypt conversation data for security
    const encryptionKey = userId ? userId.toString() : 'guest_default_key';
    conversationData.encryptedTitle = encryptUserData(title, encryptionKey);
    if (customName) {
      conversationData.encryptedCustomName = encryptUserData(customName, encryptionKey);
    }
    conversationData.isEncrypted = true;

    const [conversation] = await db.insert(conversations)
      .values(conversationData)
      .returning();
    
    return conversation;
  },

  async updateConversation(id: string, updates: {
    customName?: string;
    isFavorite?: boolean;
    category?: string;
    tags?: string;
  }) {
    // First get the existing conversation
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, id)
    });
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    // Update with new values
    const [updated] = await db.update(conversations)
      .set({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .where(eq(conversations.id, id))
      .returning();
    
    return updated;
  },
  
  async getConversations(userId?: number) {
    const whereClause = userId ? eq(conversations.userId, userId) : undefined;
    return db.query.conversations.findMany({
      where: whereClause,
      orderBy: [desc(conversations.updatedAt)]
    });
  },
  
  async getConversation(id: string) {
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, id),
      with: {
        messages: {
          orderBy: [conversations.createdAt]
        }
      }
    });
    
    return conversation;
  },
  
  async saveMessage(
    conversationId: string,
    text: string,
    isUser: boolean,
    sourceLanguage: string,
    targetLanguage: string,
    userId?: number
  ) {
    // Update the conversation's updatedAt time
    await db.update(conversations)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(conversations.id, conversationId));
    
    // Save the message with encryption if userId is provided
    const messageId = uuidv4();
    
    const messageData: any = {
      id: messageId,
      conversationId,
      text,
      isUser,
      sourceLanguage,
      targetLanguage,
      createdAt: new Date().toISOString(),
      hasBeenSpoken: false,
      isEncrypted: !!userId
    };

    // Add encrypted version if we have a userId
    if (userId) {
      const userIdStr = userId.toString();
      messageData.encryptedText = encryptUserData(text, userIdStr);
    }
    
    await db.insert(messages).values(messageData);
    
    return messageId;
  },
  
  async deleteConversation(id: string) {
    // Delete all messages first due to foreign key constraint
    await db.delete(messages)
      .where(eq(messages.conversationId, id));
    
    // Then delete the conversation
    await db.delete(conversations)
      .where(eq(conversations.id, id));
    
    return true;
  },
  
  async markMessageAsSpoken(id: string) {
    console.log(`[storage] Marking message ${id} as having been spoken`);
    
    try {
      // First verify message exists
      const messageExists = await db.query.messages.findFirst({
        where: eq(messages.id, id)
      });
      
      if (!messageExists) {
        console.log(`[storage] Message ${id} not found`);
        return null;
      }
      
      // Update the message to mark it as having been spoken - convert boolean to string for PostgreSQL
      const result = await db.update(messages)
        .set({ 
          hasBeenSpoken: true
        })
        .where(eq(messages.id, id))
        .returning();
      
      console.log(`[storage] Update result:`, result);
      
      if (result.length === 0) {
        console.log(`[storage] No rows were updated for message ${id}`);
        
        // If update failed, try a direct query to verify message status
        const verifyMessage = await db.query.messages.findFirst({
          where: eq(messages.id, id)
        });
        
        console.log(`[storage] Message verify after failed update:`, verifyMessage);
        return verifyMessage;
      }
      
      return result[0];
    } catch (error) {
      console.error(`[storage] Error marking message as spoken:`, error);
      throw error;
    }
  },

  // Voice profile management
  async getVoiceProfiles(userId?: number) {
    const whereClause = userId ? eq(voiceProfiles.userId, userId) : undefined;
    return db.query.voiceProfiles.findMany({
      where: whereClause,
      orderBy: [desc(voiceProfiles.isDefault), voiceProfiles.name]
    });
  },

  async getVoiceProfile(id: string) {
    return db.query.voiceProfiles.findFirst({
      where: eq(voiceProfiles.id, id)
    });
  },

  async createVoiceProfile(input: CreateVoiceProfileInput, userId?: number) {
    // If this is set as default, unset any existing default first for this user
    if (input.isDefault && userId) {
      await db.update(voiceProfiles)
        .set({ isDefault: false })
        .where(eq(voiceProfiles.userId, userId));
    }

    const [profile] = await db.insert(voiceProfiles)
      .values({
        id: uuidv4(),
        userId: userId || null,
        name: input.name,
        languageCode: input.languageCode,
        pitch: input.pitch?.toString() || "1.0",
        rate: input.rate?.toString() || "1.0",
        voiceType: input.voiceType || null,
        isDefault: input.isDefault || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
    
    return profile;
  },

  async updateVoiceProfile(id: string, updates: Partial<UpdateVoiceProfileInput>) {
    // First get the existing profile
    const profile = await db.query.voiceProfiles.findFirst({
      where: eq(voiceProfiles.id, id)
    });
    
    if (!profile) {
      throw new Error('Voice profile not found');
    }

    // If setting this as default, unset any existing default first
    if (updates.isDefault) {
      await db.update(voiceProfiles)
        .set({ isDefault: false })
        .where(eq(voiceProfiles.isDefault, true));
    }
    
    // Update with new values
    const [updated] = await db.update(voiceProfiles)
      .set({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .where(eq(voiceProfiles.id, id))
      .returning();
    
    return updated;
  },

  async deleteVoiceProfile(id: string) {
    // First get the profile to check if it's the default
    const profile = await db.query.voiceProfiles.findFirst({
      where: eq(voiceProfiles.id, id)
    });
    
    if (!profile) {
      throw new Error('Voice profile not found');
    }

    // Don't allow deletion of the default profile
    if (profile.isDefault) {
      throw new Error('Cannot delete the default voice profile');
    }

    // Check if this profile is used in speech settings
    const settings = await db.query.speechSettings.findFirst({
      where: eq(speechSettings.defaultProfileId, id)
    });

    if (settings) {
      // Update settings to use a different profile if this one is used
      const defaultProfile = await db.query.voiceProfiles.findFirst({
        where: eq(voiceProfiles.isDefault, true)
      });

      if (defaultProfile && defaultProfile.id !== id) {
        await db.update(speechSettings)
          .set({ 
            defaultProfileId: defaultProfile.id,
            updatedAt: new Date().toISOString()
          })
          .where(eq(speechSettings.defaultProfileId, id));
      } else {
        // If no default profile, set to null
        await db.update(speechSettings)
          .set({ 
            defaultProfileId: null,
            updatedAt: new Date().toISOString()
          })
          .where(eq(speechSettings.defaultProfileId, id));
      }
    }
    
    // Delete the profile
    await db.delete(voiceProfiles)
      .where(eq(voiceProfiles.id, id));
    
    return true;
  },

  // Speech settings management
  async getSpeechSettings(userId?: number) {
    // Get settings for specific user or first record if no user specified
    const whereClause = userId ? eq(speechSettings.userId, userId) : undefined;
    const settings = await db.query.speechSettings.findFirst({
      where: whereClause
    });
    
    if (settings) {
      return settings;
    }

    // If no settings exist for user, create default settings
    if (userId) {
      // Get the default voice profile for this user
      const defaultProfile = await db.query.voiceProfiles.findFirst({
        where: eq(voiceProfiles.userId, userId) && eq(voiceProfiles.isDefault, true)
      });

      const [newSettings] = await db.insert(speechSettings)
        .values({
          id: uuidv4(),
          userId: userId,
          autoPlay: true,
          useProfileForLanguage: true,
          defaultProfileId: defaultProfile?.id || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();
        
      return newSettings;
    }

    return null;
  },

  async updateSpeechSettings(updates: {
    autoPlay?: boolean;
    useProfileForLanguage?: boolean;
    defaultProfileId?: string | null;
  }, userId?: number) {
    // Get settings or create if they don't exist
    const settings = await this.getSpeechSettings(userId);

    if (!settings) {
      throw new Error('Speech settings not found');
    }

    // If updating default profile, ensure it exists and belongs to user
    if (updates.defaultProfileId) {
      const whereClause = userId 
        ? and(eq(voiceProfiles.id, updates.defaultProfileId), eq(voiceProfiles.userId, userId))
        : eq(voiceProfiles.id, updates.defaultProfileId);
        
      const profileExists = await db.query.voiceProfiles.findFirst({
        where: whereClause
      });

      if (!profileExists) {
        throw new Error('Voice profile not found or access denied');
      }
    }
    
    // Update settings
    const [updated] = await db.update(speechSettings)
      .set({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .where(eq(speechSettings.id, settings.id))
      .returning();
    
    return updated;
  },

  // User management methods
  async getUser(userId: number) {
    return db.query.users.findFirst({
      where: eq(users.id, userId)
    });
  },

  async updateUserSubscription(userId: number, updates: {
    subscriptionStatus: string;
    subscriptionTier: string;
    subscriptionExpiresAt: Date;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  }) {
    const [updated] = await db.update(users)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updated;
  }
};
