import type { FeedbackEntry } from "../types";
import { query } from "./client";

export const feedbackRepoPg = {
  async create(entry: FeedbackEntry): Promise<FeedbackEntry> {
    await query(
      `INSERT INTO feedback (id, user_id, created_at, name, email, section, type, message, rating)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        entry.id,
        entry.userId || null,
        new Date(entry.createdAt),
        entry.name,
        entry.email.toLowerCase().trim(),
        entry.section,
        entry.type,
        entry.message,
        entry.rating,
      ],
    );
    return entry;
  },

  async upsertFromImport(entry: FeedbackEntry): Promise<void> {
    await query(
      `INSERT INTO feedback (id, user_id, created_at, name, email, section, type, message, rating)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id) DO NOTHING`,
      [
        entry.id,
        entry.userId || null,
        new Date(entry.createdAt),
        entry.name,
        entry.email.toLowerCase().trim(),
        entry.section,
        entry.type,
        entry.message,
        entry.rating,
      ],
    );
  },
};
