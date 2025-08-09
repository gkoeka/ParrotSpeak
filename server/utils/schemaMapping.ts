/**
 * Schema Mapping Utilities
 * 
 * This module provides consistent mapping between database snake_case columns 
 * and application camelCase properties. All database interactions should use
 * these utilities to ensure consistent data access patterns.
 */

import { User } from "@shared/schema";

/**
 * Database column to application property mapping
 * This ensures consistent naming conventions across the application
 */
export const DB_TO_APP_MAPPING = {
  // User table mappings
  first_name: 'firstName',
  last_name: 'lastName',
  profile_image_url: 'profileImageUrl',
  google_id: 'googleId',
  apple_id: 'appleId',
  reset_token: 'resetToken',
  reset_token_expiry: 'resetTokenExpiry',
  email_verified: 'emailVerified',
  stripe_customer_id: 'stripeCustomerId',
  stripe_subscription_id: 'stripeSubscriptionId',
  subscription_status: 'subscriptionStatus',
  subscription_tier: 'subscriptionTier',
  subscription_expires_at: 'subscriptionExpiresAt',
  admin_access_authorized: 'adminAccessAuthorized',
  admin_access_requested_at: 'adminAccessRequestedAt',
  admin_access_authorized_at: 'adminAccessAuthorizedAt',
  admin_access_reason: 'adminAccessReason',
  admin_access_expires_at: 'adminAccessExpiresAt',
  mfa_secret: 'mfaSecret',
  mfa_enabled: 'mfaEnabled',
  mfa_backup_codes: 'mfaBackupCodes',
  is_admin: 'isAdmin',
  analytics_enabled: 'analyticsEnabled',
  analytics_consent_date: 'analyticsConsentDate',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
} as const;

/**
 * Application property to database column mapping (reverse mapping)
 */
export const APP_TO_DB_MAPPING = Object.fromEntries(
  Object.entries(DB_TO_APP_MAPPING).map(([db, app]) => [app, db])
);

/**
 * Transforms a database user record to application format
 * Ensures all properties use camelCase naming convention
 * 
 * @param dbUser Raw user data from database
 * @returns User object with camelCase properties
 */
export function transformUserFromDB(dbUser: any): User {
  // Drizzle ORM automatically maps snake_case to camelCase,
  // but this function ensures type safety and consistency
  return {
    id: dbUser.id,
    email: dbUser.email,
    password: dbUser.password,
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
    profileImageUrl: dbUser.profileImageUrl,
    googleId: dbUser.googleId,
    appleId: dbUser.appleId,
    resetToken: dbUser.resetToken,
    resetTokenExpiry: dbUser.resetTokenExpiry,
    emailVerified: dbUser.emailVerified,
    adminAccessAuthorized: dbUser.adminAccessAuthorized,
    adminAccessRequestedAt: dbUser.adminAccessRequestedAt,
    adminAccessAuthorizedAt: dbUser.adminAccessAuthorizedAt,
    adminAccessReason: dbUser.adminAccessReason,
    adminAccessExpiresAt: dbUser.adminAccessExpiresAt,
    stripeCustomerId: dbUser.stripeCustomerId,
    stripeSubscriptionId: dbUser.stripeSubscriptionId,
    subscriptionStatus: dbUser.subscriptionStatus,
    subscriptionTier: dbUser.subscriptionTier,
    subscriptionExpiresAt: dbUser.subscriptionExpiresAt,
    previewExpiresAt: dbUser.previewExpiresAt,
    hasUsedPreview: dbUser.hasUsedPreview,
    previewStartedAt: dbUser.previewStartedAt,
    mfaSecret: dbUser.mfaSecret,
    mfaEnabled: dbUser.mfaEnabled,
    mfaBackupCodes: dbUser.mfaBackupCodes,
    isAdmin: dbUser.isAdmin,
    analyticsEnabled: dbUser.analyticsEnabled,
    analyticsConsentDate: dbUser.analyticsConsentDate,
    createdAt: dbUser.createdAt,
    updatedAt: dbUser.updatedAt,
  };
}

/**
 * Creates a safe user object for API responses
 * Removes sensitive fields like password, reset tokens, MFA secrets
 * 
 * @param user Full user object
 * @returns Safe user object for API responses
 */
export function createSafeUserResponse(user: User) {
  const {
    password,
    resetToken,
    resetTokenExpiry,
    mfaSecret,
    mfaBackupCodes,
    adminAccessReason,
    ...safeUser
  } = user;
  
  return safeUser;
}

/**
 * Naming convention documentation
 */
export const NAMING_CONVENTIONS = {
  database: 'snake_case',
  application: 'camelCase',
  api: 'camelCase',
  frontend: 'camelCase'
} as const;

/**
 * Type-safe property access helper for user objects
 * Ensures consistent property names and prevents typos
 */
export const UserProperties = {
  // Basic fields
  id: 'id',
  email: 'email',
  firstName: 'firstName',
  lastName: 'lastName',
  profileImageUrl: 'profileImageUrl',
  emailVerified: 'emailVerified',
  
  // OAuth fields
  googleId: 'googleId',
  appleId: 'appleId',
  
  // Subscription fields
  subscriptionStatus: 'subscriptionStatus',
  subscriptionTier: 'subscriptionTier',
  subscriptionExpiresAt: 'subscriptionExpiresAt',
  
  // Admin fields
  isAdmin: 'isAdmin',
  adminAccessAuthorized: 'adminAccessAuthorized',
  
  // MFA fields
  mfaEnabled: 'mfaEnabled',
  
  // Analytics fields
  analyticsEnabled: 'analyticsEnabled',
  analyticsConsentDate: 'analyticsConsentDate',
  
  // Timestamps
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
} as const;