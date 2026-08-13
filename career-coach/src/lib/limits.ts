import { PILOT_MODE } from "./access";
import { Plan, User } from "./types";

export const LIMITS = {
  free: {
    resumeAnalyses: 2,
    mockInterviews: 3,
  },
  pro: {
    resumeAnalyses: 100,
    mockInterviews: 100,
  },
} as const;

/** Realistic caps during pilot trial — creates meaningful scarcity */
export const PILOT_TRIAL_LIMITS = {
  resumeAnalyses: 3,
  mockInterviews: 2,
} as const;

export function getUsageLimits(user: Pick<User, "plan" | "access">) {
  if (user.access === "trial" && PILOT_MODE) {
    return PILOT_TRIAL_LIMITS;
  }
  return LIMITS[user.plan as Plan];
}

export function canUse(
  user: Pick<User, "plan" | "access" | "usage">,
  feature: "resumeAnalyses" | "mockInterviews",
) {
  const limits = getUsageLimits(user);
  return user.usage[feature] < limits[feature];
}

export function isPilotTrialUser(user: Pick<User, "access">) {
  return PILOT_MODE && user.access === "trial";
}
