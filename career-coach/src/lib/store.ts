import { promises as fs } from "fs";
import path from "path";
import { DbShape } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const emptyDb = (): DbShape => ({
  users: [],
  resumes: [],
  interviews: [],
  feedback: [],
  passwordResetTokens: [],
  userProgress: [],
});

export async function readDb(): Promise<DbShape> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as DbShape;
    if (!parsed.feedback) parsed.feedback = [];
    if (!parsed.passwordResetTokens) parsed.passwordResetTokens = [];
    if (!parsed.userProgress) parsed.userProgress = [];
    return parsed;
  } catch {
    const db = emptyDb();
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf8");
    return db;
  }
}

export async function writeDb(db: DbShape): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

export async function updateDb<T>(
  mutator: (db: DbShape) => T | Promise<T>,
): Promise<T> {
  const db = await readDb();
  const result = await mutator(db);
  await writeDb(db);
  return result;
}
