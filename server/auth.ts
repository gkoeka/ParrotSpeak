import { Request } from "express";
import { reportError } from "./utils/errorReporting";
import { User as UserType } from "@shared/schema";

// Extend Express types to use consistent camelCase schema.
// This used to come from @types/passport's own ambient declarations
// (which also added `user` to Request); now that Passport is gone,
// both pieces need to be declared here directly.
declare global {
  namespace Express {
    // Use the standardized User type from schema, minus password
    interface User extends Omit<UserType, 'password'> {
      // Express requests don't need password field for security
      password?: never;
    }
    interface Request {
      user?: User;
    }
  }
}

// req.user is populated by clerkAuthMiddleware (server/middleware/clerk-auth.ts)
// for any Clerk-authenticated request. This file only gates access on that -
// there is no separate session/login system here.

// Middleware to check if user is authenticated
export function requireAuth(req: Request, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
}

// Middleware to check subscription status
export async function requireSubscription(req: Request, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const user = req.user;

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
    const { hasValidAccess } = await import("./services/auth.js");

    if (!hasValidAccess(freshUser)) {
      return res.status(403).json({ message: 'Active subscription or preview access required' });
    }

    next();
  } catch (error) {
    console.error('Error checking subscription status:', error);
    reportError(error, { userId: user?.id });
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
