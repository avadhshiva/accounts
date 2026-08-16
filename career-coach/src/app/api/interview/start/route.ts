import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { interviewReply } from "@/lib/ai";
import { interviewRepo, userRepo } from "@/lib/db";
import { pickQuestionSet } from "@/lib/interviewQuestions";
import { canUse } from "@/lib/limits";
import { assertFeatureAccess } from "@/lib/guard";

const schema = z.object({
  mode: z.enum(["hr", "genai", "technical", "aptitude"]),
});

export async function POST(req: Request) {
  const gate = await assertFeatureAccess();
  if (gate.error) return gate.error;
  const user = gate.user!;

  try {
    const body = schema.parse(await req.json());
    if (!canUse(user, "mockInterviews")) {
      return NextResponse.json(
        { error: "Trial mock interview limit reached (2 sessions). Share feedback or contact us to extend.", code: "LIMIT" },
        { status: 402 },
      );
    }

    const questionSet = pickQuestionSet(body.mode);
    const first = await interviewReply({ mode: body.mode, history: [], questionSet });
    await userRepo.incrementUsage(user.id, "mockInterviews");

    const session = await interviewRepo.create({
      id: randomUUID(),
      userId: user.id,
      mode: body.mode,
      createdAt: new Date().toISOString(),
      status: "active",
      questionSet,
      messages: [
        {
          role: "coach",
          content: first.message || "Tell me about yourself.",
          at: new Date().toISOString(),
        },
      ],
    });

    return NextResponse.json({ session });
  } catch {
    return NextResponse.json({ error: "Could not start interview" }, { status: 400 });
  }
}
