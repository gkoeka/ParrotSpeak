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
  register: (email: string, password: string, firstName: string, lastName?: string) => Promise<void>;
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
      // Import the real auth service
      const { getCurrentUser } = await import('../api/authService');
      
      // Check if user is already logged in
      const userData = await getCurrentUser();
      if (userData) {
        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : userData.email,
          subscriptionStatus: userData.subscriptionStatus || 'free',
          subscriptionTier: userData.subscriptionTier,
          subscriptionExpiresAt: userData.subscriptionExpiresAt ? new Date(userData.subscriptionExpiresAt) : null
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // User not authenticated, leave user as null
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
        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : userData.email,
          subscriptionStatus: userData.subscriptionStatus || 'free',
          subscriptionTier: userData.subscriptionTier,
          subscriptionExpiresAt: userData.subscriptionExpiresAt ? new Date(userData.subscriptionExpiresAt) : null
        });
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
        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : userData.email,
          subscriptionStatus: userData.subscriptionStatus || 'free',
          subscriptionTier: userData.subscriptionTier,
          subscriptionExpiresAt: userData.subscriptionExpiresAt ? new Date(userData.subscriptionExpiresAt) : null
        });
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw new Error('Registration failed. Please try again.');
    }
  };

  const logout = async () => {
    try {
      // Import the real auth service
      const { logout: apiLogout } = await import('../api/authService');
      
      // Make actual API call using the auth service
      await apiLogout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout API fails, clear local user state
      setUser(null);
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