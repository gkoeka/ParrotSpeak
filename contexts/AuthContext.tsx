import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SecureStorage } from '../utils/secureStorage';

interface User {
  id: string;
  email: string;
  name?: string;
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
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  refreshUserData: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Check for existing session
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check for stored user data first for faster UI response
      const storedUserData = await SecureStorage.getUserData();
      if (storedUserData) {
        setUser(storedUserData);
        setIsLoading(false);
      }

      // Then validate with server
      const { getCurrentUser } = await import('../api/authService');
      const userData = await getCurrentUser();
      
      if (userData) {
        const userInfo = {
          id: userData.id,
          email: userData.email,
          name: userData.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : userData.email,
          subscriptionStatus: userData.subscriptionStatus || 'free',
          subscriptionTier: userData.subscriptionTier,
          subscriptionExpiresAt: userData.subscriptionExpiresAt ? new Date(userData.subscriptionExpiresAt) : null,
          previewExpiresAt: userData.previewExpiresAt ? new Date(userData.previewExpiresAt) : null,
          hasUsedPreview: userData.hasUsedPreview || false,
          previewStartedAt: userData.previewStartedAt ? new Date(userData.previewStartedAt) : null
        };
        setUser(userInfo);
        // Update stored user data
        await SecureStorage.setUserData(userInfo);
      } else {
        // Server says no user, clear stored data
        await SecureStorage.clearAuthData();
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // On network error, keep stored user if available
      const storedUserData = await SecureStorage.getUserData();
      if (!storedUserData) {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Import the real auth service
      const { login: apiLogin } = await import('../api/authService');
      
      // Make actual API call using the auth service
      const response = await apiLogin({ email, password });
      
      if (response && response.user) {
        const userData = response.user;
        const userInfo = {
          id: userData.id,
          email: userData.email,
          name: userData.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : userData.email,
          subscriptionStatus: userData.subscriptionStatus || 'free',
          subscriptionTier: userData.subscriptionTier,
          subscriptionExpiresAt: userData.subscriptionExpiresAt ? new Date(userData.subscriptionExpiresAt) : null,
          previewExpiresAt: userData.previewExpiresAt ? new Date(userData.previewExpiresAt) : null,
          hasUsedPreview: userData.hasUsedPreview || false,
          previewStartedAt: userData.previewStartedAt ? new Date(userData.previewStartedAt) : null
        };
        setUser(userInfo);
        // Store user data for persistence
        await SecureStorage.setUserData(userInfo);
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Login failed. Please check your email and password.');
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName?: string) => {
    try {
      // Import the real auth service
      const { register: apiRegister } = await import('../api/authService');
      
      // Make actual API call using the auth service
      const response = await apiRegister({ email, password, firstName, lastName });
      
      if (response && response.user) {
        const userData = response.user;
        const userInfo = {
          id: userData.id,
          email: userData.email,
          name: userData.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : userData.email,
          subscriptionStatus: userData.subscriptionStatus || 'free',
          subscriptionTier: userData.subscriptionTier,
          subscriptionExpiresAt: userData.subscriptionExpiresAt ? new Date(userData.subscriptionExpiresAt) : null,
          previewExpiresAt: userData.previewExpiresAt ? new Date(userData.previewExpiresAt) : null,
          hasUsedPreview: userData.hasUsedPreview || false,
          previewStartedAt: userData.previewStartedAt ? new Date(userData.previewStartedAt) : null
        };
        setUser(userInfo);
        // Store user data for persistence
        await SecureStorage.setUserData(userInfo);
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw new Error('Registration failed. Please try again.');
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { OAuthService } = await import('../services/oauthService');
      const response = await OAuthService.signInWithGoogle();
      
      if (response && response.user) {
        const userData = response.user;
        const userInfo = {
          id: userData.id,
          email: userData.email,
          name: userData.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : userData.email,
          subscriptionStatus: userData.subscriptionStatus || 'free',
          subscriptionTier: userData.subscriptionTier,
          subscriptionExpiresAt: userData.subscriptionExpiresAt ? new Date(userData.subscriptionExpiresAt) : null,
          previewExpiresAt: userData.previewExpiresAt ? new Date(userData.previewExpiresAt) : null,
          hasUsedPreview: userData.hasUsedPreview || false,
          previewStartedAt: userData.previewStartedAt ? new Date(userData.previewStartedAt) : null
        };
        setUser(userInfo);
        await SecureStorage.setUserData(userInfo);
      }
    } catch (error) {
      console.error('Google login failed:', error);
      throw new Error('Google login failed. Please try again.');
    }
  };

  const loginWithApple = async () => {
    try {
      const { OAuthService } = await import('../services/oauthService');
      const response = await OAuthService.signInWithApple();
      
      if (response && response.user) {
        const userData = response.user;
        const userInfo = {
          id: userData.id,
          email: userData.email,
          name: userData.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : userData.email,
          subscriptionStatus: userData.subscriptionStatus || 'free',
          subscriptionTier: userData.subscriptionTier,
          subscriptionExpiresAt: userData.subscriptionExpiresAt ? new Date(userData.subscriptionExpiresAt) : null,
          previewExpiresAt: userData.previewExpiresAt ? new Date(userData.previewExpiresAt) : null,
          hasUsedPreview: userData.hasUsedPreview || false,
          previewStartedAt: userData.previewStartedAt ? new Date(userData.previewStartedAt) : null
        };
        setUser(userInfo);
        await SecureStorage.setUserData(userInfo);
      }
    } catch (error) {
      console.error('Apple login failed:', error);
      throw new Error('Apple login failed. Please try again.');
    }
  };

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { requestPasswordReset: apiRequestReset } = await import('../api/passwordResetService');
      return await apiRequestReset(email);
    } catch (error) {
      console.error('Password reset request failed:', error);
      return {
        success: false,
        message: 'Failed to send reset email. Please try again.'
      };
    }
  };

  const refreshUserData = async () => {
    if (!user) return;
    
    try {
      // Import the real auth service
      const { getCurrentUser } = await import('../api/authService');
      
      // Get fresh user data from server
      const freshUserData = await getCurrentUser();
      
      if (freshUserData) {
        const userInfo = {
          id: freshUserData.id,
          email: freshUserData.email,
          name: freshUserData.firstName ? `${freshUserData.firstName} ${freshUserData.lastName || ''}`.trim() : freshUserData.email,
          subscriptionStatus: freshUserData.subscriptionStatus || 'free',
          subscriptionTier: freshUserData.subscriptionTier,
          subscriptionExpiresAt: freshUserData.subscriptionExpiresAt ? new Date(freshUserData.subscriptionExpiresAt) : null
        };
        setUser(userInfo);
        await SecureStorage.setUserData(userInfo);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const logout = async () => {
    try {
      // Import the real auth service
      const { logout: apiLogout } = await import('../api/authService');
      const { OAuthService } = await import('../services/oauthService');
      
      // Make actual API call using the auth service
      await apiLogout();
      
      // Sign out from OAuth providers
      await OAuthService.signOutGoogle();
      await OAuthService.signOutApple();
      
      // Clear stored data
      await SecureStorage.clearAuthData();
      
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout API fails, clear local user state
      await SecureStorage.clearAuthData();
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    loginWithGoogle,
    loginWithApple,
    requestPasswordReset,
    refreshUserData,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}