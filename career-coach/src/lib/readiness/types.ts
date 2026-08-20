export type ReadinessCategoryId =
  | "resume"
  | "hr"
  | "technical"
  | "genai"
  | "aptitude"
  | "learn";

export type CategoryStatus = "complete" | "insufficient_data";

export type ReadinessCategory = {
  id: ReadinessCategoryId;
  label: string;
  status: CategoryStatus;
  score?: number;
  source?: string;
  assessedAt?: string;
};

export type ReadinessAction = {
  label: string;
  href: string;
  categoryId: ReadinessCategoryId;
};

export type ReadinessSnapshot = {
  computedAt: string;
  overall?: number;
  overallStatus: "complete" | "insufficient_data";
  completedCategoryCount: number;
  categories: ReadinessCategory[];
  strengths: string[];
  gaps: string[];
  nextActions: ReadinessAction[];
};

export type ReadinessComputeInput = {
  resumes: Array<{
    createdAt: string;
    score: number;
    strengths: string[];
    gaps: string[];
  }>;
  interviews: Array<{
    createdAt: string;
    mode: "hr" | "genai" | "technical" | "aptitude";
    status: "active" | "completed";
    scorecard?: {
      overall: number;
      feedback: string;
      improvements: string[];
    };
  }>;
  /** Valid lesson slugs from persisted user_progress.learn_completed */
  learnCompleted?: string[];
  learnProgressUpdatedAt?: string;
};
