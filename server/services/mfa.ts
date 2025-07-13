import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import crypto from 'crypto';
import { db } from '@db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface MFASetupResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface MFAVerifyRequest {
  userId: number;
  token: string;
  isBackupCode?: boolean;
}

/**
 * Generate MFA secret and QR code for a user
 */
export async function setupMFA(userId: number, userEmail: string): Promise<MFASetupResponse> {
  // Generate secret for TOTP
  const secret = speakeasy.generateSecret({
    name: `ParrotSpeak (${userEmail})`,
    issuer: 'ParrotSpeak',
    length: 32,
  });

  // Generate backup codes
  const backupCodes = Array.from({ length: 8 }, () => 
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );

  // Generate QR code
  const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

  // Store secret and backup codes in database (not enabled yet)
  await db.update(users)
    .set({
      mfaSecret: secret.base32,
      mfaBackupCodes: JSON.stringify(backupCodes),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return {
    secret: secret.base32!,
    qrCodeUrl,
    backupCodes,
  };
}

/**
 * Verify MFA token and enable MFA for user
 */
export async function verifyAndEnableMFA(userId: number, token: string): Promise<boolean> {
  const [user] = await db.select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || !user.mfaSecret) {
    return false;
  }

  // Verify the token
  const isValid = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps tolerance
  });

  if (isValid) {
    // Enable MFA for the user
    await db.update(users)
      .set({
        mfaEnabled: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    
    return true;
  }

  return false;
}

/**
 * Verify MFA token for login
 */
export async function verifyMFA({ userId, token, isBackupCode = false }: MFAVerifyRequest): Promise<boolean> {
  const [user] = await db.select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || !user.mfaEnabled || !user.mfaSecret) {
    return false;
  }

  if (isBackupCode) {
    // Verify backup code
    const backupCodes = user.mfaBackupCodes ? JSON.parse(user.mfaBackupCodes) : [];
    const codeIndex = backupCodes.indexOf(token.toUpperCase());
    
    if (codeIndex !== -1) {
      // Remove used backup code
      backupCodes.splice(codeIndex, 1);
      await db.update(users)
        .set({
          mfaBackupCodes: JSON.stringify(backupCodes),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
      
      return true;
    }
  } else {
    // Verify TOTP token
    return speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 2,
    });
  }

  return false;
}



/**
 * Disable MFA for a user
 */
export async function disableMFA(userId: number): Promise<boolean> {
  try {
    await db.update(users)
      .set({
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    
    return true;
  } catch (error) {
    console.error('Error disabling MFA:', error);
    return false;
  }
}

/**
 * Check if user has MFA enabled
 */
export async function isMFAEnabled(userId: number): Promise<boolean> {
  const [user] = await db.select({ mfaEnabled: users.mfaEnabled })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user?.mfaEnabled || false;
}

/**
 * Generate new backup codes for a user
 */
export async function regenerateBackupCodes(userId: number): Promise<string[]> {
  const backupCodes = Array.from({ length: 8 }, () => 
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );

  await db.update(users)
    .set({
      mfaBackupCodes: JSON.stringify(backupCodes),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return backupCodes;
}