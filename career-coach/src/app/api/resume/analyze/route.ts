import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { analyzeResume } from "@/lib/ai";
import { canUse } from "@/lib/limits";
import { assertFeatureAccess } from "@/lib/guard";
import { updateDb } from "@/lib/store";

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
    if (!canUse(user.plan, user.usage, "resumeAnalyses")) {
      return NextResponse.json(
        {
          error: "Free monthly resume limit reached. Unlock/Pro increases limits.",
          code: "LIMIT",
        },
        { status: 402 },
      );
    }

    const result = await analyzeResume(body);
    const saved = await updateDb((db) => {
      const u = db.users.find((x) => x.id === user.id);
      if (u) u.usage.resumeAnalyses += 1;
      const row = {
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
      };
      db.resumes.unshift(row);
      return row;
    });

    return NextResponse.json({ analysis: saved, provider: result.provider });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Paste a longer resume (80+ chars)" }, { status: 400 });
    }
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
