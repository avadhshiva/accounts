import type { AccessStatus, User } from "./types";

/** Pilot = feedback cohort, no payment UI. Default on. */
export const PILOT_MODE = (process.env.PILOT_MODE || "true").toLowerCase() !== "false";

/** Default 7 days for pilot; override with TRIAL_MINUTES */
export const TRIAL_MINUTES = Number(
  process.env.TRIAL_MINUTES || (PILOT_MODE ? 60 * 24 * 7 : 30),
);
export const UNLOCK_PRICE_INR = Number(process.env.UNLOCK_PRICE_INR || 500);

export type AccessSnapshot = {
  allowed: boolean;
  access: AccessStatus;
  reason: "ok" | "trial_not_started" | "trial_expired" | "payment_required";
  trialStarted: boolean;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  remainingMs: number;
  remainingLabel: string;
  priceInr: number;
  pilotMode: boolean;
  trialHours: number;
};

function hasTrialStarted(user: User) {
  return Boolean(user.trialStartedAt && user.trialStartedAt.length > 0);
}

function normalizeUserAccess(user: User): User {
  if (!user.access) user.access = "trial";
  if (typeof user.sessionVersion !== "number") user.sessionVersion = 1;
  // Do NOT auto-start trial from createdAt — user must click Start trial
  if (user.trialStartedAt === undefined) user.trialStartedAt = "";
  return user;
}

export function ensureUserDefaults(user: User): User {
  return normalizeUserAccess(user);
}

/** Live clock with seconds (for banner + unlock page) */
export function formatRemaining(ms: number) {
  if (ms <= 0) return "0:00:00";
  const totalSec = Math.ceil(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (d > 0) return `${d}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`;
  return `${pad(h)}h ${pad(m)}m ${pad(s)}s`;
}

export function getAccessSnapshot(user: User, now = Date.now()): AccessSnapshot {
  const u = normalizeUserAccess(user);
  const trialHours = Math.round((TRIAL_MINUTES / 60) * 10) / 10;
  const started = hasTrialStarted(u);

  const base = {
    trialStarted: started,
    trialStartedAt: started ? u.trialStartedAt : null,
    trialEndsAt: null as string | null,
    remainingMs: 0,
    remainingLabel: started ? "0:00:00" : "—",
    priceInr: UNLOCK_PRICE_INR,
    pilotMode: PILOT_MODE,
    trialHours,
  };

  // Explicit unlock always wins
  if (u.access === "paid" || u.access === "invite") {
    return {
      ...base,
      allowed: true,
      access: u.access,
      reason: "ok",
      trialStarted: true,
    };
  }

  // Pilot: must click Start trial before exploring
  if (!started) {
    return {
      ...base,
      allowed: false,
      access: "trial",
      reason: "trial_not_started",
    };
  }

  const trialEndsAt = new Date(
    new Date(u.trialStartedAt).getTime() + TRIAL_MINUTES * 60 * 1000,
  ).toISOString();
  const remainingMs = Math.max(0, new Date(trialEndsAt).getTime() - now);

  const withTimer = {
    ...base,
    trialStarted: true,
    trialStartedAt: u.trialStartedAt,
    trialEndsAt,
    remainingMs,
    remainingLabel: formatRemaining(remainingMs),
  };

  if (remainingMs > 0) {
    return {
      ...withTimer,
      allowed: true,
      access: "trial",
      reason: "ok",
    };
  }

  return {
    ...withTimer,
    allowed: false,
    access: "trial",
    reason: PILOT_MODE ? "trial_expired" : "payment_required",
    remainingMs: 0,
    remainingLabel: "0:00:00",
  };
}

export function getInviteCodes(): string[] {
  return (process.env.INVITE_CODES || "PATHLY-DEMO,PATHLY-STUDENT")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
}

export function getFeedbackFormUrl() {
  return process.env.NEXT_PUBLIC_FEEDBACK_FORM_URL || "";
}
