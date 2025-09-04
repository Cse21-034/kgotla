import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import db from '@/config/database';
import { users } from '@/shared/schema';

// JWT Strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
    },
    async (payload, done) => {
      try {
        const user = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
        if (user.length > 0) {
          return done(null, user[0]);
        }
        return done(null, false);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

// Local Strategy (Email/Password)
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
        
        if (userResult.length === 0) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        const user = userResult[0];
        
        if (!user.password) {
          return done(null, false, { message: 'Please use Google login for this account' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        if (!user.isEmailVerified) {
          return done(null, false, { message: 'Please verify your email before logging in' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists with Google ID
        let userResult = await db.select().from(users).where(eq(users.googleId, profile.id)).limit(1);
        
        if (userResult.length > 0) {
          // Update last login
          await db.update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, userResult[0].id));
          return done(null, userResult[0]);
        }

        // Check if user exists with email
        userResult = await db.select().from(users).where(eq(users.email, profile.emails![0].value)).limit(1);
        
        if (userResult.length > 0) {
          // Link Google account to existing user
          await db.update(users)
            .set({ 
              googleId: profile.id,
              authProvider: 'google',
              isEmailVerified: true,
              lastLoginAt: new Date()
            })
            .where(eq(users.id, userResult[0].id));
          return done(null, userResult[0]);
        }

        // Create new user
        const newUserId = `google_${profile.id}`;
        const newUser = await db.insert(users).values({
          id: newUserId,
          email: profile.emails![0].value,
          firstName: profile.name?.givenName || '',
          lastName: profile.name?.familyName || '',
          profileImageUrl: profile.photos?.[0]?.value || '',
          googleId: profile.id,
          authProvider: 'google',
          isEmailVerified: true,
          lastLoginAt: new Date()
        }).returning();

        return done(null, newUser[0]);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const userResult = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (userResult.length > 0) {
      done(null, userResult[0]);
    } else {
      done(null, false);
    }
  } catch (error) {
    done(error, null);
  }
});

export default passport;