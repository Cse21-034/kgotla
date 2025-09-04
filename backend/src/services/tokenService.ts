import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env";
import type { User } from "../models/authSchema";

export interface TokenPayload {
  userId: string;
  email: string;
  type: "access" | "refresh";
  iat?: number;
  exp?: number;
}

export interface AccessTokenPayload extends Omit<TokenPayload, "type"> {
  type: "access";
  firstName?: string;
  lastName?: string;
  isVerified: boolean;
  subscriptionTier: string;
}

export class TokenService {
  /**
   * Generate JWT access token
   */
  generateAccessToken(user: User): string {
    const payload: AccessTokenPayload = {
      userId: user.id,
      email: user.email,
      type: "access",
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      isVerified: user.isVerified || false,
      subscriptionTier: user.subscriptionTier || "free",
    };

    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
      issuer: "kgotla-api",
      audience: "kgotla-app",
    });
  }

  /**
   * Generate JWT refresh token
   */
  generateRefreshToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      type: "refresh",
    };

    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
      issuer: "kgotla-api",
      audience: "kgotla-app",
    });
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
        issuer: "kgotla-api",
        audience: "kgotla-app",
      }) as AccessTokenPayload;

      if (payload.type !== "access") {
        throw new Error("Invalid token type");
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("Invalid access token");
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Access token expired");
      }
      throw error;
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, env.JWT_REFRESH_SECRET, {
        issuer: "kgotla-api",
        audience: "kgotla-app",
      }) as TokenPayload;

      if (payload.type !== "refresh") {
        throw new Error("Invalid token type");
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("Invalid refresh token");
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Refresh token expired");
      }
      throw error;
    }
  }

  /**
   * Generate secure random token for email verification or password reset
   */
  generateSecureToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Generate 6-digit verification code
   */
  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Calculate token expiration date
   */
  getTokenExpiration(expiresIn: string): Date {
    const now = new Date();
    const match = expiresIn.match(/^(\d+)([mhd])$/);
    
    if (!match) {
      throw new Error("Invalid expires in format");
    }

    const [, amount, unit] = match;
    const value = parseInt(amount, 10);

    switch (unit) {
      case "m": // minutes
        return new Date(now.getTime() + value * 60 * 1000);
      case "h": // hours
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case "d": // days
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      default:
        throw new Error("Invalid time unit");
    }
  }
}

export const tokenService = new TokenService();