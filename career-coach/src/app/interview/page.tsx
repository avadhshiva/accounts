"use client";

import { useState } from "react";
import { AppShellClient } from "@/components/AppShellClient";

type Msg = { role: "coach" | "user"; content: string };
type Session = {
  id: string;
  mode: "hr" | "genai" | "sde";
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

export default function InterviewPage() {
  const [mode, setMode] = useState<"hr" | "genai" | "sde">("hr");
  const [session, setSession] = useState<Session | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <AppShellClient title="Mock Interview">
      {!session ? (
        <div className="panel max-w-xl rounded-[1.5rem] p-6">
          <p className="text-sm text-[var(--ink-soft)]">Pick a round and answer like a real interview.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(
              [
                ["hr", "HR Behavioural"],
                ["genai", "GenAI Concepts"],
                ["sde", "SDE Fundamentals"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                className={`btn text-sm ${mode === value ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setMode(value)}
              >
                {label}
              </button>
            ))}
          </div>
          {error ? <p className="mt-3 text-sm text-[var(--accent-2)]">{error}</p> : null}
          <button className="btn btn-accent mt-5" onClick={start} disabled={loading}>
            {loading ? "Starting..." : "Start interview"}
          </button>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="panel rounded-[1.5rem] p-5">
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="uppercase font-semibold tracking-wide text-[var(--accent)]">{session.mode}</span>
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
                  placeholder="Type your answer..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                {error ? <p className="text-sm text-[var(--accent-2)]">{error}</p> : null}
                <div className="flex flex-wrap gap-2">
                  <button className="btn btn-accent text-sm" disabled={loading || !message.trim()} onClick={() => send(false)}>
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
