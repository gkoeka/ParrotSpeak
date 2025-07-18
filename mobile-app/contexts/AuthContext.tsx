import React, { createContext, useState, useEffect, useContext } from "react";
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
  RegisterCredentials,
} from "../api/authService";

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

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // On mount: load user (unauth = normal, not error)
  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const currentUser = await getCurrentUser();
        if (!isMounted) return;
        setUser(currentUser); // currentUser may be null (unauth), that's fine
      } catch (err) {
        if (!isMounted) return;
        // Only set error for network/server issues
        setError(err instanceof Error ? err : new Error("Failed to load user"));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  // Generic handler template for all actions
  const runWithLoading = async <T,>(
    action: () => Promise<T>,
    setUserOnSuccess?: (data: T) => void,
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await action();
      if (setUserOnSuccess) setUserOnSuccess(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown auth error"));
      throw err; // Optional: throw if you want UI to handle further
    } finally {
      setIsLoading(false);
    }
  };

  // Auth actions
  const handleLogin = async (credentials: LoginCredentials) => {
    await runWithLoading(async () => {
      const loggedInUser = await login(credentials);
      if (!loggedInUser) throw new Error("Invalid email or password");
      setUser(loggedInUser);
      return loggedInUser;
    });
  };

  const handleRegister = async (credentials: RegisterCredentials) => {
    await runWithLoading(async () => {
      const registeredUser = await register(credentials);
      if (!registeredUser) throw new Error("Registration failed. Please check your details and try again.");
      setUser(registeredUser);
      return registeredUser;
    });
  };

  const handleGoogleLogin = async () => {
    await runWithLoading(async () => {
      const googleUser = await loginWithGoogle();
      if (!googleUser) throw new Error("Google login failed");
      setUser(googleUser);
    });
  };

  const handleAppleLogin = async () => {
    await runWithLoading(async () => {
      const appleUser = await loginWithApple();
      if (!appleUser) throw new Error("Apple login failed");
      setUser(appleUser);
    });
  };

  const handleLogout = async () => {
    await runWithLoading(async () => {
      await logout();
      setUser(null);
    });
  };

  const value: AuthContextType = {
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
