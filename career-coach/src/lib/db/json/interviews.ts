import type { InterviewSession } from "../../types";
import { readDb, updateDb } from "../../store";

export const interviewRepoJson = {
  async create(session: InterviewSession): Promise<InterviewSession> {
    await updateDb((db) => {
      db.interviews.unshift(session);
      return session;
    });
    return session;
  },

  async findByIdForUser(id: string, userId: string): Promise<InterviewSession | null> {
    const db = await readDb();
    return db.interviews.find((i) => i.id === id && i.userId === userId) || null;
  },

  async update(session: InterviewSession): Promise<InterviewSession> {
    await updateDb((db) => {
      const idx = db.interviews.findIndex((i) => i.id === session.id && i.userId === session.userId);
      if (idx !== -1) db.interviews[idx] = session;
      return session;
    });
    return session;
  },

  async listByUserId(userId: string, limit = 20): Promise<InterviewSession[]> {
    const db = await readDb();
    return db.interviews.filter((i) => i.userId === userId).slice(0, limit);
  },

  async countByUserIdAndMode(userId: string, mode: InterviewSession["mode"]): Promise<number> {
    const db = await readDb();
    return db.interviews.filter((i) => i.userId === userId && i.mode === mode).length;
  },

  async upsertFromImport(session: InterviewSession): Promise<void> {
    await updateDb((db) => {
      if (!db.interviews.some((i) => i.id === session.id)) {
        db.interviews.push(session);
      }
    });
  },
};
