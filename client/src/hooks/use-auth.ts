import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { User } from "@shared/schema";

export function useAuth() {
  // Query to fetch the current logged-in user
  const { 
    data: user, 
    isLoading, 
    error 
  } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    // Treat 401 responses as successful but returning null
    queryFn: async ({ queryKey }) => {
      const url = queryKey[0] as string;
      const response = await fetch(url);
      if (response.status === 401) {
        return null;
      }
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      const data = await response.json();
      return data.user || data;
    },
  });

  // Mutation to register a new user
  const registerMutation = useMutation({
    mutationFn: async (userData: { 
      email: string; 
      username: string; 
      password: string;
      firstName?: string;
      lastName?: string; 
    }) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/user"], data.user || data);
    },
  });

  // Mutation to log in
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/user"], data.user || data);
    },
  });

  // Mutation to log out
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    register: registerMutation.mutate,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    registerStatus: registerMutation.isPending ? "pending" : registerMutation.isError ? "error" : registerMutation.isSuccess ? "success" : "idle",
    loginStatus: loginMutation.isPending ? "pending" : loginMutation.isError ? "error" : loginMutation.isSuccess ? "success" : "idle",
    logoutStatus: logoutMutation.isPending ? "pending" : logoutMutation.isError ? "error" : logoutMutation.isSuccess ? "success" : "idle",
    registerError: registerMutation.error,
    loginError: loginMutation.error,
    logoutError: logoutMutation.error,
  };
}