"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShellClient } from "@/components/AppShellClient";

type Analysis = {
  id: string;
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  rewrites: { original: string; improved: string }[];
  keywordsToAdd: string[];
  role: string;
};

export default function ResumePage() {
  const [resumeText, setResumeText] = useState("");
  const [role, setRole] = useState("SDE Fresher");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [provider, setProvider] = useState("");

  async function analyze() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/resume/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText, role }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setAnalysis(data.analysis);
    setProvider(data.provider);
  }

  return (
    <AppShellClient title="Resume Studio">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="panel rounded-[1.5rem] p-5">
          <label className="text-sm font-semibold">Target role</label>
          <input className="input mt-2" value={role} onChange={(e) => setRole(e.target.value)} />
          <label className="mt-4 block text-sm font-semibold">Paste resume text</label>
          <textarea
            className="input mt-2 min-h-[280px] resize-y"
            placeholder="Paste your full resume here..."
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
          />
          {error ? <p className="mt-3 text-sm text-[var(--accent-2)]">{error}</p> : null}
          <button className="btn btn-accent mt-4" onClick={analyze} disabled={loading || resumeText.length < 80}>
            {loading ? "Scoring..." : "Get ATS-style score"}
          </button>
        </div>

        <div className="panel rounded-[1.5rem] p-5">
          {!analysis ? (
            <p className="text-sm text-[var(--ink-soft)]">
              Your score, strengths, gaps, and rewritten bullets will appear here.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[var(--accent)]">Score · provider: {provider}</p>
                <p className="display text-5xl font-semibold">{analysis.score}</p>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">{analysis.summary}</p>
              </div>
              <Block title="Strengths" items={analysis.strengths} />
              <Block title="Gaps" items={analysis.gaps} />
              <div>
                <h3 className="font-semibold">Rewrites</h3>
                <div className="mt-2 space-y-3">
                  {analysis.rewrites.map((r, idx) => (
                    <div key={idx} className="rounded-xl bg-white/70 p-3 text-sm">
                      <p className="opacity-60">Before: {r.original}</p>
                      <p className="mt-2 font-medium">After: {r.improved}</p>
                    </div>
                  ))}
                </div>
              </div>
              <Block title="Keywords to add" items={analysis.keywordsToAdd} />
              <Link href="/dashboard" className="btn btn-primary mt-4 inline-flex text-sm">
                View Placement Mission →
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppShellClient>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--ink-soft)]">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
