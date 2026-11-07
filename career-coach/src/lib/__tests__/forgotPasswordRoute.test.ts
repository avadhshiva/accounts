import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  findByEmail: vi.fn(),
  createToken: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  userRepo: { findByEmail: (...a: unknown[]) => h.findByEmail(...a) },
  passwordResetRepo: { createToken: (...a: unknown[]) => h.createToken(...a) },
}));
vi.mock("@/lib/email", () => ({
  appBaseUrl: () => "http://localhost:3000",
  sendEmail: (...a: unknown[]) => h.sendEmail(...a),
}));

const post = (body: unknown) =>
  new Request("http://x", { method: "POST", body: JSON.stringify(body) });

async function send(body: unknown) {
  const { POST } = await import("@/app/api/auth/forgot-password/route");
  return POST(post(body));
}

beforeEach(() => {
  vi.clearAllMocks();
  h.findByEmail.mockResolvedValue({ id: "u1", email: "student@example.test" });
  h.createToken.mockImplementation(async (row: object) => row);
});

describe("POST /api/auth/forgot-password email outcome", () => {
  it("returns 503 with the existing message when sending fails", async () => {
    h.sendEmail.mockResolvedValue({ ok: false, error: "x" });
    const res = await send({ email: "student@example.test" });
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: "Could not send reset email. Please try again later.",
    });
  });

  it("returns the generic success response when sending works", async () => {
    h.sendEmail.mockResolvedValue({ ok: true });
    const res = await send({ email: "student@example.test" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      message: "If that email is registered, a reset link has been sent.",
    });
    expect(h.sendEmail).toHaveBeenCalledTimes(1);
  });

  it("does not send mail for an unknown address but still answers generically", async () => {
    h.findByEmail.mockResolvedValue(null);
    const res = await send({ email: "nobody@example.test" });
    expect(res.status).toBe(200);
    expect(h.sendEmail).not.toHaveBeenCalled();
  });
});
