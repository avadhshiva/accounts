import type { InterviewMode } from "./types";

type AnalyzeInput = {
  resumeText: string;
  role: string;
};

export type AnalyzeResult = {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  rewrites: { original: string; improved: string }[];
  keywordsToAdd: string[];
  provider: string;
};

function extractJson(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in model response");
  return JSON.parse(text.slice(start, end + 1));
}

function mockAnalyze({ resumeText, role }: AnalyzeInput): AnalyzeResult {
  const lines = resumeText
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const hasMetrics = /\d+%|\d+\+|increased|reduced|users|users/i.test(resumeText);
  const hasProjects = /project|github|built|developed/i.test(resumeText);
  const hasSkills = /java|python|react|sql|node|aws|genai|ml/i.test(resumeText);
  let score = 55;
  if (hasMetrics) score += 12;
  if (hasProjects) score += 10;
  if (hasSkills) score += 8;
  if (resumeText.length > 800) score += 5;
  score = Math.min(92, score);

  const sample = lines.find((l) => l.length > 40) || "Built a web application for campus use.";

  return {
    score,
    summary: `Solid fresher base for ${role}. Focus on measurable impact, clearer project ownership, and keywords recruiters scan for in the first 6 seconds.`,
    strengths: [
      hasProjects ? "Projects are present — good for fresher profiles." : "Readable structure to build on.",
      hasSkills ? "Technical skills are mentioned." : "Content length is workable for a first draft.",
      "Tone is generally professional.",
    ],
    gaps: [
      hasMetrics ? "Add 1–2 more quantified outcomes." : "Almost no metrics (%, time saved, users, accuracy).",
      "Make bullets start with stronger action verbs.",
      `Align keywords explicitly to ${role} JD terms.`,
    ],
    rewrites: [
      {
        original: sample.slice(0, 160),
        improved: `Built a ${role.includes("Data") ? "data" : "full-stack"} project used by 50+ peers; reduced manual effort by ~30% through automation and clear UX.`,
      },
      {
        original: "Worked on college project using Java.",
        improved:
          "Designed and shipped a Java + SQL campus portal (auth, CRUD, reports) with role-based access; documented API and demoed to faculty.",
      },
    ],
    keywordsToAdd: [
      "problem solving",
      "REST APIs",
      "Git",
      "unit testing",
      role.toLowerCase().includes("gen") ? "prompt engineering" : "data structures",
      "collaboration",
    ],
    provider: "mock",
  };
}

/** Thrown when no AI provider could produce a valid result. Routes map this to HTTP 503. */
export class AiUnavailableError extends Error {
  constructor(message = "AI scoring is temporarily unavailable") {
    super(message);
    this.name = "AiUnavailableError";
  }
}

/** Response body contract for HTTP 503 when AI is unavailable. */
export const AI_UNAVAILABLE_BODY = {
  error: "Scoring is temporarily unavailable. Your attempt was not used. Please try again in a few minutes.",
  code: "AI_UNAVAILABLE",
  retryable: true,
} as const;

/** Mock output is allowed only for explicit local development, never in production. */
export function mockAllowed() {
  return process.env.ALLOW_MOCK_AI === "true" && process.env.NODE_ENV !== "production";
}

type ProviderName = "gemini" | "openai";

const PROVIDER_TIMEOUT_MS = 20_000;

function configuredProviders(): ProviderName[] {
  const list: ProviderName[] = [];
  if (process.env.GEMINI_API_KEY) list.push("gemini");
  if (process.env.OPENAI_API_KEY) list.push("openai");
  return list;
}

export function isAiConfigured() {
  return configuredProviders().length > 0;
}

/** Throws AiUnavailableError if a new scored session could not be completed. */
export function assertAiAvailableForSession() {
  if (!isAiConfigured() && !mockAllowed()) throw new AiUnavailableError();
}

async function callGemini(prompt: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Gemini key missing");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4 },
    }),
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Gemini error ${res.status}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
}

async function callOpenAI(prompt: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OpenAI key missing");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: "You are an expert India campus-to-corporate career coach. Reply with JSON only." },
        { role: "user", content: prompt },
      ],
    }),
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content as string | undefined;
}

/**
 * Try each configured provider in order (Gemini, then OpenAI). `handle` parses and
 * validates the raw text; if it throws, that counts as a provider failure and the
 * next provider is tried. Throws AiUnavailableError if none succeed.
 */
