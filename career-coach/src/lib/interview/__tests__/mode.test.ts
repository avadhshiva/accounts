import { describe, expect, it } from "vitest";
import {
  DEFAULT_INTERVIEW_MODE,
  isInterviewMode,
  parseInterviewModeParam,
} from "../mode";

describe("parseInterviewModeParam", () => {
  it("returns technical when mode param is missing", () => {
    expect(parseInterviewModeParam(null)).toBe(DEFAULT_INTERVIEW_MODE);
    expect(parseInterviewModeParam(undefined)).toBe("technical");
  });

  it("accepts each supported interview mode", () => {
    expect(parseInterviewModeParam("hr")).toBe("hr");
    expect(parseInterviewModeParam("technical")).toBe("technical");
    expect(parseInterviewModeParam("genai")).toBe("genai");
    expect(parseInterviewModeParam("aptitude")).toBe("aptitude");
  });

  it("falls back to technical for invalid mode values", () => {
    expect(parseInterviewModeParam("coding")).toBe("technical");
    expect(parseInterviewModeParam("")).toBe("technical");
  });

  it("isInterviewMode narrows valid modes only", () => {
    expect(isInterviewMode("hr")).toBe(true);
    expect(isInterviewMode("aptitude")).toBe(true);
    expect(isInterviewMode("resume")).toBe(false);
  });
});
