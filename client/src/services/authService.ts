import { apiClient } from "./apiClient";
import type {
  User,
  AuthResponse,
  LoginData,
  RegisterData,
  ForgotPasswordData,
  ResetPasswordData,
  EmailVerificationData,
  ChangePasswordData,
  RefreshTokenResponse,
} from "../types/auth";

class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/register", data);
    if (response.accessToken) {
      apiClient.setAccessToken(response.accessToken);
    }
    return response;
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/login", data);
    if (response.accessToken) {
      apiClient.setAccessToken(response.accessToken);
    }
    return response;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      apiClient.clearAuth();
    }
  }

  /**
   * Logout from all devices
   */
  async logoutAll(): Promise<void> {
    try {
      await apiClient.post("/auth/logout-all");
    } finally {
      apiClient.clearAuth();
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<RefreshTokenResponse> {
    const response = await apiClient.post<RefreshTokenResponse>("/auth/refresh");
    if (response.accessToken) {
      apiClient.setAccessToken(response.accessToken);
    }
    return response;
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<{ user: User }> {
    return await apiClient.get<{ user: User }>("/auth/me");
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(): Promise<{ message: string }> {
    return await apiClient.post<{ message: string }>("/auth/send-verification");
  }

  /**
   * Verify email with code
   */
  async verifyEmail(data: EmailVerificationData): Promise<{ message: string; user: User }> {
    return await apiClient.post<{ message: string; user: User }>("/auth/verify-email", data);
  }

  /**
   * Request password reset
   */
  async forgotPassword(data: ForgotPasswordData): Promise<{ message: string }> {
    return await apiClient.post<{ message: string }>("/auth/forgot-password", data);
  }

  /**
   * Reset password
   */
  async resetPassword(data: ResetPasswordData): Promise<{ message: string; user: User }> {
    return await apiClient.post<{ message: string; user: User }>("/auth/reset-password", data);
  }

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    return await apiClient.post<{ message: string }>("/auth/change-password", data);
  }

  /**
   * Initialize Google OAuth
   */
  initiateGoogleAuth(): void {
    window.location.href = `${apiClient["client"].defaults.baseURL}/auth/google`;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!apiClient.getAccessToken();
  }

  /**
   * Initialize auth state from stored token
   */
  initializeAuth(): void {
    const token = apiClient.getAccessToken();
    if (token) {
      apiClient.setAccessToken(token);
    }
  }
}

export const authService = new AuthService();