import Link from "next/link";
import { getSessionUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getSessionUser();

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" className="display text-2xl font-semibold tracking-tight">
          Pathly
        </Link>
        <nav className="flex items-center gap-3 text-sm font-medium">
          <Link href="/#features" className="hidden sm:inline opacity-80 hover:opacity-100">
            Features
          </Link>
          <Link href="/learn" className="hidden sm:inline opacity-80 hover:opacity-100">
            Learn
          </Link>
          {user ? (
            <Link href="/dashboard" className="btn btn-primary text-sm">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost text-sm">
                Log in
              </Link>
              <Link href="/signup" className="btn btn-primary text-sm">
                Start free
              </Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="relative mx-auto grid max-w-6xl gap-10 px-5 pb-20 pt-8 md:grid-cols-[1.15fr_0.85fr] md:pt-14">
          <div className="fade-up">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Campus → Corporate
            </p>
            <h1 className="display max-w-xl text-5xl leading-[1.05] font-semibold text-[var(--ink)] md:text-6xl">
              Pathly
            </h1>
            <p className="mt-3 max-w-xl text-xl text-[var(--ink-soft)] md:text-2xl">
              AI career coach for resumes, technical interviews, aptitude, and GenAI job readiness.
            </p>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-[var(--ink-soft)]/90">
              Built for Indian engineering students who need practice that feels like a real hiring loop — not generic ChatGPT chats.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={user ? "/dashboard" : "/signup"} className="btn btn-accent">
                {user ? "Continue prep" : "Try free ATS score"}
              </Link>
              <Link href="/interview" className="btn btn-ghost">
                Start mock interview
              </Link>
            </div>
            <p className="mt-4 text-sm text-[var(--ink-soft)]/70">
              Signup includes a 30-min trial · then unlock with invite (pilot) or ₹500
            </p>
          </div>

          <div className="panel fade-up relative overflow-hidden rounded-[2rem] p-6 shadow-[0_30px_80px_rgba(15,28,46,0.08)] md:p-8">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--accent)]/15 blur-2xl" />
            <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-[var(--accent-2)]/20 blur-2xl" />
            <p className="text-sm font-semibold text-[var(--accent)]">Today&apos;s readiness</p>
            <div className="mt-4 flex items-end gap-3">
              <span className="display text-6xl font-semibold">78</span>
              <span className="mb-2 text-sm text-[var(--ink-soft)]">/ 100 practice score</span>
            </div>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Resume score + rewrite suggestions",
                "Technical, Aptitude, HR & GenAI mocks",
                "3 learning tracks + aptitude drills",
              ].map((item) => (
                <li key={item} className="flex gap-2 rounded-2xl bg-white/70 px-3 py-3 border border-[var(--line)]">
                  <span className="mt-0.5 text-[var(--accent)]">▸</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-5 pb-24">
          <h2 className="display text-3xl font-semibold md:text-4xl">One job: get you interview-ready</h2>
          <p className="mt-3 max-w-2xl text-[var(--ink-soft)]">
            Built for campus placement loops — resume, coding/technical rounds, aptitude, and GenAI literacy.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Resume Studio",
                body: "ATS-style score, gaps, and rewritten bullets for fresher roles.",
                href: "/resume",
              },
              {
                title: "Mock Interviews",
                body: "Technical/Coding, Aptitude, HR, and GenAI rounds with scorecards.",
                href: "/interview",
              },
              {
                title: "Learning Roadmaps",
                body: "Visual paths for GenAI, Technical, and Aptitude — click nodes, see diagrams, track progress.",
                href: "/learn",
              },
              {
                title: "Aptitude Drill",
                body: "Timed-style MCQs with explanations for campus aptitude tests.",
                href: "/practice",
              },
            ].map((f, i) => (
              <Link
                key={f.title}
                href={f.href}
                className="panel rounded-[1.5rem] p-6 transition hover:-translate-y-1"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <h3 className="display text-2xl font-semibold">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">{f.body}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--line)] px-5 py-8 text-sm text-[var(--ink-soft)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Pathly · Practice tool, not a placement guarantee.</p>
          <div className="flex gap-4">
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/refund">Refunds</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
