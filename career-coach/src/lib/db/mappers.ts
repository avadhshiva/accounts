import type { User } from "../types";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  plan: string;
  access: string;
  trial_started_at: Date | null;
  paid_at: Date | null;
  invite_code: string | null;
  session_version: number;
  college: string | null;
  target_role: string | null;
  usage_resume_analyses: number;
  usage_mock_interviews: number;
  usage_month_key: string;
  created_at: Date;
  updated_at: Date;
};

export function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    plan: row.plan as User["plan"],
    access: row.access as User["access"],
    trialStartedAt: row.trial_started_at ? row.trial_started_at.toISOString() : "",
    paidAt: row.paid_at ? row.paid_at.toISOString() : undefined,
    inviteCode: row.invite_code || undefined,
    sessionVersion: row.session_version,
    college: row.college || "",
    targetRole: row.target_role || "",
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    usage: {
      resumeAnalyses: row.usage_resume_analyses,
      mockInterviews: row.usage_mock_interviews,
      monthKey: row.usage_month_key,
    },
  };
}

export function parseTrialStartedAt(value: string | undefined | null): Date | null {
  if (!value || value.trim() === "") return null;
  return new Date(value);
}
