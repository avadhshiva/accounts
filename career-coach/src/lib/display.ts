import type { User } from "./types";
import {
  formatMockSessionsHeaderLabel,
  getTotalMockSessionsLimit,
} from "./assessmentQuota";
import { getUsageLimits } from "./limits";

export function getPlanDisplayLabel(user: Pick<User, "plan" | "access" | "trialStartedAt">) {
  if (user.access === "paid") return "Pro";
  if (user.access === "invite") return "Pro (invite)";
  if (user.access === "trial") {
    return user.trialStartedAt ? "Trial · Pro features" : "Trial not started";
  }
  return user.plan === "pro" ? "Pro" : "Free";
}

export function formatNavUsagePill(
  user: Pick<User, "plan" | "access" | "usage" | "trialStartedAt">,
  remainingLabel?: string,
  mockSessions?: { used: number; total: number },
) {
  const limits = getUsageLimits(user);
  const totalMocks = mockSessions?.total ?? getTotalMockSessionsLimit(user);
  const usedMocks = Math.min(mockSessions?.used ?? 0, totalMocks);
  const usage = `${user.usage.resumeAnalyses}/${limits.resumeAnalyses} resume scores · ${formatMockSessionsHeaderLabel(usedMocks, totalMocks)}`;

  if (user.access === "trial" && user.trialStartedAt && remainingLabel && remainingLabel !== "—") {
    return `Trial ${remainingLabel} · ${usage}`;
  }

  if (user.access === "trial") {
    return `Trial · ${usage}`;
  }

  return usage;
}

export { getUsageLimits } from "./limits";
