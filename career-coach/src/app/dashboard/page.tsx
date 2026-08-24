import { AppShell } from "@/components/AppShell";
import { getSessionUser } from "@/lib/auth";
import { getAccessSnapshot } from "@/lib/access";
import { redirect } from "next/navigation";
import { getReadinessForUser } from "@/lib/readiness";
import { countTotalMockSessionsUsed } from "@/lib/assessmentQuota";
import { interviewRepo, resumeRepo } from "@/lib/db";
import { PlacementReadinessHero } from "@/components/readiness/PlacementReadinessHero";
import { MissionStatusStrip } from "@/components/readiness/MissionStatusStrip";
import { CategoryBreakdown } from "@/components/readiness/CategoryBreakdown";
import { StrengthsGapsPanel } from "@/components/readiness/StrengthsGapsPanel";
import { MissionNextActions } from "@/components/readiness/MissionNextActions";
import { MissionTargetPanel } from "@/components/readiness/MissionTargetPanel";
import { RecentAssessments } from "@/components/dashboard/RecentAssessments";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const access = getAccessSnapshot(user);
  if (!access.allowed) redirect("/unlock");

  let readinessError = false;
  let readiness = null;

  try {
    readiness = await getReadinessForUser(user.id, user);
  } catch {
    readinessError = true;
  }

  const resumes = await resumeRepo.listByUserId(user.id, 3);
  const interviews = await interviewRepo.listByUserId(user.id, 100);
  const mockSessionsUsed = countTotalMockSessionsUsed(interviews);

  const firstName = user.name.split(" ")[0];

  return (
    <AppShell title={`${firstName} · Placement Mission`}>
      {readinessError ? (
        <div
          className="mb-6 rounded-2xl border border-[var(--accent-2)]/30 bg-white/80 p-4 text-sm text-[var(--ink-soft)]"
          role="alert"
        >
          Couldn&apos;t load placement readiness right now. Recent assessments below may still be
          available. Try refreshing the page.
        </div>
      ) : null}

      {readiness ? (
        <>
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PlacementReadinessHero readiness={readiness} />
            </div>
            <MissionStatusStrip
              user={user}
              access={access}
              completedCategoryCount={readiness.completedCategoryCount}
              mockSessionsUsed={mockSessionsUsed}
            />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-5">
              <CategoryBreakdown categories={readiness.categories} />
              <StrengthsGapsPanel
                strengths={readiness.strengths}
                gaps={readiness.gaps}
                completedCategoryCount={readiness.completedCategoryCount}
              />
              <MissionNextActions actions={readiness.nextActions} categories={readiness.categories} />
            </div>
            <MissionTargetPanel
              targetRole={user.targetRole}
              college={user.college}
              categories={readiness.categories}
            />
          </div>
        </>
      ) : null}

      <RecentAssessments resumes={resumes} interviews={interviews.slice(0, 3)} />
    </AppShell>
  );
}
