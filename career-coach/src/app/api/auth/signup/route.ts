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
import { userRepo } from "@/lib/db";
import { passwordSchema } from "@/lib/password";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: passwordSchema,
  college: z.string().max(120).optional(),
  targetRole: z.string().max(80).optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase().trim();

    if (await userRepo.emailExists(email)) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const now = new Date().toISOString();
    const pilot = (process.env.PILOT_MODE || "true").toLowerCase() !== "false";
    const user = await userRepo.create({
      id: randomUUID(),
      name: body.name.trim(),
      email,
      passwordHash: await hashPassword(body.password),
      plan: pilot ? "pro" : "free",
      access: "trial",
      trialStartedAt: "",
      sessionVersion: 1,
      college: body.college?.trim() || "",
      targetRole: body.targetRole?.trim() || "SDE Fresher",
      createdAt: now,
      updatedAt: now,
      usage: {
        resumeAnalyses: 0,
        mockInterviews: 0,
        monthKey: monthKey(),
      },
    });

    await createSession(user.id, user.sessionVersion);
    return NextResponse.json({
      user: publicUser(user),
      access: getAccessSnapshot(user),
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      const msg = e.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
