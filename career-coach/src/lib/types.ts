export type Plan = "free" | "pro";

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  plan: Plan;
  college?: string;
  targetRole?: string;
  createdAt: string;
  usage: {
    resumeAnalyses: number;
    mockInterviews: number;
    monthKey: string;
  };
};

export type ResumeAnalysis = {
  id: string;
  userId: string;
  createdAt: string;
  role: string;
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  rewrites: { original: string; improved: string }[];
  keywordsToAdd: string[];
};

export type InterviewMessage = {
  role: "coach" | "user";
  content: string;
  at: string;
};

export type InterviewSession = {
  id: string;
  userId: string;
  mode: "hr" | "genai" | "sde";
  createdAt: string;
  status: "active" | "completed";
  messages: InterviewMessage[];
  scorecard?: {
    overall: number;
    communication: number;
    clarity: number;
    depth: number;
    feedback: string;
    improvements: string[];
  };
};

export type DbShape = {
  users: User[];
  resumes: ResumeAnalysis[];
  interviews: InterviewSession[];
};
