import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  useUser,
  useAuth as useClerkAuth,
  useSignIn,
  useSignUp,
  useOAuth,
} from '@clerk/clerk-expo';
import { makeRedirectUri } from 'expo-auth-session';
import { setTokenGetter } from '../api/authToken';
import { getCurrentUser } from '../api/authService';

interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  subscriptionStatus?: string;
  subscriptionTier?: string;
  subscriptionExpiresAt?: Date | null;
  previewExpiresAt?: Date | null;
  hasUsedPreview?: boolean;
  previewStartedAt?: Date | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  refreshUserData: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, getToken, signOut: clerkSignOut } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: 'oauth_apple' });

  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);

  // Register Clerk's getToken so all API services can attach it to requests
  useEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  // When Clerk auth state changes, sync subscription data from our backend
  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn && clerkUser) {
      fetchSubscriptionData();
    } else {
      setSubscriptionData(null);
    }
  }, [isLoaded, isSignedIn, clerkUser?.id]);

  const fetchSubscriptionData = async () => {
    setIsLoadingSubscription(true);
    try {
      const data = await getCurrentUser();
      setSubscriptionData(data);
    } catch (error) {
      console.error('Failed to fetch subscription data:', error);
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  const user: User | null =
    isLoaded && isSignedIn && clerkUser
      ? {
          id: String(subscriptionData?.id || clerkUser.id),
          email: clerkUser.primaryEmailAddress?.emailAddress || '',
          name:
            `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
            clerkUser.primaryEmailAddress?.emailAddress,
          picture: clerkUser.imageUrl,
          subscriptionStatus: subscriptionData?.subscriptionStatus || 'free',
          subscriptionTier: subscriptionData?.subscriptionTier,
          subscriptionExpiresAt: subscriptionData?.subscriptionExpiresAt
            ? new Date(subscriptionData.subscriptionExpiresAt)
            : null,
          previewExpiresAt: subscriptionData?.previewExpiresAt
            ? new Date(subscriptionData.previewExpiresAt)
            : null,
          hasUsedPreview: subscriptionData?.hasUsedPreview || false,
          previewStartedAt: subscriptionData?.previewStartedAt
            ? new Date(subscriptionData.previewStartedAt)
            : null,
        }
      : null;

  const isLoading = !isLoaded || (!!isSignedIn && isLoadingSubscription && !subscriptionData);

  const login = async (email: string, password: string) => {
    if (!signInLoaded || !signIn || !setSignInActive) throw new Error('Sign in not ready');
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === 'complete') {
        await setSignInActive({ session: result.createdSessionId });
      } else {
        throw new Error('Sign in requires additional steps');
      }
    } catch (error: any) {
      const msg = error.errors?.[0]?.longMessage || error.errors?.[0]?.message || error.message || 'Login failed';
      throw new Error(msg);
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName?: string) => {
    if (!signUpLoaded || !signUp || !setSignUpActive) throw new Error('Sign up not ready');
    try {
      const result = await signUp.create({ emailAddress: email, password, firstName, lastName });
      if (result.status === 'complete') {
        await setSignUpActive({ session: result.createdSessionId });
      } else if (result.status === 'missing_requirements') {
        // Email verification required — prepare verification email
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        throw new Error('Please check your email for a verification code.');
      } else {
        throw new Error('Registration incomplete');
      }
    } catch (error: any) {
      if (error.message?.includes('verification')) throw error;
      const msg = error.errors?.[0]?.longMessage || error.errors?.[0]?.message || error.message || 'Registration failed';
      throw new Error(msg);
    }
  };

  const signInWithGoogle = async () => {
    const redirectUrl = makeRedirectUri({ scheme: 'parrotspeak', path: 'redirect' });
    const { createdSessionId, setActive } = await startGoogleOAuth({ redirectUrl });
    if (createdSessionId && setActive) {
      await setActive({ session: createdSessionId });
    }
  };

  const loginWithApple = async () => {
    const redirectUrl = makeRedirectUri({ scheme: 'parrotspeak', path: 'redirect' });
    const { createdSessionId, setActive } = await startAppleOAuth({ redirectUrl });
    if (createdSessionId && setActive) {
      await setActive({ session: createdSessionId });
    }
  };

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
    if (!signInLoaded || !signIn) return { success: false, message: 'Not ready' };
    try {
      await signIn.create({ strategy: 'reset_password_email_code', identifier: email });
      return { success: true, message: 'Check your email for a reset code.' };
    } catch (error: any) {
      const msg = error.errors?.[0]?.longMessage || error.errors?.[0]?.message || 'Failed to send reset email.';
      return { success: false, message: msg };
    }
  };

  const refreshUserData = async () => {
    if (!isSignedIn) return;
    await fetchSubscriptionData();
  };

  const signOut = async () => {
    try {
      await clerkSignOut();
      setSubscriptionData(null);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        signInWithGoogle,
        loginWithApple,
        requestPasswordReset,
        refreshUserData,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
