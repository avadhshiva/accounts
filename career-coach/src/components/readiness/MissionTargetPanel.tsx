import Link from "next/link";
import { TRACKS, totalLessonCount } from "@/lib/content";
import type { ReadinessCategory } from "@/lib/readiness/types";
import { categoryHref } from "@/lib/readiness/presentation";

export function MissionTargetPanel({
  targetRole,
  college,
  categories,
}: {
  targetRole?: string;
  college?: string;
  categories: ReadinessCategory[];
}) {
  const resumeCategory = categories.find((c) => c.id === "resume");
  const resumeInsufficient = !resumeCategory || resumeCategory.status === "insufficient_data";

  return (
    <section className="panel rounded-[1.5rem] p-5 md:p-6">
      <p className="text-sm font-semibold text-[var(--accent)]">Your target</p>
      <p className="mt-2 text-xl font-semibold">{targetRole || "SDE Fresher"}</p>
      {college ? <p className="mt-2 text-sm text-[var(--ink-soft)]">{college}</p> : null}
      <p className="mt-6 text-sm text-[var(--ink-soft)]">
        {TRACKS.length} tracks · {totalLessonCount()} lessons · HR + domain mocks
      </p>
      <Link href="/learn" className="btn btn-ghost mt-4 inline-flex text-sm">
        Browse roadmaps →
      </Link>
      {resumeInsufficient ? (
        <Link
          href={categoryHref("resume")}
          className="btn btn-ghost mt-3 inline-flex text-sm text-[var(--accent)]"
        >
          Score resume for this role →
        </Link>
      ) : null}
    </section>
  );
}
