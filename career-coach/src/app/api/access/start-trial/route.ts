import { NextResponse } from "next/server";
import { getSessionUser, publicUser } from "@/lib/auth";
import { getAccessSnapshot, PILOT_MODE, TRIAL_MINUTES } from "@/lib/access";
import { userRepo } from "@/lib/db";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  if (!PILOT_MODE) {
    return NextResponse.json({ error: "Pilot mode is off" }, { status: 403 });
  }

  if (user.trialStartedAt) {
    return NextResponse.json({
      user: publicUser(user),
      access: getAccessSnapshot(user),
      message: "Trial already started",
    });
  }

  const updated = await userRepo.startTrial(user.id);
  if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const trialDays = Math.max(1, Math.round(TRIAL_MINUTES / 60 / 24));
  const trialLabel = trialDays >= 2 ? `${trialDays} days` : `${Math.round(TRIAL_MINUTES / 60)} hours`;

  return NextResponse.json({
    user: publicUser(updated),
    access: getAccessSnapshot(updated),
    message: `Trial started — explore freely for ${trialLabel}.`,
  });
}
