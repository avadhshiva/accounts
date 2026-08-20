"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShellClient } from "@/components/AppShellClient";
import { INTERVIEW_MODES } from "@/lib/content";
import { parseInterviewModeParam } from "@/lib/interview/mode";
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

export default function InterviewClient() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<InterviewMode>(() =>
    parseInterviewModeParam(searchParams.get("mode")),
  );
  const [session, setSession] = useState<Session | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session) return;
    setMode(parseInterviewModeParam(searchParams.get("mode")));
  }, [searchParams, session]);

  async function start() {
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
      return;
    }
    setSession(data.session);
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
      {!session ? (
        <div className="panel max-w-2xl rounded-[1.5rem] p-6">
          <p className="text-sm text-[var(--ink-soft)]">
            Pick a round that matches campus drives — technical coding, aptitude, HR, or GenAI.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {INTERVIEW_MODES.map((m) => (
              <button
                key={m.id}
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
          {error ? <p className="mt-3 text-sm text-[var(--accent-2)]">{error}</p> : null}
          <button className="btn btn-accent mt-5" onClick={start} disabled={loading}>
            {loading ? "Starting..." : "Start interview"}
          </button>
        </div>
      ) : (
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
              <button className="btn btn-primary mt-4 text-sm" onClick={() => setSession(null)}>
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
              </div>
            )}
          </div>
        </div>
      )}
    </AppShellClient>
  );
}
