import type { FeedbackEntry } from "../../types";
import { updateDb } from "../../store";

export const feedbackRepoJson = {
  async create(entry: FeedbackEntry): Promise<FeedbackEntry> {
    await updateDb((db) => {
      if (!db.feedback) db.feedback = [];
      db.feedback.unshift(entry);
      return entry;
    });
    return entry;
  },

  async upsertFromImport(entry: FeedbackEntry): Promise<void> {
    await updateDb((db) => {
      if (!db.feedback) db.feedback = [];
      if (!db.feedback.some((f) => f.id === entry.id)) {
        db.feedback.push(entry);
      }
    });
  },
};
