import { ensureUserDefaults } from "../access";
import type { User } from "../types";
import { query } from "./client";
import { parseTrialStartedAt, rowToUser, type UserRow } from "./mappers";

const USER_COLUMNS = `
  id, name, email, password_hash, plan, access, trial_started_at, paid_at, invite_code,
  session_version, college, target_role, usage_resume_analyses, usage_mock_interviews,
  usage_month_key, created_at, updated_at
`;

export const userRepoPg = {
  async findById(id: string): Promise<User | null> {
    const res = await query(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [id]);
    if (!res.rows[0]) return null;
    return ensureUserDefaults(rowToUser(res.rows[0] as UserRow));
  },

  async findByEmail(email: string): Promise<User | null> {
    const res = await query(`SELECT ${USER_COLUMNS} FROM users WHERE email = $1`, [
      email.toLowerCase().trim(),
    ]);
    if (!res.rows[0]) return null;
    return ensureUserDefaults(rowToUser(res.rows[0] as UserRow));
  },

  async emailExists(email: string): Promise<boolean> {
    const res = await query(`SELECT 1 FROM users WHERE email = $1`, [email.toLowerCase().trim()]);
    return res.rowCount !== null && res.rowCount > 0;
  },

  async create(user: User): Promise<User> {
    await query(
      `INSERT INTO users (
        id, name, email, password_hash, plan, access, trial_started_at, paid_at, invite_code,
        session_version, college, target_role, usage_resume_analyses, usage_mock_interviews,
        usage_month_key, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [
        user.id,
        user.name,
        user.email.toLowerCase().trim(),
        user.passwordHash,
        user.plan,
        user.access,
        parseTrialStartedAt(user.trialStartedAt),
        user.paidAt ? new Date(user.paidAt) : null,
        user.inviteCode || null,
        user.sessionVersion,
        user.college || "",
        user.targetRole || "",
        user.usage.resumeAnalyses,
        user.usage.mockInterviews,
        user.usage.monthKey,
        new Date(user.createdAt),
        new Date(user.updatedAt || user.createdAt),
      ],
    );
    return ensureUserDefaults(user);
  },

  async bumpSessionVersion(id: string): Promise<User | null> {
    const res = await query(
      `UPDATE users SET session_version = session_version + 1, updated_at = NOW()
       WHERE id = $1 RETURNING ${USER_COLUMNS}`,
      [id],
    );
    if (!res.rows[0]) return null;
    return ensureUserDefaults(rowToUser(res.rows[0] as UserRow));
  },

  async updatePassword(id: string, passwordHash: string): Promise<User | null> {
    const res = await query(
      `UPDATE users SET password_hash = $2, session_version = session_version + 1, updated_at = NOW()
       WHERE id = $1 RETURNING ${USER_COLUMNS}`,
      [id, passwordHash],
    );
    if (!res.rows[0]) return null;
    return ensureUserDefaults(rowToUser(res.rows[0] as UserRow));
  },

  async resetMonthlyUsage(id: string, monthKey: string): Promise<User> {
    const res = await query(
      `UPDATE users SET
         usage_resume_analyses = 0,
         usage_mock_interviews = 0,
         usage_month_key = $2,
         updated_at = NOW()
       WHERE id = $1 RETURNING ${USER_COLUMNS}`,
      [id, monthKey],
    );
    if (!res.rows[0]) throw new Error("User not found");
    return ensureUserDefaults(rowToUser(res.rows[0] as UserRow));
  },

  async startTrial(id: string): Promise<User | null> {
    const res = await query(
      `UPDATE users SET trial_started_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND trial_started_at IS NULL
       RETURNING ${USER_COLUMNS}`,
      [id],
    );
    if (!res.rows[0]) return this.findById(id);
    return ensureUserDefaults(rowToUser(res.rows[0] as UserRow));
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
    const res = await query(
      `UPDATE users SET access = $2, plan = $3, invite_code = $4, paid_at = $5, updated_at = NOW()
       WHERE id = $1 RETURNING ${USER_COLUMNS}`,
      [id, patch.access, patch.plan, patch.inviteCode || null, new Date(patch.paidAt)],
    );
    if (!res.rows[0]) return null;
    return ensureUserDefaults(rowToUser(res.rows[0] as UserRow));
  },

  async incrementUsage(
    id: string,
    field: "resumeAnalyses" | "mockInterviews",
  ): Promise<User | null> {
    const col = field === "resumeAnalyses" ? "usage_resume_analyses" : "usage_mock_interviews";
    const res = await query(
      `UPDATE users SET ${col} = ${col} + 1, updated_at = NOW()
       WHERE id = $1 RETURNING ${USER_COLUMNS}`,
      [id],
    );
    if (!res.rows[0]) return null;
    return ensureUserDefaults(rowToUser(res.rows[0] as UserRow));
  },

  async save(user: User): Promise<User> {
    await query(
      `UPDATE users SET
        name = $2, email = $3, password_hash = $4, plan = $5, access = $6,
        trial_started_at = $7, paid_at = $8, invite_code = $9, session_version = $10,
        college = $11, target_role = $12, usage_resume_analyses = $13,
        usage_mock_interviews = $14, usage_month_key = $15, updated_at = NOW()
       WHERE id = $1`,
      [
        user.id,
        user.name,
        user.email.toLowerCase().trim(),
        user.passwordHash,
        user.plan,
        user.access,
        parseTrialStartedAt(user.trialStartedAt),
        user.paidAt ? new Date(user.paidAt) : null,
        user.inviteCode || null,
        user.sessionVersion,
        user.college || "",
        user.targetRole || "",
        user.usage.resumeAnalyses,
        user.usage.mockInterviews,
        user.usage.monthKey,
      ],
    );
    return ensureUserDefaults(user);
  },

  async upsertFromImport(user: User): Promise<void> {
    await query(
      `INSERT INTO users (
        id, name, email, password_hash, plan, access, trial_started_at, paid_at, invite_code,
        session_version, college, target_role, usage_resume_analyses, usage_mock_interviews,
        usage_month_key, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        plan = EXCLUDED.plan,
        access = EXCLUDED.access,
        trial_started_at = EXCLUDED.trial_started_at,
        paid_at = EXCLUDED.paid_at,
        invite_code = EXCLUDED.invite_code,
        session_version = EXCLUDED.session_version,
        college = EXCLUDED.college,
        target_role = EXCLUDED.target_role,
        usage_resume_analyses = EXCLUDED.usage_resume_analyses,
        usage_mock_interviews = EXCLUDED.usage_mock_interviews,
        usage_month_key = EXCLUDED.usage_month_key,
        updated_at = EXCLUDED.updated_at`,
      [
        user.id,
        user.name,
        user.email.toLowerCase().trim(),
        user.passwordHash,
        user.plan,
        user.access,
        parseTrialStartedAt(user.trialStartedAt),
        user.paidAt ? new Date(user.paidAt) : null,
        user.inviteCode || null,
        user.sessionVersion,
        user.college || "",
        user.targetRole || "",
        user.usage.resumeAnalyses,
        user.usage.mockInterviews,
        user.usage.monthKey,
        new Date(user.createdAt),
        new Date(user.updatedAt || user.createdAt),
      ],
    );
  },
};