async function callAi<T>(
  prompt: string,
  handle: (text: string) => T,
): Promise<{ value: T; provider: ProviderName }> {
  const providers = configuredProviders();
  if (providers.length === 0) throw new AiUnavailableError();
  for (const provider of providers) {
    try {
      const text = provider === "gemini" ? await callGemini(prompt) : await callOpenAI(prompt);
      if (!text || !text.trim()) throw new Error("Empty response");
      return { value: handle(text), provider };
    } catch (err) {
      // Log only the failure reason, never prompt or resume content.
      console.error(`[ai] ${provider} failed:`, err instanceof Error ? err.message : "unknown");
    }
  }
  throw new AiUnavailableError();
}

function scoreInRange(v: unknown): number {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  if (!Number.isFinite(n) || n < 0 || n > 100) throw new Error("Score out of range");
  return n;
}

function stringArray(v: unknown): string[] {
  if (!Array.isArray(v)) throw new Error("Expected array");
  return v.map((x) => String(x));
}

function parseResumeResult(text: string): Omit<AnalyzeResult, "provider"> {
  const parsed = extractJson(text);
  if (typeof parsed.summary !== "string") throw new Error("Invalid summary");
  if (!Array.isArray(parsed.rewrites)) throw new Error("Invalid rewrites");
  return {
    score: scoreInRange(parsed.score),
    summary: parsed.summary,
    strengths: stringArray(parsed.strengths),
    gaps: stringArray(parsed.gaps),
    rewrites: parsed.rewrites,
    keywordsToAdd: stringArray(parsed.keywordsToAdd),
  };
}

export async function analyzeResume(input: AnalyzeInput): Promise<AnalyzeResult> {
  const prompt = `Analyze this fresher/early-career resume for the target role "${input.role}" in India.
Return JSON with keys: score (0-100 number), summary (string), strengths (string[3]), gaps (string[3]), rewrites ({original, improved}[2]), keywordsToAdd (string[5]).
Resume:
"""
${input.resumeText.slice(0, 12000)}
"""`;

  try {
    const { value, provider } = await callAi(prompt, parseResumeResult);
    return { ...value, provider };
  } catch (err) {
    if (mockAllowed()) return mockAnalyze(input);
    throw err instanceof AiUnavailableError ? err : new AiUnavailableError();
  }
}


const MODE_LABEL: Record<InterviewMode, string> = {
  hr: "HR behavioural",
  genai: "Generative AI concepts",
  technical: "Technical / coding (DSA, OOP, DBMS, projects)",
  aptitude: "Aptitude and logical reasoning (quant, puzzles, verbal)",
};

const STARTERS: Record<InterviewMode, string[]> = {
  hr: [
    "Tell me about yourself in 60 seconds, focused on your engineering background and what role you want.",
    "Describe a conflict in a team project and how you handled it.",
    "Why should we hire you as a fresher?",
    "What is a weakness you are actively improving, with one example?",
  ],
  genai: [
    "In simple terms, what is an LLM and where can it fail in production?",
    "What is hallucination in GenAI, and how would you reduce it in an app?",
    "Explain prompt engineering with one example from a campus project.",
    "What is RAG, and when would you use it instead of a plain chatbot?",
  ],
  technical: [
    "Explain a project on your resume: problem, your role, tech stack, hardest bug, and outcome.",
    "How does a hash map work, and when would you prefer it over an array? Give time complexity.",
    "Write the approach (not full code) for Two Sum. Start with brute force, then optimize.",
    "Explain PRIMARY KEY vs FOREIGN KEY, and when you would add an index.",
    "Process vs thread — what’s the difference, and when would you use multithreading?",
  ],
  aptitude: [
    "A price rises 25% and then falls 20%. Is the final price higher or lower than original, and by how much percent? Show steps.",
    "A finishes a job in 12 days, B in 18 days. How many days if they work together? Explain the rate method.",
    "Find the next number: 3, 6, 11, 18, 27, ? Explain the pattern.",
    "A train covers 90 km in 1.5 hours. What is the speed in m/s? Show the conversion.",
    "In a ratio of 5:3, if the larger part is 40, what is the smaller part?",
  ],
};

