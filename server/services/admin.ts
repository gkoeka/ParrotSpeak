import { db } from '../../db';
import { users, conversations, messages, userFeedback } from '@shared/schema';
import { eq, desc, count, and, gte, lte, like, or } from 'drizzle-orm';
import { decryptUserData } from './encryption';
import { checkAdminAccessAuthorization } from './admin-authorization';

// Define admin user IDs - these should be set via environment variables in production
const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(',').map(id => parseInt(id.trim())) || [1];

/**
 * Check if a user has admin privileges
 */
export function isAdmin(userId: number): boolean {
  return ADMIN_USER_IDS.includes(userId);
}

/**
 * Get all users with basic stats
 */
export async function getAllUsers(adminUserId: number) {
  if (!isAdmin(adminUserId)) {
    throw new Error('Unauthorized: Admin access required');
  }

  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      emailVerified: users.emailVerified,
      subscriptionStatus: users.subscriptionStatus,
      subscriptionTier: users.subscriptionTier,
      createdAt: users.createdAt,
      conversationCount: count(conversations.id)
    })
    .from(users)
    .leftJoin(conversations, eq(users.id, conversations.userId))
    .groupBy(users.id)
    .orderBy(desc(users.createdAt));

  return allUsers;
}

/**
 * Get detailed user information including conversations and messages
 */
export async function getUserDetails(adminUserId: number, targetUserId: number) {
  if (!isAdmin(adminUserId)) {
    throw new Error('Unauthorized: Admin access required');
  }

  // Get user basic info
  const user = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
  if (!user.length) {
    throw new Error('User not found');
  }

  // Get user's conversations with decrypted titles
  const userConversations = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, targetUserId))
    .orderBy(desc(conversations.updatedAt));

  // Check if admin has authorization to decrypt this user's data
  const hasAuthorization = await checkAdminAccessAuthorization(targetUserId);

  // Decrypt conversation titles for admin view only if authorized
  const decryptedConversations = userConversations.map(conv => {
    let decryptedTitle = conv.title;
    let decryptedCustomName = conv.customName;

    if (conv.isEncrypted && hasAuthorization) {
      if (conv.encryptedTitle) {
        try {
          decryptedTitle = decryptUserData(conv.encryptedTitle as any, targetUserId.toString());
        } catch (error) {
          console.error('Failed to decrypt conversation title:', error);
          decryptedTitle = '[Encrypted - Unable to decrypt]';
        }
      }

      if (conv.encryptedCustomName) {
        try {
          decryptedCustomName = decryptUserData(conv.encryptedCustomName as any, targetUserId.toString());
        } catch (error) {
          console.error('Failed to decrypt conversation custom name:', error);
          decryptedCustomName = '[Encrypted - Unable to decrypt]';
        }
      }
    } else if (conv.isEncrypted && !hasAuthorization) {
      decryptedTitle = '[Encrypted - Authorization Required]';
      decryptedCustomName = conv.customName ? '[Encrypted - Authorization Required]' : null;
    }

    return {
      ...conv,
      decryptedTitle,
      decryptedCustomName,
      requiresAuthorization: conv.isEncrypted && !hasAuthorization
    };
  });

  // Get total message count
  const messageCount = await db
    .select({ count: count() })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(eq(conversations.userId, targetUserId));

  return {
    user: user[0],
    conversations: decryptedConversations,
    messageCount: messageCount[0].count,
    totalConversations: userConversations.length
  };
}

/**
 * Get conversation details with decrypted messages
 */
export async function getConversationDetails(adminUserId: number, conversationId: string) {
  if (!isAdmin(adminUserId)) {
    throw new Error('Unauthorized: Admin access required');
  }

  const conversation = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conversation.length) {
    throw new Error('Conversation not found');
  }

  const conv = conversation[0];
  
  // Get all messages for this conversation
  const conversationMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);

  // Decrypt messages for admin view
  const decryptedMessages = conversationMessages.map(msg => {
    let decryptedText = msg.text;

    if (msg.isEncrypted && msg.encryptedText && conv.userId) {
      try {
        decryptedText = decryptUserData(msg.encryptedText as any, conv.userId.toString());
      } catch (error) {
        console.error('Failed to decrypt message text:', error);
        decryptedText = '[Encrypted - Unable to decrypt]';
      }
    }

    return {
      ...msg,
      decryptedText
    };
  });

  return {
    conversation: conv,
    messages: decryptedMessages
  };
}

/**
 * Search users by email or username
 */
export async function searchUsers(adminUserId: number, query: string) {
  if (!isAdmin(adminUserId)) {
    throw new Error('Unauthorized: Admin access required');
  }

  const searchResults = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      createdAt: users.createdAt
    })
    .from(users)
    .where(
      or(
        like(users.email, `%${query}%`),
        like(users.firstName, `%${query}%`),
        like(users.lastName, `%${query}%`)
      )
    )
    .limit(50);

  return searchResults;
}

/**
 * Get platform analytics
 */
export async function getPlatformAnalytics(adminUserId: number) {
  if (!isAdmin(adminUserId)) {
    throw new Error('Unauthorized: Admin access required');
  }

  // Get user counts
  const totalUsers = await db.select({ count: count() }).from(users);
  
  // Get conversation counts
  const totalConversations = await db.select({ count: count() }).from(conversations);
  
  // Get message counts
  const totalMessages = await db.select({ count: count() }).from(messages);
  
  // Get recent signups (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentSignups = await db
    .select({ count: count() })
    .from(users)
    .where(gte(users.createdAt, sevenDaysAgo));

  // Get feedback count
  const totalFeedback = await db.select({ count: count() }).from(userFeedback);

  return {
    totalUsers: totalUsers[0].count,
    totalConversations: totalConversations[0].count,
    totalMessages: totalMessages[0].count,
    recentSignups: recentSignups[0].count,
    totalFeedback: totalFeedback[0].count
  };
}

/**
 * Get all feedback submissions
 */
export async function getAllFeedback(adminUserId: number) {
  if (!isAdmin(adminUserId)) {
    throw new Error('Unauthorized: Admin access required');
  }

  const feedback = await db
    .select({
      id: userFeedback.id,
      category: userFeedback.category,
      feedback: userFeedback.feedback,
      email: userFeedback.email,
      createdAt: userFeedback.createdAt,
      userId: userFeedback.userId,
      userEmail: users.email,
      userFirstName: users.firstName,
      userLastName: users.lastName
    })
    .from(userFeedback)
    .leftJoin(users, eq(userFeedback.userId, users.id))
    .orderBy(desc(userFeedback.createdAt));

  return feedback;
}