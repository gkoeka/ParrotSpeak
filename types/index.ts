// Type definitions for ParrotSpeak mobile app

export interface Language {
  code: string;
  name: string;
  country: string;
  flag: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  subscriptionStatus?: string;
  subscriptionTier?: string;
  subscriptionExpiresAt?: Date | null;
  profileImageUrl?: string | null;
  emailVerified?: boolean;
}

export interface AuthResponse {
  user: User;
}

export interface TranslationResponse {
  translation: string;
  originalText: string;
}

export interface NetworkTestResult {
  success: boolean;
  error?: string;
  responseTime?: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  isOriginal: boolean;
  sourceLanguage?: string;
  targetLanguage?: string;
  createdAt: Date;
  userId: string;
}