import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  unlockAccess: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getSessionUser: (...a: unknown[]) => h.getSessionUser(...a),
  publicUser: (u: unknown) => u,
}));
vi.mock("@/lib/db", () => ({
  userRepo: { unlockAccess: (...a: unknown[]) => h.unlockAccess(...a) },
}));

const req = (body: unknown, raw?: string) =>
  new Request("http://x", { method: "POST", body: raw ?? JSON.stringify(body) });

const invite = (inviteCode?: string) => ({ method: "invite", inviteCode });

const CODE = "TEST-INVITE-CODE";
const prevCodes = process.env.INVITE_CODES;

async function post(r: Request) {
  const { POST } = await import("@/app/api/access/unlock/route");
  return POST(r);
}

beforeEach(() => {
  vi.clearAllMocks();
  h.getSessionUser.mockResolvedValue({ id: "u1" });
  h.unlockAccess.mockImplementation(async (_id: string, patch: object) => ({
    id: "u1",
    trialStartedAt: "",
    sessionVersion: 1,
    ...patch,
  }));
  process.env.INVITE_CODES = CODE;
});

afterEach(() => {
  if (prevCodes === undefined) delete process.env.INVITE_CODES;
  else process.env.INVITE_CODES = prevCodes;
});

describe("POST /api/access/unlock (invite)", () => {
  it("returns 401 when unauthenticated", async () => {
    h.getSessionUser.mockResolvedValue(null);
    const res = await post(req(invite(CODE)));
    expect(res.status).toBe(401);
    expect(h.unlockAccess).not.toHaveBeenCalled();
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["whitespace-only", "   "],
    ["comma-only", " , "],
  ])("rejects old demo codes when INVITE_CODES is %s", async (_l, value) => {
    if (value === undefined) delete process.env.INVITE_CODES;
    else process.env.INVITE_CODES = value;
    for (const code of ["PATHLY-DEMO", "PATHLY-STUDENT", "pathly-demo", ""]) {
      const res = await post(req(invite(code)));
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "Invalid invite code" });
    }
    expect(h.unlockAccess).not.toHaveBeenCalled();
  });

  it("rejects old demo codes even when other codes are configured", async () => {
    for (const code of ["PATHLY-DEMO", "PATHLY-STUDENT"]) {
      const res = await post(req(invite(code)));
      expect(res.status).toBe(400);
    }
    expect(h.unlockAccess).not.toHaveBeenCalled();
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["whitespace-only", "   "],
    ["wrong", "WRONG-CODE"],
    ["shorter prefix", "TEST"],
    ["longer", `${CODE}-EXTRA-EXTRA-EXTRA`],
  ])("rejects %s submitted code with generic error", async (_l, code) => {
    const res = await post(req(invite(code)));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid invite code" });
    expect(h.unlockAccess).not.toHaveBeenCalled();
  });

  it("accepts a valid code case-insensitively with surrounding whitespace", async () => {
    const res = await post(req(invite(`  ${CODE.toLowerCase()}  `)));
    expect(res.status).toBe(200);
    expect(h.unlockAccess).toHaveBeenCalledTimes(1);
    expect(h.unlockAccess).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({ access: "invite", plan: "pro", inviteCode: CODE }),
    );
    const body = await res.json();
    expect(body.message).toBe("Invite unlocked. Full access enabled.");
    expect(body.access).toMatchObject({ allowed: true, access: "invite" });
  });

  it("returns 404 when the user no longer exists", async () => {
    h.unlockAccess.mockResolvedValue(null);
    const res = await post(req(invite(CODE)));
    expect(res.status).toBe(404);
  });

  it.each([
    ["malformed JSON", req(null, "{not json")],
    ["invalid method", req({ method: "other" })],
    ["missing method", req({})],
  ])("returns 400 'Unlock failed' for %s", async (_l, r) => {
    const res = await post(r);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Unlock failed" });
    expect(h.unlockAccess).not.toHaveBeenCalled();
  });
});
