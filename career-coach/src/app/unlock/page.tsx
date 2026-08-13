"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatRemaining } from "@/lib/access";

type Access = {
  allowed: boolean;
  remainingLabel: string;
  remainingMs: number;
  access: string;
  reason: string;
  pilotMode: boolean;
  trialHours: number;
  trialStarted: boolean;
};

export default function UnlockPage() {
  const router = useRouter();
  const [access, setAccess] = useState<Access | null>(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  function loadStatus() {
    return fetch("/api/access/status")
      .then(async (r) => {
        if (r.status === 401) {
          router.replace("/signup");
          return;
        }
        const data = await r.json();
        setAccess(data.access);
      })
      .catch(() => setError("Could not load trial status"));
  }

  useEffect(() => {
    loadStatus();
  }, [router]);

  useEffect(() => {
    if (!access?.trialStarted || !access.allowed) return;
    const timer = setInterval(() => {
      setAccess((prev) => {
        if (!prev || !prev.trialStarted) return prev;
        const remainingMs = Math.max(0, prev.remainingMs - 1000);
        return {
          ...prev,
          remainingMs,
          remainingLabel: formatRemaining(remainingMs),
          allowed: remainingMs > 0,
          reason: remainingMs > 0 ? "ok" : "trial_expired",
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [access?.trialStarted, access?.allowed]);

  async function startTrial() {
    setStarting(true);
    setError("");
    const res = await fetch("/api/access/start-trial", { method: "POST" });
    const data = await res.json();
    setStarting(false);
    if (!res.ok) {
      setError(data.error || "Could not start trial");
      return;
    }
    setAccess(data.access);
    setTimeout(() => router.push("/dashboard"), 600);
  }

  const pilot = access?.pilotMode !== false;
  const hours = access?.trialHours ?? 168;
  const trialDays = Math.max(1, Math.round(hours / 24));
  const trialLabel = trialDays >= 2 ? `${trialDays}-day` : `${hours}-hour`;
  const notStarted = access?.reason === "trial_not_started";
  const expired = access?.reason === "trial_expired";
  const active = access?.trialStarted && access.allowed;

  const intro = `You have ${trialLabel} to explore freely. No payment for this pilot. Start with your resume score, then one mock interview — learn & aptitude when you have time. Tell us what helped and what didn’t.`;

  return (
    <div className="mx-auto min-h-screen max-w-xl px-5 py-10">
      <Link href="/" className="display text-2xl font-semibold">
        Pathly
      </Link>

      {pilot ? (
        <>
          {access && (access.access === "paid" || access.access === "invite") ? (
            <>
              <h1 className="display mt-8 text-4xl font-semibold">You’re all set</h1>
              <p className="mt-3 text-lg text-[var(--ink-soft)]">
                Full access is active. Keep exploring — and send feedback anytime.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/feedback" className="btn btn-accent flex-1">
                  Share feedback
                </Link>
                <Link href="/dashboard" className="btn btn-primary flex-1">
                  Go to dashboard
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="display mt-8 text-4xl font-semibold">
                {expired ? "Your pilot trial has ended" : "You’re on a pilot trial"}
              </h1>
              <p className="mt-3 text-lg text-[var(--ink-soft)]">
                {expired
                  ? "Thanks for exploring Pathly. Your feedback will shape what we build next — and help us serve students like you better."
                  : intro}
              </p>

              {notStarted ? (
                <div className="panel mt-6 rounded-[1.75rem] p-6 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                    Before you explore
                  </p>
                  <p className="mt-3 text-sm text-[var(--ink-soft)]">
                    Click below to start your <strong>{trialLabel}</strong> trial clock. Resume, Interview,
                    Learn, and Aptitude unlock after you start — not before.
                  </p>
                  <button
                    className="btn btn-accent mt-6 w-full text-base"
                    disabled={starting}
                    onClick={startTrial}
                  >
                    {starting ? "Starting…" : "Start trial timer"}
                  </button>
                </div>
              ) : (
                <div className="panel mt-6 rounded-[1.75rem] p-6 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                    {expired ? "Trial status" : "Trial ends in"}
                  </p>
                  <p className="display mt-2 text-5xl font-semibold tabular-nums">
                    {access?.remainingLabel ?? "…"}
                  </p>
                  <p className="mt-3 text-sm text-[var(--ink-soft)]">
                    Feel free to explore every feature. Honest feedback from early students is more valuable
                    than a rushed payment screen.
                  </p>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/feedback" className="btn btn-accent flex-1">
                  Share feedback
                </Link>
                {active ? (
                  <Link href="/dashboard" className="btn btn-primary flex-1">
                    Continue exploring
                  </Link>
                ) : expired ? (
                  <Link href="/feedback" className="btn btn-primary flex-1">
                    2-minute feedback form
                  </Link>
                ) : null}
              </div>

              {notStarted ? (
                <p className="mt-6 text-center text-sm text-[var(--ink-soft)]">
                  Other sections stay locked until you start the timer.
                </p>
              ) : (
                <p className="mt-6 text-sm text-[var(--ink-soft)]">
                  Payments (₹500 unlock) will come after this feedback round — not now.
                </p>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <h1 className="display mt-8 text-4xl font-semibold">Unlock full access</h1>
          <p className="mt-3 text-[var(--ink-soft)]">Payment options appear when pilot mode is off.</p>
        </>
      )}

      {error ? <p className="mt-4 text-sm text-[var(--accent-2)]">{error}</p> : null}

      {active ? (
        <Link href="/dashboard" className="btn btn-ghost mt-8 inline-flex text-sm">
          ← Back to dashboard
        </Link>
      ) : null}
    </div>
  );
}
