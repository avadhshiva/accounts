import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { TRACK } from "@/lib/content";

export default async function LearnPage() {
  return (
    <AppShell title={TRACK.title}>
      <p className="max-w-2xl text-[var(--ink-soft)]">{TRACK.description}</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {TRACK.lessons.map((lesson, idx) => (
          <Link
            key={lesson.slug}
            href={`/learn/${lesson.slug}`}
            className="panel rounded-[1.5rem] p-5 transition hover:-translate-y-0.5"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
              Lesson {idx + 1} · {lesson.minutes} min
            </p>
            <h2 className="display mt-2 text-2xl font-semibold">{lesson.title}</h2>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">{lesson.summary}</p>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
