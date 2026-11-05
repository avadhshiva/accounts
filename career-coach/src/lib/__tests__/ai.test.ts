import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AiUnavailableError,
  analyzeResume,
  interviewReply,
  mockAllowed,
} from "../ai";

const resumeJson = {
  score: 81,
  summary: "Good",
  strengths: ["a", "b", "c"],
  gaps: ["x", "y", "z"],
  rewrites: [{ original: "o", improved: "i" }],
  keywordsToAdd: ["k1"],
};
const interviewJson = {
  overall: 77,
  communication: 70,
  clarity: 75,
  depth: 65,
  feedback: "Nice",
  improvements: ["a", "b", "c"],
};

const geminiOk = (obj: unknown) =>
  new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] } }] }));
const geminiText = (text: string) =>
  new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }));
const openaiOk = (obj: unknown) =>
  new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(obj) } }] }));
const fail500 = () => new Response("err", { status: 500 });

const input = { resumeText: "x".repeat(200), role: "SDE" };
const finalize = {
  mode: "hr" as const,
  history: [{ role: "user" as const, content: "hi" }],
  finalize: true,
};

function mockFetch(handler: (url: string) => Response) {
  const fn = vi.fn(async (url: string | URL | Request) => handler(String(url)));
  vi.stubGlobal("fetch", fn);
  return fn;
}

