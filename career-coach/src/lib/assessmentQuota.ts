import { INTERVIEW_MODES } from "./content";
import { PILOT_MODE } from "./access";
import { getUsageLimits } from "./limits";
import type { InterviewMode, User } from "./types";

export const PILOT_ASSESSMENT_ATTEMPTS_PER_MODE = 2;

/** Stable mock interview category ids (quota is tracked per mode, not globally). */
export const MOCK_INTERVIEW_MODES: InterviewMode[] = ["hr", "genai", "technical", "aptitude"];

export type AssessmentAttemptSession = { mode: InterviewMode };

export function interviewModeLabel(mode: InterviewMode): string {
  return INTERVIEW_MODES.find((m) => m.id === mode)?.label ?? mode;
}

/** Count mock sessions started for a category (active + completed). */
export function countAssessmentAttemptsForMode(
  interviews: AssessmentAttemptSession[],
  mode: InterviewMode,
): number {
  return interviews.filter((i) => i.mode === mode).length;
}

/** Total mock sessions used across all four categories. */
export function countTotalMockSessionsUsed(interviews: AssessmentAttemptSession[]): number {
  return interviews.filter((i) => MOCK_INTERVIEW_MODES.includes(i.mode)).length;
}

/** Per-category mock session cap (not a global pool). */
export function getAssessmentAttemptsLimitPerMode(user: Pick<User, "plan" | "access">): number {
  if (PILOT_MODE && user.access === "trial") {
    return PILOT_ASSESSMENT_ATTEMPTS_PER_MODE;
  }
  return getUsageLimits(user).mockInterviews;
}

/** Total mock sessions available (2 per category × 4 categories during pilot). */
export function getTotalMockSessionsLimit(user: Pick<User, "plan" | "access">): number {
  return MOCK_INTERVIEW_MODES.length * getAssessmentAttemptsLimitPerMode(user);
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

export function formatSessionUsageLabel(used: number, limit: number): string {
  return `${used}/${limit} sessions used`;
}

/** @deprecated alias — use formatSessionUsageLabel */
export function formatAssessmentAttemptsLabel(used: number, limit: number): string {
  return formatSessionUsageLabel(used, limit);
}

export function formatMockSessionsHeaderLabel(used: number, total: number): string {
  const clampedUsed = Math.min(used, total);
  return `${clampedUsed}/${total} mocks`;
}

export function formatCategoryQuotaErrorMessage(
  mode: InterviewMode,
  limit = PILOT_ASSESSMENT_ATTEMPTS_PER_MODE,
): string {
  return `${interviewModeLabel(mode)} mock limit reached (${limit} sessions).`;
}
