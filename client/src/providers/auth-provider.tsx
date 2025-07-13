import React, { createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { User as UserSchema } from "@shared/schema";

// Use a simplified User type or exact copy of User from schema to avoid conflicts
type User = UserSchema;

// Define the context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  register: (userData: { 
    email: string; 
    username: string; 
    password: string;
    firstName?: string;
    lastName?: string;
  }) => void;
  login: (credentials: { email: string; password: string }) => void;
  logout: () => void;
  loginStatus: "idle" | "pending" | "success" | "error";
  registerStatus: "idle" | "pending" | "success" | "error";
  loginError: Error | null;
  registerError: Error | null;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    user,
    isLoading,
    isAuthenticated,
    register,
    login,
    logout,
    loginStatus,
    registerStatus,
    loginError,
    registerError,
  } = useAuth();
  
  // Safely handle undefined user by converting to null
  const safeUser = user === undefined ? null : user;

  // Show toast notifications for authentication errors
  React.useEffect(() => {
    if (loginError) {
      toast({
        title: "Login failed",
        description: loginError.message,
        variant: "destructive",
      });
    }
  }, [loginError, toast]);

  React.useEffect(() => {
    if (registerError) {
      toast({
        title: "Registration failed",
        description: registerError.message,
        variant: "destructive",
      });
    }
  }, [registerError, toast]);

  // Convert status strings to the expected status types
  const convertStatus = (status: string): "idle" | "pending" | "success" | "error" => {
    if (status === "pending" || status === "loading") return "pending";
    if (status === "error") return "error";
    if (status === "success") return "success";
    return "idle";
  };

  // Provide the authentication context to children
  return (
    <AuthContext.Provider
      value={{
        user: safeUser,
        isLoading,
        isAuthenticated,
        register,
        login,
        logout,
        loginStatus: convertStatus(loginStatus),
        registerStatus: convertStatus(registerStatus),
        loginError,
        registerError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Create a hook for using the auth context
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}