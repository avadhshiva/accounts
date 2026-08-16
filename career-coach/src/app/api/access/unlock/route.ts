import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, publicUser } from "@/lib/auth";
import {
  getAccessSnapshot,
  getInviteCodes,
  UNLOCK_PRICE_INR,
} from "@/lib/access";
import { userRepo } from "@/lib/db";

const schema = z.object({
  method: z.enum(["invite", "manual_upi"]),
  inviteCode: z.string().optional(),
  upiReference: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  try {
    const body = schema.parse(await req.json());

    if (body.method === "invite") {
      const code = (body.inviteCode || "").trim().toUpperCase();
      if (!getInviteCodes().includes(code)) {
        return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
      }
      const updated = await userRepo.unlockAccess(user.id, {
        access: "invite",
        plan: "pro",
        inviteCode: code,
        paidAt: new Date().toISOString(),
      });
      if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });
      return NextResponse.json({
        user: publicUser(updated),
        access: getAccessSnapshot(updated),
        message: "Invite unlocked. Full access enabled.",
      });
    }

    if (process.env.ALLOW_MANUAL_UNLOCK !== "true") {
      return NextResponse.json(
        {
          error:
            "Online payment coming soon. Use your invite code, or ask the founder to enable manual unlock.",
        },
        { status: 403 },
      );
    }

    const ref = (body.upiReference || "").trim();
    if (ref.length < 4) {
      return NextResponse.json({ error: "Enter UPI/payment reference" }, { status: 400 });
    }

    const updated = await userRepo.unlockAccess(user.id, {
      access: "paid",
      plan: "pro",
      inviteCode: `UPI:${ref}`,
      paidAt: new Date().toISOString(),
    });
    if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({
      user: publicUser(updated),
      access: getAccessSnapshot(updated),
      message: `Marked paid ₹${UNLOCK_PRICE_INR}. Founder will verify the UPI reference.`,
    });
  } catch {
    return NextResponse.json({ error: "Unlock failed" }, { status: 400 });
  }
}
