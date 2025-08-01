import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin, statusCodes, ConfigureParams } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../constants/api';

// Configure Google Sign-In
const googleConfig: ConfigureParams = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '', // From Google Cloud Console
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, // From Google Cloud Console
};

// Add Android client ID if available (different property name in newer versions)
if (process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID) {
  (googleConfig as any).googleServicePlistPath = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
}

GoogleSignin.configure(googleConfig);

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
        return await response.json();
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
        return await response.json();
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