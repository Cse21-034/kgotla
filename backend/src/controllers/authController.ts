import { Request, Response, NextFunction } from "express";
import { authService } from "../services/authService";
import { 
  registerSchema, 
  loginSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema,
  emailVerificationSchema 
} from "../models/authSchema";
import { fromZodError } from "zod-validation-error";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";

export class AuthController {
  /**
   * Register a new user
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          message: "Invalid registration data",
          errors: fromZodError(validation.error).toString(),
        });
        return;
      }

      const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
      const result = await authService.register(validation.data, ipAddress);

      // Set refresh token in httpOnly cookie
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        message: "Registration successful",
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          emailVerified: result.user.emailVerified,
          subscriptionTier: result.user.subscriptionTier,
        },
        accessToken: result.accessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          message: "Invalid login data",
          errors: fromZodError(validation.error).toString(),
        });
        return;
      }

      const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
      const userAgent = req.get("User-Agent");
      
      const result = await authService.login(validation.data, ipAddress, userAgent);

      // Set refresh token in httpOnly cookie
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: validation.data.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000, // 30 days or 7 days
      });

      res.json({
        message: "Login successful",
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          emailVerified: result.user.emailVerified,
          subscriptionTier: result.user.subscriptionTier,
        },
        accessToken: result.accessToken,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(401).json({ message: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        res.status(401).json({ message: "Refresh token required" });
        return;
      }

      const result = await authService.refreshToken(refreshToken);

      // Set new refresh token in cookie
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        message: "Token refreshed successfully",
        accessToken: result.accessToken,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(401).json({ message: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * Logout user
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      res.clearCookie("refreshToken");
      res.json({ message: "Logout successful" });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout from all devices
   */
  async logoutAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.logoutAllDevices(req.user.userId);
      res.clearCookie("refreshToken");
      res.json({ message: "Logged out from all devices" });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.sendEmailVerification(req.user.email);
      res.json({ message: "Verification email sent" });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify email with code
   */
  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = emailVerificationSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          message: "Invalid verification data",
          errors: fromZodError(validation.error).toString(),
        });
        return;
      }

      const user = await authService.verifyEmail(validation.data);
      res.json({
        message: "Email verified successfully",
        user: {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = forgotPasswordSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          message: "Invalid email",
          errors: fromZodError(validation.error).toString(),
        });
        return;
      }

      await authService.requestPasswordReset(validation.data);
      res.json({ message: "Password reset email sent (if email exists)" });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = resetPasswordSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          message: "Invalid reset data",
          errors: fromZodError(validation.error).toString(),
        });
        return;
      }

      const user = await authService.resetPassword(validation.data);
      res.json({
        message: "Password reset successful",
        user: {
          id: user.id,
          email: user.email,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * Change password
   */
  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        res.status(400).json({ message: "Current password and new password are required" });
        return;
      }

      await authService.changePassword(req.user.userId, currentPassword, newPassword);
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({
        user: {
          id: req.user.userId,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          isVerified: req.user.isVerified,
          subscriptionTier: req.user.subscriptionTier,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Google OAuth callback handler
   */
  googleCallback(req: Request, res: Response): void {
    // This will be called after successful Google authentication
    const result = req.user as any; // AuthResult from passport strategy

    if (!result) {
      res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
      return;
    }

    // Set refresh token in cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to frontend with access token
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${result.accessToken}`);
  }
}

export const authController = new AuthController();