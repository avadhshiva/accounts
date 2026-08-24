import { describe, expect, it } from "vitest";
import {
  canStartAssessmentForMode,
  countAssessmentAttemptsForMode,
  countTotalMockSessionsUsed,
  formatCategoryQuotaErrorMessage,
  formatMockSessionsHeaderLabel,
  formatSessionUsageLabel,
  getTotalMockSessionsLimit,
  isAssessmentExhaustedForMode,
} from "./assessmentQuota";
import type { InterviewMode, User } from "./types";

const trialUser: Pick<User, "plan" | "access"> = { plan: "pro", access: "trial" };

function sessions(mode: InterviewMode, count: number) {
  return Array.from({ length: count }, () => ({ mode }));
}

describe("assessmentQuota", () => {
  it("counts attempts per mode only", () => {
    const interviews = [...sessions("aptitude", 2), ...sessions("technical", 1)];
    expect(countAssessmentAttemptsForMode(interviews, "aptitude")).toBe(2);
    expect(countAssessmentAttemptsForMode(interviews, "technical")).toBe(1);
    expect(countAssessmentAttemptsForMode(interviews, "hr")).toBe(0);
  });

  it("allows up to 2 aptitude attempts then blocks aptitude only", () => {
    const interviews = sessions("aptitude", 2);
    expect(canStartAssessmentForMode(trialUser, "aptitude", interviews)).toBe(false);
    expect(canStartAssessmentForMode(trialUser, "technical", interviews)).toBe(true);
    expect(canStartAssessmentForMode(trialUser, "hr", interviews)).toBe(true);
    expect(canStartAssessmentForMode(trialUser, "genai", interviews)).toBe(true);
  });

  it("allows technical after aptitude is exhausted", () => {
    const interviews = sessions("aptitude", 2);
    expect(isAssessmentExhaustedForMode(trialUser, "aptitude", interviews)).toBe(true);
    expect(isAssessmentExhaustedForMode(trialUser, "technical", interviews)).toBe(false);
  });

  it("blocks third attempt within a category", () => {
    expect(canStartAssessmentForMode(trialUser, "hr", sessions("hr", 2))).toBe(false);
    expect(canStartAssessmentForMode(trialUser, "hr", sessions("hr", 3))).toBe(false);
  });

  it("totals mock sessions across categories up to 8 for pilot trial", () => {
    const interviews = [
      ...sessions("aptitude", 2),
      ...sessions("technical", 1),
      ...sessions("hr", 0),
      ...sessions("genai", 0),
    ];
    expect(countTotalMockSessionsUsed(interviews)).toBe(3);
    expect(getTotalMockSessionsLimit(trialUser)).toBe(8);
    expect(formatMockSessionsHeaderLabel(3, 8)).toBe("3/8 mocks");
  });

  it("header label never exceeds denominator", () => {
    expect(formatMockSessionsHeaderLabel(10, 8)).toBe("8/8 mocks");
  });

  it("formats category-specific quota error message", () => {
    expect(formatCategoryQuotaErrorMessage("aptitude")).toBe(
      "Aptitude & Reasoning mock limit reached (2 sessions).",
    );
  });

  it("formats session usage label", () => {
    expect(formatSessionUsageLabel(1, 2)).toBe("1/2 sessions used");
  });
});
