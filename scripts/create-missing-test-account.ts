import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function createMissingTestAccount() {
  console.log('🔍 Checking for missing test account...\n');

  const email = 'greg@gregkoeka.com';
  
  try {
    // First check if it exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (existingUser) {
      console.log('✅ Account already exists:', email);
      return;
    }

    // Create the account with hashed password
    const hashedPassword = await bcrypt.hash('Password!23', 12);
    
    const [newUser] = await db.insert(users).values({
      email,
      password: hashedPassword,
      firstName: 'Greg',
      lastName: 'Koeka',
      emailVerified: true,
      subscriptionStatus: 'none',
      subscriptionTier: 'none',
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    console.log('✅ Created missing test account:');
    console.log(`   Email: ${newUser.email}`);
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Name: ${newUser.firstName} ${newUser.lastName}`);
    console.log(`   Ready for testing!`);

  } catch (error) {
    console.error('❌ Error creating account:', error);
  }
}

// Run the creation
createMissingTestAccount().catch(console.error);