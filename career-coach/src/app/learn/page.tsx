import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { TRACKS, totalLessonCount } from "@/lib/content";

export default async function LearnPage() {
  return (
    <AppShell title="Learning tracks">
      <p className="max-w-2xl text-[var(--ink-soft)]">
        Three campus-to-corporate tracks — GenAI, Coding/Technical, and Aptitude — with{" "}
        {totalLessonCount()} lessons and quizzes. Pair this with mock interviews and the aptitude drill.
      </p>

      <div className="mt-4">
        <Link href="/practice" className="btn btn-accent text-sm">
          Timed aptitude drill →
        </Link>
      </div>

      <div className="mt-8 space-y-10">
        {TRACKS.map((track) => (
          <section key={track.slug}>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                  {track.tag} · {track.lessons.length} lessons
                </p>
                <h2 className="display text-3xl font-semibold">{track.title}</h2>
                <p className="mt-2 max-w-2xl text-sm text-[var(--ink-soft)]">{track.description}</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {track.lessons.map((lesson, idx) => (
                <Link
                  key={lesson.slug}
                  href={`/learn/${lesson.slug}`}
                  className="panel rounded-[1.5rem] p-5 transition hover:-translate-y-0.5"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                    Lesson {idx + 1} · {lesson.minutes} min
                  </p>
                  <h3 className="display mt-2 text-2xl font-semibold">{lesson.title}</h3>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">{lesson.summary}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
