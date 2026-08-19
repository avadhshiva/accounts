import type { ReadinessSnapshot } from "@/lib/readiness/types";
import { formatOverallHeadline } from "@/lib/readiness/presentation";

export function PlacementReadinessHero({ readiness }: { readiness: ReadinessSnapshot }) {
  const headline = formatOverallHeadline(readiness);

  return (
    <section
      className="panel relative overflow-hidden rounded-[1.5rem] p-5 md:p-6"
      aria-live="polite"
    >
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--accent)]/15 blur-2xl" />
      <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-[var(--accent-2)]/20 blur-2xl" />
      <p className="text-sm font-semibold text-[var(--accent)]">Placement readiness</p>

      {headline.kind === "complete" ? (
        <div className="mt-4 flex items-end gap-3">
          <span className="display text-5xl font-semibold tabular-nums md:text-6xl">
            {headline.displayScore}
          </span>
          <span className="mb-2 text-sm text-[var(--ink-soft)]">/ 100 practice score</span>
        </div>
      ) : (
        <div className="mt-4">
          <span className="display text-4xl font-semibold text-[var(--ink-soft)] md:text-5xl">
            —
          </span>
          <p className="mt-2 text-lg font-semibold text-[var(--ink)]">{headline.headline}</p>
        </div>
      )}

      <p className="mt-3 text-sm text-[var(--ink-soft)]">{headline.subline}</p>
      <p className="sr-only">{headline.ariaLabel}</p>
    </section>
  );
}
