import { describe, expect, it } from "vitest";
import { getInviteCodes } from "@/lib/access";

describe("getInviteCodes", () => {
  it.each([
    ["missing key", {}],
    ["undefined", { INVITE_CODES: undefined }],
    ["empty", { INVITE_CODES: "" }],
    ["whitespace-only", { INVITE_CODES: "   \t " }],
    ["comma-only", { INVITE_CODES: " , ,, " }],
  ])("returns [] for %s", (_label, env) => {
    expect(getInviteCodes(env)).toEqual([]);
  });

  it("never defaults to the old demo codes", () => {
    for (const env of [{}, { INVITE_CODES: "" }, { INVITE_CODES: " , " }]) {
      const codes = getInviteCodes(env);
      expect(codes).not.toContain("PATHLY-DEMO");
      expect(codes).not.toContain("PATHLY-STUDENT");
    }
  });

  it("trims, uppercases, drops empty entries and removes duplicates", () => {
    expect(
      getInviteCodes({ INVITE_CODES: " test-one , Test-Two,, TEST-ONE ,test-two " }),
    ).toEqual(["TEST-ONE", "TEST-TWO"]);
  });

  it("reads process.env by default", () => {
    const prev = process.env.INVITE_CODES;
    process.env.INVITE_CODES = "env-code";
    try {
      expect(getInviteCodes()).toEqual(["ENV-CODE"]);
    } finally {
      if (prev === undefined) delete process.env.INVITE_CODES;
      else process.env.INVITE_CODES = prev;
    }
  });
});
