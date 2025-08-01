// API Configuration for mobile app using environment variables

// Get API URL from environment variable with fallback
// Note: React Native requires EXPO_PUBLIC_ prefix for client-side environment variables
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";
export const API_BASE_URL = API_URL;

// Log current API configuration for debugging
console.log('🔗 API Configuration:', {
  url: API_BASE_URL,
  source: process.env.EXPO_PUBLIC_API_URL ? 'environment' : 'fallback'
});

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