import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { analyzeResume } from "@/lib/ai";
import { resumeRepo, userRepo } from "@/lib/db";
import { canUse } from "@/lib/limits";
import { assertFeatureAccess } from "@/lib/guard";

const schema = z.object({
  resumeText: z.string().min(80).max(20000),
  role: z.string().min(2).max(80),
});

export async function POST(req: Request) {
  const gate = await assertFeatureAccess();
  if (gate.error) return gate.error;
  const user = gate.user!;

  try {
    const body = schema.parse(await req.json());
    if (!canUse(user, "resumeAnalyses")) {
      return NextResponse.json(
        {
          error: "Trial resume limit reached (3 scores). Share feedback or contact us to extend.",
          code: "LIMIT",
        },
        { status: 402 },
      );
    }

    const result = await analyzeResume(body);
    await userRepo.incrementUsage(user.id, "resumeAnalyses");

    const saved = await resumeRepo.create({
      id: randomUUID(),
      userId: user.id,
      createdAt: new Date().toISOString(),
      role: body.role,
      score: result.score,
      summary: result.summary,
      strengths: result.strengths,
      gaps: result.gaps,
      rewrites: result.rewrites,
      keywordsToAdd: result.keywordsToAdd,
    });

    return NextResponse.json({ analysis: saved, provider: result.provider });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Paste a longer resume (80+ chars)" }, { status: 400 });
    }
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
