import { Conversation, Message } from '../types';
import { API_BASE_URL } from '../constants/api';
import { makeProtectedRequest } from './subscriptionService';

// Common options that include credentials for all API requests
const credentialsOption = {
  credentials: 'include' as RequestCredentials // Include cookies for authentication
};

// Common headers for JSON requests
const jsonHeaders = {
  'Content-Type': 'application/json'
};

// Get all conversations
export async function fetchConversations(): Promise<Conversation[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/conversations`, credentialsOption);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch conversations: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
}

// Get a specific conversation by ID
export async function fetchConversation(id: string): Promise<Conversation> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/conversations/${id}`, credentialsOption);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch conversation: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching conversation:', error);
    throw error;
  }
}

// Create a new conversation with subscription protection
export async function createConversation(data: {
  sourceLanguage: string;
  targetLanguage: string;
  customName?: string;
}): Promise<Conversation> {
  return makeProtectedRequest(
    '/api/conversations',
    {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(data),
    },
    'new_conversation'
  );
}

// Send a message in a conversation with subscription protection
export async function sendMessage(
  conversationId: string,
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<{ messageId: string; translation: string }> {
  return makeProtectedRequest(
    `/api/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        text,
        sourceLanguage,
        targetLanguage
      }),
    },
    'translation'
  );
}

// Update conversation properties
export async function updateConversation(
  id: string,
  updates: {
    customName?: string;
    isFavorite?: boolean;
    category?: string;
    tags?: string;
  }
): Promise<Conversation> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/conversations/${id}`, {
      method: 'PATCH',
      headers: jsonHeaders,
      body: JSON.stringify(updates),
      ...credentialsOption
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update conversation: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating conversation:', error);
    throw error;
  }
}

// Delete a conversation
export async function deleteConversation(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/conversations/${id}`, {
      method: 'DELETE',
      ...credentialsOption
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete conversation: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
}

// Mark message as spoken
export async function markMessageAsSpoken(id: string): Promise<void> {
  try {
    console.log(`[conversationService] Marking message ${id} as spoken`);
    
    // Fix the API URL - should be /api/messages/{id}/mark-spoken
    const response = await fetch(`${API_BASE_URL}/api/messages/${id}/mark-spoken`, {
      method: 'PATCH',
      headers: jsonHeaders,
      ...credentialsOption
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[conversationService] Failed with status ${response.status}: ${errorText}`);
      throw new Error(`Failed to mark message as spoken: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`[conversationService] Successfully marked message ${id} as spoken:`, result);
    
    return result;
  } catch (error) {
    console.error('[conversationService] Error marking message as spoken:', error);
    // We still throw the error so the component can handle it
    throw error;
  }
}
