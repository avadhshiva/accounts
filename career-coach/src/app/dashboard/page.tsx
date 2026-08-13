import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getSessionUser } from "@/lib/auth";
import { readDb } from "@/lib/store";
import { TRACKS, totalLessonCount } from "@/lib/content";
import { getAccessSnapshot } from "@/lib/access";
import { getPlanDisplayLabel, getUsageLimits } from "@/lib/display";
import { redirect } from "next/navigation";

function StepCard({
  step,
  title,
  description,
  href,
  done,
  primary,
}: {
  step: number;
  title: string;
  description: string;
  href: string;
  done: boolean;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-2xl border p-4 transition hover:shadow-sm ${
        done
          ? "border-[var(--accent)]/30 bg-[var(--accent)]/5"
          : primary
            ? "border-[var(--accent)] bg-white shadow-[0_8px_30px_rgba(15,28,46,0.06)]"
            : "border-[var(--line)] bg-white/70"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            done ? "bg-[var(--accent)] text-white" : "bg-[var(--sand-2)] text-[var(--ink)]"
          }`}
        >
          {done ? "✓" : step}
        </span>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">{description}</p>
        </div>
      </div>
    </Link>
  );
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const access = getAccessSnapshot(user);
  if (!access.allowed) redirect("/unlock");
  const db = await readDb();
  const resumes = db.resumes.filter((r) => r.userId === user.id).slice(0, 3);
  const interviews = db.interviews.filter((i) => i.userId === user.id).slice(0, 3);

  const limits = getUsageLimits(user);
  const planLabel = getPlanDisplayLabel(user);
  const resumeDone = user.usage.resumeAnalyses > 0;
  const mockDone = user.usage.mockInterviews > 0;
  const trialDays = Math.round(access.trialHours / 24) || 7;

  return (
    <AppShell title={`Hi ${user.name.split(" ")[0]}, let’s prep`}>
      <div className="grid gap-5 md:grid-cols-3">
        <div className="panel rounded-[1.5rem] p-5 md:col-span-2">
          <p className="text-sm font-semibold text-[var(--accent)]">Your pilot plan</p>
          <p className="mt-2 display text-3xl font-semibold">{planLabel}</p>
          {access.trialStarted ? (
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              {trialDays}-day pilot ·{" "}
              <strong className="tabular-nums text-[var(--ink)]">{access.remainingLabel}</strong>{" "}
              left · {user.usage.resumeAnalyses}/{limits.resumeAnalyses} resume scores ·{" "}
              {user.usage.mockInterviews}/{limits.mockInterviews} mock interviews
            </p>
          ) : (
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              {user.usage.resumeAnalyses}/{limits.resumeAnalyses} resume scores ·{" "}
              {user.usage.mockInterviews}/{limits.mockInterviews} mock interviews
            </p>
          )}

          <div className="mt-6">
            <p className="text-sm font-semibold">Start here — day 1</p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              Do these two first for the best pilot experience. Learn & aptitude when you have time.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <StepCard
                step={1}
                title="Score your resume"
                description="~5 min · ATS-style feedback for your target role"
                href="/resume"
                done={resumeDone}
                primary={!resumeDone}
              />
              <StepCard
                step={2}
                title="One mock interview"
                description="~15 min · HR, technical, or aptitude mode"
                href="/interview"
                done={mockDone}
                primary={resumeDone && !mockDone}
              />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <StepCard
                step={3}
                title="Explore a lesson"
                description="Pick a track on Learn — GenAI, technical, or aptitude"
                href="/learn"
                done={false}
              />
              <StepCard
                step={4}
                title="Share feedback"
                description="2 min · shapes what we build next"
                href="/feedback"
                done={false}
              />
            </div>
          </div>
        </div>

        <div className="panel rounded-[1.5rem] p-5">
          <p className="text-sm font-semibold text-[var(--accent)]">Your target</p>
          <p className="mt-2 text-xl font-semibold">{user.targetRole || "SDE Fresher"}</p>
          {user.college ? (
            <p className="mt-2 text-sm text-[var(--ink-soft)]">{user.college}</p>
          ) : null}
          <p className="mt-6 text-sm text-[var(--ink-soft)]">
            {TRACKS.length} tracks · {totalLessonCount()} lessons · HR + domain mocks
          </p>
          <Link href="/learn" className="btn btn-ghost mt-4 inline-flex text-sm">
            Browse roadmaps →
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <section className="panel rounded-[1.5rem] p-5">
          <h2 className="display text-2xl font-semibold">Recent resume scores</h2>
          <div className="mt-4 space-y-3">
            {resumes.length === 0 ? (
              <p className="text-sm text-[var(--ink-soft)]">
                No scores yet —{" "}
                <Link href="/resume" className="font-semibold text-[var(--accent)]">
                  start with step 1
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
                  <span className="font-semibold">{r.score}/100</span>
                </div>
              ))
            )}
          </div>
        </section>
        <section className="panel rounded-[1.5rem] p-5">
          <h2 className="display text-2xl font-semibold">Recent interviews</h2>
          <div className="mt-4 space-y-3">
            {interviews.length === 0 ? (
              <p className="text-sm text-[var(--ink-soft)]">
                No mocks yet —{" "}
                <Link href="/interview" className="font-semibold text-[var(--accent)]">
                  try step 2
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
                  <span className="font-semibold">
                    {i.scorecard ? `${i.scorecard.overall}/100` : i.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
