import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import {
  createSession,
  hashPassword,
  monthKey,
  publicUser,
} from "@/lib/auth";
import { getAccessSnapshot } from "@/lib/access";
import { updateDb } from "@/lib/store";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  college: z.string().max(120).optional(),
  targetRole: z.string().max(80).optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase().trim();

    const user = await updateDb(async (db) => {
      if (db.users.some((u) => u.email === email)) {
        throw new Error("EMAIL_TAKEN");
      }
      const now = new Date().toISOString();
      const created = {
        id: randomUUID(),
        name: body.name.trim(),
        email,
        passwordHash: await hashPassword(body.password),
        plan: "free" as const,
        access: "trial" as const,
        trialStartedAt: now,
        sessionVersion: 1,
        college: body.college?.trim() || "",
        targetRole: body.targetRole?.trim() || "SDE Fresher",
        createdAt: now,
        usage: {
          resumeAnalyses: 0,
          mockInterviews: 0,
          monthKey: monthKey(),
        },
      };
      db.users.push(created);
      return created;
    });

    await createSession(user.id, user.sessionVersion);
    return NextResponse.json({
      user: publicUser(user),
      access: getAccessSnapshot(user),
    });
  } catch (e) {
    if (e instanceof Error && e.message === "EMAIL_TAKEN") {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
