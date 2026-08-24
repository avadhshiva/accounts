import { describe, expect, it } from "vitest";
import { formatNavUsagePill } from "./display";

const trialUser = {
  plan: "pro" as const,
  access: "trial" as const,
  trialStartedAt: "2026-08-01T00:00:00.000Z",
  usage: { resumeAnalyses: 0, mockInterviews: 4, monthKey: "2026-08" },
};

describe("formatNavUsagePill", () => {
  it("shows per-category total mock counter (not stale global usage.mockInterviews)", () => {
    const pill = formatNavUsagePill(trialUser, "6d 1h", { used: 3, total: 8 });
    expect(pill).toContain("0/3 resume scores");
    expect(pill).toContain("3/8 mocks");
    expect(pill).not.toContain("4/2");
  });

  it("clamps impossible numerator above total", () => {
    const pill = formatNavUsagePill(trialUser, undefined, { used: 12, total: 8 });
    expect(pill).toContain("8/8 mocks");
    expect(pill).not.toContain("12/8");
  });
});
