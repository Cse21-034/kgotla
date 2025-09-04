import { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { env } from "../config/env";

/**
 * Security middleware configuration
 */
export const securityMiddleware = [
  // Helmet for security headers
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", env.API_URL],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),

  // CORS configuration
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      // Allow configured client URL
      if (origin === env.CLIENT_URL) return callback(null, true);
      
      // Allow localhost in development
      if (env.NODE_ENV === "development" && origin.includes("localhost")) {
        return callback(null, true);
      }
      
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),

  // General rate limiting
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    message: {
      message: "Too many requests from this IP, please try again later.",
      code: "RATE_LIMIT_EXCEEDED",
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for certain endpoints in development
    skip: (req) => {
      if (env.NODE_ENV === "development") {
        return req.path.startsWith("/api/health") || req.path.startsWith("/api/docs");
      }
      return false;
    },
  }),
];

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const { method, url, ip } = req;
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    console.log(`${method} ${url} ${statusCode} ${duration}ms - ${ip}`);
  });
  
  next();
};

/**
 * Error handling middleware
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error("Error:", error);

  // Handle specific error types
  if (error.name === "ValidationError") {
    res.status(400).json({
      message: "Validation error",
      errors: error.details || error.message,
      code: "VALIDATION_ERROR",
    });
    return;
  }

  if (error.name === "UnauthorizedError" || error.message.includes("unauthorized")) {
    res.status(401).json({
      message: "Unauthorized",
      code: "UNAUTHORIZED",
    });
    return;
  }

  if (error.name === "ForbiddenError" || error.message.includes("forbidden")) {
    res.status(403).json({
      message: "Forbidden",
      code: "FORBIDDEN",
    });
    return;
  }

  if (error.name === "NotFoundError" || error.message.includes("not found")) {
    res.status(404).json({
      message: "Not found",
      code: "NOT_FOUND",
    });
    return;
  }

  // Handle database errors
  if (error.code === "23505") { // PostgreSQL unique violation
    res.status(409).json({
      message: "Resource already exists",
      code: "DUPLICATE_RESOURCE",
    });
    return;
  }

  if (error.code === "23503") { // PostgreSQL foreign key violation
    res.status(400).json({
      message: "Invalid reference",
      code: "INVALID_REFERENCE",
    });
    return;
  }

  // Default error response
  res.status(500).json({
    message: env.NODE_ENV === "production" 
      ? "Internal server error" 
      : error.message || "Internal server error",
    code: "INTERNAL_ERROR",
    ...(env.NODE_ENV === "development" && { stack: error.stack }),
  });
};

/**
 * 404 handler for unknown routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    message: `Route ${req.method} ${req.path} not found`,
    code: "ROUTE_NOT_FOUND",
  });
};