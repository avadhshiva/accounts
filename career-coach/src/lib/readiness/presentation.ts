import type { ReadinessCategory, ReadinessCategoryId, ReadinessSnapshot } from "./types";

export const MISSION_CATEGORY_COUNT = 6;

const CATEGORY_HREF: Record<ReadinessCategoryId, string> = {
  resume: "/resume",
  hr: "/interview",
  technical: "/interview",
  genai: "/interview",
  aptitude: "/interview",
  learn: "/learn",
};

export function categoryHref(id: ReadinessCategoryId): string {
  return CATEGORY_HREF[id];
}

export function missionProgressPercent(completedCategoryCount: number): number {
  const clamped = Math.max(0, Math.min(completedCategoryCount, MISSION_CATEGORY_COUNT));
  return Math.round((clamped / MISSION_CATEGORY_COUNT) * 100);
}

export function pilotDayNumber(
  trialStartedAt: string | null | undefined,
  now = new Date(),
  maxDays = 7,
): number | null {
  if (!trialStartedAt) return null;
  const start = new Date(trialStartedAt);
  if (Number.isNaN(start.getTime())) return null;
  const msPerDay = 24 * 60 * 60 * 1000;
  const day = Math.floor((now.getTime() - start.getTime()) / msPerDay) + 1;
  return Math.max(1, Math.min(day, maxDays));
}

export type OverallHeadline = {
  kind: "insufficient" | "complete";
  displayScore?: string;
  headline: string;
  subline: string;
  ariaLabel: string;
};

export function formatOverallHeadline(readiness: ReadinessSnapshot): OverallHeadline {
  if (readiness.overallStatus === "insufficient_data" || readiness.overall === undefined) {
    return {
      kind: "insufficient",
      headline: "Not scored yet",
      subline: "Complete assessments to see your placement readiness score.",
      ariaLabel:
        "Placement readiness not yet calculated. Complete assessments to see your score.",
    };
  }

  const count = readiness.completedCategoryCount;
  return {
    kind: "complete",
    displayScore: String(readiness.overall),
    headline: String(readiness.overall),
    subline: `Based on ${count} of ${MISSION_CATEGORY_COUNT} areas`,
    ariaLabel: `Placement readiness ${readiness.overall} out of 100, based on ${count} assessed areas`,
  };
}

export type CategoryTilePresentation = {
  statusLabel: string;
  scoreLabel?: string;
  needsWork: boolean;
  href: string;
  ctaLabel: string;
  ariaLabel: string;
  isInsufficient: boolean;
};

export function formatCategoryTile(category: ReadinessCategory): CategoryTilePresentation {
  const href = categoryHref(category.id);
  const isInsufficient = category.status === "insufficient_data";

  if (isInsufficient) {
    const statusLabel =
      category.id === "learn" ? "Progress not tracked yet" : "Not assessed yet";
    return {
      statusLabel,
      needsWork: false,
      href,
      ctaLabel: category.id === "learn" ? "Go to Learn" : "Assess →",
      ariaLabel: `${category.label}: ${statusLabel}`,
      isInsufficient: true,
    };
  }

  const score = category.score ?? 0;
  const needsWork = score < 70;
  const scoreLabel = `${score}/100`;
  const tierLabel = needsWork ? "Needs work" : undefined;

  return {
    statusLabel: tierLabel ?? "Assessed",
    scoreLabel,
    needsWork,
    href,
    ctaLabel: "Review →",
    ariaLabel: `${category.label}: ${score} out of 100${needsWork ? ", needs work" : ""}`,
    isInsufficient: false,
  };
}

export function strengthsEmptyCopy(): string {
  return "Complete a resume assessment to see strengths.";
}

export function gapsEmptyCopy(): string {
  return "Gaps appear after resume or mock interview feedback.";
}

export function missionOnboardingCopy(): string {
  return "Start with a resume score, then complete mock interviews to build your placement readiness picture.";
}

export function isActionCategoryDone(category: ReadinessCategory | undefined): boolean {
  if (!category || category.status !== "complete") return false;
  return typeof category.score === "number" && category.score >= 70;
}

export function findCategoryById(
  categories: ReadinessCategory[],
  id: ReadinessCategoryId,
): ReadinessCategory | undefined {
  return categories.find((c) => c.id === id);
}

export function formatAssessedDate(assessedAt: string | undefined): string | undefined {
  if (!assessedAt) return undefined;
  const date = new Date(assessedAt);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
