import { ensureUserDefaults } from "../../access";
import type { User } from "../../types";
import { readDb, updateDb } from "../../store";

export const userRepoJson = {
  async findById(id: string): Promise<User | null> {
    const db = await readDb();
    const user = db.users.find((u) => u.id === id) || null;
    return user ? ensureUserDefaults(user) : null;
  },

  async findByEmail(email: string): Promise<User | null> {
    const db = await readDb();
    const user = db.users.find((u) => u.email === email.toLowerCase().trim()) || null;
    return user ? ensureUserDefaults(user) : null;
  },

  async emailExists(email: string): Promise<boolean> {
    const db = await readDb();
    return db.users.some((u) => u.email === email.toLowerCase().trim());
  },

  async create(user: User): Promise<User> {
    await updateDb((db) => {
      db.users.push(ensureUserDefaults(user));
      return user;
    });
    return user;
  },

  async bumpSessionVersion(id: string): Promise<User | null> {
    return updateDb((db) => {
      const u = db.users.find((x) => x.id === id);
      if (!u) return null;
      ensureUserDefaults(u);
      u.sessionVersion = (u.sessionVersion || 1) + 1;
      return u;
    });
  },

  async updatePassword(id: string, passwordHash: string): Promise<User | null> {
    return updateDb((db) => {
      const u = db.users.find((x) => x.id === id);
      if (!u) return null;
      u.passwordHash = passwordHash;
      u.sessionVersion += 1;
      return u;
    });
  },

  async resetMonthlyUsage(id: string, monthKey: string): Promise<User> {
    return updateDb((db) => {
      const u = db.users.find((x) => x.id === id);
      if (!u) throw new Error("User not found");
      ensureUserDefaults(u);
      u.usage = { resumeAnalyses: 0, mockInterviews: 0, monthKey };
      return u;
    });
  },

  async startTrial(id: string): Promise<User | null> {
    return updateDb((db) => {
      const u = db.users.find((x) => x.id === id);
      if (!u) return null;
      if (!u.trialStartedAt) u.trialStartedAt = new Date().toISOString();
      return u;
    });
  },

  async unlockAccess(
    id: string,
    patch: {
      access: User["access"];
      plan: User["plan"];
      inviteCode?: string;
      paidAt: string;
    },
  ): Promise<User | null> {
    return updateDb((db) => {
      const u = db.users.find((x) => x.id === id);
      if (!u) return null;
      u.access = patch.access;
      u.plan = patch.plan;
      u.inviteCode = patch.inviteCode;
      u.paidAt = patch.paidAt;
      return u;
    });
  },

  async incrementUsage(
    id: string,
    field: "resumeAnalyses" | "mockInterviews",
  ): Promise<User | null> {
    return updateDb((db) => {
      const u = db.users.find((x) => x.id === id);
      if (!u) return null;
      u.usage[field] += 1;
      return u;
    });
  },

  async save(user: User): Promise<User> {
    return updateDb((db) => {
      const idx = db.users.findIndex((x) => x.id === user.id);
      if (idx === -1) db.users.push(user);
      else db.users[idx] = user;
      return user;
    });
  },

  async upsertFromImport(user: User): Promise<void> {
    await updateDb((db) => {
      const idx = db.users.findIndex((u) => u.id === user.id);
      if (idx === -1) db.users.push(user);
      else db.users[idx] = { ...db.users[idx], ...user };
    });
  },
};
