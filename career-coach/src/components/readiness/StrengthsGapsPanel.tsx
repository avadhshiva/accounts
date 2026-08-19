import Link from "next/link";
import {
  gapsEmptyCopy,
  missionOnboardingCopy,
  strengthsEmptyCopy,
} from "@/lib/readiness/presentation";

export function StrengthsGapsPanel({
  strengths,
  gaps,
  completedCategoryCount,
}: {
  strengths: string[];
  gaps: string[];
  completedCategoryCount: number;
}) {
  const showOnboarding = completedCategoryCount === 0 && strengths.length === 0 && gaps.length === 0;

  return (
    <section className="grid gap-5 md:grid-cols-2">
      <div className="panel rounded-[1.5rem] p-5 md:p-6">
        <h2 className="display text-xl font-semibold">Strengths</h2>
        {showOnboarding ? (
          <p className="mt-3 text-sm text-[var(--ink-soft)]">{missionOnboardingCopy()}</p>
        ) : null}
        {strengths.length > 0 ? (
          <ul className="mt-4 space-y-2 text-sm" role="list">
            {strengths.map((item) => (
              <li
                key={item}
                className="rounded-xl border border-[var(--line)] bg-white/70 px-3 py-2"
              >
                {item}
              </li>
            ))}
          </ul>
        ) : !showOnboarding ? (
          <p className="mt-3 text-sm text-[var(--ink-soft)]">
            {strengthsEmptyCopy()}{" "}
            <Link href="/resume" className="font-semibold text-[var(--accent)]">
              Score resume
            </Link>
          </p>
        ) : null}
      </div>

      <div className="panel rounded-[1.5rem] p-5 md:p-6">
        <h2 className="display text-xl font-semibold">Gaps to close</h2>
        {gaps.length > 0 ? (
          <ul className="mt-4 space-y-2 text-sm" role="list">
            {gaps.map((item) => (
              <li
                key={item}
                className="rounded-xl border border-[var(--line)] bg-white/70 px-3 py-2"
              >
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[var(--ink-soft)]">
            {gapsEmptyCopy()}{" "}
            <Link href="/resume" className="font-semibold text-[var(--accent)]">
              Resume
            </Link>
            {" · "}
            <Link href="/interview" className="font-semibold text-[var(--accent)]">
              Mock interview
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
