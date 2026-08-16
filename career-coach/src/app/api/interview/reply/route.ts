import { NextResponse } from "next/server";
import { z } from "zod";
import { interviewReply } from "@/lib/ai";
import { interviewRepo } from "@/lib/db";
import { assertFeatureAccess } from "@/lib/guard";

const schema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1).max(4000),
  finish: z.boolean().optional(),
});

export async function POST(req: Request) {
  const gate = await assertFeatureAccess();
  if (gate.error) return gate.error;
  const user = gate.user!;

  try {
    const body = schema.parse(await req.json());

    const session = await interviewRepo.findByIdForUser(body.sessionId, user.id);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (session.status === "completed") {
      return NextResponse.json({ session });
    }

    session.messages.push({
      role: "user",
      content: body.message,
      at: new Date().toISOString(),
    });

    const history = session.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    if (body.finish || session.messages.filter((m) => m.role === "user").length >= 4) {
      const scorecard = await interviewReply({
        mode: session.mode,
        history,
        finalize: true,
        questionSet: session.questionSet,
      });
      session.status = "completed";
      session.scorecard = {
        overall: Number(scorecard.overall ?? 70),
        communication: Number(scorecard.communication ?? 70),
        clarity: Number(scorecard.clarity ?? 70),
        depth: Number(scorecard.depth ?? 70),
        feedback: String(scorecard.feedback ?? "Keep practicing with clearer examples."),
        improvements: scorecard.improvements ?? [
          "Add metrics to answers",
          "Use STAR format",
          "Keep answers under 90 seconds",
        ],
      };
      session.messages.push({
        role: "coach",
        content: `Interview complete. Overall score: ${session.scorecard.overall}/100. ${session.scorecard.feedback}`,
        at: new Date().toISOString(),
      });
      await interviewRepo.update(session);
      return NextResponse.json({ session });
    }

    const reply = await interviewReply({
      mode: session.mode,
      history,
      userMessage: body.message,
      questionSet: session.questionSet,
    });
    session.messages.push({
      role: "coach",
      content: reply.message || "Thanks — could you elaborate with one example?",
      at: new Date().toISOString(),
    });
    await interviewRepo.update(session);
    return NextResponse.json({ session });
  } catch {
    return NextResponse.json({ error: "Reply failed" }, { status: 400 });
  }
}
