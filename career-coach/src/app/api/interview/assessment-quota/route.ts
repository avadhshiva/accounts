import { NextResponse } from "next/server";
import {
  canStartAssessmentForMode,
  countAssessmentAttemptsForMode,
  getAssessmentAttemptsLimitPerMode,
} from "@/lib/assessmentQuota";
import { parseInterviewModeParam } from "@/lib/interview/mode";
import { interviewRepo } from "@/lib/db";
import { assertFeatureAccess } from "@/lib/guard";

export async function GET(req: Request) {
  const gate = await assertFeatureAccess();
  if (gate.error) return gate.error;
  const user = gate.user!;

  const mode = parseInterviewModeParam(new URL(req.url).searchParams.get("mode"));
  const interviews = await interviewRepo.listByUserId(user.id, 100);
  const used = countAssessmentAttemptsForMode(interviews, mode);
  const limit = getAssessmentAttemptsLimitPerMode(user);

  return NextResponse.json({
    mode,
    used,
    limit,
    canStart: canStartAssessmentForMode(user, mode, interviews),
  });
}
