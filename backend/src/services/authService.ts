import { userRepository } from "./userRepository";
import { tokenService } from "./tokenService";
import { passwordService } from "./passwordService";
import { emailService } from "./emailService";
import { env } from "../config/env";
import type { 
  User, 
  InsertUser, 
  LoginData, 
  RegisterData, 
  ForgotPasswordData, 
  ResetPasswordData,
  EmailVerificationData,
  InsertOAuthProvider 
} from "../models/authSchema";

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface AuthError {
  message: string;
  code: string;
}

export class AuthService {
  /**
   * Register a new user with email/password
   */
  async register(data: RegisterData, ipAddress: string): Promise<AuthResult> {
    // Check if user already exists
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Validate password strength
    const passwordValidation = passwordService.validatePasswordStrength(data.password);
    if (!passwordValidation.isValid) {
      throw new Error(`Weak password: ${passwordValidation.errors.join(", ")}`);
    }

    // Hash password
    const hashedPassword = await passwordService.hashPassword(data.password);

    // Create user
    const userData: InsertUser = {
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      emailVerified: false,
    };

    const user = await userRepository.createUser(userData);

    // Send email verification
    await this.sendEmailVerification(user.email);

    // Generate tokens
    const accessToken = tokenService.generateAccessToken(user);
    const refreshToken = tokenService.generateRefreshToken(user);

    // Store refresh token
    await userRepository.createRefreshToken({
      userId: user.id,
      token: refreshToken,
      expiresAt: tokenService.getTokenExpiration(env.JWT_REFRESH_EXPIRES_IN),
      ipAddress,
    });

    // Send welcome email (don't await to avoid blocking)
    emailService.sendWelcomeEmail(user.email, user.firstName || "").catch(console.error);

    return { user, accessToken, refreshToken };
  }

  /**
   * Login with email/password
   */
  async login(data: LoginData, ipAddress: string, userAgent?: string): Promise<AuthResult> {
    // Check rate limiting
    const failedAttempts = await userRepository.getRecentFailedAttempts(data.email, ipAddress);
    if (failedAttempts >= 5) {
      await userRepository.recordLoginAttempt({
        email: data.email,
        ipAddress,
        userAgent,
        success: false,
        failureReason: "rate_limited",
      });
      throw new Error("Too many failed login attempts. Please try again later.");
    }

    // Find user
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      await userRepository.recordLoginAttempt({
        email: data.email,
        ipAddress,
        userAgent,
        success: false,
        failureReason: "user_not_found",
      });
      throw new Error("Invalid email or password");
    }

    // Check password
    if (!user.password || !await passwordService.verifyPassword(data.password, user.password)) {
      await userRepository.recordLoginAttempt({
        email: data.email,
        ipAddress,
        userAgent,
        success: false,
        failureReason: "invalid_password",
      });
      throw new Error("Invalid email or password");
    }

    // Record successful login
    await userRepository.recordLoginAttempt({
      email: data.email,
      ipAddress,
      userAgent,
      success: true,
    });

    // Update last login
    await userRepository.updateLastLogin(user.id);

    // Generate tokens
    const accessToken = tokenService.generateAccessToken(user);
    const refreshToken = tokenService.generateRefreshToken(user);

    // Store refresh token
    await userRepository.createRefreshToken({
      userId: user.id,
      token: refreshToken,
      expiresAt: tokenService.getTokenExpiration(env.JWT_REFRESH_EXPIRES_IN),
      ipAddress,
    });

