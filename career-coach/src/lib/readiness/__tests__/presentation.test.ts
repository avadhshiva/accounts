import { describe, expect, it } from "vitest";
import type { ReadinessCategory, ReadinessSnapshot } from "../types";
import {
  categoryHref,
  formatCategoryTile,
  formatOverallHeadline,
  gapsEmptyCopy,
  isActionCategoryDone,
  isMissionNextActionsComplete,
  missionNextActionsEmptyFallbackCopy,
  missionOnboardingCopy,
  missionProgressPercent,
  pilotDayNumber,
  strengthsEmptyCopy,
} from "../presentation";

function baseSnapshot(
  overrides: Partial<ReadinessSnapshot> = {},
): ReadinessSnapshot {
  return {
    computedAt: "2026-08-19T12:00:00.000Z",
    overallStatus: "insufficient_data",
    completedCategoryCount: 0,
    categories: [],
    strengths: [],
    gaps: [],
    nextActions: [],
    ...overrides,
  };
}

function category(
  overrides: Partial<ReadinessCategory> & { id: ReadinessCategory["id"] },
): ReadinessCategory {
  return {
    label: overrides.id,
    status: "insufficient_data",
    ...overrides,
  };
}

describe("presentation helpers", () => {
  it("formatOverallHeadline for insufficient_data has no numeric score", () => {
    const headline = formatOverallHeadline(baseSnapshot());
    expect(headline.kind).toBe("insufficient");
    expect(headline.displayScore).toBeUndefined();
    expect(headline.headline).toBe("Not scored yet");
    expect(headline.headline).not.toMatch(/\d/);
    expect(headline.ariaLabel).toContain("not yet calculated");
  });

  it("formatOverallHeadline for complete formats score and count subline", () => {
    const headline = formatOverallHeadline(
      baseSnapshot({
        overall: 72,
        overallStatus: "complete",
        completedCategoryCount: 3,
      }),
    );
    expect(headline.kind).toBe("complete");
    expect(headline.displayScore).toBe("72");
    expect(headline.subline).toBe("Based on 3 of 6 areas");
    expect(headline.ariaLabel).toContain("72 out of 100");
  });

  it("formatCategoryTile for insufficient_data uses Not assessed yet", () => {
    const tile = formatCategoryTile(category({ id: "hr", label: "HR mock" }));
    expect(tile.statusLabel).toBe("Not assessed yet");
    expect(tile.isInsufficient).toBe(true);
    expect(tile.statusLabel).not.toMatch(/fail/i);
  });

  it("formatCategoryTile for learn uses progress not tracked copy", () => {
    const tile = formatCategoryTile(category({ id: "learn", label: "Learn progress" }));
    expect(tile.statusLabel).toBe("Progress not tracked yet");
    expect(tile.ctaLabel).toBe("Go to Learn");
  });

  it("formatCategoryTile for complete score below 70 includes Needs work tier", () => {
    const tile = formatCategoryTile(
      category({
        id: "technical",
        label: "Technical mock",
        status: "complete",
        score: 65,
      }),
    );
    expect(tile.needsWork).toBe(true);
    expect(tile.statusLabel).toBe("Needs work");
    expect(tile.scoreLabel).toBe("65/100");
  });

  it("missionProgressPercent returns 50 for 3 of 6", () => {
    expect(missionProgressPercent(3)).toBe(50);
  });

  it("pilotDayNumber returns 1 on trial start day", () => {
    const start = new Date("2026-08-19T10:00:00.000Z");
    const now = new Date("2026-08-19T15:00:00.000Z");
    expect(pilotDayNumber(start.toISOString(), now, 7)).toBe(1);
  });

  it("pilotDayNumber increments by calendar day", () => {
    const start = new Date("2026-08-19T10:00:00.000Z");
    const now = new Date("2026-08-20T10:00:00.000Z");
    expect(pilotDayNumber(start.toISOString(), now, 7)).toBe(2);
  });

  it("categoryHref for mock categories includes interview mode query param", () => {
    expect(categoryHref("hr")).toBe("/interview?mode=hr");
    expect(categoryHref("technical")).toBe("/interview?mode=technical");
    expect(categoryHref("genai")).toBe("/interview?mode=genai");
    expect(categoryHref("aptitude")).toBe("/interview?mode=aptitude");
  });

  it("categoryHref for resume and learn omit query params", () => {
    expect(categoryHref("resume")).toBe("/resume");
    expect(categoryHref("learn")).toBe("/learn");
  });

  it("empty copy helpers return onboarding strings", () => {
    expect(strengthsEmptyCopy()).toContain("resume assessment");
    expect(gapsEmptyCopy()).toContain("mock interview");
    expect(missionOnboardingCopy()).toContain("resume score");
  });

  it("isActionCategoryDone is true only for complete score >= 70", () => {
    expect(
      isActionCategoryDone(
        category({ id: "resume", label: "Resume", status: "complete", score: 75 }),
      ),
    ).toBe(true);
    expect(
      isActionCategoryDone(
        category({ id: "resume", label: "Resume", status: "complete", score: 65 }),
      ),
    ).toBe(false);
    expect(isActionCategoryDone(category({ id: "hr", label: "HR mock" }))).toBe(false);
  });

  it("isMissionNextActionsComplete is true when all six categories score >= 70", () => {
    const allComplete = [
      category({ id: "resume", label: "Resume", status: "complete", score: 80 }),
      category({ id: "hr", label: "HR mock", status: "complete", score: 75 }),
      category({ id: "technical", label: "Technical mock", status: "complete", score: 70 }),
      category({ id: "genai", label: "GenAI mock", status: "complete", score: 85 }),
      category({ id: "aptitude", label: "Aptitude mock", status: "complete", score: 72 }),
      category({ id: "learn", label: "Learn progress", status: "complete", score: 90 }),
    ];
    expect(isMissionNextActionsComplete(allComplete)).toBe(true);
  });

  it("isMissionNextActionsComplete is false with one insufficient category", () => {
    const withInsufficient = [
      category({ id: "resume", label: "Resume", status: "complete", score: 80 }),
      category({ id: "hr", label: "HR mock", status: "complete", score: 75 }),
      category({ id: "technical", label: "Technical mock", status: "complete", score: 70 }),
      category({ id: "genai", label: "GenAI mock", status: "complete", score: 85 }),
      category({ id: "aptitude", label: "Aptitude mock", status: "complete", score: 72 }),
      category({ id: "learn", label: "Learn progress", status: "insufficient_data" }),
    ];
    expect(isMissionNextActionsComplete(withInsufficient)).toBe(false);
  });

  it("isMissionNextActionsComplete is false with one complete score below 70", () => {
    const withWeak = [
      category({ id: "resume", label: "Resume", status: "complete", score: 80 }),
      category({ id: "hr", label: "HR mock", status: "complete", score: 65 }),
      category({ id: "technical", label: "Technical mock", status: "complete", score: 70 }),
      category({ id: "genai", label: "GenAI mock", status: "complete", score: 85 }),
      category({ id: "aptitude", label: "Aptitude mock", status: "complete", score: 72 }),
      category({ id: "learn", label: "Learn progress", status: "complete", score: 90 }),
    ];
    expect(isMissionNextActionsComplete(withWeak)).toBe(false);
  });

  it("isMissionNextActionsComplete is false for empty or non-six category lists", () => {
    expect(isMissionNextActionsComplete([])).toBe(false);
    expect(
      isMissionNextActionsComplete([
        category({ id: "resume", label: "Resume", status: "complete", score: 80 }),
      ]),
    ).toBe(false);
  });

  it("isMissionNextActionsComplete requires numeric scores", () => {
    const withoutNumericScore = [
      category({ id: "resume", label: "Resume", status: "complete" }),
      category({ id: "hr", label: "HR mock", status: "complete", score: 75 }),
      category({ id: "technical", label: "Technical mock", status: "complete", score: 70 }),
      category({ id: "genai", label: "GenAI mock", status: "complete", score: 85 }),
      category({ id: "aptitude", label: "Aptitude mock", status: "complete", score: 72 }),
      category({ id: "learn", label: "Learn progress", status: "complete", score: 90 }),
    ];
    expect(isMissionNextActionsComplete(withoutNumericScore)).toBe(false);
  });

  it("missionNextActionsEmptyFallbackCopy does not mention resume specifically", () => {
    expect(missionNextActionsEmptyFallbackCopy()).toContain("Complete assessments");
    expect(missionNextActionsEmptyFallbackCopy().toLowerCase()).not.toContain("resume");
  });
});
