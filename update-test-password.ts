import { db } from "./db";
import { users } from "@shared/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function updatePassword() {
  console.log("Updating test user password...");
  
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash("Password!23", 12);
    
    // Update the user's password
    const result = await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.email, "greg@gregkoeka.com"))
      .returning();
    
    if (result.length > 0) {
      console.log("✅ Password updated for greg@gregkoeka.com");
      console.log("User details:", {
        email: result[0].email,
        firstName: result[0].firstName,
        subscriptionStatus: result[0].subscriptionStatus
      });
    } else {
      console.log("❌ User not found");
    }
  } catch (error) {
    console.error("Error updating password:", error);
  }
  
  process.exit(0);
}

updatePassword();
