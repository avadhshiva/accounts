import { NextResponse } from "next/server";
import { getSessionUser, publicUser } from "@/lib/auth";
import { getAccessSnapshot } from "@/lib/access";
import { userRepo } from "@/lib/db";

/** Test-only helper: promote current user to paid/pro for pilot. */
export async function POST() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_TEST_PRO !== "true") {
    return NextResponse.json({ error: "Disabled" }, { status: 403 });
  }
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const updated = await userRepo.unlockAccess(user.id, {
    access: "paid",
    plan: "pro",
    paidAt: new Date().toISOString(),
  });

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    user: publicUser(updated),
    access: getAccessSnapshot(updated),
  });
}
