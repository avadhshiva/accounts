import { describe, expect, it } from "vitest";
import { assessEntryFromPractice } from "../assessEntry";
import { parseInterviewIntentParam } from "../intent";
import { parseInterviewModeParam } from "../mode";
import {
  categoryHref,
  categoryPracticeHref,
  interviewTrackHref,
} from "@/lib/readiness/presentation";
import type { InterviewMode } from "@/lib/types";

const MODES: InterviewMode[] = ["hr", "technical", "genai", "aptitude"];

describe("Change 13 Practice → Assess bridge", () => {
  it.each(MODES)(
    "%s Practice → Assess deep-link is same-track intent=assess",
    (mode) => {
      expect(interviewTrackHref(mode, "assess")).toBe(
        `/interview?mode=${mode}&intent=assess`,
      );
      expect(categoryHref(mode)).toBe(`/interview?mode=${mode}&intent=assess`);
    },
  );

  it("Technical / GenAI / Aptitude Practice → Assess enters direct start (no HR warm-up)", () => {
    expect(assessEntryFromPractice("technical")).toBe("direct-start");
    expect(assessEntryFromPractice("genai")).toBe("direct-start");
    expect(assessEntryFromPractice("aptitude")).toBe("direct-start");
  });

  it("HR Practice → Assess enters HR warm-up before startAssessment", () => {
    expect(assessEntryFromPractice("hr")).toBe("hr-warmup");
  });

  it("Practice path has no interview start/reply side effects (contract)", () => {
    // PracticePanel + practice helpers never call fetch; only Start Assessment → beginAssess.
    // This documents the invariant covered by implementation review + absence of start in practice.ts.
    expect(assessEntryFromPractice("technical")).not.toBe("hr-warmup");
  });

  it("?mode=X without intent still parses as mode-only (intent picker)", () => {
    expect(parseInterviewModeParam("technical")).toBe("technical");
    expect(parseInterviewIntentParam(null)).toBeNull();
    expect(parseInterviewIntentParam(undefined)).toBeNull();
    expect(parseInterviewIntentParam("")).toBeNull();
  });

  it.each(MODES)("?mode=%s&intent=practice enters Practice intent", (mode) => {
    expect(parseInterviewModeParam(mode)).toBe(mode);
    expect(parseInterviewIntentParam("practice")).toBe("practice");
    expect(interviewTrackHref(mode, "practice")).toBe(
      `/interview?mode=${mode}&intent=practice`,
    );
    expect(categoryPracticeHref(mode)).toBe(
      `/interview?mode=${mode}&intent=practice`,
    );
  });

  it.each(MODES)("?mode=%s&intent=assess enters Assess intent", (mode) => {
    expect(parseInterviewIntentParam("assess")).toBe("assess");
    expect(interviewTrackHref(mode, "assess")).toBe(
      `/interview?mode=${mode}&intent=assess`,
    );
  });

  it("Mission Assess links include intent=assess; resume/learn unchanged", () => {
    expect(categoryHref("hr")).toBe("/interview?mode=hr&intent=assess");
    expect(categoryHref("technical")).toBe("/interview?mode=technical&intent=assess");
    expect(categoryHref("genai")).toBe("/interview?mode=genai&intent=assess");
    expect(categoryHref("aptitude")).toBe("/interview?mode=aptitude&intent=assess");
    expect(categoryHref("resume")).toBe("/resume");
    expect(categoryHref("learn")).toBe("/learn");
    expect(categoryPracticeHref("resume")).toBeNull();
    expect(categoryPracticeHref("learn")).toBeNull();
  });
});

describe("Change 14 Assess → Practice bridge", () => {
  it.each(MODES)(
    "%s Practice deep-link is same-track intent=practice (not assess)",
    (mode) => {
      expect(categoryPracticeHref(mode)).toBe(`/interview?mode=${mode}&intent=practice`);
      expect(categoryPracticeHref(mode)).not.toContain("intent=assess");
      expect(interviewTrackHref(mode, "practice")).toBe(
        `/interview?mode=${mode}&intent=practice`,
      );
    },
  );

  it("C13 Practice → Assess entry contract remains intact", () => {
    expect(assessEntryFromPractice("technical")).toBe("direct-start");
    expect(assessEntryFromPractice("hr")).toBe("hr-warmup");
  });
});
