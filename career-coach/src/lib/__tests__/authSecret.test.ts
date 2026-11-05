import { describe, expect, it } from "vitest";
import { getAuthSecret, MIN_AUTH_SECRET_LENGTH } from "../authSecret";

const STRONG = "k3Jx9vQ2mZpL7wRtYb4NhD8sFa1CeUg6oXiVq0TzMjA5BnW";
const prod = (AUTH_SECRET?: string) => ({ NODE_ENV: "production", AUTH_SECRET });

describe("getAuthSecret in production", () => {
  it("accepts a strong secret and returns it unchanged", () => {
    expect(STRONG.length).toBeGreaterThanOrEqual(MIN_AUTH_SECRET_LENGTH);
    expect(getAuthSecret(prod(STRONG))).toBe(STRONG);
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["whitespace only", "     "],
  ])("rejects a %s secret", (_n, v) => {
    expect(() => getAuthSecret(prod(v))).toThrow(/required/);
  });

  it("rejects a secret shorter than the minimum", () => {
    expect(() => getAuthSecret(prod("a1b2c3d4e5f6g7h8"))).toThrow(/too short/);
    expect(() => getAuthSecret(prod("k3Jx9vQ2mZpL7wRtYb4NhD8sFa1CeUg"))).toThrow(/too short/); // 31 chars
  });

  it.each([
    "dev-secret-only",
    "dev-secret-only-but-made-long-enough-to-pass-length-check",
    "change-me-to-a-long-random-string-at-least-32-chars",
    "CHANGE_ME_please_replace_this_value_with_random_data",
    "pathly-pilot-secret-aug2026-xyz123",
    "your-secret-goes-here-replace-with-random-value",
    "a".repeat(40),
  ])("rejects the placeholder %#", (v) => {
    expect(() => getAuthSecret(prod(v))).toThrow(/placeholder/);
  });

  it.each([
    "ab".repeat(18), // alternating pattern, 36 chars
    "abcabcabc".repeat(4), // 3 distinct, 36 chars
    "abcdefg".repeat(5), // 7 distinct, 35 chars
  ])("rejects low-variety secret %#", (v) => {
    expect(v.length).toBeGreaterThanOrEqual(MIN_AUTH_SECRET_LENGTH);
    expect(() => getAuthSecret(prod(v))).toThrow(/too little variety/);
  });

  it("accepts a secret with exactly the minimum distinct characters", () => {
    const v = "abcdefgh".repeat(5); // 8 distinct, 40 chars
    expect(getAuthSecret(prod(v))).toBe(v);
  });

  it("does not apply the variety check outside production", () => {
    expect(getAuthSecret({ NODE_ENV: "development", AUTH_SECRET: "ab".repeat(18) })).toBe("ab".repeat(18));
  });

  it("never includes the secret value in error messages", () => {
    const candidates = [
      undefined,
      "",
      "short-secret-123",
      "change-me-to-a-long-random-string-at-least-32-chars",
      "ab".repeat(18),
    ];
    for (const c of candidates) {
      try {
        getAuthSecret(prod(c));
        throw new Error("expected throw");
      } catch (e) {
        const msg = (e as Error).message;
        expect(msg).not.toBe("expected throw");
        if (c) expect(msg).not.toContain(c);
      }
    }
  });

  it("does not trim or alter an accepted secret (keeps existing sessions valid)", () => {
    const padded = ` ${STRONG}`;
    expect(getAuthSecret(prod(padded))).toBe(padded);
  });
});

describe("getAuthSecret outside production", () => {
  it.each(["development", "test", undefined])("falls back to a dev secret when NODE_ENV=%s and unset", (nodeEnv) => {
    expect(getAuthSecret({ NODE_ENV: nodeEnv })).toBe("dev-secret-only");
    expect(getAuthSecret({ NODE_ENV: nodeEnv, AUTH_SECRET: "" })).toBe("dev-secret-only");
  });

  it("uses AUTH_SECRET when provided", () => {
    expect(getAuthSecret({ NODE_ENV: "development", AUTH_SECRET: "my-dev-secret" })).toBe("my-dev-secret");
  });
});
