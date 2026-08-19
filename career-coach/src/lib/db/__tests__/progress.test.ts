import { randomUUID } from "crypto";
import { describe, expect, it } from "vitest";
import { progressRepoJson } from "@/lib/db/json/progress";

describe("progressRepoJson", () => {
  const userA = randomUUID();
  const userB = randomUUID();

  it("returns empty progress for unknown user", async () => {
    const row = await progressRepoJson.getByUserId(userA);
    expect(row.learnCompleted).toEqual([]);
    expect(row.userId).toBe(userA);
  });

  it("upserts and reads learn completed slugs", async () => {
    await progressRepoJson.upsertLearnCompleted(userA, ["what-is-genai"], "2026-01-01T00:00:00.000Z");
    const row = await progressRepoJson.getByUserId(userA);
    expect(row.learnCompleted).toEqual(["what-is-genai"]);
    expect(row.updatedAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("isolates progress between users", async () => {
    await progressRepoJson.upsertLearnCompleted(userB, ["dsa-mindset"]);
    const rowA = await progressRepoJson.getByUserId(userA);
    const rowB = await progressRepoJson.getByUserId(userB);
    expect(rowA.learnCompleted).toEqual(["what-is-genai"]);
    expect(rowB.learnCompleted).toEqual(["dsa-mindset"]);
  });
});
