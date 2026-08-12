import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getSessionUser } from "@/lib/auth";
import { readDb } from "@/lib/store";
import { TRACKS, totalLessonCount } from "@/lib/content";
import { LIMITS } from "@/lib/limits";
import { redirect } from "next/navigation";
import { EnableProButton } from "@/components/EnableProButton";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const db = await readDb();
  const resumes = db.resumes.filter((r) => r.userId === user.id).slice(0, 3);
  const interviews = db.interviews.filter((i) => i.userId === user.id).slice(0, 3);

  return (
    <AppShell title={`Hi ${user.name.split(" ")[0]}, let’s prep`}>
      <div className="grid gap-5 md:grid-cols-3">
        <div className="panel rounded-[1.5rem] p-5 md:col-span-2">
          <p className="text-sm font-semibold text-[var(--accent)]">Your plan</p>
          <p className="mt-2 display text-3xl font-semibold capitalize">{user.plan}</p>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Resume analyses: {user.usage.resumeAnalyses}/{LIMITS[user.plan].resumeAnalyses} · Mock
            interviews: {user.usage.mockInterviews}/{LIMITS[user.plan].mockInterviews} this month
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/resume" className="btn btn-accent text-sm">
              Score a resume
            </Link>
            <Link href="/interview" className="btn btn-primary text-sm">
              Start interview
            </Link>
            <Link href="/learn" className="btn btn-ghost text-sm">
              Learning tracks
            </Link>
            <Link href="/practice" className="btn btn-ghost text-sm">
              Aptitude drill
            </Link>
          </div>
          {user.plan === "free" || user.access === "trial" ? (
            <div className="mt-5 rounded-2xl border border-dashed border-[var(--line)] bg-white/60 p-4 text-sm">
              <p className="font-medium">Trial / pilot unlock</p>
              <p className="mt-1 text-[var(--ink-soft)]">
                Free use is timed (30 min). After that open Unlock — invite code for feedback students, or ₹500
                payment when enabled.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/unlock" className="btn btn-accent text-sm">
                  Open unlock
                </Link>
                <EnableProButton />
              </div>
            </div>
          ) : null}
        </div>
        <div className="panel rounded-[1.5rem] p-5">
          <p className="text-sm font-semibold text-[var(--accent)]">Target</p>
          <p className="mt-2 text-xl font-semibold">{user.targetRole || "SDE Fresher"}</p>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">{user.college || "College not set"}</p>
          <p className="mt-6 text-sm text-[var(--ink-soft)]">
            {TRACKS.length} tracks · {totalLessonCount()} lessons · Technical + Aptitude mocks
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <section className="panel rounded-[1.5rem] p-5">
          <h2 className="display text-2xl font-semibold">Recent resume scores</h2>
          <div className="mt-4 space-y-3">
            {resumes.length === 0 ? (
              <p className="text-sm text-[var(--ink-soft)]">No analyses yet.</p>
            ) : (
              resumes.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-3 text-sm">
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
              <p className="text-sm text-[var(--ink-soft)]">No mocks yet.</p>
            ) : (
              interviews.map((i) => (
                <div key={i.id} className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-3 text-sm">
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
