import { NextResponse } from "next/server";
import { getSessionUser, publicUser } from "@/lib/auth";
import { getAccessSnapshot, PILOT_MODE } from "@/lib/access";
import { updateDb } from "@/lib/store";

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

  const updated = await updateDb((db) => {
    const u = db.users.find((x) => x.id === user.id);
    if (!u) return null;
    u.trialStartedAt = new Date().toISOString();
    return u;
  });

  if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    user: publicUser(updated),
    access: getAccessSnapshot(updated),
    message: "Trial started — explore freely for 48 hours.",
  });
}
