import Link from "next/link";
import type { ReadinessCategory } from "@/lib/readiness/types";
import {
  formatAssessedDate,
  formatCategoryTile,
} from "@/lib/readiness/presentation";

export function CategoryBreakdown({ categories }: { categories: ReadinessCategory[] }) {
  return (
    <section className="panel rounded-[1.5rem] p-5 md:p-6">
      <h2 className="display text-2xl font-semibold">Category breakdown</h2>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">
        Six areas that shape your placement readiness score.
      </p>
      <ul className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3" role="list">
        {categories.map((category) => {
          const tile = formatCategoryTile(category);
          const assessed = formatAssessedDate(category.assessedAt);

          return (
            <li key={category.id}>
              <Link
                href={tile.href}
                className={`flex min-h-[44px] flex-col rounded-2xl border p-4 transition hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                  tile.isInsufficient
                    ? "border-dashed border-[var(--line)] bg-white/50"
                    : tile.needsWork
                      ? "border-[var(--accent-2)]/40 bg-white/80"
                      : "border-[var(--line)] bg-white/70"
                }`}
                aria-label={tile.ariaLabel}
              >
                <p className="text-sm font-semibold">{category.label}</p>
                {tile.scoreLabel ? (
                  <p
                    className={`mt-2 display text-2xl font-semibold tabular-nums ${
                      tile.needsWork ? "text-[var(--accent-2)]" : "text-[var(--ink)]"
                    }`}
                  >
                    {tile.scoreLabel}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">{tile.statusLabel}</p>
                )}
                {tile.scoreLabel ? (
                  <p
                    className={`mt-1 text-xs font-medium ${
                      tile.needsWork ? "text-[var(--accent-2)]" : "text-[var(--accent)]"
                    }`}
                  >
                    {tile.statusLabel}
                  </p>
                ) : null}
                {assessed ? (
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">Assessed {assessed}</p>
                ) : null}
                <span className="mt-3 text-xs font-semibold text-[var(--accent)]">
                  {tile.ctaLabel}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
