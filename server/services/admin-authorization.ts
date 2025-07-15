import { db } from '../../db';
import { users, adminAuthTokens } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import * as emailService from './emailService';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';

/**
 * Generate a cryptographically secure random token
 */
function generateSecureToken(): string {
  return randomBytes(32).toString('hex'); // 64 character hex string
}

/**
 * Request admin access authorization from a user
 */
export async function requestAdminAccess(
  adminUserId: number,
  targetUserId: number,
  reason: string,
  durationHours: number = 24
) {
  // Get target user
  const [targetUser] = await db.select().from(users).where(eq(users.id, targetUserId));
  if (!targetUser) {
    throw new Error('User not found');
  }

  if (!targetUser.email) {
    throw new Error('User email not available for authorization request');
  }

  // Generate cryptographically secure authorization token
  const authToken = generateSecureToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + durationHours);

  // Store secure authorization token in dedicated table
  const [tokenRecord] = await db.insert(adminAuthTokens).values({
    id: uuidv4(),
    userId: targetUserId,
    adminId: adminUserId,
    token: authToken,
    reason,
    durationHours,
    expiresAt
  }).returning();

  // Update user with authorization request
  await db.update(users)
    .set({
      adminAccessRequestedAt: new Date(),
      adminAccessReason: reason,
      adminAccessExpiresAt: expiresAt,
    })
    .where(eq(users.id, targetUserId));

  // Send authorization email with secure token
  const authUrl = `${process.env.FRONTEND_URL || 'https://your-domain.com'}/admin-authorize?token=${authToken}`;
  
  const emailSubject = 'ParrotSpeak Support: Authorization Request for Account Access';
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3b82f6;">Account Access Authorization Request</h2>
      
      <p>Hello ${targetUser.firstName || 'there'},</p>
      
      <p>Our support team has requested access to your ParrotSpeak account to assist you with:</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <strong>Reason:</strong> ${reason}
      </div>
      
      <p>To protect your privacy, your conversations and messages are encrypted. We need your explicit permission to decrypt and view this content to provide support.</p>
      
      <p><strong>What this means:</strong></p>
      <ul>
        <li>We will only access your account content for the stated support reason</li>
        <li>Access will be limited to ${durationHours} hours from authorization</li>
        <li>All access will be logged for audit purposes</li>
        <li>You can revoke this authorization at any time</li>
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${authUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
          Authorize Access
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px;">
        If you did not request support or don't recognize this request, please ignore this email. 
        The authorization link will expire in ${durationHours} hours.
      </p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 12px;">
        This email was sent to ${targetUser.email} regarding your ParrotSpeak account.
        For questions, contact us at support@parrotspeak.app
      </p>
    </div>
  `;

  try {
    await emailService.sendEmail({
      to: targetUser.email,
      subject: emailSubject,
      text: reason, // Plain text version
      html: emailContent
    });

    return {
      success: true,
      message: 'Authorization request sent to user',
      expiresAt: expiresAt,
      authToken
    };
  } catch (error) {
    console.error('Failed to send authorization email:', error);
    throw new Error('Failed to send authorization request email');
  }
}

/**
 * Process user authorization response
 */
export async function authorizeAdminAccess(authToken: string) {
  // Find user by auth token
  const [user] = await db.select().from(users).where(eq(users.resetToken, authToken));
  if (!user) {
    throw new Error('Invalid or expired authorization token');
  }

  // Check if token is expired
  if (!user.adminAccessExpiresAt || new Date() > user.adminAccessExpiresAt) {
    throw new Error('Authorization request has expired');
  }

  // Authorize access
  await db.update(users)
    .set({
      adminAccessAuthorized: true,
      adminAccessAuthorizedAt: new Date(),
      resetToken: null // Clear the token
    })
    .where(eq(users.id, user.id));

  return {
    success: true,
    message: 'Admin access authorized successfully',
    userId: user.id,
    expiresAt: user.adminAccessExpiresAt
  };
}

/**
 * Check if admin has authorization to access user's encrypted data
 */
export async function checkAdminAccessAuthorization(userId: number): Promise<boolean> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) {
    return false;
  }

  // Check if authorized and not expired
  if (!user.adminAccessAuthorized || !user.adminAccessExpiresAt) {
    return false;
  }

  // Check if authorization has expired
  if (new Date() > user.adminAccessExpiresAt) {
    // Auto-revoke expired authorization
    await db.update(users)
      .set({
        adminAccessAuthorized: false,
        adminAccessExpiresAt: null
      })
      .where(eq(users.id, userId));
    return false;
  }

  return true;
}

/**
 * Revoke admin access authorization
 */
export async function revokeAdminAccess(userId: number) {
  await db.update(users)
    .set({
      adminAccessAuthorized: false,
      adminAccessExpiresAt: null,
      adminAccessReason: null
    })
    .where(eq(users.id, userId));

  return { success: true, message: 'Admin access authorization revoked' };
}

/**
 * Get all users with pending or active admin access requests
 */
export async function getAdminAccessRequests() {
  const requests = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      adminAccessAuthorized: users.adminAccessAuthorized,
      adminAccessRequestedAt: users.adminAccessRequestedAt,
      adminAccessAuthorizedAt: users.adminAccessAuthorizedAt,
      adminAccessReason: users.adminAccessReason,
      adminAccessExpiresAt: users.adminAccessExpiresAt
    })
    .from(users)
    .where(eq(users.adminAccessRequestedAt, users.adminAccessRequestedAt)); // Has a request

  return requests.filter(req => req.adminAccessRequestedAt !== null);
}