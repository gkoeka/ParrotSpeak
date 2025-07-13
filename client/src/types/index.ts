export interface Language {
  code: string;
  name: string;
  country: string;
  flag: string;
}

export interface Message {
  id: string;
  text: string;
  timestamp: string;
  isUser: boolean;
  sourceLanguage: string;
  targetLanguage: string;
  hasBeenSpoken?: boolean;
}

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

export interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface TranslationResponse {
  translation: string;
  originalText: string;
  sourceLanguage: string;
  targetLanguage: string;
}
