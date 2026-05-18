import { Request, Response, NextFunction } from 'express';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { db } from '@db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY || '' });

// In-memory cache: Clerk user ID → database user ID
// Avoids a Clerk API call on every authenticated request after the first
const clerkUserCache = new Map<string, number>();

export async function clerkAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();

  const token = authHeader.split(' ')[1];

  try {
    const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY || '' });
    const clerkUserId = payload.sub;

    // Cache hit: look up DB user directly by cached ID
    const cachedDbUserId = clerkUserCache.get(clerkUserId);
    if (cachedDbUserId) {
      const dbUser = await db.query.users.findFirst({ where: eq(users.id, cachedDbUserId) });
      if (dbUser) {
        const { password: _, ...userWithoutPassword } = dbUser;
        req.user = userWithoutPassword as Express.User;
        return next();
      }
    }

    // Cache miss: fetch user details from Clerk to get their email
    const clerkUser = await clerk.users.getUser(clerkUserId);
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) return next();

    // Find existing user by email, or create a new one
    let dbUser = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!dbUser) {
      const [newUser] = await db.insert(users).values({
        email,
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        profileImageUrl: clerkUser.imageUrl,
        emailVerified: clerkUser.emailAddresses[0]?.verification?.status === 'verified',
        subscriptionStatus: 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      dbUser = newUser;
    }

    clerkUserCache.set(clerkUserId, dbUser.id);

    const { password: _, ...userWithoutPassword } = dbUser;
    req.user = userWithoutPassword as Express.User;
  } catch (error: any) {
    // Silently continue — invalid/expired tokens are treated as unauthenticated
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[Clerk] Token verification failed:', error.message);
    }
  }

  next();
}
