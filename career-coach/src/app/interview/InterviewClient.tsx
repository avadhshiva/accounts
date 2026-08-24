"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShellClient } from "@/components/AppShellClient";
import { HrWarmUp } from "@/components/interview/HrWarmUp";
import { PracticePanel } from "@/components/interview/PracticePanel";
import { INTERVIEW_MODES } from "@/lib/content";
import { normalizeFocusAreas } from "@/lib/interview/focus";
import {
  parseInterviewIntentParam,
  type InterviewIntent,
} from "@/lib/interview/intent";
import { parseInterviewModeParam } from "@/lib/interview/mode";
import {
  isSetupAssessCtaEnabled,
  isSetupPracticeCtaEnabled,
  setupStartIntent,
} from "@/lib/interview/setupCta";
import type { InterviewMode } from "@/lib/types";

type Msg = { role: "coach" | "user"; content: string };
type Session = {
  id: string;
  mode: InterviewMode;
  status: string;
  messages: Msg[];
  scorecard?: {
    overall: number;
    communication: number;
    clarity: number;
    depth: number;
    feedback: string;
    improvements: string[];
  };
};

type Phase = "setup" | "practice" | "hr-warmup" | "session";

export default function InterviewClient() {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  const intentParam = searchParams.get("intent");
  const modeFromUrl = parseInterviewModeParam(modeParam);
  const intentFromUrl = parseInterviewIntentParam(intentParam);

  const [mode, setMode] = useState<InterviewMode>(modeFromUrl);
  const [intent, setIntent] = useState<InterviewIntent | null>(intentFromUrl);
  const [trackedModeParam, setTrackedModeParam] = useState(modeParam);
  const [trackedIntentParam, setTrackedIntentParam] = useState(intentParam);
  const [phase, setPhase] = useState<Phase>("setup");
  const [session, setSession] = useState<Session | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  /** Change 14: once-per-deep-link Practice auto-enter key (mode|practice). */
  const [autoEnteredPracticeKey, setAutoEnteredPracticeKey] = useState<string | null>(null);
  /** Change 15: mode-specific Focus areas (scorecard improvements). */
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  /** Mode for which focusAreas is already resolved (including empty = generic). */
  const [focusForMode, setFocusForMode] = useState<InterviewMode | null>(null);
  const [assessQuota, setAssessQuota] = useState<{
    used: number;
    limit: number;
    canStart: boolean;
  } | null>(null);

  // Sync from Change 7 deep-link URL changes while on setup (React render-time adjust).
  if (!session && phase === "setup") {
    if (modeParam !== trackedModeParam) {
      setTrackedModeParam(modeParam);
      setMode(modeFromUrl);
    }
    if (intentParam !== trackedIntentParam) {
      setTrackedIntentParam(intentParam);
      setIntent(intentFromUrl);
    }
  }

  // Change 14: ?intent=practice lands in free Practice for the selected track (no mock start).
  // Do NOT auto-start Assess from ?intent=assess (C13 / setup confirmation preserved).
  if (!session && phase === "setup" && intentFromUrl === "practice") {
    const key = `${modeFromUrl}|practice`;
    if (autoEnteredPracticeKey !== key) {
      setAutoEnteredPracticeKey(key);
      setIntent("practice");
      setError("");
      setPhase("practice");
    }
  }

  // Change 15: when Practice has no in-memory Focus for this mode, load latest completed by mode.
  useEffect(() => {
    if (phase !== "practice") return;
    if (focusForMode === mode) return;

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/interview/latest-focus?mode=${encodeURIComponent(mode)}`);
        const data = (await res.json()) as { improvements?: string[] };
        if (cancelled) return;
        if (res.ok) {
          setFocusAreas(normalizeFocusAreas(data.improvements));
        } else {
          setFocusAreas([]);
        }
        setFocusForMode(mode);
      } catch {
        if (cancelled) return;
        setFocusAreas([]);
        setFocusForMode(mode);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [phase, mode, focusForMode]);

  // Per-category assessment quota for setup screen (practice does not consume attempts).
  useEffect(() => {
    if (phase !== "setup") return;

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/interview/assessment-quota?mode=${encodeURIComponent(mode)}`,
        );
        const data = (await res.json()) as {
          used?: number;
          limit?: number;
          canStart?: boolean;
        };
        if (cancelled) return;
        if (res.ok) {
          setAssessQuota({
            used: data.used ?? 0,
            limit: data.limit ?? 2,
            canStart: Boolean(data.canStart),
          });
        } else {
          setAssessQuota(null);
        }
      } catch {
        if (!cancelled) setAssessQuota(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [phase, mode]);

  async function startAssessment() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/interview/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not start");
      setPhase("setup");
      return;
    }
    setSession(data.session);
    setPhase("session");
  }

  function beginAssess() {
    setError("");
    if (mode === "hr") {
      setPhase("hr-warmup");
      return;
    }
    void startAssessment();
  }

  function beginPractice() {
    setError("");
    setPhase("practice");
  }

  function clearPracticeFocus() {
    setFocusAreas([]);
    setFocusForMode(null);
  }

  async function send(finish = false) {
    if (!session || (!message.trim() && !finish)) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/interview/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: session.id,
        message: message.trim() || "Please wrap up and score me.",
        finish,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setSession(data.session);
    setMessage("");
  }

  const selected = INTERVIEW_MODES.find((m) => m.id === mode);

  return (
    <AppShellClient title="Mock Interview">
      {phase === "practice" ? (
        <PracticePanel
          mode={mode}
          focusAreas={focusAreas}
          onExit={() => {
            setPhase("setup");
            setIntent(null);
            clearPracticeFocus();
          }}
          onStartAssessment={() => {
            // Same-track Assess via existing beginAssess (HR still opens warm-up).
            setIntent("assess");
            beginAssess();
          }}
        />
      ) : null}

      {phase === "hr-warmup" ? (
        <HrWarmUp
          onSkip={() => {
            void startAssessment();
          }}
          onContinueToAssessment={() => {
            void startAssessment();
          }}
        />
      ) : null}

      {phase === "setup" && !session ? (
        <div className="panel max-w-2xl rounded-[1.5rem] p-6">
          <p className="text-sm text-[var(--ink-soft)]">
            Pick a round that matches campus drives — technical coding, aptitude, HR, or GenAI.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {INTERVIEW_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`rounded-2xl border p-4 text-left transition ${
                  mode === m.id
                    ? "border-[var(--accent)] bg-[var(--accent)]/10"
                    : "border-[var(--line)] bg-white/70 hover:border-[var(--accent)]/40"
                }`}
                onClick={() => setMode(m.id)}
              >
                <p className="font-semibold">{m.label}</p>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">{m.blurb}</p>
              </button>
            ))}
          </div>
          {selected ? (
            <p className="mt-4 text-sm text-[var(--ink-soft)]">
              Selected: <span className="font-semibold text-[var(--ink)]">{selected.label}</span>
            </p>
          ) : null}

          <p className="mt-6 text-sm font-semibold">How do you want to prepare?</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              className={`rounded-2xl border p-4 text-left transition ${
                intent === "practice"
                  ? "border-[var(--accent)] bg-[var(--accent)]/10"
                  : "border-[var(--line)] bg-white/70 hover:border-[var(--accent)]/40"
              }`}
              onClick={() => setIntent("practice")}
            >
              <p className="font-semibold">Practice Mode</p>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">
                Untimed · Hints · No score · No assessment attempt used
              </p>
              <p className="mt-2 text-xs text-[var(--ink-soft)]">
                Practice without using an assessment attempt.
              </p>
            </button>
            <button
              type="button"
              className={`rounded-2xl border p-4 text-left transition ${
                intent === "assess"
                  ? "border-[var(--ink)] bg-[#e8eef4]/90"
                  : "border-[var(--line)] bg-white/70 hover:border-[var(--ink)]/30"
              }`}
              onClick={() => setIntent("assess")}
            >
              <p className="font-semibold">Assess Mode</p>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">
                Scored · Counts toward readiness · Uses one assessment attempt
              </p>
              <p className="mt-2 text-xs text-[var(--ink-soft)]">
                Take a scored assessment that contributes to your readiness.
              </p>
            </button>
          </div>

          {assessQuota && !assessQuota.canStart ? (
            <p className="mt-3 text-sm text-[var(--ink-soft)]">
              Assessment limit reached — {assessQuota.used}/{assessQuota.limit} attempts used.
              Practice is still unlimited for this track.
            </p>
          ) : null}

          {error ? <p className="mt-3 text-sm text-[var(--accent-2)]">{error}</p> : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-accent"
              disabled={!isSetupPracticeCtaEnabled(loading)}
              onClick={() => {
                // CTA click decides intent (do not leave Start practice inert when Assess card is selected).
                setIntent(setupStartIntent("start-practice"));
                // Clear prior Focus so effect can load latest for the selected mode.
                clearPracticeFocus();
                beginPractice();
              }}
            >
              Start practice
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!isSetupAssessCtaEnabled(loading, assessQuota?.canStart ?? true)}
              onClick={() => {
                setIntent(setupStartIntent("start-assess"));
                beginAssess();
              }}
            >
              {loading
                ? "Starting..."
                : mode === "hr"
                  ? "Continue to HR Assessment"
                  : "Start assessment"}
            </button>
          </div>
        </div>
      ) : null}

      {phase === "session" && session ? (
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="panel rounded-[1.5rem] p-5">
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="font-semibold tracking-wide text-[var(--accent)] uppercase">
                {session.mode}
              </span>
              <span className="capitalize">{session.status}</span>
            </div>
            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {session.messages.map((m, i) => (
                <div
                  key={i}
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    m.role === "coach" ? "bg-white/80" : "bg-[var(--accent)]/10 ml-8"
                  }`}
                >
                  <p className="mb-1 text-xs font-semibold uppercase opacity-60">{m.role}</p>
                  <p>{m.content}</p>
                </div>
              ))}
            </div>
            {session.status === "active" ? (
              <div className="mt-4 space-y-3">
                <textarea
                  className="input min-h-[100px]"
                  placeholder="Type your answer / working..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                {error ? <p className="text-sm text-[var(--accent-2)]">{error}</p> : null}
                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn btn-accent text-sm"
                    disabled={loading || !message.trim()}
                    onClick={() => send(false)}
                  >
                    {loading ? "Sending..." : "Send answer"}
                  </button>
                  <button className="btn btn-ghost text-sm" disabled={loading} onClick={() => send(true)}>
                    Finish & score
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="btn btn-ghost mt-4 text-sm"
                onClick={() => {
                  setSession(null);
                  setPhase("setup");
                  setIntent(null);
                }}
              >
                New interview
              </button>
            )}
          </div>
          <div className="panel rounded-[1.5rem] p-5">
            <h2 className="display text-2xl font-semibold">Scorecard</h2>
            {!session.scorecard ? (
              <p className="mt-3 text-sm text-[var(--ink-soft)]">
                Complete ~4 answers or click Finish to get scores.
              </p>
            ) : (
              <div className="mt-4 space-y-3 text-sm">
                <p className="display text-5xl font-semibold">{session.scorecard.overall}</p>
                <p>Communication: {session.scorecard.communication}</p>
                <p>Clarity: {session.scorecard.clarity}</p>
                <p>Depth: {session.scorecard.depth}</p>
                <p className="text-[var(--ink-soft)]">{session.scorecard.feedback}</p>
                <ul className="list-disc pl-5 text-[var(--ink-soft)]">
                  {session.scorecard.improvements.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-primary text-sm"
                    onClick={() => {
                      // Change 14/15: Assess → free same-track Practice with Focus (no interview start fetch).
                      const nextFocus = normalizeFocusAreas(session.scorecard?.improvements);
                      setFocusAreas(nextFocus);
                      setFocusForMode(session.mode);
                      setSession(null);
                      setMessage("");
                      setError("");
                      setIntent("practice");
                      beginPractice();
                    }}
                  >
                    Practice this track
                  </button>
                  <Link href="/dashboard" className="btn btn-accent text-sm inline-flex">
                    View Placement Mission →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </AppShellClient>
  );
}
