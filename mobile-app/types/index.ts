// Type definitions for the mobile app

// Language definition
export interface Language {
  code: string;
  name: string;
  country: string;
  flag: string;
}

// Message in a conversation
export interface Message {
  id: string;
  text: string;
  timestamp: string;
  isUser: boolean;
  sourceLanguage: string;
  targetLanguage: string;
  hasBeenSpoken?: boolean;
}

// Conversation data structure
export interface Conversation {
  id: string;
  title: string;
  customName?: string;
  createdAt: string;
  updatedAt: string;
  sourceLanguage: string;
  targetLanguage: string;
  messages: Message[];
  isFavorite?: boolean;
  category?: string;
  tags?: string;
}

// Translation request payload
export interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}

// Translation response from API
export interface TranslationResponse {
  translation: string;
  originalText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

// Speech recognition results
export interface SpeechRecognitionResult {
  text: string;
  confidence: number;
}

// Audio recording data
export interface AudioRecording {
  uri: string;
  duration?: number;
  fileSize?: number;
}
