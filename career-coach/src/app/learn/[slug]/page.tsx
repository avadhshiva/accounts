"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AppShellClient } from "@/components/AppShellClient";
import { getLesson, TRACK } from "@/lib/content";

export default function LessonPage() {
  const params = useParams<{ slug: string }>();
  const lesson = useMemo(() => getLesson(params.slug), [params.slug]);
  const [picked, setPicked] = useState<number | null>(null);

  if (!lesson) {
    return (
      <AppShellClient title="Lesson not found">
        <Link href="/learn" className="btn btn-ghost text-sm">
          Back to track
        </Link>
      </AppShellClient>
    );
  }

  const quiz = lesson.quiz[0];
  const correct = picked !== null && picked === quiz.answer;

  return (
    <AppShellClient title={lesson.title}>
      <p className="text-sm text-[var(--accent)]">
        {TRACK.title} · {lesson.minutes} min
      </p>
      <div className="panel mt-5 max-w-3xl space-y-4 rounded-[1.5rem] p-6">
        {lesson.body.map((p) => (
          <p key={p} className="leading-relaxed text-[var(--ink-soft)]">
            {p}
          </p>
        ))}
      </div>

      <div className="panel mt-5 max-w-3xl rounded-[1.5rem] p-6">
        <h2 className="display text-2xl font-semibold">Quick check</h2>
        <p className="mt-2 font-medium">{quiz.q}</p>
        <div className="mt-4 space-y-2">
          {quiz.options.map((opt, idx) => (
            <button
              key={opt}
              className={`block w-full rounded-xl border px-4 py-3 text-left text-sm ${
                picked === idx
                  ? idx === quiz.answer
                    ? "border-[var(--accent)] bg-[var(--accent)]/10"
                    : "border-[var(--accent-2)] bg-[var(--accent-2)]/10"
                  : "border-[var(--line)] bg-white/70"
              }`}
              onClick={() => setPicked(idx)}
            >
              {opt}
            </button>
          ))}
        </div>
        {picked !== null ? (
          <p className="mt-3 text-sm font-medium">
            {correct ? "Correct — nice." : "Not quite — review the lesson and retry."}
          </p>
        ) : null}
      </div>

      <Link href="/learn" className="btn btn-ghost mt-6 inline-flex text-sm">
        ← All lessons
      </Link>
    </AppShellClient>
  );
}
