import type { InterviewMode } from "@/lib/types";

/** Cap Focus list so Practice stays scannable. */
export const MAX_FOCUS_AREAS = 3;

/**
 * Normalize scorecard improvements into Practice Focus areas.
 * Pure / deterministic — no I/O.
 */
export function normalizeFocusAreas(
  improvements: string[] | null | undefined,
): string[] {
  if (!improvements?.length) return [];
  const out: string[] = [];
  for (const raw of improvements) {
    const trimmed = raw.trim();
    if (!trimmed || out.includes(trimmed)) continue;
    out.push(trimmed);
    if (out.length >= MAX_FOCUS_AREAS) break;
  }
  return out;
}

export function hasPracticeFocus(focusAreas: string[] | null | undefined): boolean {
  return normalizeFocusAreas(focusAreas).length > 0;
}

/** Minimal interview shape for latest-completed-by-mode selection. */
export type FocusInterviewLike = {
  createdAt: string;
  mode: InterviewMode;
  status: string;
  scorecard?: { improvements?: string[] } | null;
};

export type ModeFocusResult = {
  improvements: string[];
  assessedAt?: string;
};

/**
 * Latest completed scorecard improvements for a single mode only.
 * Ignores other modes, active sessions, and missing scorecards (no cross-mode leakage).
 */
export function latestCompletedImprovementsForMode(
  interviews: FocusInterviewLike[],
  mode: InterviewMode,
): ModeFocusResult {
  const completed = interviews.filter(
    (i) => i.mode === mode && i.status === "completed" && i.scorecard,
  );
  if (completed.length === 0) return { improvements: [] };

  const latest = [...completed].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];

  return {
    improvements: normalizeFocusAreas(latest.scorecard?.improvements),
    assessedAt: latest.createdAt,
  };
}
