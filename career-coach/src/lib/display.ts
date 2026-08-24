import type { User } from "./types";
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
) {
  const limits = getUsageLimits(user);
  const usage = `${user.usage.resumeAnalyses}/${limits.resumeAnalyses} resume scores`;

  if (user.access === "trial" && user.trialStartedAt && remainingLabel && remainingLabel !== "—") {
    return `Trial ${remainingLabel} · ${usage}`;
  }

  if (user.access === "trial") {
    return `Trial · ${usage}`;
  }

  return usage;
}

export { getUsageLimits } from "./limits";
