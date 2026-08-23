import { describe, expect, it } from "vitest";
import {
  hasPracticeFocus,
  latestCompletedImprovementsForMode,
  MAX_FOCUS_AREAS,
  normalizeFocusAreas,
  type FocusInterviewLike,
} from "../focus";
import type { InterviewMode } from "@/lib/types";

const MODES: InterviewMode[] = ["hr", "technical", "genai", "aptitude"];

function interview(
  partial: Partial<FocusInterviewLike> & Pick<FocusInterviewLike, "mode" | "createdAt">,
): FocusInterviewLike {
  return {
    status: "completed",
    scorecard: { improvements: ["default"] },
    ...partial,
  };
}

describe("normalizeFocusAreas", () => {
  it("returns empty for missing or blank improvements", () => {
    expect(normalizeFocusAreas(undefined)).toEqual([]);
    expect(normalizeFocusAreas(null)).toEqual([]);
    expect(normalizeFocusAreas([])).toEqual([]);
    expect(normalizeFocusAreas(["  ", ""])).toEqual([]);
  });

  it("trims, dedupes, and caps Focus areas", () => {
    expect(
      normalizeFocusAreas([
        "  Use STAR  ",
        "Use STAR",
        "Add metrics",
        "Keep short",
        "Fourth ignored",
      ]),
    ).toEqual(["Use STAR", "Add metrics", "Keep short"]);
    expect(normalizeFocusAreas(["a", "b", "c", "d"]).length).toBe(MAX_FOCUS_AREAS);
  });

  it("hasPracticeFocus is true only when normalized list is non-empty", () => {
    expect(hasPracticeFocus(["x"])).toBe(true);
    expect(hasPracticeFocus(["  "])).toBe(false);
    expect(hasPracticeFocus([])).toBe(false);
  });
});

describe("latestCompletedImprovementsForMode — mode isolation", () => {
  it("returns empty when no completed scorecard for that mode", () => {
    const rows: FocusInterviewLike[] = [
      interview({
        mode: "hr",
        createdAt: "2026-01-02T00:00:00.000Z",
        scorecard: { improvements: ["HR tip"] },
      }),
      interview({
        mode: "technical",
        createdAt: "2026-01-03T00:00:00.000Z",
        status: "active",
        scorecard: { improvements: ["should ignore active"] },
      }),
    ];
    expect(latestCompletedImprovementsForMode(rows, "technical")).toEqual({
      improvements: [],
    });
    expect(latestCompletedImprovementsForMode(rows, "genai")).toEqual({
      improvements: [],
    });
  });

  it("Technical focus does not leak into HR (and vice versa)", () => {
    const rows: FocusInterviewLike[] = [
      interview({
        mode: "technical",
        createdAt: "2026-01-04T00:00:00.000Z",
        scorecard: {
          improvements: ["State time complexity", "Start with brute force"],
        },
      }),
      interview({
        mode: "hr",
        createdAt: "2026-01-05T00:00:00.000Z",
        scorecard: { improvements: ["Use STAR", "Keep under 90 seconds"] },
      }),
    ];

    const tech = latestCompletedImprovementsForMode(rows, "technical");
    const hr = latestCompletedImprovementsForMode(rows, "hr");

    expect(tech.improvements).toEqual([
      "State time complexity",
      "Start with brute force",
    ]);
    expect(tech.improvements.join(" ")).not.toMatch(/STAR|90 seconds/);
    expect(hr.improvements).toEqual(["Use STAR", "Keep under 90 seconds"]);
    expect(hr.improvements.join(" ")).not.toMatch(/complexity|brute force/);
  });

  it.each(MODES)("%s returns only that mode's latest completed improvements", (mode) => {
    const rows: FocusInterviewLike[] = MODES.flatMap((m, idx) => [
      interview({
        mode: m,
        createdAt: `2026-01-0${idx + 1}T00:00:00.000Z`,
        scorecard: { improvements: [`${m}-old`] },
      }),
      interview({
        mode: m,
        createdAt: `2026-02-0${idx + 1}T00:00:00.000Z`,
        scorecard: { improvements: [`${m}-latest`] },
      }),
    ]);

    const result = latestCompletedImprovementsForMode(rows, mode);
    expect(result.improvements).toEqual([`${mode}-latest`]);
    expect(result.assessedAt).toBe(`2026-02-0${MODES.indexOf(mode) + 1}T00:00:00.000Z`);
    for (const other of MODES.filter((m) => m !== mode)) {
      expect(result.improvements.join(" ")).not.toContain(`${other}-`);
    }
  });

  it("ignores completed interviews without scorecard", () => {
    const rows: FocusInterviewLike[] = [
      interview({
        mode: "genai",
        createdAt: "2026-01-01T00:00:00.000Z",
        scorecard: null,
      }),
      interview({
        mode: "genai",
        createdAt: "2026-01-02T00:00:00.000Z",
        scorecard: { improvements: [] },
      }),
    ];
    expect(latestCompletedImprovementsForMode(rows, "genai")).toEqual({
      improvements: [],
      assessedAt: "2026-01-02T00:00:00.000Z",
    });
  });
});
