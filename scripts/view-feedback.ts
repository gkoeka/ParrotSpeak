import { db } from '../db/index.js';
import { userFeedback, users } from '../shared/schema.js';
import { desc, eq } from 'drizzle-orm';

/**
 * View all feedback submissions from the database
 */
async function viewFeedback() {
  try {
    console.log('\n📝 ParrotSpeak Feedback Submissions\n');
    console.log('=' .repeat(80));
    
    // Get all feedback with user information
    const feedback = await db
      .select({
        id: userFeedback.id,
        category: userFeedback.category,
        feedback: userFeedback.feedback,
        email: userFeedback.email,
        status: userFeedback.status,
        createdAt: userFeedback.createdAt,
        userName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
      })
      .from(userFeedback)
      .leftJoin(users, eq(userFeedback.userId, users.id))
      .orderBy(desc(userFeedback.createdAt));

    if (feedback.length === 0) {
      console.log('No feedback submissions found.');
      return;
    }

    feedback.forEach((item, index) => {
      console.log(`\n${index + 1}. FEEDBACK #${item.id}`);
      console.log(`   Category: ${item.category.toUpperCase()}`);
      console.log(`   Date: ${item.createdAt?.toLocaleString()}`);
      const displayName = item.userName ? `${item.userName} ${item.userLastName || ''}`.trim() : 'Anonymous';
      console.log(`   From: ${displayName} ${item.userEmail ? `(${item.userEmail})` : ''}`);
      if (item.email && item.email !== item.userEmail) {
        console.log(`   Contact Email: ${item.email}`);
      }
      console.log(`   Status: ${item.status}`);
      console.log(`   Message:`);
      console.log(`   "${item.feedback}"`);
      console.log('-'.repeat(80));
    });

    console.log(`\nTotal feedback submissions: ${feedback.length}`);
    
  } catch (error) {
    console.error('Error retrieving feedback:', error);
  } finally {
    process.exit(0);
  }
}

viewFeedback();