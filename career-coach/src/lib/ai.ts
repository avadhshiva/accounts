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

async function callGemini(prompt: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini error ${res.status}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text as string;
}

async function callOpenAI(prompt: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
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
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content as string;
}

export async function analyzeResume(input: AnalyzeInput): Promise<AnalyzeResult> {
  const prompt = `Analyze this fresher/early-career resume for the target role "${input.role}" in India.
Return JSON with keys: score (0-100 number), summary (string), strengths (string[3]), gaps (string[3]), rewrites ({original, improved}[2]), keywordsToAdd (string[5]).
Resume:
"""
${input.resumeText.slice(0, 12000)}
"""`;

  try {
    const text = (await callGemini(prompt)) || (await callOpenAI(prompt));
    if (!text) return mockAnalyze(input);
    const parsed = extractJson(text);
    return {
      score: Number(parsed.score) || 60,
      summary: String(parsed.summary || ""),
      strengths: parsed.strengths || [],
      gaps: parsed.gaps || [],
      rewrites: parsed.rewrites || [],
      keywordsToAdd: parsed.keywordsToAdd || [],
      provider: process.env.GEMINI_API_KEY ? "gemini" : "openai",
    };
  } catch {
    return mockAnalyze(input);
  }
}

export async function interviewReply(params: {
  mode: "hr" | "genai" | "sde";
  history: { role: "coach" | "user"; content: string }[];
  userMessage?: string;
  finalize?: boolean;
}) {
  const modeLabel =
    params.mode === "hr"
      ? "HR behavioural"
      : params.mode === "genai"
        ? "Generative AI concepts"
        : "SDE fundamentals (DSA-lite + projects)";

  if (params.finalize) {
    const mockScore = {
      overall: 72,
      communication: 74,
      clarity: 70,
      depth: 68,
      feedback:
        "You communicated politely and stayed structured. Deepen answers with STAR (Situation, Task, Action, Result) and one concrete metric per story.",
      improvements: [
        "Quantify impact in every project answer.",
        "Admit unknowns, then outline how you’d find out.",
        "Keep answers to 60–90 seconds.",
      ],
      provider: "mock",
    };

    const prompt = `You are finishing a ${modeLabel} mock interview for an Indian engineering fresher.
Conversation:
${params.history.map((m) => `${m.role}: ${m.content}`).join("\n")}
Return JSON: overall, communication, clarity, depth (0-100), feedback (string), improvements (string[3]).`;

    try {
      const text = (await callGemini(prompt)) || (await callOpenAI(prompt));
      if (!text) return mockScore;
      const parsed = extractJson(text);
      return {
        overall: Number(parsed.overall) || 70,
        communication: Number(parsed.communication) || 70,
        clarity: Number(parsed.clarity) || 70,
        depth: Number(parsed.depth) || 70,
        feedback: String(parsed.feedback || ""),
        improvements: parsed.improvements || mockScore.improvements,
        provider: process.env.GEMINI_API_KEY ? "gemini" : "openai",
      };
    } catch {
      return mockScore;
    }
  }

  const starters: Record<string, string[]> = {
    hr: [
      "Tell me about yourself in 60 seconds, focused on your engineering background and what role you want.",
      "Describe a conflict in a team project and how you handled it.",
      "Why should we hire you as a fresher?",
    ],
    genai: [
      "In simple terms, what is an LLM and where can it fail in production?",
      "What is hallucination in GenAI, and how would you reduce it in an app?",
      "Explain prompt engineering with one example from a campus project.",
    ],
    sde: [
      "Explain a project on your resume: problem, your role, tech stack, and outcome.",
      "How does a hash map work, and when would you use it over an array?",
      "What happens when you type a URL in a browser? Give a fresher-level overview.",
    ],
  };

  if (!params.userMessage) {
    return {
      message: starters[params.mode][0],
      provider: "mock",
    };
  }

  const turn = params.history.filter((h) => h.role === "coach").length;
  if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
    const next = starters[params.mode][Math.min(turn, starters[params.mode].length - 1)];
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
    const text = (await callGemini(prompt)) || (await callOpenAI(prompt));
    return { message: (text || "").trim() || starters[params.mode][0], provider: "live" };
  } catch {
    return { message: starters[params.mode][Math.min(turn, starters[params.mode].length - 1)], provider: "mock" };
  }
}
