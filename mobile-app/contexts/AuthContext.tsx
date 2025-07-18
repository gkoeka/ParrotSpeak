import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  User, 
  login, 
  register, 
  logout, 
  getCurrentUser, 
  validateSession, 
  loginWithGoogle,
  loginWithApple,
  LoginCredentials, 
  RegisterCredentials 
} from '../api/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => Promise<void>;
}

// Create context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  loginWithGoogle: async () => {},
  loginWithApple: async () => {},
  logout: async () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Check for existing session on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        // First try to get stored user
        const storedUser = await getCurrentUser();
        
        if (storedUser) {
          // Then validate with the server
          const validatedUser = await validateSession();
          if (validatedUser) {
            setUser(validatedUser);
          }
        }
        // No error for unauthenticated users - this is normal
      } catch (err) {
        console.error('Auth initialization error:', err);
        // Don't set error for normal unauthenticated state
        if (err instanceof Error && !err.message.includes('401') && !err.message.includes('Failed to get user')) {
          setError(err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      const loggedInUser = await login(credentials);
      setUser(loggedInUser);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Login failed'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const handleRegister = async (credentials: RegisterCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      const registeredUser = await register(credentials);
      setUser(registeredUser);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Registration failed'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Google login function
  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const googleUser = await loginWithGoogle();
      setUser(googleUser);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Google login failed'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Apple login function
  const handleAppleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const appleUser = await loginWithApple();
      setUser(appleUser);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Apple login failed'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await logout();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Logout failed'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Value to be provided to consumers
  const value = {
    user,
    isLoading,
    error,
    login: handleLogin,
    register: handleRegister,
    loginWithGoogle: handleGoogleLogin,
    loginWithApple: handleAppleLogin,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};