    return { user, accessToken, refreshToken };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshTokenString: string): Promise<Pick<AuthResult, "accessToken" | "refreshToken">> {
    // Verify refresh token
    const payload = tokenService.verifyRefreshToken(refreshTokenString);
    
    // Check if token exists in database and is not revoked
    const storedToken = await userRepository.findRefreshToken(refreshTokenString);
    if (!storedToken) {
      throw new Error("Invalid refresh token");
    }

    // Get user
    const user = await userRepository.findById(payload.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Generate new tokens
    const accessToken = tokenService.generateAccessToken(user);
    const newRefreshToken = tokenService.generateRefreshToken(user);

    // Revoke old refresh token and create new one
    await userRepository.revokeRefreshToken(refreshTokenString);
    await userRepository.createRefreshToken({
      userId: user.id,
      token: newRefreshToken,
      expiresAt: tokenService.getTokenExpiration(env.JWT_REFRESH_EXPIRES_IN),
      ipAddress: storedToken.ipAddress,
      deviceInfo: storedToken.deviceInfo,
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  /**
   * Logout user
   */
  async logout(refreshTokenString: string): Promise<void> {
    await userRepository.revokeRefreshToken(refreshTokenString);
  }

  /**
   * Logout user from all devices
   */
  async logoutAllDevices(userId: string): Promise<void> {
    await userRepository.revokeAllUserTokens(userId);
    await userRepository.deactivateAllUserSessions(userId);
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(email: string): Promise<void> {
    const code = tokenService.generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await userRepository.createEmailVerificationCode(email, code, expiresAt);
    await emailService.sendEmailVerification(email, code);
  }

  /**
   * Verify email with code
   */
  async verifyEmail(data: EmailVerificationData): Promise<User> {
    // Verify code
    const isValidCode = await userRepository.verifyEmailCode(data.email, data.code);
    if (!isValidCode) {
      throw new Error("Invalid or expired verification code");
    }

    // Update user as verified
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      throw new Error("User not found");
    }

    return await userRepository.updateUser(user.id, { emailVerified: true });
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(data: ForgotPasswordData): Promise<void> {
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      // Don't reveal that email doesn't exist
      return;
    }

    const token = tokenService.generateSecureToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await userRepository.setPasswordResetToken(user.id, token, expires);
    
    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;
    await emailService.sendPasswordReset(data.email, resetUrl);
  }

  /**
   * Reset password
   */
  async resetPassword(data: ResetPasswordData): Promise<User> {
    // Validate password strength
    const passwordValidation = passwordService.validatePasswordStrength(data.password);
    if (!passwordValidation.isValid) {
      throw new Error(`Weak password: ${passwordValidation.errors.join(", ")}`);
    }

    // Hash new password
    const hashedPassword = await passwordService.hashPassword(data.password);

    // Reset password
    const user = await userRepository.resetPassword(data.token, hashedPassword);
    if (!user) {
      throw new Error("Invalid or expired reset token");
    }

    // Revoke all refresh tokens for security
    await userRepository.revokeAllUserTokens(user.id);

    return user;
  }

  /**
   * Google OAuth authentication
   */
  async authenticateWithGoogle(profile: any, accessToken: string, refreshToken: string): Promise<AuthResult> {
    const email = profile.emails?.[0]?.value;
    const googleId = profile.id;

    if (!email) {
      throw new Error("No email provided by Google");
    }

    // Check if OAuth provider already exists
    let oauthProvider = await userRepository.findOAuthProvider("google", googleId);
    
    if (oauthProvider) {
      // Update OAuth tokens
      await userRepository.updateOAuthProvider(oauthProvider.id, {
        accessToken,
        refreshToken,
        tokenExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      });

      // Get user
      const user = await userRepository.findById(oauthProvider.userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Generate JWT tokens
      const jwtAccessToken = tokenService.generateAccessToken(user);
      const jwtRefreshToken = tokenService.generateRefreshToken(user);

      // Store refresh token
      await userRepository.createRefreshToken({
        userId: user.id,
        token: jwtRefreshToken,
        expiresAt: tokenService.getTokenExpiration(env.JWT_REFRESH_EXPIRES_IN),
      });

      return { user, accessToken: jwtAccessToken, refreshToken: jwtRefreshToken };
    }

    // Check if user exists with this email
    let user = await userRepository.findByEmail(email);

    if (!user) {
      // Create new user
      const userData: InsertUser = {
        email,
        firstName: profile.name?.givenName,
        lastName: profile.name?.familyName,
        profileImageUrl: profile.photos?.[0]?.value,
        emailVerified: true, // Google emails are pre-verified
      };

      user = await userRepository.createUser(userData);
    }

    // Create OAuth provider record
    const oauthData: InsertOAuthProvider = {
      userId: user.id,
      provider: "google",
      providerId: googleId,
      accessToken,
      refreshToken,
      tokenExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    };

    await userRepository.createOAuthProvider(oauthData);

    // Generate JWT tokens
    const jwtAccessToken = tokenService.generateAccessToken(user);
    const jwtRefreshToken = tokenService.generateRefreshToken(user);

    // Store refresh token
    await userRepository.createRefreshToken({
      userId: user.id,
      token: jwtRefreshToken,
      expiresAt: tokenService.getTokenExpiration(env.JWT_REFRESH_EXPIRES_IN),
    });

    return { user, accessToken: jwtAccessToken, refreshToken: jwtRefreshToken };
  }

  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    if (!user.password || !await passwordService.verifyPassword(currentPassword, user.password)) {
      throw new Error("Current password is incorrect");
    }

    // Validate new password
    const passwordValidation = passwordService.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(`Weak password: ${passwordValidation.errors.join(", ")}`);
    }

    // Hash new password
    const hashedPassword = await passwordService.hashPassword(newPassword);

    // Update password
    await userRepository.updateUser(userId, { password: hashedPassword });

    // Revoke all refresh tokens for security
    await userRepository.revokeAllUserTokens(userId);
  }
}

export const authService = new AuthService();