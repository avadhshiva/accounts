import { NextResponse } from "next/server";
import { getSessionUser, publicUser } from "@/lib/auth";
import { getAccessSnapshot } from "@/lib/access";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  return NextResponse.json({
    user: publicUser(user),
    access: getAccessSnapshot(user),
  });
}
