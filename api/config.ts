// Mobile-compatible API configuration using environment variables
// React Native/Expo only supports process.env with EXPO_PUBLIC_ prefix

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://40e9270e-7819-4d9e-8fa8-ccb157c79dd9-00-luj1g8wui2hi.worf.replit.dev";

const API_CONFIG = {
  baseURL: API_BASE_URL,
  source: 'environment',
  environment: process.env.NODE_ENV === 'development' ? 'development' : 'production',
  timestamp: new Date().toISOString()
};

console.log('🦜 ParrotSpeak API Config:', API_CONFIG);

// Re-export for compatibility
export { API_BASE_URL, API_CONFIG };

// API Endpoints
export const ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    GOOGLE: "/api/auth/google",
    APPLE: "/api/auth/apple",
    LOGOUT: "/api/auth/logout",
    USER: "/api/auth/user",
    REQUEST_RESET: "/api/auth/request-reset",
    RESET_PASSWORD: "/api/auth/reset-password",
  },
  
  // Conversation endpoints
  CONVERSATIONS: {
    LIST: "/api/conversations",
    GET: (id: string) => `/api/conversations/${id}`,
    CREATE: "/api/conversations",
    UPDATE: (id: string) => `/api/conversations/${id}`,
    DELETE: (id: string) => `/api/conversations/${id}`,
  },
  
  // Messages endpoints
  MESSAGES: {
    MARK_AS_SPOKEN: (id: string) => `/api/messages/${id}/spoken`,
    SEND: "/api/messages",
  },
  
  // Voice endpoints
  VOICE: {
    PROFILES: "/api/voice-profiles",
    PROFILE: (id: string) => `/api/voice-profiles/${id}`,
    SETTINGS: "/api/speech-settings",
  },
  
  // Translation endpoints
  TRANSLATION: {
    TEXT: "/api/translate",
    SPEECH: "/api/transcribe",
    VISUAL: "/api/visual-translation",
  },
  
  // Feedback endpoint
  FEEDBACK: "/api/feedback",
  
  // Analytics endpoints
  ANALYTICS: {
    QUALITY: "/api/analytics/quality",
    USAGE: "/api/analytics/usage",
    LANGUAGE_PAIRS: "/api/analytics/language-pairs",
    PATTERNS: "/api/analytics/patterns",
  },
  
  // Payment endpoints
  PAYMENT: {
    CREATE_INTENT: "/api/create-payment-intent",
    SUBSCRIPTION: "/api/subscription",
  },
};

// Request headers
export const getHeaders = (includeAuth = false, token?: string) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  // For mobile app, we'll use session-based auth instead of token auth
  // The server handles authentication via session cookies
  
  return headers;
};

// Helper function to build full URL
export const buildUrl = (endpoint: string) => {
  return `${API_BASE_URL}${endpoint}`;
};