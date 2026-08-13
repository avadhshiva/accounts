"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PASSWORD_RULES_TEXT } from "@/lib/password";
import { PasswordInput } from "@/components/PasswordInput";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: fd.get("email"),
        password: fd.get("password"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Login failed");
      return;
    }
    router.push("/unlock");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
      <Link href="/" className="display mb-8 text-2xl font-semibold">
        Pathly
      </Link>
      <div className="panel rounded-[1.75rem] p-6">
        <h1 className="display text-3xl font-semibold">Welcome back</h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">Log in to continue your prep.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input className="input" name="email" type="email" placeholder="Email" required />
          <PasswordInput placeholder="Password" autoComplete="current-password" />
          <div className="text-right">
            <Link href="/forgot-password" className="text-sm font-semibold text-[var(--accent)]">
              Forgot password?
            </Link>
          </div>
          {error ? <p className="text-sm text-[var(--accent-2)]">{error}</p> : null}
          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-[var(--ink-soft)]">
          New here? <Link href="/signup" className="font-semibold text-[var(--accent)]">Create account</Link>
        </p>
      </div>
    </div>
  );
}
