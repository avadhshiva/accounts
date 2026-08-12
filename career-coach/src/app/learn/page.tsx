"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShellClient } from "@/components/AppShellClient";
import { TrackRoadmap } from "@/components/TrackRoadmap";
import { TRACKS, totalLessonCount } from "@/lib/content";
import { loadProgress, trackPercent, type LearnProgress } from "@/lib/progress";

export default function LearnPage() {
  const [active, setActive] = useState(TRACKS[0].slug);
  const [progress, setProgress] = useState<LearnProgress>({ completed: [], updatedAt: "" });

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const track = useMemo(
    () => TRACKS.find((t) => t.slug === active) || TRACKS[0],
    [active],
  );

  const overall = useMemo(() => {
    const all = TRACKS.flatMap((t) => t.lessons.map((l) => l.slug));
    return trackPercent(all, progress);
  }, [progress]);

  return (
    <AppShellClient title="Learn · visual roadmaps">
      <p className="max-w-2xl text-[var(--ink-soft)]">
        Click nodes on a path — pictorial concepts, checklists, and quizzes. {totalLessonCount()} lessons
        across GenAI, Technical, and Aptitude.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link href="/practice" className="btn btn-accent text-sm">
          Aptitude drill →
        </Link>
        <span className="rounded-full bg-[var(--sand-2)] px-3 py-1 text-sm font-medium">
          Overall learn progress: {overall}%
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {TRACKS.map((t) => {
          const pct = trackPercent(
            t.lessons.map((l) => l.slug),
            progress,
          );
          const on = t.slug === active;
          return (
            <button
              key={t.slug}
              onClick={() => setActive(t.slug)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                on
                  ? "border-[var(--ink)] bg-[var(--ink)] text-[#f8f4ec]"
                  : "border-[var(--line)] bg-white/70 hover:border-[var(--accent)]"
              }`}
            >
              {t.tag}
              <span className={`ml-2 text-xs ${on ? "text-white/70" : "text-[var(--ink-soft)]"}`}>
                {pct}%
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <TrackRoadmap track={track} progress={progress} />
      </div>

      <p className="mt-4 text-xs text-[var(--ink-soft)]">
        Tip: finish a lesson quiz and hit <strong>Mark complete</strong> to move the path forward. Progress is
        saved in this browser.
      </p>
    </AppShellClient>
  );
}
