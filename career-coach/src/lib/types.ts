export type InterviewMode = "hr" | "genai" | "technical" | "aptitude";

export type Plan = "free" | "pro";
export type AccessStatus = "trial" | "paid" | "invite";

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  plan: Plan;
  /** trial = 30-min free window; paid/invite = full access */
  access: AccessStatus;
  trialStartedAt: string;
  paidAt?: string;
  inviteCode?: string;
  /** Rotates on each login so only one active session works */
  sessionVersion: number;
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
  mode: InterviewMode;
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
