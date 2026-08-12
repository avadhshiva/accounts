import type { AccessStatus, User } from "./types";

export const TRIAL_MINUTES = Number(process.env.TRIAL_MINUTES || 30);
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
};

function normalizeUserAccess(user: User): User {
  if (!user.access) user.access = user.plan === "pro" ? "paid" : "trial";
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
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function getAccessSnapshot(user: User, now = Date.now()): AccessSnapshot {
  const u = normalizeUserAccess(user);
  const trialStartedAt = u.trialStartedAt;
  const trialEndsAt = new Date(
    new Date(trialStartedAt).getTime() + TRIAL_MINUTES * 60 * 1000,
  ).toISOString();
  const remainingMs = Math.max(0, new Date(trialEndsAt).getTime() - now);

  if (u.access === "paid" || u.access === "invite" || u.plan === "pro") {
    return {
      allowed: true,
      access: u.access === "trial" ? "paid" : u.access,
      reason: "ok",
      trialStartedAt,
      trialEndsAt,
      remainingMs,
      remainingLabel: formatRemaining(remainingMs),
      priceInr: UNLOCK_PRICE_INR,
    };
  }

  if (remainingMs > 0) {
    return {
      allowed: true,
      access: "trial",
      reason: "ok",
      trialStartedAt,
      trialEndsAt,
      remainingMs,
      remainingLabel: formatRemaining(remainingMs),
      priceInr: UNLOCK_PRICE_INR,
    };
  }

  return {
    allowed: false,
    access: "trial",
    reason: "trial_expired",
    trialStartedAt,
    trialEndsAt,
    remainingMs: 0,
    remainingLabel: "0:00",
    priceInr: UNLOCK_PRICE_INR,
  };
}

export function getInviteCodes(): string[] {
  return (process.env.INVITE_CODES || "PATHLY-DEMO,PATHLY-STUDENT")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
}
