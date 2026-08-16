import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";
import { userRepo, passwordResetRepo } from "@/lib/db";
import { passwordSchema } from "@/lib/password";

const schema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const now = new Date();

    const row = await passwordResetRepo.findValidToken(body.token);
    if (!row) {
      return NextResponse.json({ error: "Invalid or used reset link." }, { status: 400 });
    }
    if (new Date(row.expiresAt) <= now) {
      await passwordResetRepo.deleteToken(body.token);
      return NextResponse.json({ error: "Reset link expired. Request a new one." }, { status: 400 });
    }

    const updated = await userRepo.updatePassword(row.userId, await hashPassword(body.password));
    if (!updated) {
      await passwordResetRepo.deleteToken(body.token);
      return NextResponse.json({ error: "Invalid or used reset link." }, { status: 400 });
    }

    await passwordResetRepo.deleteTokensForUser(row.userId);
    return NextResponse.json({ ok: true, email: updated.email });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Password does not meet requirements." }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not reset password" }, { status: 500 });
  }
}
