import { Router } from "express";
import passport from "../config/passport";
import { authController } from "../controllers/authController";
import { authenticateToken, requireVerifiedUser } from "../middleware/authMiddleware";
import rateLimit from "express-rate-limit";

const router = Router();

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    message: "Too many authentication attempts, please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const emailLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Limit each IP to 3 email requests per windowMs
  message: {
    message: "Too many email requests, please try again later.",
    code: "EMAIL_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication routes
router.post("/register", authLimiter, authController.register.bind(authController));
router.post("/login", authLimiter, authController.login.bind(authController));
router.post("/refresh", authController.refreshToken.bind(authController));
router.post("/logout", authController.logout.bind(authController));
router.post("/logout-all", authenticateToken, authController.logoutAll.bind(authController));

// Email verification
router.post("/send-verification", 
  emailLimiter, 
  authenticateToken, 
  authController.sendEmailVerification.bind(authController)
);
router.post("/verify-email", authController.verifyEmail.bind(authController));

// Password reset
router.post("/forgot-password", 
  emailLimiter, 
  authController.forgotPassword.bind(authController)
);
router.post("/reset-password", authController.resetPassword.bind(authController));
router.post("/change-password", 
  authenticateToken, 
  requireVerifiedUser, 
  authController.changePassword.bind(authController)
);

// User info
router.get("/me", authenticateToken, authController.getCurrentUser.bind(authController));

// Google OAuth routes
router.get("/google", 
  passport.authenticate("google", { 
    scope: ["profile", "email"],
    prompt: "select_account"
  })
);

router.get("/google/callback",
  passport.authenticate("google", { failureRedirect: "/login?error=oauth_failed" }),
  authController.googleCallback.bind(authController)
);

export default router;