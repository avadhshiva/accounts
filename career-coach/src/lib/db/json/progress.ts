import type { UserProgress } from "../../types";
import { readDb, updateDb } from "../../store";

export const progressRepoJson = {
  async getByUserId(userId: string): Promise<UserProgress> {
    const db = await readDb();
    const row = db.userProgress.find((p) => p.userId === userId);
    if (!row) {
      return {
        userId,
        learnCompleted: [],
        updatedAt: new Date().toISOString(),
      };
    }
    return {
      userId: row.userId,
      learnCompleted: Array.isArray(row.learnCompleted) ? row.learnCompleted : [],
      updatedAt: row.updatedAt || new Date().toISOString(),
    };
  },

  async upsertLearnCompleted(
    userId: string,
    learnCompleted: string[],
    updatedAt = new Date().toISOString(),
  ): Promise<UserProgress> {
    return updateDb((db) => {
      const idx = db.userProgress.findIndex((p) => p.userId === userId);
      const row: UserProgress = { userId, learnCompleted, updatedAt };
      if (idx === -1) {
        db.userProgress.push(row);
      } else {
        db.userProgress[idx] = row;
      }
      return row;
    });
  },
};
