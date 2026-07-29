import { db } from "../../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Gets a user by ID
 * @param id User ID
 * @returns User object or undefined
 */
export async function getUserById(id: number) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id));

  return user;
}

/**
 * Checks if a user has valid preview access
 * @param user User object
 * @returns Boolean indicating if preview is active
 */
export function hasValidPreviewAccess(user: any): boolean {
  if (!user.previewExpiresAt || user.hasUsedPreview === false) {
    return false;
  }

  const now = new Date();
  return now < new Date(user.previewExpiresAt);
}

/**
 * Checks if user has any valid access (subscription or preview)
 * @param user User object
 * @returns Boolean indicating if user has access
 */
export function hasValidAccess(user: any): boolean {
  // Check subscription access
  if (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'lifetime') {
    return true;
  }

  // Check preview access
  return hasValidPreviewAccess(user);
}
