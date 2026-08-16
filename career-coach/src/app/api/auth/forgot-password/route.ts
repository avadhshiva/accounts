import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { userRepo, passwordResetRepo } from "@/lib/db";
import { appBaseUrl, sendEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
});

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase().trim();

    const user = await userRepo.findByEmail(email);
    let tokenRow = null;

    if (user) {
      const now = new Date();
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(now.getTime() + TOKEN_TTL_MS).toISOString();
      tokenRow = await passwordResetRepo.createToken({
        token,
        userId: user.id,
        email: user.email,
        expiresAt,
        createdAt: now.toISOString(),
      });
    }

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
