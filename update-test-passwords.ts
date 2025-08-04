import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function updateTestPasswords() {
  console.log("Updating test user passwords...");
  
  const testEmails = [
    'greg.koeka@gmail.com',
    'greg@parrotspeak.com',
    'greg@gregkoeka.com',
    'koeka@colorado.edu'
  ];
  
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  for (const email of testEmails) {
    try {
      const result = await db
        .update(users)
        .set({ 
          password: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(users.email, email))
        .returning();
      
      if (result.length > 0) {
        console.log(`✓ Updated password for: ${email}`);
      } else {
        console.log(`× User not found: ${email}`);
      }
    } catch (error) {
      console.error(`Error updating ${email}:`, error);
    }
  }
  
  console.log("\nPassword updates complete!");
  process.exit(0);
}

updateTestPasswords().catch((error) => {
  console.error("Error updating passwords:", error);
  process.exit(1);
});