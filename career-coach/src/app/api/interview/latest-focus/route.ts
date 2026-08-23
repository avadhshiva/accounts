import { NextResponse } from "next/server";
import { interviewRepo } from "@/lib/db";
import { assertFeatureAccess } from "@/lib/guard";
import { latestCompletedImprovementsForMode } from "@/lib/interview/focus";
import { isInterviewMode } from "@/lib/interview/mode";

/**
 * Change 15: read-only latest completed scorecard improvements for one mode.
 * Does not create sessions or increment mock usage.
 */
export async function GET(req: Request) {
  const gate = await assertFeatureAccess();
  if (gate.error) return gate.error;

  try {
    const modeParam = new URL(req.url).searchParams.get("mode") ?? "";
    if (!isInterviewMode(modeParam)) {
      return NextResponse.json(
        { error: "Invalid mode. Use hr, technical, genai, or aptitude." },
        { status: 400 },
      );
    }

    const interviews = await interviewRepo.listByUserId(gate.user!.id, 50);
    const { improvements, assessedAt } = latestCompletedImprovementsForMode(
      interviews,
      modeParam,
    );

    return NextResponse.json({
      mode: modeParam,
      improvements,
      ...(assessedAt ? { assessedAt } : {}),
    });
  } catch {
    return NextResponse.json({ error: "Could not load practice focus" }, { status: 500 });
  }
}
