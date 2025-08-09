import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../../db';
import { sql } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  try {
    const migrationsDir = path.join(__dirname, 'migrations');
    
    // Create migrations directory if it doesn't exist
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
      console.log('[Migr] Created migrations directory');
    }

    // Read all .sql files from migrations directory
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort alphabetically to run in order

    if (files.length === 0) {
      console.log('[Migr] No migration files found');
      return;
    }

    console.log(`[Migr] Found ${files.length} migration file(s)`);

    // Execute each migration
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const migrationSql = fs.readFileSync(filePath, 'utf8');
      
      try {
        // Execute migration in a transaction
        await db.transaction(async (tx) => {
          await tx.execute(sql.raw(migrationSql));
        });
        
        console.log(`[Migr] applied ${file}`);
      } catch (error) {
        // Log error but continue with other migrations
        console.error(`[Migr] Failed to apply ${file}:`, error instanceof Error ? error.message : error);
      }
    }
    
    console.log('[Migr] Migration run complete');
  } catch (error) {
    console.error('[Migr] Migration runner error:', error);
    // Don't throw - we don't want to crash the server on migration errors
  }
}