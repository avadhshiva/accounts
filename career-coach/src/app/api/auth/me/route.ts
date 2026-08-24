import { NextResponse } from "next/server";
import { getSessionUser, publicUser } from "@/lib/auth";
import { getAccessSnapshot } from "@/lib/access";
import {
  countTotalMockSessionsUsed,
  getTotalMockSessionsLimit,
} from "@/lib/assessmentQuota";
import { interviewRepo } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });

  const interviews = await interviewRepo.listByUserId(user.id, 100);
  const mockSessionsUsed = countTotalMockSessionsUsed(interviews);
  const mockSessionsTotal = getTotalMockSessionsLimit(user);

  return NextResponse.json({
    user: publicUser(user),
    access: getAccessSnapshot(user),
    mockSessions: { used: mockSessionsUsed, total: mockSessionsTotal },
  });
}
