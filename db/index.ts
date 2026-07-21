import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";
import * as internalAnalyticsSchema from "@shared/internal-analytics-schema";

// Standard Postgres driver (postgres-js) — works with Supabase, Neon, or any
// standard Postgres connection string. This app previously used Neon's
// proprietary serverless (WebSocket) driver, which only worked against
// Neon's connection layer; this driver is Supabase's own documented
// recommendation and is portable across providers going forward.
//
// Use the "Direct Connection" string from Supabase (Project Settings ->
// Database), not the pooler — the pooler is Supabase's own guidance for
// serverless/edge environments, not a long-running server like this one.

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client, { schema: { ...schema, ...internalAnalyticsSchema } });