function mockScoreFor(mode: InterviewMode) {
  const base = {
    overall: 72,
    communication: 74,
    clarity: 70,
    depth: 68,
    feedback: "",
    improvements: [] as string[],
    provider: "mock",
  };
  const byMode: Record<InterviewMode, typeof base> = {
    hr: {
      ...base,
      feedback:
        "Structured and polite. Deepen answers with STAR and one concrete metric per story.",
      improvements: [
        "Quantify impact in every project answer.",
        "Admit unknowns, then outline how you’d find out.",
        "Keep answers to 60–90 seconds.",
      ],
    },
    genai: {
      ...base,
      feedback:
        "You covered definitions. Add a real example + risk + mitigation for each GenAI concept.",
      improvements: [
        "Use definition → example → risk → mitigation.",
        "Mention verification/tests when discussing AI output.",
        "Avoid buzzwords without a fresher-level explanation.",
      ],
    },
    technical: {
      ...base,
      overall: 70,
      depth: 66,
      feedback:
        "Approach was reasonable. State complexity, discuss edge cases, and connect answers to your project.",
      improvements: [
        "Always give time/space complexity.",
        "Start with brute force, then optimize.",
        "Map OOP/DB concepts to your own project.",
      ],
    },
    aptitude: {
      ...base,
      overall: 74,
      clarity: 72,
      feedback:
        "Show your method, not only the final number. Explain ratios/rates step-by-step under time pressure.",
      improvements: [
        "Write the formula before substituting numbers.",
        "Check units (km/h vs m/s).",
        "Skip time sinks on the first pass in real tests.",
      ],
    },
  };
  return byMode[mode];
}

export type InterviewReplyResult = {
  message?: string;
  overall?: number;
  communication?: number;
  clarity?: number;
  depth?: number;
  feedback?: string;
  improvements?: string[];
  provider: string;
};

export async function interviewReply(params: {
  mode: InterviewMode;
  history: { role: "coach" | "user"; content: string }[];
  userMessage?: string;
  finalize?: boolean;
  questionSet?: string[];
}): Promise<InterviewReplyResult> {
  const modeLabel = MODE_LABEL[params.mode];
  const starters =
    params.questionSet && params.questionSet.length > 0
      ? params.questionSet
      : STARTERS[params.mode];

  if (params.finalize) {
    const prompt = `You are finishing a ${modeLabel} mock interview for an Indian engineering fresher.
Conversation:
${params.history.map((m) => `${m.role}: ${m.content}`).join("\n")}
Return JSON: overall, communication, clarity, depth (0-100), feedback (string), improvements (string[3]).`;

    try {
      const { value, provider } = await callAi(prompt, (text) => {
        const parsed = extractJson(text);
        if (typeof parsed.feedback !== "string" || !parsed.feedback.trim()) {
          throw new Error("Invalid feedback");
        }
        return {
          overall: scoreInRange(parsed.overall),
          communication: scoreInRange(parsed.communication),
          clarity: scoreInRange(parsed.clarity),
          depth: scoreInRange(parsed.depth),
          feedback: parsed.feedback,
          improvements: stringArray(parsed.improvements),
        };
      });
      return { ...value, provider };
    } catch (err) {
      if (mockAllowed()) return mockScoreFor(params.mode);
      throw err instanceof AiUnavailableError ? err : new AiUnavailableError();
    }
  }

  if (!params.userMessage) {
    // First question comes from the question set, but a session that can never be
    // scored must not be created (it would burn an attempt).
    assertAiAvailableForSession();
    return { message: starters[0], provider: "mock" };
  }

  const turn = params.history.filter((h) => h.role === "coach").length;
  if (!isAiConfigured()) {
    const next = starters[Math.min(turn, starters.length - 1)];
    return {
      message:
        turn >= 3
          ? "Good effort. One last one: What questions do you have for me as the interviewer?"
          : `Thanks. ${next}`,
      provider: "mock",
    };
  }

  const prompt = `Continue a ${modeLabel} mock interview for an Indian engineering fresher.
Ask ONE next question or a short follow-up (max 3 sentences). Be encouraging but realistic.
History:
${params.history.map((m) => `${m.role}: ${m.content}`).join("\n")}
user: ${params.userMessage}
Reply with plain text only (the coach message).`;

  try {
    const { value } = await callAi(prompt, (text) => text.trim());
    return { message: value, provider: "live" };
  } catch {
    // Mid-interview coach turns are not scores; a canned question is acceptable on a transient failure.
    return { message: starters[Math.min(turn, starters.length - 1)], provider: "mock" };
  }
}
