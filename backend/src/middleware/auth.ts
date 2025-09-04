import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import db from '@/config/database';
import { users, refreshTokens } from '@/shared/schema';

export interface AuthRequest extends Request {
  user?: any;
}

// Middleware to verify JWT token
export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const userResult = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
    
    if (userResult.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = userResult[0];
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    return res.status(500).json({ message: 'Authentication error' });
  }
};

// Middleware for optional authentication (user may or may not be logged in)
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const userResult = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
    
    if (userResult.length > 0) {
      req.user = userResult[0];
    }
    
    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
};

// Middleware to check if user is verified
export const requireVerified = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (!req.user.isEmailVerified) {
    return res.status(403).json({ message: 'Email verification required' });
  }
  
  next();
};

// Generate JWT tokens
export const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

// Verify refresh token
export const verifyRefreshToken = async (token: string) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any;
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    const tokenResult = await db.select()
      .from(refreshTokens)
      .where(eq(refreshTokens.token, token))
      .limit(1);

    if (tokenResult.length === 0 || tokenResult[0].isRevoked) {
      throw new Error('Token not found or revoked');
    }

    if (new Date() > tokenResult[0].expiresAt) {
      throw new Error('Token expired');
    }

    return decoded.userId;
  } catch (error) {
    throw error;
  }
};

// Revoke refresh token
export const revokeRefreshToken = async (token: string) => {
  await db.update(refreshTokens)
    .set({ isRevoked: true })
    .where(eq(refreshTokens.token, token));
};