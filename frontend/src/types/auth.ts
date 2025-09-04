export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  emailVerified: boolean;
  subscriptionTier: string;
  reputation: number;
  wisdomPoints: number;
  totalPosts: number;
  totalComments: number;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  accessToken: string;
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface EmailVerificationData {
  email: string;
  code: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface RefreshTokenResponse {
  message: string;
  accessToken: string;
}