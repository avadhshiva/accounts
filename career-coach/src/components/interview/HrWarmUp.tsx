"use client";

import { useEffect, useState } from "react";

const WARMUP_SECONDS = 60;

export function HrWarmUp({
  onSkip,
  onContinueToAssessment,
}: {
  onSkip: () => void;
  onContinueToAssessment: () => void;
}) {
  const [started, setStarted] = useState(false);
  const [remaining, setRemaining] = useState(WARMUP_SECONDS);
  const finished = started && remaining <= 0;

  useEffect(() => {
    if (!started || remaining <= 0) return;
    const id = window.setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => window.clearTimeout(id);
  }, [started, remaining]);

  return (
    <div className="panel max-w-2xl rounded-[1.5rem] p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[var(--sand-2)] px-3 py-1 text-xs font-semibold tracking-wide uppercase">
          Optional warm-up
        </span>
        <span className="text-xs text-[var(--ink-soft)]">Does not use an assessment attempt</span>
      </div>

      <h2 className="display mt-4 text-2xl font-semibold">HR Warm-Up</h2>
      <p className="mt-2 text-sm text-[var(--ink-soft)]">
        Take up to 60 seconds to organize your thoughts before starting the assessment.
        Speak out loud if you like — nothing is recorded.
      </p>

      <div className="mt-5 rounded-2xl border border-[var(--line)] bg-white/70 p-4">
        <p className="text-xs font-semibold tracking-wide text-[var(--accent)] uppercase">
          Prompt
        </p>
        <p className="mt-2 text-lg font-semibold">Tell me about yourself.</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--ink-soft)]">
          <li>Who you are</li>
          <li>Your education / experience</li>
          <li>Relevant strengths or skills</li>
          <li>Why you are interested in the role</li>
        </ul>
      </div>

      {started ? (
        <p className="mt-5 font-semibold tabular-nums">
          {finished ? <span>Warm-up complete</span> : <span>{remaining}s remaining</span>}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {!started ? (
          <>
            <button
              type="button"
              className="btn btn-accent text-sm"
              onClick={() => {
                setStarted(true);
                setRemaining(WARMUP_SECONDS);
              }}
            >
              Start 60-Second Warm-Up
            </button>
            <button type="button" className="btn btn-ghost text-sm" onClick={onSkip}>
              Skip Warm-Up
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-accent text-sm"
              onClick={onContinueToAssessment}
            >
              Start HR Assessment
            </button>
            {!finished ? (
              <button type="button" className="btn btn-ghost text-sm" onClick={onSkip}>
                Skip Warm-Up
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