beforeEach(() => {
  vi.stubEnv("GEMINI_API_KEY", "");
  vi.stubEnv("OPENAI_API_KEY", "");
  vi.stubEnv("ALLOW_MOCK_AI", "");
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("mockAllowed", () => {
  it("is false by default", () => {
    expect(mockAllowed()).toBe(false);
  });
  it("is true only with flag outside production", () => {
    vi.stubEnv("ALLOW_MOCK_AI", "true");
    vi.stubEnv("NODE_ENV", "development");
    expect(mockAllowed()).toBe(true);
    vi.stubEnv("NODE_ENV", "production");
    expect(mockAllowed()).toBe(false);
  });
});

describe("analyzeResume", () => {
  it("throws AiUnavailableError with no keys and no mock flag", async () => {
    await expect(analyzeResume(input)).rejects.toBeInstanceOf(AiUnavailableError);
  });

  it("returns mock only when explicitly enabled for dev", async () => {
    vi.stubEnv("ALLOW_MOCK_AI", "true");
    vi.stubEnv("NODE_ENV", "development");
    const r = await analyzeResume(input);
    expect(r.provider).toBe("mock");
  });

  it("never returns mock in production even with the flag", async () => {
    vi.stubEnv("ALLOW_MOCK_AI", "true");
    vi.stubEnv("NODE_ENV", "production");
    await expect(analyzeResume(input)).rejects.toBeInstanceOf(AiUnavailableError);
  });

  it("fails over to OpenAI when Gemini errors", async () => {
    vi.stubEnv("GEMINI_API_KEY", "g");
    vi.stubEnv("OPENAI_API_KEY", "o");
    mockFetch((u) => (u.includes("generativelanguage") ? fail500() : openaiOk(resumeJson)));
    const r = await analyzeResume(input);
    expect(r.provider).toBe("openai");
    expect(r.score).toBe(81);
  });

  it("fails over when Gemini returns unparseable output", async () => {
    vi.stubEnv("GEMINI_API_KEY", "g");
    vi.stubEnv("OPENAI_API_KEY", "o");
    mockFetch((u) => (u.includes("generativelanguage") ? geminiText("not json") : openaiOk(resumeJson)));
    expect((await analyzeResume(input)).provider).toBe("openai");
  });

  it("uses Gemini label when Gemini succeeds", async () => {
    vi.stubEnv("GEMINI_API_KEY", "g");
    mockFetch(() => geminiOk(resumeJson));
    expect((await analyzeResume(input)).provider).toBe("gemini");
  });

  it("throws when all providers fail", async () => {
    vi.stubEnv("GEMINI_API_KEY", "g");
    vi.stubEnv("OPENAI_API_KEY", "o");
    mockFetch(() => fail500());
    await expect(analyzeResume(input)).rejects.toBeInstanceOf(AiUnavailableError);
  });

  it.each([{ ...resumeJson, score: "abc" }, { ...resumeJson, score: 150 }, { ...resumeJson, score: undefined }])(
    "rejects invalid score %#, with no default score",
    async (bad) => {
      vi.stubEnv("GEMINI_API_KEY", "g");
      mockFetch(() => geminiOk(bad));
      await expect(analyzeResume(input)).rejects.toBeInstanceOf(AiUnavailableError);
    },
  );
});

describe("interviewReply finalize", () => {
  it("throws with no keys and no mock flag", async () => {
    await expect(interviewReply(finalize)).rejects.toBeInstanceOf(AiUnavailableError);
  });

  it("fails over to OpenAI", async () => {
    vi.stubEnv("GEMINI_API_KEY", "g");
    vi.stubEnv("OPENAI_API_KEY", "o");
    mockFetch((u) => (u.includes("generativelanguage") ? fail500() : openaiOk(interviewJson)));
    const r = await interviewReply(finalize);
    expect(r).toMatchObject({ overall: 77, provider: "openai" });
  });

  it("rejects an invalid scorecard instead of defaulting to 70", async () => {
    vi.stubEnv("GEMINI_API_KEY", "g");
    mockFetch(() => geminiOk({ ...interviewJson, overall: "n/a" }));
    await expect(interviewReply(finalize)).rejects.toBeInstanceOf(AiUnavailableError);
  });

  it("returns mock only for explicit dev opt-in", async () => {
    vi.stubEnv("ALLOW_MOCK_AI", "true");
    vi.stubEnv("NODE_ENV", "development");
    expect(await interviewReply(finalize)).toMatchObject({ provider: "mock" });
  });
});

describe("interviewReply session start / mid-turn", () => {
  it("refuses to start a session when AI is not configured", async () => {
    await expect(interviewReply({ mode: "hr", history: [] })).rejects.toBeInstanceOf(AiUnavailableError);
  });

  it("allows start when a provider is configured", async () => {
    vi.stubEnv("GEMINI_API_KEY", "g");
    const r = await interviewReply({ mode: "hr", history: [] });
    expect(r).toHaveProperty("message");
  });

  it("falls back to a canned question on transient mid-turn failure", async () => {
    vi.stubEnv("GEMINI_API_KEY", "g");
    mockFetch(() => fail500());
    const r = await interviewReply({
      mode: "hr",
      history: [{ role: "coach", content: "q1" }],
      userMessage: "answer",
    });
    expect(r).toHaveProperty("message");
  });
});

describe("provider edge cases", () => {
  it("works with OpenAI only configured and never calls Gemini", async () => {
    vi.stubEnv("OPENAI_API_KEY", "o");
    const fn = mockFetch(() => openaiOk(resumeJson));
    const r = await analyzeResume(input);
    expect(r.provider).toBe("openai");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(String(fn.mock.calls[0][0])).toContain("api.openai.com");
  });

  it("fails over to OpenAI when Gemini times out", async () => {
    vi.stubEnv("GEMINI_API_KEY", "g");
    vi.stubEnv("OPENAI_API_KEY", "o");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL | Request) => {
        if (String(url).includes("generativelanguage")) {
          throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
        }
        return openaiOk(resumeJson);
      }),
    );
    expect((await analyzeResume(input)).provider).toBe("openai");
  });

  it("throws when every provider times out", async () => {
    vi.stubEnv("GEMINI_API_KEY", "g");
    vi.stubEnv("OPENAI_API_KEY", "o");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new DOMException("timeout", "TimeoutError");
      }),
    );
    await expect(analyzeResume(input)).rejects.toBeInstanceOf(AiUnavailableError);
  });

  it("passes a timeout signal to provider requests", async () => {
    vi.stubEnv("GEMINI_API_KEY", "g");
    const fn = mockFetch(() => geminiOk(resumeJson));
    await analyzeResume(input);
    const init = fn.mock.calls[0][1] as RequestInit | undefined;
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it.each(["", "   \n  "])("treats empty/whitespace Gemini text %j as failure and fails over", async (txt) => {
    vi.stubEnv("GEMINI_API_KEY", "g");
    vi.stubEnv("OPENAI_API_KEY", "o");
    mockFetch((u) => (u.includes("generativelanguage") ? geminiText(txt) : openaiOk(resumeJson)));
    expect((await analyzeResume(input)).provider).toBe("openai");
  });

  it("throws when the only provider returns empty text", async () => {
    vi.stubEnv("GEMINI_API_KEY", "g");
    mockFetch(() => geminiText("  "));
    await expect(analyzeResume(input)).rejects.toBeInstanceOf(AiUnavailableError);
  });

  it("returns a live AI coach reply on a mid-interview turn", async () => {
    vi.stubEnv("GEMINI_API_KEY", "g");
    mockFetch(() => geminiText("  Tell me about your hardest bug.  "));
    const r = await interviewReply({
      mode: "technical",
      history: [{ role: "coach", content: "q1" }],
      userMessage: "my answer",
    });
    expect(r).toEqual({ message: "Tell me about your hardest bug.", provider: "live" });
  });

  it("returns a live reply via OpenAI when Gemini fails mid-interview", async () => {
    vi.stubEnv("GEMINI_API_KEY", "g");
    vi.stubEnv("OPENAI_API_KEY", "o");
    mockFetch((u) =>
      u.includes("generativelanguage")
        ? fail500()
        : new Response(JSON.stringify({ choices: [{ message: { content: "Follow-up question?" } }] })),
    );
    const r = await interviewReply({
      mode: "hr",
      history: [{ role: "coach", content: "q1" }],
      userMessage: "my answer",
    });
    expect(r).toEqual({ message: "Follow-up question?", provider: "live" });
  });
});
