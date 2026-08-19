import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getReadinessForUser } from "@/lib/readiness";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  try {
    const readiness = await getReadinessForUser(user.id);
    return NextResponse.json({ readiness });
  } catch {
    return NextResponse.json({ error: "Could not compute readiness" }, { status: 500 });
  }
}
