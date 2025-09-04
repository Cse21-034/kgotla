import { Request, Response, NextFunction } from "express";
import { tokenService } from "../services/tokenService";
import type { AccessTokenPayload } from "../services/tokenService";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: AccessTokenPayload;
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = tokenService.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({ 
        message: "Access token required",
        code: "TOKEN_REQUIRED"
      });
      return;
    }

    const payload = tokenService.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Access token expired") {
        res.status(401).json({ 
          message: "Access token expired",
          code: "TOKEN_EXPIRED"
        });
        return;
      }
      
      if (error.message === "Invalid access token") {
        res.status(401).json({ 
          message: "Invalid access token",
          code: "TOKEN_INVALID"
        });
        return;
      }
    }

    res.status(401).json({ 
      message: "Authentication failed",
      code: "AUTH_FAILED"
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = tokenService.extractTokenFromHeader(authHeader);

    if (token) {
      const payload = tokenService.verifyAccessToken(token);
      req.user = payload;
    }
  } catch (error) {
    // Silently fail for optional auth
  }
  
  next();
};

/**
 * Middleware to check if user is verified
 */
export const requireVerifiedUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ 
      message: "Authentication required",
      code: "AUTH_REQUIRED"
    });
    return;
  }

  if (!req.user.isVerified) {
    res.status(403).json({ 
      message: "Email verification required",
      code: "EMAIL_VERIFICATION_REQUIRED"
    });
    return;
  }

  next();
};

/**
 * Middleware to check subscription tier
 */
export const requireSubscription = (requiredTier: string = "elder") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        message: "Authentication required",
        code: "AUTH_REQUIRED"
      });
      return;
    }

    const tierHierarchy = ["free", "elder", "tribe_leader", "community_builder"];
    const userTierIndex = tierHierarchy.indexOf(req.user.subscriptionTier);
    const requiredTierIndex = tierHierarchy.indexOf(requiredTier);

    if (userTierIndex < requiredTierIndex) {
      res.status(403).json({ 
        message: `${requiredTier} subscription required`,
        code: "SUBSCRIPTION_REQUIRED",
        requiredTier
      });
      return;
    }

    next();
  };
};