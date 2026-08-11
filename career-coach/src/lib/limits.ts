import { Plan } from "./types";

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

export function canUse(
  plan: Plan,
  usage: { resumeAnalyses: number; mockInterviews: number },
  feature: "resumeAnalyses" | "mockInterviews",
) {
  return usage[feature] < LIMITS[plan][feature];
}
