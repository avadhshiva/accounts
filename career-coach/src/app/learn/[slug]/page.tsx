"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShellClient } from "@/components/AppShellClient";
import { ConceptDiagram } from "@/components/ConceptDiagram";
import { getLesson } from "@/lib/content";
import { LESSON_META } from "@/lib/lessonMeta";
import {
  hydrateLearnProgress,
  markComplete,
  markIncomplete,
} from "@/lib/progress";

export default function LessonPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const found = useMemo(() => getLesson(params.slug), [params.slug]);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  useEffect(() => {
    hydrateLearnProgress().then((progress) => {
      setDone(progress.completed.includes(params.slug));
      setPicked(null);
      setChecked({});
    });
  }, [params.slug]);

  if (!found) {
    return (
      <AppShellClient title="Lesson not found">
        <Link href="/learn" className="btn btn-ghost text-sm">
          Back to roadmaps
        </Link>
      </AppShellClient>
    );
  }

  const { lesson, track } = found;
  const meta = LESSON_META[lesson.slug];
  const quiz = lesson.quiz[0];
  const correct = picked !== null && picked === quiz.answer;
  const idx = track.lessons.findIndex((l) => l.slug === lesson.slug);
  const prev = idx > 0 ? track.lessons[idx - 1] : null;
  const next = idx >= 0 && idx < track.lessons.length - 1 ? track.lessons[idx + 1] : null;

  return (
    <AppShellClient title={lesson.title}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--accent)]">
          {track.title} · Lesson {idx + 1}/{track.lessons.length} · {lesson.minutes} min
          {done ? " · Completed" : ""}
        </p>
        <Link href="/learn" className="btn btn-ghost px-3 py-1.5 text-xs">
          ← Roadmap
        </Link>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          {meta?.diagram ? <ConceptDiagram id={meta.diagram} /> : null}

          <div className="panel space-y-4 rounded-[1.5rem] p-6">
            <h2 className="display text-2xl font-semibold">Concept</h2>
            {lesson.body.map((p) => (
              <p key={p} className="leading-relaxed text-[var(--ink-soft)]">
                {p}
              </p>
            ))}
            {meta?.example ? (
              <div className="rounded-xl border border-dashed border-[var(--line)] bg-white/70 p-4 text-sm">
                <p className="font-semibold text-[var(--accent)]">Worked example</p>
                <p className="mt-1 text-[var(--ink-soft)]">{meta.example}</p>
              </div>
            ) : null}
          </div>

          <div className="panel rounded-[1.5rem] p-6">
            <h2 className="display text-2xl font-semibold">Quick check</h2>
            <p className="mt-2 font-medium">{quiz.q}</p>
            <div className="mt-4 space-y-2">
              {quiz.options.map((opt, i) => (
                <button
                  key={opt}
                  className={`block w-full rounded-xl border px-4 py-3 text-left text-sm ${
                    picked === i
                      ? i === quiz.answer
                        ? "border-[var(--accent)] bg-[var(--accent)]/10"
                        : "border-[var(--accent-2)] bg-[var(--accent-2)]/10"
                      : "border-[var(--line)] bg-white/70"
                  }`}
                  onClick={() => setPicked(i)}
                >
                  {opt}
                </button>
              ))}
            </div>
            {picked !== null ? (
              <div className="mt-3 text-sm">
                <p className="font-medium">
                  {correct ? "Correct — nice." : "Not quite — review the diagram and retry."}
                </p>
                {quiz.explain ? <p className="mt-1 text-[var(--ink-soft)]">{quiz.explain}</p> : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-5">
          {meta?.checklist?.length ? (
            <div className="panel rounded-[1.5rem] p-6">
              <h2 className="display text-2xl font-semibold">Can you do this?</h2>
              <ul className="mt-4 space-y-3">
                {meta.checklist.map((item, i) => (
                  <li key={item}>
                    <label className="flex cursor-pointer gap-3 text-sm">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={!!checked[i]}
                        onChange={(e) =>
                          setChecked((c) => ({ ...c, [i]: e.target.checked }))
                        }
                      />
                      <span>{item}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="panel rounded-[1.5rem] p-6">
            <h2 className="display text-2xl font-semibold">Progress</h2>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              Mark complete to advance your roadmap path for this track.
            </p>
            <button
              className={`btn mt-4 w-full text-sm ${done ? "btn-ghost" : "btn-accent"}`}
              onClick={() => {
                if (done) {
                  markIncomplete(lesson.slug);
                  setDone(false);
                } else {
                  markComplete(lesson.slug);
                  setDone(true);
                }
              }}
            >
              {done ? "Mark incomplete" : "Mark complete"}
            </button>
            <div className="mt-4 flex flex-wrap gap-2">
              {prev ? (
                <Link href={`/learn/${prev.slug}`} className="btn btn-ghost text-xs">
                  ← {prev.title}
                </Link>
              ) : null}
              {next ? (
                <button
                  className="btn btn-primary text-xs"
                  onClick={() => router.push(`/learn/${next.slug}`)}
                >
                  Next: {next.title} →
                </button>
              ) : (
                <Link href="/learn" className="btn btn-primary text-xs">
                  Back to roadmap →
                </Link>
              )}
            </div>
            {done ? (
              <Link href="/dashboard" className="btn btn-ghost mt-3 inline-flex w-full text-sm">
                View Placement Mission →
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </AppShellClient>
  );
}
