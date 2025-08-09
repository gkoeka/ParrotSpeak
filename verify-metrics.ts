// Verify metrics were written to database
import { db } from './db';
import { sql } from 'drizzle-orm';

async function verifyMetrics() {
  try {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count, 
             MAX(created_at) as latest
      FROM conversation_metrics
    `);
    
    console.log('[Verify] Metrics in database:', result.rows[0]);
    
    // Get last entry details
    const lastEntry = await db.execute(sql`
      SELECT conversation_id, translate_ms, detected_lang, target_lang, voice_used, created_at
      FROM conversation_metrics
      ORDER BY created_at DESC
      LIMIT 1
    `);
    
    if (lastEntry.rows.length > 0) {
      console.log('[Verify] Latest metric:', lastEntry.rows[0]);
    }
  } catch (error) {
    console.error('[Verify] Error:', error);
  }
}

verifyMetrics();
