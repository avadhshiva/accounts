import type { InterviewSession, ResumeAnalysis } from "../types";
import { interviewRepo, resumeRepo } from "../db";
import { computeReadiness } from "./compute";
import type { ReadinessSnapshot } from "./types";

function toResumeInput(resumes: ResumeAnalysis[]) {
  return resumes.map((r) => ({
    createdAt: r.createdAt,
    score: r.score,
    strengths: r.strengths,
    gaps: r.gaps,
  }));
}

function toInterviewInput(interviews: InterviewSession[]) {
  return interviews.map((i) => ({
    createdAt: i.createdAt,
    mode: i.mode,
    status: i.status,
    scorecard: i.scorecard
      ? {
          overall: i.scorecard.overall,
          feedback: i.scorecard.feedback,
          improvements: i.scorecard.improvements,
        }
      : undefined,
  }));
}

export async function getReadinessForUser(userId: string): Promise<ReadinessSnapshot> {
  const resumes = await resumeRepo.listByUserId(userId, 50);
  const interviews = await interviewRepo.listByUserId(userId, 50);
  return computeReadiness({
    resumes: toResumeInput(resumes),
    interviews: toInterviewInput(interviews),
  });
}

export { computeReadiness } from "./compute";
export type {
  ReadinessAction,
  ReadinessCategory,
  ReadinessCategoryId,
  ReadinessComputeInput,
  ReadinessSnapshot,
} from "./types";
