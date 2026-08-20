import type { InterviewMode } from "@/lib/types";

const INTERVIEW_MODE_SET = new Set<InterviewMode>(["hr", "technical", "genai", "aptitude"]);

export const DEFAULT_INTERVIEW_MODE: InterviewMode = "technical";

export function isInterviewMode(value: string): value is InterviewMode {
  return INTERVIEW_MODE_SET.has(value as InterviewMode);
}

export function parseInterviewModeParam(value: string | null | undefined): InterviewMode {
  if (!value) return DEFAULT_INTERVIEW_MODE;
  return isInterviewMode(value) ? value : DEFAULT_INTERVIEW_MODE;
}
