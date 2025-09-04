import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  uuid,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enhanced users table with multi-provider authentication
export const users = pgTable("users", {
  // Keep existing ID structure for compatibility
  id: varchar("id").primaryKey().notNull(),
  
  // Authentication fields
  email: varchar("email").unique().notNull(),
  password: varchar("password"), // For email/password auth, null for OAuth users
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: varchar("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  
  // Profile fields (existing)
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  bio: text("bio"),
  location: varchar("location"),
  
  // Community stats (existing)
  reputation: integer("reputation").default(0),
  isVerified: boolean("is_verified").default(false),
  verificationBadge: varchar("verification_badge"), // "elder", "mentor", "expert"
  
  // Premium monetization features (existing)
  subscriptionTier: varchar("subscription_tier").default("free"),
  subscriptionExpiry: timestamp("subscription_expiry"),
  wisdomPoints: integer("wisdom_points").default(0),
  totalEarnings: integer("total_earnings").default(0),
  
  // Payment integration (existing)
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  
  // Community stats (existing)
  totalPosts: integer("total_posts").default(0),
  totalComments: integer("total_comments").default(0),
  helpfulVotes: integer("helpful_votes").default(0),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  emailVerificationTokenIdx: index("users_email_verification_token_idx").on(table.emailVerificationToken),
  passwordResetTokenIdx: index("users_password_reset_token_idx").on(table.passwordResetToken),
}));

// OAuth providers table for multi-provider support
export const oauthProviders = pgTable("oauth_providers", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  provider: varchar("provider").notNull(), // "google", "github", "facebook", etc.
  providerId: varchar("provider_id").notNull(), // Provider's user ID
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpires: timestamp("token_expires"),
  scope: varchar("scope"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userProviderIdx: index("oauth_providers_user_provider_idx").on(table.userId, table.provider),
  providerIdIdx: index("oauth_providers_provider_id_idx").on(table.provider, table.providerId),
}));

// JWT refresh tokens table
export const refreshTokens = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  isRevoked: boolean("is_revoked").default(false),
  deviceInfo: varchar("device_info"), // Store device/browser info
  ipAddress: varchar("ip_address"),
}, (table) => ({
  tokenIdx: index("refresh_tokens_token_idx").on(table.token),
  userIdx: index("refresh_tokens_user_idx").on(table.userId),
  expiresIdx: index("refresh_tokens_expires_idx").on(table.expiresAt),
}));

// User sessions table for enhanced session management
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  sessionToken: varchar("session_token").notNull().unique(),
  deviceInfo: varchar("device_info"),
  ipAddress: varchar("ip_address"),
  location: varchar("location"), // Geolocation if available
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
}, (table) => ({
  sessionTokenIdx: index("user_sessions_token_idx").on(table.sessionToken),
  userIdx: index("user_sessions_user_idx").on(table.userId),
  activeIdx: index("user_sessions_active_idx").on(table.isActive),
}));

// Login attempts table for security
export const loginAttempts = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull(),
  ipAddress: varchar("ip_address").notNull(),
  userAgent: varchar("user_agent"),
  success: boolean("success").notNull(),
  failureReason: varchar("failure_reason"), // "invalid_password", "user_not_found", etc.
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  emailIdx: index("login_attempts_email_idx").on(table.email),
  ipIdx: index("login_attempts_ip_idx").on(table.ipAddress),
  createdAtIdx: index("login_attempts_created_at_idx").on(table.createdAt),
}));

// Email verification codes table
export const emailVerificationCodes = pgTable("email_verification_codes", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull(),
  code: varchar("code", { length: 6 }).notNull(), // 6-digit verification code
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false),
  attempts: integer("attempts").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  emailIdx: index("email_verification_codes_email_idx").on(table.email),
  codeIdx: index("email_verification_codes_code_idx").on(table.code),
  expiresIdx: index("email_verification_codes_expires_idx").on(table.expiresAt),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  oauthProviders: many(oauthProviders),
  refreshTokens: many(refreshTokens),
  userSessions: many(userSessions),
}));

export const oauthProvidersRelations = relations(oauthProviders, ({ one }) => ({
  user: one(users, {
    fields: [oauthProviders.userId],
    references: [users.id],
  }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

// Enhanced insert schemas with validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
  emailVerificationToken: true,
  emailVerificationExpires: true,
  passwordResetToken: true,
  passwordResetExpires: true,
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  acceptTerms: z.boolean().refine(val => val === true, "You must accept the terms and conditions"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const emailVerificationSchema = z.object({
  email: z.string().email("Invalid email format"),
  code: z.string().length(6, "Verification code must be 6 digits"),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
export type EmailVerificationData = z.infer<typeof emailVerificationSchema>;

export type OAuthProvider = typeof oauthProviders.$inferSelect;
export type InsertOAuthProvider = typeof oauthProviders.$inferInsert;

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type InsertRefreshToken = typeof refreshTokens.$inferInsert;

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;

export type LoginAttempt = typeof loginAttempts.$inferSelect;
export type InsertLoginAttempt = typeof loginAttempts.$inferInsert;