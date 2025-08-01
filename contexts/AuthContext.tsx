import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
  subscriptionStatus?: string;
  subscriptionTier?: string;
  subscriptionExpiresAt?: Date;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
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
      // For development, auto-login the demo user to establish server session
      await login('demo@parrotspeak.com', 'demo-password');
    } catch (error) {
      console.error('Auth check failed:', error);
      // Fallback to local demo user if server login fails
      setUser({
        id: '1',
        email: 'demo@parrotspeak.com',
        name: 'Demo User',
        subscriptionStatus: 'active',
        subscriptionTier: 'premium',
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Make actual API call to establish server session
      const response = await fetch('https://40e9270e-7819-4d9e-8fa8-ccb157c79dd9-00-luj1g8wui2hi.worf.replit.dev/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for session cookies
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser({
          id: userData.id || '1',
          email: userData.email || email,
          name: userData.name || 'Demo User',
          subscriptionStatus: 'active',
          subscriptionTier: 'premium',
          subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      // For demo purposes, fall back to local user
      console.log('Server login failed, using local demo user');
      setUser({
        id: '1',
        email,
        name: 'Demo User',
        subscriptionStatus: 'active',
        subscriptionTier: 'premium',
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    }
  };

  const register = async (email: string, password: string) => {
    try {
      // TODO: Implement actual register API call
      setUser({
        id: '1',
        email,
        name: 'Demo User',
        subscriptionStatus: 'active',
        subscriptionTier: 'premium',
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    } catch (error) {
      throw new Error('Registration failed');
    }
  };

  const logout = async () => {
    try {
      // TODO: Implement actual logout API call
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
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