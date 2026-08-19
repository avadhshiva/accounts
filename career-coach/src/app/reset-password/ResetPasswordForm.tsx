"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PASSWORD_RULES_TEXT } from "@/lib/password";
import { APP_NAME } from "@/lib/brand";
import { PasswordInput } from "@/components/PasswordInput";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) {
      setError("Missing reset token. Use the link from your email.");
      return;
    }
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") || "");
    const confirm = String(fd.get("confirm") || "");
    if (password !== confirm) {
      setLoading(false);
      setError("Passwords do not match.");
      return;
    }
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not reset password");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  if (!token) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
        <div className="panel rounded-[1.75rem] p-6 text-center">
          <p className="text-sm text-[var(--accent-2)]">Invalid reset link.</p>
          <Link href="/forgot-password" className="btn btn-primary mt-4 inline-flex text-sm">
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
      <Link href="/" className="display mb-8 text-2xl font-semibold">
        {APP_NAME}
      </Link>
      <div className="panel rounded-[1.75rem] p-6">
        <h1 className="display text-3xl font-semibold">Set new password</h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">{PASSWORD_RULES_TEXT}</p>
        {done ? (
          <p className="mt-6 text-sm text-[var(--accent)]">
            Password updated. Redirecting to login…
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <PasswordInput
              name="password"
              placeholder="New password"
              autoComplete="new-password"
              minLength={8}
            />
            <PasswordInput
              name="confirm"
              placeholder="Confirm new password"
              autoComplete="new-password"
              minLength={8}
            />
            {error ? <p className="text-sm text-[var(--accent-2)]">{error}</p> : null}
            <button className="btn btn-primary w-full" disabled={loading}>
              {loading ? "Saving..." : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
