import type { ResumeAnalysis } from "../../types";
import { readDb, updateDb } from "../../store";

export const resumeRepoJson = {
  async create(analysis: ResumeAnalysis): Promise<ResumeAnalysis> {
    await updateDb((db) => {
      db.resumes.unshift(analysis);
      return analysis;
    });
    return analysis;
  },

  async listByUserId(userId: string, limit = 20): Promise<ResumeAnalysis[]> {
    const db = await readDb();
    return db.resumes.filter((r) => r.userId === userId).slice(0, limit);
  },

  async upsertFromImport(analysis: ResumeAnalysis): Promise<void> {
    await updateDb((db) => {
      if (!db.resumes.some((r) => r.id === analysis.id)) {
        db.resumes.push(analysis);
      }
    });
  },
};
