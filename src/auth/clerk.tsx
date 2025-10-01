import React from 'react';
import { ClerkProvider as BaseClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const tokenCache = {
  getToken: async (key: string) => {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  saveToken: async (key: string, value: string) => {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  const publishableKey = Constants.expoConfig?.extra?.CLERK_PUBLISHABLE_KEY;
  
  if (!publishableKey) {
    throw new Error('Missing CLERK_PUBLISHABLE_KEY in app.config.js');
  }

  return (
    <BaseClerkProvider
      publishableKey={publishableKey}
      tokenCache={tokenCache}
    >
      {children}
    </BaseClerkProvider>
  );
}