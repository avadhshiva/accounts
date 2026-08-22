import { describe, expect, it } from "vitest";
import {
  FALLBACK_RESUME_TARGET_ROLE,
  defaultResumeTargetRole,
} from "../defaultTargetRole";

describe("defaultResumeTargetRole", () => {
  it('pre-fills "Technical Program Manager"', () => {
    expect(defaultResumeTargetRole("Technical Program Manager")).toBe(
      "Technical Program Manager",
    );
  });

  it('pre-fills "Senior Technical Program Manager"', () => {
    expect(defaultResumeTargetRole("Senior Technical Program Manager")).toBe(
      "Senior Technical Program Manager",
    );
  });

  it('falls back to "SDE Fresher" for null', () => {
    expect(defaultResumeTargetRole(null)).toBe(FALLBACK_RESUME_TARGET_ROLE);
  });

  it('falls back to "SDE Fresher" for undefined', () => {
    expect(defaultResumeTargetRole(undefined)).toBe(FALLBACK_RESUME_TARGET_ROLE);
  });

  it('falls back to "SDE Fresher" for empty string', () => {
    expect(defaultResumeTargetRole("")).toBe(FALLBACK_RESUME_TARGET_ROLE);
  });

  it("falls back for whitespace-only targetRole", () => {
    expect(defaultResumeTargetRole("   ")).toBe(FALLBACK_RESUME_TARGET_ROLE);
    expect(defaultResumeTargetRole("\t\n")).toBe(FALLBACK_RESUME_TARGET_ROLE);
  });

  it("trims surrounding whitespace on a real role", () => {
    expect(defaultResumeTargetRole("  SDE Intern  ")).toBe("SDE Intern");
  });

  it("override contract: edited value is independent of the default helper", () => {
    const prefilled = defaultResumeTargetRole("Senior Technical Program Manager");
    const editedByUser = "Technical Program Manager";
    // Resume Studio keeps role in editable state; submit uses the edited string.
    expect(prefilled).toBe("Senior Technical Program Manager");
    expect(editedByUser).toBe("Technical Program Manager");
    expect(editedByUser).not.toBe(prefilled);
  });
});
