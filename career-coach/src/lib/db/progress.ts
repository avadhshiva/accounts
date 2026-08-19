import type { UserProgress } from "../types";
import { query } from "./client";

function rowToProgress(row: Record<string, unknown>): UserProgress {
  const learnCompleted = row.learn_completed as string[];
  return {
    userId: row.user_id as string,
    learnCompleted: Array.isArray(learnCompleted) ? learnCompleted : [],
    updatedAt: (row.updated_at as Date).toISOString(),
  };
}

export const progressRepoPg = {
  async getByUserId(userId: string): Promise<UserProgress> {
    const res = await query(`SELECT * FROM user_progress WHERE user_id = $1`, [userId]);
    if (res.rows.length === 0) {
      return {
        userId,
        learnCompleted: [],
        updatedAt: new Date().toISOString(),
      };
    }
    return rowToProgress(res.rows[0]);
  },

  async upsertLearnCompleted(
    userId: string,
    learnCompleted: string[],
    updatedAt = new Date().toISOString(),
  ): Promise<UserProgress> {
    await query(
      `INSERT INTO user_progress (user_id, learn_completed, updated_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET
         learn_completed = EXCLUDED.learn_completed,
         updated_at = EXCLUDED.updated_at`,
      [userId, JSON.stringify(learnCompleted), new Date(updatedAt)],
    );
    return {
      userId,
      learnCompleted,
      updatedAt,
    };
  },
};
