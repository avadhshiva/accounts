"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PASSWORD_RULES_TEXT } from "@/lib/password";
import { PasswordInput } from "@/components/PasswordInput";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email"),
        password: fd.get("password"),
        college: fd.get("college"),
        targetRole: fd.get("targetRole"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Signup failed");
      return;
    }
    router.push("/unlock");
    router.refresh();
  }

  return (
    <AuthShell title="Create your Pathly account" subtitle="48-hour pilot trial — explore freely, then share feedback. No payment in this round.">
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="input" name="name" placeholder="Full name" required />
        <input className="input" name="email" type="email" placeholder="Email" required />
        <PasswordInput
          placeholder="Password"
          autoComplete="new-password"
          minLength={8}
        />
        <p className="text-xs text-[var(--ink-soft)]">{PASSWORD_RULES_TEXT}</p>
        <input className="input" name="college" placeholder="College (optional)" />
        <input className="input" name="targetRole" placeholder="Target role e.g. SDE Fresher" defaultValue="SDE Fresher" />
        {error ? <p className="text-sm text-[var(--accent-2)]">{error}</p> : null}
        <button className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Creating..." : "Start free"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-[var(--ink-soft)]">
        Already have an account? <Link href="/login" className="font-semibold text-[var(--accent)]">Log in</Link>
      </p>
    </AuthShell>
  );
}

function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
      <Link href="/" className="display mb-8 text-2xl font-semibold">
        Pathly
      </Link>
      <div className="panel rounded-[1.75rem] p-6 shadow-[0_20px_60px_rgba(15,28,46,0.06)]">
        <h1 className="display text-3xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
