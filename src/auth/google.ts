import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useOAuth } from '@clerk/clerk-expo';

// Complete browser handoff ONCE at module top
WebBrowser.maybeCompleteAuthSession();

/**
 * Google OAuth helper for Clerk authentication
 * Uses native redirect scheme (parrotspeak://auth) instead of makeRedirectUri
 */
export const useGoogleOAuth = () => {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const signInWithGoogle = async () => {
    try {
      // Use native redirect (NOT makeRedirectUri)
      const redirectUrl = Linking.createURL('auth'); // -> parrotspeak://auth
      
      console.log('[Google OAuth] Starting flow with redirect:', redirectUrl);
      
      // Start OAuth flow with native redirect
      const { createdSessionId, setActive, signIn, signUp } = await startOAuthFlow({
        redirectUrl
      });
      
      console.log('[Google OAuth] Flow completed, sessionId:', createdSessionId);
      
      // Activate the session after OAuth
      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
        return { success: true, sessionId: createdSessionId };
      }
      
      return { success: false, error: 'No session created' };
    } catch (error: any) {
      console.error('[Google OAuth] Error:', error);
      
      // Return structured error for better handling
      return {
        success: false,
        error: error?.message || 'OAuth flow failed',
        details: error
      };
    }
  };

  return { signInWithGoogle };
};