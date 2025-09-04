import { createContext, useContext, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/authService";
import type { User, LoginData, RegisterData } from "../types/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  refetch: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();

  // Initialize auth on app start
  useEffect(() => {
    authService.initializeAuth();
  }, []);

  // Get current user query
  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      try {
        const response = await authService.getCurrentUser();
        return response.user;
      } catch (error: any) {
        // If authentication fails, clear stored tokens
        if (error.response?.status === 401) {
          authService.logout();
        }
        throw error;
      }
    },
    enabled: authService.isAuthenticated(),
    retry: (failureCount, error: any) => {
      // Don't retry if it's an auth error
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "user"], data.user);
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
    onError: (error: any) => {
      console.error("Login failed:", error);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "user"], data.user);
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
    onError: (error: any) => {
      console.error("Registration failed:", error);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      queryClient.setQueryData(["auth", "user"], null);
      queryClient.clear(); // Clear all cached data
    },
    onError: (error: any) => {
      console.error("Logout failed:", error);
      // Even if logout fails on server, clear local data
      queryClient.setQueryData(["auth", "user"], null);
      queryClient.clear();
    },
  });

  // Logout all mutation
  const logoutAllMutation = useMutation({
    mutationFn: authService.logoutAll,
    onSuccess: () => {
      queryClient.setQueryData(["auth", "user"], null);
      queryClient.clear();
    },
    onError: (error: any) => {
      console.error("Logout all failed:", error);
      queryClient.setQueryData(["auth", "user"], null);
      queryClient.clear();
    },
  });

  // Send email verification mutation
  const sendEmailVerificationMutation = useMutation({
    mutationFn: authService.sendEmailVerification,
    onError: (error: any) => {
      console.error("Send email verification failed:", error);
    },
  });

  const login = async (data: LoginData) => {
    await loginMutation.mutateAsync(data);
  };

  const register = async (data: RegisterData) => {
    await registerMutation.mutateAsync(data);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const logoutAll = async () => {
    await logoutAllMutation.mutateAsync();
  };

  const sendEmailVerification = async () => {
    await sendEmailVerificationMutation.mutateAsync();
  };

  const isAuthenticated = authService.isAuthenticated() && !!user && !error;

  const value: AuthContextType = {
    user: user || null,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
    isAuthenticated,
    login,
    register,
    logout,
    logoutAll,
    sendEmailVerification,
    refetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}