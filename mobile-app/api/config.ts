// API Configuration for mobile app

// Base URL for API requests
// For local development: Use "http://10.0.2.2:5000" for Android emulator or "http://localhost:5000" for iOS simulator
// For production: Use your deployed API URL

export const API_BASE_URL = "https://workspace.gregkoeka.repl.co"; // Updated to match Replit URL

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
  
  if (includeAuth && token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
};

// Helper function to build full URL
export const buildUrl = (endpoint: string) => {
  return `${API_BASE_URL}${endpoint}`;
};