import type { AccessStatus, User } from "./types";

/** Pilot = feedback cohort, no payment UI. Default on. */
export const PILOT_MODE = (process.env.PILOT_MODE || "true").toLowerCase() !== "false";

/** Default 48 hours for pilot; override with TRIAL_MINUTES */
export const TRIAL_MINUTES = Number(
  process.env.TRIAL_MINUTES || (PILOT_MODE ? 60 * 48 : 30),
);
export const UNLOCK_PRICE_INR = Number(process.env.UNLOCK_PRICE_INR || 500);

export type AccessSnapshot = {
  allowed: boolean;
  access: AccessStatus;
  reason: "ok" | "trial_expired" | "payment_required";
  trialStartedAt: string;
  trialEndsAt: string;
  remainingMs: number;
  remainingLabel: string;
  priceInr: number;
  pilotMode: boolean;
  trialHours: number;
};

function normalizeUserAccess(user: User): User {
  if (!user.access) user.access = "trial";
  if (!user.trialStartedAt) user.trialStartedAt = user.createdAt || new Date().toISOString();
  if (typeof user.sessionVersion !== "number") user.sessionVersion = 1;
  return user;
}

export function ensureUserDefaults(user: User): User {
  return normalizeUserAccess(user);
}

export function formatRemaining(ms: number) {
  if (ms <= 0) return "0:00";
  const totalSec = Math.ceil(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function getAccessSnapshot(user: User, now = Date.now()): AccessSnapshot {
  const u = normalizeUserAccess(user);
  const trialStartedAt = u.trialStartedAt;
  const trialEndsAt = new Date(
    new Date(trialStartedAt).getTime() + TRIAL_MINUTES * 60 * 1000,
  ).toISOString();
  const remainingMs = Math.max(0, new Date(trialEndsAt).getTime() - now);
  const trialHours = Math.round((TRIAL_MINUTES / 60) * 10) / 10;

  const base = {
    trialStartedAt,
    trialEndsAt,
    remainingMs,
    remainingLabel: formatRemaining(remainingMs),
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
    };
  }

  // Active trial window
  if (remainingMs > 0) {
    return {
      ...base,
      allowed: true,
      access: "trial",
      reason: "ok",
    };
  }

  return {
    ...base,
    allowed: false,
    access: "trial",
    reason: PILOT_MODE ? "trial_expired" : "payment_required",
    remainingMs: 0,
    remainingLabel: "0:00",
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
