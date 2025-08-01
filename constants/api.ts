// API configuration

// Dynamic API URL for development vs production
// This ensures the mobile app connects to the correct server
declare const __DEV__: boolean;

export const API_BASE_URL = __DEV__ 
  ? "http://localhost:5000"  // Local development server
  : "https://40e9270e-7819-4d9e-8fa8-ccb157c79dd9-00-luj1g8wui2hi.worf.replit.dev"; // Production Replit URL

// For development environments, you'd specify the full URL:
// export const API_BASE_URL = 'http://localhost:5000';

// For local testing in Expo, you'd use your computer's IP:
// export const API_BASE_URL = 'http://192.168.1.100:5000';

// For production, you'd use your API server:
// export const API_BASE_URL = 'https://api.parrotspeak.com';

// When deploying with Expo, you might use environment variables:
// export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.parrotspeak.com';
