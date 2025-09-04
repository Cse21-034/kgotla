import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { eq, and, gt } from 'drizzle-orm';
import db from '@/config/database';
import { users, emailVerificationTokens, passwordResetTokens, refreshTokens } from '@/shared/schema';
import { emailService } from '@/services/emailService';
import { generateTokens } from '@/middleware/auth';

export class AuthService {
  async registerUser(email: string, password: string, firstName?: string, lastName?: string) {
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (existingUser.length > 0) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Generate user ID
    const userId = `user_${crypto.randomUUID()}`;

    // Create user
    const newUser = await db.insert(users).values({
      id: userId,
      email,
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
      authProvider: 'email',
      isEmailVerified: false
    }).returning();

    // Generate email verification token
    await this.generateEmailVerificationToken(email);

    return newUser[0];
  }

  async loginUser(email: string, password: string) {
    const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (userResult.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = userResult[0];
    
    if (!user.password) {
      throw new Error('Please use Google login for this account');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    if (!user.isEmailVerified) {
      throw new Error('Please verify your email before logging in');
    }

    // Update last login
    await db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    // Generate tokens
    const tokens = generateTokens(user.id);
    
    // Store refresh token
    await db.insert(refreshTokens).values({
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    return { user, tokens };
  }

  async generateEmailVerificationToken(email: string) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Remove existing tokens for this email
    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.email, email));

    // Create new token
    await db.insert(emailVerificationTokens).values({
      email,
      token,
      expiresAt
    });

    // Send verification email
    await emailService.sendVerificationEmail(email, token);

    return token;
  }

  async verifyEmail(token: string) {
    const tokenResult = await db.select()
      .from(emailVerificationTokens)
      .where(and(
        eq(emailVerificationTokens.token, token),
        gt(emailVerificationTokens.expiresAt, new Date())
      ))
      .limit(1);

    if (tokenResult.length === 0) {
      throw new Error('Invalid or expired verification token');
    }

    const emailToken = tokenResult[0];
    
    // Update user as verified
    await db.update(users)
      .set({ isEmailVerified: true })
      .where(eq(users.email, emailToken.email));

    // Delete the token
    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, emailToken.id));

    return true;
  }

  async generatePasswordResetToken(email: string) {
    const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (userResult.length === 0) {
      throw new Error('User not found');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Remove existing tokens for this email
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.email, email));

    // Create new token
    await db.insert(passwordResetTokens).values({
      email,
      token,
      expiresAt
    });

    // Send password reset email
    await emailService.sendPasswordResetEmail(email, token);

    return token;
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenResult = await db.select()
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.isUsed, false),
        gt(passwordResetTokens.expiresAt, new Date())
      ))
      .limit(1);

    if (tokenResult.length === 0) {
      throw new Error('Invalid or expired reset token');
    }

    const resetToken = tokenResult[0];
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update user password
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.email, resetToken.email));

    // Mark token as used
    await db.update(passwordResetTokens)
      .set({ isUsed: true })
      .where(eq(passwordResetTokens.id, resetToken.id));

    return true;
  }

  async refreshAccessToken(refreshToken: string) {
    const tokenResult = await db.select()
      .from(refreshTokens)
      .where(and(
        eq(refreshTokens.token, refreshToken),
        eq(refreshTokens.isRevoked, false),
        gt(refreshTokens.expiresAt, new Date())
      ))
      .limit(1);

    if (tokenResult.length === 0) {
      throw new Error('Invalid or expired refresh token');
    }

    const token = tokenResult[0];
    
    // Generate new access token
    const newTokens = generateTokens(token.userId);
    
    // Revoke old refresh token
    await db.update(refreshTokens)
      .set({ isRevoked: true })
      .where(eq(refreshTokens.id, token.id));
    
    // Store new refresh token
    await db.insert(refreshTokens).values({
      userId: token.userId,
      token: newTokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    return newTokens;
  }

  async logoutUser(refreshToken: string) {
    await db.update(refreshTokens)
      .set({ isRevoked: true })
      .where(eq(refreshTokens.token, refreshToken));
  }

  async logoutAllDevices(userId: string) {
    await db.update(refreshTokens)
      .set({ isRevoked: true })
      .where(eq(refreshTokens.userId, userId));
  }
}

export const authService = new AuthService();