// Example environment configuration
// Copy this to env.ts and fill in your actual values

export const env = {
  NODE_ENV: "development",
  PORT: 5000,
  
  // Database
  DATABASE_URL: "postgresql://user:password@localhost:5432/kgotla_dev",
  
  // JWT Configuration  
  JWT_ACCESS_SECRET: "your-super-secure-access-secret-at-least-32-characters-long",
  JWT_REFRESH_SECRET: "your-super-secure-refresh-secret-at-least-32-characters-long", 
  JWT_ACCESS_EXPIRES_IN: "15m",
  JWT_REFRESH_EXPIRES_IN: "7d",
  
  // API URLs
  API_URL: "http://localhost:5000",
  CLIENT_URL: "http://localhost:3000",
  
  // CORS
  CORS_ORIGINS: "http://localhost:3000,http://localhost:5173",
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,
  
  // Google OAuth (get from Google Cloud Console)
  GOOGLE_CLIENT_ID: "your-google-client-id.apps.googleusercontent.com",
  GOOGLE_CLIENT_SECRET: "your-google-client-secret",
  GOOGLE_CALLBACK_URL: "http://localhost:5000/api/auth/google/callback",
  
  // Email Configuration (choose one)
  // For development, you can use a service like Ethereal Email or MailHog
  SMTP_HOST: "smtp.ethereal.email",
  SMTP_PORT: 587,
  SMTP_USER: "your-ethereal-username",
  SMTP_PASS: "your-ethereal-password",
  FROM_EMAIL: "noreply@kgotla.local",
  
  // Session (for legacy support)
  SESSION_SECRET: "your-session-secret-for-legacy-support"
};