"use client";

import { useMemo, useState } from "react";
import { INTERVIEW_MODES } from "@/lib/content";
import { getPracticeHint, pickPracticeQuestion } from "@/lib/interview/practice";
import type { InterviewMode } from "@/lib/types";

export function PracticePanel({
  mode,
  onExit,
  onStartAssessment,
}: {
  mode: InterviewMode;
  onExit: () => void;
  /** Transitions into the existing Assess flow for this same mode (may open HR warm-up). */
  onStartAssessment: () => void;
}) {
  const label = INTERVIEW_MODES.find((m) => m.id === mode)?.label ?? mode;
  const [seen, setSeen] = useState<string[]>([]);
  const [question, setQuestion] = useState(() => pickPracticeQuestion(mode));
  const [hintVisible, setHintVisible] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);

  const hint = useMemo(
    () => getPracticeHint(mode, hintIndex),
    [mode, hintIndex],
  );

  function nextQuestion() {
    const exclude = [...seen, question];
    const next = pickPracticeQuestion(mode, exclude);
    setSeen(exclude.slice(-12));
    setQuestion(next);
    setHintVisible(false);
    setHintIndex((i) => i + 1);
  }

  return (
    <div className="panel max-w-2xl rounded-[1.5rem] p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[var(--sand-2)] px-3 py-1 text-xs font-semibold tracking-wide uppercase">
          Practice
        </span>
        <span className="text-xs text-[var(--ink-soft)]">{label}</span>
      </div>
      <p className="mt-3 text-sm text-[var(--ink-soft)]">
        Untimed · No score · No assessment attempt used. Learn and improve without
        affecting Placement Readiness.
      </p>

      <div className="mt-5 rounded-2xl border border-[var(--line)] bg-white/70 p-4">
        <p className="text-xs font-semibold tracking-wide text-[var(--accent)] uppercase">
          Practice question
        </p>
        <p className="mt-2 text-sm font-medium leading-relaxed">{question}</p>
      </div>

      {hintVisible ? (
        <div className="mt-4 rounded-2xl border border-dashed border-[var(--accent)]/40 bg-[var(--accent)]/5 p-4">
          <p className="text-xs font-semibold tracking-wide text-[var(--accent)] uppercase">
            Hint
          </p>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">{hint}</p>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary text-sm" onClick={onStartAssessment}>
          Start Assessment
        </button>
        {!hintVisible ? (
          <button
            type="button"
            className="btn btn-ghost text-sm"
            onClick={() => setHintVisible(true)}
          >
            Show hint
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-ghost text-sm"
            onClick={() => setHintIndex((i) => i + 1)}
          >
            Another hint
          </button>
        )}
        <button type="button" className="btn btn-accent text-sm" onClick={nextQuestion}>
          Keep practicing
        </button>
        <button type="button" className="btn btn-ghost text-sm" onClick={onExit}>
          Exit practice
        </button>
      </div>
    </div>
  );
}
