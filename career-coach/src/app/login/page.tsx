"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

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
          <input className="input" name="password" type="password" placeholder="Password" required />
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
