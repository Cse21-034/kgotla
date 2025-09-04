import rateLimit from 'express-rate-limit';

export const rateLimitMiddleware = (maxRequests: number = 100, windowMinutes: number = 15) => {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000, // Convert minutes to milliseconds
    max: maxRequests,
    message: {
      error: 'Too many requests',
      message: `Rate limit exceeded. Try again in ${windowMinutes} minutes.`,
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${windowMinutes} minutes.`,
      });
    },
  });
};

// Specific rate limiters for different types of requests
export const generalRateLimit = rateLimitMiddleware(100, 15); // 100 requests per 15 minutes
export const authRateLimit = rateLimitMiddleware(5, 15); // 5 auth requests per 15 minutes
export const apiRateLimit = rateLimitMiddleware(200, 15); // 200 API requests per 15 minutes