import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { authService } from "../services/authService";
import { userRepository } from "../services/userRepository";
import { env } from "./env";
import type { AccessTokenPayload } from "../services/tokenService";

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const result = await authService.authenticateWithGoogle(
          profile,
          accessToken,
          refreshToken
        );
        return done(null, result);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// JWT Strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: env.JWT_ACCESS_SECRET,
      issuer: "kgotla-api",
      audience: "kgotla-app",
    },
    async (payload: AccessTokenPayload, done) => {
      try {
        if (payload.type !== "access") {
          return done(new Error("Invalid token type"), null);
        }

        const user = await userRepository.findById(payload.userId);
        if (!user) {
          return done(new Error("User not found"), null);
        }

        return done(null, payload);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize/deserialize user for session-based authentication (if needed)
passport.serializeUser((user: any, done) => {
  done(null, user.userId || user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await userRepository.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;