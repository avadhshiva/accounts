import { describe, expect, it } from "vitest";
import {
  mergeProgress,
  normalizeCompleted,
  progressSetsEqual,
} from "../merge";

describe("learn merge", () => {
  it("normalizeCompleted filters invalid slugs and dedupes", () => {
    expect(
      normalizeCompleted(["what-is-genai", "invalid-lesson", "what-is-genai"]),
    ).toEqual(["what-is-genai"]);
  });

  it("mergeProgress unions local and server completions", () => {
    const merged = mergeProgress(
      { completed: ["what-is-genai"], updatedAt: "2026-01-01T00:00:00.000Z" },
      { completed: ["prompting-that-works"], updatedAt: "2026-02-01T00:00:00.000Z" },
    );
    expect(merged.completed).toContain("what-is-genai");
    expect(merged.completed).toContain("prompting-that-works");
    expect(merged.updatedAt).toBe("2026-02-01T00:00:00.000Z");
  });

  it("mergeProgress preserves completions when lists differ (additive semantics)", () => {
    const merged = mergeProgress(
      { completed: ["what-is-genai"], updatedAt: "2026-01-01T00:00:00.000Z" },
      { completed: [], updatedAt: "2026-01-02T00:00:00.000Z" },
    );
    expect(merged.completed).toEqual(["what-is-genai"]);
  });

  it("mergeProgress handles empty local and server", () => {
    const merged = mergeProgress(
      { completed: [], updatedAt: "2026-01-01T00:00:00.000Z" },
      { completed: [], updatedAt: "2026-01-02T00:00:00.000Z" },
    );
    expect(merged.completed).toEqual([]);
    expect(merged.updatedAt).toBe("2026-01-02T00:00:00.000Z");
  });

  it("mergeProgress uses max updatedAt", () => {
    const merged = mergeProgress(
      { completed: [], updatedAt: "2026-03-01T00:00:00.000Z" },
      { completed: [], updatedAt: "2026-01-01T00:00:00.000Z" },
    );
    expect(merged.updatedAt).toBe("2026-03-01T00:00:00.000Z");
  });

  it("progressSetsEqual compares normalized completion sets", () => {
    const a = { completed: ["what-is-genai"], updatedAt: "2026-01-01T00:00:00.000Z" };
    const b = { completed: ["what-is-genai", "invalid"], updatedAt: "2026-02-01T00:00:00.000Z" };
    expect(progressSetsEqual(a, b)).toBe(true);
  });
});
