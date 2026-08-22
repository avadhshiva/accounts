import type { InterviewMode } from "@/lib/types";

/**
 * Change 13: what happens when Practice "Start Assessment" reuses beginAssess().
 * HR must open warm-up; other tracks go straight to startAssessment().
 */
export function assessEntryFromPractice(mode: InterviewMode): "hr-warmup" | "direct-start" {
  return mode === "hr" ? "hr-warmup" : "direct-start";
}
