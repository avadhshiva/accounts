import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => {
  class AiUnavailableError extends Error {}
  return {
    AiUnavailableError,
    analyzeResume: vi.fn(),
    interviewReply: vi.fn(),
    incrementUsage: vi.fn(),
    resumeCreate: vi.fn(),
    interviewUpdate: vi.fn(),
    interviewCreate: vi.fn(),
    interviewList: vi.fn(),
    findByIdForUser: vi.fn(),
  };
});

vi.mock("@/lib/ai", () => ({
  AiUnavailableError: h.AiUnavailableError,
  AI_UNAVAILABLE_BODY: { error: "unavailable", code: "AI_UNAVAILABLE", retryable: true },
  analyzeResume: (...a: unknown[]) => h.analyzeResume(...a),
  interviewReply: (...a: unknown[]) => h.interviewReply(...a),
}));
vi.mock("@/lib/guard", () => ({
  assertFeatureAccess: async () => ({ user: { id: "u1" } }),
}));
vi.mock("@/lib/limits", () => ({ canUse: () => true }));
vi.mock("@/lib/assessmentQuota", () => ({
  canStartAssessmentForMode: () => true,
  getAssessmentAttemptsLimitPerMode: () => 2,
  formatCategoryQuotaErrorMessage: () => "limit",
}));
vi.mock("@/lib/db", () => ({
  userRepo: { incrementUsage: (...a: unknown[]) => h.incrementUsage(...a) },
  resumeRepo: { create: (...a: unknown[]) => h.resumeCreate(...a) },
  interviewRepo: {
    findByIdForUser: (...a: unknown[]) => h.findByIdForUser(...a),
    update: (...a: unknown[]) => h.interviewUpdate(...a),
    create: (...a: unknown[]) => h.interviewCreate(...a),
    listByUserId: (...a: unknown[]) => h.interviewList(...a),
  },
}));

const req = (body: unknown) =>
  new Request("http://x", { method: "POST", body: JSON.stringify(body) });

const newSession = () => ({
  id: "s1",
  userId: "u1",
  status: "active",
  mode: "hr",
  messages: [{ role: "coach", content: "q1", at: "t" }],
  questionSet: [],
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/resume/analyze", () => {
  it("returns 503 and does not consume quota or save when AI is unavailable", async () => {
    h.analyzeResume.mockRejectedValue(new h.AiUnavailableError());
    const { POST } = await import("@/app/api/resume/analyze/route");
    const res = await POST(req({ resumeText: "x".repeat(100), role: "SDE" }));
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ code: "AI_UNAVAILABLE", retryable: true });
    expect(h.incrementUsage).not.toHaveBeenCalled();
    expect(h.resumeCreate).not.toHaveBeenCalled();
  });

  it("increments quota and saves on success", async () => {
    h.analyzeResume.mockResolvedValue({
      score: 80, summary: "s", strengths: [], gaps: [], rewrites: [], keywordsToAdd: [], provider: "gemini",
    });
    h.resumeCreate.mockImplementation(async (r: unknown) => r);
    const { POST } = await import("@/app/api/resume/analyze/route");
    const res = await POST(req({ resumeText: "x".repeat(100), role: "SDE" }));
    expect(res.status).toBe(200);
    expect(h.incrementUsage).toHaveBeenCalledTimes(1);
    expect(h.resumeCreate).toHaveBeenCalledTimes(1);
  });
});

describe("POST /api/interview/start", () => {
  it("returns 503 and does not create a session when AI is unavailable", async () => {
    h.interviewList.mockResolvedValue([]);
    h.interviewReply.mockRejectedValue(new h.AiUnavailableError());
    const { POST } = await import("@/app/api/interview/start/route");
    const res = await POST(req({ mode: "hr" }));
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ code: "AI_UNAVAILABLE", retryable: true });
    expect(h.interviewCreate).not.toHaveBeenCalled();
  });

  it("creates a session on success", async () => {
    h.interviewList.mockResolvedValue([]);
    h.interviewReply.mockResolvedValue({ message: "First question", provider: "mock" });
    h.interviewCreate.mockImplementation(async (s: unknown) => s);
    const { POST } = await import("@/app/api/interview/start/route");
    const res = await POST(req({ mode: "hr" }));
    expect(res.status).toBe(200);
    expect(h.interviewCreate).toHaveBeenCalledTimes(1);
  });
});

describe("POST /api/interview/reply", () => {
  it("returns 503 on finalize failure and leaves the session retryable", async () => {
    const session = newSession();
    h.findByIdForUser.mockResolvedValue(session);
    h.interviewReply.mockRejectedValue(new h.AiUnavailableError());
    const { POST } = await import("@/app/api/interview/reply/route");
    const res = await POST(req({ sessionId: "s1", message: "bye", finish: true }));
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ code: "AI_UNAVAILABLE" });
    expect(h.interviewUpdate).not.toHaveBeenCalled();
    expect(session.status).toBe("active");
  });

  it("persists a completed session with the real scorecard on success", async () => {
    const session = newSession();
    h.findByIdForUser.mockResolvedValue(session);
    h.interviewReply.mockResolvedValue({
      overall: 83, communication: 80, clarity: 85, depth: 79,
      feedback: "Strong answers", improvements: ["a", "b", "c"], provider: "openai",
    });
    const { POST } = await import("@/app/api/interview/reply/route");
    const res = await POST(req({ sessionId: "s1", message: "bye", finish: true }));
    expect(res.status).toBe(200);
    expect(h.interviewUpdate).toHaveBeenCalledTimes(1);
    const saved = h.interviewUpdate.mock.calls[0][0];
    expect(saved.status).toBe("completed");
    expect(saved.scorecard).toMatchObject({
      overall: 83, communication: 80, clarity: 85, depth: 79,
      feedback: "Strong answers", improvements: ["a", "b", "c"],
    });
  });

  it("appends the AI coach reply and keeps the session active on a mid-interview turn", async () => {
    const session = newSession();
    h.findByIdForUser.mockResolvedValue(session);
    h.interviewReply.mockResolvedValue({ message: "Tell me more about that project.", provider: "live" });
    const { POST } = await import("@/app/api/interview/reply/route");
    const res = await POST(req({ sessionId: "s1", message: "my answer" }));
    expect(res.status).toBe(200);
    expect(h.interviewUpdate).toHaveBeenCalledTimes(1);
    const saved = h.interviewUpdate.mock.calls[0][0];
    expect(saved.status).toBe("active");
    expect(saved.messages.at(-1)).toMatchObject({ role: "coach", content: "Tell me more about that project." });
  });
});
