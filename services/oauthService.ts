import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../api/config';
import { SecureStorage } from '../utils/secureStorage';

// Google Sign-In types
interface GoogleSignInType {
  configure: (config: any) => void;
  hasPlayServices: () => Promise<void>;
  signIn: () => Promise<any>;
  signOut: () => Promise<void>;
  isSignedIn: () => Promise<boolean>;
  getCurrentUser: () => Promise<any>;
}

// Initialize Google Sign-In conditionally
let GoogleSignin: GoogleSignInType | null = null;
let statusCodes: any = {};

// Only load Google Sign-In in production builds or when not in Expo Go
const isExpoGo = __DEV__ && Platform.OS !== 'web';

if (!isExpoGo) {
  try {
    const googleSignInModule = require('@react-native-google-signin/google-signin');
    GoogleSignin = googleSignInModule.GoogleSignin;
    statusCodes = googleSignInModule.statusCodes;
    
    // Configure Google Sign-In
    const googleConfig = {
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    };
    
    if (process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID) {
      (googleConfig as any).googleServicePlistPath = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
    }
    
    GoogleSignin.configure(googleConfig);
  } catch (error) {
    console.log('Google Sign-In module not available in this environment');
  }
}

export const OAuthService = {
  // Apple Sign In
  async signInWithApple(): Promise<any> {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Send credential to backend for verification
      const response = await fetch(`${API_BASE_URL}/api/auth/apple/mobile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          identityToken: credential.identityToken,
          authorizationCode: credential.authorizationCode,
          user: credential.user,
          email: credential.email,
          fullName: credential.fullName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store auth token if provided by server
        if (data.token) {
          await SecureStorage.setAuthToken(data.token);
        }
        return data;
      } else {
        throw new Error('Apple authentication failed');
      }
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User canceled the sign-in flow
        return null;
      }
      throw error;
    }
  },

  // Google Sign In
  async signInWithGoogle(): Promise<any> {
    // Check if Google Sign-In is available
    if (!GoogleSignin) {
      console.warn('Google Sign-In is not available in Expo Go. Use EAS Build for production.');
      throw new Error('Google Sign-In requires a production build. Please use EAS Build.');
    }
    
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      // Send user info to backend for verification
      const response = await fetch(`${API_BASE_URL}/api/auth/google/mobile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          idToken: userInfo.data?.idToken,
          serverAuthCode: userInfo.data?.serverAuthCode,
          user: userInfo.data?.user,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store auth token if provided by server
        if (data.token) {
          await SecureStorage.setAuthToken(data.token);
        }
        return data;
      } else {
        throw new Error('Google authentication failed');
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled the login flow
        return null;
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Play services not available');
      } else {
        throw error;
      }
    }
  },

  // Check if Apple Sign In is available
  async isAppleAuthAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;
    return await AppleAuthentication.isAvailableAsync();
  },

  // Sign out from Google
  async signOutGoogle(): Promise<void> {
    if (!GoogleSignin) {
      return;
    }
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Google sign out error:', error);
    }
  },

  // Sign out from Apple (requires app restart)
  async signOutApple(): Promise<void> {
    // Apple doesn't provide a programmatic sign-out
    // Users need to sign out from Settings > Apple ID > Media & Purchases
    console.log('Apple sign out: User needs to sign out from device settings');
  }
};