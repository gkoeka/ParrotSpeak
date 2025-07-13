import { db } from '../db/index.js';
import { userFeedback, users } from '../shared/schema.js';
import { desc, eq } from 'drizzle-orm';
import { writeFileSync } from 'fs';

/**
 * Export all feedback submissions to CSV format
 */
async function exportFeedbackToCSV() {
  try {
    console.log('📊 Exporting ParrotSpeak feedback to CSV...\n');
    
    // Get all feedback with user information
    const feedback = await db
      .select({
        id: userFeedback.id,
        category: userFeedback.category,
        feedback: userFeedback.feedback,
        email: userFeedback.email,
        status: userFeedback.status,
        createdAt: userFeedback.createdAt,
        updatedAt: userFeedback.updatedAt,
        userName: users.username,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
      })
      .from(userFeedback)
      .leftJoin(users, eq(userFeedback.userId, users.id))
      .orderBy(desc(userFeedback.createdAt));

    if (feedback.length === 0) {
      console.log('No feedback submissions found to export.');
      return;
    }

    // Create CSV header
    const csvHeader = [
      'ID',
      'Category',
      'Status', 
      'Submitted Date',
      'Last Updated',
      'User Name',
      'User Email',
      'Contact Email',
      'Full Name',
      'Feedback Message'
    ].join(',');

    // Convert feedback to CSV rows
    const csvRows = feedback.map(item => {
      const fullName = [item.userFirstName, item.userLastName].filter(Boolean).join(' ') || '';
      const contactEmail = item.email && item.email !== item.userEmail ? item.email : '';
      
      // Escape quotes and commas in the feedback message
      const escapedFeedback = `"${item.feedback.replace(/"/g, '""')}"`;
      
      return [
        item.id,
        item.category,
        item.status,
        item.createdAt?.toISOString() || '',
        item.updatedAt?.toISOString() || '',
        item.userName || '',
        item.userEmail || '',
        contactEmail,
        fullName,
        escapedFeedback
      ].join(',');
    });

    // Combine header and rows
    const csvContent = [csvHeader, ...csvRows].join('\n');
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `parrotspeak-feedback-${timestamp}.csv`;
    
    // Write to file
    writeFileSync(filename, csvContent, 'utf8');
    
    console.log(`✅ Successfully exported ${feedback.length} feedback submissions`);
    console.log(`📁 File saved as: ${filename}`);
    console.log(`📍 Location: ${process.cwd()}/${filename}`);
    
    // Create a simple download link for Replit
    console.log(`\n🔗 To download the file, copy and paste this URL in your browser:`);
    console.log(`https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/${filename}`);
    console.log(`\nOr look for the file "${filename}" in your file explorer and right-click to download.\n`);
    
    // Show a preview of the data
    console.log('Preview of exported data:');
    console.log('========================');
    feedback.slice(0, 3).forEach((item, index) => {
      console.log(`${index + 1}. ${item.category} - ${item.createdAt?.toLocaleDateString()} - "${item.feedback.substring(0, 50)}${item.feedback.length > 50 ? '...' : ''}"`);
    });
    
    if (feedback.length > 3) {
      console.log(`... and ${feedback.length - 3} more entries`);
    }
    
  } catch (error) {
    console.error('❌ Error exporting feedback to CSV:', error);
  } finally {
    process.exit(0);
  }
}

exportFeedbackToCSV();