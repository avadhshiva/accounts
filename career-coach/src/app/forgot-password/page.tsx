"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { APP_NAME } from "@/lib/brand";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Request failed");
      return;
    }
    setMessage(data.message || "Check your email for a reset link.");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
      <Link href="/" className="display mb-8 text-2xl font-semibold">
        {APP_NAME}
      </Link>
      <div className="panel rounded-[1.75rem] p-6">
        <h1 className="display text-3xl font-semibold">Forgot password</h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Enter your email and we&apos;ll send a password reset link.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            className="input"
            name="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error ? <p className="text-sm text-[var(--accent-2)]">{error}</p> : null}
          {message ? <p className="text-sm text-[var(--accent)]">{message}</p> : null}
          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-[var(--ink-soft)]">
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-[var(--accent)]">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
