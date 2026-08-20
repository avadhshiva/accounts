import { describe, expect, it } from "vitest";
import { getAllLessons } from "@/lib/content";
import { computeReadiness } from "../compute";
import type { ReadinessComputeInput } from "../types";

const NOW = new Date("2026-08-19T12:00:00.000Z");

function compute(input: ReadinessComputeInput) {
  return computeReadiness(input, NOW);
}

describe("computeReadiness", () => {
  it("returns insufficient overall with empty data and no fabricated strengths/gaps", () => {
    const result = compute({ resumes: [], interviews: [] });
    expect(result.overallStatus).toBe("insufficient_data");
    expect(result.overall).toBeUndefined();
    expect(result.completedCategoryCount).toBe(0);
    expect(result.strengths).toEqual([]);
    expect(result.gaps).toEqual([]);
    expect(
      result.categories.every((c) => c.status === "insufficient_data"),
    ).toBe(true);
  });

  it("scores resume only from latest resume", () => {
    const result = compute({
      resumes: [
        {
          createdAt: "2026-01-01T00:00:00.000Z",
          score: 55,
          strengths: ["older"],
          gaps: ["old gap"],
        },
        {
          createdAt: "2026-02-01T00:00:00.000Z",
          score: 82,
          strengths: ["recent strength"],
          gaps: ["recent gap"],
        },
      ],
      interviews: [],
    });
    expect(result.overall).toBe(82);
    expect(result.completedCategoryCount).toBe(1);
    expect(result.categories.find((c) => c.id === "resume")).toMatchObject({
      status: "complete",
      score: 82,
    });
    expect(result.strengths).toEqual(["recent strength"]);
    expect(result.gaps).toEqual(["recent gap"]);
  });

  it("averages resume and HR completed interview scores", () => {
    const result = compute({
      resumes: [
        {
          createdAt: "2026-01-01T00:00:00.000Z",
          score: 80,
          strengths: [],
          gaps: [],
        },
      ],
      interviews: [
        {
          createdAt: "2026-01-02T00:00:00.000Z",
          mode: "hr",
          status: "completed",
          scorecard: {
            overall: 60,
            feedback: "ok",
            improvements: ["use STAR"],
          },
        },
      ],
    });
    expect(result.overall).toBe(70);
    expect(result.completedCategoryCount).toBe(2);
    expect(result.categories.find((c) => c.id === "hr")).toMatchObject({
      status: "complete",
      score: 60,
    });
  });

  it("selects latest completed interview per mode by createdAt", () => {
    const result = compute({
      resumes: [],
      interviews: [
        {
          createdAt: "2026-01-01T00:00:00.000Z",
          mode: "hr",
          status: "completed",
          scorecard: { overall: 50, feedback: "a", improvements: [] },
        },
        {
          createdAt: "2026-02-01T00:00:00.000Z",
          mode: "hr",
          status: "completed",
          scorecard: { overall: 90, feedback: "b", improvements: [] },
        },
      ],
    });
    expect(result.categories.find((c) => c.id === "hr")).toMatchObject({
      status: "complete",
      score: 90,
    });
    expect(result.overall).toBe(90);
  });

  it("treats completed interview without scorecard as insufficient_data", () => {
    const result = compute({
      resumes: [],
      interviews: [
        {
          createdAt: "2026-01-01T00:00:00.000Z",
          mode: "technical",
          status: "completed",
        },
      ],
    });
    expect(result.categories.find((c) => c.id === "technical")).toMatchObject({
      status: "insufficient_data",
    });
    expect(result.overall).toBeUndefined();
  });

  it("ignores active interviews even if scorecard is present", () => {
    const result = compute({
      resumes: [],
      interviews: [
        {
          createdAt: "2026-01-01T00:00:00.000Z",
          mode: "genai",
          status: "active",
          scorecard: { overall: 95, feedback: "x", improvements: [] },
        },
      ],
    });
    expect(result.categories.find((c) => c.id === "genai")).toMatchObject({
      status: "insufficient_data",
    });
    expect(result.overall).toBeUndefined();
  });

  it("adds weak-category nextAction when a completed category is below 70", () => {
    const result = compute({
      resumes: [
        {
          createdAt: "2026-01-01T00:00:00.000Z",
          score: 85,
          strengths: [],
          gaps: [],
        },
      ],
      interviews: [
        {
          createdAt: "2026-01-02T00:00:00.000Z",
          mode: "hr",
          status: "completed",
          scorecard: { overall: 55, feedback: "weak", improvements: [] },
        },
      ],
    });
    expect(result.nextActions.some((a) => a.label.toLowerCase().includes("below 70"))).toBe(
      true,
    );
  });

  it("prioritizes score your resume when resume is missing", () => {
    const result = compute({ resumes: [], interviews: [] });
    expect(result.nextActions[0]).toMatchObject({
      label: "Score your resume",
      href: "/resume",
    });
  });

  it("suggests completing a mock interview when none are completed", () => {
    const result = compute({
      resumes: [
        {
          createdAt: "2026-01-01T00:00:00.000Z",
          score: 70,
          strengths: [],
          gaps: [],
        },
      ],
      interviews: [
        {
          createdAt: "2026-01-02T00:00:00.000Z",
          mode: "hr",
          status: "active",
        },
      ],
    });
    expect(result.nextActions.some((a) => a.label === "Complete a mock interview")).toBe(true);
  });

  it("uses scorecard improvements for gaps when resume gaps are empty", () => {
    const result = compute({
      resumes: [
        {
          createdAt: "2026-01-01T00:00:00.000Z",
          score: 75,
          strengths: [],
          gaps: [],
        },
      ],
      interviews: [
        {
          createdAt: "2026-01-02T00:00:00.000Z",
          mode: "hr",
          status: "completed",
          scorecard: {
            overall: 80,
            feedback: "fine",
            improvements: ["Add metrics", "Shorten answers"],
          },
        },
      ],
    });
    expect(result.gaps).toEqual(["Add metrics", "Shorten answers"]);
  });

  it("does not use scorecard improvements as strengths", () => {
    const result = compute({
      resumes: [
        {
          createdAt: "2026-01-01T00:00:00.000Z",
          score: 75,
          strengths: [],
          gaps: [],
        },
      ],
      interviews: [
        {
          createdAt: "2026-01-02T00:00:00.000Z",
          mode: "hr",
          status: "completed",
          scorecard: {
            overall: 80,
            feedback: "fine",
            improvements: ["Add metrics"],
          },
        },
      ],
    });
    expect(result.strengths).toEqual([]);
  });

  it("marks learn as insufficient_data when no lessons completed", () => {
    const result = compute({ resumes: [], interviews: [], learnCompleted: [] });
    expect(result.categories.find((c) => c.id === "learn")).toMatchObject({
      status: "insufficient_data",
    });
    expect(result.overall).toBeUndefined();
  });

  it("scores learn from partial persisted lesson completion", () => {
    const result = compute({
      resumes: [],
      interviews: [],
      learnCompleted: ["what-is-genai"],
      learnProgressUpdatedAt: "2026-02-01T00:00:00.000Z",
    });
    const learn = result.categories.find((c) => c.id === "learn");
    expect(learn).toMatchObject({
      status: "complete",
      score: 6,
      source: "learn_progress",
      assessedAt: "2026-02-01T00:00:00.000Z",
    });
    expect(result.overall).toBe(6);
    expect(result.completedCategoryCount).toBe(1);
  });

  it("scores learn at 100 when all canonical lessons are completed", () => {
    const allSlugs = getAllLessons().map((l) => l.slug);
    const result = compute({
      resumes: [],
      interviews: [],
      learnCompleted: allSlugs,
    });
    expect(result.categories.find((c) => c.id === "learn")).toMatchObject({
      status: "complete",
      score: 100,
    });
    expect(result.overall).toBe(100);
  });

  it("ignores invalid lesson slugs when scoring learn", () => {
    const withInvalid = compute({
      resumes: [],
      interviews: [],
      learnCompleted: ["what-is-genai", "not-a-real-lesson"],
    });
    const validOnly = compute({
      resumes: [],
      interviews: [],
      learnCompleted: ["what-is-genai"],
    });
    expect(withInvalid.categories.find((c) => c.id === "learn")?.score).toBe(
      validOnly.categories.find((c) => c.id === "learn")?.score,
    );
  });

  it("includes learn in overall only when learn has a valid score", () => {
    const result = compute({
      resumes: [
        {
          createdAt: "2026-01-01T00:00:00.000Z",
          score: 80,
          strengths: [],
          gaps: [],
        },
      ],
      interviews: [],
      learnCompleted: ["what-is-genai"],
    });
    expect(result.overall).toBe(43);
    expect(result.completedCategoryCount).toBe(2);
  });

  it("does not fabricate strengths from learn progress", () => {
    const result = compute({
      resumes: [],
      interviews: [],
      learnCompleted: ["what-is-genai", "prompting-that-works"],
    });
    expect(result.strengths).toEqual([]);
  });

  it("adds learn weak-category gap from actual score without fabrication", () => {
    const result = compute({
      resumes: [],
      interviews: [],
      learnCompleted: ["what-is-genai"],
    });
    expect(result.gaps.some((g) => g.includes("Learn progress below 70"))).toBe(true);
  });

  it("preserves resume and HR scoring when learn progress is present", () => {
    const result = compute({
      resumes: [
        {
          createdAt: "2026-01-01T00:00:00.000Z",
          score: 80,
          strengths: [],
          gaps: [],
        },
      ],
      interviews: [
        {
          createdAt: "2026-01-02T00:00:00.000Z",
          mode: "hr",
          status: "completed",
          scorecard: {
            overall: 60,
            feedback: "ok",
            improvements: ["use STAR"],
          },
        },
      ],
      learnCompleted: ["what-is-genai"],
    });
    expect(result.categories.find((c) => c.id === "resume")).toMatchObject({
      status: "complete",
      score: 80,
    });
    expect(result.categories.find((c) => c.id === "hr")).toMatchObject({
      status: "complete",
      score: 60,
    });
    expect(result.categories.find((c) => c.id === "learn")).toMatchObject({
      status: "complete",
      score: 6,
    });
    expect(result.overall).toBe(49);
  });

  it("clamps overall score to 0-100", () => {
    const result = compute({
      resumes: [
        {
          createdAt: "2026-01-01T00:00:00.000Z",
          score: 100,
          strengths: [],
          gaps: [],
        },
      ],
      interviews: [
        {
          createdAt: "2026-01-02T00:00:00.000Z",
          mode: "hr",
          status: "completed",
          scorecard: { overall: 100, feedback: "", improvements: [] },
        },
      ],
    });
    expect(result.overall).toBe(100);
  });
});
