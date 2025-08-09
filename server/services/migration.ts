import { db } from '../../db';
import { users, conversations, messages } from '@shared/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { encryptUserData } from './encryption';

/**
 * Migrates existing unencrypted data to encrypted format
 */
export async function migrateToEncryption() {
  console.log('Starting encryption migration...');
  
  try {
    // Get all users for encryption
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} users to process`);
    
    for (const user of allUsers) {
      const userId = user.id.toString();
      console.log(`Processing user ${userId}...`);
      
      // Migrate conversations for this user
      const userConversations = await db
        .select()
        .from(conversations)
        .where(and(
          eq(conversations.userId, user.id),
          eq(conversations.isEncrypted, false)
        ));
      
      for (const conversation of userConversations) {
        const encryptedTitle = encryptUserData(conversation.title, userId);
        const encryptedCustomName = conversation.customName 
          ? encryptUserData(conversation.customName, userId) 
          : null;
        
        await db
          .update(conversations)
          .set({
            encryptedTitle,
            encryptedCustomName,
            isEncrypted: true
          })
          .where(eq(conversations.id, conversation.id));
        
        console.log(`Encrypted conversation ${conversation.id}`);
      }
      
      // Migrate messages for this user's conversations
      const userMessages = await db
        .select()
        .from(messages)
        .innerJoin(conversations, eq(messages.conversationId, conversations.id))
        .where(and(
          eq(conversations.userId, user.id),
          eq(messages.isEncrypted, false)
        ));
      
      for (const { messages: message } of userMessages) {
        const encryptedText = encryptUserData(message.text, userId);
        
        await db
          .update(messages)
          .set({
            encryptedText,
            isEncrypted: true
          })
          .where(eq(messages.id, message.id));
        
        console.log(`Encrypted message ${message.id}`);
      }
    }
    
    console.log('Encryption migration completed successfully!');
    return { success: true, message: 'All data encrypted successfully' };
    
  } catch (error) {
    console.error('Encryption migration failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Checks if encryption migration is needed
 */
export async function checkMigrationStatus() {
  try {
    const unencryptedConversations = await db
      .select()
      .from(conversations)
      .where(eq(conversations.isEncrypted, false))
      .limit(1);
    
    const unencryptedMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.isEncrypted, false))
      .limit(1);
    
    const needsMigration = unencryptedConversations.length > 0 || unencryptedMessages.length > 0;
    
    return {
      needsMigration,
      unencryptedConversations: unencryptedConversations.length,
      unencryptedMessages: unencryptedMessages.length
    };
  } catch (error) {
    console.error('Error checking migration status:', error);
    return { needsMigration: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}