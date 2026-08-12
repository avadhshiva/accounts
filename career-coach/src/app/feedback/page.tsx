"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

const SECTIONS = [
  "Home / landing",
  "Dashboard",
  "Resume Studio",
  "Mock Interview",
  "Learn / Roadmap",
  "Aptitude drill",
  "Trial / access",
  "Other",
];

export default function FeedbackPage() {
  const googleForm = process.env.NEXT_PUBLIC_FEEDBACK_FORM_URL || "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [section, setSection] = useState(SECTIONS[0]);
  const [type, setType] = useState<"issue" | "suggestion" | "remark">("suggestion");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(4);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (r) => {
        if (!r.ok) return;
        const data = await r.json();
        setName(data.user?.name || "");
        setEmail(data.user?.email || "");
      })
      .catch(() => undefined);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, section, type, message, rating }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Could not submit. Please try again.");
      return;
    }
    setDone(true);
  }

  return (
    <div className="mx-auto min-h-screen max-w-xl px-5 py-10">
      <Link href="/" className="display text-2xl font-semibold">
        Pathly
      </Link>
      <h1 className="display mt-8 text-4xl font-semibold">Student feedback</h1>
      <p className="mt-3 text-[var(--ink-soft)]">
        Your notes decide what we build next. Be direct — what confused you, what you’d pay for, what felt
        missing.
      </p>

      {googleForm ? (
        <a
          href={googleForm}
          target="_blank"
          rel="noreferrer"
          className="btn btn-accent mt-5 inline-flex"
        >
          Open Google Form ↗
        </a>
      ) : null}

      {done ? (
        <div className="panel mt-6 rounded-[1.5rem] p-6">
          <p className="display text-2xl font-semibold">Thank you</p>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Feedback saved. Go explore more during your trial — or tell a friend to join the pilot.
          </p>
          <Link href="/dashboard" className="btn btn-primary mt-5 inline-flex text-sm">
            Back to dashboard
          </Link>
        </div>
      ) : (
        <form className="panel mt-6 space-y-3 rounded-[1.5rem] p-6" onSubmit={onSubmit}>
          <input
            className="input"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label className="block text-sm font-semibold">Section / screen</label>
          <select className="input" value={section} onChange={(e) => setSection(e.target.value)}>
            {SECTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <label className="block text-sm font-semibold">Type</label>
          <select
            className="input"
            value={type}
            onChange={(e) => setType(e.target.value as "issue" | "suggestion" | "remark")}
          >
            <option value="suggestion">Suggestion</option>
            <option value="issue">Issue / bug</option>
            <option value="remark">General remark</option>
          </select>
          <label className="block text-sm font-semibold">Rating (1–5)</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`h-10 w-10 rounded-full border text-sm font-semibold ${
                  rating === n
                    ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                    : "border-[var(--line)] bg-white"
                }`}
                onClick={() => setRating(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <textarea
            className="input min-h-[140px]"
            placeholder="What should we improve? Which feature felt useful?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            minLength={5}
          />
          {error ? <p className="text-sm text-[var(--accent-2)]">{error}</p> : null}
          <button className="btn btn-accent w-full" disabled={loading}>
            {loading ? "Sending..." : "Submit feedback"}
          </button>
        </form>
      )}

      <Link href="/unlock" className="btn btn-ghost mt-6 inline-flex text-sm">
        ← Trial status
      </Link>
    </div>
  );
}
