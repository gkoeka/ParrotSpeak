import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express, Request } from "express";
import session from "express-session";
import { db } from "../db";
import { users } from "@shared/schema";
import { verifyPassword, findOrCreateGoogleUser, getUserById } from "./services/auth";
import connectPgSimple from "connect-pg-simple";
import { pool } from "../db";
import { eq } from "drizzle-orm";

// Extend Express types to include user session
declare global {
  namespace Express {
    // Match the database schema exactly
    interface User {
      id: number;
      email: string | null;
      username: string | null;
      password?: string | null;
      firstName: string | null;
      lastName: string | null;
      profileImageUrl: string | null;
      googleId: string | null;
      appleId: string | null;
      resetToken: string | null;
      resetTokenExpiry: Date | null;
      emailVerified: boolean | null;

      subscription_status: string | null;
      subscription_tier: string | null;
      subscription_expires_at: Date | null;
      createdAt: Date;
      updatedAt: Date;
    }
  }
}

export function setupAuth(app: Express) {
  // Set up session store with PostgreSQL
  const PgSession = connectPgSimple(session);
  
  // Configure session middleware
  const sessionOptions: session.SessionOptions = {
    store: new PgSession({
      pool,
      tableName: 'sessions', // Uses the sessions table defined in schema.ts
      createTableIfMissing: true
    }),
    secret: (() => {
      if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
        throw new Error('SESSION_SECRET environment variable is required in production');
      }
      return process.env.SESSION_SECRET || 'parrot-speak-dev-secret-change-in-production';
    })(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    }
  };

  // Initialize session
  app.use(session(sessionOptions));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy for email/password login
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        // Find user by email
        const user = await db.query.users.findFirst({
          where: eq(users.email, email)
        });

        if (!user || !user.password) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        // Verify password
        const isValidPassword = await verifyPassword(password, user.password);
        if (!isValidPassword) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        // Password is valid, return user without password
        const { password: _, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
      } catch (error) {
        return done(error);
      }
    }
  ));

  // Configure Google strategy if credentials provided
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
      scope: ['profile', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await findOrCreateGoogleUser(profile);
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));
  }

  // User serialization and deserialization for sessions
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await getUserById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Authentication middleware to protect routes
  app.use((req, res, next) => {
    // Make isAuthenticated available to all templates/views
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.user = req.user;
    next();
  });
}

// Middleware to check if user is authenticated
export function requireAuth(req: Request, res: any, next: any) {
  // Check for demo mode header for testing
  const isDemoMode = req.headers['x-demo-mode'] === 'true';
  
  if (isDemoMode) {
    console.log('[Auth] Demo mode access granted');
    // Simulate demo user for testing
    req.user = {
      id: 1,
      email: 'demo@parrotspeak.com',
      name: 'Demo User'
    };
    next();
    return;
  }
  
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
}

// Middleware to check subscription status
export async function requireSubscription(req: Request, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const user = req.user;
  
  // Allow demo user for development/testing
  if (user.email === 'demo@parrotspeak.com') {
    console.log('[Auth] Demo user access granted for testing');
    next();
    return;
  }
  
  // Get fresh subscription data from database to avoid session cache issues
  try {
    const { db } = await import("@db");
    const { users } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const freshUser = await db.query.users.findFirst({
      where: eq(users.id, user.id)
    });
    
    if (!freshUser) {
      return res.status(403).json({ message: 'User not found' });
    }
    
    // Check subscription status with fresh data from database
    
    if (!freshUser.subscriptionStatus || freshUser.subscriptionStatus !== 'active') {
      return res.status(403).json({ message: 'Active subscription required' });
    }
    
    // Also check if subscription has expired
    if (freshUser.subscriptionExpiresAt && new Date(freshUser.subscriptionExpiresAt) < new Date()) {
      return res.status(403).json({ message: 'Subscription has expired' });
    }
    
    next();
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return res.status(500).json({ message: 'Failed to verify subscription' });
  }
}

// Function to check subscription status for WebSocket and other non-Express contexts
export async function checkSubscriptionStatus(userId: number): Promise<{ hasSubscription: boolean; error?: string }> {
  try {
    const { db } = await import("@db");
    const { users } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    if (!user) {
      return { hasSubscription: false, error: 'User not found' };
    }
    
    // Check if user has active subscription
    if (!user.subscriptionStatus || user.subscriptionStatus !== 'active') {
      return { hasSubscription: false, error: 'Active subscription required' };
    }
    
    // Check if subscription has expired
    if (user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) < new Date()) {
      return { hasSubscription: false, error: 'Subscription has expired' };
    }
    
    return { hasSubscription: true };
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return { hasSubscription: false, error: 'Failed to verify subscription' };
  }
}