#!/usr/bin/env npx tsx
/**
 * Import existing data/db.json into PostgreSQL (non-destructive upsert).
 * Usage: DATABASE_URL=postgresql://... npm run db:import-json [path/to/db.json]
 */
import "dotenv/config";
import { readFile } from "fs/promises";
import path from "path";
import {
  closePool,
  feedbackRepo,
  interviewRepo,
  passwordResetRepo,
  resumeRepo,
  runMigrations,
  userRepo,
} from "../src/lib/db";
import type { DbShape } from "../src/lib/types";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required for db:import-json");
    process.exit(1);
  }

  const file = process.argv[2] || path.join(process.cwd(), "data", "db.json");
  const raw = await readFile(file, "utf8");
  const db = JSON.parse(raw) as DbShape;

  await runMigrations();

  for (const user of db.users || []) {
    await userRepo.upsertFromImport({
      ...user,
      updatedAt: user.updatedAt || user.createdAt,
    });
  }
  for (const resume of db.resumes || []) {
    await resumeRepo.upsertFromImport(resume);
  }
  for (const interview of db.interviews || []) {
    await interviewRepo.upsertFromImport(interview);
  }
  for (const entry of db.feedback || []) {
    await feedbackRepo.upsertFromImport(entry);
  }
  for (const token of db.passwordResetTokens || []) {
    await passwordResetRepo.upsertFromImport(token);
  }

  console.log(
    `Imported: ${db.users?.length || 0} users, ${db.resumes?.length || 0} resumes, ${db.interviews?.length || 0} interviews, ${db.feedback?.length || 0} feedback, ${db.passwordResetTokens?.length || 0} tokens`,
  );
  console.log(`Source file preserved at: ${file}`);
  await closePool();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
