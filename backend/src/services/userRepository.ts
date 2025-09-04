import { eq, and, or, desc, sql } from "drizzle-orm";
import { db } from "../config/database";
import { 
  users, 
  oauthProviders, 
  refreshTokens, 
  userSessions, 
  loginAttempts,
  emailVerificationCodes,
  type User,
  type InsertUser,
  type OAuthProvider,
  type InsertOAuthProvider,
  type RefreshToken,
  type InsertRefreshToken,
  type UserSession,
  type InsertUserSession,
  type LoginAttempt,
  type InsertLoginAttempt
} from "../models/authSchema";
import { randomBytes } from "crypto";

export class UserRepository {
  /**
   * Create a new user
   */
  async createUser(userData: InsertUser): Promise<User> {
    // Generate UUID for new user
    const userId = randomBytes(16).toString('hex');
    
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        id: userId,
      })
      .returning();

    return user;
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));

    return user;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    return user;
  }

  /**
   * Update user
   */
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return user;
  }

  /**
   * Update user's last login
   */
  async updateLastLogin(id: string): Promise<void> {
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, id));
  }

  /**
   * Set email verification token
   */
  async setEmailVerificationToken(id: string, token: string, expires: Date): Promise<void> {
    await db
      .update(users)
      .set({
        emailVerificationToken: token,
        emailVerificationExpires: expires,
      })
      .where(eq(users.id, id));
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.emailVerificationToken, token),
          sql`${users.emailVerificationExpires} > NOW()`
        )
      );

    if (!user) return undefined;

    const [updatedUser] = await db
      .update(users)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      })
      .where(eq(users.id, user.id))
      .returning();

    return updatedUser;
  }

  /**
   * Set password reset token
   */
  async setPasswordResetToken(id: string, token: string, expires: Date): Promise<void> {
    await db
      .update(users)
      .set({
        passwordResetToken: token,
        passwordResetExpires: expires,
      })
      .where(eq(users.id, id));
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, newPassword: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.passwordResetToken, token),
          sql`${users.passwordResetExpires} > NOW()`
        )
      );

    if (!user) return undefined;

    const [updatedUser] = await db
      .update(users)
      .set({
        password: newPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      })
      .where(eq(users.id, user.id))
      .returning();

    return updatedUser;
  }

  /**
   * OAuth provider operations
   */
  async createOAuthProvider(providerData: InsertOAuthProvider): Promise<OAuthProvider> {
    const [provider] = await db
      .insert(oauthProviders)
      .values(providerData)
      .returning();

    return provider;
  }

  async findOAuthProvider(provider: string, providerId: string): Promise<OAuthProvider | undefined> {
    const [oauthProvider] = await db
      .select()
      .from(oauthProviders)
      .where(
        and(
          eq(oauthProviders.provider, provider),
          eq(oauthProviders.providerId, providerId)
        )
      );

    return oauthProvider;
  }

  async updateOAuthProvider(id: number, updates: Partial<OAuthProvider>): Promise<OAuthProvider> {
    const [provider] = await db
      .update(oauthProviders)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(oauthProviders.id, id))
      .returning();

    return provider;
  }

  /**
   * Refresh token operations
   */
  async createRefreshToken(tokenData: InsertRefreshToken): Promise<RefreshToken> {
    const [token] = await db
      .insert(refreshTokens)
      .values(tokenData)
      .returning();

    return token;
  }

  async findRefreshToken(token: string): Promise<RefreshToken | undefined> {
    const [refreshToken] = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.token, token),
          eq(refreshTokens.isRevoked, false),
          sql`${refreshTokens.expiresAt} > NOW()`
        )
      );

    return refreshToken;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ isRevoked: true })
      .where(eq(refreshTokens.token, token));
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ isRevoked: true })
      .where(eq(refreshTokens.userId, userId));
  }

  /**
   * User session operations
   */
  async createUserSession(sessionData: InsertUserSession): Promise<UserSession> {
    const [session] = await db
      .insert(userSessions)
      .values(sessionData)
      .returning();

    return session;
  }

  async findUserSession(sessionToken: string): Promise<UserSession | undefined> {
    const [session] = await db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.sessionToken, sessionToken),
          eq(userSessions.isActive, true),
          sql`${userSessions.expiresAt} > NOW()`
        )
      );

    return session;
  }

  async updateSessionAccess(sessionToken: string): Promise<void> {
    await db
      .update(userSessions)
      .set({ lastAccessedAt: new Date() })
      .where(eq(userSessions.sessionToken, sessionToken));
  }

  async deactivateSession(sessionToken: string): Promise<void> {
    await db
      .update(userSessions)
      .set({ isActive: false })
      .where(eq(userSessions.sessionToken, sessionToken));
  }

  async deactivateAllUserSessions(userId: string): Promise<void> {
    await db
      .update(userSessions)
      .set({ isActive: false })
      .where(eq(userSessions.userId, userId));
  }

  /**
   * Login attempt tracking
   */
  async recordLoginAttempt(attemptData: InsertLoginAttempt): Promise<LoginAttempt> {
    const [attempt] = await db
      .insert(loginAttempts)
      .values(attemptData)
      .returning();

    return attempt;
  }

  async getRecentFailedAttempts(email: string, ipAddress: string, minutes: number = 15): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(loginAttempts)
      .where(
        and(
          or(
            eq(loginAttempts.email, email),
            eq(loginAttempts.ipAddress, ipAddress)
          ),
          eq(loginAttempts.success, false),
          sql`${loginAttempts.createdAt} > NOW() - INTERVAL '${minutes} minutes'`
        )
      );

    return result.count;
  }

  /**
   * Email verification code operations
   */
  async createEmailVerificationCode(email: string, code: string, expiresAt: Date): Promise<void> {
    // Invalidate previous codes
    await db
      .update(emailVerificationCodes)
      .set({ verified: true })
      .where(eq(emailVerificationCodes.email, email));

    // Create new code
    await db
      .insert(emailVerificationCodes)
      .values({
        email,
        code,
        expiresAt,
      });
  }

  async verifyEmailCode(email: string, code: string): Promise<boolean> {
    const [verificationCode] = await db
      .select()
      .from(emailVerificationCodes)
      .where(
        and(
          eq(emailVerificationCodes.email, email),
          eq(emailVerificationCodes.code, code),
          eq(emailVerificationCodes.verified, false),
          sql`${emailVerificationCodes.expiresAt} > NOW()`
        )
      );

    if (!verificationCode) {
      // Increment attempts for existing codes
      await db
        .update(emailVerificationCodes)
        .set({ attempts: sql`${emailVerificationCodes.attempts} + 1` })
        .where(
          and(
            eq(emailVerificationCodes.email, email),
            eq(emailVerificationCodes.code, code)
          )
        );
      return false;
    }

    // Mark as verified
    await db
      .update(emailVerificationCodes)
      .set({ verified: true })
      .where(eq(emailVerificationCodes.id, verificationCode.id));

    return true;
  }

  /**
   * Clean up expired tokens and sessions
   */
  async cleanupExpiredData(): Promise<void> {
    const now = new Date();

    // Clean up expired refresh tokens
    await db
      .delete(refreshTokens)
      .where(sql`${refreshTokens.expiresAt} < ${now}`);

    // Clean up expired sessions
    await db
      .delete(userSessions)
      .where(sql`${userSessions.expiresAt} < ${now}`);

    // Clean up old login attempts (older than 30 days)
    await db
      .delete(loginAttempts)
      .where(sql`${loginAttempts.createdAt} < ${now} - INTERVAL '30 days'`);

    // Clean up expired verification codes
    await db
      .delete(emailVerificationCodes)
      .where(sql`${emailVerificationCodes.expiresAt} < ${now}`);
  }
}

export const userRepository = new UserRepository();