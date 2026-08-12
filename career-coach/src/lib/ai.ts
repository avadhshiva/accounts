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

export async function interviewReply(params: {
  mode: InterviewMode;
  history: { role: "coach" | "user"; content: string }[];
  userMessage?: string;
  finalize?: boolean;
}) {
  const modeLabel = MODE_LABEL[params.mode];
  const starters = STARTERS[params.mode];

  if (params.finalize) {
    const mockScore = mockScoreFor(params.mode);
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

  if (!params.userMessage) {
    return { message: starters[0], provider: "mock" };
  }

  const turn = params.history.filter((h) => h.role === "coach").length;
  if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
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
    const text = (await callGemini(prompt)) || (await callOpenAI(prompt));
    return { message: (text || "").trim() || starters[0], provider: "live" };
  } catch {
    return { message: starters[Math.min(turn, starters.length - 1)], provider: "mock" };
  }
}
