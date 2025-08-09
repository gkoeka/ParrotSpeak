import { db } from "./db";
import { users } from "@shared/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function fixTestUsers() {
  console.log("Fixing all test users...");
  
  const testAccounts = [
    {
      email: 'greg.koeka@gmail.com',
      password: 'Password!23',
      subscriptionStatus: 'expired',
      subscriptionTier: 'standard',
      subscriptionExpiresAt: new Date('2024-01-01') // Expired
    },
    {
      email: 'greg@parrotspeak.com',
      password: 'Password!234',
      subscriptionStatus: 'active',
      subscriptionTier: 'lifetime',
      subscriptionExpiresAt: null // Lifetime never expires
    },
    {
      email: 'greg@gregkoeka.com',
      password: 'Password!23',
      subscriptionStatus: 'free',
      subscriptionTier: 'none',
      subscriptionExpiresAt: null
    },
    {
      email: 'koeka@colorado.edu',
      password: 'Passw0rd!234',
      subscriptionStatus: 'free',
      subscriptionTier: 'none',
      subscriptionExpiresAt: null
    }
  ];
  
  for (const account of testAccounts) {
    try {
      const hashedPassword = await bcrypt.hash(account.password, 12);
      
      const result = await db.update(users)
        .set({ 
          password: hashedPassword,
          subscriptionStatus: account.subscriptionStatus,
          subscriptionTier: account.subscriptionTier,
          subscriptionExpiresAt: account.subscriptionExpiresAt
        })
        .where(eq(users.email, account.email))
        .returning();
      
      if (result.length > 0) {
        console.log(`✅ Fixed ${account.email}: ${account.subscriptionStatus} (${account.subscriptionTier})`);
      }
    } catch (error) {
      console.error(`Error fixing ${account.email}:`, error);
    }
  }
  
  process.exit(0);
}

fixTestUsers();
