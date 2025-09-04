import { Router } from 'express';
import passport from 'passport';
import { body } from 'express-validator';
import { authController } from '@/auth/controllers/authController';
import { verifyToken } from '@/middleware/auth';
import { rateLimitMiddleware } from '@/middleware/rateLimiting';

const router = Router();

// Rate limiting for authentication routes
const authRateLimit = rateLimitMiddleware(5, 15); // 5 requests per 15 minutes
const loginRateLimit = rateLimitMiddleware(10, 15); // 10 requests per 15 minutes

// Validation middleware
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('First name must be 1-50 characters'),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Last name must be 1-50 characters'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
];

// Email/Password Authentication
router.post('/register', authRateLimit, registerValidation, authController.register);
router.post('/login', loginRateLimit, loginValidation, authController.login);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authRateLimit, authController.resendVerification);

// Password Reset
router.post('/forgot-password', authRateLimit, forgotPasswordValidation, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);

// Token Management
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/logout-all', verifyToken, authController.logoutAll);

// User Profile
router.get('/profile', verifyToken, authController.getProfile);

// Google OAuth
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }),
  authController.googleCallback
);

export default router;