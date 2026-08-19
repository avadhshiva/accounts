import type { ReadinessAction, ReadinessCategory } from "@/lib/readiness/types";
import { MissionActionCard } from "@/components/dashboard/MissionActionCard";
import {
  findCategoryById,
  isActionCategoryDone,
} from "@/lib/readiness/presentation";

export function MissionNextActions({
  actions,
  categories,
}: {
  actions: ReadinessAction[];
  categories: ReadinessCategory[];
}) {
  if (actions.length === 0) {
    return (
      <section className="panel rounded-[1.5rem] p-5 md:p-6">
        <h2 className="display text-2xl font-semibold">What to do next</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Complete a resume score to generate your next mission actions.
        </p>
      </section>
    );
  }

  return (
    <section className="panel rounded-[1.5rem] p-5 md:p-6">
      <h2 className="display text-2xl font-semibold">What to do next</h2>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">
        Highest-impact action from your latest assessments.
      </p>
      <ol className="mt-5 grid gap-3 sm:grid-cols-2" role="list">
        {actions.map((action, index) => {
          const category = findCategoryById(categories, action.categoryId);
          const done = isActionCategoryDone(category);

          return (
            <li key={`${action.href}-${action.label}`} className={index === 0 ? "sm:col-span-2" : ""}>
              <MissionActionCard
                step={index + 1}
                title={action.label}
                description={index === 0 ? "Your primary mission action" : undefined}
                href={action.href}
                done={done}
                primary={index === 0}
              />
            </li>
          );
        })}
      </ol>
    </section>
  );
}
