import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { interviewReply } from "@/lib/ai";
import { updateDb } from "@/lib/store";

const schema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1).max(4000),
  finish: z.boolean().optional(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  try {
    const body = schema.parse(await req.json());

    const result = await updateDb(async (db) => {
      const session = db.interviews.find(
        (i) => i.id === body.sessionId && i.userId === user.id,
      );
      if (!session) throw new Error("NOT_FOUND");
      if (session.status === "completed") return session;

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
        });
        const overall = Number(scorecard.overall ?? 70);
        const communication = Number(scorecard.communication ?? 70);
        const clarity = Number(scorecard.clarity ?? 70);
        const depth = Number(scorecard.depth ?? 70);
        const feedback = String(scorecard.feedback ?? "Keep practicing with clearer examples.");
        const improvements = scorecard.improvements ?? [
          "Add metrics to answers",
          "Use STAR format",
          "Keep answers under 90 seconds",
        ];
        session.status = "completed";
        session.scorecard = {
          overall,
          communication,
          clarity,
          depth,
          feedback,
          improvements,
        };
        session.messages.push({
          role: "coach",
          content: `Interview complete. Overall score: ${overall}/100. ${feedback}`,
          at: new Date().toISOString(),
        });
        return session;
      }

      const reply = await interviewReply({
        mode: session.mode,
        history,
        userMessage: body.message,
      });
      session.messages.push({
        role: "coach",
        content: reply.message || "Thanks — could you elaborate with one example?",
        at: new Date().toISOString(),
      });
      return session;
    });

    return NextResponse.json({ session: result });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Reply failed" }, { status: 400 });
  }
}
