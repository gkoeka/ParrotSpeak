import { db } from "../../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendPasswordResetEmail, generateMockResetEmail } from "./email";

/**
 * Generates a password hash
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verifies a password against a hash
 * @param password Plain text password
 * @param hashedPassword Stored hashed password
 * @returns Boolean indicating if password matches
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

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
 * Gets a user by email
 * @param email User email
 * @returns User object or undefined
 */
export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));
  
  return user;
}

/**
 * Finds or creates a user with Google credentials
 * @param googleId Google ID
 * @param googleProfile Google profile
 * @returns User object
 */
export async function findOrCreateGoogleUser(
  googleId: string,
  googleProfile: {
    email?: string;
    displayName?: string;
    photos?: Array<{ value: string }>;
    name?: { givenName?: string; familyName?: string };
  }
) {
  // First, check if user exists with this Google ID
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.googleId, googleId));
  
  if (existingUser) {
    return existingUser;
  }
  
  // Then, check if user exists with this email
  if (googleProfile.email) {
    const [emailUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, googleProfile.email));
    
    if (emailUser) {
      // Link Google ID to existing account
      const [updatedUser] = await db
        .update(users)
        .set({
          googleId,
          profileImageUrl: googleProfile.photos?.[0]?.value || emailUser.profileImageUrl,
          updatedAt: new Date()
        })
        .where(eq(users.id, emailUser.id))
        .returning();
      
      return updatedUser;
    }
  }
  
  // Create new user
  const [newUser] = await db
    .insert(users)
    .values({
      email: googleProfile.email || null,
      googleId,
      username: googleProfile.displayName || null,
      firstName: googleProfile.name?.givenName || null,
      lastName: googleProfile.name?.familyName || null,
      profileImageUrl: googleProfile.photos?.[0]?.value || null,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .returning();
  
  return newUser;
}

/**
 * Creates a password reset token and sends reset email
 * @param email User email
 * @param originUrl Base URL for the reset link
 * @returns Success status
 */
export async function createPasswordResetToken(email: string, originUrl: string): Promise<{ success: boolean; message: string }> {
  try {
    // Get user by email
    const user = await getUserByEmail(email);
    
    // If user doesn't exist, pretend success for security
    if (!user) {
      return { success: true, message: "If an account with that email exists, a password reset link has been sent." };
    }
    
    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setMinutes(tokenExpiry.getMinutes() + 30); // Token valid for 30 minutes
    
    // Update user with reset token
    await db
      .update(users)
      .set({
        resetToken: token,
        resetTokenExpiry: tokenExpiry,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));
    
    // Build reset URL
    const resetUrl = `${originUrl}/password-reset`;
    
    // Send password reset email
    const emailSent = await sendPasswordResetEmail(user.email!, token, resetUrl);
    
    if (!emailSent) {
      // For development, log the reset link when email fails
      console.log("Development Mode - Password Reset Link:");
      console.log(generateMockResetEmail(user.email!, token, resetUrl));
    }
    
    return { success: true, message: "If an account with that email exists, a password reset link has been sent." };
  } catch (error) {
    console.error("Error creating password reset token:", error);
    return { success: false, message: "Failed to process password reset request. Please try again later." };
  }
}

/**
 * Resets a user's password using a valid token
 * @param token Reset token
 * @param newPassword New password
 * @returns Success status
 */
export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  try {
    // Find user with this token and valid expiry
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.resetToken, token));
    
    // Check if user exists and token is valid
    if (!user || !user.resetTokenExpiry) {
      return { success: false, message: "Invalid or expired reset token." };
    }
    
    // Check if token is expired
    const now = new Date();
    if (now > user.resetTokenExpiry) {
      return { success: false, message: "This reset token has expired. Please request a new password reset." };
    }
    
    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update the user's password and clear the reset token
    await db
      .update(users)
      .set({
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));
    
    return { success: true, message: "Password successfully reset." };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { success: false, message: "Failed to reset password. Please try again later." };
  }
}

/**
 * Register a new user
 * @param userData User registration data
 * @returns Registered user
 */
export async function registerUser(userData: {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}) {
  // Check if email already exists
  const existingUserByEmail = await getUserByEmail(userData.email);
  if (existingUserByEmail) {
    throw new Error("Email is already in use");
  }

  // Check if username already exists
  const [existingUserByUsername] = await db
    .select()
    .from(users)
    .where(eq(users.username, userData.username));
  
  if (existingUserByUsername) {
    throw new Error("Username is already taken");
  }

  // Hash the password
  const hashedPassword = await hashPassword(userData.password);

  // Create the user
  const [newUser] = await db
    .insert(users)
    .values({
      email: userData.email,
      username: userData.username,
      password: hashedPassword,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .returning();

  // Remove password from the returned user object
  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

/**
 * Login a user
 * @param credentials User login credentials
 * @returns Authenticated user
 */
export async function loginUser(credentials: { email: string; password: string }) {
  // Get user by email
  const user = await getUserByEmail(credentials.email);
  if (!user || !user.password) {
    throw new Error("Invalid email or password");
  }

  // Verify password
  const isPasswordValid = await verifyPassword(credentials.password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // Remove password from the returned user object
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Creates a new admin user for testing purposes
 * @param email Email for the admin user
 * @param password Password for the admin user
 * @returns Created user or error message
 */
export async function createAdminUser(email: string, password: string): Promise<{ success: boolean; message: string; user?: any }> {
  try {
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return { success: false, message: "User with this email already exists." };
    }
    
    // Hash the password
    const hashedPassword = await hashPassword(password);
    
    // Create the admin user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        username: "admin",
        password: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return { 
      success: true, 
      message: "Admin user created successfully.", 
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username
      }
    };
  } catch (error) {
    console.error("Error creating admin user:", error);
    return { success: false, message: "Failed to create admin user. Please try again later." };
  }
}