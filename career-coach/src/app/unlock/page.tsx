"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatRemaining } from "@/lib/access";

type Access = {
  allowed: boolean;
  remainingLabel: string;
  remainingMs: number;
  priceInr: number;
  access: string;
  reason: string;
  pilotMode: boolean;
  trialHours: number;
};

export default function UnlockPage() {
  const router = useRouter();
  const [access, setAccess] = useState<Access | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/access/status")
      .then(async (r) => {
        if (r.status === 401) {
          router.replace("/signup");
          return;
        }
        const data = await r.json();
        setAccess(data.access);
      })
      .catch(() => setError("Could not load trial status"));
  }, [router]);

  useEffect(() => {
    if (!access?.allowed || access.access !== "trial") return;
    const timer = setInterval(() => {
      setAccess((prev) => {
        if (!prev) return prev;
        const remainingMs = Math.max(0, prev.remainingMs - 1000);
        return {
          ...prev,
          remainingMs,
          remainingLabel: formatRemaining(remainingMs),
          allowed: remainingMs > 0,
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [access?.allowed, access?.access]);

  const pilot = access?.pilotMode !== false;
  const hours = access?.trialHours ?? 48;

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
                Full access is active. Keep exploring — and send feedback anytime so we improve Pathly for
                students like you.
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
            {access && !access.allowed ? "Your pilot trial has ended" : "You’re on a pilot trial"}
          </h1>
          <p className="mt-3 text-lg text-[var(--ink-soft)]">
            {access && !access.allowed
              ? "Thanks for exploring Pathly. Your feedback will shape what we build next — and help us serve students like you better."
              : `You have ${hours} hours to explore freely. No payment for this pilot. Try resume, interviews, roadmaps, and aptitude — then tell us what helped and what didn’t.`}
          </p>

          <div className="panel mt-6 rounded-[1.75rem] p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
              {access && !access.allowed ? "Trial status" : "Trial ends in"}
            </p>
            <p className="display mt-2 text-5xl font-semibold">
              {access?.remainingLabel ?? "…"}
            </p>
            <p className="mt-3 text-sm text-[var(--ink-soft)]">
              Feel free to explore every feature. Honest feedback from early students is more valuable than
              a rushed payment screen.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/feedback" className="btn btn-accent flex-1">
              Share feedback
            </Link>
            {access?.allowed ? (
              <Link href="/dashboard" className="btn btn-primary flex-1">
                Continue exploring
              </Link>
            ) : (
              <Link href="/feedback" className="btn btn-primary flex-1">
                2-minute feedback form
              </Link>
            )}
          </div>

          <p className="mt-6 text-sm text-[var(--ink-soft)]">
            Payments (₹500 unlock) will come after this feedback round — not now.
          </p>
            </>
          )}
        </>
      ) : (
        <>
          <h1 className="display mt-8 text-4xl font-semibold">Unlock full access</h1>
          <p className="mt-3 text-[var(--ink-soft)]">
            Payment options will appear here when pilot mode is turned off.
          </p>
          <Link href="/feedback" className="btn btn-accent mt-6 inline-flex">
            Share feedback meanwhile
          </Link>
        </>
      )}

      {error ? <p className="mt-4 text-sm text-[var(--accent-2)]">{error}</p> : null}

      <Link href="/dashboard" className="btn btn-ghost mt-8 inline-flex text-sm">
        ← Back to dashboard
      </Link>
    </div>
  );
}
