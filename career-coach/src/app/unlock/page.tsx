"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Access = {
  allowed: boolean;
  remainingLabel: string;
  remainingMs: number;
  priceInr: number;
  access: string;
  reason: string;
};

export default function UnlockPage() {
  const router = useRouter();
  const [access, setAccess] = useState<Access | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [upiReference, setUpiReference] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const manualAllowed = true; // UI always shows; API may reject if env off

  useEffect(() => {
    fetch("/api/access/status")
      .then(async (r) => {
        if (r.status === 401) {
          router.replace("/signup");
          return;
        }
        const data = await r.json();
        setAccess(data.access);
        if (data.access?.allowed && data.access.access !== "trial") {
          // already unlocked
        }
      })
      .catch(() => setError("Could not load access status"));
  }, [router]);

  async function unlock(method: "invite" | "manual_upi", e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/access/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method,
        inviteCode,
        upiReference,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Unlock failed");
      return;
    }
    setMessage(data.message || "Unlocked");
    setAccess(data.access);
    setTimeout(() => router.push("/dashboard"), 800);
  }

  return (
    <div className="mx-auto min-h-screen max-w-xl px-5 py-10">
      <Link href="/" className="display text-2xl font-semibold">
        Pathly
      </Link>
      <h1 className="display mt-8 text-4xl font-semibold">Unlock full access</h1>
      <p className="mt-3 text-[var(--ink-soft)]">
        Free trial is {access?.priceInr ? "30 minutes" : "30 minutes"} after signup. Then continue with a
        one-time unlock of <strong>₹{access?.priceInr ?? 500}</strong>, or use a student invite code.
      </p>

      {access ? (
        <div className="panel mt-6 rounded-[1.5rem] p-5 text-sm">
          <p>
            Status: <strong className="capitalize">{access.access}</strong>
            {access.allowed ? " (active)" : " (trial ended)"}
          </p>
          {access.access === "trial" && access.allowed ? (
            <p className="mt-1 text-[var(--ink-soft)]">Trial time left: {access.remainingLabel}</p>
          ) : null}
        </div>
      ) : null}

      <form className="panel mt-5 space-y-3 rounded-[1.5rem] p-5" onSubmit={(e) => unlock("invite", e)}>
        <h2 className="display text-2xl font-semibold">Invite code (for pilot students)</h2>
        <p className="text-sm text-[var(--ink-soft)]">
          Feedback cohort: use the code we share on WhatsApp.
        </p>
        <input
          className="input"
          placeholder="e.g. PATHLY-STUDENT"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
        />
        <button className="btn btn-accent w-full" disabled={loading}>
          Unlock with invite
        </button>
      </form>

      <form
        className="panel mt-5 space-y-3 rounded-[1.5rem] p-5"
        onSubmit={(e) => unlock("manual_upi", e)}
      >
        <h2 className="display text-2xl font-semibold">Pay ₹{access?.priceInr ?? 500} (UPI)</h2>
        <p className="text-sm text-[var(--ink-soft)]">
          Razorpay will come next. For early users, pay via UPI to the founder and enter the reference /
          UTR here when manual unlock is enabled on the server.
        </p>
        <div className="rounded-xl bg-white/70 px-4 py-3 text-sm">
          <p className="font-semibold">UPI ID (update before launch)</p>
          <p className="text-[var(--ink-soft)]">{process.env.NEXT_PUBLIC_UPI_ID || "yourname@upi"}</p>
          <p className="mt-2 text-[var(--ink-soft)]">Amount: ₹{access?.priceInr ?? 500}</p>
        </div>
        <input
          className="input"
          placeholder="UPI reference / UTR"
          value={upiReference}
          onChange={(e) => setUpiReference(e.target.value)}
        />
        <button className="btn btn-primary w-full" disabled={loading || !manualAllowed}>
          Submit payment reference
        </button>
      </form>

      {error ? <p className="mt-4 text-sm text-[var(--accent-2)]">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-[var(--accent)]">{message}</p> : null}

      <Link href="/dashboard" className="btn btn-ghost mt-6 inline-flex text-sm">
        ← Back to dashboard
      </Link>
    </div>
  );
}
