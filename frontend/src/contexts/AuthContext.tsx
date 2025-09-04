import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, authApi, TokenManager } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; message?: string }>;
  resendVerification: (email: string) => Promise<{ success: boolean; message?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user && !!TokenManager.getAccessToken();

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = TokenManager.getAccessToken();
      
      if (token && !TokenManager.isTokenExpired(token)) {
        try {
          const response = await authApi.getProfile();
          if (response.data.success && response.data.data) {
            setUser(response.data.data);
          }
        } catch (error) {
          console.error('Failed to load user:', error);
          TokenManager.clearTokens();
        }
      }
      
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      
      if (response.data.success) {
        const { user: userData, tokens } = response.data;
        
        TokenManager.setTokens(tokens.accessToken, tokens.refreshToken);
        setUser(userData);
        
        return { success: true };
      }
      
      return { success: false, message: response.data.message };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      const response = await authApi.register({ email, password, firstName, lastName });
      
      if (response.data.success) {
        return { success: true, message: response.data.message };
      }
      
      return { success: false, message: response.data.message };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = async () => {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      TokenManager.clearTokens();
      setUser(null);
    }
  };

  const logoutAll = async () => {
    try {
      await authApi.logoutAll();
    } catch (error) {
      console.error('Logout all error:', error);
    } finally {
      TokenManager.clearTokens();
      setUser(null);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const response = await authApi.forgotPassword(email);
      
      if (response.data.success) {
        return { success: true, message: response.data.message };
      }
      
      return { success: false, message: response.data.message };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to send reset email' 
      };
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      const response = await authApi.resetPassword(token, password);
      
      if (response.data.success) {
        return { success: true, message: response.data.message };
      }
      
      return { success: false, message: response.data.message };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Password reset failed' 
      };
    }
  };

  const resendVerification = async (email: string) => {
    try {
      const response = await authApi.resendVerification(email);
      
      if (response.data.success) {
        return { success: true, message: response.data.message };
      }
      
      return { success: false, message: response.data.message };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to resend verification email' 
      };
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.getProfile();
      if (response.data.success && response.data.data) {
        setUser(response.data.data);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      TokenManager.clearTokens();
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    logoutAll,
    forgotPassword,
    resetPassword,
    resendVerification,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};