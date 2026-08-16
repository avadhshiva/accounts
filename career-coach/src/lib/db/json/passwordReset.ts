import type { PasswordResetToken } from "../../types";
import { updateDb } from "../../store";

export const passwordResetRepoJson = {
  async createToken(token: PasswordResetToken): Promise<PasswordResetToken> {
    await updateDb((db) => {
      if (!db.passwordResetTokens) db.passwordResetTokens = [];
      const now = new Date();
      db.passwordResetTokens = db.passwordResetTokens.filter(
        (t) => t.userId !== token.userId || new Date(t.expiresAt) > now,
      );
      db.passwordResetTokens.push(token);
      return token;
    });
    return token;
  },

  async findValidToken(token: string): Promise<PasswordResetToken | null> {
    return updateDb((db) => {
      if (!db.passwordResetTokens) return null;
      return db.passwordResetTokens.find((t) => t.token === token) || null;
    });
  },

  async deleteToken(token: string): Promise<void> {
    await updateDb((db) => {
      if (!db.passwordResetTokens) return;
      db.passwordResetTokens = db.passwordResetTokens.filter((t) => t.token !== token);
    });
  },

  async deleteTokensForUser(userId: string): Promise<void> {
    await updateDb((db) => {
      if (!db.passwordResetTokens) return;
      db.passwordResetTokens = db.passwordResetTokens.filter((t) => t.userId !== userId);
    });
  },

  async upsertFromImport(token: PasswordResetToken): Promise<void> {
    await updateDb((db) => {
      if (!db.passwordResetTokens) db.passwordResetTokens = [];
      if (!db.passwordResetTokens.some((t) => t.token === token.token)) {
        db.passwordResetTokens.push(token);
      }
    });
  },
};
