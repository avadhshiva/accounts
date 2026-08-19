import Link from "next/link";
import type { InterviewSession, ResumeAnalysis } from "@/lib/types";

export function RecentAssessments({
  resumes,
  interviews,
}: {
  resumes: ResumeAnalysis[];
  interviews: InterviewSession[];
}) {
  return (
    <div className="mt-8 grid gap-5 md:grid-cols-2">
      <section className="panel rounded-[1.5rem] p-5 md:p-6">
        <h2 className="display text-2xl font-semibold">Recent resume scores</h2>
        <div className="mt-4 space-y-3">
          {resumes.length === 0 ? (
            <p className="text-sm text-[var(--ink-soft)]">
              No scores yet —{" "}
              <Link href="/resume" className="font-semibold text-[var(--accent)]">
                start mission step 1
              </Link>
              .
            </p>
          ) : (
            resumes.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-3 text-sm"
              >
                <span>{r.role}</span>
                <span className="font-semibold tabular-nums">{r.score}/100</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="panel rounded-[1.5rem] p-5 md:p-6">
        <h2 className="display text-2xl font-semibold">Recent interviews</h2>
        <div className="mt-4 space-y-3">
          {interviews.length === 0 ? (
            <p className="text-sm text-[var(--ink-soft)]">
              No mocks yet —{" "}
              <Link href="/interview" className="font-semibold text-[var(--accent)]">
                complete a mock interview
              </Link>
              .
            </p>
          ) : (
            interviews.map((i) => (
              <div
                key={i.id}
                className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-3 text-sm"
              >
                <span className="uppercase">{i.mode}</span>
                <span className="font-semibold tabular-nums">
                  {i.scorecard ? `${i.scorecard.overall}/100` : i.status}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
