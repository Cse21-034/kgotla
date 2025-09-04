import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().default(process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/kgotla_dev"),
  
  // JWT
  JWT_ACCESS_SECRET: z.string().default("dev-access-secret-change-in-production-at-least-32-chars"),
  JWT_REFRESH_SECRET: z.string().default("dev-refresh-secret-change-in-production-at-least-32-chars"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  
  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().default("dev-google-client-id"),
  GOOGLE_CLIENT_SECRET: z.string().default("dev-google-client-secret"),
  GOOGLE_CALLBACK_URL: z.string().default("http://localhost:5000/api/auth/google/callback"),
  
  // Email
  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_USER: z.string().default("dev-user"),
  SMTP_PASS: z.string().default("dev-pass"),
  FROM_EMAIL: z.string().default("noreply@kgotla.local"),
  FROM_NAME: z.string().default("Kgotla"),
  
  // App
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().default("http://localhost:3000"),
  API_URL: z.string().default("http://localhost:5000"),
  
  // Security
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  
  // Session
  SESSION_SECRET: z.string().default("dev-session-secret-change-in-production-at-least-32-chars"),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
  
  // In development, warn about default values
  if (env.NODE_ENV === "development") {
    console.log("🔧 Running in development mode with default environment values");
    console.log("📝 Set proper environment variables for production deployment");
  }
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("❌ Invalid environment variables:");
    error.errors.forEach(err => {
      console.error(`  ${err.path.join(".")}: ${err.message}`);
    });
    process.exit(1);
  }
  throw error;
}

export { env };