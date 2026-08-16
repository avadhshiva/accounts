#!/usr/bin/env npx tsx
/**
 * Apply PostgreSQL schema from src/lib/db/schema.sql
 * Usage: DATABASE_URL=postgresql://... npm run db:migrate
 */
import "dotenv/config";
import { runMigrations, closePool } from "../src/lib/db";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required for db:migrate");
    process.exit(1);
  }
  await runMigrations();
  console.log("Database schema applied successfully.");
  await closePool();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
