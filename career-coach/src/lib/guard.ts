import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAccessSnapshot } from "@/lib/access";

/** Guard helper for feature APIs — returns NextResponse error if blocked */
export async function assertFeatureAccess() {
  const user = await getSessionUser();
  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Login required" }, { status: 401 }),
    };
  }
  const access = getAccessSnapshot(user);
  if (!access.allowed) {
    return {
      user,
      access,
      error: NextResponse.json(
        {
          error: "Trial ended. Unlock full access to continue.",
          code: "TRIAL_EXPIRED",
          access,
        },
        { status: 402 },
      ),
    };
  }
  return { user, access, error: null };
}
