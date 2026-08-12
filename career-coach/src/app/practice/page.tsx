"use client";

import { useMemo, useState } from "react";
import { AppShellClient } from "@/components/AppShellClient";
import { APTITUDE_BANK } from "@/lib/aptitude";

export default function PracticePage() {
  const questions = useMemo(() => [...APTITUDE_BANK].sort(() => Math.random() - 0.5).slice(0, 8), []);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[idx];

  function choose(optionIdx: number) {
    if (picked !== null || done) return;
    setPicked(optionIdx);
    if (optionIdx === q.answer) setScore((s) => s + 1);
  }

  function next() {
    if (idx + 1 >= questions.length) {
      setDone(true);
      return;
    }
    setIdx((i) => i + 1);
    setPicked(null);
  }

  return (
    <AppShellClient title="Aptitude drill">
      <p className="max-w-2xl text-sm text-[var(--ink-soft)]">
        Timed-style practice for campus aptitude rounds — quant, logical, and verbal. Review explanations
        after each question.
      </p>

      {done ? (
        <div className="panel mt-6 max-w-xl rounded-[1.5rem] p-6">
          <p className="text-sm font-semibold text-[var(--accent)]">Drill complete</p>
          <p className="display mt-2 text-5xl font-semibold">
            {score}/{questions.length}
          </p>
          <p className="mt-3 text-sm text-[var(--ink-soft)]">
            Next: revise weak topics in Learn → Aptitude track, then try a live Aptitude mock interview.
          </p>
          <button
            className="btn btn-accent mt-5 text-sm"
            onClick={() => {
              window.location.reload();
            }}
          >
            New drill
          </button>
        </div>
      ) : (
        <div className="panel mt-6 max-w-2xl rounded-[1.5rem] p-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold uppercase tracking-wide text-[var(--accent)]">{q.topic}</span>
            <span>
              Q{idx + 1}/{questions.length} · Score {score}
            </span>
          </div>
          <p className="mt-4 text-lg font-medium">{q.q}</p>
          <div className="mt-4 space-y-2">
            {q.options.map((opt, i) => (
              <button
                key={opt}
                className={`block w-full rounded-xl border px-4 py-3 text-left text-sm ${
                  picked === null
                    ? "border-[var(--line)] bg-white/70"
                    : i === q.answer
                      ? "border-[var(--accent)] bg-[var(--accent)]/10"
                      : picked === i
                        ? "border-[var(--accent-2)] bg-[var(--accent-2)]/10"
                        : "border-[var(--line)] bg-white/40 opacity-70"
                }`}
                onClick={() => choose(i)}
              >
                {opt}
              </button>
            ))}
          </div>
          {picked !== null ? (
            <div className="mt-4">
              <p className="text-sm text-[var(--ink-soft)]">{q.explain}</p>
              <button className="btn btn-primary mt-4 text-sm" onClick={next}>
                {idx + 1 >= questions.length ? "See results" : "Next question"}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </AppShellClient>
  );
}
