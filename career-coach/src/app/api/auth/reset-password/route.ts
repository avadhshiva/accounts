import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";
import { passwordSchema } from "@/lib/password";
import { updateDb } from "@/lib/store";

const schema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const now = new Date();

    const email = await updateDb(async (db) => {
      if (!db.passwordResetTokens) db.passwordResetTokens = [];
      const idx = db.passwordResetTokens.findIndex((t) => t.token === body.token);
      if (idx === -1) throw new Error("INVALID_TOKEN");

      const row = db.passwordResetTokens[idx];
      if (new Date(row.expiresAt) <= now) {
        db.passwordResetTokens.splice(idx, 1);
        throw new Error("EXPIRED");
      }

      const user = db.users.find((u) => u.id === row.userId);
      if (!user) {
        db.passwordResetTokens.splice(idx, 1);
        throw new Error("INVALID_TOKEN");
      }

      user.passwordHash = await hashPassword(body.password);
      user.sessionVersion += 1;
      db.passwordResetTokens = db.passwordResetTokens.filter((t) => t.userId !== user.id);
      return user.email;
    });

    return NextResponse.json({ ok: true, email });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Password does not meet requirements." }, { status: 400 });
    }
    if (e instanceof Error) {
      if (e.message === "INVALID_TOKEN") {
        return NextResponse.json({ error: "Invalid or used reset link." }, { status: 400 });
      }
      if (e.message === "EXPIRED") {
        return NextResponse.json({ error: "Reset link expired. Request a new one." }, { status: 400 });
      }
    }
    return NextResponse.json({ error: "Could not reset password" }, { status: 500 });
  }
}
