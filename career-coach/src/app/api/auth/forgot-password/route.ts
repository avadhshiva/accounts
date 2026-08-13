import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { appBaseUrl, sendEmail } from "@/lib/email";
import { updateDb } from "@/lib/store";

const schema = z.object({
  email: z.string().email(),
});

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase().trim();

    const tokenRow = await updateDb(async (db) => {
      const user = db.users.find((u) => u.email === email);
      if (!user) return null;

      const token = randomBytes(32).toString("hex");
      const now = new Date();
      const expiresAt = new Date(now.getTime() + TOKEN_TTL_MS).toISOString();

      if (!db.passwordResetTokens) db.passwordResetTokens = [];
      db.passwordResetTokens = db.passwordResetTokens.filter(
        (t) => t.userId !== user.id || new Date(t.expiresAt) > now,
      );

      const row = {
        token,
        userId: user.id,
        email: user.email,
        expiresAt,
        createdAt: now.toISOString(),
      };
      db.passwordResetTokens.push(row);
      return row;
    });

    if (tokenRow) {
      const resetUrl = `${appBaseUrl()}/reset-password?token=${tokenRow.token}`;
      const appName = process.env.NEXT_PUBLIC_APP_NAME || "Pathly";
      const sent = await sendEmail({
        to: tokenRow.email,
        subject: `${appName} — reset your password`,
        text: `Hi,\n\nClick this link to reset your password (valid for 1 hour):\n${resetUrl}\n\nIf you did not request this, you can ignore this email.\n`,
        html: `<p>Hi,</p><p>Click the link below to reset your password (valid for 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, you can ignore this email.</p>`,
      });

      if (!sent.ok) {
        return NextResponse.json(
          { error: "Could not send reset email. Please try again later." },
          { status: 503 },
        );
      }
    }

    // Always return success to avoid email enumeration
    return NextResponse.json({
      ok: true,
      message: "If that email is registered, a reset link has been sent.",
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
