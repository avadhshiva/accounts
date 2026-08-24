import type { AccessSnapshot } from "@/lib/access";
import type { User } from "@/lib/types";
import {
  formatMockSessionsHeaderLabel,
  getTotalMockSessionsLimit,
} from "@/lib/assessmentQuota";
import {
  MISSION_CATEGORY_COUNT,
  missionProgressPercent,
  pilotDayNumber,
} from "@/lib/readiness/presentation";
import { getUsageLimits } from "@/lib/display";

export function MissionStatusStrip({
  user,
  access,
  completedCategoryCount,
  mockSessionsUsed,
}: {
  user: User;
  access: AccessSnapshot;
  completedCategoryCount: number;
  mockSessionsUsed: number;
}) {
  const limits = getUsageLimits(user);
  const mockTotal = getTotalMockSessionsLimit(user);
  const trialDays = Math.round(access.trialHours / 24) || 7;
  const progressPercent = missionProgressPercent(completedCategoryCount);
  const pilotDay = pilotDayNumber(access.trialStartedAt, new Date(), trialDays);

  return (
    <section className="panel rounded-[1.5rem] p-5 md:p-6">
      <p className="text-sm font-semibold text-[var(--accent)]">Mission status</p>

      {access.trialStarted ? (
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          {trialDays}-day pilot
          {pilotDay ? (
            <>
              {" · "}
              <strong className="text-[var(--ink)]">Pilot day {pilotDay}</strong>
            </>
          ) : null}
          {" · "}
          <strong className="tabular-nums text-[var(--ink)]">{access.remainingLabel}</strong> left
        </p>
      ) : (
        <p className="mt-2 text-sm text-[var(--ink-soft)]">Pilot trial not started</p>
      )}

      <p className="mt-2 text-sm text-[var(--ink-soft)]">
        {user.usage.resumeAnalyses}/{limits.resumeAnalyses} resume scores ·{" "}
        {formatMockSessionsHeaderLabel(mockSessionsUsed, mockTotal)}
      </p>
      <p className="mt-1 text-xs text-[var(--ink-soft)]">
        Each mock category allows 2 scored sessions (8 total during pilot).
      </p>

      <div className="mt-5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-semibold">Mission progress</p>
          <p className="text-sm tabular-nums text-[var(--ink-soft)]">
            {completedCategoryCount}/{MISSION_CATEGORY_COUNT} areas assessed
          </p>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--sand-2)]"
          role="progressbar"
          aria-valuenow={completedCategoryCount}
          aria-valuemin={0}
          aria-valuemax={MISSION_CATEGORY_COUNT}
          aria-label={`Mission progress: ${completedCategoryCount} of ${MISSION_CATEGORY_COUNT} areas assessed`}
        >
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-3 text-xs text-[var(--ink-soft)]">
          Assess → see score → close gaps → reassess
        </p>
      </div>
    </section>
  );
}
