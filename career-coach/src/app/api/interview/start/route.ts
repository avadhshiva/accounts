import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { interviewReply } from "@/lib/ai";
import { pickQuestionSet } from "@/lib/interviewQuestions";
import { canUse } from "@/lib/limits";
import { assertFeatureAccess } from "@/lib/guard";
import { updateDb } from "@/lib/store";

const schema = z.object({
  mode: z.enum(["hr", "genai", "technical", "aptitude"]),
});

export async function POST(req: Request) {
  const gate = await assertFeatureAccess();
  if (gate.error) return gate.error;
  const user = gate.user!;

  try {
    const body = schema.parse(await req.json());
    if (!canUse(user.plan, user.usage, "mockInterviews")) {
      return NextResponse.json(
        { error: "Free monthly mock limit reached.", code: "LIMIT" },
        { status: 402 },
      );
    }

    const questionSet = pickQuestionSet(body.mode);
    const first = await interviewReply({ mode: body.mode, history: [], questionSet });
    const session = await updateDb((db) => {
      const u = db.users.find((x) => x.id === user.id);
      if (u) u.usage.mockInterviews += 1;
      const row = {
        id: randomUUID(),
        userId: user.id,
        mode: body.mode,
        createdAt: new Date().toISOString(),
        status: "active" as const,
        questionSet,
        messages: [
          {
            role: "coach" as const,
            content: first.message || "Tell me about yourself.",
            at: new Date().toISOString(),
          },
        ],
      };
      db.interviews.unshift(row);
      return row;
    });

    return NextResponse.json({ session });
  } catch {
    return NextResponse.json({ error: "Could not start interview" }, { status: 400 });
  }
}
