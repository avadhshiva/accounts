import type { PasswordResetToken } from "../types";
import { query } from "./client";

export const passwordResetRepoPg = {
  async createToken(token: PasswordResetToken): Promise<PasswordResetToken> {
    await query(
      `DELETE FROM password_reset_tokens WHERE user_id = $1 AND expires_at <= NOW()`,
      [token.userId],
    );
    await query(
      `INSERT INTO password_reset_tokens (token, user_id, email, expires_at, created_at)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        token.token,
        token.userId,
        token.email.toLowerCase().trim(),
        new Date(token.expiresAt),
        new Date(token.createdAt),
      ],
    );
    return token;
  },

  async findValidToken(token: string): Promise<PasswordResetToken | null> {
    const res = await query(
      `SELECT token, user_id, email, expires_at, created_at
       FROM password_reset_tokens WHERE token = $1`,
      [token],
    );
    const row = res.rows[0];
    if (!row) return null;
    return {
      token: row.token,
      userId: row.user_id,
      email: row.email,
      expiresAt: (row.expires_at as Date).toISOString(),
      createdAt: (row.created_at as Date).toISOString(),
    };
  },

  async deleteToken(token: string): Promise<void> {
    await query(`DELETE FROM password_reset_tokens WHERE token = $1`, [token]);
  },

  async deleteTokensForUser(userId: string): Promise<void> {
    await query(`DELETE FROM password_reset_tokens WHERE user_id = $1`, [userId]);
  },

  async upsertFromImport(token: PasswordResetToken): Promise<void> {
    await query(
      `INSERT INTO password_reset_tokens (token, user_id, email, expires_at, created_at)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (token) DO NOTHING`,
      [
        token.token,
        token.userId,
        token.email.toLowerCase().trim(),
        new Date(token.expiresAt),
        new Date(token.createdAt),
      ],
    );
  },
};
