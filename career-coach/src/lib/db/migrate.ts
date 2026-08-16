import { readFile } from "fs/promises";
import path from "path";
import { query } from "./client";

export async function runMigrations() {
  const schemaPath = path.join(process.cwd(), "src/lib/db/schema.sql");
  const sql = await readFile(schemaPath, "utf8");
  await query(sql);
}
