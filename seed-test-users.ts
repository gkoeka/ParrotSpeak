import { db } from "./db";
import { users } from "@shared/schema";
import bcrypt from "bcryptjs";

async function seedTestUsers() {
  console.log("Seeding test users...");
  
  const testUsers = [
    {
      email: 'greg.koeka@gmail.com',
      password: 'Password!23',
      firstName: 'Greg',
      lastName: 'Koeka',
      subscriptionStatus: 'active',
      subscriptionTier: 'lifetime',
      subscriptionExpiresAt: null, // Lifetime doesn't expire
      emailVerified: true
    },
    {
      email: 'greg@parrotspeak.com',
      password: 'Password!234',
      firstName: 'Greg',
      lastName: 'ParrotSpeak',
      subscriptionStatus: 'active',
      subscriptionTier: 'lifetime',
      subscriptionExpiresAt: null,
      emailVerified: true
    },
    {
      email: 'greg@gregkoeka.com',
      password: 'Password!23',
      firstName: 'Greg',
      lastName: 'Standard',
      subscriptionStatus: 'active',
      subscriptionTier: 'standard',
      subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      emailVerified: true
    },
    {
      email: 'koeka@colorado.edu',
      password: 'Passw0rd!234',
      firstName: 'Test',
      lastName: 'Free',
      subscriptionStatus: 'free',
      subscriptionTier: null,
      subscriptionExpiresAt: null,
      emailVerified: true
    }
  ];
  
  for (const userData of testUsers) {
    try {
      // Check if user already exists
      const existing = await db.query.users.findFirst({
        where: (user, { eq }) => eq(user.email, userData.email)
      });
      
      if (existing) {
        console.log(`User already exists: ${userData.email}`);
        continue;
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      // Insert user
      await db.insert(users).values({
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        subscriptionStatus: userData.subscriptionStatus,
        subscriptionTier: userData.subscriptionTier,
        subscriptionExpiresAt: userData.subscriptionExpiresAt,
        emailVerified: userData.emailVerified,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`✓ Created test user: ${userData.email} (${userData.subscriptionStatus})`);
    } catch (error) {
      console.error(`Failed to create user ${userData.email}:`, error);
    }
  }
  
  console.log("\nTest users seeded successfully!");
  process.exit(0);
}

seedTestUsers().catch((error) => {
  console.error("Error seeding test users:", error);
  process.exit(1);
});