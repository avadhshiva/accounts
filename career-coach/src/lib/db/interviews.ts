import type { InterviewSession } from "../types";
import { query } from "./client";

function rowToInterview(row: Record<string, unknown>): InterviewSession {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    mode: row.mode as InterviewSession["mode"],
    createdAt: (row.created_at as Date).toISOString(),
    status: row.status as InterviewSession["status"],
    questionSet: row.question_set as string[] | undefined,
    messages: row.messages as InterviewSession["messages"],
    scorecard: row.scorecard as InterviewSession["scorecard"],
  };
}

export const interviewRepoPg = {
  async create(session: InterviewSession): Promise<InterviewSession> {
    await query(
      `INSERT INTO interviews (
        id, user_id, mode, status, question_set, messages, scorecard, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        session.id,
        session.userId,
        session.mode,
        session.status,
        session.questionSet ? JSON.stringify(session.questionSet) : null,
        JSON.stringify(session.messages),
        session.scorecard ? JSON.stringify(session.scorecard) : null,
        new Date(session.createdAt),
        new Date(session.createdAt),
      ],
    );
    return session;
  },

  async findByIdForUser(id: string, userId: string): Promise<InterviewSession | null> {
    const res = await query(`SELECT * FROM interviews WHERE id = $1 AND user_id = $2`, [
      id,
      userId,
    ]);
    if (!res.rows[0]) return null;
    return rowToInterview(res.rows[0]);
  },

  async update(session: InterviewSession): Promise<InterviewSession> {
    await query(
      `UPDATE interviews SET
        status = $3, messages = $4, scorecard = $5, question_set = $6, updated_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [
        session.id,
        session.userId,
        session.status,
        JSON.stringify(session.messages),
        session.scorecard ? JSON.stringify(session.scorecard) : null,
        session.questionSet ? JSON.stringify(session.questionSet) : null,
      ],
    );
    return session;
  },

  async listByUserId(userId: string, limit = 20): Promise<InterviewSession[]> {
    const res = await query(
      `SELECT * FROM interviews WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [userId, limit],
    );
    return res.rows.map(rowToInterview);
  },

  async countByUserIdAndMode(userId: string, mode: InterviewSession["mode"]): Promise<number> {
    const res = await query(
      `SELECT COUNT(*)::int AS count FROM interviews WHERE user_id = $1 AND mode = $2`,
      [userId, mode],
    );
    return Number(res.rows[0]?.count ?? 0);
  },

  async upsertFromImport(session: InterviewSession): Promise<void> {
    await query(
      `INSERT INTO interviews (
        id, user_id, mode, status, question_set, messages, scorecard, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (id) DO NOTHING`,
      [
        session.id,
        session.userId,
        session.mode,
        session.status,
        session.questionSet ? JSON.stringify(session.questionSet) : null,
        JSON.stringify(session.messages),
        session.scorecard ? JSON.stringify(session.scorecard) : null,
        new Date(session.createdAt),
        new Date(session.createdAt),
      ],
    );
  },
};
