import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Test accounts to verify
const testAccounts = [
  { email: 'greg.koeka@gmail.com', name: 'Greg (Lifetime)' },
  { email: 'koeka@colorado.edu', name: 'Koeka (No subscription)' },
  { email: 'greg@parrotspeak.com', name: 'Greg (Lifetime subscription)' },
  { email: 'greg@gregkoeka.com', name: 'Greg (Testing)' }
];

async function testAuthAccounts() {
  console.log('🔍 Checking test accounts in database...\n');

  for (const account of testAccounts) {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.email, account.email)
      });

      if (user) {
        console.log(`✅ ${account.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Name: ${user.firstName || 'Not set'} ${user.lastName || ''}`);
        console.log(`   Subscription Status: ${user.subscriptionStatus || 'none'}`);
        console.log(`   Subscription Tier: ${user.subscriptionTier || 'none'}`);
        console.log(`   Email Verified: ${user.emailVerified}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log(`   Has Password: ${user.password ? 'Yes' : 'No'}`);
        console.log('');
      } else {
        console.log(`❌ ${account.name} - NOT FOUND`);
        console.log(`   Email: ${account.email}`);
        console.log('');
      }
    } catch (error) {
      console.error(`❌ Error checking ${account.email}:`, error);
    }
  }

  console.log('\n📊 Summary:');
  console.log('- These accounts should already exist in the database');
  console.log('- Users can log in with their passwords via the mobile app');
  console.log('- No passwords are stored or displayed here for security');
}

// Run the test
testAuthAccounts().catch(console.error);