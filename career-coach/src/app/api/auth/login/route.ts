import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, publicUser, verifyPassword } from "@/lib/auth";
import { getAccessSnapshot } from "@/lib/access";
import { userRepo } from "@/lib/db";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase().trim();

    const found = await userRepo.findByEmail(email);
    if (!found) throw new Error("INVALID");
    const ok = await verifyPassword(body.password, found.passwordHash);
    if (!ok) throw new Error("INVALID");

    const user = await userRepo.bumpSessionVersion(found.id);
    if (!user) throw new Error("INVALID");

    await createSession(user.id, user.sessionVersion);
    return NextResponse.json({
      user: publicUser(user),
      access: getAccessSnapshot(user),
      notice: "Logged in here only — any older session was signed out.",
    });
  } catch {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
}
