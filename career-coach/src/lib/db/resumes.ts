import type { ResumeAnalysis } from "../types";
import { query } from "./client";

function rowToResume(row: Record<string, unknown>): ResumeAnalysis {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    createdAt: (row.created_at as Date).toISOString(),
    role: row.role as string,
    score: row.score as number,
    summary: row.summary as string,
    strengths: row.strengths as string[],
    gaps: row.gaps as string[],
    rewrites: row.rewrites as ResumeAnalysis["rewrites"],
    keywordsToAdd: row.keywords_to_add as string[],
  };
}

export const resumeRepoPg = {
  async create(analysis: ResumeAnalysis): Promise<ResumeAnalysis> {
    await query(
      `INSERT INTO resumes (
        id, user_id, created_at, role, score, summary, strengths, gaps, rewrites, keywords_to_add
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        analysis.id,
        analysis.userId,
        new Date(analysis.createdAt),
        analysis.role,
        analysis.score,
        analysis.summary,
        JSON.stringify(analysis.strengths),
        JSON.stringify(analysis.gaps),
        JSON.stringify(analysis.rewrites),
        JSON.stringify(analysis.keywordsToAdd),
      ],
    );
    return analysis;
  },

  async listByUserId(userId: string, limit = 20): Promise<ResumeAnalysis[]> {
    const res = await query(
      `SELECT * FROM resumes WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [userId, limit],
    );
    return res.rows.map(rowToResume);
  },

  async upsertFromImport(analysis: ResumeAnalysis): Promise<void> {
    await query(
      `INSERT INTO resumes (
        id, user_id, created_at, role, score, summary, strengths, gaps, rewrites, keywords_to_add
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (id) DO NOTHING`,
      [
        analysis.id,
        analysis.userId,
        new Date(analysis.createdAt),
        analysis.role,
        analysis.score,
        analysis.summary,
        JSON.stringify(analysis.strengths),
        JSON.stringify(analysis.gaps),
        JSON.stringify(analysis.rewrites),
        JSON.stringify(analysis.keywordsToAdd),
      ],
    );
  },
};
