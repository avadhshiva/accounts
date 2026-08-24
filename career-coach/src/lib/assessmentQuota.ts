import { PILOT_MODE } from "./access";
import { getUsageLimits } from "./limits";
import type { InterviewMode, User } from "./types";

export const PILOT_ASSESSMENT_ATTEMPTS_PER_MODE = 2;

export type AssessmentAttemptSession = { mode: InterviewMode };

/** Count assessment sessions started for a category (active + completed). */
export function countAssessmentAttemptsForMode(
  interviews: AssessmentAttemptSession[],
  mode: InterviewMode,
): number {
  return interviews.filter((i) => i.mode === mode).length;
}

/** Per-category assessment attempt cap (not a global mock pool). */
export function getAssessmentAttemptsLimitPerMode(user: Pick<User, "plan" | "access">): number {
  if (PILOT_MODE && user.access === "trial") {
    return PILOT_ASSESSMENT_ATTEMPTS_PER_MODE;
  }
  return getUsageLimits(user).mockInterviews;
}

export function canStartAssessmentForMode(
  user: Pick<User, "plan" | "access">,
  mode: InterviewMode,
  interviews: AssessmentAttemptSession[],
): boolean {
  const used = countAssessmentAttemptsForMode(interviews, mode);
  const limit = getAssessmentAttemptsLimitPerMode(user);
  return used < limit;
}

export function isAssessmentExhaustedForMode(
  user: Pick<User, "plan" | "access">,
  mode: InterviewMode,
  interviews: AssessmentAttemptSession[],
): boolean {
  return !canStartAssessmentForMode(user, mode, interviews);
}

export function formatAssessmentAttemptsLabel(used: number, limit: number): string {
  return `${used}/${limit} attempts`;
}
