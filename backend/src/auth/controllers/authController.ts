import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { authService } from '@/services/authService';
import { generateTokens } from '@/middleware/auth';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation failed', 
          errors: errors.array() 
        });
      }

      const { email, password, firstName, lastName } = req.body;
      
      const user = await authService.registerUser(email, password, firstName, lastName);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please check your email for verification.',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isEmailVerified: user.isEmailVerified
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Registration failed'
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation failed', 
          errors: errors.array() 
        });
      }

      const { email, password } = req.body;
      
      const result = await authService.loginUser(email, password);
      
      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          profileImageUrl: result.user.profileImageUrl,
          isEmailVerified: result.user.isEmailVerified
        },
        tokens: result.tokens
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || 'Login failed'
      });
    }
  }

  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.params;
      
      await authService.verifyEmail(token);
      
      // Redirect to frontend with success message
      res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);
    } catch (error: any) {
      // Redirect to frontend with error message
      res.redirect(`${process.env.FRONTEND_URL}/login?error=verification_failed`);
    }
  }

  async resendVerification(req: Request, res: Response) {
    try {
      const { email } = req.body;
      
      await authService.generateEmailVerificationToken(email);
      
      res.json({
        success: true,
        message: 'Verification email sent successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to send verification email'
      });
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      
      await authService.generatePasswordResetToken(email);
      
      res.json({
        success: true,
        message: 'Password reset email sent successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to send password reset email'
      });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, password } = req.body;
      
      await authService.resetPassword(token, password);
      
      res.json({
        success: true,
        message: 'Password reset successful'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Password reset failed'
      });
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token required'
        });
      }
      
      const tokens = await authService.refreshAccessToken(refreshToken);
      
      res.json({
        success: true,
        tokens
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || 'Token refresh failed'
      });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      
      if (refreshToken) {
        await authService.logoutUser(refreshToken);
      }
      
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Logout failed'
      });
    }
  }

  async logoutAll(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      
      await authService.logoutAllDevices(user.id);
      
      res.json({
        success: true,
        message: 'Logged out from all devices'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Logout all failed'
      });
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          bio: user.bio,
          location: user.location,
          reputation: user.reputation,
          isVerified: user.isVerified,
          isEmailVerified: user.isEmailVerified,
          subscriptionTier: user.subscriptionTier,
          wisdomPoints: user.wisdomPoints,
          createdAt: user.createdAt
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get profile'
      });
    }
  }

  async googleCallback(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      
      if (!user) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
      }
      
      const tokens = generateTokens(user.id);
      
      // Redirect to frontend with tokens
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`;
      res.redirect(redirectUrl);
    } catch (error: any) {
      res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
  }
}

export const authController = new AuthController();