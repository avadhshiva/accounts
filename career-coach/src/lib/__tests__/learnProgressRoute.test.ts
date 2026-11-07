import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAllLessons } from "@/lib/content";

const h = vi.hoisted(() => ({
  assertFeatureAccess: vi.fn(),
  upsertLearnCompleted: vi.fn(),
}));

vi.mock("@/lib/guard", () => ({
  assertFeatureAccess: (...a: unknown[]) => h.assertFeatureAccess(...a),
}));
vi.mock("@/lib/db", () => ({
  progressRepo: {
    getByUserId: vi.fn(),
    upsertLearnCompleted: (...a: unknown[]) => h.upsertLearnCompleted(...a),
  },
}));

const patch = (body: unknown) =>
  new Request("http://x", { method: "PATCH", body: JSON.stringify(body) });

const slugs = getAllLessons().map((l) => l.slug);

beforeEach(() => {
  vi.clearAllMocks();
  h.assertFeatureAccess.mockResolvedValue({ user: { id: "u1" }, error: null });
  h.upsertLearnCompleted.mockImplementation(
    async (_id: string, completed: string[], updatedAt: string) => ({
      userId: "u1",
      learnCompleted: completed,
      updatedAt,
    }),
  );
});

async function send(body: unknown) {
  const { PATCH } = await import("@/app/api/learn/progress/route");
  return PATCH(patch(body));
}

describe("PATCH /api/learn/progress array limit", () => {
  it("accepts all 17 lesson slugs", async () => {
    expect(slugs).toHaveLength(17);
    const res = await send({ completed: slugs });
    expect(res.status).toBe(200);
    expect(h.upsertLearnCompleted).toHaveBeenCalledTimes(1);
    expect(h.upsertLearnCompleted.mock.calls[0][1]).toEqual([...slugs].sort());
    expect((await res.json()).progress.completed).toHaveLength(17);
  });

  it("accepts exactly 50 items (boundary)", async () => {
    const res = await send({ completed: Array.from({ length: 50 }, (_, i) => slugs[i % 17]) });
    expect(res.status).toBe(200);
    expect(h.upsertLearnCompleted.mock.calls[0][1]).toHaveLength(17);
  });

  it("rejects 51 items without saving", async () => {
    const res = await send({ completed: Array.from({ length: 51 }, (_, i) => slugs[i % 17]) });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Could not save learn progress" });
    expect(h.upsertLearnCompleted).not.toHaveBeenCalled();
  });

  it("rejects a very large array without saving", async () => {
    const res = await send({ completed: Array(5000).fill(slugs[0]) });
    expect(res.status).toBe(400);
    expect(h.upsertLearnCompleted).not.toHaveBeenCalled();
  });

  it("returns the gate error and does not save when access is blocked", async () => {
    const blocked = new Response("{}", { status: 401 });
    h.assertFeatureAccess.mockResolvedValue({ user: null, error: blocked });
    const res = await send({ completed: slugs });
    expect(res.status).toBe(401);
    expect(h.upsertLearnCompleted).not.toHaveBeenCalled();
  });
});
