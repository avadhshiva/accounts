import { describe, expect, it } from "vitest";
import {
  isSetupAssessCtaEnabled,
  isSetupPracticeCtaEnabled,
  setupStartIntent,
} from "../setupCta";

describe("setup Start practice / Start interview CTA contract", () => {
  it("Start practice maps to practice intent even if Assess Mode card was selected", () => {
    // Regression: Assess Mode selected + click Start practice must still start practice.
    expect(setupStartIntent("start-practice")).toBe("practice");
  });

  it("Start interview / assess CTA maps to assess intent", () => {
    expect(setupStartIntent("start-assess")).toBe("assess");
  });

  it("Start practice remains enabled when not loading (not gated on assess card)", () => {
    expect(isSetupPracticeCtaEnabled(false)).toBe(true);
    expect(isSetupPracticeCtaEnabled(true)).toBe(false);
  });

  it("Start interview remains enabled when not loading and quota allows", () => {
    expect(isSetupAssessCtaEnabled(false, true)).toBe(true);
    expect(isSetupAssessCtaEnabled(false, false)).toBe(false);
    expect(isSetupAssessCtaEnabled(true, true)).toBe(false);
  });
});
